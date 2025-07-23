# 🚀 Space Travel Simulator 3D - Quick Start Guide

## ⚠️ Important: Web Server Required

Textures will NOT load if you open `index.html` directly in your browser due to security restrictions. You MUST run a local web server.

## 🏃 Quick Start (Choose ONE option)

### Option 1: Using Provided Scripts (Easiest)

**Windows:**
1. Double-click `start-server.bat`
2. Open browser to http://localhost:8000

**Mac/Linux:**
1. Run `./start-server.sh` in terminal
2. Open browser to http://localhost:8000

### Option 2: Python (Most Common)

```bash
# Python 3
python3 -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```

Then open: http://localhost:8000

### Option 3: Node.js

```bash
# If you have Node.js installed
npx http-server -p 8000
```

Then open: http://localhost:8000

### Option 4: Other Servers

- **PHP**: `php -S localhost:8000`
- **Ruby**: `ruby -run -ehttpd . -p8000`
- **VS Code**: Use "Live Server" extension

## 🎨 Setting Up Textures

1. Download textures from https://www.solarsystemscope.com/textures/
2. Place them in the correct folders:
   - 2K textures → `textures/low/`
   - 4K/8K textures → `textures/high/`
3. Use the Mode toggle (bottom right) to switch between Low/High quality

## 🎮 Controls

- **Arrow Keys**: Navigate camera (Up/Down: zoom, Left/Right: rotate)
- **Planet Buttons**: Travel to celestial bodies
- **Speed Slider**: Control travel speed
- **Scale Slider**: Adjust solar system scale
- **Orbit Toggle**: Show/hide planet orbits
- **Mode Toggle**: Switch between Low/High quality

## ❓ Troubleshooting

**"Textures not loading" error appears:**
- You're opening the file directly. Use a web server (see above).

**Console shows 404 errors for textures:**
- Textures haven't been downloaded yet
- Check that texture files are in `textures/low/` and `textures/high/`
- Verify file names match those in `textures/README.md`

**Performance issues:**
- Switch to "Low" mode for better performance
- Close other browser tabs
- Try a different browser (Chrome/Firefox recommended)