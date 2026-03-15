var express = require('express');
var router = express.Router();
let userModel = require('../schemas/users');
let bcrypt = require('bcryptjs');
let jwt = require('jsonwebtoken');
let { verifyToken, SECRET_KEY } = require('../middleware/auth');

// POST /api/v1/auth/register - Đăng ký tài khoản mới
router.post('/register', async function (req, res, next) {
    try {
        let { username, password, email, fullName, avatarUrl, role } = req.body;

        if (!username || !password || !email) {
            return res.status(400).send({ message: "username, password và email là bắt buộc" });
        }

        // Kiểm tra username hoặc email đã tồn tại chưa
        let existingUser = await userModel.findOne({
            $or: [{ username }, { email }],
            isDeleted: false
        });
        if (existingUser) {
            return res.status(400).send({ message: "Username hoặc email đã tồn tại" });
        }

        // Mã hóa mật khẩu
        let hashedPassword = await bcrypt.hash(password, 10);

        let newUser = new userModel({
            username,
            password: hashedPassword,
            email,
            fullName: fullName || "",
            avatarUrl: avatarUrl || "https://i.sstatic.net/l60Hf.png",
            role: role || undefined
        });
        await newUser.save();

        // Không trả về password trong response
        let userResponse = newUser.toObject();
        delete userResponse.password;

        res.status(201).send({ message: "Đăng ký thành công", user: userResponse });
    } catch (error) {
        res.status(400).send({ message: error.message });
    }
});

// POST /api/v1/auth/login - Đăng nhập và nhận JWT token
router.post('/login', async function (req, res, next) {
    try {
        let { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).send({ message: "username và password là bắt buộc" });
        }

        // Tìm user theo username (chưa bị xóa mềm)
        let user = await userModel.findOne({ username, isDeleted: false }).populate('role');
        if (!user) {
            return res.status(401).send({ message: "Tên đăng nhập hoặc mật khẩu không đúng" });
        }

        // So sánh mật khẩu trước
        let isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).send({ message: "Tên đăng nhập hoặc mật khẩu không đúng" });
        }

        // Kiểm tra tài khoản có bị vô hiệu hóa không
        if (!user.status) {
            return res.status(403).send({ message: "Tài khoản chưa được kích hoạt hoặc đã bị vô hiệu hóa" });
        }

        // Tăng loginCount
        user.loginCount += 1;
        await user.save();

        // Tạo JWT token
        let payload = {
            _id: user._id,
            username: user.username,
            email: user.email,
            role: user.role
        };
        let token = jwt.sign(payload, SECRET_KEY, { expiresIn: '1d' });

        res.send({
            message: "Đăng nhập thành công",
            token,
            user: {
                _id: user._id,
                username: user.username,
                email: user.email,
                fullName: user.fullName,
                avatarUrl: user.avatarUrl,
                role: user.role,
                loginCount: user.loginCount
            }
        });
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
});

// POST /api/v1/auth/change-password - Đổi mật khẩu (yêu cầu đăng nhập)
router.post('/change-password', verifyToken, async function (req, res, next) {
    try {
        let { oldPassword, newPassword } = req.body;

        if (!oldPassword || !newPassword) {
            return res.status(400).send({ message: "oldPassword và newPassword là bắt buộc" });
        }

        let user = await userModel.findOne({ _id: req.user._id, isDeleted: false });
        if (!user) {
            return res.status(404).send({ message: "Người dùng không tồn tại" });
        }

        // Kiểm tra mật khẩu cũ
        let isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) {
            return res.status(401).send({ message: "Mật khẩu cũ không đúng" });
        }

        // Mã hóa mật khẩu mới
        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();

        res.send({ message: "Đổi mật khẩu thành công" });
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
});

// GET /api/v1/auth/profile - Lấy thông tin cá nhân của người dùng đang đăng nhập
router.get('/profile', verifyToken, async function (req, res, next) {
    try {
        let user = await userModel
            .findOne({ _id: req.user._id, isDeleted: false })
            .populate('role')
            .select('-password');
        if (!user) {
            return res.status(404).send({ message: "Người dùng không tồn tại" });
        }
        res.send(user);
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
});

// POST /api/v1/auth/logout - Đăng xuất (client xóa token phía client)
router.post('/logout', verifyToken, function (req, res, next) {
    res.send({ message: "Đăng xuất thành công. Vui lòng xóa token phía client" });
});

module.exports = router;
