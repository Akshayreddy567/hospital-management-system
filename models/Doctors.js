var mongoose = require('mongoose');

var doctorSchema = new mongoose.Schema({
    name: {
        type: String,
        lowercase: true,
        required: [true, "can't be blank"],
    },
    timing: { 
        type: Date
    },
    isAvailable: {
        type: Boolean,
        default: false
    }
});

// new Date().toLocaleTimeString();

var Doctor = mongoose.model('Doctor', doctorSchema);

module.exports = Doctor;