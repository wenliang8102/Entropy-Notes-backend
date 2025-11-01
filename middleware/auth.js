const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
    // 从请求头中获取 token
    const token = req.header('x-auth-token');

    // 检查是否存在 token
    if (!token) {
        return res.status(401).json({ message: 'No token, authorization denied' });
    }

    try {
        // 验证 token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // 将解码后的用户信息（包含 user.id）附加到请求对象上
        // 这样，后续的路由处理函数就能访问到 req.user
        req.user = decoded.user;
        next(); // token有效，放行请求
    } catch (err) {
        res.status(401).json({ message: 'Token is not valid' });
    }
};