import React, { useState, useEffect, useContext } from 'react';
import Sidebar from '../components/Sidebar';
import ChatArea from '../components/ChatArea';
import VideoCallOverlay from '../components/VideoCallOverlay';
import { AuthContext, api } from '../context/AuthContext';
import { useChat } from '../hooks/useChat';
import { useWebRTC } from '../hooks/useWebRTC';

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
    markMessagesRead,
    onlineUsers,
    setOnlineUsers,
    typingUsers,
    contactRefreshToggle,
    unreadCounts,
    setUnreadCounts
  } = useChat(user, activeContact?._id);

  const rtc = useWebRTC(socket, user?.id);

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

  // Track unread messages from the activeContact rendered on screen
  useEffect(() => {
    if (!activeContact) return;
    
    // Find messages in the filtered sequence that specifically were sent BY the activeContact,
    // received BY the currentUser, and are NOT yet read.
    const unreadIds = activeMessages
      .filter(msg => !msg.isRead && String(msg.sender?._id || msg.sender) === String(activeContact._id))
      .map(msg => String(msg._id));

    if (unreadIds.length > 0) {
      markMessagesRead(unreadIds);
      // Immediately reflect them as locally read so we don't spam the server
      setMessages(prev => prev.map(m => {
        if (unreadIds.includes(String(m._id))) {
          return { ...m, isRead: true };
        }
        return m;
      }));
    }
  }, [activeMessages, activeContact, markMessagesRead, setMessages]);

  // Clear unread badge in sidebar when clicking a contact natively
  useEffect(() => {
    if (activeContact) {
      setUnreadCounts(prev => {
        if (!prev[activeContact._id]) return prev;
        const next = { ...prev };
        delete next[activeContact._id];
        return next;
      });
    }
  }, [activeContact, setUnreadCounts]);

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
          unreadCounts={unreadCounts}
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
          startVideoCall={() => rtc.startCall(activeContact._id, user.username)}
        />
      </div>
      <VideoCallOverlay rtc={rtc} />
    </div>
  );
}
