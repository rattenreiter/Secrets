// REQUIRES
// ---------------------------------------------------
const express = require('express');
const ejs = require('ejs');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');

// SETUP
// ---------------------------------------------------
const app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
const salt_rounds = 10;

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
    .get((req, res) => {
        res.render('register');
    })
    .post((req, res) => {
        bcrypt.hash(req.body.password, salt_rounds, (err, hash) => {
            const newUser = new User({
                email: req.body.username,
                password: hash
            });
            newUser.save((err) => {
                if (err) {
                    console.log(err);
                } else {
                    res.redirect('/secrets');
                }
            });
        });
    });

app.route('/login')
    .get((req, res) => {
        res.render('login',{wrongNotice: '', userName: ''});
    })
    .post((req, res) => {
        User.findOne({email:req.body.username}, (err, foundUser) => {
            if (foundUser) {
               bcrypt.compare(req.body.password, foundUser.password, (err, result) => {
                    if (result === true) {
                        res.redirect('/secrets');
                    } else {
                        res.render('login', {
                            wrongNotice: 'Password incorrect', 
                            userName: req.body.username
                        });
                    }
               })
            } else {
                res.render('login', {
                    wrongNotice: 'Username (EMail) not found',
                    userName: ''
                });
            }
        });
    });

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