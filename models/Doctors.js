var mongoose = require('mongoose');

var doctorSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "can't be blank"],
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

module.exports = Doctor;