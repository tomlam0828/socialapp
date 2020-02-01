module.exports = {
    ensureAuth: (req, res, next) => {
        if (req.isAuthenticated()) {
            next();
        } else {
            res.json("You have not signed in yet, please go back to the home page!");
        }
    },

    ensureGuest: (req, res, next) => {
        if (req.isAuthenticated()) {
            res.redirect('/profile');
        } else {
            next();
        }
    }
}