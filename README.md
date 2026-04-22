<div align="center">
  <img src="https://img.shields.io/badge/React_Vite-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white" alt="Node" />
  <img src="https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB" />
  <img src="https://img.shields.io/badge/Socket.io-black?style=for-the-badge&logo=socket.io&badgeColor=010101" alt="Socket" />
  <img src="https://img.shields.io/badge/WebRTC-333333?style=for-the-badge&logo=webrtc&logoColor=white" alt="WebRTC" />
</div>

<h1 align="center">Real-Time MERN Chat & WebRTC Engine</h1>

A cutting-edge, professional 1:1 real-time communications dashboard. Built from the ground up on the **MERN Stack** (MongoDB, Express, React, Node.js), this platform entirely bypasses commercial third-party messaging APIs (like Twilio or Firebase) in favor of deep native WebSocket integrations, custom buffer allocations, and absolute true Peer-to-Peer encrypted Video routing infrastructures.

---

## ⚡ Core Features

- **Blazing Fast Messaging Mechanism:** Built over custom `Socket.io` handlers leveraging continuous active `userSocketMap` instances to route instantaneous message delivery alongside live Typing Indicators (WhatsApp bouncing dots effect).
- **Integrated WebRTC Video Calling:** Initiates True Peer-to-Peer WebRTC networking utilizing Google STUN servers. Features a sleek Glassmorphic UI layout, native tracking timers, dynamic Mic/Camera toggle inputs, and intelligent auto-hiding "Theater Mode" UX overlays!
- **Multi-Media Content Suite:** 
  - 🎙️ **Voice Memos**: Native UI `MediaRecorder` APIs intercept microphone audio blobs directly into embeddable HTML5 `<audio>` bubbles!
  - 📎 **Images & Files**: Dynamic `FileReader` parsers inject up to 10MB Base64 structures instantly. Includes a sleek Fullscreen Lightbox Visualizer for attached images featuring localized image-saving bounds.
- **Contextual Direct Replies:** Robust WhatsApp/iMessage mapping. Reply mechanics anchor deeply inside MongoDB Reference Schemas (`replyTo`), popping out interactive glassmorphic sub-layers summarizing parent text instantly inline. 
- **Analytics & Tracking Logs:** Bi-directional status metrics! Displays a single isolated grey tick (`✓`) when your node securely mounts information to the server, jumping beautifully into double blue checkmarks (`✓✓`) exclusively when the receiver’s window strictly intersection-scans over your message string natively!
- **Zero-Cloud Contact Handling:** Intelligent `shortId` generation arrays (e.g. `X7KJN9`) handle bi-directional contact map pairing smoothly securely. Even profile Avatar images are managed entirely locally within MongoDB mapping via Base64. 

---

## 🏗️ Technical Architecture

This application operates in a strictly decoupled pattern housing two autonomous primary servers. 

```bash
/backend    # Node.js + Express + Mongoose + Socket.io Signaling Orchestrator
/frontend   # React + Vite + Lucide-React (Client SPA)
```

**Key Data Routing Elements**:
- **Socket Buffers**: Node instances dynamically handle scaling up to `maxHttpBufferSize: 1e7` natively protecting Node core loops from heavy image injections.
- **Aggregation Pipelines**: Unread Notification badges inside the Frontend Sidebar map exactly out of MongoDB's fast `$group` summation aggregations!

---

## 🚀 Local Installation

### 1. Requirements Tracker
Before spinning this codebase up, ensure you possess:
- **Node.js** (v18+)
- **MongoDB** (running natively on port `27017` or a cloud-linked cluster)

### 2. Back-End Initialization
Open your terminal and mount the Node environment:
```bash
cd backend
npm install
```
Create a `.env` payload document containing:
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/chatapp
JWT_SECRET=super_secret_jwt_key_12345
```
Boot your backend cluster natively via:
```bash
node server.js
```

### 3. Front-End Initialization
Spin open a second autonomous terminal and mount into React via Vite:
```bash
cd frontend
npm install
npm run dev
```

The application is officially mapped directly to `http://localhost:5173`. 
*(Ensure your browser clears Mic/Camera permissions properly for optimal WebRTC video linkage)*.

---

> Crafted securely with 💙 targeting professional realtime engineering standards.
