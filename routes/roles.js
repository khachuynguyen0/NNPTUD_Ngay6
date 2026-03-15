var express = require('express');
var router = express.Router();
let roleModel = require('../schemas/roles');
let userModel = require('../schemas/users');
let { verifyToken } = require('../middleware/auth');
let { checkRole } = require('../middleware/checkRole');

// READ ALL - Lấy tất cả role
router.get('/', async function (req, res, next) {
    try {
        let result = await roleModel.find();
        res.send(result);
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
});

// READ ONE - Lấy 1 role theo ID
router.get('/:id', async function (req, res, next) {
    try {
        let result = await roleModel.findById(req.params.id);
        if (result) {
            res.send(result);
        } else {
            res.status(404).send({ message: "Role không tồn tại" });
        }
    } catch (error) {
        res.status(404).send({ message: error.message });
    }
});

// GET /roles/:id/users - Lấy tất cả user có role là :id
router.get('/:id/users', async function (req, res, next) {
    try {
        let roleId = req.params.id;
        let role = await roleModel.findById(roleId);
        if (!role) {
            return res.status(404).send({ message: "Role không tồn tại" });
        }
        let users = await userModel
            .find({ role: roleId, isDeleted: false })
            .populate('role')
            .select('-password');
        res.send(users);
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
});

// CREATE - Tạo role mới (yêu cầu đăng nhập + role admin)
router.post('/', verifyToken, checkRole('admin'), async function (req, res, next) {
    try {
        let newRole = new roleModel({
            name: req.body.name,
            description: req.body.description
        });
        await newRole.save();
        res.status(201).send(newRole);
    } catch (error) {
        res.status(400).send({ message: error.message });
    }
});

// UPDATE - Cập nhật role theo ID (yêu cầu đăng nhập + role admin)
router.put('/:id', verifyToken, checkRole('admin'), async function (req, res, next) {
    try {
        let updated = await roleModel.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (updated) {
            res.send(updated);
        } else {
            res.status(404).send({ message: "Role không tồn tại" });
        }
    } catch (error) {
        res.status(400).send({ message: error.message });
    }
});

// DELETE - Xóa role theo ID (yêu cầu đăng nhập + role admin)
router.delete('/:id', verifyToken, checkRole('admin'), async function (req, res, next) {
    try {
        let deleted = await roleModel.findByIdAndDelete(req.params.id);
        if (deleted) {
            res.send({ message: "Đã xóa role", role: deleted });
        } else {
            res.status(404).send({ message: "Role không tồn tại" });
        }
    } catch (error) {
        res.status(404).send({ message: error.message });
    }
});

module.exports = router;
