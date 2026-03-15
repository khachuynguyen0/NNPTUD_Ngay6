let jwt = require('jsonwebtoken');

const SECRET_KEY = process.env.JWT_SECRET || 'nnptud-ngay6-secret-key';

function verifyToken(req, res, next) {
    let authHeader = req.headers['authorization'];
    if (!authHeader) {
        return res.status(401).send({ message: "Không có token xác thực" });
    }

    // Token format: "Bearer <token>"
    let token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;

    try {
        let decoded = jwt.verify(token, SECRET_KEY);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).send({ message: "Token không hợp lệ hoặc đã hết hạn" });
    }
}

module.exports = { verifyToken, SECRET_KEY };
