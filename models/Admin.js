var mongoose = require('mongoose');

var adminSchema = new mongoose.Schema({
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
    }
});

// new Date().toLocaleTimeString();

var Admin = mongoose.model('Admin', adminSchema);

module.exports = Admin;