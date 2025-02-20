"use strict";

const GoogleStrategy = require("passport-google-oauth").OAuth2Strategy;
const FacebookStrategy = require("passport-facebook").Strategy;
// const TwitterStrategy = require("passport-twitter").Strategy;
const User = require("../models/user");
const configAuth = require("./auth");

module.exports = function (passport) {
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser((id, done) => {
    User.findById(id)
      .then((user) => done(null, user))
      .catch((err) => done(err));
  });

  // passport.use(
  //   new TwitterStrategy(
  //     {
  //       consumerKey: configAuth.twitterAuth.clientID,
  //       consumerSecret: configAuth.twitterAuth.clientSecret,
  //       callbackURL: configAuth.twitterAuth.callbackURL,
  //     },
  //     (token, tokenSecret, profile, done) => {
  //       process.nextTick(function () {
  //         User.findOne({ "twitter.id": profile.id }, (err, user) => {
  //           if (err) return done(err);
  //           if (user) {
  //             return done(null, user);
  //           } else {
  //             const newUser = new User();
  //             newUser.twitter.id = profile.id;
  //             newUser.tradesProposed = [];
  //             newUser.tradeRequests = [];
  //             newUser.notificationsCount = 0;
  //             newUser.twitter.token = token;
  //             newUser.twitter.username = profile.username;
  //             newUser.name = profile.displayName;
  //             newUser.dp = profile.photos && profile.photos[0].value;
  //             newUser.dp = newUser.dp && newUser.dp.replace("_normal", "");
  //             newUser.address = {
  //               localAddress: "",
  //               pinCode: "",
  //               state: "",
  //               city: "",
  //               country: "",
  //               landmark: "",
  //             };
  //             newUser.items = [];
  //             newUser.phoneNo = "";
  //             newUser.email = "";

  //             newUser.save((err) => {
  //               if (err) throw err;
  //               return done(null, newUser);
  //             });
  //           }
  //         });
  //       });
  //     }
  //   )
  // );

  passport.use(
    new FacebookStrategy(
      {
        clientID: configAuth.facebookAuth.clientID,
        clientSecret: configAuth.facebookAuth.clientSecret,
        callbackURL: configAuth.facebookAuth.callbackURL,
        profileFields: [
          "id",
          "name",
          "picture.type(large)",
          "emails",
          "displayName",
          "about",
          "gender",
        ],
      },
      (token, refreshToken, profile, done) => {
        process.nextTick(function () {
          User.findOne({ "facebook.id": profile.id })
            .then((user) => {
              if (user) {
                return user;
              } else {
                const newUser = new User();
                newUser.facebook.id = profile.id;
                newUser.tradesProposed = [];
                newUser.tradeRequests = [];
                newUser.notificationsCount = 0;
                newUser.facebook.token = token;
                newUser.name = profile.displayName;
                newUser.facebook.email =
                  (profile.emails && profile.emails[0].value) ||
                  "Email not added";
                newUser.dp = profile.photos && profile.photos[0].value;
                newUser.address = {
                  localAddress: "",
                  pinCode: "",
                  state: "",
                  city: "",
                  country: "",
                  landmark: "",
                };
                newUser.items = [];
                newUser.phoneNo = "";
                newUser.email = "";

                return newUser.save();
              }
            })
            .then((user) => done(null, user))
            .catch((err) => {
              if (err) throw err;
            });
        });
      }
    )
  );

  passport.use(
    new GoogleStrategy(
      {
        clientID: configAuth.googleAuth.clientID,
        clientSecret: configAuth.googleAuth.clientSecret,
        callbackURL: configAuth.googleAuth.callbackURL,
      },
      (token, refreshToken, profile, done) => {
        process.nextTick(() => {
          User.findOne({ "google.id": profile.id })
            .exec()
            .then((user) => {
              if (user) {
                return done(null, user);
              } else {
                const newUser = new User();
                newUser.google.id = profile.id;
                newUser.tradesProposed = [];
                newUser.notificationsCount = 0;
                newUser.tradeRequests = [];
                newUser.google.token = token;
                newUser.name = profile.displayName;
                newUser.google.email = profile.emails[0].value; // pull the first email
                newUser.dp = profile.photos && profile.photos[0].value;
                newUser.dp =
                  newUser.dp &&
                  newUser.dp.slice(0, newUser.dp.lastIndexOf("?"));
                newUser.address = {
                  localAddress: "",
                  pinCode: "",
                  state: "",
                  city: "",
                  country: "",
                  landmark: "",
                };
                newUser.items = [];
                newUser.phoneNo = "";
                newUser.email = "";

                return newUser.save();
              }
            })
            .then((newUser) => {
              if (newUser) {
                return done(null, newUser);
              }
            })
            .catch((err) => {
              if (err) return done(err);
            });
        });
      }
    )
  );
};
