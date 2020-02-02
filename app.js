// Load modules
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
const keys = require('./config/keys');
const exphbs = require('express-handlebars');
const session = require("express-session");
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
const methodOverride = require('method-override');
const stripe = require('stripe')(keys.StripeSecretKey);

//load models
const User = require('./models/user');
const Post = require('./models/post');

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
app.use(methodOverride('_method'));

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
    Post.find({ user: req.user._id }).populate('user').sort({ date: 'desc' }).then((posts) => {
        res.render('profile', {
            posts: posts
        });
    });
});

//handle comment to db
app.post('/addComment/:id', (req, res) => {
    Post.findOne({ _id: req.params.id }).then((post) => {
        const comment = {
            commentBody: req.body.commentBody,
            commentUser: req.user._id
        }
        post.comments.push(comment);
        post.save().then(() => {
            res.redirect('/posts');
        });
    });
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
    res.render('payment', {
        StripePublishKey: keys.StripePublishKey
    });
    // res.render('addPost');
});

//handle payment route
app.post('/payment', (req, res) => {
    const amount = 199;
    stripe.customers.create({
        email: req.body.stripeEmail,
        source: req.body.stripeToken,
    }).then((customer) => {
        stripe.charges.create({
            amount: amount,
            currency: 'usd',
            description: '$1.99 for a post!',
            customer: customer.id
        }).then((charge) => {
            res.render('success', {
                charge: charge
            });
        });
    });
});

//handle redirect route to display
app.get('/display', (req, res) => {
    res.render('addPost');
})

//handle comment route
app.post('/savePost', (req, res) => {
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

//display single user
app.get('/showposts/:id', (req, res) => {
    Post.find({ user: req.params.id, status: 'public' }).populate('user').sort({ date: 'desc' }).then((posts) => {
        res.render('showUserPosts', {
            posts: posts
        });
    });
});

//handle delete route
app.delete('/:id', (req, res) => {
    Post.remove({ _id: req.params.id }).then(() => {
        res.redirect('/profile');
    });
});

// handle edit route
app.get('/editPost/:id', (req, res) => {
    Post.findOne({ _id: req.params.id }).then((post) => {
        res.render('editingPost', {
            post: post
        });
    });
});

//handle posts route
app.get('/posts', (req, res) => {
    Post.find({ status: 'public' }).populate('user').populate('comments.commentUser').sort({ date: 'desc' }).then((posts) => {
        res.render('publicPosts', {
            posts: posts
        });
    });
});

//handle put route
app.put('/editingPost/:id', (req, res) => {
    Post.findOne({ _id: req.params.id }).then((post) => {
        var allowComments;
        if (req.body.allowComments) {
            allowComments = true;
        } else {
            allowComments = false;
        }
        post.title = req.body.title;
        post.body = req.body.body;
        post.status = req.body.status;
        post.allowComments = allowComments;
        post.save().then(() => {
            res.redirect('/profile');
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