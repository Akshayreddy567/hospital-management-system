var express = require("express");
var router = express.Router();
var db = require("../models");
var bodyParser = require("body-parser");
const bcrypt = require('bcrypt');

// Sessions Storage | Not Optimal, because I am repeating a connection.
// Will work on an optimal solution later
var mongoose = require('mongoose');
var connectURL = "mongodb://" + process.env.DB_USER + ":" + process.env.DB_PASS + "@ds245478.mlab.com:45478/hospitalmgmt";
// var connectURL = "mongodb://localhost:27017/hospitalmgmt";
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

// Router for non-logged/new users
router.get('/', function (req, res) {
    if (!req.user) {
        res.render("users/userHome");
    } else {
        res.redirect('/users/' + req.user.username);
    }
})

// 
router.post('/signup', function (req, res) {
    var error;
    // confirm that user typed same password twice
    console.log("password: ", req.body.password);
    console.log("passwordConfirmation: ", req.body.passwordConfirmation);
    if (req.body.password !== req.body.passwordConfirmation) {
        error = "The passwords don't match. Please try again.";
        res.render("users/userHome", { error });

    } else if (req.body.username && req.body.password) {
        // Check if the user has entered a user and password        
        var userObject = {
            username: req.body.username,
            fullname: req.body.fullname,
            email: req.body.email,
            password: req.body.password
        };
        // Create a new user using userObject
        // in the 'User' collection
        db.User.create(userObject)
            .then(function () {
                // Redirect the user to homepage upon
                // successful user creation
                res.render("users/userHome", { error });
            }, function (err) {
                // In case of any validation errors present
                // the sign up form again with relevant errors
                error = err;
                res.render("users/userHome", { error });
            });
    } else {
        // When the user attempts to submit the form with empty
        // values, present the sign up form again with a relevant
        // error message
        error = 'Please enter a username and password';
        res.render("users/userHome", { error });
    }
})

router.post('/login', async function (req, res) {
    var error;
    // Load the user profile from the DB, with the username as key
    var user = await db.User.findOne({ username: req.body.username });
    // Check if the user exists
    if (!user) {
        // If the user doesn't exist, display the login page again
        // with a relevant error message
        error = "The username doesn't exist! Try again.";
        res.render("users/userHome", { error });
    } else {
        // Bcrypt checks if the user password matches with the 
        // hashed equivalent stored in the DB
        if (bcrypt.compareSync(req.body.password, user.password)) {
            // set the password to null,
            // so it's not available in the sessions cookie
            user.password = null;
            // Store the user in the session:
            req.session.user = user;
            res.redirect('/users/' + user.username);
        } else {
            // If the password doesn't match, display the login page again
            // with a relevant error message
            error = "The password that you've entered is incorrect! Try again.";
            res.render("users/userHome", { error });
        }
    }
});

// User Logout Route
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
    res.redirect('/users');
});

// Users or Patients
router.get('/:username', requireLoginAndUserRole, async function (req, res) {
    res.locals.patientName = req.params.username
    var availableDoctors = await db.Doctor
        .find({
            $and: [
                { isAvailable: true },
                { isBooked: false }
            ]
        })
        .exec();
    var userAppointments = await db.User.find({ username: req.params.username }, { appointments: 1 })
        .populate('appointments')
        .exec();

    console.log("userAppointments: ");
    console.log(typeof userAppointments);

    res.render('users/doctors', {
        doctors: availableDoctors,
        userAppointments: userAppointments
    });
});

// Route to make an appointment with one doctor
router.post('/:username/book/:doctorID', requireLoginAndUserRole, async function (req, res) {
    // Update the User model
    var patient = await db.User.findOneAndUpdate(
        { username: req.params.username },
        {
            $addToSet: { appointments: req.params.doctorID },
        }
    );
    console.log(patient);

    // Update the Doctor model
    var doctor = await db.Doctor.findOneAndUpdate(
        { _id: req.params.doctorID },
        {
            $addToSet: { appointments: patient._id },
            isBooked: true
        }
    );
    console.log(doctor);

    res.redirect('/users/' + req.params.username)
});

// Route to cancel an appointment with one doctor
router.post('/:username/cancel/:doctorID', requireLoginAndUserRole, async function (req, res) {
    // Update the User model
    var patient = await db.User.findOneAndUpdate(
        { username: req.params.username },
        {
            $pull: { appointments: req.params.doctorID },
        }
    );
    console.log(patient);

    // Update the Doctor model
    var doctor = await db.Doctor.findOneAndUpdate(
        { _id: req.params.doctorID },
        {
            $pull: { appointments: patient._id },
            isBooked: false
        }
    );
    console.log(doctor);

    res.redirect('/users/' + req.params.username)
});

module.exports = router;