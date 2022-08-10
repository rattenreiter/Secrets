// REQUIRES
// ---------------------------------------------------
require('dotenv').config();
const express = require('express');
const ejs = require('ejs');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const GoogleStrategy = require( 'passport-google-oauth20' ).Strategy;
const findOrCreate = require('mongoose-findorcreate');

// SETUP
// ---------------------------------------------------
const app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// Die Reihenfolge ist wichtig!!!
app.use(session({
    secret: process.env.SECRET_STRING,
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

// DB SETUP
// ---------------------------------------------------
mongoose.connect('mongodb://localhost:27017/Secrets_DB');
const userSchema = new mongoose.Schema({
    username: '',
    password: ''
});
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const secretSchema = new mongoose.Schema({
    secret:'',
    submittingUser: {}
});

const User = new mongoose.model('User', userSchema);
const Secret = new mongoose.model('Secret', secretSchema);

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

passport.use(new GoogleStrategy({
    clientID:     process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    passReqToCallback   : true,
  },
  function(request, accessToken, refreshToken, profile, done) {
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return done(err, user);
    });
  }
));

// ROUTES
// ---------------------------------------------------
app.route('/')
    .get((req, res) => {
        res.render('home');
    });

app.get('/auth/google', 
    passport.authenticate('google', { scope: ['profile'] })

);

app.get( '/auth/google/secrets',
    passport.authenticate( 'google', {
        successRedirect: '/secrets',
        failureRedirect: '/login'
}));

app.route('/register')
    .get((req, res) => {
        res.render('register');
    })
    .post((req, res) => {
        User.register({username: req.body.username}, req.body.password, (err, user) => {
            if (err) {
                console.log(err);
                res.redirect('/register');
            } else {
              passport.authenticate('local')(req, res, () => {
                res.redirect('/secrets');
              });  
            }
        });
    });

app.route('/login')
    .get((req, res) => {
        res.render('login', {
            wrongNotice: '',
            userName: ''
        });
    })
    .post((req, res) => {
        const user = new User({
            username: req.body.username,
            password: req.body.password
        });
        req.login(user, (err) => {
            if (err) {
                res.render('/login', {
                    wrongNotice: 'Something went wrong. Try again!',
                    userName: ''
                });
            } else {
                passport.authenticate('local')(req, res, () => {
                    res.redirect('/secrets');
                });
            }
        });
    });

app.route('/secrets')
    .get((req, res) => {
        if (req.isAuthenticated()) {
            Secret.find({}, (err, foundSecrets) => {
                ejsObject = {
                    secrets: foundSecrets
                };
                res.render('secrets', ejsObject);
            });
        } else {
            res.redirect('/login');
        }
    });

app.route('/submit')
    .get((req, res) => {
        if (req.isAuthenticated()) {
            res.render('submit');
        } else {
            res.redirect('/login');
        } 
    })
    .post((req, res) => {
        if (req.body.secret) {
            const newSecret = new Secret({
                secret: req.body.secret,
                submittingUser: req.user
            });
            newSecret.save();
            res.redirect('/secrets');
        } else {
            res.redirect('/submit');
        }
    });

app.route('/logout')
    .get((req, res) => {
        req.logout((err) => {
            if (err) {
                console.log(err);
                res.redirect('/secrets');
            } else {
                res.redirect('/');
            }
        });
    });

// SERVER
// ---------------------------------------------------
app.listen(process.env.PORT || 3000, () => {
    console.log('Server is listening on Port 3000');
});