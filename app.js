// Load modules
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
const exphbs = require('express-handlebars');
const session = require("express-session");
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
const User = require('./models/user');

// connect to MongoURI exported from external file
const keys = require('./config/keys');
require('./passport/google-passport');
const mongoose = require('mongoose');
const passport = require('passport');
// express config
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(session({
    secret: 'keyboard cat',
    resave: true,
    saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());

// connect to database
mongoose.connect(keys.MongoURI, {
    useNewUrlParser: true
}).then(() => {
    console.log('Connected to database.....');
}).catch((err) => {
    console.log(err);
})

app.use((req, res, next) => {
    res.locals.user = req.user || null;
    next();
})

// setup template engine
app.engine('handlebars', exphbs({
    defaultLayout: 'main'
}));

app.set('view engine', 'handlebars');

// setup static file to serve css
app.use(express.static('public'));

// handle routes
app.get('/', (req, res) => {
    res.render('home');
});

app.get('/about', (req, res) => {
    res.render('about');
})

// google auth route
app.get('/auth/google',
    passport.authenticate('google', {
        scope:
            ['profile', 'email']
    }
    ));

app.get('/auth/google/callback',
    passport.authenticate('google', {
        failureRedirect: '/'
    }),
    (req, res) => {
        res.redirect('/profile');
    });

app.get('/profile', (req, res) => {
    User.findById({ _id: req.user._id }).then((user) => {
        res.render('profile', {
            user: user
        });
    })
});

//user logout
app.get('/logout', (req, res) => {
    req.logout();
    res.redirect('/');
})

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
})