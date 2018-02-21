var mongoose = require('mongoose');

var userSchema = new mongoose.Schema({
    username: {
        type: String,
        lowercase: true,
        required: [true, "can't be blank"],
        match: [/^[a-zA-Z0-9]+$/, 'is invalid'],
        index: true
    },
    fullname: {
        type: String,
    },
    password: {
        type: String,
        required: true,
    },
    appointments: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Doctor'
    }],
    role: {
        type: String,
        default: 'user'
    }
});

// new Date().toLocaleTimeString();

var User = mongoose.model('User', userSchema);

module.exports = User;