const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const { Server } = require('socket.io');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const Message = require('./models/Message');
const User = require('./models/User');

const app = express();
const server = http.createServer(app);

// Keep track of connected users: userId -> socket.id
const userSocketMap = new Map();

const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173', // Vite default dev server
    methods: ['GET', 'POST'],
    credentials: true,
  }
});

// Bind to app for access in routes
app.set('io', io);
app.set('userSocketMap', userSocketMap);

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/chatapp')
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log(err));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/profile', require('./routes/profile'));

// Socket.io Middleware for Auth
io.use((socket, next) => {
  try {
    const cookieHeader = socket.handshake.headers.cookie;
    if (!cookieHeader) {
      return next(new Error('Authentication error: No cookies'));
    }
    
    // Parse cookies manually
    const cookies = cookieHeader.split('; ').reduce((acc, row) => {
      const [key, value] = row.split('=');
      acc[key] = value;
      return acc;
    }, {});
    
    const token = cookies.token;
    if (!token) {
      return next(new Error('Authentication error: No token'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    socket.user = decoded;
    next();
  } catch (error) {
    next(new Error('Authentication error: Invalid Token'));
  }
});

// Socket.io Events
io.on('connection', async (socket) => {
  const userId = String(socket.user.id);
  userSocketMap.set(userId, socket.id);
  
  // Mark user as online
  await User.findByIdAndUpdate(userId, { isOnline: true });
  io.emit('update_status', { userId, isOnline: true });

  console.log(`User ${userId} connected with socket ${socket.id}`);

  // Handle incoming messages
  socket.on('send_message', async (payload) => {
    const { receiverId, content } = payload;
    
    try {
      // Save to database
      const message = new Message({
        sender: userId,
        receiver: receiverId,
        content
      });
      await message.save();

      const populatedMessage = await Message.findById(message._id).populate('sender', 'username avatar');

      // Check if receiver is online
      const receiverSocketId = userSocketMap.get(String(receiverId));
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('receive_message', populatedMessage);
      }
      
      // Echo back to sender to confirm
      socket.emit('receive_message', populatedMessage);
    } catch (err) {
      console.error('Error sending message:', err);
    }
  });

  // Handle typing status
  socket.on('typing', ({ receiverId, isTyping }) => {
    const receiverSocketId = userSocketMap.get(String(receiverId));
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('typing', { senderId: userId, isTyping });
    }
  });

  // Handle marking messages as read
  socket.on('mark_read', async ({ messageIds }) => {
    try {
      await Message.updateMany(
        { _id: { $in: messageIds } },
        { $set: { isRead: true } }
      );
      
      // Need to tell the sender(s) that their messages were read.
      // Easiest is to fetch the messages to group by sender, but since logic typically sends batches per chat,
      // we assume they're generally from the same sender (from individual active chat rendering loop).
      const messages = await Message.find({ _id: { $in: messageIds } });
      const sendersToNotify = new Set();
      
      messages.forEach(m => {
        sendersToNotify.add(String(m.sender));
      });

      sendersToNotify.forEach(senderId => {
        const senderSocketId = userSocketMap.get(senderId);
        if (senderSocketId) {
          io.to(senderSocketId).emit('messages_read', { messageIds, readerId: userId });
        }
      });
      
    } catch(err) {
      console.error('Error marking read:', err);
    }
  });

  // Handle disconnect
  socket.on('disconnect', async () => {
    userSocketMap.delete(userId);
    
    // Mark user as offline
    await User.findByIdAndUpdate(userId, { isOnline: false });
    io.emit('update_status', { userId, isOnline: false });
    
    console.log(`User ${userId} disconnected`);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
