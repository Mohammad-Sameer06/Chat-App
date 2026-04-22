import React, { useState, useEffect, useContext } from 'react';
import Sidebar from '../components/Sidebar';
import ChatArea from '../components/ChatArea';
import { AuthContext, api } from '../context/AuthContext';
import { useChat } from '../hooks/useChat';

export default function ChatDashboard() {
  const { user } = useContext(AuthContext);
  const [contacts, setContacts] = useState([]);
  const [activeContact, setActiveContact] = useState(null);
  
  const { 
    socket, 
    messages, 
    setMessages, 
    sendMessage, 
    sendTyping, 
    onlineUsers,
    setOnlineUsers,
    typingUsers 
  } = useChat(user);

  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const res = await api.get('/users');
        setContacts(res.data);
        
        const onlineSet = new Set();
        res.data.forEach(c => {
          if (c.isOnline) onlineSet.add(c._id);
        });
        setOnlineUsers(onlineSet);
      } catch (err) {
        console.error(err);
      }
    };
    fetchContacts();
  }, [setOnlineUsers]);

  // When active contact changes, fetch history
  useEffect(() => {
    if (!activeContact) return;
    const fetchHistory = async () => {
      try {
        const res = await api.get(`/messages/${activeContact._id}`);
        setMessages(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchHistory();
  }, [activeContact, setMessages]);

  const activeMessages = messages.filter(msg => {
    if (!activeContact) return false;
    const msgSenderId = typeof msg.sender === 'object' ? msg.sender?._id : msg.sender;
    const msgReceiverId = typeof msg.receiver === 'object' ? msg.receiver?._id : msg.receiver;
    
    return (
      (msgSenderId === activeContact._id && msgReceiverId === user?.id) ||
      (msgSenderId === user?.id && msgReceiverId === activeContact._id)
    );
  });

  const isTyping = activeContact && typingUsers.has(activeContact._id);

  return (
    <div className="dashboard-container">
      <Sidebar 
        contacts={contacts} 
        activeContact={activeContact} 
        setActiveContact={setActiveContact} 
        onlineUsers={onlineUsers} 
      />
      <div style={{ flex: 1, display: 'flex' }}>
        <ChatArea 
          activeContact={activeContact} 
          messages={activeMessages} 
          sendMessage={sendMessage}
          sendTyping={sendTyping}
          isTyping={isTyping}
        />
      </div>
    </div>
  );
}
