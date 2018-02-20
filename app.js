const express = require('express');
const app = express();
const db = require('./models')
const bodyParser = require("body-parser");

// Middlewares
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.set('view engine', 'ejs');
app.use(express.static(__dirname + "/public"));

// Routes
app.get('/admin', async function (req, res) {
    var doctors = await db.Doctor.find().exec();
    res.render('admin/doctors', {
        doctors: doctors
    });
});

app.post('/admin/checkin/:doctorID', async function (req, res) {
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

app.post('/admin/checkout/:doctorID', async function (req, res) {
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



app.listen(3000);