import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { api } from '../context/AuthContext';

const URL = 'http://localhost:5000';

export const useChat = (user, activeContact) => {
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [contactRefreshToggle, setContactRefreshToggle] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState({});

  useEffect(() => {
    if (!user) return;
    
    const s = io(URL, { withCredentials: true });
    setSocket(s);

    const fetchUnread = async () => {
      try {
        const res = await api.get('/messages/unread');
        setUnreadCounts(res.data);
      } catch(err) {}
    };
    fetchUnread();

    s.on('receive_message', (msg) => {
      setMessages(prev => {
        // Prevent duplicate messages if echoed to sender
        if (prev.some(m => m._id === msg._id)) return prev;
        return [...prev, msg];
      });

      const senderId = String(typeof msg.sender === 'object' ? msg.sender?._id : msg.sender);
      if (senderId !== activeContact) {
        setUnreadCounts(prev => ({
          ...prev,
          [senderId]: (prev[senderId] || 0) + 1
        }));
      }
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

    s.on('contact_added', () => {
      setContactRefreshToggle(p => !p);
    });

    s.on('contact_removed', () => {
      setContactRefreshToggle(p => !p);
    });

    s.on('messages_read', ({ messageIds }) => {
      setMessages(prev => prev.map(msg => {
        if (messageIds.includes(String(msg._id))) {
          return { ...msg, isRead: true };
        }
        return msg;
      }));
    });

    return () => s.disconnect();
  }, [user]);

  const sendMessage = (receiverId, content, type = 'text', fileData = '', fileName = '', replyTo = null) => {
    if (socket) {
      socket.emit('send_message', { receiverId, content, type, fileData, fileName, replyTo });
    }
  };

  const sendTyping = (receiverId, isTyping) => {
    if (socket) {
      socket.emit('typing', { receiverId, isTyping });
    }
  };

  const markMessagesRead = (messageIds) => {
    if (socket && messageIds.length > 0) {
      socket.emit('mark_read', { messageIds });
    }
  };

  return { 
    socket, 
    messages, 
    setMessages, 
    sendMessage, 
    sendTyping, 
    markMessagesRead,
    onlineUsers, 
    setOnlineUsers,
    typingUsers,
    contactRefreshToggle,
    unreadCounts,
    setUnreadCounts
  };
};
