const express = require('express');
const app = express();
const db = require('./models')
const bodyParser = require("body-parser");

// Middlewares
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.set('view engine', 'ejs');
app.use(express.static(__dirname + "/public"));

// For testing, sending a formatted response to the browser
app.set('json spaces', 2)

// Import all routes
const adminRoutes = require('./routes/admin');

// Assign the above routes to route paths
app.use('/admin', adminRoutes);

// Users or Patients
app.get('/users/:username', async function (req, res) {
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
app.post('/users/:username/book/:doctorID', async function (req, res) {
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
app.post('/users/:username/cancel/:doctorID', async function (req, res) {
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

app.get('/test', async function (req, res) {
    var availableDoctors = await db.Doctor
        .find({
            $and: [
                { isAvailable: true },
                { isBooked: false }
            ]
        })
        .exec();
        // console.log(availableDoctors);
        res.json(availableDoctors)
})

app.listen(3000);