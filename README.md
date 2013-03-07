passport-youtube
================

Youtube strategy for passport



## Install

    $ npm install passport-youtube

## Usage

#### Configure Strategy

The Youtube authentication strategy authenticates users using a youtube
account and OAuth 2.0 tokens.  The strategy requires a `verify` callback, which
accepts these credentials and calls `done` providing a user, as well as
`options` specifying a app ID, app secret, and callback URL.

    passport.use(new YoutubeStrategy({
        clientID: YOUTUBE_APP_ID,
        clientSecret: YOUTUBE_APP_SECRET,
        callbackURL: "http://localhost:3000/auth/youtube/callback"
      },
      function(accessToken, refreshToken, profile, done) {
        User.findOrCreate({ userId: profile.id }, function (err, user) {
          return done(err, user);
        });
      }
    ));
