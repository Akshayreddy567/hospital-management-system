var express = require("express");
var route = require("express");
var db = require("../models");
var bodyParser = require("body-parser");
const bcrypt = require('bcrypt');


var mongoose = require('mongoose');
var connectURL = "mongodb://localhost:27017/hospitalmgmt";
mongoose.connect(connectURL);

// Middlewares
router.use(bodyParser.urlencoded({ extended: true }));

// Authentication Helper Function
function requireLoginAndUserRole(req, res, next) {
    if (!req.user) {
        res.redirect('/users');
    } else if (req.session.user && req.session.user.role === 'user') {
        next();
    } else {
        res.send(403);
    }
};

// Router for non-logged/new doctors

router.get('/', function (req, res) {
    if (!req.user) {
        res.render("doctors/homeDoctor");
    } else {
        res.redirect('/doctors/' + req.user.username);
    }
})

router.post('/login', async function (req, res) {
    var error;
    // Load the user profile from the DB, with the username as key
    var doctor = await db.User.findOne({ username: req.body.username });
    // Check if the user exists
    if (!doctor) {
        // If the user doesn't exist, display the login page again
        // with a relevant error message
        error = "The username doesn't exist! Try again.";
        res.render("doctors/homeDoctor", { error });
    } else {
        // Bcrypt checks if the user password matches with the 
        // hashed equivalent stored in the DB
        if (bcrypt.compareSync(req.body.password, user.password)) {
            // set the password to null,
            // so it's not available in the sessions cookie
            user.password = null;
            // Store the user in the session:
            req.session.user = user;
            res.redirect('/doctors/' + user.username);
        } else {
            // If the password doesn't match, display the login page again
            // with a relevant error message
            error = "The password that you've entered is incorrect! Try again.";
            res.render("doctors/homeDoctor", { error });
        }
    }
});

// doctor Logout Route
router.post('/logout', async function (req, res) {
    // https://github.com/jdesboeufs/connect-mongo/issues/140#issuecomment-68108810
    // Delete the session
    // One of the following two lines of code should be working, 
    // but they are not, and not terminating the user session
    // req.session = null;
    // req.session.destroy();

    // So, I eplicitly delete the cookie from the user's browser
    res.clearCookie('connect.sid');
    // And remove the session stored in the 'sessions' collection
    // so I don't pile up useless sessions
    var sessionCollection = await mongoose.connection.db.collection("sessions");
    await sessionCollection.findOneAndDelete({ _id: req.sessionID });
    // Redirect the user to the homepage
    res.redirect('/doctors');
});
