# 🚀 Velocity Prime v2.0

**The Ultimate Video Speed Control Engine — Unleash God-Mode on your browser.**

Velocity Prime is not just a playback speed controller; it's a high-performance **Quantum Lock** engine designed to bypass site restrictions, skip ads at lightning speed, and provide professional-grade precision control over your video content.

---

## ✨ Key Features

- **🛡️ The Illusion Trap** — Hooks the native `playbackRate` descriptor. Even if a site's anti-cheat scripts check your speed, Velocity Prime always reports `1.0`, keeping you undetected on strict platforms.
- **🔓 Main-World Injection (CSP Bypass)** — Uses Manifest V3 `world: "MAIN"` logic to execute code synchronously inside the webpage, bypassing Content Security Policy walls.
- **⚡ Ad-Skip Overdrive** — Automatically detects ad containers and accelerates them to **16× speed**, getting you back to your content in milliseconds.
- **✨ Animated HUD** — A sleek indigo Heads-Up Display appears in the corner whenever speed changes, even with the popup closed.
- **⚙️ Quantum Lock Engine** — Runs ~60 times per second via `requestAnimationFrame` to enforce your desired speed even if the site tries to reset it.
- **⬇️ Integrated Downloader** — Download YouTube videos and playlists directly from the popup via a local Python server.

---

## ⌨️ Controls

### 🌍 Global Mode — Active anywhere on the page
> Shortcut: `Ctrl + Shift + Alt` + Key

| Action | Shortcut | Effect |
| :--- | :--- | :--- |
| **Reset** | `R` | Return to **1.0×** |
| **Increase** | `↑` or `→` | +**0.05×** |
| **Decrease** | `↓` or `←` | −**0.05×** |
| **Scroll** | `Ctrl+Shift+Alt + Wheel` | ±**0.05×** |

### 🎨 Popup Mode — Active when the extension window is open
> No modifier keys needed.

| Action | Shortcut |
| :--- | :--- |
| Reset to 1× | `R` |
| Fine-tune | Arrow Keys |
| Precise scrub | Click-drag on the speed number |
| Scroll adjust | Mouse wheel over slider |

---

## 🗂️ Project Structure

```
VelocityPrime/
├── build.js                  ← esbuild build script (dev + production)
├── package.json
├── src/
│   ├── background/
│   │   └── background.js     ← Service worker (native messaging bridge)
│   ├── content/
│   │   ├── isolated/         ← ISOLATED world (chrome.* APIs)
│   │   │   ├── core.js       — speed state, broadcast, applyGlobalSpeed
│   │   │   ├── storage.js    — chrome.storage sync
│   │   │   ├── keyboard.js   — Ctrl+Shift+Alt+Arrow shortcuts
│   │   │   ├── wheel.js      — Ctrl+Shift+Alt+Scroll
│   │   │   ├── video-info.js — getVideoInfo message listener
│   │   │   └── index.js      — entry point
│   │   └── main/             ← MAIN world (page JS context)
│   │       ├── state.js      — shared mutable state
│   │       ├── anti-cheat.js — playbackRate override
│   │       ├── ad-detect.js  — isAdPlaying()
│   │       ├── tracker.js    — captureVideo / enforceOnVideo
│   │       ├── intercept.js  — createElement & addEventListener hooks
│   │       ├── loop.js       — 60fps rAF enforcement loop
│   │       ├── hud.js        — on-screen speed display
│   │       ├── bridge.js     — postMessage listener (ISOLATED → MAIN)
│   │       └── index.js      — entry point
│   └── popup/
│       ├── popup.html
│       ├── css/
│       │   ├── popup.css     — @import entry point
│       │   ├── _base.css     — reset, variables, body
│       │   ├── _header.css   — logo & title
│       │   ├── _tabs.css     — tab navigation
│       │   ├── _speed.css    — speed widget, slider, presets
│       │   ├── _downloads.css — download panel & cards
│       │   └── _server.css   — server status bar
│       └── js/
│           ├── main.js       — popup bootstrap
│           ├── constants.js  — STEP, SERVER, MIN/MAX
│           ├── utils/
│           │   ├── round.js
│           │   └── custom-select.js
│           ├── speed/
│           │   ├── index.js  — initSpeedController
│           │   ├── apply.js  — applySpeed + storage sync
│           │   ├── scrubbing.js — drag-to-scrub
│           │   └── keyboard.js  — popup arrow shortcuts
│           ├── downloads/
│           │   ├── index.js  — initDownloadsController
│           │   ├── api.js    — fetch wrappers
│           │   ├── cards.js  — DOM card rendering
│           │   └── actions.js — pause/resume/remove
│           └── ui/
│               ├── tabs.js
│               ├── server-status.js
│               └── video-detect.js
├── assets/icons/             ← Extension icons (16, 48, 128px)
├── backend/                  ← Python download server (yt-dlp)
│   ├── server.py
│   ├── bridge.py
│   ├── run_hidden.vbs        — starts server silently
│   └── install.bat           — registers the native messaging host
└── dist/                     ← 🏗️ Built output (auto-generated, do not edit)
    ├── manifest.json
    ├── assets/
    ├── background/
    ├── content/
    └── popup/
```

---

## 🛠️ Development

### Prerequisites
- **Node.js** (for esbuild)
- **Python 3** (for the download server)
- **yt-dlp** (for video downloading)

### Build

```bash
# Install dependencies (first time only)
npm install

# Watch mode — auto-rebuild on every save
npm run dev

# Production build — minified output to dist/
npm run build
```

### Load the Extension in Chrome

> **Always load the `dist/` folder**, not the project root.

1. Run `npm run build` to generate `dist/`.
2. Go to `chrome://extensions/`.
3. Enable **Developer Mode**.
4. Click **Load Unpacked** → select the **`dist/`** folder.
5. For development: use `npm run dev` and just click **⟳ Refresh** in `chrome://extensions/` after each rebuild.

### Download Server (Optional)

The downloads tab requires the local Python server:

```bash
cd backend
# First time: register the native messaging host
install.bat

# Start the server (or just double-click run_hidden.vbs)
python server.py
```

---

## 🔧 Tech Stack

| Layer | Technology |
| :--- | :--- |
| Build | esbuild |
| Extension | Chrome MV3 — Vanilla JS |
| Popup UI | HTML + CSS (Neon Design System) |
| Download Server | Python + yt-dlp |
| Storage | `chrome.storage.local` |

---

**Velocity Prime — Take control of time itself.**
