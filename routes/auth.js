const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User'); // 引入我们之前创建的 User 模型

// --- 用户注册 API ---
// @route   POST /api/auth/register
// @desc    Register a new user
router.post('/register', async (req, res) => {
    // 从请求体中获取用户名和密码
    const { username, password } = req.body;

    // 简单的后端验证
    if (!username || !password) {
        return res.status(400).json({ message: 'Please provide both username and password.' });
    }

    try {
        // 检查用户是否已存在
        let user = await User.findOne({ username });
        if (user) {
            return res.status(400).json({ message: 'User already exists.' });
        }

        // 创建新用户实例
        user = new User({
            username,
            password
        });

        // 保存用户到数据库 (此时 UserSchema 的 pre-save hook 会自动加密密码)
        await user.save();

        res.status(201).json({ message: 'User registered successfully!' });

    } catch (err) {
        // Mongoose 验证错误处理
        if (err.name === 'ValidationError') {
            const messages = Object.values(err.errors).map(val => val.message);
            return res.status(400).json({ message: messages.join(' ') });
        }
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// --- 用户登录 API ---
// @route   POST /api/auth/login
// @desc    Authenticate user and get token
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Please provide both username and password.' });
    }

    try {
        // 查找用户
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials.' });
        }

        // 比较密码 (使用我们在模型中定义的 comparePassword 方法)
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials.' });
        }

        // --- 登录成功，创建并返回 JWT ---
        const payload = {
            user: {
                id: user.id,
                username: user.username
            }
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '7d' }, // Token 有效期，比如 7 天
            (err, token) => {
                if (err) throw err;
                res.json({
                    message: 'Login successful!',
                    token: token
                });
            }
        );

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;