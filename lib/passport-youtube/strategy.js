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
  this._profileURL = options.profileURL || 'https://graph.facebook.com/me';
  this._profileFields = options.profileFields || null;
}

/**
 * Inherit from `OAuth2Strategy`.
 */
util.inherits(Strategy, OAuth2Strategy);

/**
 * Return extra Facebook-specific parameters to be included in the authorization
 * request.
 *
 * Options:
 *  - `display`  Display mode to render dialog, { `page`, `popup`, `touch` }.
 *
 * @param {Object} options
 * @return {Object}
 * @api protected
 */
Strategy.prototype.authorizationParams = function (options) {
  var params = {},
      display = options.display;

  if (display) {
    params['display'] = display;
  }

  return params;
};

/**
 * Retrieve user profile from Youtube.
 *
 * This function constructs a normalized profile, with the following properties:
 *
 *   - `provider`         always set to `youtube`
 *   - `id`               the user's Facebook ID
 *   - `username`         the user's Facebook username
 *   - `displayName`      the user's full name
 *   - `name.familyName`  the user's last name
 *   - `name.givenName`   the user's first name
 *   - `name.middleName`  the user's middle name
 *   - `gender`           the user's gender: `male` or `female`
 *   - `profileUrl`       the URL of the profile for the user on Facebook
 *   - `emails`           the proxied or contact email address granted by the user
 *
 * @param {String} accessToken
 * @param {Function} done
 * @api protected
 */
Strategy.prototype.userProfile = function(accessToken, done) {
  var url = this._profileURL;
  if (this._profileFields) {
    var fields = this._convertProfileFields(this._profileFields);
    url += (fields !== '' ? '?fields=' + fields : '');
  }

  this._oauth2.getProtectedResource(url, accessToken, function (err, body, res) {
    if (err) { return done(new InternalOAuthError('failed to fetch user profile', err)); }
    
    try {
      var json = JSON.parse(body);
      
      var profile = { provider: 'youtube' };
      profile.id = json.id;
      profile.username = json.username;
      profile.displayName = json.name;
      profile.name = { familyName: json.last_name,
                       givenName: json.first_name,
                       middleName: json.middle_name };

      profile.gender = json.gender;
      profile.profileUrl = json.link;
      profile.emails = [{ value: json.email }];
      
      if (json.picture) {
        if (typeof json.picture == 'object' && json.picture.data) {
          // October 2012 Breaking Changes
          profile.photos = [{ value: json.picture.data.url }];
        } else {
          profile.photos = [{ value: json.picture }];
        }
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
    'name':       ['last_name', 'first_name', 'middle_name'],
    'gender':      'gender',
    'profileUrl':  'link',
    'emails':      'email',
    'photos':      'picture'
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

/**
 * Expose `Strategy`.
 */
module.exports = Strategy;
