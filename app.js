// Load modules
const express = require('express');
const app = express();
const port = process.env.PORT ||  3000;
const exphbs = require('express-handlebars');

// connect to MongoURI exported from external file
const keys = require('./config/keys');
const mongoose = require('mongoose');

// connect to database
mongoose.connect(keys.MongoURI, {
    useNewUrlParser: true
}).then(() => {
    console.log('Connected to database.....');
}).catch((err) => {
    console.log(err);
})

// setup template engine
app.engine('handlebars', exphbs({
    defaultLayout: 'main'
}));

app.set('view engine', 'handlebars');

// setup static file to serve css
app.use(express.static('public'));

app.get('/', (req, res) => {
    res.render('home');
});

app.get('/about', (req, res) => {
    res.render('about');
})

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
})