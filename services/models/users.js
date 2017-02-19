var mongo = require('mongoose');
var Schema = mongo.Schema;

var userSchema = new Schema ({
    firstname: String,
    lastname: String,
    username: String,
    password: String,
    email: String,
    phone: Number,
    vehicle: String,
    license: String,
    year: Number,
    color: String
});

module.exports = mongo.model('user', userSchema);