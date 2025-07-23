// Immediate console log to verify script is loading
console.log('space-simulator.js loading...');

// Global variables for Three.js objects
let scene, camera, renderer;

// Dev mode variables
let devMode = true; // Default to true
let devLogContainer;
let devLogContent;
let devLogs = []; // Store logs for local storage
window.devLogs = devLogs; // Make accessible globally for dashboard
let devConsoleAutoScroll = true; // Auto-scroll setting
let devConsoleDragState = { isDragging: false, startX: 0, startY: 0, startLeft: 0, startTop: 0 };

// Dev logging system
const devLog = {
    log: function(message, type = 'info') {
        const now = new Date();
        const timestamp = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}.${now.getMilliseconds().toString().padStart(3, '0')}`;
        
        // Store log entry
        const logEntry = {
            timestamp: timestamp,
            message: message,
            type: type,
            fullTime: now.toISOString()
        };
        devLogs.push(logEntry);
        
        // Keep only last 1000 logs
        if (devLogs.length > 1000) {
            devLogs = devLogs.slice(-1000);
        }
        
        // Update global reference
        window.devLogs = devLogs;
        
        // Save to localStorage
        try {
            localStorage.setItem('spaceSimDevLogs', JSON.stringify(devLogs));
        } catch (e) {
            console.warn('Failed to save logs to localStorage:', e);
        }
        
        if (!devMode || !devLogContent) return;
        
        const entry = document.createElement('div');
        entry.className = `dev-log-entry ${type}`;
        entry.innerHTML = `<span class="dev-log-timestamp">${timestamp}</span>${message}`;
        
        devLogContent.appendChild(entry);
        
        // Only auto-scroll if auto-scroll is enabled and user is near bottom
        if (devConsoleAutoScroll) {
            const isNearBottom = devLogContent.scrollTop >= devLogContent.scrollHeight - devLogContent.clientHeight - 50;
            if (isNearBottom) {
                devLogContent.scrollTop = devLogContent.scrollHeight;
            }
        }
        
        // Also log to console
        const consoleMethod = type === 'error' ? 'error' : type === 'warning' ? 'warn' : 'log';
        console[consoleMethod](`[${timestamp}] ${message}`);
    },
    
    success: function(message) {
        this.log(message, 'success');
    },
    
    error: function(message) {
        this.log(message, 'error');
    },
    
    warning: function(message) {
        this.log(message, 'warning');
    },
    
    info: function(message) {
        this.log(message, 'info');
    }
};

// Export dev logs function
function exportDevLogs() {
    const logsText = devLogs.map(entry => 
        `[${entry.fullTime}] [${entry.type.toUpperCase()}] ${entry.message}`
    ).join('\n');
    
    const blob = new Blob([logsText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `space-sim-logs-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    devLog.info('Dev logs exported to file');
}

// Get logs for analysis (can be called from console)
window.getSpaceSimLogs = function(filter = null) {
    const logs = devLogs;
    if (filter) {
        if (filter === 'errors') return logs.filter(l => l.type === 'error');
        if (filter === 'warnings') return logs.filter(l => l.type === 'warning');
        if (filter === 'success') return logs.filter(l => l.type === 'success');
        if (typeof filter === 'string') return logs.filter(l => l.message.includes(filter));
    }
    return logs;
};

// Get log summary
window.getLogSummary = function() {
    const summary = {
        total: devLogs.length,
        errors: devLogs.filter(l => l.type === 'error').length,
        warnings: devLogs.filter(l => l.type === 'warning').length,
        success: devLogs.filter(l => l.type === 'success').length,
        info: devLogs.filter(l => l.type === 'info').length,
        lastError: devLogs.filter(l => l.type === 'error').slice(-1)[0],
        lastWarning: devLogs.filter(l => l.type === 'warning').slice(-1)[0]
    };
    console.table(summary);
    return summary;
};

// Initialize Three.js scene after DOM is loaded
function initializeScene() {
    devLog.info('Initializing Three.js scene...');
    
    scene = new THREE.Scene();
    window.scene = scene; // Make globally accessible
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100000);
    window.camera = camera; // Make globally accessible
    const canvas = document.getElementById('canvas');
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
    window.renderer = renderer; // Make globally accessible
    renderer.setSize(window.innerWidth, window.innerHeight);
    
    devLog.success('Scene, camera, and renderer created');
    
    // Initialize all global systems
    window.planetLabels = null;
    window.orbitTrails = null;
    window.sunEffects = null;
    window.realisticSun = null;
    window.cinematicCamera = null;
    window.infoPanels = null;
    window.ephemerisEngine = null;
    window.timeControls = null;
    window.moonSystems = null;
    window.asteroidBelt = null;
    window.spacecraftTracker = null;
    window.atmosphereSystem = null;
    window.settingsPanel = null;
    
    if (typeof PlanetLabels !== 'undefined') {
        window.planetLabels = new PlanetLabels(scene, camera);
        devLog.success('Planet labels system initialized');
    }
    if (typeof OrbitTrails !== 'undefined') {
        window.orbitTrails = new OrbitTrails(scene);
        devLog.success('Orbit trails system initialized');
    }
    if (typeof CinematicCamera !== 'undefined') {
        window.cinematicCamera = new CinematicCamera(camera, scene);
        devLog.success('Cinematic camera system initialized');
    }
    if (typeof SimpleInfoPanels !== 'undefined') {
        try {
            window.infoPanels = new SimpleInfoPanels();
            devLog.success('Simple info panels system initialized');
        } catch (error) {
            devLog.error('Failed to initialize simple info panels system:', error);
            console.error('SimpleInfoPanels initialization error:', error);
        }
    }
    
    // Initialize new NASA-inspired systems
    if (typeof EphemerisEngine !== 'undefined') {
        try {
            window.ephemerisEngine = new EphemerisEngine();
            devLog.success('Ephemeris engine initialized');
        } catch (error) {
            devLog.error('Failed to initialize ephemeris engine:', error);
            console.error('EphemerisEngine initialization error:', error);
        }
    }
    
    if (typeof TimeControls !== 'undefined' && window.ephemerisEngine) {
        window.timeControls = new TimeControls(window.ephemerisEngine);
        devLog.success('Time controls initialized');
    }
    
    if (typeof MoonSystems !== 'undefined') {
        window.moonSystems = new MoonSystems(scene);
        devLog.success('Moon systems initialized');
    }
    
    if (typeof AsteroidBelt !== 'undefined') {
        // Asteroid belt between Mars and Jupiter (2.2 - 3.2 AU)
        window.asteroidBelt = new AsteroidBelt(scene, 2.2, 3.2);
        devLog.success('Asteroid belt initialized');
    }
    
    if (typeof SpacecraftTracker !== 'undefined') {
        try {
            window.spacecraftTracker = new SpacecraftTracker(scene);
            devLog.success('Spacecraft tracker initialized');
        } catch (error) {
            devLog.error('Failed to initialize spacecraft tracker:', error);
            console.error('SpacecraftTracker initialization error:', error);
        }
    }
    
    if (typeof AtmosphereSystem !== 'undefined') {
        try {
            window.atmosphereSystem = new AtmosphereSystem();
            devLog.success('Atmosphere system initialized');
        } catch (error) {
            devLog.error('Failed to initialize atmosphere system:', error);
            console.error('AtmosphereSystem initialization error:', error);
        }
    }
    
    // Initialize measurement tools
    if (typeof MeasurementTools !== 'undefined') {
        try {
            window.measurementTools = new MeasurementTools(scene, camera, renderer);
            devLog.success('Measurement tools initialized');
        } catch (error) {
            devLog.error('Failed to initialize measurement tools:', error);
            console.error('MeasurementTools initialization error:', error);
        }
    }
    
    // Initialize enhanced ring systems
    if (typeof RingSystems !== 'undefined') {
        try {
            window.ringSystems = new RingSystems(scene);
            devLog.success('Enhanced ring systems initialized');
        } catch (error) {
            devLog.error('Failed to initialize ring systems:', error);
            console.error('RingSystems initialization error:', error);
        }
    }
    
    // Initialize dwarf planets and comets
    if (typeof DwarfPlanetsComets !== 'undefined') {
        try {
            window.dwarfPlanetsComets = new DwarfPlanetsComets(scene);
            devLog.success('Dwarf planets and comets system initialized');
        } catch (error) {
            devLog.error('Failed to initialize dwarf planets and comets:', error);
            console.error('DwarfPlanetsComets initialization error:', error);
        }
    }
    
    // Settings panel is auto-initialized by settings-panel.js
    devLog.info('Settings panel will be auto-initialized by settings-panel.js');
    
    // Initialize performance optimization systems
    if (typeof OptimizationUtils !== 'undefined') {
        try {
            window.optimizationUtils = new OptimizationUtils();
            window.optimizationUtils.exportGlobalUtils();
            devLog.success('Optimization utilities initialized');
        } catch (error) {
            devLog.error('Failed to initialize optimization utilities:', error);
            console.error('OptimizationUtils initialization error:', error);
        }
    }
    
    if (typeof TextureManager !== 'undefined') {
        try {
            window.textureManager = new TextureManager();
            devLog.success('Texture manager initialized');
        } catch (error) {
            devLog.error('Failed to initialize texture manager:', error);
            console.error('TextureManager initialization error:', error);
        }
    }
    
    if (typeof PerformanceMonitor !== 'undefined') {
        try {
            window.performanceMonitor = new PerformanceMonitor();
            devLog.success('Performance monitor initialized');
        } catch (error) {
            devLog.error('Failed to initialize performance monitor:', error);
            console.error('PerformanceMonitor initialization error:', error);
        }
    }
    
    if (typeof MemoryManager !== 'undefined') {
        try {
            window.memoryManager = new MemoryManager();
            devLog.success('Memory manager initialized');
        } catch (error) {
            devLog.error('Failed to initialize memory manager:', error);
            console.error('MemoryManager initialization error:', error);
        }
    }
    
    // Show performance optimization notification
    setTimeout(() => {
        if (window.dashboardController) {
            window.dashboardController.showNotification(
                '🚀 Performance optimizations active! Press Shift+F12 to open dashboard', 
                'info'
            );
        }
    }, 3000); // Show after 3 seconds
    
    // Add enhanced lighting for realistic sun
    // Ambient light - dimmer to allow sun to be the primary light source
    ambientLight = new THREE.AmbientLight(0x1a1a1a);
    scene.add(ambientLight);
    
    // Main sun point light - stronger and warmer
    pointLight = new THREE.PointLight(0xfff5e6, 3, 50000);
    pointLight.position.set(0, 0, 0);
    pointLight.castShadow = true;
    pointLight.shadow.mapSize.width = 2048;
    pointLight.shadow.mapSize.height = 2048;
    pointLight.shadow.camera.near = 0.5;
    pointLight.shadow.camera.far = 5000;
    scene.add(pointLight);
    
    // Add secondary fill light to simulate scattered light
    fillLight = new THREE.PointLight(0xffeedd, 0.5, 30000);
    fillLight.position.set(0, 0, 0);
    scene.add(fillLight);
    
    // Enable shadows if performance allows
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    devLog.success('Lighting added');
    
    // Camera positioning - start in free camera mode
    camera.position.set(200, 100, 200);
    camera.lookAt(0, 0, 0); // Look at the center of the solar system
    
    // Initialize camera system for free movement
    cameraFollowTarget = null; // Start with no target (free camera mode)
    cameraLookAtTarget.set(0, 0, 0); // Look at center
    manualCameraControl = false; // Allow user to take control
    
    devLog.success('Scene initialization complete - Free camera mode active');
    
    // Initialize advanced camera system
    CameraController.init();
    
    // Set initial camera mode display after a brief delay to ensure DOM is ready
    setTimeout(updateCameraModeDisplay, 100);
}

// Global lighting variables
let ambientLight, pointLight, fillLight;

// Skybox system with dual textures (stars and milky way)
let skyboxGroup = null;
let starsHemisphere = null;
let milkyWayHemisphere = null;

// Earth shader for day/night cycle
const earthVertexShader = `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vPosition;
    varying vec3 vViewPosition;
    
    void main() {
        vUv = uv;
        vNormal = normalize(normalMatrix * normal);
        vPosition = (modelMatrix * vec4(position, 1.0)).xyz;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        vViewPosition = -mvPosition.xyz;
        gl_Position = projectionMatrix * mvPosition;
    }
`;

const earthFragmentShader = `
    uniform sampler2D dayTexture;
    uniform sampler2D nightTexture;
    uniform sampler2D normalMap;
    uniform sampler2D specularMap;
    uniform sampler2D cloudsTexture;
    uniform vec3 sunDirection;
    
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vPosition;
    varying vec3 vViewPosition;
    
    void main() {
        // Calculate sun angle for day/night transition
        vec3 normal = normalize(vNormal);
        
        // Apply normal map if available
        #ifdef USE_NORMALMAP
            vec3 normalTex = texture2D(normalMap, vUv).xyz * 2.0 - 1.0;
            normal = normalize(normal + normalTex * 0.5);
        #endif
        
        float sunAngle = dot(normal, normalize(sunDirection));
        float dayAmount = smoothstep(-0.1, 0.1, sunAngle);
        
        // Sample textures
        vec4 dayColor = texture2D(dayTexture, vUv);
        vec4 nightColor = texture2D(nightTexture, vUv);
        
        // Mix day and night
        vec3 color = mix(nightColor.rgb, dayColor.rgb, dayAmount);
        
        // Add specular highlights for water
        #ifdef USE_SPECULARMAP
            float specular = texture2D(specularMap, vUv).r;
            if (specular > 0.0 && dayAmount > 0.0) {
                vec3 viewDir = normalize(vViewPosition);
                vec3 reflectDir = reflect(-normalize(sunDirection), normal);
                float spec = pow(max(dot(viewDir, reflectDir), 0.0), 32.0);
                color += vec3(spec * specular * dayAmount * 0.5);
            }
        #endif
        
        // Apply basic lighting
        float ambient = 0.3;
        float diffuse = max(0.0, sunAngle) * 0.7;
        color *= (ambient + diffuse);
        
        gl_FragColor = vec4(color, 1.0);
    }
`;

// Function to create the skybox with directional textures
async function createSkybox() {
    // Remove old skybox if it exists
    if (skyboxGroup) {
        scene.remove(skyboxGroup);
        // Dispose of old materials and geometries
        skyboxGroup.traverse((child) => {
            if (child.geometry) child.geometry.dispose();
            if (child.material) {
                if (child.material.map) child.material.map.dispose();
                child.material.dispose();
            }
        });
    }
    
    skyboxGroup = new THREE.Group();
    window.skyboxGroup = skyboxGroup; // Make globally accessible
    const skyboxRadius = 50000;
    
    // Load textures based on mode with better fallbacks
    const starsTexture = await loadLocalTexture('stars', 
        'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/cube/MilkyWay/dark-s_px.jpg');
    const milkyWayTexture = await loadLocalTexture('stars_milky_way', 
        'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/cube/MilkyWay/dark-s_nx.jpg');
    
    if (starsTexture && milkyWayTexture) {
        // Create a custom shader for directional skybox
        const skyboxVertexShader = `
            varying vec3 vWorldPosition;
            varying vec2 vUv;
            
            void main() {
                vUv = uv;
                vec4 worldPosition = modelMatrix * vec4(position, 1.0);
                vWorldPosition = worldPosition.xyz;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `;
        
        const skyboxFragmentShader = `
            uniform sampler2D starsMap;
            uniform sampler2D milkyWayMap;
            uniform vec3 cameraPos;
            varying vec3 vWorldPosition;
            varying vec2 vUv;
            
            void main() {
                // Calculate direction vector
                vec3 direction = normalize(vWorldPosition - cameraPos);
                
                // Define the Milky Way plane
                // The galactic plane is tilted about 60 degrees from the solar system plane
                vec3 galacticNormal = normalize(vec3(0.0, 0.866, 0.5)); // 60 degree tilt
                
                // Calculate distance from the galactic plane
                float distFromPlane = abs(dot(direction, galacticNormal));
                
                // Create Milky Way band with smooth falloff
                float milkyWayIntensity = 1.0 - smoothstep(0.0, 0.25, distFromPlane);
                
                // Add variation along the Milky Way band
                // Project direction onto galactic plane
                vec3 galacticDir = normalize(direction - galacticNormal * dot(direction, galacticNormal));
                float galacticAngle = atan(galacticDir.z, galacticDir.x);
                
                // Create density variations in the Milky Way
                float density = 0.5 + 0.5 * sin(galacticAngle * 3.0);
                density *= 0.7 + 0.3 * sin(galacticAngle * 7.0 + 2.0);
                milkyWayIntensity *= density;
                
                // Sample textures
                vec4 stars = texture2D(starsMap, vUv);
                vec4 milkyWay = texture2D(milkyWayMap, vUv);
                
                // Create base starfield
                vec3 finalColor = stars.rgb;
                
                // Add Milky Way where visible
                if (milkyWayIntensity > 0.01) {
                    // Mix in the Milky Way texture
                    vec3 milkyColor = milkyWay.rgb * 1.2;
                    
                    // Add a subtle color gradient to the Milky Way
                    milkyColor *= mix(
                        vec3(1.0, 0.9, 0.8),  // Warm center
                        vec3(0.8, 0.85, 1.0), // Cool edges
                        distFromPlane
                    );
                    
                    finalColor += milkyColor * milkyWayIntensity;
                }
                
                // Add overall color grading
                finalColor *= vec3(0.95, 0.95, 1.0); // Slight blue tint for space
                
                // Ensure we don't oversaturate
                finalColor = clamp(finalColor, 0.0, 1.0);
                
                gl_FragColor = vec4(finalColor, 1.0);
            }
        `;
        
        // Create skybox with custom shader
        const skyboxMaterial = new THREE.ShaderMaterial({
            uniforms: {
                starsMap: { value: starsTexture },
                milkyWayMap: { value: milkyWayTexture },
                cameraPos: { value: camera.position }
            },
            vertexShader: skyboxVertexShader,
            fragmentShader: skyboxFragmentShader,
            side: THREE.BackSide,
            fog: false
        });
        
        const skyboxGeometry = new THREE.SphereGeometry(skyboxRadius, 128, 64);
        const skybox = new THREE.Mesh(skyboxGeometry, skyboxMaterial);
        skyboxGroup.add(skybox);
        
        // Store reference to update camera position
        skyboxGroup.userData.skyboxMaterial = skyboxMaterial;
        
        devLog.success('Created directional skybox with Milky Way band');
    } else if (starsTexture || milkyWayTexture) {
        // Fallback to single texture
        const material = new THREE.MeshBasicMaterial({
            map: starsTexture || milkyWayTexture,
            side: THREE.BackSide,
            fog: false
        });
        const sphere = new THREE.Mesh(new THREE.SphereGeometry(skyboxRadius, 128, 64), material);
        skyboxGroup.add(sphere);
        devLog.warning('Using single texture for skybox');
    } else {
        // Create procedural starfield as last fallback
        const canvas = document.createElement('canvas');
        canvas.width = 2048;
        canvas.height = 1024;
        const ctx = canvas.getContext('2d');
        
        // Black background
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Add stars
        for (let i = 0; i < 2000; i++) {
            const x = Math.random() * canvas.width;
            const y = Math.random() * canvas.height;
            const size = Math.random() * 2;
            const brightness = Math.random() * 0.8 + 0.2;
            
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${brightness})`;
            ctx.fill();
        }
        
        // Add Milky Way band
        ctx.save();
        ctx.globalAlpha = 0.3;
        const gradient = ctx.createLinearGradient(0, canvas.height * 0.4, 0, canvas.height * 0.6);
        gradient.addColorStop(0, 'transparent');
        gradient.addColorStop(0.5, '#ffffff');
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.restore();
        
        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.MeshBasicMaterial({
            map: texture,
            side: THREE.BackSide,
            fog: false
        });
        const sphere = new THREE.Mesh(new THREE.SphereGeometry(skyboxRadius, 128, 64), material);
        skyboxGroup.add(sphere);
        devLog.info('Created procedural skybox');
    }
    
    scene.add(skyboxGroup);
    devLog.success('Skybox created');
}

// Skybox will be initialized after DOM is loaded

// Texture loader with error handling
const textureLoader = new THREE.TextureLoader();
textureLoader.crossOrigin = 'anonymous';

// Helper function to load textures with fallback
function loadTexture(url, fallbackColor) {
    return new Promise((resolve) => {
        textureLoader.load(
            url,
            (texture) => {
                devLog.success(`TextureLoader: Successfully loaded ${url}`);
                console.log('TextureLoader: Texture dimensions:', texture.image.width + 'x' + texture.image.height);
                resolve(texture);
            },
            (progress) => {
                if (progress.lengthComputable) {
                    const percent = Math.round((progress.loaded / progress.total) * 100);
                    if (percent % 25 === 0) { // Log every 25%
                        console.log(`TextureLoader: Loading ${url} - ${percent}%`);
                    }
                }
            },
            (error) => {
                devLog.error(`TextureLoader: Failed to load ${url} - ${error.message || error}`);
                console.error('TextureLoader: Full error details:', error);
                resolve(null);
            }
        );
    });
}

// Check if running from file:// protocol
const isFileProtocol = window.location.protocol === 'file:';
if (isFileProtocol) {
    console.warn('⚠️ Running from file:// protocol. Textures cannot load due to browser security restrictions.');
    console.warn('\n📝 To fix this, you need to run a local web server:\n');
    console.warn('Option 1: Python (if installed)');
    console.warn('  - Windows: Double-click start-server.bat');
    console.warn('  - Mac/Linux: Run ./start-server.sh');
    console.warn('\nOption 2: Command line');
    console.warn('  - Python 3: python3 -m http.server 8000');
    console.warn('  - Python 2: python -m SimpleHTTPServer 8000');
    console.warn('  - Node.js: npx http-server -p 8000');
    console.warn('\nThen open: http://localhost:8000');
    
    // Add visible warning to the page
    const warning = document.createElement('div');
    warning.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: rgba(255,0,0,0.9); color: white; padding: 20px; border-radius: 10px; font-family: Arial; z-index: 10000; text-align: center; max-width: 500px;';
    warning.innerHTML = '<h2>⚠️ Textures Not Loading</h2><p>You\'re viewing this file directly in your browser. Textures require a web server to load.</p><p><strong>Quick Fix:</strong></p><ol style="text-align: left;"><li>Open terminal/command prompt in this folder</li><li>Run: <code style="background: black; padding: 2px 5px;">python -m http.server 8000</code></li><li>Open: <a href="http://localhost:8000" style="color: yellow;">http://localhost:8000</a></li></ol>';
    document.body.appendChild(warning);
}

// Helper function to try loading a texture from a specific path
function tryLoadTexture(path) {
    return new Promise((resolve) => {
        // Skip .tif files as browsers can't load them directly
        if (path.endsWith('.tif')) {
            devLog.warning(`Skipping .tif file (not supported in browser): ${path}`);
            resolve(null);
            return;
        }
        
        textureLoader.load(
            path,
            (texture) => {
                devLog.success(`Loaded texture: ${path}`);
                resolve(texture);
            },
            undefined,
            (error) => {
                devLog.warning(`Failed to load: ${path}`);
                resolve(null); // Return null on failure, don't reject
            }
        );
    });
}

// Helper function to load local texture with multi-resolution fallback
async function loadLocalTexture(textureKey, fallbackUrl) {
    // If running from file protocol, skip to online fallback
    if (isFileProtocol) {
        console.warn(`Skipping local textures due to file:// protocol`);
        if (fallbackUrl) {
            return await loadTexture(fallbackUrl);
        }
        return null;
    }
    
    devLog.info(`Loading texture: ${textureKey} for ${simulationMode} mode`);
    
    // Build list of paths to try based on mode
    const pathsToTry = [];
    
    // Determine file extension
    let ext = '.jpg';
    if (textureKey === 'saturnRing') ext = '.png';
    else if (textureKey === 'earthNormal' || textureKey === 'earthSpecular') ext = '.tif';
    
    if (simulationMode === 'high') {
        // For high mode, try: 8K → 4K → 2K → online
        pathsToTry.push(`textures/high/8k_${textureKey}${ext}`);
        pathsToTry.push(`textures/high/4k_${textureKey}${ext}`);
        pathsToTry.push(`textures/low/2k_${textureKey}${ext}`);
        
        // Handle special cases
        if (textureKey === 'earth') {
            pathsToTry[0] = 'textures/high/8k_earth_daymap.jpg';
            pathsToTry[1] = 'textures/high/4k_earth_daymap.jpg';
            pathsToTry[2] = 'textures/low/2k_earth_daymap.jpg';
        } else if (textureKey === 'earthClouds') {
            pathsToTry[0] = 'textures/high/8k_earth_clouds.jpg';
            pathsToTry[1] = 'textures/high/4k_earth_clouds.jpg';
            pathsToTry[2] = 'textures/low/2k_earth_clouds.jpg';
        } else if (textureKey === 'earthNight') {
            pathsToTry[0] = 'textures/high/8k_earth_nightmap.jpg';
            pathsToTry[1] = 'textures/high/4k_earth_nightmap.jpg';
            pathsToTry[2] = 'textures/low/2k_earth_nightmap.jpg';
        } else if (textureKey === 'venus') {
            pathsToTry[0] = 'textures/high/8k_venus_surface.jpg';
            pathsToTry[1] = 'textures/high/4k_venus_surface.jpg';
            pathsToTry[2] = 'textures/low/2k_venus_surface.jpg';
        } else if (textureKey === 'saturnRing') {
            pathsToTry[0] = 'textures/high/8k_saturn_ring_alpha.png';
            pathsToTry[1] = 'textures/high/4k_saturn_ring_alpha.png';
            pathsToTry[2] = 'textures/low/2k_saturn_ring_alpha.png';
        } else if (textureKey === 'stars') {
            pathsToTry[0] = 'textures/high/8k_stars.jpg';
            pathsToTry[1] = 'textures/high/4k_stars.jpg';
            pathsToTry[2] = 'textures/low/2k_stars.jpg';
        } else if (textureKey === 'stars_milky_way') {
            pathsToTry[0] = 'textures/high/8k_stars_milky_way.jpg';
            pathsToTry[1] = 'textures/high/4k_stars_milky_way.jpg';
            pathsToTry[2] = 'textures/low/2k_stars_milky_way.jpg';
        } else if (textureKey === 'earthNormal') {
            pathsToTry[0] = 'textures/high/8k_earth_normal_map.tif';
            pathsToTry[1] = 'textures/high/4k_earth_normal_map.tif';
            pathsToTry[2] = 'textures/low/2k_earth_normal_map.tif';
        } else if (textureKey === 'earthSpecular') {
            pathsToTry[0] = 'textures/high/8k_earth_specular_map.tif';
            pathsToTry[1] = 'textures/high/4k_earth_specular_map.tif';
            pathsToTry[2] = 'textures/low/2k_earth_specular_map.tif';
        } else if (textureKey === 'uranus') {
            // Uranus only has 2k texture available
            pathsToTry = ['textures/low/2k_uranus.jpg'];
        } else if (textureKey === 'neptune') {
            // Neptune only has 2k texture available
            pathsToTry = ['textures/low/2k_neptune.jpg'];
        }
    } else {
        // For low mode, try: 2K → online
        pathsToTry.push(`textures/low/2k_${textureKey}${ext}`);
        
        // Handle special cases
        if (textureKey === 'earth') {
            pathsToTry[0] = 'textures/low/2k_earth_daymap.jpg';
        } else if (textureKey === 'earthClouds') {
            pathsToTry[0] = 'textures/low/2k_earth_clouds.jpg';
        } else if (textureKey === 'earthNight') {
            pathsToTry[0] = 'textures/low/2k_earth_nightmap.jpg';
        } else if (textureKey === 'venus') {
            pathsToTry[0] = 'textures/low/2k_venus_surface.jpg';
        } else if (textureKey === 'saturnRing') {
            pathsToTry[0] = 'textures/low/2k_saturn_ring_alpha.png';
        } else if (textureKey === 'stars') {
            pathsToTry[0] = 'textures/low/2k_stars.jpg';
        } else if (textureKey === 'stars_milky_way') {
            pathsToTry[0] = 'textures/low/2k_stars_milky_way.jpg';
        } else if (textureKey === 'earthNormal') {
            pathsToTry[0] = 'textures/low/2k_earth_normal_map.tif';
        } else if (textureKey === 'earthSpecular') {
            pathsToTry[0] = 'textures/low/2k_earth_specular_map.tif';
        }
    }
    
    // Try each path in order
    for (const path of pathsToTry) {
        devLog.info(`Trying: ${path}`);
        const texture = await tryLoadTexture(path);
        if (texture) {
            devLog.success(`✓ Loaded: ${path}`);
            return texture;
        } else {
            devLog.warning(`✗ Failed: ${path}`);
        }
    }
    
    // If all local attempts failed, try online fallback
    if (fallbackUrl) {
        devLog.warning(`Falling back to online texture for ${textureKey}`);
        return await loadTexture(fallbackUrl);
    }
    
    devLog.error(`No texture found for ${textureKey}`);
    return null;
}

// Scale factor: 1 AU (Astronomical Unit) = 100 units in our scene
let AU_SCALE = 100;

// Realistic size ratios (compared to Sun = 20 units)
const SIZE_RATIOS = {
    sun: 1.0,
    mercury: 0.0035,
    venus: 0.0087,
    earth: 0.0092,
    moon: 0.0025,
    mars: 0.0049,
    jupiter: 0.1,
    saturn: 0.084,
    uranus: 0.036,
    neptune: 0.035
};

// Base size for the Sun
const SUN_SIZE = 20;

// Celestial bodies data with realistic distances and orbital data
const celestialBodies = {
    blackhole: {
        name: "Sagittarius A*",
        position: new THREE.Vector3(-10000, 500, -10000), // Fixed position - no orbit
        size: 50, // Larger size to be visible from far away
        color: 0x000000,
        emissive: 0x400040,
        info: "The supermassive black hole at the center of our Milky Way galaxy. Mass: 4 million times our Sun. Distance from Earth: 26,000 light-years. This cosmic giant warps spacetime itself!",
        educational: "Black holes teach us about extreme gravity, general relativity, and the limits of physics.",
        // NASA-style data
        diameter: "44 million km",
        mass: "4.154 million solar masses",
        distanceFromSun: "26,000 light-years",
        type: "Supermassive Black Hole",
        description: "A supermassive black hole at the center of the Milky Way, discovered through observations of stellar orbits. Its immense gravity shapes the entire galaxy."
        // No orbitRadius or orbitSpeed - black hole is stationary
    },
    sun: {
        name: "The Sun",
        position: new THREE.Vector3(0, 0, 0),
        size: SUN_SIZE,
        color: 0xffff00,
        emissive: 0xffaa00,
        info: "Our star, a G-type main-sequence star. Temperature: 5,778 K surface. Age: 4.6 billion years. Contains 99.86% of the Solar System's mass.",
        educational: "Understanding the Sun helps us learn about nuclear fusion, stellar evolution, and energy production.",
        // NASA-style data
        diameter: "1.39 million km",
        mass: "1.989 × 10³⁰ kg",
        temperature: "5,778 K (surface)",
        age: "4.6 billion years",
        composition: "73% Hydrogen, 25% Helium",
        description: "Our nearest star, the Sun is a G-type main-sequence star that formed approximately 4.6 billion years ago. It contains 99.86% of the Solar System's mass and is the source of Earth's energy."
    },
    mercury: {
        name: "Mercury",
        position: new THREE.Vector3(0.39 * AU_SCALE, 0, 0), // 0.39 AU from Sun
        size: SUN_SIZE * SIZE_RATIOS.mercury,
        color: 0x8b7355,
        orbitRadius: 0.39,
        orbitSpeed: 0.004, // Fastest orbit
        info: "The smallest planet and closest to the Sun. Day length: 59 Earth days. No atmosphere. Temperature: -173°C to 427°C.",
        educational: "Mercury demonstrates extreme temperature variations and the effects of minimal atmosphere.",
        // NASA-style data
        diameter: "4,879 km",
        mass: "3.285 × 10²³ kg",
        density: "5.427 g/cm³",
        gravity: "3.7 m/s²",
        distanceFromSun: "57.9 million km",
        orbitalPeriod: "88 Earth days",
        rotationPeriod: "59 Earth days",
        moons: "0",
        temperature: "-173°C to 427°C",
        atmosphere: "Trace amounts",
        description: "The smallest planet in our solar system and nearest to the Sun, Mercury is only slightly larger than Earth's Moon. Its surface is covered with craters and has extreme temperature variations."
    },
    venus: {
        name: "Venus",
        position: new THREE.Vector3(0.72 * AU_SCALE, 0, 0), // 0.72 AU from Sun
        size: SUN_SIZE * SIZE_RATIOS.venus,
        color: 0xffd700,
        orbitRadius: 0.72,
        orbitSpeed: 0.0015,
        info: "The hottest planet due to greenhouse effect. Atmosphere: 96.5% CO2. Surface pressure: 90x Earth's. Rotates backwards.",
        educational: "Venus is a perfect example of runaway greenhouse effect - crucial for climate science education.",
        // NASA-style data
        diameter: "12,104 km",
        mass: "4.867 × 10²⁴ kg",
        density: "5.243 g/cm³",
        gravity: "8.87 m/s²",
        distanceFromSun: "108.2 million km",
        orbitalPeriod: "225 Earth days",
        rotationPeriod: "243 Earth days (retrograde)",
        moons: "0",
        temperature: "462°C (average)",
        atmosphere: "96.5% CO₂, 3.5% N₂",
        description: "Venus is the second planet from the Sun and the hottest planet in our solar system. Its thick atmosphere traps heat in a runaway greenhouse effect, making it even hotter than Mercury."
    },
    earth: {
        name: "Earth",
        position: new THREE.Vector3(1.0 * AU_SCALE, 0, 0), // 1.0 AU from Sun (definition of AU)
        size: SUN_SIZE * SIZE_RATIOS.earth,
        color: 0x0066cc,
        orbitRadius: 1.0,
        orbitSpeed: 0.001,
        info: "Our home planet. The only known planet with life. 71% water coverage. Perfect distance from Sun for liquid water. Has one natural satellite: the Moon.",
        educational: "Earth sciences encompass geology, meteorology, oceanography, and environmental studies.",
        // NASA-style data
        diameter: "12,742 km",
        mass: "5.972 × 10²⁴ kg",
        density: "5.514 g/cm³",
        gravity: "9.8 m/s²",
        distanceFromSun: "149.6 million km",
        orbitalPeriod: "365.25 days",
        rotationPeriod: "23h 56m 4s",
        moons: "1 (The Moon)",
        temperature: "15°C (average)",
        atmosphere: "78% N₂, 21% O₂",
        description: "Earth is the third planet from the Sun and the only astronomical object known to harbor life. About 71% of Earth's surface is covered with water, mostly by oceans."
    },
    moon: {
        name: "The Moon",
        position: new THREE.Vector3(1.0 * AU_SCALE, 0, 0), // Will be updated dynamically
        size: SUN_SIZE * SIZE_RATIOS.moon,
        color: 0xaaaaaa,
        info: "Earth's only natural satellite. Formed 4.5 billion years ago. Responsible for ocean tides. Distance from Earth: 384,400 km.",
        educational: "The Moon teaches us about tidal forces, orbital mechanics, and the history of our solar system.",
        // NASA-style data
        diameter: "3,474.8 km",
        mass: "7.342 × 10²² kg",
        density: "3.344 g/cm³",
        gravity: "1.62 m/s²",
        distanceFromEarth: "384,400 km (average)",
        orbitalPeriod: "27.3 days",
        rotationPeriod: "27.3 days (tidally locked)",
        temperature: "-173°C to 127°C",
        atmosphere: "Trace amounts",
        description: "The Moon is Earth's only natural satellite and the fifth largest moon in the solar system. It formed about 4.5 billion years ago and is responsible for Earth's tides."
    },
    mars: {
        name: "Mars",
        position: new THREE.Vector3(1.52 * AU_SCALE, 0, 0), // 1.52 AU from Sun
        size: SUN_SIZE * SIZE_RATIOS.mars,
        color: 0xcd5c5c,
        orbitRadius: 1.52,
        orbitSpeed: 0.00053,
        info: "The Red Planet. Has the largest volcano (Olympus Mons) and canyon (Valles Marineris) in the solar system. Two moons: Phobos and Deimos.",
        educational: "Mars exploration teaches robotics, astrobiology, and potential human colonization challenges.",
        // NASA-style data
        diameter: "6,779 km",
        mass: "6.4171 × 10²³ kg",
        density: "3.933 g/cm³",
        gravity: "3.71 m/s²",
        distanceFromSun: "227.9 million km",
        orbitalPeriod: "687 Earth days",
        rotationPeriod: "24h 37m",
        moons: "2 (Phobos, Deimos)",
        temperature: "-63°C (average)",
        atmosphere: "95% CO₂, 3% N₂, 2% Ar",
        description: "Mars is the fourth planet from the Sun and the second-smallest planet in the Solar System. Called the Red Planet due to iron oxide on its surface, it hosts the largest volcano and canyon in the solar system."
    },
    jupiter: {
        name: "Jupiter",
        position: new THREE.Vector3(5.2 * AU_SCALE, 0, 0), // 5.2 AU from Sun
        size: SUN_SIZE * SIZE_RATIOS.jupiter,
        color: 0xdaa520,
        orbitRadius: 5.2,
        orbitSpeed: 0.00008,
        info: "The largest planet. A gas giant with 79+ moons. Great Red Spot is a storm larger than Earth. Protects inner planets from asteroids.",
        educational: "Jupiter demonstrates gas giant composition, powerful magnetospheres, and gravitational influences.",
        // NASA-style data
        diameter: "139,820 km",
        mass: "1.898 × 10²⁷ kg",
        density: "1.326 g/cm³",
        gravity: "24.79 m/s²",
        distanceFromSun: "778.5 million km",
        orbitalPeriod: "11.86 Earth years",
        rotationPeriod: "9h 56m",
        moons: "95 known moons",
        temperature: "-108°C (average)",
        atmosphere: "90% H₂, 10% He",
        description: "Jupiter is the fifth planet from the Sun and the largest in the Solar System. It's a gas giant with a mass more than 2.5 times all other planets combined. The Great Red Spot is a giant storm that has raged for hundreds of years."
    },
    saturn: {
        name: "Saturn",
        position: new THREE.Vector3(9.54 * AU_SCALE, 0, 0), // 9.54 AU from Sun
        size: SUN_SIZE * SIZE_RATIOS.saturn,
        color: 0xf4a460,
        orbitRadius: 9.54,
        orbitSpeed: 0.00003,
        info: "Famous for its rings made of ice and rock. Less dense than water. 82+ moons including Titan with thick atmosphere.",
        educational: "Saturn's rings teach us about gravitational dynamics and moon formation.",
        // NASA-style data
        diameter: "116,460 km",
        mass: "5.683 × 10²⁶ kg",
        density: "0.687 g/cm³",
        gravity: "10.44 m/s²",
        distanceFromSun: "1.43 billion km",
        orbitalPeriod: "29.46 Earth years",
        rotationPeriod: "10h 42m",
        moons: "146 known moons",
        temperature: "-139°C (average)",
        atmosphere: "96% H₂, 3% He",
        description: "Saturn is the sixth planet from the Sun and the second-largest in the Solar System. It's best known for its spectacular ring system, which consists of ice and rock particles ranging in size from tiny grains to house-sized chunks."
    },
    uranus: {
        name: "Uranus",
        position: new THREE.Vector3(19.19 * AU_SCALE, 0, 0), // 19.19 AU from Sun
        size: SUN_SIZE * SIZE_RATIOS.uranus,
        color: 0x40e0d0,
        orbitRadius: 19.19,
        orbitSpeed: 0.00001,
        info: "Tilted 98° - rolls on its side. Coldest planetary atmosphere. Has faint rings. Discovered by William Herschel in 1781.",
        educational: "Uranus shows how planetary collisions can dramatically alter rotation and magnetic fields.",
        // NASA-style data
        diameter: "50,724 km",
        mass: "8.681 × 10²⁵ kg",
        density: "1.271 g/cm³",
        gravity: "8.87 m/s²",
        distanceFromSun: "2.87 billion km",
        orbitalPeriod: "84 Earth years",
        rotationPeriod: "17h 14m (retrograde)",
        moons: "28 known moons",
        temperature: "-197°C (average)",
        atmosphere: "82% H₂, 15% He, 2% CH₄",
        description: "Uranus is the seventh planet from the Sun and has the third-largest diameter in our solar system. It rotates at a nearly 90-degree angle from the plane of its orbit, making it appear to spin on its side."
    },
    neptune: {
        name: "Neptune",
        position: new THREE.Vector3(30.07 * AU_SCALE, 0, 0), // 30.07 AU from Sun
        size: SUN_SIZE * SIZE_RATIOS.neptune,
        color: 0x0000cd,
        orbitRadius: 30.07,
        orbitSpeed: 0.000006,
        info: "Windiest planet with speeds up to 2,100 km/h. Deep blue from methane. Has 14 known moons including Triton.",
        educational: "Neptune helps us understand atmospheric dynamics and the outer solar system's formation.",
        // NASA-style data
        diameter: "49,244 km",
        mass: "1.024 × 10²⁶ kg",
        density: "1.638 g/cm³",
        gravity: "11.15 m/s²",
        distanceFromSun: "4.5 billion km",
        orbitalPeriod: "165 Earth years",
        rotationPeriod: "16h 6m",
        moons: "16 known moons",
        temperature: "-201°C (average)",
        atmosphere: "80% H₂, 19% He, 1% CH₄",
        description: "Neptune is the eighth and outermost major planet in our solar system. It's the windiest planet, with wind speeds reaching up to 2,100 km/h. Its deep blue color comes from methane in its atmosphere."
    }
};

// Create celestial bodies
const bodies = {};
window.bodies = bodies; // Make globally accessible
const orbits = {};
window.orbits = orbits; // Make globally accessible
let orbitsVisible = true;

// Orbital angles for each planet
const orbitAngles = {};

// Advanced NASA Eyes-style camera system
let cameraFollowTarget = null;
let cameraLookAtTarget = new THREE.Vector3(0, 0, 0);
let manualCameraControl = false;

// Camera state for smooth movement
let cameraState = {
    // Current position and target
    position: new THREE.Vector3(200, 100, 200),
    target: new THREE.Vector3(0, 0, 0),
    
    // Smooth transition targets
    targetPosition: new THREE.Vector3(200, 100, 200),
    targetLookAt: new THREE.Vector3(0, 0, 0),
    
    // Orbital controls (spherical coordinates)
    spherical: new THREE.Spherical(300, Math.PI/2, 0), // radius, phi, theta
    targetSpherical: new THREE.Spherical(300, Math.PI/2, 0),
    
    // Movement damping and momentum
    velocity: new THREE.Vector3(),
    angularVelocity: { phi: 0, theta: 0 },
    damping: 0.05, // Lower = more momentum
    
    // Zoom parameters
    minDistance: 1,
    maxDistance: 10000,
    zoomSpeed: 0.1,
    
    // Transition parameters
    isTransitioning: false,
    transitionDuration: 2000, // ms
    transitionStart: 0,
    transitionEasing: 'easeOutCubic'
};

// Legacy variables for compatibility
let cameraOffset = new THREE.Vector3(1, 0.5, 1);
let cameraDistance = 1;
let userZoomFactor = 1;

// Simulation modes
let simulationMode = 'low'; // 'low' or 'high'

// Mode toggle button references (will be set after DOM loads)
let modeButton = null;
let modeText = null;

// Texture paths configuration
const textureConfig = {
    low: {
        sun: 'textures/low/2k_sun.jpg',
        mercury: 'textures/low/2k_mercury.jpg',
        venus: 'textures/low/2k_venus_surface.jpg',
        earth: 'textures/low/2k_earth_daymap.jpg',
        earthClouds: 'textures/low/2k_earth_clouds.jpg',
        earthNight: 'textures/low/2k_earth_nightmap.jpg',
        earthNormal: 'textures/low/2k_earth_normal_map.tif',
        earthSpecular: 'textures/low/2k_earth_specular_map.tif',
        moon: 'textures/low/2k_moon.jpg',
        mars: 'textures/low/2k_mars.jpg',
        jupiter: 'textures/low/2k_jupiter.jpg',
        saturn: 'textures/low/2k_saturn.jpg',
        saturnRing: 'textures/low/2k_saturn_ring_alpha.png',
        uranus: 'textures/low/2k_uranus.jpg',
        neptune: 'textures/low/2k_neptune.jpg',
        stars: 'textures/low/2k_stars.jpg',
        stars_milky_way: 'textures/low/2k_stars_milky_way.jpg'
    },
    high: {
        sun: 'textures/high/8k_sun.jpg',
        mercury: 'textures/high/8k_mercury.jpg',
        venus: 'textures/high/8k_venus_surface.jpg',
        earth: 'textures/high/8k_earth_daymap.jpg',
        earthClouds: 'textures/high/8k_earth_clouds.jpg',
        earthNight: 'textures/high/8k_earth_nightmap.jpg',
        earthNormal: 'textures/high/8k_earth_normal_map.tif',
        earthSpecular: 'textures/high/8k_earth_specular_map.tif',
        moon: 'textures/high/8k_moon.jpg',
        mars: 'textures/high/8k_mars.jpg',
        jupiter: 'textures/high/8k_jupiter.jpg',
        saturn: 'textures/high/8k_saturn.jpg',
        saturnRing: 'textures/high/8k_saturn_ring_alpha.png',
        uranus: 'textures/low/2k_uranus.jpg',
        neptune: 'textures/low/2k_neptune.jpg',
        stars: 'textures/high/8k_stars.jpg',
        stars_milky_way: 'textures/high/8k_stars_milky_way.jpg'
    }
};

// Create orbit paths with dynamic width
function createOrbitPath(radius, segments = 256) {
    const points = [];
    for (let i = 0; i <= segments; i++) {
        const angle = (i / segments) * Math.PI * 2;
        points.push(new THREE.Vector3(
            Math.cos(angle) * radius,
            0,
            Math.sin(angle) * radius
        ));
    }
    
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    
    // Create a thicker line using LineSegments2 fallback or multiple lines
    const material = new THREE.LineBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.8, // Increased opacity for better visibility
        linewidth: 3 // Note: linewidth doesn't work in most browsers, but we'll keep it
    });
    
    // Create main orbit line
    const line = new THREE.Line(geometry, material);
    
    // Add a slight glow effect by creating a second, slightly transparent line
    const glowMaterial = new THREE.LineBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.3,
        linewidth: 5
    });
    const glowLine = new THREE.Line(geometry, glowMaterial);
    
    // Group both lines together
    const orbitGroup = new THREE.Group();
    orbitGroup.add(line);
    orbitGroup.add(glowLine);
    
    return orbitGroup;
}

// Create elliptical orbit path based on ephemeris orbital elements
function createEllipticalOrbitPath(planetName, segments = 512) {
    if (!window.ephemerisEngine || !window.ephemerisEngine.orbitalElements[planetName]) {
        return createOrbitPath(celestialBodies[planetName]?.orbitRadius * AU_SCALE || 100);
    }
    
    const elements = window.ephemerisEngine.orbitalElements[planetName];
    const points = [];
    
    // Current epoch orbital elements
    const a = elements.a; // Semi-major axis (AU)
    const e = elements.e; // Eccentricity
    const i = elements.i * Math.PI / 180; // Inclination (radians)
    const omega = elements.omega * Math.PI / 180; // Longitude of ascending node
    const w = elements.w * Math.PI / 180; // Longitude of perihelion
    
    // Generate points along the elliptical orbit
    for (let j = 0; j <= segments; j++) {
        const M = (j / segments) * 2 * Math.PI; // Mean anomaly
        
        // Solve Kepler's equation for eccentric anomaly
        let E = M;
        for (let k = 0; k < 5; k++) {
            E = M + e * Math.sin(E);
        }
        
        // True anomaly
        const v = 2 * Math.atan2(
            Math.sqrt(1 + e) * Math.sin(E / 2),
            Math.sqrt(1 - e) * Math.cos(E / 2)
        );
        
        // Distance from sun
        const r = a * (1 - e * Math.cos(E));
        
        // Position in orbital plane
        const xOrbit = r * Math.cos(v);
        const yOrbit = r * Math.sin(v);
        
        // Convert to ecliptic coordinates
        const cosOmega = Math.cos(omega);
        const sinOmega = Math.sin(omega);
        const cosI = Math.cos(i);
        const sinI = Math.sin(i);
        const cosW = Math.cos(w - omega);
        const sinW = Math.sin(w - omega);
        
        const x = (cosOmega * cosW - sinOmega * sinW * cosI) * xOrbit +
                  (-cosOmega * sinW - sinOmega * cosW * cosI) * yOrbit;
        const y = (sinOmega * cosW + cosOmega * sinW * cosI) * xOrbit +
                  (-sinOmega * sinW + cosOmega * cosW * cosI) * yOrbit;
        const z = (sinW * sinI) * xOrbit + (cosW * sinI) * yOrbit;
        
        // Convert to scene coordinates (match ephemeris positioning)
        // Ecliptic: X,Y in plane, Z perpendicular → Scene: X,Z in plane, Y perpendicular
        points.push(new THREE.Vector3(x * AU_SCALE, z * AU_SCALE, y * AU_SCALE));
    }
    
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    
    // Create orbit group with elliptical styling
    const orbitGroup = new THREE.Group();
    
    // Main orbit line - color based on planet
    let orbitColor = 0x888888;
    if (planetName === 'earth') orbitColor = 0x0066cc;
    else if (planetName === 'mars') orbitColor = 0xcd5c5c;
    else if (planetName === 'venus') orbitColor = 0xffd700;
    else if (planetName === 'jupiter') orbitColor = 0xdaa520;
    else if (planetName === 'saturn') orbitColor = 0xf4a460;
    
    const mainMaterial = new THREE.LineBasicMaterial({ 
        color: orbitColor,
        transparent: true,
        opacity: 0.5
    });
    const mainLine = new THREE.Line(geometry.clone(), mainMaterial);
    orbitGroup.add(mainLine);
    
    // Glow effect line
    const glowMaterial = new THREE.LineBasicMaterial({ 
        color: orbitColor,
        transparent: true,
        opacity: 0.2,
        linewidth: 2
    });
    const glowLine = new THREE.Line(geometry.clone(), glowMaterial);
    orbitGroup.add(glowLine);
    
    return orbitGroup;
}

// Global storage for elliptical orbits
const ellipticalOrbits = {};

// Update orbit visibility based on camera distance and ephemeris state
function updateOrbitVisibility() {
    const cameraDistance = camera.position.length();
    
    // Check if we're using ephemeris for real elliptical orbits
    const usingEphemeris = window.timeControls && window.ephemerisEngine;
    
    // Debug logging (occasionally)
    if (Math.random() < 0.01) {
        devLog.info(`Orbit Debug: orbitsVisible=${orbitsVisible}, usingEphemeris=${usingEphemeris}, circularOrbits=${Object.keys(orbits).length}, ellipticalOrbits=${Object.keys(ellipticalOrbits).length}`);
    }
    
    if (usingEphemeris) {
        // Hide circular orbits and show elliptical ones
        Object.entries(orbits).forEach(([key, orbit]) => {
            orbit.visible = false;
        });
        
        // Create or update elliptical orbits if needed
        if (orbitsVisible) {
            Object.keys(celestialBodies).forEach(key => {
                if (celestialBodies[key].orbitRadius && key !== 'sun' && key !== 'moon' && key !== 'blackhole') {
                    if (!ellipticalOrbits[key]) {
                        ellipticalOrbits[key] = createEllipticalOrbitPath(key);
                        scene.add(ellipticalOrbits[key]);
                        devLog.success(`Created elliptical orbit for ${key}`);
                    }
                    ellipticalOrbits[key].visible = true;
                    
                    // Apply opacity adjustments to elliptical orbits too
                    const distanceFactor = Math.min(1, cameraDistance / 1000);
                    const baseOpacity = 0.4 + (0.4 * distanceFactor);
                    
                    ellipticalOrbits[key].children.forEach((line) => {
                        if (line.material) {
                            line.material.opacity = Math.min(0.6, baseOpacity);
                        }
                    });
                }
            });
        } else {
            // Hide all elliptical orbits when orbits are disabled
            Object.entries(ellipticalOrbits).forEach(([key, orbit]) => {
                orbit.visible = false;
            });
        }
    } else {
        // Hide elliptical orbits and show circular ones
        Object.entries(ellipticalOrbits).forEach(([key, orbit]) => {
            orbit.visible = false;
        });
        
        // Show circular orbits
        Object.entries(orbits).forEach(([key, orbit]) => {
            if (!orbitsVisible) {
                orbit.visible = false;
                return;
            }
            
            orbit.visible = true;
            
            // Adjust opacity based on camera distance
            const distanceFactor = Math.min(1, cameraDistance / 1000);
            const baseOpacity = 0.4 + (0.4 * distanceFactor); // Increased base opacity
            
            // Update opacity for both lines in the group
            orbit.children.forEach((line, index) => {
                if (index === 0) {
                    // Main line
                    line.material.opacity = Math.min(0.9, baseOpacity);
                } else {
                    // Glow line
                    line.material.opacity = Math.min(0.4, baseOpacity * 0.5);
                }
            });
            
            // For close-up views, make orbits more visible
            if (cameraDistance < 200) {
                orbit.children[0].material.opacity = Math.max(0.5, orbit.children[0].material.opacity);
                orbit.children[1].material.opacity = Math.max(0.2, orbit.children[1].material.opacity);
            }
        });
    }
}

// Update positions based on new scale
function updateScale(newScale) {
    AU_SCALE = newScale;
    
    // Update planet positions and orbits
    Object.entries(celestialBodies).forEach(([key, data]) => {
        if (data.orbitRadius && bodies[key]) {
            // Update orbit
            if (orbits[key]) {
                scene.remove(orbits[key]);
                const newOrbit = createOrbitPath(data.orbitRadius * AU_SCALE);
                scene.add(newOrbit);
                orbits[key] = newOrbit;
            }
            
            // Update position
            const angle = orbitAngles[key] || 0;
            const x = Math.cos(angle) * data.orbitRadius * AU_SCALE;
            const z = Math.sin(angle) * data.orbitRadius * AU_SCALE;
            bodies[key].position.set(x, 0, z);
        }
    });
    
    updateOrbitVisibility();
}

// Create all celestial bodies asynchronously to handle texture loading
async function createCelestialBodies() {
    devLog.info('Creating celestial bodies...');
    
    // Show texture status in console
    if (!isFileProtocol) {
        devLog.info(`Current mode: ${simulationMode}`);
        devLog.info(`Looking for textures in: textures/${simulationMode === 'high' ? 'high' : 'low'}/`);
    }
    for (const [key, data] of Object.entries(celestialBodies)) {
        try {
            let mesh;
            
            // Initialize orbit angle
            if (data.orbitRadius) {
                orbitAngles[key] = Math.random() * Math.PI * 2; // Random starting position
            }
            
            if (key === 'earth') {
            devLog.info(`Creating ${data.name}...`);
            // Create Earth with realistic textures
            const earthGeometry = new THREE.SphereGeometry(data.size, 64, 64);
            
            // Load all Earth textures
            const [dayTexture, nightTexture, normalTexture, specularTexture, cloudTexture] = await Promise.all([
                loadLocalTexture('earth', null),
                loadLocalTexture('earthNight', null),
                loadLocalTexture('earthNormal', null),
                loadLocalTexture('earthSpecular', null),
                loadLocalTexture('earthClouds', null)
            ]);
            
            // Create shader material with day/night cycle
            const earthUniforms = {
                dayTexture: { value: dayTexture },
                nightTexture: { value: nightTexture },
                normalMap: { value: normalTexture },
                specularMap: { value: specularTexture },
                cloudsTexture: { value: null },
                sunDirection: { value: new THREE.Vector3(1, 0, 0) }
            };
            
            // Define shader options based on available textures
            const defines = {};
            if (normalTexture) defines.USE_NORMALMAP = true;
            if (specularTexture) defines.USE_SPECULARMAP = true;
            
            let earthMaterial;
            if (dayTexture || nightTexture) {
                earthMaterial = new THREE.ShaderMaterial({
                    uniforms: earthUniforms,
                    vertexShader: earthVertexShader,
                    fragmentShader: earthFragmentShader,
                    defines: defines
                });
            } else {
                // Fallback material without shader
                earthMaterial = new THREE.MeshPhongMaterial({
                    color: 0x2233ff,
                    emissive: 0x112244,
                    shininess: 10
                });
                
                // Create procedural Earth-like texture
                const canvas = document.createElement('canvas');
                canvas.width = 512;
                canvas.height = 256;
                const ctx = canvas.getContext('2d');
                
                // Ocean background
                ctx.fillStyle = '#1e3a8a';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                
                // Add continents
                ctx.fillStyle = '#16a34a';
                // Simple continent shapes
                ctx.beginPath();
                ctx.arc(100, 80, 40, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(300, 100, 60, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillRect(380, 70, 80, 100);
                
                // Add some brown for deserts
                ctx.fillStyle = '#a16207';
                ctx.fillRect(90, 70, 20, 20);
                ctx.fillRect(290, 90, 20, 20);
                
                // Create texture from canvas
                const texture = new THREE.CanvasTexture(canvas);
                earthMaterial.map = texture;
                earthMaterial.color = new THREE.Color(0xffffff);
            }
            
            mesh = new THREE.Mesh(earthGeometry, earthMaterial);
            mesh.position.set(data.position.x, data.position.y, data.position.z);
            scene.add(mesh);
            
            // Store Earth material reference for sun direction updates
            bodies[key + '_material'] = earthMaterial;
            
            // Add cloud layer (texture already loaded above)
            const cloudGeometry = new THREE.SphereGeometry(data.size * 1.01, 64, 64);
            const cloudMaterial = new THREE.MeshPhongMaterial({
                map: cloudTexture,
                transparent: true,
                opacity: cloudTexture ? 0.6 : 0.2,
                depthWrite: false
            });
            
            if (!cloudTexture) {
                cloudMaterial.color = new THREE.Color(0xffffff);
                cloudMaterial.emissive = new THREE.Color(0xffffff);
                cloudMaterial.emissiveIntensity = 0.05;
            }
            
            const cloudMesh = new THREE.Mesh(cloudGeometry, cloudMaterial);
            cloudMesh.position.set(data.position.x, data.position.y, data.position.z);
            scene.add(cloudMesh);
            
            // Store cloud mesh reference for rotation
            bodies[key + '_clouds'] = cloudMesh;
            
            // Add atmosphere glow
            const atmosphereGeometry = new THREE.SphereGeometry(data.size * 1.1, 64, 64);
            const atmosphereMaterial = new THREE.MeshBasicMaterial({
                color: 0x0088ff,
                transparent: true,
                opacity: 0.1,
                side: THREE.BackSide
            });
            const atmosphereMesh = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
            atmosphereMesh.position.set(data.position.x, data.position.y, data.position.z);
            scene.add(atmosphereMesh);
            bodies[key + '_atmosphere'] = atmosphereMesh;
            
            // Add aurora effect at poles
            const auroraGeometry = new THREE.SphereGeometry(data.size * 1.02, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.3);
            const auroraMaterial = new THREE.ShaderMaterial({
                transparent: true,
                side: THREE.DoubleSide,
                uniforms: {
                    time: { value: 0 },
                    color1: { value: new THREE.Color(0x00ff00) },
                    color2: { value: new THREE.Color(0x00ffff) }
                },
                vertexShader: `
                    varying vec2 vUv;
                    varying vec3 vPosition;
                    void main() {
                        vUv = uv;
                        vPosition = position;
                        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                    }
                `,
                fragmentShader: `
                    uniform float time;
                    uniform vec3 color1;
                    uniform vec3 color2;
                    varying vec2 vUv;
                    varying vec3 vPosition;
                    void main() {
                        float wave = sin(vUv.x * 10.0 + time) * 0.5 + 0.5;
                        vec3 color = mix(color1, color2, wave);
                        float alpha = (1.0 - vUv.y) * 0.3 * wave;
                        gl_FragColor = vec4(color, alpha);
                    }
                `
            });
            const auroraNorth = new THREE.Mesh(auroraGeometry, auroraMaterial);
            auroraNorth.position.set(data.position.x, data.position.y, data.position.z);
            scene.add(auroraNorth);
            
            const auroraSouth = new THREE.Mesh(auroraGeometry, auroraMaterial.clone());
            auroraSouth.position.set(data.position.x, data.position.y, data.position.z);
            auroraSouth.rotation.x = Math.PI;
            scene.add(auroraSouth);
            
            bodies[key + '_aurora_north'] = auroraNorth;
            bodies[key + '_aurora_south'] = auroraSouth;
        } else if (key === 'moon') {
            // Create Moon with texture
            const moonGeometry = new THREE.SphereGeometry(data.size, 32, 32);
            const moonMaterial = new THREE.MeshPhongMaterial();
            
            // Load Moon texture based on mode
            let moonTexture = await loadLocalTexture('moon', null);
            
            if (moonTexture) {
                moonMaterial.map = moonTexture;
                moonMaterial.bumpMap = moonTexture;
                moonMaterial.bumpScale = 0.002;
            } else {
                // Create procedural moon-like texture
                const canvas = document.createElement('canvas');
                canvas.width = 256;
                canvas.height = 256;
                const ctx = canvas.getContext('2d');
                
                // Base gray color
                ctx.fillStyle = '#c0c0c0';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                
                // Add craters
                const drawCrater = (x, y, radius) => {
                    ctx.beginPath();
                    ctx.arc(x, y, radius, 0, Math.PI * 2);
                    ctx.fillStyle = '#888888';
                    ctx.fill();
                    ctx.beginPath();
                    ctx.arc(x - radius/4, y - radius/4, radius * 0.7, 0, Math.PI * 2);
                    ctx.fillStyle = '#999999';
                    ctx.fill();
                };
                
                // Random craters
                for (let i = 0; i < 20; i++) {
                    drawCrater(
                        Math.random() * canvas.width,
                        Math.random() * canvas.height,
                        Math.random() * 20 + 5
                    );
                }
                
                const texture = new THREE.CanvasTexture(canvas);
                moonMaterial.map = texture;
                moonMaterial.color = new THREE.Color(0xffffff);
            }
            
            mesh = new THREE.Mesh(moonGeometry, moonMaterial);
            mesh.position.set(data.position.x, data.position.y, data.position.z);
            scene.add(mesh);
        } else if (key === 'sun') {
            // Create ultra-realistic sun
            if (typeof RealisticSun !== 'undefined') {
                window.realisticSun = new RealisticSun(scene, data.position, data.size);
                devLog.success('Ultra-realistic sun created');
                
                // Create a dummy mesh for the bodies object (for navigation)
                mesh = new THREE.Mesh(
                    new THREE.SphereGeometry(data.size, 32, 32),
                    new THREE.MeshBasicMaterial({ visible: false })
                );
                mesh.position.set(data.position.x, data.position.y, data.position.z);
                scene.add(mesh);
            } else {
                // Fallback to simple sun if RealisticSun not loaded
                const sunGeometry = new THREE.SphereGeometry(data.size, 64, 64);
                const sunTexture = await loadLocalTexture('sun', null);
                
                const sunMaterial = new THREE.MeshBasicMaterial({
                    map: sunTexture,
                    color: sunTexture ? 0xffffff : 0xffff00,
                    emissive: 0xffaa00,
                    emissiveIntensity: 1
                });
                
                mesh = new THREE.Mesh(sunGeometry, sunMaterial);
                mesh.position.set(data.position.x, data.position.y, data.position.z);
                scene.add(mesh);
                
                // Disable old sun effects when using RealisticSun
                // if (typeof SunEffects !== 'undefined') {
                //     window.sunEffects = new SunEffects(scene, data.position, data.size);
                //     devLog.success('Basic sun effects created');
                // }
            }
        } else if (key === 'mars') {
            // Create Mars with texture
            const marsGeometry = new THREE.SphereGeometry(data.size, 64, 64);
            const marsTexture = await loadLocalTexture('mars', null);
            
            const marsMaterial = new THREE.MeshPhongMaterial({
                map: marsTexture,
                bumpScale: 0.05
            });
            
            if (!marsTexture) {
                marsMaterial.color = new THREE.Color(0xcd5c5c);
                marsMaterial.emissive = new THREE.Color(0x441111);
                marsMaterial.emissiveIntensity = 0.1;
            }
            
            mesh = new THREE.Mesh(marsGeometry, marsMaterial);
            mesh.position.set(data.position.x, data.position.y, data.position.z);
            scene.add(mesh);
        } else if (key === 'jupiter') {
            // Create Jupiter with texture
            const jupiterGeometry = new THREE.SphereGeometry(data.size, 64, 64);
            const jupiterTexture = await loadLocalTexture('jupiter', null);
            
            const jupiterMaterial = new THREE.MeshPhongMaterial({
                map: jupiterTexture
            });
            
            if (!jupiterTexture) {
                jupiterMaterial.color = new THREE.Color(0xdaa520);
                jupiterMaterial.emissive = new THREE.Color(0x442211);
                jupiterMaterial.emissiveIntensity = 0.1;
            }
            
            mesh = new THREE.Mesh(jupiterGeometry, jupiterMaterial);
            mesh.position.set(data.position.x, data.position.y, data.position.z);
            scene.add(mesh);
        } else {
            // Create other celestial bodies
            const geometry = new THREE.SphereGeometry(data.size, 64, 64);
            
            // Try to load texture for the planet
            let texture = null;
            if (key === 'mercury') {
                texture = await loadLocalTexture('mercury', null);
            } else if (key === 'venus') {
                texture = await loadLocalTexture('venus', null);
            } else if (key === 'saturn') {
                texture = await loadLocalTexture('saturn', null);
            } else if (key === 'uranus') {
                texture = await loadLocalTexture('uranus', null);
            } else if (key === 'neptune') {
                devLog.info('Loading Neptune texture...');
                texture = await loadLocalTexture('neptune', null);
                devLog.info('Neptune texture loaded');
            }
            
            const material = new THREE.MeshPhongMaterial({ 
                map: texture || undefined,
                color: texture ? 0xffffff : data.color, // Use white if texture loaded, else use data color
                emissive: data.emissive || 0x000000,
                emissiveIntensity: data.emissive ? 0.5 : 0
            });
            mesh = new THREE.Mesh(geometry, material);
            mesh.position.set(data.position.x, data.position.y, data.position.z);
            scene.add(mesh);
        }
        
        bodies[key] = mesh;
        
        // Create label for this celestial body (excluding sun and blackhole)
        if (planetLabels && key !== 'blackhole' && key !== 'sun') {
            planetLabels.createLabel(data.name, mesh.position);
        }
        
        // Create orbit trail
        if (orbitTrails && data.orbitRadius) {
            const trailColor = key === 'earth' ? 0x0066ff : 0x444444;
            orbitTrails.createTrail(key, trailColor);
        }
        
        // Add moon systems for gas giants
        if (window.moonSystems) {
            if (['jupiter', 'saturn', 'uranus', 'neptune'].includes(key)) {
                window.moonSystems.createMoonSystem(key, mesh, data.size);
                devLog.success(`Moon system created for ${data.name}`);
            }
        }
        
        // Add atmospheric effects
        if (window.atmosphereSystem && key !== 'sun' && key !== 'moon' && key !== 'blackhole') {
            const atmosphere = window.atmosphereSystem.createAtmosphere(mesh, key, data.size);
            if (atmosphere) {
                mesh.add(atmosphere);
                devLog.success(`Atmosphere added to ${data.name}`);
            }
        }
        
        // Add glow effect for black hole
        if (key === 'blackhole') {
            // Create black hole using oseiskar implementation
            if (typeof createOseiskarBlackHole === 'function') {
                const blackHoleResult = createOseiskarBlackHole(scene, data.position, data.size);
                scene.add(blackHoleResult.mesh);
                bodies[key] = blackHoleResult.mesh;
                bodies[key + '_shader'] = blackHoleResult.material;
            } else {
                // Fallback to simple black sphere
                const blackHole = new THREE.Mesh(
                    new THREE.SphereGeometry(data.size, 32, 32),
                    new THREE.MeshBasicMaterial({ color: 0x000000 })
                );
                blackHole.position.set(data.position.x, data.position.y, data.position.z);
                scene.add(blackHole);
                bodies[key] = blackHole;
            }
        }
        
        // Add enhanced ring systems for gas giants
        if (window.ringSystems && ['saturn', 'jupiter', 'uranus', 'neptune'].includes(key)) {
            try {
                const ringSystem = window.ringSystems.createRingSystem(key, mesh, data.size);
                if (ringSystem) {
                    devLog.success(`Enhanced ring system created for ${data.name}`);
                }
            } catch (error) {
                devLog.error(`Failed to create ring system for ${key}:`, error);
            }
        }
        
        // Create orbit path for planets
        if (data.orbitRadius && key !== 'moon') {
            const orbit = createOrbitPath(data.orbitRadius * AU_SCALE);
            scene.add(orbit);
            orbits[key] = orbit;
        }
        } catch (error) {
            devLog.error(`Failed to create ${key}: ${error.message}`);
            console.error(`Error creating ${key}:`, error);
        }
    }
    
    // Create dwarf planets and comets
    if (window.dwarfPlanetsComets) {
        try {
            window.dwarfPlanetsComets.createAllObjects();
            devLog.success('Dwarf planets and comets created');
            // Populate the special objects tab and attach click handlers
            populateSpecialObjectsTab();
            setupObjectCardClickHandlers();
        } catch (error) {
            devLog.error('Failed to create dwarf planets and comets:', error);
        }
    }
    
    // Hide loading indicator and disable animation
    const loadingIndicator = document.getElementById('loading-indicator');
    if (loadingIndicator) {
        loadingIndicator.style.display = 'none';
        loadingIndicator.style.animation = 'none';
        // Remove it entirely to prevent any flickering
        loadingIndicator.remove();
    }
    
    // No automatic travel - let user choose where to go
    devLog.success('All celestial bodies loaded. Choose a destination to travel!');
    
    // Populate tabs now that all objects are created
    populateTabContent();
}

// Create celestial bodies function will be called after scene initialization


// Create galactic center environment around black hole
function createGalacticCenter(blackHoleMesh, blackHoleSize) {
    // Temporarily disabled to focus on black hole
    return;
    
    devLog.info('Creating galactic center environment...');
    
    // Create a group for all galactic center objects
    const galacticGroup = new THREE.Group();
    // Add the group as a child of the black hole so it moves with it
    blackHoleMesh.add(galacticGroup);
    
    // 1. Create dense star cluster
    const starCount = 2000;
    const starGeometry = new THREE.BufferGeometry();
    const starPositions = [];
    const starColors = [];
    const starSizes = [];
    
    for (let i = 0; i < starCount; i++) {
        // Use gaussian distribution for more realistic clustering
        const distance = Math.random() * Math.random() * 1000 + blackHoleSize * 4;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI;
        
        // Position in spherical coordinates with higher density near center
        const x = distance * Math.sin(phi) * Math.cos(theta);
        const y = distance * Math.sin(phi) * Math.sin(theta) * 0.3; // Flatten for disk-like structure
        const z = distance * Math.cos(phi);
        
        starPositions.push(x, y, z);
        
        // Star colors - mix of blue giants, red giants, and normal stars
        const starType = Math.random();
        if (starType < 0.1) {
            // Blue giants
            starColors.push(0.7, 0.8, 1.0);
        } else if (starType < 0.3) {
            // Red giants
            starColors.push(1.0, 0.6, 0.4);
        } else {
            // Normal stars
            starColors.push(1.0, 1.0, 0.9);
        }
        
        // Varying star sizes
        starSizes.push(Math.random() * 3 + 1);
    }
    
    starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3));
    starGeometry.setAttribute('color', new THREE.Float32BufferAttribute(starColors, 3));
    starGeometry.setAttribute('size', new THREE.Float32BufferAttribute(starSizes, 1));
    
    // Star material with size attenuation
    const starMaterial = new THREE.PointsMaterial({
        size: 5,
        vertexColors: true,
        transparent: true,
        opacity: 0.8,
        sizeAttenuation: true,
        blending: THREE.AdditiveBlending
    });
    
    const stars = new THREE.Points(starGeometry, starMaterial);
    galacticGroup.add(stars);
    bodies['blackhole_stars'] = stars;
    
    // 2. Create nebula clouds
    const nebulaCount = 5;
    for (let i = 0; i < nebulaCount; i++) {
        const nebulaGeometry = new THREE.SphereGeometry(
            Math.random() * 200 + 100,
            16,
            16
        );
        
        // Nebula colors
        const nebulaColors = [
            0xff6b6b, // Red
            0x4ecdc4, // Cyan
            0xffe66d, // Yellow
            0x8b5cf6, // Purple
            0x06ffa5  // Green
        ];
        
        const nebulaMaterial = new THREE.MeshBasicMaterial({
            color: nebulaColors[i % nebulaColors.length],
            transparent: true,
            opacity: 0.1,
            side: THREE.BackSide,
            blending: THREE.AdditiveBlending
        });
        
        const nebula = new THREE.Mesh(nebulaGeometry, nebulaMaterial);
        
        // Position nebulae around the black hole
        const angle = (i / nebulaCount) * Math.PI * 2;
        const dist = Math.random() * 500 + 300;
        nebula.position.set(
            Math.cos(angle) * dist,
            (Math.random() - 0.5) * 100,
            Math.sin(angle) * dist
        );
        
        // Random scale
        const scale = Math.random() * 0.5 + 0.5;
        nebula.scale.set(scale, scale, scale);
        
        galacticGroup.add(nebula);
        bodies[`blackhole_nebula_${i}`] = nebula;
    }
    
    // 3. Create stellar debris and gas streams
    const debrisCount = 10;
    for (let i = 0; i < debrisCount; i++) {
        const streamGeometry = new THREE.CylinderGeometry(
            Math.random() * 5 + 2,
            Math.random() * 5 + 2,
            Math.random() * 100 + 50,
            8
        );
        
        const streamMaterial = new THREE.MeshBasicMaterial({
            color: new THREE.Color(1, 0.7, 0.3),
            transparent: true,
            opacity: 0.3,
            blending: THREE.AdditiveBlending
        });
        
        const stream = new THREE.Mesh(streamGeometry, streamMaterial);
        
        // Position and orient streams
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random() * 300 + blackHoleSize * 3;
        stream.position.set(
            Math.cos(angle) * dist,
            (Math.random() - 0.5) * 50,
            Math.sin(angle) * dist
        );
        
        // Random rotation to create chaotic appearance
        stream.rotation.set(
            Math.random() * Math.PI,
            Math.random() * Math.PI,
            Math.random() * Math.PI
        );
        
        galacticGroup.add(stream);
        bodies[`blackhole_stream_${i}`] = stream;
    }
    
    // 4. Create bright stellar remnants (neutron stars, white dwarfs)
    const remnantCount = 20;
    for (let i = 0; i < remnantCount; i++) {
        const remnantGeometry = new THREE.SphereGeometry(
            Math.random() * 2 + 1,
            8,
            8
        );
        
        const remnantMaterial = new THREE.MeshBasicMaterial({
            color: new THREE.Color(
                0.8 + Math.random() * 0.2,
                0.8 + Math.random() * 0.2,
                1
            ),
            emissive: 0xffffff,
            emissiveIntensity: 0.5
        });
        
        const remnant = new THREE.Mesh(remnantGeometry, remnantMaterial);
        
        // Position remnants
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random() * 800 + 100;
        remnant.position.set(
            Math.cos(angle) * dist,
            (Math.random() - 0.5) * 200,
            Math.sin(angle) * dist
        );
        
        // Add glow
        const glowGeometry = new THREE.SphereGeometry(
            (Math.random() * 2 + 1) * 2,
            8,
            8
        );
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: remnantMaterial.color,
            transparent: true,
            opacity: 0.3,
            blending: THREE.AdditiveBlending
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        glow.position.copy(remnant.position);
        
        galacticGroup.add(remnant);
        galacticGroup.add(glow);
        bodies[`blackhole_remnant_${i}`] = remnant;
    }
    
    // The galactic group is now a child of the black hole mesh
    bodies['blackhole_galactic_group'] = galacticGroup;
    
    devLog.success(`Created galactic center with ${starCount} stars and multiple cosmic phenomena`);
}

// Travel animation
let isMoving = false;
let targetPosition = new THREE.Vector3();
let currentSpeed = 1;
let currentDestination = null;
let followTargetObject = null; // For following non-celestial objects (moons, spacecraft, etc.)

// Calculate camera distance to fit object in view
function calculateCameraDistance(objectSize, fillPercent = 0.6) {
    // Camera FOV is 75 degrees
    const fov = 75 * Math.PI / 180;
    // Calculate distance so object fills desired percentage of screen
    const distance = (objectSize / fillPercent) / (2 * Math.tan(fov / 2));
    return distance;
}

// Update destination info panel
function updateDestinationInfo(data) {
    const destinationName = document.getElementById('destination-name');
    const planetInfo = document.getElementById('planet-info');
    
    if (destinationName) {
        destinationName.textContent = data.name || 'Unknown Object';
    }
    
    if (planetInfo) {
        let infoHTML = '';
        
        // Add basic info
        if (data.info) {
            infoHTML += `<p>${data.info}</p>`;
        }
        
        // Add additional details
        if (data.type) infoHTML += `<br><strong>Type:</strong> ${data.type}`;
        if (data.diameter) infoHTML += `<br><strong>Diameter:</strong> ${data.diameter}`;
        if (data.mass) infoHTML += `<br><strong>Mass:</strong> ${data.mass}`;
        if (data.distanceFromSun) infoHTML += `<br><strong>Distance from Sun:</strong> ${data.distanceFromSun}`;
        if (data.orbitalPeriod) infoHTML += `<br><strong>Orbital Period:</strong> ${data.orbitalPeriod}`;
        if (data.temperature) infoHTML += `<br><strong>Temperature:</strong> ${data.temperature}`;
        if (data.atmosphere) infoHTML += `<br><strong>Atmosphere:</strong> ${data.atmosphere}`;
        if (data.launched) infoHTML += `<br><strong>Launched:</strong> ${data.launched}`;
        if (data.status) infoHTML += `<br><strong>Status:</strong> ${data.status}`;
        if (data.crew) infoHTML += `<br><strong>Crew Capacity:</strong> ${data.crew}`;
        if (data.orbitalSpeed) infoHTML += `<br><strong>Orbital Speed:</strong> ${data.orbitalSpeed}`;
        if (data.altitude) infoHTML += `<br><strong>Altitude:</strong> ${data.altitude} km`;
        
        // Add description if different from info
        if (data.description && data.description !== data.info) {
            infoHTML += `<br><br>${data.description}`;
        }
        
        // Add educational value if present
        if (data.educational) {
            infoHTML += `<br><br><em>${data.educational}</em>`;
        }
        
        planetInfo.innerHTML = infoHTML;
    }
    
    // Use info panels if available
    if (window.infoPanels && window.infoPanels.show) {
        window.infoPanels.show(data);
    }
}

// Navigate to any type of object (planets, moons, spacecraft, etc.)
function navigateToObject(objectId) {
    // Track navigation for analytics
    if (window.dashboardController && window.dashboardController.dashboard) {
        window.dashboardController.dashboard.trackUserInteraction('navigation', {
            target: objectId,
            feature: 'object_navigation'
        });
    }
    
    // Try regular celestial bodies first
    if (celestialBodies[objectId] && bodies[objectId]) {
        travelTo(objectId);
        return true;
    }
    
    // Try moons
    if (window.moonSystems && window.moonSystems.moons) {
        for (const [planet, moonSystem] of Object.entries(window.moonSystems.moons)) {
            if (moonSystem[objectId]) {
                const moon = moonSystem[objectId];
                if (moon.mesh) {
                    cameraFollowTarget = objectId;
                    followTargetObject = moon.mesh;
                    
                    // Get parent planet position for initial camera positioning
                    const parentBody = bodies[planet];
                    if (parentBody) {
                        const cameraDistance = moon.data.radius * 0.00003 * AU_SCALE + 50;
                        const offset = new THREE.Vector3(cameraDistance, cameraDistance * 0.5, cameraDistance);
                        camera.position.copy(moon.mesh.position).add(offset);
                        camera.lookAt(moon.mesh.position);
                    }
                    
                    updateDestinationInfo({
                        name: moon.data.name,
                        info: moon.data.info,
                        diameter: (moon.data.radius * 2) + " km",
                        orbitalPeriod: moon.data.period + " days",
                        parent: planet.charAt(0).toUpperCase() + planet.slice(1),
                        type: "Moon",
                        description: moon.data.info
                    });
                    updateCameraModeDisplay();
                    devLog.success(`Navigating to moon: ${moon.data.name}`);
                    return true;
                }
            }
        }
    }
    
    // Try spacecraft
    if (window.spacecraftTracker && window.spacecraftTracker.spacecraft && window.spacecraftTracker.spacecraft[objectId]) {
        const spacecraft = window.spacecraftTracker.spacecraft[objectId];
        if (spacecraft.mesh) {
            cameraFollowTarget = objectId;
            followTargetObject = spacecraft.mesh;
            
            // Get spacecraft size for proper camera distance
            const spacecraftSize = window.spacecraftTracker.getSpacecraftSize(objectId) || 0.005;
            
            // Use a minimum camera distance to ensure we're not inside the object
            // For spacecraft, we need a much larger minimum distance due to their small size
            const minDistance = Math.max(1, spacecraftSize * 100); // At least 1 unit or 100x the size
            const calculatedDistance = calculateCameraDistance(spacecraftSize, 0.6);
            const cameraDistance = Math.max(minDistance, calculatedDistance);
            
            const offset = new THREE.Vector3(cameraDistance, cameraDistance * 0.5, cameraDistance);
            camera.position.copy(spacecraft.mesh.position).add(offset);
            camera.lookAt(spacecraft.mesh.position);
            
            updateDestinationInfo({
                name: spacecraft.data.name,
                info: spacecraft.data.info,
                launched: spacecraft.data.launched.toLocaleDateString(),
                status: spacecraft.data.status,
                type: spacecraft.data.type,
                description: spacecraft.data.info
            });
            updateCameraModeDisplay();
            devLog.success(`Navigating to spacecraft: ${spacecraft.data.name}`);
            return true;
        }
    }
    
    // Try dwarf planets
    if (window.dwarfPlanetsComets && window.dwarfPlanetsComets.dwarfPlanets && window.dwarfPlanetsComets.dwarfPlanets[objectId]) {
        const dwarfPlanetMesh = window.dwarfPlanetsComets.dwarfPlanets[objectId];
        const dwarfPlanetData = window.dwarfPlanetsComets.dwarfPlanetData[objectId];
        if (dwarfPlanetMesh && dwarfPlanetData) {
            cameraFollowTarget = objectId;
            followTargetObject = dwarfPlanetMesh;
            
            const cameraDistance = dwarfPlanetData.size * 10;
            const offset = new THREE.Vector3(cameraDistance, cameraDistance * 0.5, cameraDistance);
            camera.position.copy(dwarfPlanetMesh.position).add(offset);
            camera.lookAt(dwarfPlanetMesh.position);
            
            updateDestinationInfo(dwarfPlanetData);
            updateCameraModeDisplay();
            devLog.success(`Navigating to dwarf planet: ${dwarfPlanetData.name}`);
            return true;
        }
    }
    
    // Try comets
    if (window.dwarfPlanetsComets && window.dwarfPlanetsComets.comets && window.dwarfPlanetsComets.comets[objectId]) {
        const cometGroup = window.dwarfPlanetsComets.comets[objectId];
        const cometData = window.dwarfPlanetsComets.cometData[objectId];
        if (cometGroup && cometData) {
            cameraFollowTarget = objectId;
            followTargetObject = cometGroup;
            
            const cameraDistance = 50;
            const offset = new THREE.Vector3(cameraDistance, cameraDistance * 0.5, cameraDistance);
            camera.position.copy(cometGroup.position).add(offset);
            camera.lookAt(cometGroup.position);
            
            updateDestinationInfo(cometData);
            updateCameraModeDisplay();
            devLog.success(`Navigating to comet: ${cometData.name}`);
            return true;
        }
    }
    
    // Try major asteroids
    if (window.asteroidBelt && window.asteroidBelt.asteroids) {
        for (const asteroid of window.asteroidBelt.asteroids) {
            if (asteroid.data && asteroid.data.name && asteroid.data.name.toLowerCase().replace(/\s+/g, '') === objectId.toLowerCase()) {
                cameraFollowTarget = objectId;
                followTargetObject = asteroid.mesh;
                
                const cameraDistance = 5;
                const offset = new THREE.Vector3(cameraDistance, cameraDistance * 0.5, cameraDistance);
                camera.position.copy(asteroid.mesh.position).add(offset);
                camera.lookAt(asteroid.mesh.position);
                
                updateDestinationInfo({
                    name: asteroid.data.name,
                    info: asteroid.data.info,
                    radius: asteroid.data.radius + " km",
                    distance: asteroid.data.distance + " AU",
                    type: "Asteroid",
                    description: asteroid.data.info
                });
                updateCameraModeDisplay();
                devLog.success(`Navigating to asteroid: ${asteroid.data.name}`);
                return true;
            }
        }
    }
    
    // Try asteroids from DwarfPlanetsComets (notable asteroids like Vesta, Pallas)
    if (window.dwarfPlanetsComets && window.dwarfPlanetsComets.asteroids && window.dwarfPlanetsComets.asteroids[objectId]) {
        const asteroidMesh = window.dwarfPlanetsComets.asteroids[objectId];
        const asteroidData = window.dwarfPlanetsComets.asteroidData[objectId];
        if (asteroidMesh && asteroidData) {
            cameraFollowTarget = objectId;
            followTargetObject = asteroidMesh;
            
            const cameraDistance = asteroidData.size * 10;
            const offset = new THREE.Vector3(cameraDistance, cameraDistance * 0.5, cameraDistance);
            camera.position.copy(asteroidMesh.position).add(offset);
            camera.lookAt(asteroidMesh.position);
            
            updateDestinationInfo(asteroidData);
            updateCameraModeDisplay();
            devLog.success(`Navigating to asteroid: ${asteroidData.name}`);
            return true;
        }
    }
    
    devLog.error(`Could not find object: ${objectId}`);
    return false;
}

// Expose navigateToObject globally for other modules
window.navigateToObject = navigateToObject;

function travelTo(destination) {
    // First try the new navigation system for all object types
    if (!celestialBodies[destination]) {
        if (navigateToObject(destination)) {
            return;
        }
    }
    
    const data = celestialBodies[destination];
    if (!data) {
        devLog.error(`Unknown destination: ${destination}`);
        return;
    }
    
    // Check if body has been created yet
    if (!bodies[destination]) {
        devLog.warning(`Waiting for ${destination} to load...`);
        setTimeout(() => travelTo(destination), 100);
        return;
    }
    
    devLog.info(`Traveling to ${data.name}`);
    
    currentDestination = destination;
    followTargetObject = null; // Clear any non-celestial follow target
    manualCameraControl = false; // Reset manual control when traveling to new destination
    updateCameraModeDisplay(); // Update the camera mode display
    
    // Use smooth transition system
    CameraController.transitionToTarget(destination);
    CameraController.autoFrameObject(destination);
    
    // Get the actual current position for moving objects
    let actualPosition = new THREE.Vector3();
    if (bodies[destination]) {
        actualPosition.copy(bodies[destination].position);
    } else {
        actualPosition.copy(data.position);
    }
    
    targetPosition.copy(actualPosition);
    
    // Special camera positioning for different objects
    const objectSize = data.size || 1;
    cameraDistance = objectSize * 5; // Base distance proportional to object size
    
    if (destination === 'moon') {
        // Calculate distance to make Moon fill 40% of screen
        // FOV is 75 degrees, Moon size is 0.05
        const moonSize = SUN_SIZE * SIZE_RATIOS.moon;
        cameraDistance = moonSize * 1.5; // This will make Moon appear at roughly 40% of screen
    } else if (destination === 'sun') {
        cameraDistance = 100; // Further for Sun
    } else if (destination === 'blackhole') {
        // Position camera for optimal black hole viewing
        cameraDistance = objectSize * 10; // Further back to see the full effect
        cameraOffset.set(0, 0.2, 1); // Slight elevation
    } else if (['jupiter', 'saturn', 'uranus', 'neptune'].includes(destination)) {
        cameraDistance = objectSize * 3; // Proportional for large planets
    }
    
    // Apply offset to initial target position with user zoom
    const offsetVector = cameraOffset.clone().normalize();
    offsetVector.multiplyScalar(cameraDistance * userZoomFactor);
    targetPosition.add(offsetVector);
    
    isMoving = true;
    
    // Show comprehensive info panel
    if (window.infoPanels && window.infoPanels.show) {
        window.infoPanels.show(data);
    }
    
    // Highlight active button
    document.querySelectorAll('button').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`btn-${destination}`).classList.add('active');
}

// Set up UI controls when DOM is ready
// Initialize tabbed navigation system
function initializeTabNavigation() {
    console.log('Initializing tabbed navigation...');
    
    // Tab switching functionality
    const navTabs = document.querySelectorAll('.nav-tab');
    const tabContents = document.querySelectorAll('.tab-content');
    
    navTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetTab = tab.getAttribute('data-tab');
            
            // Remove active class from all tabs and content
            navTabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            // Add active class to clicked tab and corresponding content
            tab.classList.add('active');
            const targetContent = document.querySelector(`[data-content="${targetTab}"]`);
            if (targetContent) {
                targetContent.classList.add('active');
            }
            
            devLog.info(`Tab switched to: ${targetTab}`);
        });
    });
    
    // Populate dynamic content
    populateTabContent();
    
    // Add click handlers for all object cards after a small delay to ensure DOM is ready
    setTimeout(() => {
        setupObjectCardClickHandlers();
    }, 100);
}

// Populate dynamic tab content
function populateTabContent() {
    console.log('Populating tab content...');
    
    // Populate moons tab
    if (window.moonSystems && window.moonSystems.moonData) {
        populateMoonsTab(window.moonSystems.moonData);
    }
    
    // Populate asteroids tab
    if (window.asteroidBelt && window.asteroidBelt.majorAsteroids) {
        populateAsteroidsTab(window.asteroidBelt.majorAsteroids);
    }
    
    // Populate spacecraft tab
    if (window.spacecraftTracker && window.spacecraftTracker.missions) {
        populateSpacecraftTab(window.spacecraftTracker.missions);
    }
    
    // Populate special objects tab
    if (window.dwarfPlanetsComets) {
        populateSpecialObjectsTab();
    }
    
    // Re-attach click handlers for all newly created buttons
    setupObjectCardClickHandlers();
}

// Populate moons tab with moon data
function populateMoonsTab(moonData) {
    const moonsGrid = document.getElementById('moons-grid');
    if (!moonsGrid) return;
    
    // Clear existing content except Earth's Moon button
    const earthMoonButton = document.getElementById('btn-moon');
    moonsGrid.innerHTML = '';
    if (earthMoonButton) {
        moonsGrid.appendChild(earthMoonButton);
    }
    
    // Add other moons
    Object.entries(moonData).forEach(([planet, moons]) => {
        Object.entries(moons).forEach(([key, moon]) => {
            const card = document.createElement('button');
            card.className = 'object-card';
            card.id = `btn-${key}`;
            
            // Determine moon type for icon
            let moonType = 'moon';
            if (planet === 'jupiter') moonType = 'jovian-moon';
            else if (planet === 'saturn') moonType = 'saturnian-moon';
            else if (moon.info && moon.info.toLowerCase().includes('ice')) moonType = 'ice-moon';
            
            card.innerHTML = `
                <div class="object-icon ${moonType}"></div>
                <div class="object-info">
                    <span class="object-name">${moon.name}</span>
                    <span class="object-type">${planet.charAt(0).toUpperCase() + planet.slice(1)}'s Moon</span>
                </div>
            `;
            
            moonsGrid.appendChild(card);
        });
    });
    
    devLog.success('Moons tab populated');
}

// Populate asteroids tab
function populateAsteroidsTab(asteroidData) {
    const asteroidsGrid = document.getElementById('asteroids-grid');
    if (!asteroidsGrid) return;
    
    Object.entries(asteroidData).forEach(([key, asteroid]) => {
        const card = document.createElement('button');
        card.className = 'object-card';
        card.id = `btn-${key}`;
        
        card.innerHTML = `
            <div class="object-icon asteroid"></div>
            <div class="object-info">
                <span class="object-name">${asteroid.name}</span>
                <span class="object-type">Asteroid</span>
            </div>
        `;
        
        asteroidsGrid.appendChild(card);
    });
    
    devLog.success('Asteroids tab populated');
}

// Populate spacecraft tab
function populateSpacecraftTab(missionData) {
    const spacecraftGrid = document.getElementById('spacecraft-grid');
    if (!spacecraftGrid) return;
    
    // Clear existing spacecraft buttons to prevent duplicates
    spacecraftGrid.innerHTML = '';
    
    Object.entries(missionData).forEach(([key, mission]) => {
        const card = document.createElement('button');
        card.className = 'object-card';
        card.id = `btn-${key}`;
        
        const statusColor = mission.status === 'Active' ? 'Active Mission' : 'Historic Mission';
        
        card.innerHTML = `
            <div class="object-icon spacecraft"></div>
            <div class="object-info">
                <span class="object-name">${mission.name}</span>
                <span class="object-type">${statusColor}</span>
            </div>
        `;
        
        spacecraftGrid.appendChild(card);
    });
    
    devLog.success('Spacecraft tab populated');
}

// Populate special objects tab
function populateSpecialObjectsTab() {
    const specialGrid = document.querySelector('[data-content="special"] .object-grid');
    if (!specialGrid) return;
    
    // Clear existing content except the black hole and ISS
    const existingCards = specialGrid.querySelectorAll('.object-card:not(#btn-blackhole):not(#btn-iss)');
    existingCards.forEach(card => card.remove());
    
    // Add ISS if it doesn't exist
    if (!document.getElementById('btn-iss')) {
        const issCard = document.createElement('button');
        issCard.className = 'object-card';
        issCard.id = 'btn-iss';
        issCard.innerHTML = `
            <div class="object-icon spacecraft"></div>
            <div class="object-info">
                <span class="object-name">ISS</span>
                <span class="object-type">Space Station</span>
            </div>
        `;
        // Insert ISS after black hole
        const blackholeBtn = document.getElementById('btn-blackhole');
        if (blackholeBtn && blackholeBtn.nextSibling) {
            specialGrid.insertBefore(issCard, blackholeBtn.nextSibling);
        } else {
            specialGrid.appendChild(issCard);
        }
    }
    
    // Add dwarf planets
    if (window.dwarfPlanetsComets && window.dwarfPlanetsComets.dwarfPlanetData) {
        Object.entries(window.dwarfPlanetsComets.dwarfPlanetData).forEach(([key, dwarfPlanet]) => {
            const card = document.createElement('button');
            card.className = 'object-card';
            card.id = `btn-${key}`;
            
            // Use appropriate icon based on the dwarf planet
            let iconClass = 'asteroid'; // Default
            if (key === 'pluto') iconClass = 'ice-moon'; // Pluto is icy
            else if (key === 'ceres') iconClass = 'asteroid'; // Ceres is in asteroid belt
            else if (key === 'eris' || key === 'makemake') iconClass = 'ice-moon'; // Icy bodies
            
            card.innerHTML = `
                <div class="object-icon ${iconClass}"></div>
                <div class="object-info">
                    <span class="object-name">${dwarfPlanet.name}</span>
                    <span class="object-type">Dwarf Planet</span>
                </div>
            `;
            
            specialGrid.appendChild(card);
        });
    }
    
    // Add comets
    if (window.dwarfPlanetsComets && window.dwarfPlanetsComets.cometData) {
        Object.entries(window.dwarfPlanetsComets.cometData).forEach(([key, comet]) => {
            const card = document.createElement('button');
            card.className = 'object-card';
            card.id = `btn-${key}`;
            
            card.innerHTML = `
                <div class="object-icon comet"></div>
                <div class="object-info">
                    <span class="object-name">${comet.name}</span>
                    <span class="object-type">Comet</span>
                </div>
            `;
            
            specialGrid.appendChild(card);
        });
    }
    
    devLog.success('Special objects tab populated');
}

// Setup click handlers for all object cards
function setupObjectCardClickHandlers() {
    const objectCards = document.querySelectorAll('.object-card');
    
    objectCards.forEach(card => {
        card.addEventListener('click', () => {
            const objectId = card.id.replace('btn-', '');
            
            // Try to travel to the object
            try {
                devLog.info(`Object card clicked: ${objectId}`);
                
                // Use the new navigation function that handles all object types
                navigateToObject(objectId);
                
            } catch (error) {
                devLog.error(`Error handling object card click for ${objectId}: ${error.message}`);
                console.error(error);
            }
        });
    });
    
    devLog.success(`Setup click handlers for ${objectCards.length} object cards`);
}

// Initialize dev console enhancements
function initDevConsoleEnhancements() {
    if (!devLogContainer) return;
    
    const header = document.getElementById('dev-log-header');
    const clearBtn = document.getElementById('dev-console-clear');
    const exportBtn = document.getElementById('dev-console-export');
    const autoScrollBtn = document.getElementById('dev-console-auto-scroll');
    
    if (!header) return;
    
    // Initialize drag functionality
    header.addEventListener('mousedown', startDrag);
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', stopDrag);
    
    // Initialize button handlers
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            devLogContent.innerHTML = '';
            devLogs = [];
            localStorage.removeItem('spaceSimDevLogs');
            devLog.info('Console cleared');
        });
    }
    
    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            devLog.export();
        });
    }
    
    if (autoScrollBtn) {
        updateAutoScrollButton();
        autoScrollBtn.addEventListener('click', () => {
            devConsoleAutoScroll = !devConsoleAutoScroll;
            updateAutoScrollButton();
            if (devConsoleAutoScroll) {
                devLogContent.scrollTop = devLogContent.scrollHeight;
            }
        });
    }
    
    // Detect manual scrolling to disable auto-scroll
    devLogContent.addEventListener('scroll', () => {
        const isAtBottom = devLogContent.scrollTop >= devLogContent.scrollHeight - devLogContent.clientHeight - 10;
        if (!isAtBottom && devConsoleAutoScroll) {
            devConsoleAutoScroll = false;
            updateAutoScrollButton();
        } else if (isAtBottom && !devConsoleAutoScroll) {
            devConsoleAutoScroll = true;
            updateAutoScrollButton();
        }
    });
    
    function updateAutoScrollButton() {
        if (autoScrollBtn) {
            autoScrollBtn.textContent = devConsoleAutoScroll ? '📍' : '⭕';
            autoScrollBtn.title = devConsoleAutoScroll ? 'Auto-scroll enabled' : 'Auto-scroll disabled';
            autoScrollBtn.style.background = devConsoleAutoScroll ? 'rgba(0, 255, 0, 0.2)' : 'none';
        }
    }
    
    function startDrag(e) {
        if (e.target.closest('.dev-console-controls')) return; // Don't drag when clicking buttons
        
        devConsoleDragState.isDragging = true;
        devConsoleDragState.startX = e.clientX;
        devConsoleDragState.startY = e.clientY;
        
        const rect = devLogContainer.getBoundingClientRect();
        devConsoleDragState.startLeft = rect.left;
        devConsoleDragState.startTop = rect.top;
        
        devLogContainer.style.cursor = 'grabbing';
        header.style.cursor = 'grabbing';
        
        e.preventDefault();
    }
    
    function drag(e) {
        if (!devConsoleDragState.isDragging) return;
        
        const deltaX = e.clientX - devConsoleDragState.startX;
        const deltaY = e.clientY - devConsoleDragState.startY;
        
        const newLeft = devConsoleDragState.startLeft + deltaX;
        const newTop = devConsoleDragState.startTop + deltaY;
        
        // Keep console within viewport bounds
        const maxLeft = window.innerWidth - devLogContainer.offsetWidth;
        const maxTop = window.innerHeight - devLogContainer.offsetHeight;
        
        const constrainedLeft = Math.max(0, Math.min(maxLeft, newLeft));
        const constrainedTop = Math.max(0, Math.min(maxTop, newTop));
        
        devLogContainer.style.left = constrainedLeft + 'px';
        devLogContainer.style.top = constrainedTop + 'px';
        devLogContainer.style.right = 'auto';
        devLogContainer.style.bottom = 'auto';
        
        e.preventDefault();
    }
    
    function stopDrag() {
        devConsoleDragState.isDragging = false;
        devLogContainer.style.cursor = '';
        header.style.cursor = 'move';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded event fired');
    
    try {
        // Initialize dev mode
        devLogContainer = document.getElementById('dev-log-container');
        devLogContent = document.getElementById('dev-log-content');
        
        console.log('Dev containers found:', !!devLogContainer, !!devLogContent);
        
        // Initialize dev console enhancements
        initDevConsoleEnhancements();
    
    // Load previous logs from localStorage
    try {
        const savedLogs = localStorage.getItem('spaceSimDevLogs');
        if (savedLogs) {
            devLogs = JSON.parse(savedLogs);
            devLog.info(`Loaded ${devLogs.length} previous log entries from localStorage`);
            
            // Add a separator for new session
            const separator = document.createElement('div');
            separator.className = 'dev-log-entry info';
            separator.style.borderTop = '1px solid #0ff';
            separator.style.marginTop = '10px';
            separator.style.paddingTop = '5px';
            separator.innerHTML = '<span class="dev-log-timestamp">--------</span>NEW SESSION';
            devLogContent.appendChild(separator);
        }
    } catch (e) {
        console.warn('Failed to load previous logs:', e);
    }
    
    // Start with low mode for better texture compatibility
    simulationMode = 'low';
    modeButton = document.getElementById('btn-mode-toggle');
    if (!modeButton) {
        devLog.error('CRITICAL: Mode toggle button not found in DOM!');
        console.error('Mode button element not found');
    } else {
        modeText = modeButton.querySelector('.mode-text');
        if (!modeText) {
            devLog.error('CRITICAL: Mode text span not found!');
        } else {
            modeButton.setAttribute('data-mode', 'low');
            modeText.textContent = 'LOW';
            devLog.success('Mode button initialized successfully');
        }
    }
    
    devLog.info('Space Travel Simulator initializing...');
    devLog.info('Dev mode: ON');
    devLog.info('Quality mode: HIGH');
    devLog.info('Press Ctrl/Cmd + L to export logs');
    
    // Dev mode toggle handler
    const devModeCheckbox = document.getElementById('dev-mode-checkbox');
    devModeCheckbox.addEventListener('change', (e) => {
        devMode = e.target.checked;
        if (devMode) {
            devLogContainer.classList.add('dev-mode-active');
            devLog.info('Dev mode enabled');
            
            // Track dev mode usage for analytics
            if (window.dashboardController && window.dashboardController.dashboard) {
                window.dashboardController.dashboard.trackUserInteraction('dev_mode_enabled', {
                    feature: 'dev_console'
                });
            }
            
            // Open performance dashboard when dev mode is enabled
            openDashboardInNewTab();
            
        } else {
            devLogContainer.classList.remove('dev-mode-active');
            devLog.info('Dev mode disabled');
        }
    });

    // Function to open dashboard in new tab
    function openDashboardInNewTab() {
        // Use performance dashboard
        devLog.info('Opening Performance Dashboard');
        
        let retryCount = 0;
        const maxRetries = 10;
        
        const tryOpenDashboard = () => {
            devLog.info('Checking dashboard dependencies...');
            devLog.info('PerformanceDashboard available:', !!window.performanceDashboard);
            devLog.info('PerformanceDashboard class available:', typeof PerformanceDashboard !== 'undefined');
            
            if (window.performanceDashboard) {
                try {
                    devLog.info('Opening performance dashboard...');
                    window.performanceDashboard.show();
                    devLog.success('Performance dashboard opened successfully');
                } catch (error) {
                    devLog.error('Failed to open dashboard:', error);
                }
            } else if (typeof PerformanceDashboard !== 'undefined') {
                try {
                    devLog.info('Initializing performance dashboard...');
                    window.performanceDashboard = new PerformanceDashboard();
                    window.performanceDashboard.show();
                    devLog.success('Performance dashboard initialized and opened');
                } catch (error) {
                    devLog.error('Failed to initialize dashboard:', error);
                }
            } else {
                // Dashboard not ready, try again
                retryCount++;
                if (retryCount >= maxRetries) {
                    devLog.error('Failed to open dashboard after ' + maxRetries + ' attempts');
                    devLog.error('PerformanceDashboard:', !!window.performanceDashboard);
                    devLog.error('PerformanceDashboard class:', typeof PerformanceDashboard !== 'undefined');
                    return;
                }
                
                devLog.warning('Dashboard not ready, retrying... (' + retryCount + '/' + maxRetries + ')');
                setTimeout(tryOpenDashboard, 500);
            }
        };
        
        tryOpenDashboard();
    }
    
    // Initialize Three.js scene
    initializeScene();
    
    // Initialize skybox
    createSkybox();
    
    // Create celestial bodies
    createCelestialBodies();
    
    // Initialize mouse controls
    initializeMouseControls();
    
    // Setup resize handler
    setupResizeHandler();
    
    // Button event listeners
    Object.keys(celestialBodies).forEach(key => {
        const button = document.getElementById(`btn-${key}`);
        if (button) {
            button.addEventListener('click', () => {
                try {
                    devLog.info(`Button clicked: ${key}`);
                    
                    // Track planet view for analytics
                    if (window.dashboardController && window.dashboardController.dashboard) {
                        window.dashboardController.dashboard.trackUserInteraction('planet_view', {
                            target: key,
                            feature: 'navigation_button'
                        });
                    }
                    
                    travelTo(key);
                } catch (error) {
                    devLog.error(`Error handling button click for ${key}: ${error.message}`);
                    console.error(error);
                }
            });
            devLog.success(`Button registered: ${key}`);
        } else {
            devLog.error(`Button not found for ${key} - check HTML`);
        }
    });

    // Speed control removed - now handled by time controls

    // Scale control
    const scaleSlider = document.getElementById('scale-slider');
    const scaleLabel = document.getElementById('scale-label');
    scaleSlider.addEventListener('input', (e) => {
        const newScale = parseInt(e.target.value);
        
        // Track scale adjustment for analytics
        if (window.dashboardController && window.dashboardController.dashboard) {
            window.dashboardController.dashboard.trackUserInteraction('scale_adjustment', {
                value: newScale,
                feature: 'scale_control'
            });
        }
        scaleLabel.textContent = newScale;
        updateScale(newScale);
    });

    // Orbit toggle
    const orbitToggle = document.getElementById('orbit-toggle');
    orbitToggle.addEventListener('click', (e) => {
        e.preventDefault();
        orbitsVisible = !orbitsVisible;
        orbitToggle.classList.toggle('active', orbitsVisible);
        updateOrbitVisibility();
        console.log('OrbitToggle: Orbits visibility set to', orbitsVisible);
        
        // Track toggle for AI insights
        if (window.dashboardController && window.dashboardController.dashboard) {
            window.dashboardController.dashboard.trackUserInteraction('toggle', {
                feature: 'orbits',
                enabled: orbitsVisible
            });
        }
    });

    // Labels toggle
    const labelsToggle = document.getElementById('labels-toggle');
    if (labelsToggle) {
        let labelsVisible = true; // Default state
        labelsToggle.addEventListener('click', (e) => {
            e.preventDefault();
            labelsVisible = !labelsVisible;
            labelsToggle.classList.toggle('active', labelsVisible);
            
            if (planetLabels) {
                Object.entries(celestialBodies).forEach(([key, body]) => {
                    if (key !== 'sun' && key !== 'blackhole') {
                        if (labelsVisible) {
                            planetLabels.showLabel(body.name);
                        } else {
                            planetLabels.hideLabel(body.name);
                        }
                    }
                });
            }
            devLog.info(`Labels ${labelsVisible ? 'shown' : 'hidden'}`);
            console.log('LabelsToggle: Labels visibility set to', labelsVisible);
            
            // Track toggle for AI insights
            if (window.dashboardController && window.dashboardController.dashboard) {
                window.dashboardController.dashboard.trackUserInteraction('toggle', {
                    feature: 'labels',
                    enabled: labelsVisible
                });
            }
        });
    }

    // Trails toggle
    const trailsToggle = document.getElementById('trails-toggle');
    if (trailsToggle) {
        let trailsVisible = false; // Default state (off)
        trailsToggle.addEventListener('click', (e) => {
            e.preventDefault();
            trailsVisible = !trailsVisible;
            trailsToggle.classList.toggle('active', trailsVisible);
            
            if (orbitTrails) {
                Object.keys(celestialBodies).forEach(key => {
                    orbitTrails.setTrailVisibility(key, trailsVisible);
                });
            }
            devLog.info(`Orbit trails ${trailsVisible ? 'shown' : 'hidden'}`);
            console.log('TrailsToggle: Trails visibility set to', trailsVisible);
            
            // Track toggle for AI insights
            if (window.dashboardController && window.dashboardController.dashboard) {
                window.dashboardController.dashboard.trackUserInteraction('toggle', {
                    feature: 'trails',
                    enabled: trailsVisible
                });
            }
        });
    }
    
    // Moons toggle
    const moonsToggle = document.getElementById('moons-toggle');
    if (moonsToggle) {
        let moonsVisible = true; // Default state
        moonsToggle.addEventListener('click', (e) => {
            e.preventDefault();
            moonsVisible = !moonsVisible;
            moonsToggle.classList.toggle('active', moonsVisible);
            
            if (window.moonSystems) {
                window.moonSystems.setVisibility(moonsVisible);
            }
            devLog.info(`Moons ${moonsVisible ? 'shown' : 'hidden'}`);
            console.log('MoonsToggle: Moons visibility set to', moonsVisible);
            
            // Track toggle for AI insights
            if (window.dashboardController && window.dashboardController.dashboard) {
                window.dashboardController.dashboard.trackUserInteraction('toggle', {
                    feature: 'moons',
                    enabled: moonsVisible
                });
            }
        });
    }
    
    // Asteroids toggle
    const asteroidsToggle = document.getElementById('asteroids-toggle');
    if (asteroidsToggle) {
        let asteroidsVisible = true; // Default state
        asteroidsToggle.addEventListener('click', (e) => {
            e.preventDefault();
            asteroidsVisible = !asteroidsVisible;
            asteroidsToggle.classList.toggle('active', asteroidsVisible);
            
            if (window.asteroidBelt) {
                window.asteroidBelt.setVisibility(asteroidsVisible);
            }
            devLog.info(`Asteroids ${asteroidsVisible ? 'shown' : 'hidden'}`);
            console.log('AsteroidsToggle: Asteroids visibility set to', asteroidsVisible);
            
            // Track toggle for AI insights
            if (window.dashboardController && window.dashboardController.dashboard) {
                window.dashboardController.dashboard.trackUserInteraction('toggle', {
                    feature: 'asteroids',
                    enabled: asteroidsVisible
                });
            }
        });
    }
    
    // Spacecraft toggle
    const spacecraftToggle = document.getElementById('spacecraft-toggle');
    if (spacecraftToggle) {
        let spacecraftVisible = true; // Default state
        spacecraftToggle.addEventListener('click', (e) => {
            e.preventDefault();
            spacecraftVisible = !spacecraftVisible;
            spacecraftToggle.classList.toggle('active', spacecraftVisible);
            
            if (window.spacecraftTracker) {
                window.spacecraftTracker.setVisibility(spacecraftVisible);
            }
            
            // Track toggle for AI insights
            if (window.dashboardController && window.dashboardController.dashboard) {
                window.dashboardController.dashboard.trackUserInteraction('toggle', {
                    feature: 'spacecraft',
                    enabled: spacecraftVisible
                });
            }
            
            devLog.info(`Spacecraft ${spacecraftVisible ? 'shown' : 'hidden'}`);
            console.log('SpacecraftToggle: Spacecraft visibility set to', spacecraftVisible);
        });
    }
    
    // Atmospheres toggle
    const atmospheresToggle = document.getElementById('atmospheres-toggle');
    if (atmospheresToggle) {
        let atmospheresVisible = true; // Default state
        atmospheresToggle.addEventListener('click', (e) => {
            e.preventDefault();
            atmospheresVisible = !atmospheresVisible;
            atmospheresToggle.classList.toggle('active', atmospheresVisible);
            
            // Toggle visibility of all atmosphere meshes
            for (const [key, body] of Object.entries(bodies)) {
                if (body && body.children) {
                    body.children.forEach(child => {
                        if (child.userData && child.userData.isAtmosphere) {
                            child.visible = atmospheresVisible;
                        }
                    });
                }
            }
            // Track toggle for AI insights
            if (window.dashboardController && window.dashboardController.dashboard) {
                window.dashboardController.dashboard.trackUserInteraction('toggle', {
                    feature: 'atmospheres',
                    enabled: atmospheresVisible
                });
            }
            
            devLog.info(`Atmospheres ${atmospheresVisible ? 'shown' : 'hidden'}`);
            console.log('AtmospheresToggle: Atmospheres visibility set to', atmospheresVisible);
        });
    }
    
    // Measurements toggle
    const measurementsToggle = document.getElementById('measurements-toggle');
    if (measurementsToggle && window.measurementTools) {
        measurementsToggle.addEventListener('click', (e) => {
            e.preventDefault();
            window.measurementTools.toggle();
            measurementsToggle.classList.toggle('active', window.measurementTools.isActive());
            devLog.info(`Measurement tools ${window.measurementTools.isActive() ? 'enabled' : 'disabled'}`);
            
            // Track toggle for AI insights
            if (window.dashboardController && window.dashboardController.dashboard) {
                window.dashboardController.dashboard.trackUserInteraction('toggle', {
                    feature: 'measurements',
                    enabled: window.measurementTools.isActive()
                });
            }
        });
    }
    
    // Dwarf planets and comets toggle
    const dwarfCometsToggle = document.getElementById('dwarf-comets-toggle');
    if (dwarfCometsToggle && window.dwarfPlanetsComets) {
        let dwarfCometsVisible = true; // Default state
        dwarfCometsToggle.addEventListener('click', (e) => {
            e.preventDefault();
            dwarfCometsVisible = !dwarfCometsVisible;
            dwarfCometsToggle.classList.toggle('active', dwarfCometsVisible);
            window.dwarfPlanetsComets.setVisibility(dwarfCometsVisible);
            devLog.info(`Dwarf planets and comets ${dwarfCometsVisible ? 'shown' : 'hidden'}`);
            
            // Track toggle for AI insights
            if (window.dashboardController && window.dashboardController.dashboard) {
                window.dashboardController.dashboard.trackUserInteraction('toggle', {
                    feature: 'dwarf_comets',
                    enabled: dwarfCometsVisible
                });
            }
        });
    }

    // Mode toggle
    if (modeButton) {
        modeButton.addEventListener('click', () => {
            try {
                devLog.info(`Mode button clicked. Current mode: ${simulationMode}`);
                if (simulationMode === 'low') {
                    simulationMode = 'high';
                    modeButton.setAttribute('data-mode', 'high');
                    modeText.textContent = 'HIGH';
                    devLog.success('Switched to HIGH mode');
                } else {
                    simulationMode = 'low';
                    modeButton.setAttribute('data-mode', 'low');
                    modeText.textContent = 'LOW';
                    devLog.success('Switched to LOW mode');
                }
                
                // Call function to apply mode changes
                applyModeSettings();
                
                // Track mode change for AI insights
                if (window.dashboardController && window.dashboardController.dashboard) {
                    window.dashboardController.dashboard.trackUserInteraction('mode_change', {
                        mode: simulationMode,
                        feature: 'quality_settings'
                    });
                }
            } catch (error) {
                devLog.error(`Error in mode toggle: ${error.message}`);
                console.error(error);
            }
        });
        devLog.success('Mode toggle button registered');
    } else {
        devLog.error('Mode toggle button not found!');
    }
    
    // Cinematic buttons
    const cinematicButtons = {
        'btn-overview': 'solarSystemOverview',
        'btn-planet-tour': 'planetTour',
        'btn-sun-dive': 'sunDive'
    };
    
    Object.entries(cinematicButtons).forEach(([btnId, shotName]) => {
        const btn = document.getElementById(btnId);
        if (btn) {
            btn.addEventListener('click', () => {
                if (window.cinematicCamera) {
                    window.cinematicCamera.startCinematicShot(shotName);
                    devLog.info(`Started cinematic shot: ${shotName}`);
                    
                    // Track cinematic camera use for AI insights
                    if (window.dashboardController && window.dashboardController.dashboard) {
                        window.dashboardController.dashboard.trackUserInteraction('cinematic_camera', {
                            shot: shotName,
                            feature: 'camera_control'
                        });
                    }
                }
            });
        }
    });
    
    // Initialize tabbed navigation system
    initializeTabNavigation();
    
    // Start animation loop
    console.log('Starting animation loop...');
    animate();
    
    } catch (error) {
        console.error('Critical error during initialization:', error);
        devLog.error(`Critical initialization error: ${error.message}`);
        // Show error in UI
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: red; color: white; padding: 20px; z-index: 10000;';
        errorDiv.textContent = `Error: ${error.message}. Check browser console.`;
        document.body.appendChild(errorDiv);
    }
});

// Function to apply mode-specific settings
function applyModeSettings() {
    try {
        devLog.info(`Applying ${simulationMode} mode settings...`);
        
        // Show loading indicator
        const loadingIndicator = document.getElementById('loading-indicator');
        if (loadingIndicator) {
            loadingIndicator.style.display = 'block';
            loadingIndicator.textContent = `Loading ${simulationMode} quality textures...`;
        }
        
        // Reload all celestial bodies with new textures
        // This will be called when textures are available
        reloadTexturesForMode();
        
        // Mode-specific settings
        if (simulationMode === 'high') {
            // High quality settings
            renderer.shadowMap.enabled = true;
            renderer.shadowMap.type = THREE.PCFSoftShadowMap;
            renderer.antialias = true;
            devLog.success('High quality settings applied');
        } else {
            // Low quality settings for better performance
            renderer.shadowMap.enabled = false;
            renderer.antialias = false;
            devLog.success('Low quality settings applied');
        }
    } catch (error) {
        devLog.error(`Error in applyModeSettings: ${error.message}`);
        console.error(error);
    }
}

// Function to reload textures based on current mode
async function reloadTexturesForMode() {
    try {
        devLog.info(`Reloading textures for ${simulationMode} mode...`);
        
        // Clear existing bodies and recreate with new textures
        Object.entries(bodies).forEach(([key, body]) => {
            if (body) {
                scene.remove(body);
                // Dispose of old textures to free memory
                if (body.material) {
                    if (body.material.map) body.material.map.dispose();
                    if (body.material.bumpMap) body.material.bumpMap.dispose();
                    if (body.material.specularMap) body.material.specularMap.dispose();
                    if (body.material.emissiveMap) body.material.emissiveMap.dispose();
                    body.material.dispose();
                }
                if (body.geometry) body.geometry.dispose();
            }
        });
        
        // Clear orbits
        Object.values(orbits).forEach(orbit => {
            scene.remove(orbit);
        });
        
        // Reset bodies and orbits
        Object.keys(bodies).forEach(key => delete bodies[key]);
        Object.keys(orbits).forEach(key => delete orbits[key]);
        
        devLog.info('Cleared old bodies and orbits');
        
        // Recreate all celestial bodies with new textures
        await createCelestialBodies();
        
        // Recreate skybox with new resolution textures
        await createSkybox();
        
        // Hide loading indicator and disable animation
        const loadingIndicator = document.getElementById('loading-indicator');
        if (loadingIndicator) {
            loadingIndicator.style.display = 'none';
            loadingIndicator.style.animation = 'none';
        }
        
        devLog.success(`Texture reload complete for ${simulationMode} mode`);
    } catch (error) {
        devLog.error(`Error in reloadTexturesForMode: ${error.message}`);
        console.error(error);
        // Hide loading indicator even on error
        const loadingIndicator = document.getElementById('loading-indicator');
        if (loadingIndicator) {
            loadingIndicator.style.display = 'none';
        }
    }
}

// Animation variables
let moonAngle = 0;
let auroraTime = 0;

// Animation loop with frame timing
let lastFrameTime = performance.now();

function animate(currentTime = performance.now()) {
    requestAnimationFrame(animate);
    
    try {
        // Performance monitoring - start of frame
        if (window.performanceMonitor) {
            window.performanceMonitor.update();
        }
        
        // Calculate delta time for smooth movement
        const deltaTime = (currentTime - lastFrameTime) / 1000; // Convert to seconds
        lastFrameTime = currentTime;
        
        // Update advanced camera system with fallback
        try {
            CameraController.update(deltaTime);
        } catch (error) {
            devLog.error('Camera controller error:', error);
            // Fallback to basic camera positioning if the advanced system fails
            if (!camera.position || camera.position.length() === 0) {
                camera.position.set(200, 100, 200);
                camera.lookAt(0, 0, 0);
            }
        }
    
    // Update planet positions based on orbits or ephemeris
    Object.entries(celestialBodies).forEach(([key, data]) => {
        if (data.orbitRadius && data.orbitSpeed && bodies[key]) {
            // Only use simple orbital mechanics if we don't have ephemeris data
            if (!window.timeControls || !window.ephemerisEngine) {
                orbitAngles[key] += data.orbitSpeed;
                const x = Math.cos(orbitAngles[key]) * data.orbitRadius * AU_SCALE;
                const z = Math.sin(orbitAngles[key]) * data.orbitRadius * AU_SCALE;
                bodies[key].position.set(x, 0, z);
            }
            
            // Update label position
            if (planetLabels) {
                planetLabels.updateLabel(data.name, bodies[key].position);
            }
            
            // Update orbit trail
            if (orbitTrails) {
                orbitTrails.updateTrail(key, bodies[key].position);
            }
            
            // Update sun effects position if this is the sun
            if (key === 'sun') {
                if (window.sunEffects) {
                    window.sunEffects.updatePosition(bodies[key].position);
                }
                if (window.realisticSun) {
                    window.realisticSun.updatePosition(bodies[key].position);
                }
                // Update light positions to follow sun
                if (pointLight) {
                    pointLight.position.copy(bodies[key].position);
                }
                if (fillLight) {
                    fillLight.position.copy(bodies[key].position);
                }
            }
            
            // Update associated objects for Earth
            if (key === 'earth') {
                const earthPos = bodies[key].position;
                if (bodies.earth_clouds) bodies.earth_clouds.position.copy(earthPos);
                if (bodies.earth_atmosphere) bodies.earth_atmosphere.position.copy(earthPos);
                if (bodies.earth_daynight) bodies.earth_daynight.position.copy(earthPos);
                if (bodies.earth_aurora_north) bodies.earth_aurora_north.position.copy(earthPos);
                if (bodies.earth_aurora_south) bodies.earth_aurora_south.position.copy(earthPos);
            }
            
            // Update associated objects for black hole
            if (key === 'blackhole') {
                const blackHolePos = bodies[key].position;
                // Update shader uniforms
                if (bodies.blackhole_shader) {
                    bodies.blackhole_shader.uniforms.time.value = performance.now() * 0.001;
                    bodies.blackhole_shader.uniforms.resolution.value.set(window.innerWidth, window.innerHeight);
                    bodies.blackhole_shader.uniforms.cameraPosition.value.copy(camera.position);
                    bodies.blackhole_shader.uniforms.cameraMatrix.value.copy(camera.matrixWorld);
                }
                // Make plane face camera
                if (bodies[key] && bodies[key].geometry.type === 'PlaneGeometry') {
                    bodies[key].lookAt(camera.position);
                }
            }
            
            // Update black hole effects position
            if (key === 'blackhole') {
                const bhPos = bodies[key].position;
                if (bodies.blackhole_disk) bodies.blackhole_disk.position.copy(bhPos);
                if (bodies.blackhole_glow_0) bodies.blackhole_glow_0.position.copy(bhPos);
                if (bodies.blackhole_glow_1) bodies.blackhole_glow_1.position.copy(bhPos);
                if (bodies.blackhole_glow_2) bodies.blackhole_glow_2.position.copy(bhPos);
            }
        }
    });
    
    // Update Moon orbit around Earth
    if (bodies.moon && bodies.earth) {
        moonAngle += 0.01;
        const moonDistance = 2; // Much closer for visibility
        bodies.moon.position.x = bodies.earth.position.x + Math.cos(moonAngle) * moonDistance;
        bodies.moon.position.z = bodies.earth.position.z + Math.sin(moonAngle) * moonDistance;
        bodies.moon.position.y = bodies.earth.position.y + Math.sin(moonAngle * 0.1) * 0.2; // Slight inclination
    }
    
    
    // Update Earth's day/night cycle with sun direction
    if (bodies.earth && bodies.sun) {
        const earthToSun = new THREE.Vector3().subVectors(bodies.sun.position, bodies.earth.position).normalize();
        
        // Update Earth material sun direction if using shader material
        if (bodies.earth_material && bodies.earth_material.uniforms) {
            bodies.earth_material.uniforms.sunDirection.value = earthToSun;
        }
    }
    
    // Update aurora animation
    auroraTime += 0.02;
    if (bodies.earth_aurora_north) {
        bodies.earth_aurora_north.material.uniforms.time.value = auroraTime;
        bodies.earth_aurora_north.rotation.y = bodies.earth.rotation.y;
    }
    if (bodies.earth_aurora_south) {
        bodies.earth_aurora_south.material.uniforms.time.value = auroraTime;
        bodies.earth_aurora_south.rotation.y = bodies.earth.rotation.y;
    }
    
    // Rotate planets on their axes
    if (bodies.earth) {
        bodies.earth.rotation.y += 0.01; // Earth rotation
        if (bodies.earth_clouds) bodies.earth_clouds.rotation.y += 0.012; // Clouds rotate slightly faster
        if (bodies.earth_atmosphere) bodies.earth_atmosphere.rotation.y = bodies.earth.rotation.y;
        if (bodies.earth_aurora_north) bodies.earth_aurora_north.rotation.y = bodies.earth.rotation.y;
        if (bodies.earth_aurora_south) bodies.earth_aurora_south.rotation.y = bodies.earth.rotation.y;
    }
    if (bodies.moon) bodies.moon.rotation.y += 0.003; // Moon rotation (tidally locked in reality)
    if (bodies.mars) bodies.mars.rotation.y += 0.01;
    if (bodies.jupiter) bodies.jupiter.rotation.y += 0.02; // Jupiter rotates fast
    if (bodies.saturn) bodies.saturn.rotation.y += 0.02; // Saturn rotates fast
    if (bodies.uranus) bodies.uranus.rotation.y += 0.015;
    if (bodies.neptune) bodies.neptune.rotation.y += 0.015;
    
    // Camera movement and following
    if (cameraFollowTarget) {
        let targetObject = null;
        let actualPosition = new THREE.Vector3();
        let objectSize = 1;
        let objectName = cameraFollowTarget;
        
        // Check if following a regular celestial body
        if (bodies[cameraFollowTarget]) {
            targetObject = bodies[cameraFollowTarget];
            actualPosition.copy(targetObject.position);
            const data = celestialBodies[cameraFollowTarget];
            objectSize = data.size || 1;
            objectName = data.name;
        } 
        // Check if following another type of object
        else if (followTargetObject) {
            targetObject = followTargetObject;
            actualPosition.copy(targetObject.position);
            // Get size for spacecraft or use small default
            if (window.spacecraftTracker && window.spacecraftTracker.getSpacecraftSize) {
                objectSize = window.spacecraftTracker.getSpacecraftSize(cameraFollowTarget) || 0.005;
            } else {
                objectSize = 0.01; // Small default size for non-celestial bodies
            }
        }
        
        if (targetObject) {
            // Calculate appropriate camera distance to fill 60% of screen
            cameraDistance = calculateCameraDistance(objectSize, 0.6);
            
            if (cameraFollowTarget === 'moon') {
                // Calculate distance to make Moon fill 40% of screen
                const moonSize = SUN_SIZE * SIZE_RATIOS.moon;
                cameraDistance = moonSize * 1.5;
            } else if (cameraFollowTarget === 'sun') {
                cameraDistance = 100;
            } else if (['jupiter', 'saturn', 'uranus', 'neptune'].includes(cameraFollowTarget)) {
                cameraDistance = objectSize * 3;
            }
            
            // Apply offset to camera position with user zoom
            const offsetVector = cameraOffset.clone().normalize();
            offsetVector.multiplyScalar(cameraDistance * userZoomFactor);
            targetPosition.copy(actualPosition);
            targetPosition.add(offsetVector);
            
            if (isMoving) {
                const distance = camera.position.distanceTo(targetPosition);
                if (distance > 0.1) {
                    camera.position.lerp(targetPosition, 0.02 * currentSpeed);
                    
                    // Update distance display
                    document.getElementById('distance').textContent = 
                        `Distance to destination: ${Math.round(distance)} units`;
                } else {
                    isMoving = false;
                    document.getElementById('distance').textContent = 'Following ' + objectName;
                }
            } else {
                // Continue following the object even after arrival
                camera.position.lerp(targetPosition, 0.1);
            }
            
            // Always look at the current position of the destination
            camera.lookAt(actualPosition);
            cameraLookAtTarget.copy(actualPosition); // Update look-at target
        }
    }
    
    // Rotate planets
    Object.entries(bodies).forEach(([key, body]) => {
        // Skip if body hasn't loaded yet or doesn't have rotation property
        if (!body || !body.rotation) return;
        
        // Skip non-mesh objects (like materials)
        if (key.includes('_material')) return;
        
        if (key === 'earth') {
            body.rotation.y += 0.005; // Earth rotation
        } else if (key === 'earth_clouds') {
            body.rotation.y += 0.006; // Clouds rotate slightly faster
        } else if (key === 'moon') {
            body.rotation.y += 0.002; // Moon tidally locked (slower rotation)
        } else if (!key.includes('_clouds') && !key.includes('_daynight') && !key.includes('_aurora') && !key.includes('_atmosphere')) {
            body.rotation.y += 0.01;
        }
    });
    
    // Update orbit visibility based on camera distance
    updateOrbitVisibility();
    
    // Update camera controls
    updateCameraControls();
    
    // Update sun effects
    if (window.sunEffects) {
        window.sunEffects.update(performance.now() * 0.001);
    }
    
    // Update realistic sun
    if (window.realisticSun) {
        window.realisticSun.update(0.016); // Assuming 60fps, ~16ms per frame
    }
    
    // Update time controls and get current positions
    let currentPositions = null;
    if (window.timeControls) {
        window.timeControls.update();
        currentPositions = window.timeControls.getCurrentPositions();
        
        // Update planet positions based on ephemeris if available
        if (currentPositions && window.ephemerisEngine) {
            for (const [key, pos] of Object.entries(currentPositions)) {
                if (bodies[key] && pos) {
                    // Convert from ecliptic coordinates to 3D scene coordinates
                    // Ecliptic: X,Y in plane, Z perpendicular → Scene: X,Z in plane, Y perpendicular
                    bodies[key].position.set(pos.x * AU_SCALE, pos.z * AU_SCALE, pos.y * AU_SCALE);
                    
                    // Update associated objects
                    if (key === 'earth') {
                        if (bodies.earth_clouds) bodies.earth_clouds.position.copy(bodies[key].position);
                        if (bodies.earth_aurora_north) bodies.earth_aurora_north.position.copy(bodies[key].position);
                        if (bodies.earth_aurora_south) bodies.earth_aurora_south.position.copy(bodies[key].position);
                    }
                }
            }
        }
    }
    
    // Update moon systems
    if (window.moonSystems) {
        const planetPositions = {};
        ['jupiter', 'saturn', 'uranus', 'neptune'].forEach(planet => {
            if (bodies[planet]) {
                planetPositions[planet] = bodies[planet].position;
            }
        });
        window.moonSystems.update(0.016, planetPositions, window.timeControls ? window.timeControls.timeScale : 1);
    }
    
    // Update asteroid belt
    if (window.asteroidBelt) {
        window.asteroidBelt.update(0.016, window.timeControls ? window.timeControls.timeScale : 1);
    }
    
    // Update spacecraft
    if (window.spacecraftTracker && window.ephemerisEngine && window.timeControls) {
        window.spacecraftTracker.update(window.timeControls.getCurrentDate(), window.ephemerisEngine);
    }
    
    // Update atmospheres
    if (window.atmosphereSystem) {
        const sunPos = bodies.sun ? bodies.sun.position : new THREE.Vector3(0, 0, 0);
        window.atmosphereSystem.update(0.016, camera, sunPos);
    }
    
    // Update measurement tools
    if (window.measurementTools) {
        window.measurementTools.update();
    }
    
    // Update enhanced ring systems
    if (window.ringSystems) {
        window.ringSystems.updateAllRings(bodies);
    }
    
    // Update dwarf planets and comets
    if (window.dwarfPlanetsComets) {
        window.dwarfPlanetsComets.update();
    }
    
    // Update skybox orientation relative to camera
    if (skyboxGroup) {
        // Make skybox follow camera position but not rotation
        skyboxGroup.position.copy(camera.position);
        
        // Update shader uniform with camera position for directional effect
        if (skyboxGroup.userData.skyboxMaterial) {
            skyboxGroup.userData.skyboxMaterial.uniforms.cameraPos.value.copy(camera.position);
        }
        
        // Fixed orientation for Milky Way
        // The Milky Way band should be consistent in space
        // Set it to align with the galactic plane (roughly horizontal)
        skyboxGroup.rotation.set(0, 0, 0);
    }
    
    // Performance optimizations - update LOD and quality before rendering
    if (window.performanceMonitor && window.camera) {
        const fps = window.performanceMonitor.averageFPS;
        const cameraPosition = window.camera.position;
        
        // Update asteroid belt performance
        if (window.asteroidBelt) {
            window.asteroidBelt.updateCameraPosition(cameraPosition);
        }
        
        // Update realistic sun performance
        if (window.realisticSun) {
            const sunDistance = cameraPosition.distanceTo(window.realisticSun.position || new THREE.Vector3());
            window.realisticSun.updatePerformanceUniforms(sunDistance, fps);
        }
        
        // Update texture manager adaptive quality
        if (window.textureManager) {
            const memoryUsage = window.performanceMonitor.memoryUsage.textures || 0;
            window.textureManager.adaptiveQuality(fps, memoryUsage);
        }
        
        // Memory management - periodic cleanup
        if (window.memoryManager) {
            window.memoryManager.checkAutoCleanup();
            
            // Handle memory pressure based on performance
            if (fps < 15) {
                window.memoryManager.handleMemoryPressure('high');
            } else if (fps < 25) {
                window.memoryManager.handleMemoryPressure('medium');
            } else if (fps < 35) {
                window.memoryManager.handleMemoryPressure('low');
            }
        }
    }
    
    renderer.render(scene, camera);
    
    } catch (error) {
        devLog.error(`Animation error: ${error.message}`);
        console.error(error);
    }
}

// Handle window resize
function setupResizeHandler() {
    window.addEventListener('resize', () => {
        if (camera && renderer) {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        }
    });
}

// Keyboard controls for camera
const keyboardState = {
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false
};

// Track key states
window.addEventListener('keydown', (event) => {
    if (keyboardState.hasOwnProperty(event.key)) {
        keyboardState[event.key] = true;
        event.preventDefault(); // Prevent default scrolling behavior
    }
    
    // Export logs with Ctrl/Cmd + L
    if ((event.ctrlKey || event.metaKey) && event.key === 'l') {
        event.preventDefault();
        exportDevLogs();
    }
    
    // Escape key to exit follow mode and enable free camera
    if (event.key === 'Escape') {
        if (cameraFollowTarget) {
            CameraController.setFreeCameraMode();
            updateCameraModeDisplay();
        }
    }
    
    // NASA Eyes-style keyboard shortcuts
    if (event.key === 'Home' || event.key === 'h') {
        // Home view - go to solar system overview
        CameraController.setFreeCameraMode();
        cameraState.spherical.set(500, Math.PI/3, 0); // Nice overview angle
        updateCameraModeDisplay();
        devLog.info('Camera: Home view');
    }
    
    if (event.key === 'f' && cameraFollowTarget) {
        // Frame current object
        CameraController.autoFrameObject(cameraFollowTarget);
        devLog.info('Camera: Auto-framed object');
    }
    
    if (event.key === 'r') {
        // Reset camera orientation to default for current target
        if (cameraFollowTarget) {
            cameraState.spherical.phi = Math.PI/2; // Equatorial view
            cameraState.spherical.theta = 0; // Reset rotation
        }
        devLog.info('Camera: Reset orientation');
    }
});

window.addEventListener('keyup', (event) => {
    if (keyboardState.hasOwnProperty(event.key)) {
        keyboardState[event.key] = false;
        event.preventDefault();
    }
});

// Camera movement speed
const ZOOM_SPEED = 0.1;
const PAN_SPEED = 0.1;

// Mouse controls
let isDragging = false;
let mouseX = 0;
let mouseY = 0;
let mouseDeltaX = 0;
let mouseDeltaY = 0;

// Raycaster for click detection
let raycaster = new THREE.Raycaster();
let mouse = new THREE.Vector2();

// Initialize mouse controls after DOM is loaded
function initializeMouseControls() {
    const canvas = document.getElementById('canvas');
    
    canvas.addEventListener('mousedown', (event) => {
        if (event.button === 0) { // Left mouse button
            isDragging = true;
            mouseX = event.clientX;
            mouseY = event.clientY;
            canvas.style.cursor = 'grabbing';
            
            // Debug logging
            if (Math.random() < 0.1) { // Log occasionally
                devLog.info(`Mouse drag started. Following target: ${cameraFollowTarget || 'none (free camera)'}`);
            }
        }
    });
    
    // Planet click detection
    canvas.addEventListener('click', (event) => {
        // Calculate mouse position in normalized device coordinates
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        
        // Update the picking ray with the camera and mouse position
        raycaster.setFromCamera(mouse, camera);
        
        // Calculate objects intersecting the picking ray
        const clickableObjects = Object.values(bodies).filter(obj => obj && obj.type === 'Mesh');
        const intersects = raycaster.intersectObjects(clickableObjects);
        
        console.log('Click detected, intersects:', intersects.length);
        if (intersects.length > 0) {
            const clickedObject = intersects[0].object;
            console.log('Clicked object:', clickedObject);
            
            // Find which celestial body was clicked
            for (const [key, body] of Object.entries(bodies)) {
                if (body === clickedObject) {
                    console.log('Found celestial body key:', key);
                    const celestialData = celestialBodies[key];
                    console.log('Celestial data:', celestialData);
                    console.log('window.infoPanels exists:', !!window.infoPanels);
                    console.log('window.measurementTools exists:', !!window.measurementTools);
                    
                    // Handle measurement tools if active
                    if (window.measurementTools && window.measurementTools.isActive()) {
                        window.measurementTools.handleObjectClick(celestialData.name, body.position);
                    } else if (celestialData && window.infoPanels) {
                        console.log('Calling show with:', celestialData.name);
                        // Show info panel with planet data (only if measurements not active)
                        if (window.infoPanels && window.infoPanels.show) {
                            window.infoPanels.show(celestialData);
                        }
                        devLog.info(`Clicked on ${celestialData.name}`);
                        
                        // Track planet view for analytics
                        if (window.dashboardController && window.dashboardController.dashboard) {
                            window.dashboardController.dashboard.trackUserInteraction('planet_view', {
                                target: key,
                                feature: 'direct_click'
                            });
                        }
                    } else {
                        console.log('InfoPanels not available or celestialData missing');
                    }
                    break;
                }
            }
        }
    });

    window.addEventListener('mousemove', (event) => {
        if (isDragging) {
            mouseDeltaX = event.clientX - mouseX;
            mouseDeltaY = event.clientY - mouseY;
            mouseX = event.clientX;
            mouseY = event.clientY;
            
            // Use advanced camera system for smooth movement
            CameraController.handleMouseDrag(mouseDeltaX, mouseDeltaY);
            
            mouseDeltaX = 0;
            mouseDeltaY = 0;
        }
    });

    window.addEventListener('mouseup', (event) => {
        if (event.button === 0) {
            isDragging = false;
            canvas.style.cursor = 'grab';
        }
    });

    // Mouse wheel for zoom
    canvas.addEventListener('wheel', (event) => {
        event.preventDefault();
        
        // Normalize wheel delta for consistent zoom across browsers
        const normalizedDelta = event.deltaY > 0 ? 1 : -1;
        
        // Use advanced camera system for smooth zooming
        CameraController.handleZoom(normalizedDelta * 0.1);
    });

    // Set initial cursor style
    canvas.style.cursor = 'grab';
}

// Advanced NASA Eyes-style camera system
const CameraController = {
    // Easing functions for smooth transitions
    easing: {
        easeOutCubic: t => 1 - Math.pow(1 - t, 3),
        easeInOutCubic: t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
        easeOutQuart: t => 1 - Math.pow(1 - t, 4),
        linear: t => t
    },

    // Initialize camera system
    init() {
        // Ensure camera and target positions are valid
        if (!camera.position || !cameraLookAtTarget) {
            devLog.error('Camera or target not properly initialized');
            return;
        }
        
        // Set up initial camera state
        cameraState.position.copy(camera.position);
        cameraState.target.copy(cameraLookAtTarget);
        cameraState.targetPosition.copy(camera.position);
        cameraState.targetLookAt.copy(cameraLookAtTarget);
        
        // Initialize spherical coordinates from current position
        const relativePos = camera.position.clone().sub(cameraLookAtTarget);
        if (relativePos.length() > 0) {
            cameraState.spherical.setFromVector3(relativePos);
            cameraState.targetSpherical.copy(cameraState.spherical);
        } else {
            // Fallback if camera is at the target position
            cameraState.spherical.set(300, Math.PI/2, 0);
            cameraState.targetSpherical.copy(cameraState.spherical);
        }
        
        devLog.success('NASA Eyes-style camera controller initialized');
        devLog.info(`Initial camera position: ${camera.position.x.toFixed(1)}, ${camera.position.y.toFixed(1)}, ${camera.position.z.toFixed(1)}`);
        devLog.info(`Initial target: ${cameraLookAtTarget.x.toFixed(1)}, ${cameraLookAtTarget.y.toFixed(1)}, ${cameraLookAtTarget.z.toFixed(1)}`);
    },

    // Update camera with smooth movement and momentum
    update(deltaTime) {
        // Safety check - don't update if not properly initialized
        if (!cameraState.position || !cameraState.target) {
            return;
        }
        
        // Update target position if following a non-celestial object
        if (cameraFollowTarget && followTargetObject && followTargetObject.position) {
            cameraState.targetLookAt.copy(followTargetObject.position);
        }
        
        const dt = Math.min(deltaTime, 1/30); // Cap delta time for stability
        
        if (cameraState.isTransitioning) {
            this.updateTransition();
        } else {
            this.updateOrbitalMovement(dt);
        }
        
        // Apply smooth position interpolation
        cameraState.position.lerp(cameraState.targetPosition, cameraState.damping);
        cameraState.target.lerp(cameraState.targetLookAt, cameraState.damping);
        
        // Update actual camera
        camera.position.copy(cameraState.position);
        camera.lookAt(cameraState.target);
    },

    // Handle orbital movement with momentum
    updateOrbitalMovement(deltaTime) {
        // Apply angular velocity with damping
        cameraState.spherical.phi += cameraState.angularVelocity.phi * deltaTime;
        cameraState.spherical.theta += cameraState.angularVelocity.theta * deltaTime;
        
        // Apply damping to angular velocity
        const dampingFactor = Math.pow(0.95, deltaTime * 60); // 60fps reference
        cameraState.angularVelocity.phi *= dampingFactor;
        cameraState.angularVelocity.theta *= dampingFactor;
        
        // Constrain phi to prevent flipping
        cameraState.spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, cameraState.spherical.phi));
        
        // Update target position from spherical coordinates
        const newPosition = new THREE.Vector3();
        newPosition.setFromSpherical(cameraState.spherical);
        newPosition.add(cameraState.targetLookAt);
        
        cameraState.targetPosition.copy(newPosition);
    },

    // Handle smooth transitions between targets
    updateTransition() {
        const now = performance.now();
        const elapsed = now - cameraState.transitionStart;
        const progress = Math.min(elapsed / cameraState.transitionDuration, 1);
        
        // Apply easing
        const easedProgress = this.easing[cameraState.transitionEasing](progress);
        
        if (progress >= 1) {
            cameraState.isTransitioning = false;
            devLog.info('Camera transition completed');
        }
        
        // Interpolate between start and end positions
        if (cameraState.transitionStartPos && cameraState.transitionEndPos) {
            cameraState.targetPosition.lerpVectors(
                cameraState.transitionStartPos,
                cameraState.transitionEndPos,
                easedProgress
            );
        }
        
        if (cameraState.transitionStartLookAt && cameraState.transitionEndLookAt) {
            cameraState.targetLookAt.lerpVectors(
                cameraState.transitionStartLookAt,
                cameraState.transitionEndLookAt,
                easedProgress
            );
        }
    },

    // Start smooth transition to new target
    transitionToTarget(targetObject, distance = null) {
        if (!bodies[targetObject]) {
            devLog.warning(`Cannot transition to ${targetObject} - object not loaded`);
            return;
        }
        
        const targetPos = bodies[targetObject].position.clone();
        const objectData = celestialBodies[targetObject];
        
        // Calculate appropriate distance based on object size
        let targetDistance = distance;
        if (!targetDistance) {
            const objectSize = objectData?.size || 1;
            targetDistance = Math.max(objectSize * 5, 10);
        }
        
        // Calculate camera position for good viewing angle
        const offset = new THREE.Vector3(1, 0.3, 1).normalize();
        offset.multiplyScalar(targetDistance);
        const newCameraPos = targetPos.clone().add(offset);
        
        // Set up transition
        cameraState.isTransitioning = true;
        cameraState.transitionStart = performance.now();
        cameraState.transitionStartPos = cameraState.position.clone();
        cameraState.transitionEndPos = newCameraPos;
        cameraState.transitionStartLookAt = cameraState.target.clone();
        cameraState.transitionEndLookAt = targetPos.clone();
        
        // Update spherical coordinates for the new target
        cameraState.targetLookAt.copy(targetPos);
        cameraState.spherical.setFromVector3(newCameraPos.clone().sub(targetPos));
        cameraState.targetSpherical.copy(cameraState.spherical);
        
        // Set follow target
        cameraFollowTarget = targetObject;
        
        devLog.info(`Starting smooth transition to ${objectData?.name || targetObject}`);
    },

    // Handle mouse drag with momentum (NASA Eyes style)
    handleMouseDrag(deltaX, deltaY, sensitivity = 0.005) {
        if (cameraState.isTransitioning) return; // Don't allow manual control during transitions
        
        // Enhanced sensitivity based on zoom level (closer = more sensitive)
        const zoomFactor = Math.max(0.1, Math.min(2, 100 / cameraState.spherical.radius));
        const adjustedSensitivity = sensitivity * zoomFactor;
        
        // Add to angular velocity for momentum-based movement
        const momentumFactor = 0.8; // How much momentum to add
        cameraState.angularVelocity.theta -= deltaX * adjustedSensitivity * momentumFactor;
        cameraState.angularVelocity.phi += deltaY * adjustedSensitivity * momentumFactor;
        
        // Immediate response for responsive feel (NASA Eyes characteristic)
        const responseFactor = 0.4;
        cameraState.spherical.theta -= deltaX * adjustedSensitivity * responseFactor;
        cameraState.spherical.phi += deltaY * adjustedSensitivity * responseFactor;
        
        // Constrain phi to prevent flipping
        cameraState.spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, cameraState.spherical.phi));
        
        // Cap angular velocity to prevent spinning out of control
        const maxAngularVelocity = 0.05;
        cameraState.angularVelocity.theta = Math.max(-maxAngularVelocity, 
            Math.min(maxAngularVelocity, cameraState.angularVelocity.theta));
        cameraState.angularVelocity.phi = Math.max(-maxAngularVelocity, 
            Math.min(maxAngularVelocity, cameraState.angularVelocity.phi));
        
        manualCameraControl = true;
    },

    // Handle zoom with smooth scaling (NASA Eyes style)
    handleZoom(delta, zoomCenter = null) {
        // Dynamic zoom speed based on current distance (logarithmic scaling)
        const currentRadius = cameraState.spherical.radius;
        const logRadius = Math.log10(Math.max(1, currentRadius));
        const dynamicZoomSpeed = Math.max(0.05, Math.min(0.3, logRadius * 0.1));
        
        // Smooth zoom with exponential scaling
        const zoomFactor = Math.pow(1.1, delta * (delta > 0 ? dynamicZoomSpeed : -dynamicZoomSpeed) * 10);
        let newRadius = currentRadius * zoomFactor;
        
        // Adaptive min/max distances based on target object
        let minDist = cameraState.minDistance;
        let maxDist = cameraState.maxDistance;
        
        if (cameraFollowTarget && bodies[cameraFollowTarget]) {
            const objectData = celestialBodies[cameraFollowTarget];
            const objectSize = objectData?.size || 1;
            minDist = Math.max(objectSize * 1.5, 0.5); // Don't get too close to objects
            maxDist = Math.max(objectSize * 100, 1000); // Don't go too far from small objects
        }
        
        // Clamp zoom with smooth boundaries
        newRadius = Math.max(minDist, Math.min(maxDist, newRadius));
        
        // Apply zoom smoothly
        cameraState.spherical.radius = newRadius;
        cameraState.targetSpherical.radius = newRadius;
        
        // Auto-adjust damping based on zoom level for smoother movement at different scales
        const baseDamping = 0.05;
        const zoomBasedDamping = baseDamping * Math.max(0.5, Math.min(2, 50 / currentRadius));
        cameraState.damping = zoomBasedDamping;
    },

    // Set free camera mode
    setFreeCameraMode() {
        cameraFollowTarget = null;
        followTargetObject = null;
        cameraState.targetLookAt.set(0, 0, 0);
        cameraState.spherical.setFromVector3(camera.position.clone());
        cameraState.targetSpherical.copy(cameraState.spherical);
        manualCameraControl = true;
        
        devLog.info('Switched to free camera mode');
    },

    // Auto-frame object (calculate optimal viewing distance)
    autoFrameObject(targetObject) {
        if (!bodies[targetObject]) return;
        
        const objectData = celestialBodies[targetObject];
        const objectSize = objectData?.size || 1;
        
        // Calculate distance to frame object nicely
        const frameDistance = objectSize * 8; // Adjust multiplier as needed
        cameraState.spherical.radius = Math.max(frameDistance, cameraState.minDistance);
        cameraState.targetSpherical.radius = cameraState.spherical.radius;
    }
};

// Update camera mode display
function updateCameraModeDisplay() {
    const cameraModeElement = document.getElementById('camera-mode');
    if (cameraModeElement) {
        if (cameraFollowTarget) {
            const targetName = celestialBodies[cameraFollowTarget]?.name || cameraFollowTarget;
            cameraModeElement.textContent = `🎯 Following ${targetName} (ESC for free camera)`;
            cameraModeElement.style.color = '#00ff88';
        } else {
            cameraModeElement.textContent = '📷 Free Camera (click planets to follow)';
            cameraModeElement.style.color = '#88ccff';
        }
    }
}

// Update camera based on keyboard input
function updateCameraControls() {
    if (!cameraFollowTarget) return; // Only work when following a target
    
    // Get camera direction vectors
    const forward = new THREE.Vector3();
    camera.getWorldDirection(forward);
    
    // Get right vector (perpendicular to forward and up)
    const right = new THREE.Vector3();
    right.crossVectors(forward, camera.up).normalize();
    
    // Zoom in/out with up/down arrows (adjust distance)
    if (keyboardState.ArrowUp) {
        userZoomFactor *= 0.98; // Zoom in
        userZoomFactor = Math.max(0.1, userZoomFactor); // Minimum zoom
    }
    if (keyboardState.ArrowDown) {
        userZoomFactor *= 1.02; // Zoom out
        userZoomFactor = Math.min(10, userZoomFactor); // Maximum zoom
    }
    
    // Pan left/right with left/right arrows (rotate around target)
    if (keyboardState.ArrowLeft || keyboardState.ArrowRight) {
        // Calculate current position relative to target
        const target = bodies[cameraFollowTarget];
        if (target) {
            // Rotate the offset around Y axis
            const rotationSpeed = 0.02;
            const angle = keyboardState.ArrowLeft ? rotationSpeed : -rotationSpeed;
            
            // Update camera offset by rotating it
            cameraOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), angle);
        }
    }
}

// Animation will be started after DOM is loaded