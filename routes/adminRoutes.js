var express = require("express");
var router = express.Router();
var db = require("../models");
var bodyParser = require("body-parser");
const bcrypt = require('bcrypt');

// Sessions Storage | Not Optimal, because I am repeating a connection.
// Will work on an optimal solution later
var mongoose = require('mongoose');
var connectURL = "mongodb://localhost:27017/hospitalmgmt";
mongoose.connect(connectURL);

// Middlewares
router.use(bodyParser.urlencoded({ extended: true }));

// Authentication Helper Function
function requireLoginAndAdminRole(req, res, next) {
    if (!req.user) {
        res.redirect('/admin');
    } else if (req.session.user && req.session.user.role === 'admin') {
        next();
    } else {
        res.send(403);
    }
};

// Routes
// Router for non-logged in admins
router.get('/', function (req, res) {
    if (!req.user) {
        res.render("admin/homeAdmin");
    } else {
        res.redirect('/admin/' + req.user.username);
    }
})


router.post('/login', async function (req, res) {
    var error;
    // Load the admin profile from the DB, with the username as key
    var admin = await db.Admin.findOne({ username: req.body.username });
    // Check if the admin exists
    if (!admin) {
        // If the admin doesn't exist, display the login page again
        // with a relevant error message
        error = "The username doesn't exist! Try again.";
        res.render("admin/homeAdmin", { error });
    } else {
        // Bcrypt checks if the user password matches with the 
        // hashed equivalent stored in the DB
        if (bcrypt.compareSync(req.body.password, admin.password)) {
            // set the password to null,
            // so it's not available in the sessions cookie
            admin.password = null;
            // Store the user in the session:
            req.session.user = admin;
            res.redirect('/admin/' + admin.username);
        } else {
            // If the password doesn't match, display the login page again
            // with a relevant error message
            error = "The password that you've entered is incorrect! Try again.";
            res.render("admin/homeAdmin", { error });
        }
    }
});


// admin Logout Route
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
    res.redirect('/admin');
});


// Logged in admin's dashboard
router.get('/:username', requireLoginAndAdminRole, async function (req, res) {
    var doctors = await db.Doctor.find().exec();
    res.render('admin/doctors', {
        doctors: doctors
    });
});

// Routes for checkig in doctors
// A check-in is when a doctor enters the hospital
router.post('/checkin/:doctorID', requireLoginAndAdminRole, async function (req, res) {
    var doctors = await db.Doctor.findOneAndUpdate(
        { _id: req.params.doctorID },
        {
            $set: {
                timing: new Date(),
                isAvailable: true
            }
        }
    );
    res.redirect('/admin')
});

// Routes for checkig out doctors
// A check-out is when a doctor leaves/exits the hospital
router.post('/checkout/:doctorID', requireLoginAndAdminRole, async function (req, res) {
    var doctors = await db.Doctor.findOneAndUpdate(
        { _id: req.params.doctorID },
        {
            $set: {
                timing: new Date(),
                isAvailable: false
            }
        }
    );
    res.redirect('/admin');
});

router.get('/:username/createDoctor', requireLoginAndAdminRole, function (req, res) {
    res.render('admin/createDoctor');
});

router.post('/:username/createDoctor', requireLoginAndAdminRole, function (req, res) {
    if (req.body.password !== req.body.passwordConfirmation) {
        error = "The passwords don't match. Please try again.";
        res.render("admin/createDoctor", { error });

    } else if (req.body.username && req.body.password) {
        var newDoctorObject = {
            username: req.body.username,
            name: req.body.name,
            designation: req.body.designation,
            email: req.body.email,
            password: req.body.password,
            passwordConfirmation: req.body.passwordConfirmation
        };

        db.Doctor.create(newDoctorObject)
            .then(function () {
                // Redirect the admin to their homepage upon
                // successful onboarding of the doctor
                res.redirect("/admin/" + req.user.username);
            }, function (err) {
                // In case of any validation errors present
                // the sign up form again with relevant errors
                error = err;
                res.render("admin/createDoctor", { error });
            });
    } else {
        // When the user attempts to submit the form with empty
        // values, present the sign up form again with a relevant
        // error message
        error = 'Please enter a username and password';
        res.render("admin/createDoctor", { error });
    }

});

module.exports = router;