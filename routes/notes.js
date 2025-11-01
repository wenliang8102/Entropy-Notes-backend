const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth'); // 引入我们的“守卫”中间件
const Note = require('../models/Note');     // 引入 Note 模型

// @route   POST /api/notes
// @desc    Create a new note
// @access  Private (需要登录)
router.post('/', auth, async (req, res) => {
    try {
        const newNote = new Note({
            title: '无标题笔记', // 默认标题
            content: null,       // 默认内容为空
            user: req.user.id    // 从 auth 中间件获取的用户ID
        });

        const note = await newNote.save();
        res.status(201).json(note);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/notes
// @desc    Get all notes for the logged-in user
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        // 查找所有属于该用户的笔记，并按最后更新时间降序排序
        const notes = await Note.find({ user: req.user.id }).sort({ updatedAt: -1 });
        res.json(notes);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/notes/:id
// @desc    Get a single note by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
    try {
        const note = await Note.findById(req.params.id);

        if (!note) {
            return res.status(404).json({ message: 'Note not found' });
        }

        // 权限检查：确保这篇笔记属于当前登录的用户
        if (note.user.toString() !== req.user.id) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        res.json(note);
    } catch (err) {
        console.error(err.message);
        // 如果传入的id格式不正确，Mongoose会抛出CastError
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ message: 'Note not found' });
        }
        res.status(500).send('Server Error');
    }
});


// @route   PUT /api/notes/:id
// @desc    Update a note (with conflict detection)
// @access  Private
router.put('/:id', auth, async (req, res) => {
    const { title, content, lastKnownUpdatedAt } = req.body;

    try {
        let note = await Note.findById(req.params.id);

        if (!note) {
            return res.status(404).json({ message: 'Note not found' });
        }

        // 权限检查
        if (note.user.toString() !== req.user.id) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        // --- 核心：冲突检测逻辑 ---
        // 将数据库中的 updatedAt 时间戳转换为 ISO 字符串进行比较
        const currentDbUpdatedAt = note.updatedAt.toISOString();
        if (lastKnownUpdatedAt && currentDbUpdatedAt !== lastKnownUpdatedAt) {
            // 发生冲突！返回 409 Conflict，并附上服务器上的最新数据
            return res.status(409).json({
                message: 'Conflict: The note has been updated by another source.',
                latestNote: note
            });
        }

        // 没有冲突，执行更新
        if (title !== undefined) note.title = title;
        if (content !== undefined) note.content = content;

        // Mongoose 在 .save() 时会自动更新 updatedAt 时间戳
        const updatedNote = await note.save();
        res.json(updatedNote);

    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ message: 'Note not found' });
        }
        res.status(500).send('Server Error');
    }
});


// @route   DELETE /api/notes/:id
// @desc    Delete a note
// @access  Private
router.delete('/:id', auth, async (req, res) => {
    try {
        const note = await Note.findById(req.params.id);

        if (!note) {
            return res.status(404).json({ message: 'Note not found' });
        }

        // 权限检查
        if (note.user.toString() !== req.user.id) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        await Note.findByIdAndDelete(req.params.id);

        res.json({ message: 'Note removed successfully' });
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ message: 'Note not found' });
        }
        res.status(500).send('Server Error');
    }
});


module.exports = router;