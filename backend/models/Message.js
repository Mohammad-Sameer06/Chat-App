const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  content: {
    type: String,
  },
  type: {
    type: String,
    enum: ['text', 'image', 'file', 'audio'],
    default: 'text'
  },
  fileData: {
    type: String
  },
  fileName: {
    type: String
  },
  isRead: {
    type: Boolean,
    default: false,
  }
}, { timestamps: true });

// Create an index for fast retrieval of conversations between two users
MessageSchema.index({ sender: 1, receiver: 1 });

module.exports = mongoose.model('Message', MessageSchema);
