const express = require('express');
const router = express.Router();
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

// Get current user's contacts
router.get('/', authMiddleware, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id).populate('contacts', '-password');
    res.json(currentUser.contacts || []);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Add a contact by shortId (Bidirectional)
router.post('/add', authMiddleware, async (req, res) => {
  try {
    const { contactId } = req.body;
    
    const contactUser = await User.findOne({ shortId: contactId });
    if (!contactUser) {
      return res.status(404).json({ message: "User ID not found" });
    }

    if (String(contactUser._id) === req.user.id) {
      return res.status(400).json({ message: "You cannot add yourself" });
    }

    const currentUser = await User.findById(req.user.id);

    // Add contact to current user
    if (!currentUser.contacts.includes(contactUser._id)) {
      currentUser.contacts.push(contactUser._id);
      await currentUser.save();
    }
    
    // Auto-add current user to the contact's list (Bidirectional)
    if (!contactUser.contacts.includes(currentUser._id)) {
      contactUser.contacts.push(currentUser._id);
      await contactUser.save();
      
      // Emit websocket event to the contactUser if they are online
      const io = req.app.get('io');
      const userSocketMap = req.app.get('userSocketMap');
      const receiverSocketId = userSocketMap?.get(String(contactUser._id));
      if (receiverSocketId && io) {
        io.to(receiverSocketId).emit('contact_added');
      }
    }

    const updatedUser = await User.findById(req.user.id).populate('contacts', '-password');
    res.json(updatedUser.contacts);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Remove a contact by shortId (Bidirectional)
router.post('/remove', authMiddleware, async (req, res) => {
  try {
    const { contactId } = req.body;
    
    const contactUser = await User.findOne({ shortId: contactId });
    if (!contactUser) {
      return res.status(404).json({ message: "User ID not found" });
    }

    const currentUser = await User.findById(req.user.id);

    // Remove contactUser from currentUser's contacts
    currentUser.contacts = currentUser.contacts.filter(
      id => String(id) !== String(contactUser._id)
    );
    await currentUser.save();

    // Remove currentUser from contactUser's contacts
    contactUser.contacts = contactUser.contacts.filter(
      id => String(id) !== String(currentUser._id)
    );
    await contactUser.save();

    // Emit websocket event to the contactUser if they are online
    const io = req.app.get('io');
    const userSocketMap = req.app.get('userSocketMap');
    const receiverSocketId = userSocketMap?.get(String(contactUser._id));
    if (receiverSocketId && io) {
      io.to(receiverSocketId).emit('contact_removed');
    }

    const updatedUser = await User.findById(req.user.id).populate('contacts', '-password');
    res.json(updatedUser.contacts);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
