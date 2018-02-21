const express = require('express');
const app = express();
const db = require('./models')
const bodyParser = require("body-parser");

// Middlewares
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.set('view engine', 'ejs');
app.use(express.static(__dirname + "/public"));

// For testing, sending a formatted response to the browser
app.set('json spaces', 2)

// Import all routes
const adminRoutes = require('./routes/adminRoutes');
const userRoutes = require('./routes/userRoutes');
// USER * SIGN  UP * and * LOGIN * MAGIC
require('./routes/loginRoutes')(app)

// Assign the above routes to route paths
app.use('/admin', adminRoutes);
app.use('/users', userRoutes);


app.get('/test', async function (req, res) {
    var availableDoctors = await db.Doctor
        .find({
            $and: [
                { isAvailable: true },
                { isBooked: false }
            ]
        })
        .exec();
        // console.log(availableDoctors);
        res.json(availableDoctors)
})

app.get('/' , function(req ,res){
    res.render("home.ejs");
})

app.listen(3000);