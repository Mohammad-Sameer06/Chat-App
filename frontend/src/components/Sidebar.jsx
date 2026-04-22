import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { LogOut, Settings, Trash2 } from 'lucide-react';

export default function Sidebar({ contacts, activeContact, setActiveContact, onlineUsers, handleRemoveContact }) {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const getInitials = (name) => {
    return name ? name.substring(0, 2).toUpperCase() : '??';
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div className="avatar avatar-small" style={{ overflow: 'hidden' }}>
            {user?.avatar ? (
              <img src={user.avatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Avatar" />
            ) : (
              getInitials(user?.username)
            )}
          </div>
          <h2>Chats</h2>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button onClick={() => navigate('/profile')} style={{ background: 'transparent', color: '#64748b' }}>
            <Settings size={20} />
          </button>
          <button onClick={logout} style={{ background: 'transparent', color: '#64748b' }}>
            <LogOut size={20} />
          </button>
        </div>
      </div>
      
      <div className="my-id-card">
        <p style={{color: '#64748b'}}>Your User ID:</p>
        <div 
          className="id-copy" 
          onClick={() => {
            navigator.clipboard.writeText(user?.shortId);
            alert('User ID Copied: ' + user?.shortId);
          }}
          title="Click to copy"
        >
          <span>{user?.shortId}</span>
        </div>
      </div>

      <div className="contact-list">
        {contacts.map(contact => {
          const isOnline = onlineUsers.has(contact._id);
          const isActive = activeContact?._id === contact._id;
          return (
            <div 
              key={contact._id} 
              className={`contact-item ${isActive ? 'active' : ''}`}
              onClick={() => setActiveContact(contact)}
            >
              <div className="avatar" style={{ overflow: 'hidden' }}>
                {contact.avatar ? (
                  <img src={contact.avatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Avatar" />
                ) : (
                  getInitials(contact.username)
                )}
                <div className={`status-indicator ${isOnline ? 'online' : ''}`}></div>
              </div>
              <div style={{ flex: 1 }}>
                <h4 style={{ fontSize: '1rem', marginBottom: '0.25rem' }}>{contact.username}</h4>
                <p style={{ fontSize: '0.875rem', color: '#64748b' }}>
                  {isOnline ? 'Online' : 'Offline'}
                </p>
              </div>
              <button 
                className="remove-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveContact(contact.shortId);
                }}
              >
                <Trash2 size={16} color="#ef4444" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
