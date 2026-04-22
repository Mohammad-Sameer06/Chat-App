const express = require('express');
const router = express.Router();
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

// Update Avatar
router.put('/avatar', authMiddleware, async (req, res) => {
  try {
    const { avatarBase64 } = req.body;
    
    if (!avatarBase64) {
      return res.status(400).json({ message: 'No image provided' });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.avatar = avatarBase64;
    await user.save();

    res.json({ message: 'Avatar updated', avatar: user.avatar });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
