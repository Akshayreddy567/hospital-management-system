var mongoose = require("mongoose");
mongoose.set('debug', true)

var connectURL = "mongodb://localhost:27017/hospitalmgmt";
mongoose.connect(connectURL);

mongoose.Promise = Promise;

// Combine all the models
module.exports.Doctor = require('./Doctors');