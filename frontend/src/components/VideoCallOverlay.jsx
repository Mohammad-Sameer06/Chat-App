import React, { useState } from 'react';
import { Phone, PhoneOff, MicOff, Mic, VideoOff, Video } from 'lucide-react';

export default function VideoCallOverlay({ rtc }) {
  const {
    localVideoRef,
    remoteVideoRef,
    callState,
    incomingCallData,
    answerCall,
    rejectCall,
    hangUp,
    toggleMute,
    toggleCamera
  } = rtc;

  const [isMuted, setIsMuted] = useState(false);
  const [isCamOff, setIsCamOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef(null);

  useEffect(() => {
    let interval = null;
    if (callState === 'ACTIVE') {
      setCallDuration(0);
      interval = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else {
      setCallDuration(0);
    }
    return () => clearInterval(interval);
  }, [callState]);

  const handleMouseMove = () => {
    if (callState !== 'ACTIVE') return;
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);
  };

  if (callState === 'IDLE') return null;

  const handleMute = () => setIsMuted(toggleMute());
  const handleCam = () => setIsCamOff(toggleCamera());

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="webrtc-overlay-fs" onMouseMove={handleMouseMove}>
      {callState === 'RINGING' && incomingCallData && (
        <div className="webrtc-incoming-dialog">
          <div className="pulse-ring">
            <div className="avatar" style={{width: '64px', height: '64px', fontSize: '1.5rem', marginBottom: '1rem'}}>
               {incomingCallData.name?.substring(0,2).toUpperCase() || '??'}
            </div>
          </div>
          <h3>{incomingCallData.name} is calling...</h3>
          <p>Incoming Video Call</p>
          <div className="dialog-controls">
            <button onClick={answerCall} className="btn-accept"><Phone size={24}/></button>
            <button onClick={rejectCall} className="btn-reject"><PhoneOff size={24}/></button>
          </div>
        </div>
      )}

      {callState === 'CALLING' && (
        <div className="webrtc-incoming-dialog">
          <div className="avatar" style={{width: '64px', height: '64px', fontSize: '1.5rem', marginBottom: '1rem'}}>
             ...
          </div>
          <h3>Calling...</h3>
          <p>Wait for them to answer</p>
          <div className="dialog-controls" style={{justifyContent: 'center'}}>
            <button onClick={hangUp} className="btn-reject"><PhoneOff size={24}/></button>
          </div>
        </div>
      )}

      {callState === 'ACTIVE' && (
        <div className="webrtc-active-call">
          <video 
            playsInline 
            autoPlay 
            ref={remoteVideoRef} 
            className="webrtc-remote-vid"
          />
          <div className={`webrtc-local-vid-container ${showControls ? '' : 'hidden'}`}>
            <video 
              playsInline 
              autoPlay 
              muted 
              ref={localVideoRef} 
              className="webrtc-local-vid" 
            />
          </div>
          
          <div className={`webrtc-toolbar ${showControls ? '' : 'hidden'}`}>
            <div className="call-timer">{formatTime(callDuration)}</div>
            <button onClick={handleMute} className={`toolbar-btn ${isMuted ? 'disabled' : ''}`}>
               {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
            </button>
            <button onClick={hangUp} className="toolbar-btn hangup">
               <PhoneOff size={24} fill="currentColor" />
            </button>
            <button onClick={handleCam} className={`toolbar-btn ${isCamOff ? 'disabled' : ''}`}>
               {isCamOff ? <VideoOff size={24} /> : <Video size={24} />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
