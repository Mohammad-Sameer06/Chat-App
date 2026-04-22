import React, { useState, useEffect, useContext } from 'react';
import Sidebar from '../components/Sidebar';
import ChatArea from '../components/ChatArea';
import { AuthContext, api } from '../context/AuthContext';
import { useChat } from '../hooks/useChat';

export default function ChatDashboard() {
  const { user } = useContext(AuthContext);
  const [contacts, setContacts] = useState([]);
  const [activeContact, setActiveContact] = useState(null);
  const [newContactId, setNewContactId] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState('');
  
  const { 
    socket, 
    messages, 
    setMessages, 
    sendMessage, 
    sendTyping, 
    onlineUsers,
    setOnlineUsers,
    typingUsers,
    contactRefreshToggle
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
  }, [setOnlineUsers, contactRefreshToggle]);

  const handleAddContact = async (e) => {
    e.preventDefault();
    if (!newContactId.trim()) return;
    setAddLoading(true);
    setAddError('');
    try {
      const res = await api.post('/users/add', { contactId: newContactId.trim() });
      setContacts(res.data); // Refresh contacts list
      setNewContactId('');
    } catch (err) {
      setAddError(err.response?.data?.message || 'Failed to add contact');
    } finally {
      setAddLoading(false);
    }
  };

  const handleRemoveContact = async (shortId) => {
    if (!window.confirm("Are you sure you want to remove this contact?")) return;
    
    try {
      const res = await api.post('/users/remove', { contactId: shortId });
      setContacts(res.data);
      if (activeContact?.shortId === shortId) {
        setActiveContact(null);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to remove contact");
    }
  };

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
    const msgSenderId = String(typeof msg.sender === 'object' ? msg.sender?._id : msg.sender);
    const msgReceiverId = String(typeof msg.receiver === 'object' ? msg.receiver?._id : msg.receiver);
    
    return (
      (msgSenderId === String(activeContact._id) && msgReceiverId === String(user?.id)) ||
      (msgSenderId === String(user?.id) && msgReceiverId === String(activeContact._id))
    );
  });

  const isTyping = activeContact && typingUsers.has(activeContact._id);

  return (
    <div className="dashboard-container">
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <Sidebar 
          contacts={contacts} 
          activeContact={activeContact} 
          setActiveContact={setActiveContact} 
          onlineUsers={onlineUsers} 
          handleRemoveContact={handleRemoveContact}
        />
        <form className="add-contact-form" onSubmit={handleAddContact}>
          <input 
            type="text" 
            placeholder="Enter User ID..." 
            value={newContactId}
            onChange={(e) => setNewContactId(e.target.value)}
          />
          <button type="submit" className="btn-small" disabled={addLoading}>
            {addLoading ? '...' : 'Add'}
          </button>
        </form>
        {addError && <p style={{color: '#ef4444', fontSize: '0.75rem', padding: '0 1.5rem', marginTop: '-0.5rem'}}>{addError}</p>}
      </div>
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
