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
var connectURL = "mongodb://" + process.env.DB_USER + ":" + process.env.DB_PASS + "@ds245478.mlab.com:45478/hospitalmgmt";
// var connectURL = "mongodb://localhost:27017/hospitalmgmt";
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
            }
            next();
        } else {
            next();
        }
    });
}