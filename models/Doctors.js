var mongoose = require('mongoose');

var doctorSchema = new mongoose.Schema({
    username: {
        type: String,
        lowercase: true,
        required: [true, "can't be blank"],
        match: [/^[a-zA-Z0-9]+$/, 'is invalid'],
        index: true
    },
    password: {
        type: String,
        required: true,
    },
    name: {
        type: String
    },
    designation: {
        type: String,
    },
    // Work on the time format
    timing: { 
        type: Date
    },
    isAvailable: {
        type: Boolean,
        default: false
    },
    isBooked: {
        type: Boolean,
        default: false
    },
    appointments: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    role: {
        type: String,
        default: 'doctor'
    }
});

// new Date().toLocaleTimeString();

var Doctor = mongoose.model('Doctor', doctorSchema);

// Async Unique Validation for `username`
// Resource: http://timstermatic.github.io/blog/2013/08/06/async-unique-validation-with-expressjs-and-mongoose/
Doctor.schema.path('username').validate(async function (value) {
    value = value.toLowerCase();
    console.log('Checking for user: ' + value);
    var doctor = await Doctor.findOne({ username: value });
    if (doctor) {
        return false;
    }
}, 'This username is already taken!');

//hash the password before saving it to the database
doctorSchema.pre('save', function (next) {
    var doctor = this;
    bcrypt.hash(doctor.password, 10, function (err, hash) {
        if (err) {
            return next(err);
        }
        doctor.password = hash;
        next();
    })
});


module.exports = Doctor;