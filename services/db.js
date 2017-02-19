var mongoose = require('mongoose');
var db = mongoose.connect('mongodb://pm:park123@ds157987.mlab.com:57987/parking_management');
module.exports = db;