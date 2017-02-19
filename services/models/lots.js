var mongo = require('mongoose');
var Schema = mongo.Schema;

var lotsSchema = new Schema ({
    lot_name: String,
    lot_area: String,
    lot_capacity: Number,
    lot_available: Number,
    lot_address: String,
    price: Number
});

module.exports = mongo.model('lot', lotsSchema);