# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Space Travel Simulator 3D is a browser-based 3D solar system visualization using Three.js. It's a single-page application with no build process required - a sophisticated NASA Eyes-inspired educational tool with 4,000+ lines of core logic and 29+ specialized JavaScript modules.

## Running the Project

```bash
# Mac/Linux
./start-server.sh

# Windows
start-server.bat

# Manual
python3 -m http.server 8000
# or
python server.py
```

Access at: http://localhost:8000

## Architecture

### **CRITICAL**: Module Loading Order
Scripts must be loaded in dependency order in `index.html`. Main orchestrator (`space-simulator.js`) loads LAST:
1. Three.js and loaders
2. Utility systems (blackhole-shader, planet-labels, etc.)
3. Core systems (ephemeris, time-controls, etc.)
4. Enhancement systems (atmosphere, rings, etc.)
5. Performance systems (optimization, texture-manager, etc.)
6. **Main orchestrator last** (`space-simulator.js`)

### Core Components

1. **js/space-simulator.js**: Main application orchestrator (4,037 lines)
   - Scene management (Three.js scene, camera, renderer)
   - System initialization with conditional loading and error handling
   - Global system integration via `window` objects
   - Event-driven architecture coordination
   - Animation loop with performance monitoring
   - All systems accessible globally (e.g., `window.ephemerisEngine`)

2. **Visual Enhancement Modules** (3,000+ lines):
   - **js/realistic-sun.js** (888 lines): Ultra-realistic sun with granulation, corona, flares
   - **js/blackhole-shader.js** (203 lines): Ray-traced black hole visualization
   - **js/atmosphere-system.js** (368 lines): Advanced atmospheric scattering with Rayleigh/Mie
   - **js/ring-systems.js** (353 lines): Enhanced planetary ring systems
   - **js/dwarf-planets-comets.js** (508 lines): Dwarf planets and comet system
   - **js/planet-labels.js**: Sprite-based labels that face camera
   - **js/orbit-trails.js**: Buffer geometry trails for orbits
   - **js/cinematic-camera.js**: Smooth camera movements and tours

3. **NASA Eyes-Inspired Systems** (2,000+ lines):
   - **js/ephemeris-engine.js** (401 lines): Real planetary positions using VSOP87 theory
   - **js/time-controls.js** (471 lines): Time manipulation (-10M to +10M speed)
   - **js/spacecraft-tracker.js** (484 lines): Active missions (Voyager, JWST, etc.)
   - **js/moon-systems.js** (402 lines): Major moons for gas giants with accurate orbits
   - **js/asteroid-belt.js** (394 lines): 2000+ asteroids with proper orbital mechanics

4. **Performance & UI Systems** (3,000+ lines):
   - **js/performance-dashboard.js** (1,276 lines): Comprehensive performance monitoring
   - **js/settings-panel.js** (713 lines): Advanced settings management
   - **js/info-panels.js** (1,210 lines): NASA-style information displays
   - **js/texture-manager.js** (343 lines): LOD texture system with caching
   - **js/measurement-tools.js** (648 lines): Scientific measurement capabilities

5. **Development & Enhancement** (2,000+ lines):
   - **js/spacecraft-models.js** (908 lines): 3D spacecraft model loading
   - Development tools: settings-debug.js, performance-monitor.js, memory-manager.js
   - Testing utilities: test-suite.js, settings-test.js

6. **Celestial Bodies Structure**:
   ```javascript
   celestialBodies = {
     bodyName: {
       name: "Display Name",
       position: new THREE.Vector3(x, y, z),
       size: radius,
       color: 0xHEXCOLOR,
       orbitRadius: AU_distance,
       orbitSpeed: radians_per_frame,
       info: "Brief description",
       educational: "Educational value",
       // NASA-style data:
       diameter: "km",
       mass: "kg",
       distanceFromSun: "km",
       orbitalPeriod: "days/years",
       temperature: "°C",
       atmosphere: "composition",
       description: "Detailed description"
     }
   }
   ```

7. **Texture System**:
   - Supports 2K (low) and 8K (high) resolutions via `textures/low/` and `textures/high/`
   - Runtime quality switching with intelligent caching
   - Memory management with automatic cleanup
   - Spacecraft models in `textures/spacecraft/`
   - Multi-format support (JPG, PNG, WebP) with fallbacks

### Development Patterns

#### **System Initialization Pattern**
All systems use conditional initialization with error handling:
```javascript
if (typeof SystemClass !== 'undefined') {
    try {
        window.systemInstance = new SystemClass(scene, camera, renderer);
        devLog.success('System initialized');
    } catch (error) {
        devLog.error('Failed to initialize system:', error);
    }
}
```

#### **Global System Access**
Major systems are accessible globally via `window`:
- `window.ephemerisEngine` - Planetary positions
- `window.timeControls` - Time manipulation  
- `window.spacecraftTracker` - Mission tracking
- `window.textureManager` - Asset management
- `window.performanceDashboard` - Performance monitoring

#### **Error Handling & Logging**
- Built-in `devLog` system with success/error/warning levels
- Console export functionality for debugging
- Graceful degradation when systems fail to load

### Key Features to Maintain

**Core Visual Features:**
- Earth day/night shader with city lights
- Moon orbiting Earth with accurate distance
- Aurora effects at Earth's poles
- Black hole (Sagittarius A*) with gravitational lensing shader
- Saturn's rings (basic implementation)
- Ultra-realistic sun with surface granulation, sunspots, corona, and solar flares
- Directional skybox with Milky Way on one side
- Atmospheric scattering for all planets

**NASA Eyes-Inspired Features:**
- Real-time planetary positions using ephemeris calculations
- Time controls with speed adjustment (-10M to +10M times real-time)
- Moon systems for Jupiter, Saturn, Uranus, Neptune
- Asteroid belt with 2000+ objects between Mars and Jupiter
- Spacecraft tracking (Voyager 1&2, New Horizons, JWST, etc.)
- Mission information panels
- Planetary atmosphere rendering with Rayleigh scattering

**User Interface:**
- Mouse drag to rotate camera, scroll wheel zoom
- Click planets for detailed NASA-style info panels
- Navigation buttons with visual planet icons
- Adjustable travel speed (1x-100x)
- Scale control (50-500 units per AU)
- Toggle controls for orbits, labels, trails, moons, asteroids, spacecraft, atmospheres
- Cinematic camera presets (overview, planet tour, sun dive)
- Time/date display with jump-to-date functionality
- Spacecraft mission panel

**Interactive Elements:**
- Planet labels that always face camera
- Orbit trails visualization
- Click detection for all celestial bodies
- Smooth camera transitions
- Dev mode console for debugging

### No Build Process

This project uses vanilla JavaScript and Three.js from CDN. There are no npm packages, webpack configs, or build steps. All code runs directly in the browser.

## Common Tasks

### Adding New Celestial Bodies
1. Add entry to `celestialBodies` object in js/space-simulator.js
2. Include all required properties including NASA-style data
3. Add texture files to `textures/low/` and `textures/high/`
4. Add navigation button in index.html
5. Style the button icon in css/styles.css
6. Add ephemeris data to ephemeris-engine.js if needed

### Adding New Spacecraft/Missions
1. Add mission data to `missions` object in spacecraft-tracker.js
2. Include launch date, status, trajectory type
3. Implement position calculation based on mission type
4. Mission will appear in spacecraft panel automatically

### Adding Moons
1. Add moon data to `moonData` object in moon-systems.js
2. Include radius, distance, orbital period, color
3. Moon will be created automatically for its parent planet

### Modifying Time System
- Time controls use ephemeris for accurate positions
- Fallback to simple orbital mechanics when time controls disabled
- Time scale ranges from -10M to +10M times real-time
- Custom date jumping supported

### UI Customization
- All controls in index.html
- Styles in css/styles.css
- Event handlers in space-simulator.js
- Time controls have their own UI component
- Spacecraft panel toggleable

### Mouse Controls
- Left click + drag: Rotate camera around target
- Scroll wheel: Zoom in/out
- Click on planet: Show NASA-style info panel
- Click on spacecraft in panel: Focus camera on it

### Toggle Controls
- Orbits: Show/hide orbital paths
- Labels: Show/hide planet names
- Trails: Show/hide orbit trails
- Moons: Show/hide moon systems
- Asteroids: Show/hide asteroid belt
- Spacecraft: Show/hide missions
- Atmospheres: Show/hide atmospheric effects

## Development Tools

### **Built-in Debug Console**
- Access via browser console or built-in UI
- `devLog.export()` - Export debug logs
- Performance metrics via Shift+F12
- Settings panel for runtime configuration

### **Testing Tools**
- **test-suite.js**: Automated feature testing in browser console
- **debug.html**: Dedicated debug page
- **Performance Dashboard**: Real-time metrics (Shift+F12)
- Manual testing checklist below

No automated tests exist. Test manually by:

### Basic Functionality
1. Running local server (python3 server.py)
2. All celestial bodies render with textures
3. Basic orbit animations work
4. Navigation buttons travel to correct locations
5. Mouse controls (drag, zoom, click)

### NASA Eyes Features
1. **Time Controls**:
   - Time display updates correctly
   - Play/pause works
   - Time scale slider changes speed appropriately
   - Jump to date functionality
   - NOW button returns to current time
   - Planets move to ephemeris-calculated positions

2. **Moon Systems**:
   - Jupiter's 4 Galilean moons visible and orbiting
   - Saturn's major moons including Titan
   - Moon labels appear when enabled
   - Moons toggle hides/shows all moons

3. **Asteroid Belt**:
   - 2000+ asteroids visible between Mars and Jupiter
   - Major asteroids (Ceres, Vesta, etc.) labeled
   - Asteroids toggle works
   - Performance remains acceptable

4. **Spacecraft Tracking**:
   - Spacecraft panel toggle button works
   - All missions listed with correct colors
   - Clicking mission focuses camera
   - Trajectories display correctly
   - Voyager probes heading to interstellar space

5. **Atmospheric Effects**:
   - Earth has blue atmospheric glow
   - Venus has thick yellow atmosphere
   - Mars has thin red atmosphere
   - Gas giants have appropriate atmospheres
   - Atmospheres toggle works

### Visual Quality
1. **Realistic Sun**:
   - Surface granulation visible
   - Sunspots appear and move
   - Corona layers animate
   - Solar flares erupt periodically
   - Prominences arc from surface

2. **Enhanced Effects**:
   - Planet info panels show NASA data
   - Cinematic camera movements smooth
   - Labels always face camera
   - Orbit trails work with time controls
   - Black hole gravitational lensing

### Performance
1. Frame rate remains above 30fps with all features
2. No memory leaks during extended use
3. Time acceleration doesn't cause stuttering
4. All toggles properly free/allocate resources

## Performance Architecture

### **Multi-layered Optimization**
1. **Texture LOD System**: 2K/8K resolution modes with runtime switching
2. **Object Pooling**: Asteroids and particle systems reuse geometry
3. **Frustum Culling**: Objects outside view are not rendered
4. **Memory Management**: Automatic cleanup and monitoring via memory-manager.js
5. **Adaptive Quality**: Systems adjust based on device performance

### **Performance Monitoring**
- Real-time FPS, memory usage, and render stats
- Performance dashboard accessible via Shift+F12
- Built-in performance alerts and optimization suggestions
- Export performance data for analysis

### **Memory Management**
- Texture caching with memory limits
- Automatic garbage collection triggers
- Resource cleanup on system disable
- Memory usage tracking and warnings

## Asset Organization

### **File Structure**
```
/textures/
  low/          # 2K resolution textures
  high/         # 8K resolution textures  
  spacecraft/   # 3D spacecraft models (STL/OBJ)
/js/            # All JavaScript modules (load order critical)
/css/           # Single stylesheet
/models/        # Additional 3D assets
```

### **Texture Loading Strategy**
- Progressive loading: Low-res first, high-res on demand
- Multi-format support with automatic fallbacks
- Caching with memory pressure detection
- Quality switching without reload