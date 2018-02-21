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
function requireLoginAndUserRole(req, res, next) {
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
            req.session.user = user;
            res.redirect('/admin/' + admin.username);
        } else {
            // If the password doesn't match, display the login page again
            // with a relevant error message
            error = "The password that you've entered is incorrect! Try again.";
            res.render("admin/homeAdmin", { error });
        }
    }
});

// Logged in admin's dashboard
router.get('/:username', async function (req, res) {
    var doctors = await db.Doctor.find().exec();
    res.render('admin/doctors', {
        doctors: doctors
    });
});

router.post('/checkin/:doctorID', async function (req, res) {
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

router.post('/checkout/:doctorID', async function (req, res) {
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

module.exports = router;