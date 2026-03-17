let mongoose = require('mongoose');

let inventorySchema = new mongoose.Schema({
    product: {
        type: mongoose.Types.ObjectId,
        ref: 'product',
        required: true,
        unique: true
    },
    stock: {
        type: Number,
        default: 0,
        min: [0, 'stock không được nhỏ hơn 0']
    },
    reserved: {
        type: Number,
        default: 0,
        min: [0, 'reserved không được nhỏ hơn 0']
    },
    soldCount: {
        type: Number,
        default: 0,
        min: [0, 'soldCount không được nhỏ hơn 0']
    }
}, {
    timestamps: true
});

module.exports = new mongoose.model('inventory', inventorySchema);
