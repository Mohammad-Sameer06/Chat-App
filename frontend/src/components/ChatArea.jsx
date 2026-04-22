import React, { useState, useEffect, useRef, useContext } from 'react';
import { Send } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

export default function ChatArea({ activeContact, messages, sendMessage, sendTyping, isTyping }) {
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
          {getInitials(activeContact.username)}
        </div>
        <div className="chat-header-info">
          <h3>{activeContact.username}</h3>
          <div style={{ height: '20px' }}>
            {isTyping ? <p className="typing-indicator">Typing...</p> : null}
          </div>
        </div>
      </div>
      
      <div className="messages-container">
        {messages.map((msg, index) => {
          // sender can be populated object or raw ID string from socket
          const isMine = msg.sender === user?.id || msg.sender?._id === user?.id; 
          return (
            <div key={msg._id || index} className={`message ${isMine ? 'sent' : 'received'}`}>
              <p>{msg.content}</p>
              <div className="message-time">
                {new Date(msg.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          );
        })}
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
