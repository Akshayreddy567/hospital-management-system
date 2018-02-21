var express = require("express");
var router = express.Router();
var db = require("../models");
var bodyParser = require("body-parser");

// Middlewares
router.use(bodyParser.urlencoded({ extended: true }));

// Router for non-logged/new users
router.get('/', function (req, res) {
    res.render("users/userHome");
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
                res.render('users/signUp', { error });
            });
    } else {
        // When the user attempts to submit the form with empty
        // values, present the sign up form again with a relevant
        // error message
        error = 'Please enter a username and password';
        res.render('users/signUp', { error });
    }
})


// Users or Patients
router.get('/:username', async function (req, res) {
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
router.post('/:username/book/:doctorID', async function (req, res) {
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
router.post('/:username/cancel/:doctorID', async function (req, res) {
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