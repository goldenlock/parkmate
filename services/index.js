var express = require('express');
var bodyparser = require('body-parser');
var app = express();
var mongo = require('mongoose');
var http = require('request');
var expressjwt = require('express-jwt');
var jwt = require('jsonwebtoken');
var passwordHash = require('password-hash');
var config = require('./config');
var nodemailer = require('nodemailer');
var smtpTransport = require("nodemailer-smtp-transport");

//Connect to DB
mongo.Promise = global.Promise;
mongo.connect('mongodb://parker:park123@ds157987.mlab.com:57987/parking_management');
var db = mongo.connection;
db.on('error', console.error.bind(console, 'connection error'));
db.once('open', function() {
    console.log("Connected to Parking DB.");
});
//Models
var user = require('./models/users');
var lots = require('./models/lots');
var reservation = require('./models/reservations');

//Email Configuration
var emailConfig = nodemailer.createTransport(smtpTransport({
    host : "smtp.gmail.com",
    secureConnection : false,
    port: 587,
    auth : {
        user : "parkmate.noreply@gmail.com",
        pass : "35393539"
    }
}));

var ObjectId = mongo.Schema.Types.ObjectId;

app.use(bodyparser.urlencoded({extended: true}));
app.use(bodyparser.json());
app.set('secret', config.secret);
app.use(expressjwt({ secret: config.secret}).unless({path: ['/services/', '/services/login', '/services/register', '/services/username']}));

var router = express.Router();
app.use('/services', router);

var port = process.env.PORT || 8080;

console.log("Service started on PORT "+port);

router.use(function(req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type, Authorization');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);

    next();
});

router.get('/', function(req, res) {
    res.json({message: 'Hello World!'});
});

/* User Registration */
router.post('/register', function(req, res) {
    var incomingDetails = req.body;
    var firstname = incomingDetails.firstname;
    var lastname = incomingDetails.lastname;
    var username = incomingDetails.username;
    var password = passwordHash.generate(incomingDetails.password);
    var email = incomingDetails.email;
    var phone = incomingDetails.phone;
    var vehicle = incomingDetails.vehicle;
    var year = incomingDetails.year;
    var color = incomingDetails.color;
    var newuser = new user({firstname: firstname, lastname: lastname, username: username, password: password, email: email, phone: phone, vehicle: vehicle, year: year, color: color});

    newuser.save(function(err) {
        if(err) {
            res.status(500).json({"Error" : "Unhandled Exception"});
        } else {

            var mailOptions={
                to : email,
                subject : "User account details for " + username,
                html : "<h1>Thanks for registering on Parkmate</h1><br>Your account details are:<br><b>Username: </b>"+username+"<br><b>Password:</b> "+incomingDetails.password+"<br><br>Thank you."
            };
            console.log(mailOptions);

            emailConfig.sendMail(mailOptions, function(error, response) {
                if(!error)
                    console.log("Email sent");
                else
                    console.log("Error sending email: " + error);
            });
            res.status(200).json({"status": "ok"});
        }
    })
});


/* User login validation */
router.post('/login', function(req, res) {
    var incomingDetails = req.body;
    var username = incomingDetails.username;
    var password = incomingDetails.password;

    user.findOne({
        username: username
    }, function(err, data) {
        if(data) {
            if(passwordHash.verify(password, data.password)) {
                var authToken = jwt.sign({username: username}, config.secret);
                res.setHeader('Content-Type', 'application/json');
                res.status(200).json({'status': 'ok', 'token': authToken, 'username': data.username, 'firstname': data.firstname, 'lastname': data.lastname, 'email': data.email});
            } else {
                res.status(403).json({'status': 'failed!'});
            }

        } else {
            res.status(403).json({'status': 'failed!'});
        }
    })
});

/* Get Lot details */
router.get('/list/:area', function(req, res, next) {
    var incomingRequest = req.params;
    var area = incomingRequest.area;

    lots.findOne({
        lot_area: area
    }, function(err, data) {
        if(!err) {
            res.status(200).json(data);
        } else {
            res.status(404).json({'status' : 'not found'});
        }
    })
});

/* Reserve a parking spot */
router.post('/reserve', function(req, res) {
    var incomingDetails = req.body;
    incomingDetails.start_date = new Date(incomingDetails.start_date);
    incomingDetails.end_date = new Date(incomingDetails.end_date);
    console.log(incomingDetails);

    var reservations = new reservation(incomingDetails);
    reservations.save(function(err, data) {
        if(!err) {

            var mailOptions={
                to : incomingDetails.email,
                subject : "Reservation Confirmation",
                html : "<h1>Thanks for your Reservation.</h1><br><b>Transaction ID#</b>:"+data._id+"<br><b>Amount Paid:</b> $"+incomingDetails.amount_paid+"<br><br>Thank you."
            };
            console.log(mailOptions);

            emailConfig.sendMail(mailOptions, function(error, response) {
                if(!error)
                    console.log("Email sent");
                else
                    console.log("Error sending email: " + error);
            });
            res.status(200).json({"status": "ok", "transaction": reservations._id});
        } else {
            res.status(500).json({"status": "failed"});
        }
    })
});

/* Retrieve user's parking history */
router.post('/history', function(req, res) {
    var incomingDetails = req.body;
    var username = incomingDetails.username;
    console.log("Test"+incomingDetails);0

    reservation.find({
        username: username
    }, function(err, data) {
        if(!err) {
            res.status(200).json(data);
        } else {
            res.status(404).json({"status": "not found"});
        }
    })
})

/* Retrieve parking lots */
router.get('/listing', function(req, res) {

    lots.find({},
    function(err, data) {
       if(!err) {
           res.status(200).json(data);
       }
    });
})

/* Retrieve Confirmation Details */
router.get('/details/:id', function(req, res) {
    var incomingDetails = req.body;

    var lot_name = "";
    var lot_address = "";
    var lot_area = "";

    reservation.findOne({
        id: ObjectId(incomingDetails.id)
    }, function(err, data) {
        if(!err) {
            lots.findOne({
                id: ObjectId(data.lot_id)
            }, function(err, data1){
                if(!err) {
                    lot_name = data1.lot_name;
                    lot_address = data1.lot_address;
                    lot_area = data1.lot_area;
                    data.lot_name = lot_name;
                    data.address = lot_address;
                    data.lot_area = lot_area;
                    res.status(200).json({_id: data.id, lot_id: data.lot_id, amount_paid: data.amount_paid, numOfDays: data.numberOfDays, lot_name: data.lot_name, lot_address:data.address, lot_area: data.lot_area});
                }
            });


        } else {
            res.status(404).json({"status": "not found"});
        }
    })
})

/* Check username availability */
router.post('/username', function(req, res) {
    var incomingDetails = req.body;

    user.findOne({
        username: incomingDetails.id
    }, function(err, data) {
        if(data){
            res.status(200).json({"status": "found"});
        }
        else {
            res.status(200).json({"status": "not found"});
        }

    })

})

/* Cancel Reservation */
router.get('/cancel/:id', function(req, res) {
    var incomingDetails = req.body;
    console.log(incomingDetails);
    reservation.remove({
        _id: ObjectId(incomingDetails.id, 1)
    }, function(err, data) {
        res.status(200).json({"status" : "ok"});
    })
})

app.listen(port);