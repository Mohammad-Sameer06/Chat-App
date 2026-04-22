import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { LogOut } from 'lucide-react';

export default function Sidebar({ contacts, activeContact, setActiveContact, onlineUsers }) {
  const { user, logout } = useContext(AuthContext);

  const getInitials = (name) => {
    return name ? name.substring(0, 2).toUpperCase() : '??';
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div className="avatar avatar-small">
            {getInitials(user?.username)}
          </div>
          <h2>Chats</h2>
        </div>
        <button onClick={logout} style={{ background: 'transparent', color: '#64748b' }}>
          <LogOut size={20} />
        </button>
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
              <div className="avatar">
                {getInitials(contact.username)}
                <div className={`status-indicator ${isOnline ? 'online' : ''}`}></div>
              </div>
              <div>
                <h4 style={{ fontSize: '1rem', marginBottom: '0.25rem' }}>{contact.username}</h4>
                <p style={{ fontSize: '0.875rem', color: '#64748b' }}>
                  {isOnline ? 'Online' : 'Offline'}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
