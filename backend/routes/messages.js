const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const authMiddleware = require('../middleware/auth');
const mongoose = require('mongoose');

// Get unread message counts aggregated by sender
router.get('/unread', authMiddleware, async (req, res) => {
  try {
    const unreadCounts = await Message.aggregate([
      { 
        $match: { 
          receiver: new mongoose.Types.ObjectId(req.user.id), 
          isRead: false 
        } 
      },
      { 
        $group: { 
          _id: '$sender', 
          count: { $sum: 1 } 
        } 
      }
    ]);

    const result = {};
    unreadCounts.forEach(item => {
      result[item._id] = item.count;
    });

    res.json(result);
  } catch (err) {
    console.error('Error fetching unread:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get conversation with a specific user
router.get('/:userId', authMiddleware, async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const otherUserId = req.params.userId;

    const messages = await Message.find({
      $or: [
        { sender: currentUserId, receiver: otherUserId },
        { sender: otherUserId, receiver: currentUserId }
      ]
    })
    .populate('replyTo')
    .sort({ createdAt: 1 });

    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
