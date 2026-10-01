# WinMob Cloud Relay (Deploy on Render)

Deploy this lightweight, high-performance WebSocket Relay to **Render** (Free Tier) to enable **Worldwide Universal Clipboard and Instant Screenshot Continuity** between your Android phone and Windows PC over 4G/5G mobile data, office Wi-Fi, or anywhere across the globe.

---

## 🚀 How It Works

```
 [ Android Phone ]                                            [ Windows PC ]
  (Anywhere on 4G/5G)                                         (Running Companion)
           │                                                           │
           │      WSS Connection               WSS Connection          │
           └──────────────────> [ RENDER RELAY ] <─────────────────────┘
                             (wss://your-app.onrender.com)
```

1. You copy text or take a screenshot on your phone anywhere (even when miles away on cellular data).
2. Android beams it to your secure Render WebSocket relay.
3. Render instantly forwards it down to your Windows PC companion app.
4. Your Windows driver places it onto your Windows clipboard ready for immediate <kbd>Ctrl</kbd> + <kbd>V</kbd>!

---

## 🛠️ Step-by-Step Render Deployment (Takes 2 Minutes)

### Option 1: Deploy via GitHub (Recommended)
1. Push this `relay-server` folder to a GitHub repository (or push your WinMob repo to GitHub).
2. Go to [render.com](https://render.com) and sign in (free).
3. Click **New +** ➔ **Web Service**.
4. Connect your GitHub repository.
5. Configure the service:
   - **Name**: `winmob-relay` (or any name you choose)
   - **Root Directory**: `relay-server` (if deploying from full repo) or leave blank if in its own repo
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Instance Type**: `Free`
6. Click **Deploy Web Service**!

Render will build and deploy your relay. Once live, Render will give you a public URL like:
👉 `https://winmob-relay.onrender.com`

---

## 📱 Connecting Your Devices

### 1. On your Windows PC
Set the environment variable `RELAY_URL` before launching `server.js`:
```powershell
$env:RELAY_URL = "wss://winmob-relay.onrender.com/winmob/v1"
node server.js
```
*(Or enter it in the WinMob Web Dashboard at `http://localhost:7823`)*.

### 2. On your Android Phone
In the WinMob app:
1. Open the WinMob Android app.
2. In the IP address / Host input field, enter:
   `winmob-relay.onrender.com`
3. Tap **Connect**.

Your phone will establish a secure TLS (`wss://`) connection to Render, and your PC and phone will be linked worldwide!
