let mongoose = require('mongoose');

let categorySchema = new mongoose.Schema({
    name: {
        type: String,
        unique: [true, "Tên danh mục không được trùng"],
        required: [true, "Tên danh mục không được rỗng"]
    },
    slug: {
        type: String,
        unique: [true, "Slug không được trùng"],
        required: [true, "Slug không được rỗng"]
    },
    description: {
        type: String,
        default: ""
    },
    image: {
        type: String,
        default: "https://i.imgur.com/ZANVnHE.jpeg"
    },
    isDeleted: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('category', categorySchema);
