require('dotenv').config()
const db = require("../models");
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const bcrypt = require('bcrypt');

// Sessions Storage
var mongoose = require('mongoose');
// Uncomment the following when running via mLAB
// var connectURL = "mongodb://" + process.env.DB_USER + ":" + process.env.DB_PASS + "@ds237748.mlab.com:37748/ben-hackernews-clone";
// Uncomment the following when running via localhost
var connectURL = "mongodb://localhost:27017/hospitalmgmt";
mongoose.connect(connectURL);
var dbSessions = mongoose.connection;
dbSessions.once('open', function () {
    // Testing the DB connection
    console.log('Connected to DB, for storring sessions!');
});

// U S E R * L O G I N * R E L A T E D
module.exports = function (app) {

    // Session Middleware
    app.use(session({
        secret: '7}~49GCd/)iHMDWJHMIp9k+3J^J8t4B3Uu1g$EqIxo[A6:c|n*D{!Z=*!XnX',
        resave: false,
        saveUninitialized: false,
        store: new MongoStore({
            mongooseConnection: dbSessions
        }),
        unset: 'destroy'
    }));

    // Check for a session, lookup the user in the database 
    // and expose the user’s profile fields as variables for 
    // ejs template:
    app.use(async function (req, res, next) {
        // Check if session exists
        if (req.session && req.session.user) {
            // Detect the type of the user
            if (req.session.user.role === 'user') {
                // Lookup the user in the DB by pulling their username from the session
                var user = await db.User.findOne({ username: req.session.user.username });

            } else if (req.session.user.role === 'doctor') {

                var user = await db.Doctor.findOne({ username: req.session.user.username });

            } else if (req.session.user.role === 'admin') {

                var user = await db.Admin.findOne({ username: req.session.user.username });
            }

            console.log("user object: ");
            console.log(user);
            // set the password to null
            user.password = null;
            if (user) {
                req.user = user;
                req.session.user = user;
                res.locals.user = user;
                // Remove ======================
                // console.log('res.locals: ');
                // console.log(res.locals);

                // console.log('req.user: ');
                // console.log(req.user);
                // console.log('req.user.password: ' + req.user.password);

                // console.log('req.sessions: ');  //\
                // console.log(req.session);      //||
                // Remove =========================
            }
            next();
        } else {
            next();
        }
    });

    // New User Sign Up Routes
    // Present the User Sign Up page
    app.get('/signup', async (req, res) => {
        var error;
        res.render('signUp', { error });
    });
    // Create a new user, when the user submits
    // the user creation form
    app.post('/signup', async (req, res) => {
        var error;
        // confirm that user typed same password twice
        if (req.body.password !== req.body.passwordConfirmation) {
            error = "The passwords don't match. Please try again.";
            res.render('users/signUp', { error });
        }
        // Check if the user has entered a user and password
        if (req.body.username && req.body.password) {
            var userObject = {
                username: req.body.username,
                password: req.body.password
            };
            // Create a new user using userObject
            // in the 'User' collection
            db.User.create(userObject)
                .then(function () {
                    // Redirect the user to homepage upon
                    // successful user creation
                    res.redirect('/');
                }, function (err) {
                    // In case of any validation errors present
                    // the sign up form again with relevant errors
                    error = err;
                    res.render('users/signUp', { error });
                });
        } else {
            // When the user attempts to submit the form with empty
            // values, present the sign up form again with a relevant
            // error message
            error = 'Please enter a username and password';
            res.render('users/signUp', { error });
        }
    });

    // User Login Routes
    // Present the user witht he log in page:
    app.get('/login', async function (req, res) {
        if (req.user) {
            // If the user is already logged in, redirect
            // to the homepage
            res.redirect('/');
        } else {
            // Else, present the user with a login form
            var error;
            res.render('users/login', { error });
        }
    });
    // Log... in... the user:
    app.post('/login', async function (req, res) {
        var error;
        // Load the user profile from the DB, with the username as key
        var user = await db.User.findOne({ username: req.body.username });
        // Check if the user exists
        if (!user) {
            // If the user doesn't exist, display the login page again
            // with a relevant error message
            error = "The username doesn't exist! Try again.";
            res.render('users/login', { error });
        } else {
            // Bcrypt checks if the user password matches with the 
            // hashed equivalent stored in the DB
            if (bcrypt.compareSync(req.body.password, user.password)) {
                // set the password to null,
                // so it's not available in the sessions cookie
                user.password = null;
                // Store the user in the session:
                req.session.user = user;
                res.redirect('/');
            } else {
                // If the password doesn't match, display the login page again
                // with a relevant error message
                error = "The password that you've entered is incorrect! Try again.";
                res.render('users/login', { error });
            }
        }
    });

    // User Logout Route
    app.post('/logout', async function (req, res) {
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
        res.redirect('/');
    });
}