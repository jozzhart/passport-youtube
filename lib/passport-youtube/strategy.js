/**
 * Module dependencies.
 */
var util = require('util')
  , OAuth2Strategy = require('passport-oauth').OAuth2Strategy
  , InternalOAuthError = require('passport-oauth').InternalOAuthError;


/**
 * `Strategy` constructor.
 *
 * Youtube authentication strategy authenticates requests using the OAuth 2.0 protocol.
 *
 * @param {Object} options
 * @param {Function} verify
 * @api public
 */
function Strategy(options, verify) {
  options = options || {};
  options.authorizationURL = options.authorizationURL || 'https://accounts.google.com/o/oauth2/auth';
  options.tokenURL = options.tokenURL || 'https://accounts.google.com/o/oauth2/token';
  options.scopeSeparator = options.scopeSeparator || ',';

  OAuth2Strategy.call(this, options, verify);
  this.name = 'youtube';
  this._profileURL = options.profileURL || 'https://gdata.youtube.com/feeds/api/users/default?alt=json';
}

/**
 * Inherit from `OAuth2Strategy`.
 */
util.inherits(Strategy, OAuth2Strategy);

/**
 * Retrieve user profile from Youtube.
 *
 * This function constructs a normalized profile, with the following properties:
 *
 *   - `provider`         always set to `youtube`
 *   - `id`               the user's Google Plus user ID
 *   - `username`         the user's Youtube username
 *   - `displayName`      the user's full name
 *   - `name.familyName`  the user's last name
 *   - `name.givenName`   the user's first name
 *
 * @param {String} accessToken
 * @param {Function} done
 * @api protected
 */
Strategy.prototype.userProfile = function(accessToken, done) {
  var url = this._profileURL;

  this._oauth2.getProtectedResource(url, accessToken, function (err, body, res) {

    if (err) { return done(new InternalOAuthError('failed to fetch user profile', err)); }

    try {
      var json = JSON.parse(body);

      var youtubeProfile = json.entry;

      var profile = { provider: 'youtube' };

      profile.id = (youtubeProfile["yt$googlePlusUserId"]) ? youtubeProfile["yt$googlePlusUserId"]["$t"] : youtubeProfile["yt$username"]["$t"];
      profile.username = youtubeProfile["yt$username"]["$t"];
      profile.displayName = youtubeProfile["title"]["$t"];
      if(youtubeProfile["yt$lastName"] && youtubeProfile["yt$firstName"]) {
        profile.name = { familyName: youtubeProfile["yt$lastName"]["$t"], givenName: youtubeProfile["yt$firstName"]["$t"] };
      } else {
        profile.name = { familyName: "", givenName: youtubeProfile["title"]["$t"]};
      }


      profile._raw = body;
      profile._json = json;

      done(null, profile);
    } catch(e) {
      done(e);
    }
  });
}

Strategy.prototype._convertProfileFields = function(profileFields) {
  var map = {
    'id':          'id',
    'username':    'username',
    'displayName': 'name',
    'name':       ['last_name', 'first_name']
  };

  var fields = [];

  profileFields.forEach(function(f) {
    if (typeof map[f] === 'undefined') return;

    if (Array.isArray(map[f])) {
      Array.prototype.push.apply(fields, map[f]);
    } else {
      fields.push(map[f]);
    }
  });

  return fields.join(',');
}


Strategy.prototype.authorizationParams = function(options) {
  //  test, should be passed through options
  return {
    access_type : 'offline'
  }
}


/**
 * Expose `Strategy`.
 */
module.exports = Strategy;
