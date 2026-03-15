let mongoose = require('mongoose');

let productSchema = new mongoose.Schema({
    title: {
        type: String,
        unique: [true, "Tên sản phẩm không được trùng"],
        required: [true, "Tên sản phẩm không được rỗng"]
    },
    slug: {
        type: String,
        unique: [true, "Slug không được trùng"],
        required: [true, "Slug không được rỗng"]
    },
    price: {
        type: Number,
        default: 0,
        min: [0, "Giá không được nhỏ hơn 0"],
    },
    description: {
        type: String,
        default: ""
    },
    images: {
        type: [String],
        default: ["https://i.imgur.com/ZANVnHE.jpeg"]
    },
    category: {
        type: mongoose.Types.ObjectId,
        ref: 'category',
        required: true
    },
    isDeleted: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('product', productSchema);
