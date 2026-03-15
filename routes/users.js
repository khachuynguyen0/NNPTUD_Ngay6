var express = require('express');
var router = express.Router();
let userModel = require('../schemas/users');
let bcrypt = require('bcryptjs');
let { verifyToken } = require('../middleware/auth');
let { checkRole } = require('../middleware/checkRole');

// READ ALL - Lấy tất cả user chưa bị xóa mềm (yêu cầu đăng nhập + role admin)
// Query params: ?search=keyword&page=1&limit=10
router.get('/', verifyToken, checkRole('admin'), async function (req, res, next) {
    try {
        let { search, page, limit } = req.query;

        let filter = { isDeleted: false };

        // Tìm kiếm theo username, email hoặc fullName
        if (search) {
            filter.$or = [
                { username: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { fullName: { $regex: search, $options: 'i' } }
            ];
        }

        // Phân trang
        let pageNum = Math.max(1, parseInt(page) || 1);
        let limitNum = Math.min(100, Math.max(1, parseInt(limit) || 10));
        let skip = (pageNum - 1) * limitNum;

        let total = await userModel.countDocuments(filter);
        let result = await userModel
            .find(filter)
            .populate('role')
            .select('-password')
            .skip(skip)
            .limit(limitNum)
            .sort({ createdAt: -1 });

        res.send({
            data: result,
            pagination: {
                total,
                page: pageNum,
                limit: limitNum,
                totalPages: Math.ceil(total / limitNum)
            }
        });
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
});

// READ ONE - Lấy 1 user theo ID (yêu cầu đăng nhập)
router.get('/:id', verifyToken, async function (req, res, next) {
    try {
        let result = await userModel
            .findOne({ _id: req.params.id, isDeleted: false })
            .populate('role')
            .select('-password');
        if (result) {
            res.send(result);
        } else {
            res.status(404).send({ message: "User không tồn tại" });
        }
    } catch (error) {
        res.status(404).send({ message: error.message });
    }
});

// CREATE - Tạo user mới (yêu cầu đăng nhập + role admin)
router.post('/', verifyToken, checkRole('admin'), async function (req, res, next) {
    try {
        let hashedPassword = await bcrypt.hash(req.body.password, 10);
        let newUser = new userModel({
            username: req.body.username,
            password: hashedPassword,
            email: req.body.email,
            fullName: req.body.fullName,
            avatarUrl: req.body.avatarUrl,
            status: req.body.status,
            role: req.body.role,
            loginCount: req.body.loginCount
        });
        await newUser.save();
        let userResponse = newUser.toObject();
        delete userResponse.password;
        res.status(201).send(userResponse);
    } catch (error) {
        res.status(400).send({ message: error.message });
    }
});

// UPDATE - Cập nhật user theo ID (yêu cầu đăng nhập + role admin)
router.put('/:id', verifyToken, checkRole('admin'), async function (req, res, next) {
    try {
        if (req.body.password) {
            req.body.password = await bcrypt.hash(req.body.password, 10);
        }
        let updated = await userModel
            .findByIdAndUpdate(req.params.id, req.body, { new: true })
            .select('-password');
        if (updated) {
            res.send(updated);
        } else {
            res.status(404).send({ message: "User không tồn tại" });
        }
    } catch (error) {
        res.status(400).send({ message: error.message });
    }
});

// DELETE - Xóa mềm user theo ID (yêu cầu đăng nhập + role admin)
router.delete('/:id', verifyToken, checkRole('admin'), async function (req, res, next) {
    try {
        let updated = await userModel
            .findByIdAndUpdate(
                req.params.id,
                { isDeleted: true },
                { new: true }
            )
            .select('-password');
        if (updated) {
            res.send({ message: "Đã xóa mềm user", user: updated });
        } else {
            res.status(404).send({ message: "User không tồn tại" });
        }
    } catch (error) {
        res.status(404).send({ message: error.message });
    }
});

// POST /users/enable - Kích hoạt user (yêu cầu đăng nhập + role admin)
router.post('/enable', verifyToken, checkRole('admin'), async function (req, res, next) {
    try {
        let { email, username } = req.body;
        if (!email || !username) {
            return res.status(400).send({ message: "Cần truyền lên email và username" });
        }
        let user = await userModel.findOne({ email, username, isDeleted: false });
        if (!user) {
            return res.status(404).send({ message: "Thông tin email hoặc username không đúng" });
        }
        user.status = true;
        await user.save();
        let userResponse = user.toObject();
        delete userResponse.password;
        res.send({ message: "Đã kích hoạt tài khoản", user: userResponse });
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
});

// POST /users/disable - Vô hiệu hóa user (yêu cầu đăng nhập + role admin)
router.post('/disable', verifyToken, checkRole('admin'), async function (req, res, next) {
    try {
        let { email, username } = req.body;
        if (!email || !username) {
            return res.status(400).send({ message: "Cần truyền lên email và username" });
        }
        let user = await userModel.findOne({ email, username, isDeleted: false });
        if (!user) {
            return res.status(404).send({ message: "Thông tin email hoặc username không đúng" });
        }
        user.status = false;
        await user.save();
        let userResponse = user.toObject();
        delete userResponse.password;
        res.send({ message: "Đã vô hiệu hóa tài khoản", user: userResponse });
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
});

module.exports = router;
