var express = require("express");
var router = express.Router();
var db = require("../models");
var bodyParser = require("body-parser");

// Middlewares
router.use(bodyParser.urlencoded({ extended: true }));

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