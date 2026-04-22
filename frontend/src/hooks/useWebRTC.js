import { useState, useEffect, useRef } from 'react';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]
};

export const useWebRTC = (socket, userId) => {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [callState, setCallState] = useState('IDLE'); // IDLE, RINGING (incoming), CALLING (outgoing), ACTIVE
  const [incomingCallData, setIncomingCallData] = useState(null);
  const [remoteUserId, setRemoteUserId] = useState(null);
  
  const peerConnectionRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  useEffect(() => {
    if (!socket) return;

    socket.on('call_user', async ({ signal, from, name }) => {
      setIncomingCallData({ signal, from, name });
      setCallState('RINGING');
      setRemoteUserId(from);
    });

    socket.on('call_accepted', async (signal) => {
      setCallState('ACTIVE');
      if (peerConnectionRef.current) {
        try {
          await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(signal));
        } catch(e) { console.error("Error setting remote desc:", e); }
      }
    });

    socket.on('ice_candidate', async (candidate) => {
      if (peerConnectionRef.current) {
        try {
          await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        } catch(e) {}
      }
    });

    socket.on('end_call', () => {
      cleanupCall();
    });

    return () => {
      socket.off('call_user');
      socket.off('call_accepted');
      socket.off('ice_candidate');
      socket.off('end_call');
    };
  }, [socket]);

  // Make sure video blocks catch streams dynamically when references hook in
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, localVideoRef.current]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream, remoteVideoRef.current]);

  const initLocalStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setLocalStream(stream);
      return stream;
    } catch (err) {
      alert("Failed to get camera/microphone permissions.");
      return null;
    }
  };

  const createPeerConnection = (targetId, stream) => {
    const pc = new RTCPeerConnection(ICE_SERVERS);
    
    stream.getTracks().forEach(track => pc.addTrack(track, stream));

    pc.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
    };

    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit('ice_candidate', { to: targetId, candidate: event.candidate });
      }
    };

    return pc;
  };

  const startCall = async (userToCall, name) => {
    const stream = await initLocalStream();
    if (!stream) return;

    setCallState('CALLING');
    setRemoteUserId(userToCall);

    const pc = createPeerConnection(userToCall, stream);
    peerConnectionRef.current = pc;

    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      socket.emit('call_user', {
        userToCall,
        signalData: offer,
        from: userId,
        name: name
      });
    } catch(e) {
      console.error(e);
      cleanupCall();
    }
  };

  const answerCall = async () => {
    if (!incomingCallData) return;
    const { from, signal } = incomingCallData;

    const stream = await initLocalStream();
    if (!stream) {
      rejectCall();
      return;
    }

    setCallState('ACTIVE');
    
    const pc = createPeerConnection(from, stream);
    peerConnectionRef.current = pc;

    try {
      await pc.setRemoteDescription(new RTCSessionDescription(signal));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket.emit('answer_call', { to: from, signal: answer });
    } catch(e) {
      console.error(e);
      cleanupCall();
    }
  };

  const rejectCall = () => {
    if (incomingCallData && socket) {
      socket.emit('end_call', { to: incomingCallData.from });
    }
    cleanupCall();
  };

  const hangUp = () => {
    if (remoteUserId && socket) {
      socket.emit('end_call', { to: remoteUserId });
    }
    cleanupCall();
  };

  const cleanupCall = () => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    if (localStream) {
      localStream.getTracks().forEach(t => t.stop());
      setLocalStream(null);
    }
    setRemoteStream(null);
    setCallState('IDLE');
    setIncomingCallData(null);
    setRemoteUserId(null);
  };

  const toggleMute = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        return !audioTrack.enabled; // returns true if now muted
      }
    }
    return false;
  };

  const toggleCamera = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        return !videoTrack.enabled; // returns true if now disabled (off)
      }
    }
    return false;
  };

  return {
    localVideoRef,
    remoteVideoRef,
    localStream,
    remoteStream,
    callState,
    incomingCallData,
    startCall,
    answerCall,
    rejectCall,
    hangUp,
    toggleMute,
    toggleCamera
  };
};
