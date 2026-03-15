let roleModel = require('../schemas/roles');

// Middleware kiểm tra quyền theo tên role
// Sử dụng: checkRole('admin') hoặc checkRole('admin', 'moderator')
function checkRole(...allowedRoles) {
    return async function (req, res, next) {
        try {
            // Yêu cầu đã đăng nhập (verifyToken phải chạy trước)
            if (!req.user) {
                return res.status(401).send({ message: "Chưa xác thực. Vui lòng đăng nhập" });
            }

            // Lấy thông tin role từ token
            let userRole = req.user.role;

            if (!userRole) {
                return res.status(403).send({ message: "Tài khoản chưa được gán role" });
            }

            // userRole có thể là object (populated) hoặc ObjectId string
            let roleName;
            if (typeof userRole === 'object' && userRole.name) {
                roleName = userRole.name;
            } else {
                // Tra cứu tên role từ DB nếu chỉ có ID
                let roleDoc = await roleModel.findById(userRole);
                if (!roleDoc) {
                    return res.status(403).send({ message: "Role không hợp lệ" });
                }
                roleName = roleDoc.name;
            }

            if (!allowedRoles.includes(roleName)) {
                return res.status(403).send({
                    message: `Không có quyền truy cập. Yêu cầu role: ${allowedRoles.join(', ')}`
                });
            }

            next();
        } catch (error) {
            res.status(500).send({ message: error.message });
        }
    };
}

module.exports = { checkRole };
