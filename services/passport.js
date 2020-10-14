const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const key = require('../config/key');

const mongoose = require('mongoose');

const User = mongoose.model('users');



passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser((id, done) => {
    User.findById(id)
        .then(user => {
            done(null, user);
        });
});

passport.use(
    new GoogleStrategy({
        clientID: key.googleClientID,
        clientSecret: key.googleClientSecret,
        callbackURL: '/auth/google/callback'
    }, async (accessToken, refreshToken, profile, done) =>{
        const existingUser = await User.findOne({googleId: profile.id});
        if (existingUser) {
            // we already have a profile for this user
            console.log('already have this user');
            return done(null, existingUser);
        }

        // we dont have a profile before
        const user = await new User({
            googleId: profile.id
        }).save();
        done(null, user)
    })
);