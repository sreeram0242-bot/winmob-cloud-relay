/**
 * WinMob Cloud Relay Server
 * 
 * Provides an ultra-low latency, worldwide cloud bridge for WinMob Universal Clipboard
 * and Continuity between Android phones and Windows PCs over 4G/5G, Wi-Fi, or any network.
 * 
 * Deployable on Render (Free Tier), Railway, Fly.io, Heroku, or VPS.
 */

const http = require('http');
const url = require('url');
const WebSocket = require('ws');

const PORT = parseInt(process.env.PORT || '10000', 10);
const HOST = '0.0.0.0';

// Global room manager: roomId -> Set of WebSocket clients
const rooms = new Map();

function getOrCreateRoom(roomId) {
    const cleanId = (roomId || 'default').trim().toLowerCase();
    if (!rooms.has(cleanId)) {
        rooms.set(cleanId, new Set());
    }
    return rooms.get(cleanId);
}

// ── HTTP Server (Health Checks & Status UI) ──────────────────────────────────
const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);

    // Health check endpoint for Render
    if (parsedUrl.pathname === '/health' || parsedUrl.pathname === '/api/status') {
        let totalClients = 0;
        rooms.forEach((set) => { totalClients += set.size; });

        res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify({
            status: 'ok',
            service: 'WinMob Cloud Relay',
            uptimeSeconds: Math.floor(process.uptime()),
            activeRooms: rooms.size,
            connectedClients: totalClients,
            timestamp: new Date().toISOString()
        }));
        return;
    }

    // Default HTML Status Dashboard
    let totalClients = 0;
    const roomSummaries = [];
    rooms.forEach((clients, rId) => {
        totalClients += clients.size;
        if (clients.size > 0) {
            roomSummaries.push({ id: rId, devices: clients.size });
        }
    });

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>WinMob Cloud Relay</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      background: #0b0f19;
      color: #f1f5f9;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }
    .card {
      background: rgba(17, 24, 39, 0.85);
      border: 1px solid rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(16px);
      border-radius: 20px;
      padding: 40px;
      max-width: 640px;
      width: 100%;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 40px rgba(59, 130, 246, 0.15);
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: rgba(16, 185, 129, 0.15);
      color: #34d399;
      border: 1px solid rgba(16, 185, 129, 0.3);
      padding: 6px 14px;
      border-radius: 9999px;
      font-size: 13px;
      font-weight: 600;
      margin-bottom: 20px;
    }
    .dot {
      width: 8px;
      height: 8px;
      background: #10b981;
      border-radius: 50%;
      box-shadow: 0 0 10px #10b981;
      animation: pulse 2s infinite;
    }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
    h1 {
      font-size: 28px;
      font-weight: 800;
      background: linear-gradient(135deg, #60a5fa 0%, #a78bfa 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 10px;
    }
    p.subtitle {
      color: #94a3b8;
      font-size: 15px;
      line-height: 1.5;
      margin-bottom: 28px;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
      margin-bottom: 30px;
    }
    .stat-box {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 12px;
      padding: 16px 20px;
    }
    .stat-label {
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #64748b;
      margin-bottom: 6px;
    }
    .stat-value {
      font-size: 24px;
      font-weight: 700;
      color: #f8fafc;
    }
    .instructions {
      background: rgba(30, 41, 59, 0.6);
      border-radius: 12px;
      padding: 20px;
      font-size: 14px;
      color: #cbd5e1;
      line-height: 1.6;
    }
    .instructions strong {
      color: #60a5fa;
    }
    .code-box {
      background: #030712;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      padding: 10px 14px;
      font-family: monospace;
      font-size: 13px;
      color: #38bdf8;
      margin: 10px 0;
      word-break: break-all;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge"><div class="dot"></div> ONLINE & READY</div>
    <h1>WinMob Cloud Relay</h1>
    <p class="subtitle">Secure, worldwide bridge for Apple-like Universal Clipboard & Instant Screenshot Continuity across 4G/5G and any Wi-Fi.</p>
    
    <div class="stats-grid">
      <div class="stat-box">
        <div class="stat-label">Connected Devices</div>
        <div class="stat-value">${totalClients}</div>
      </div>
      <div class="stat-box">
        <div class="stat-label">Active Rooms</div>
        <div class="stat-value">${rooms.size}</div>
      </div>
    </div>

    <div class="instructions">
      <strong>How to connect your devices:</strong>
      <ol style="margin-left: 20px; margin-top: 8px;">
        <li>Enter this server URL in your Windows companion app or set <code>RELAY_URL</code>.</li>
        <li>In your Android app, enter this host when connecting:</li>
      </ol>
      <div class="code-box" id="hostBox">wss://${req.headers.host || 'your-app.onrender.com'}/winmob/v1</div>
    </div>
  </div>
</body>
</html>`;

    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
});

// ── WebSocket Server ──────────────────────────────────────────────────────────
const wss = new WebSocket.Server({
    server,
    maxPayload: 50 * 1024 * 1024 // 50MB payload limit (accommodates high-res 4K screenshots)
});

wss.on('connection', (ws, req) => {
    const parsedUrl = url.parse(req.url, true);
    // Determine room: URL query parameter `?room=...` or default to "default"
    const roomId = (parsedUrl.query.room || 'default').toLowerCase().trim();
    const roomSet = getOrCreateRoom(roomId);
    roomSet.add(ws);

    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    console.log(`[Relay] Device joined room "${roomId}" from ${clientIp}. (Room total: ${roomSet.size})`);

    // Attach metadata to ws instance
    ws.roomId = roomId;
    ws.isAlive = true;
    ws.deviceRole = 'UNKNOWN'; // Will be set on first packet

    ws.on('pong', () => {
        ws.isAlive = true;
    });

    // Send immediate ACK back to the client
    const ackPacket = {
        type: 'RELAY_CONNECTED',
        senderDevice: 'WINMOB_CLOUD_RELAY',
        timestamp: Date.now(),
        payload: JSON.stringify({
            status: 'CONNECTED',
            room: roomId,
            devicesInRoom: roomSet.size,
            message: 'Connected to WinMob Worldwide Cloud Relay'
        })
    };
    ws.send(JSON.stringify(ackPacket));

    ws.on('message', (message, isBinary) => {
        try {
            // Heartbeat or text packet
            if (!isBinary) {
                const msgStr = message.toString();
                // Check if device is identifying role
                try {
                    const parsed = JSON.parse(msgStr);
                    if (parsed.senderDevice) {
                        ws.deviceName = parsed.senderDevice;
                    }
                    if (parsed.type === 'PING') {
                        ws.send(JSON.stringify({ type: 'PONG', timestamp: Date.now() }));
                        return;
                    }
                } catch (_) {}

                // Broadcast packet to all OTHER devices in the same room
                const currentRoom = rooms.get(ws.roomId);
                if (currentRoom) {
                    for (const client of currentRoom) {
                        if (client !== ws && client.readyState === WebSocket.OPEN) {
                            client.send(msgStr);
                        }
                    }
                }
            } else {
                // Raw binary data stream (e.g. direct image stream)
                const currentRoom = rooms.get(ws.roomId);
                if (currentRoom) {
                    for (const client of currentRoom) {
                        if (client !== ws && client.readyState === WebSocket.OPEN) {
                            client.send(message, { binary: true });
                        }
                    }
                }
            }
        } catch (e) {
            console.error('[Relay] Error relaying message:', e);
        }
    });

    ws.on('close', () => {
        const currentRoom = rooms.get(ws.roomId);
        if (currentRoom) {
            currentRoom.delete(ws);
            if (currentRoom.size === 0 && ws.roomId !== 'default') {
                rooms.delete(ws.roomId);
            }
        }
        console.log(`[Relay] Device left room "${ws.roomId}". (Remaining: ${currentRoom ? currentRoom.size : 0})`);
    });

    ws.on('error', (err) => {
        console.error('[Relay] Socket error:', err.message);
    });
});

// ── Keep-Alive Ping Interval (Prevents Render Free-Tier WebSocket timeouts) ───
const pingInterval = setInterval(() => {
    wss.clients.forEach((ws) => {
        if (ws.isAlive === false) {
            console.log(`[Relay] Terminating stale socket in room "${ws.roomId}"`);
            return ws.terminate();
        }
        ws.isAlive = false;
        ws.ping();
    });
}, 25000);

wss.on('close', () => {
    clearInterval(pingInterval);
});

// ── Start Cloud Relay ─────────────────────────────────────────────────────────
server.listen(PORT, HOST, () => {
    console.log(`\n========================================================`);
    console.log(`  [CLOUD RELAY] WinMob Cloud Relay Server is LIVE!`);
    console.log(`  Listening on http://${HOST}:${PORT}`);
    console.log(`  WebSocket Endpoint: ws://${HOST}:${PORT}/winmob/v1`);
    console.log(`========================================================\n`);
});
