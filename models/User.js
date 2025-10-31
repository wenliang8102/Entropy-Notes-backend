const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'Username is required'],
        unique: true, // 确保用户名是唯一的
        trim: true, // 去除前后空格
        minlength: [3, 'Username must be at least 3 characters long']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters long']
    }
}, {
    timestamps: true // 自动添加 createdAt 和 updatedAt 字段
});

// Mongoose 中间件 (pre-save hook): 在保存用户到数据库之前自动执行
UserSchema.pre('save', async function(next) {
    // 如果密码没有被修改（比如更新用户信息但没改密码），则不执行加密
    if (!this.isModified('password')) {
        return next();
    }

    try {
        // 生成 "salt" (盐)，增加密码破解难度
        const salt = await bcrypt.genSalt(10);
        // 使用 salt 对密码进行哈希处理
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (err) {
        next(err);
    }
});

// 在模型上添加一个实例方法，用于登录时比较密码
UserSchema.methods.comparePassword = async function(candidatePassword) {
    // 使用 bcrypt 比较传入的明文密码和数据库中存储的哈希密码
    return bcrypt.compare(candidatePassword, this.password);
};

// 根据 Schema 创建模型
const User = mongoose.model('User', UserSchema);

module.exports = User;