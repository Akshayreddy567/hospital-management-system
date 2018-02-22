var mongoose = require("mongoose");
mongoose.set('debug', true)

// var connectURL = "mongodb://localhost:27017/hospitalmgmt";
// Uncomment the following when running via mLAB
var connectURL = "mongodb://" + process.env.DB_USER + ":" + process.env.DB_PASS + "@ds245478.mlab.com:45478/hospitalmgmt";
mongodb://<dbuser>:<dbpassword>@ds245478.mlab.com:45478/hospitalmgmt
mongoose.connect(connectURL);

mongoose.Promise = Promise;

// Combine all the models
module.exports.Doctor = require('./Doctors');
module.exports.User = require('./Users');
module.exports.Admin = require('./Admin');