// REQUIRES
// ---------------------------------------------------
const express = require('express');
const session = require('express-session');
const ejs = require('ejs');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');



// SETUP
// ---------------------------------------------------
const app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));


// DB SETUP
// ---------------------------------------------------
mongoose.connect('mongodb://localhost:27017/Secrets_DB');
const userSchema = new mongoose.Schema({
    email: '',
    password: ''
});
const secretSchema = new mongoose.Schema({
    secret:''
});
const User = new mongoose.model('User', userSchema);
const Secret = new mongoose.model('Secret', secretSchema);

// ROUTES
// ---------------------------------------------------
app.route('/')
    .get((req, res) => {
        res.render('home');
    });

app.route('/register')

app.route('/login')


app.route('/secrets')
    .get((req, res) => {
        Secret.find({}, (err, foundSecrets) => {
            ejsObject = {
                secrets: foundSecrets
            };
            res.render('secrets', ejsObject);
        });
        
    });

app.route('/submit')
    .get((req, res) => {
        res.render('submit');
    })
    .post((req, res) => {
        if (req.body.secret) {
            const newSecret = new Secret({
                secret: req.body.secret
            });
            newSecret.save();
            res.redirect('/secrets');
        } else {
            res.redirect('/submit');
        }
    });

app.route('/logout')
    .get((req, res) => {
        res.redirect('/');
    });

// SERVER
// ---------------------------------------------------
app.listen(process.env.PORT || 3000, () => {
    console.log('Server is listening on Port 3000');
});