# ⚡ Velocity Prime 

> Premium God-Mode Video Velocity Control Extension for Chrome.

Velocity Prime is a highly advanced, ultra-performant browser extension designed specifically to bypass the most restrictive Video Player anti-cheat protections (like those used on Inkrypt and other secure educational platforms) and enforce custom playback speeds ranging from **0.1x up to a massive 16.0x**.

## ✨ Features

- **🚀 Quantum Lock Engine**: Operates at 60fps via `requestAnimationFrame` to enforce speed constantly. If the webpage's player fights back, Velocity Prime locks the speed instantly.
- **🛡️ The Illusion Trap**: Hooks the native `HTMLMediaElement.prototype.playbackRate` directly. If the site's anti-cheat scripts check the speed, Velocity Prime lies to them and reports exactly `1.0`, keeping you completely undetected.
- **🔓 Native Main-World Injection (CSP Bypass)**: Uses the cutting-edge Manifest V3 `world: "MAIN"` feature to execute code synchronously inside the webpage's environment, effortlessly bypassing the strictest Content Security Policy (CSP) walls.
- **🎨 Refined UI Design**: A stunning, custom-built interface featuring an animated speedometer gauge, a log-scale needle, hover-glow presets, and an eye-friendly "Slate/Indigo" dark theme.
- **✨ HUD Speed Indicator**: A sleek, animated overlay (Heads-Up Display) appears in the top-left corner whenever you change the speed, even with the popup closed!
- **⌨️ Keyboard Integration**: 
  - **🌍 Global Shortcuts** (Everywhere on page): `Ctrl + Shift + Alt` + (`R`, `Arrows`, or `Scroll Wheel`).
  - **🎨 Popup-Only** (When open): Just the key (`R`, `Arrows`, or `Scroll Wheel`) — no modifiers needed!
  - `Reset`: `R` to instantly return to 1x.
  - `Fine-tuning`: `↑` / `↓` and `←` / `→` for `±0.01`.
  - `Ultra-micro`: `Scroll Wheel` for `±0.01`.

## 🛠️ Architecture

Instead of the usual vulnerable DOM script injection that can be blocked or manipulated, Velocity Prime is divided into two highly specialized modules:

1. **`content.js` (Isolated World)**: Safely bridges communication from the extension's popup to the main page holding the player. Tracks state and persists your speed preference.
2. **`content_main.js` (Main World)**: The heart of the God-Mode. It hooks directly into the browser's core APIs (`createElement`, `addEventListener`, and prototypes), trapping the `video` element the millisecond it is born—even if it's hidden deeply inside nested React hooks or Shadow DOMs.

## 📦 Installation (Developer Mode)

1. Open Google Chrome and navigate to `chrome://extensions/`.
2. Toggle **Developer mode** on in the top right corner.
3. Click **Load unpacked** in the top left.
4. Select the `VelocityPrime` folder.
5. Pin the extension for quick access, and enjoy absolute video playback control.

---