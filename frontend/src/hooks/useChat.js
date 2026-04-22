import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const URL = 'http://localhost:5000';

export const useChat = (user) => {
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [typingUsers, setTypingUsers] = useState(new Set());

  useEffect(() => {
    if (!user) return;
    
    const s = io(URL, { withCredentials: true });
    setSocket(s);

    s.on('receive_message', (msg) => {
      setMessages(prev => {
        // Prevent duplicate messages if echoed to sender
        if (prev.some(m => m._id === msg._id)) return prev;
        return [...prev, msg];
      });
    });

    s.on('update_status', ({ userId, isOnline }) => {
      setOnlineUsers(prev => {
        const next = new Set(prev);
        if (isOnline) next.add(userId);
        else next.delete(userId);
        return next;
      });
    });

    s.on('typing', ({ senderId, isTyping }) => {
      setTypingUsers(prev => {
        const next = new Set(prev);
        if (isTyping) next.add(senderId);
        else next.delete(senderId);
        return next;
      });
    });

    return () => s.disconnect();
  }, [user]);

  const sendMessage = (receiverId, content) => {
    if (socket) {
      socket.emit('send_message', { receiverId, content });
    }
  };

  const sendTyping = (receiverId, isTyping) => {
    if (socket) {
      socket.emit('typing', { receiverId, isTyping });
    }
  };

  return { 
    socket, 
    messages, 
    setMessages, 
    sendMessage, 
    sendTyping, 
    onlineUsers, 
    setOnlineUsers,
    typingUsers 
  };
};
