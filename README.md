# Space Travel Simulator 3D

A sophisticated NASA Eyes-inspired 3D solar system visualization built with Three.js. This educational tool features real-time planetary positions, spacecraft tracking, and stunning visual effects - all running directly in your browser with no build process required.

![Three.js](https://img.shields.io/badge/Three.js-black?style=for-the-badge&logo=three.js&logoColor=white)
![JavaScript](https://img.shields.io/badge/javascript-%23323330.svg?style=for-the-badge&logo=javascript&logoColor=%23F7DF1E)
![HTML5](https://img.shields.io/badge/html5-%23E34F26.svg?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/css3-%231572B6.svg?style=for-the-badge&logo=css3&logoColor=white)

## 🚀 Key Features

### 🌍 Realistic Solar System
- **All 8 Planets**: High-resolution textures with accurate sizes and colors
- **Dwarf Planets**: Pluto, Eris, Makemake, Haumea, and Ceres
- **Ultra-Realistic Sun**: Dynamic surface granulation, sunspots, corona, and solar flares
- **Black Hole**: Sagittarius A* with ray-traced gravitational lensing
- **2000+ Asteroids**: Realistic asteroid belt between Mars and Jupiter
- **Moon Systems**: Major moons for Jupiter, Saturn, Uranus, and Neptune

### 🛸 NASA-Inspired Features
- **Real-Time Ephemeris**: Accurate planetary positions using VSOP87 theory
- **Time Controls**: Speed up or reverse time (-10M to +10M times real-time)
- **Spacecraft Tracking**: Voyager 1&2, New Horizons, JWST, Parker Solar Probe, and more
- **Mission Information**: Detailed panels for each spacecraft with real trajectories
- **Date Navigation**: Jump to any date to see historical or future positions

### 🎨 Advanced Visual Effects
- **Atmospheric Scattering**: Realistic Rayleigh/Mie scattering for all planets
- **Enhanced Ring Systems**: Detailed rings for Saturn, Jupiter, Uranus, and Neptune
- **Aurora Effects**: Dynamic aurora borealis/australis on Earth
- **Day/Night Cycle**: Real-time terminator with city lights on Earth's night side
- **Orbit Trails**: Visual trails showing planetary paths
- **Planet Labels**: Smart labels that always face the camera

### 🎮 Interactive Controls
- **Mouse Navigation**: Drag to rotate, scroll to zoom
- **Planet Navigation**: Click buttons or planets to travel
- **Cinematic Camera**: Preset camera tours and smooth transitions
- **Measurement Tools**: Distance and angle measurements
- **Toggle Controls**: Orbits, labels, trails, moons, asteroids, atmospheres
- **Performance Dashboard**: Real-time FPS and memory monitoring (Shift+F12)

### ⚡ Performance Features
- **LOD Texture System**: Automatic 2K/8K texture switching
- **Intelligent Caching**: Smart memory management
- **Object Pooling**: Efficient asteroid and particle rendering
- **Frustum Culling**: Only render visible objects
- **Adaptive Quality**: Performance-based quality adjustments

## 📦 Quick Start

### Prerequisites
- Modern web browser with WebGL support (Chrome recommended)
- Python 3.x or any HTTP server
- 8GB RAM recommended for best performance

### Installation

1. Clone the repository:
```bash
git clone https://github.com/contactabhishekbasu/Space-Travel-Simulator-3D.git
cd Space-Travel-Simulator-3D
```

2. Download planet textures (see `textures/README.md` for links)

3. Start local server:
```bash
# Mac/Linux
./start-server.sh

# Windows
start-server.bat

# Or manually
python3 -m http.server 8000
```

4. Open http://localhost:8000 in your browser

## 🎮 Controls & Usage

### Navigation
- **Left Click + Drag**: Rotate camera around target
- **Scroll Wheel**: Zoom in/out
- **Click Planet**: Show detailed NASA-style information panel
- **Navigation Buttons**: Quick travel to any celestial body

### Time Controls
- **Play/Pause**: Control time flow
- **Speed Slider**: -10M to +10M times real-time
- **NOW Button**: Return to current date/time
- **Date Picker**: Jump to any specific date

### Visual Toggles
- **Orbits**: Show/hide orbital paths
- **Labels**: Show/hide planet names
- **Trails**: Show/hide orbit trails
- **Moons**: Toggle moon systems
- **Asteroids**: Toggle asteroid belt
- **Spacecraft**: Show/hide missions
- **Atmospheres**: Toggle atmospheric effects

### Advanced Features
- **Scale Control**: Adjust visual scale (50-500 units per AU)
- **Travel Speed**: Control navigation speed (1x-100x)
- **Performance Dashboard**: Press Shift+F12 for detailed metrics
- **Cinematic Tours**: Automated camera sequences

## 🏗️ Architecture

### No Build Process
This project uses vanilla JavaScript and Three.js from CDN. No npm, webpack, or build steps required - just open and run!

### Modular Design
- **29+ JavaScript modules** organized by functionality
- **4,000+ lines** of core simulation logic
- **Event-driven architecture** for system communication
- **Global system access** via window objects

### Key Systems
- `space-simulator.js`: Main orchestrator and scene management
- `ephemeris-engine.js`: Real planetary position calculations
- `time-controls.js`: Time manipulation system
- `spacecraft-tracker.js`: Mission tracking and trajectories
- `performance-dashboard.js`: Performance monitoring
- `texture-manager.js`: Intelligent asset management

## 🛠️ Development

### Adding Celestial Bodies
1. Add entry to `celestialBodies` in `js/space-simulator.js`
2. Include NASA-style data (mass, diameter, temperature, etc.)
3. Add textures to `textures/low/` and `textures/high/`
4. Update navigation UI in `index.html`

### Adding Spacecraft
1. Add mission data to `js/spacecraft-tracker.js`
2. Define trajectory type and launch date
3. Mission appears automatically in spacecraft panel

### Performance Optimization
- Use Performance Dashboard (Shift+F12) to monitor
- Adjust quality settings based on device
- Enable/disable features for better FPS
- See `PERFORMANCE-OPTIMIZATIONS.md` for details

## 📚 Documentation

- `QUICKSTART.md`: Quick setup guide
- `CLAUDE.md`: Comprehensive development guide
- `TEST_CHECKLIST.md`: Testing procedures
- `textures/README.md`: Texture setup instructions
- `models/spacecraft/README.md`: 3D model guide

## 🌟 Educational Value

### Astronomy Concepts
- Solar system scale and distances
- Planetary motion and orbits
- Moon systems of gas giants
- Asteroid distribution
- Spacecraft trajectories

### Physics Demonstrations
- Orbital mechanics
- Time dilation visualization
- Gravitational effects
- Atmospheric scattering
- Day/night cycles

### Space Exploration
- Historic missions (Voyager, Apollo)
- Current missions (JWST, Parker Solar Probe)
- Future trajectories
- Interstellar space

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Test thoroughly (see `TEST_CHECKLIST.md`)
4. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- Three.js community for the excellent 3D library
- NASA for ephemeris data and inspiration
- Solar System Scope for texture resources
- Open source contributors

## 🔮 Roadmap

- [ ] WebXR/VR support
- [ ] Exoplanet systems
- [ ] Comet trajectories
- [ ] Real-time satellite positions
- [ ] Mission planning tools
- [ ] Educational quizzes
- [ ] Multiplayer exploration
- [ ] Mobile app version

---

Built with ❤️ for space education and exploration