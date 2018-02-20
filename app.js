const express = require('express');
const app = express();
const db = require('./models')
const bodyParser = require("body-parser");

// Middlewares
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.set('view engine', 'ejs');
app.use(express.static(__dirname + "/public"));

// Import all routes
const adminRoutes = require('./routes/admin');

// Assign the above routes to route paths
app.use('/admin', adminRoutes);


app.listen(3000);