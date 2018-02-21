var db = require("../models");

// admin:admin => standard username and password
var adminObject = {
    username: "admin",
    password: "admin"
};

// Create the admin
db.Admin.create(adminObject);
