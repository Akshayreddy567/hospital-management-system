var mongoose = require('mongoose');
const bcrypt = require('bcrypt');

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
    },
    role: {
        type: String,
        default: 'admin'
    }
});

// new Date().toLocaleTimeString();

//hash the password before saving it to the database
adminSchema.pre('save', function (next) {
    var admin = this;
    bcrypt.hash(admin.password, 10, function (err, hash) {
        if (err) {
            return next(err);
        }
        admin.password = hash;
        next();
    })
});

var Admin = mongoose.model('Admin', adminSchema);

module.exports = Admin;