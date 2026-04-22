import React, { useState, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext, api } from '../context/AuthContext';
import { ArrowLeft, Save } from 'lucide-react';

export default function Profile() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const fileInputRef = useRef();
  
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const getInitials = (name) => {
    return name ? name.substring(0, 2).toUpperCase() : '??';
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError("Image size must be less than 5MB");
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result); // Base64 string
        setError('');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setMessage('');
    setError('');
    try {
      await api.put('/profile/avatar', { avatarBase64: avatar });
      setMessage('Profile updated successfully! Refreshing...');
      
      // We force a page reload to resync user context cleanly for immediate display changes across all areas
      setTimeout(() => {
        window.location.href = '/';
      }, 1000);
      
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card" style={{ maxWidth: '450px' }}>
        <button onClick={() => navigate('/')} style={{ background: 'transparent', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '1.5rem', color: '#64748b' }}>
          <ArrowLeft size={16} /> Dashboard
        </button>
        
        <h2>Edit Profile</h2>
        
        {message && <p style={{ color: '#22c55e', fontSize: '0.875rem', textAlign: 'center', marginBottom: '1rem' }}>{message}</p>}
        {error && <p className="auth-error" style={{ marginBottom: '1rem' }}>{error}</p>}
        
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
          <div 
            className="avatar" 
            style={{ width: '120px', height: '120px', fontSize: '2.5rem', cursor: 'pointer', overflow: 'hidden' }}
            onClick={() => fileInputRef.current.click()}
          >
            {avatar ? (
              <img src={avatar} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              getInitials(user?.username)
            )}
          </div>
          
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImageChange} 
            accept="image/*" 
            style={{ display: 'none' }} 
          />
          
          <p style={{ fontSize: '0.875rem', color: '#64748b' }}>
            Click the circle to upload a new image. (Max 5MB)
          </p>

          <button 
            className="btn-primary" 
            style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
            onClick={handleSave}
            disabled={loading}
          >
            <Save size={18} /> {loading ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </div>
    </div>
  );
}
