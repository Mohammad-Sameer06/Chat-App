import React, { useState, useEffect, useRef, useContext } from 'react';
import { Send, Check, CheckCheck, Video } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

export default function ChatArea({ activeContact, messages, sendMessage, sendTyping, isTyping, startVideoCall }) {
  const { user } = useContext(AuthContext);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleInputChange = (e) => {
    setInput(e.target.value);
    
    sendTyping(activeContact._id, true);
    
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      sendTyping(activeContact._id, false);
    }, 2000);
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    sendMessage(activeContact._id, input);
    setInput('');
    sendTyping(activeContact._id, false);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
  };

  if (!activeContact) {
    return (
      <div className="empty-state">
        <p>Select a chat to start messaging</p>
      </div>
    );
  }

  const getInitials = (name) => {
    return name ? name.substring(0, 2).toUpperCase() : '??';
  };

  return (
    <div className="chat-area">
      <div className="chat-header">
        <div className="avatar avatar-small">
          {activeContact.avatar ? (
            <img src={activeContact.avatar} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} alt="Avatar" />
          ) : (
            getInitials(activeContact.username)
          )}
        </div>
        <div className="chat-header-info">
          <h3>{activeContact.username}</h3>
          <p>{isTyping ? 'Typing...' : ''}</p>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <button onClick={startVideoCall} style={{ background: 'transparent', color: '#64748b' }} title="Video Call">
            <Video size={24} />
          </button>
        </div>
      </div>
      
      <div className="messages-container">
        {messages.map((msg, index) => {
          // sender can be populated object or raw ID string from socket
          const isMine = msg.sender === user?.id || msg.sender?._id === user?.id; 
          return (
            <div key={msg._id || index} className={`message ${isMine ? 'sent' : 'received'}`}>
              <p>{msg.content}</p>
              <div className="message-time" style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                {new Date(msg.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                {isMine && (
                  msg.isRead ? <CheckCheck size={14} color="#60a5fa" /> : <Check size={14} />
                )}
              </div>
            </div>
          );
        })}
        {isTyping && (
          <div className="typing-bubble">
            <div className="typing-dot"></div>
            <div className="typing-dot"></div>
            <div className="typing-dot"></div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form className="chat-input-container" onSubmit={handleSend}>
        <input 
          type="text" 
          placeholder="Type a message..." 
          value={input}
          onChange={handleInputChange}
        />
        <button type="submit" className="btn-icon" disabled={!input.trim()}>
          <Send size={20} />
        </button>
      </form>
    </div>
  );
}
