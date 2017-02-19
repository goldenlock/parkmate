var mongo = require('mongoose');
var Schema = mongo.Schema;

var reservationSchema = new Schema ({
    username: String,
    lot_id: String,
    start_time: String,
    end_time: String,
    numberOfDays: Number,
    amount_paid: Number
});

module.exports = mongo.model('reservation', reservationSchema);