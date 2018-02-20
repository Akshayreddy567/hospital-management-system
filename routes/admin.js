var express = require("express");
var router = express.Router();
var db = require("../models");
var bodyParser = require("body-parser");

// Middlewares
router.use(bodyParser.urlencoded({ extended: true }));

// Routes
router.get('/', async function (req, res) {
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