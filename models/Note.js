const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const NoteSchema = new Schema({
    // 关联到 User 模型，存储创建此笔记的用户的 ID
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User', // 'User' 必须和 mongoose.model('User', ...) 的第一个参数一致
        required: true
    },
    title: {
        type: String,
        required: [true, 'Title is required'],
        trim: true,
        default: '无标题笔记' // 默认标题
    },
    content: {
        // Tiptap 编辑器通常输出 JSON 格式的内容
        type: Object,
        default: null
    },
    // lastModified 字段将在每次更新时自动刷新，方便前端排序
}, {
    timestamps: true // 自动添加 createdAt 和 updatedAt 字段
});

// Mongoose 的一个特性：每次 'save' 或 'update' 之前，可以更新一个字段
// 但在这里，`timestamps: true` 已经自动处理了 `updatedAt`，效果是一样的。
// 如果需要更复杂的逻辑，可以使用 pre-save hook。

const Note = mongoose.model('Note', NoteSchema);

module.exports = Note;