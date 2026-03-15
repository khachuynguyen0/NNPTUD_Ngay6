let mongoose = require('mongoose');

let roleSchema = new mongoose.Schema({
    name: {
        type: String,
        unique: [true, "Tên role không được trùng"],
        required: [true, "Tên role không được rỗng"]
    },
    description: {
        type: String,
        default: ""
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('role', roleSchema);
