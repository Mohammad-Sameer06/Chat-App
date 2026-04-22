import React, { useState, useEffect, useRef, useContext } from 'react';
import { Send, Check, CheckCheck, Video, Paperclip, Mic, Square, FileText, Download, X, Reply } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

export default function ChatArea({ activeContact, messages, sendMessage, sendTyping, isTyping, startVideoCall }) {
  const { user } = useContext(AuthContext);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const fileInputRef = useRef(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [replyMsg, setReplyMsg] = useState(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  let typingTimeout = useRef(null);
  const handleInputChange = (e) => {
    setInput(e.target.value);
    
    // Typing indicator logic
    sendTyping(activeContact._id, true);
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      sendTyping(activeContact._id, false);
    }, 2000);
  };

  const handleSend = (e) => {
    if (e) e.preventDefault();
    if (!input.trim()) return;
    sendMessage(activeContact._id, input, 'text', '', '', replyMsg?._id);
    setInput('');
    setReplyMsg(null);
    sendTyping(activeContact._id, false);
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = event => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          sendMessage(activeContact._id, '', 'audio', reader.result, '', replyMsg?._id);
          setReplyMsg(null);
        };
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      alert("Failed to access microphone natively.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert("Attachment is too large! Strictly capped at 10MB limit.");
      e.target.value = '';
      return;
    }

    const isImage = file.type.startsWith('image/');
    const type = isImage ? 'image' : 'file';

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = () => {
      sendMessage(activeContact._id, file.name, type, reader.result, file.name, replyMsg?._id);
      setReplyMsg(null);
      e.target.value = ''; // Reset input
    };
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
            <div key={msg._id || index} className={`message-wrapper ${isMine ? 'mine' : 'theirs'}`}>
              
              {!isMine && (
                <button className="reply-btn-hover" onClick={() => setReplyMsg(msg)}>
                  <Reply size={18} />
                </button>
              )}

              <div className={`message ${isMine ? 'sent' : 'received'}`}>
                {msg.replyTo && (
                  <div className="replied-snippet">
                    <div className="replied-bar" />
                    <div className="replied-content">
                      <p className="replied-text">{msg.replyTo.content || msg.replyTo.fileName || 'Media Attachment'}</p>
                    </div>
                  </div>
                )}

                {msg.type === 'image' && (
                  <div style={{ marginBottom: msg.content ? '0.5rem' : '0' }}>
                    <img 
                    src={msg.fileData} 
                    style={{ maxWidth: '100%', borderRadius: '8px', cursor: 'pointer', maxHeight: '300px', objectFit: 'cover' }} 
                    alt={msg.fileName || 'Attachment'} 
                    onClick={() => setSelectedImage({ src: msg.fileData, name: msg.fileName })}
                  />
                </div>
              )}
              {msg.type === 'audio' && (
                <div style={{ marginBottom: '0.25rem' }}>
                  <audio controls src={msg.fileData} style={{ maxWidth: '240px', height: '40px' }} />
                </div>
              )}
              {msg.type === 'file' && (
                <div style={{ padding: '0.5rem 1rem', background: 'rgba(0,0,0,0.05)', borderRadius: '6px', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileText size={20} />
                  <a href={msg.fileData} download={msg.fileName} style={{ color: 'inherit', textDecoration: 'underline' }}>{msg.fileName}</a>
                </div>
              )}

              {msg.content && <p>{msg.content}</p>}
              <div className="message-time" style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                {new Date(msg.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                {isMine && (
                  msg.isRead ? <CheckCheck size={14} color="#60a5fa" /> : <Check size={14} />
                )}
              </div>
            </div>

            {isMine && (
              <button className="reply-btn-hover right" onClick={() => setReplyMsg(msg)}>
                <Reply size={18} />
              </button>
            )}

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

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {replyMsg && (
          <div className="reply-context-banner">
            <div className="reply-context-info">
              <span className="reply-label">
                Replying to {replyMsg.sender === user?.id || replyMsg.sender?._id === user?.id ? 'yourself' : 'message'}
              </span>
              <p className="reply-preview">{replyMsg.content || replyMsg.fileName || 'Media attachment'}</p>
            </div>
            <button onClick={() => setReplyMsg(null)} className="btn-close-reply"><X size={18} /></button>
          </div>
        )}

        <div className="chat-input-container" style={{ borderTop: replyMsg ? 'none' : '1px solid var(--color-slate-200)' }}>
          <input 
          type="file" 
          ref={fileInputRef} 
          style={{ display: 'none' }} 
          onChange={handleFileUpload}
        />
        <button type="button" onClick={() => fileInputRef.current?.click()} className="btn-icon" style={{ background: 'transparent', color: '#64748b' }}>
          <Paperclip size={24} />
        </button>

        <form onSubmit={handleSend} style={{ flex: 1, display: 'flex', gap: '1rem', alignItems: 'center' }}>
          {isRecording ? (
            <div style={{ flex: 1, padding: '0.5rem 1.5rem', background: '#ffe4e6', borderRadius: '24px', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#e11d48', fontWeight: '500' }}>
              <div className="pulse-dot" style={{ width: '10px', height: '10px', backgroundColor: '#e11d48', borderRadius: '50%' }} />
              Recording Voice Note...
            </div>
          ) : (
            <input 
              type="text" 
              placeholder="Type a message..." 
              value={input}
              onChange={handleInputChange}
            />
          )}

          {isRecording ? (
            <button type="button" onClick={stopRecording} className="btn-icon" style={{ background: '#e11d48' }}>
               <Square size={18} fill="currentColor" />
            </button>
          ) : input.trim() ? (
            <button type="submit" className="btn-icon">
              <Send size={20} />
            </button>
          ) : (
            <button type="button" onClick={startRecording} className="btn-icon" style={{ background: 'var(--color-primary)' }}>
              <Mic size={20} />
            </button>
          )}
        </form>
        </div>
      </div>

      {selectedImage && (
        <div className="lightbox-overlay" onClick={() => setSelectedImage(null)}>
          <button className="lightbox-close" onClick={() => setSelectedImage(null)}>
            <X size={28} />
          </button>
          <a href={selectedImage.src} download={selectedImage.name || 'image'} className="lightbox-download" onClick={e => e.stopPropagation()}>
            <Download size={28} />
          </a>
          <img 
            src={selectedImage.src} 
            onClick={e => e.stopPropagation()} 
            className="lightbox-img" 
            alt="Expanded view" 
          />
        </div>
      )}
    </div>
  );
}
