// Load modules
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
const exphbs = require('express-handlebars');
const session = require("express-session");
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');

//load models
const User = require('./models/user');
const Post = require('./models/post');


// connect to MongoURI exported from external file
const keys = require('./config/keys');
// link passport
require('./passport/google-passport');
require('./passport/facebook-passport');
//link helper
const {
    ensureAuth,
    ensureGuest
} = require('./helper/auth');

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
app.get('/', ensureGuest, (req, res) => {
    res.render('home');
});

app.get('/about', (req, res) => {
    res.render('about');
})

// google auth route
app.get('/auth/google', passport.authenticate('google',
    { scope: ['profile', 'email'] }
));

app.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/' }), (req, res) => {
    res.redirect('/profile');
});

//facebook route
app.get('/auth/facebook',
    passport.authenticate('facebook', {
        scope: ['email']
    }));

app.get('/auth/facebook/callback', passport.authenticate('facebook', { failureRedirect: '/' }), (req, res) => {
    res.redirect('/profile');
});

//handle profile route
app.get('/profile', ensureAuth, (req, res) => {
    User.findById({ _id: req.user._id }).then((user) => {
        res.render('profile', {
            user: user
        });
    })
});

//handle route for all users
app.get('/users', ensureAuth, (req, res) => {
    User.find({}).then((users) => {
        res.render('users', {
            users: users
        });
    });
});

//handle email route
app.post('/addEmail', (req, res) => {
    const email = req.body.email;
    User.findById({ _id: req.user._id }).then((user) => {
        user.email = email;
        user.save().then(() => {
            res.redirect('/profile');
        });
    });
});

//handle phone route
app.post('/addPhone', (req, res) => {
    const phone = req.body.phone;
    User.findById({ _id: req.user._id }).then((user) => {
        user.phone = phone;
        user.save().then(() => {
            res.redirect('/profile');
        });
    });
});

//display one user
app.get('/user/:id', (req, res) => {
    User.findById({ _id: req.params.id }).then((user) => {
        res.render('user', {
            user: user
        });
    });
});

//handle location route
app.post('/addLocation', (req, res) => {
    const location = req.body.location;
    User.findById({ _id: req.user._id }).then((user) => {
        user.location = location;
        user.save().then(() => {
            res.redirect('/profile');
        });
    });
});

//handle post route
app.get('/addPost', (req, res) => {
    res.render('addPost');
});

//handle comment route
app.post('/savePost', ensureAuth, (req, res) => {
    var allowComments;
    if (req.body.allowComments) {
        allowComments = true;
    } else {
        allowComments = false;
    }
    const newPost = {
        title: req.body.title,
        body: req.body.body,
        status: req.body.status,
        allowComments: allowComments,
        user: req.user._id
    }
    new Post(newPost).save().then(() => {
        res.redirect('/posts');
    });
});

//handle posts route
app.get('/posts', (req, res) => {
    Post.find({ status: 'public' }).populate('user').sort({ date: 'desc' }).then((posts) => {
        res.render('publicPosts', {
            posts: posts
        });
    });
});

//user logout
app.get('/logout', (req, res) => {
    req.logout();
    res.redirect('/');
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});