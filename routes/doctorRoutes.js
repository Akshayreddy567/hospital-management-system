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
function requireLoginAndDoctorRole(req, res, next) {
    if (!req.user) {
        res.redirect('/doctors');
    } else if (req.session.user && req.session.user.role === 'doctor') {
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

// Route handler a doctor's homepage
router.get('/:username', requireLoginAndDoctorRole, async function (req, res) {
    var doctor = await db.Doctor.findOne({ username: req.params.username })
        .populate('appointments')
        .exec();
    // res.json(doctor);
    res.render('doctors/dashboard', { doctor });
});

// Route handler for 'completing' appointments 
router.post('/done/:user_id', async function (req, res) {
    // Update the Doctor model
    var doctor = await db.Doctor.findOneAndUpdate(
        { username: req.user.username },
        {
            $pull: { appointments: req.params.user_id },
            isBooked: false
        }
    );

    // Update the User model
    var patient = await db.User.findOneAndUpdate(
        { _id: req.params.user_id },
        {
            $pull: { appointments: doctor._id },
        }
    );
    
    res.redirect('/doctors/' + req.user.username);
})

router.get('/test/getTimeSlots', requireLoginAndDoctorRole, async function (req, res) {
    var timeSlots = await db.Doctor
        .findOne({ username: req.user.username }, {"time_slot": 1})
        .populate({
            path: '_08AM_10AM',
            populate: {
                path: 'user_id',
                model: 'User'
            }
        });
    // res.render('doctors/showTimeSlots', { timeSlots: timeSlots.time_slot });
    res.json(timeSlots);
})


















// LOGIN | LOGOUT | ROUTE HANDLERS
router.post('/login', async function (req, res) {
    var error;
    // Load the user profile from the DB, with the username as key
    var doctor = await db.Doctor.findOne({ username: req.body.username });
    // Check if the user exists
    if (!doctor) {
        // If the user doesn't exist, display the login page again
        // with a relevant error message
        error = "The username doesn't exist! Try again.";
        res.render("doctors/homeDoctor", { error });
    } else {
        // Bcrypt checks if the user password matches with the 
        // hashed equivalent stored in the DB
        if (bcrypt.compareSync(req.body.password, doctor.password)) {
            // set the password to null,
            // so it's not available in the sessions cookie
            doctor.password = null;
            // Store the user in the session:
            req.session.user = doctor;
            res.redirect('/doctors/' + doctor.username);
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

module.exports = router