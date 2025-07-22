// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 50000);
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('canvas'), antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);

// Lighting
const ambientLight = new THREE.AmbientLight(0x404040);
scene.add(ambientLight);

const pointLight = new THREE.PointLight(0xffffff, 2);
pointLight.position.set(0, 0, 0);
scene.add(pointLight);

// Stars background
const starsGeometry = new THREE.BufferGeometry();
const starsMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.5 });
const starsVertices = [];
for (let i = 0; i < 10000; i++) {
    const x = (Math.random() - 0.5) * 10000;
    const y = (Math.random() - 0.5) * 10000;
    const z = (Math.random() - 0.5) * 10000;
    starsVertices.push(x, y, z);
}
starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsVertices, 3));
const stars = new THREE.Points(starsGeometry, starsMaterial);
scene.add(stars);

// Texture loader with error handling
const textureLoader = new THREE.TextureLoader();
textureLoader.crossOrigin = 'anonymous';

// Helper function to load textures with fallback
function loadTexture(url, fallbackColor) {
    return new Promise((resolve) => {
        textureLoader.load(
            url,
            (texture) => {
                console.log(`Successfully loaded texture: ${url}`);
                resolve(texture);
            },
            undefined,
            (error) => {
                console.log(`Failed to load texture: ${url}`, error);
                resolve(null);
            }
        );
    });
}

// Scale factor: 1 AU (Astronomical Unit) = 100 units in our scene
const AU_SCALE = 100;

// Celestial bodies data with realistic distances and orbital data
const celestialBodies = {
    blackhole: {
        name: "Sagittarius A* (Black Hole)",
        position: new THREE.Vector3(-2600, 0, -2600), // Far away from solar system
        size: 30,
        color: 0x000000,
        emissive: 0x400040,
        info: "The supermassive black hole at the center of our Milky Way galaxy. Mass: 4 million times our Sun. Distance from Earth: 26,000 light-years. This cosmic giant warps spacetime itself!",
        educational: "Black holes teach us about extreme gravity, general relativity, and the limits of physics."
    },
    sun: {
        name: "The Sun",
        position: new THREE.Vector3(0, 0, 0),
        size: 20,
        color: 0xffff00,
        emissive: 0xffaa00,
        info: "Our star, a G-type main-sequence star. Temperature: 5,778 K surface. Age: 4.6 billion years. Contains 99.86% of the Solar System's mass.",
        educational: "Understanding the Sun helps us learn about nuclear fusion, stellar evolution, and energy production."
    },
    mercury: {
        name: "Mercury",
        position: new THREE.Vector3(0.39 * AU_SCALE, 0, 0), // 0.39 AU from Sun
        size: 2,
        color: 0x8b7355,
        orbitRadius: 0.39 * AU_SCALE,
        orbitSpeed: 0.004, // Fastest orbit
        info: "The smallest planet and closest to the Sun. Day length: 59 Earth days. No atmosphere. Temperature: -173°C to 427°C.",
        educational: "Mercury demonstrates extreme temperature variations and the effects of minimal atmosphere."
    },
    venus: {
        name: "Venus",
        position: new THREE.Vector3(0.72 * AU_SCALE, 0, 0), // 0.72 AU from Sun
        size: 4,
        color: 0xffd700,
        orbitRadius: 0.72 * AU_SCALE,
        orbitSpeed: 0.0015,
        info: "The hottest planet due to greenhouse effect. Atmosphere: 96.5% CO2. Surface pressure: 90x Earth's. Rotates backwards.",
        educational: "Venus is a perfect example of runaway greenhouse effect - crucial for climate science education."
    },
    earth: {
        name: "Earth",
        position: new THREE.Vector3(1.0 * AU_SCALE, 0, 0), // 1.0 AU from Sun (definition of AU)
        size: 4,
        color: 0x0066cc,
        orbitRadius: 1.0 * AU_SCALE,
        orbitSpeed: 0.001,
        info: "Our home planet. The only known planet with life. 71% water coverage. Perfect distance from Sun for liquid water. Has one natural satellite: the Moon.",
        educational: "Earth sciences encompass geology, meteorology, oceanography, and environmental studies."
    },
    moon: {
        name: "The Moon",
        position: new THREE.Vector3(1.0 * AU_SCALE, 0, 0), // Will be updated dynamically
        size: 1,
        color: 0xaaaaaa,
        info: "Earth's only natural satellite. Formed 4.5 billion years ago. Responsible for ocean tides. Distance from Earth: 384,400 km.",
        educational: "The Moon teaches us about tidal forces, orbital mechanics, and the history of our solar system."
    },
    iss: {
        name: "International Space Station (ISS)",
        position: new THREE.Vector3(1.0 * AU_SCALE, 0, 0), // Will be updated dynamically
        size: 0.1,
        color: 0xffffff,
        info: "Humanity's permanent outpost in space. Orbits Earth every 90 minutes at 408 km altitude. Home to astronauts from many nations.",
        educational: "The ISS demonstrates international cooperation, microgravity research, and human adaptation to space."
    },
    mars: {
        name: "Mars",
        position: new THREE.Vector3(1.52 * AU_SCALE, 0, 0), // 1.52 AU from Sun
        size: 3,
        color: 0xcd5c5c,
        orbitRadius: 1.52 * AU_SCALE,
        orbitSpeed: 0.00053,
        info: "The Red Planet. Has the largest volcano (Olympus Mons) and canyon (Valles Marineris) in the solar system. Two moons: Phobos and Deimos.",
        educational: "Mars exploration teaches robotics, astrobiology, and potential human colonization challenges."
    },
    jupiter: {
        name: "Jupiter",
        position: new THREE.Vector3(5.2 * AU_SCALE, 0, 0), // 5.2 AU from Sun
        size: 11,
        color: 0xdaa520,
        orbitRadius: 5.2 * AU_SCALE,
        orbitSpeed: 0.00008,
        info: "The largest planet. A gas giant with 79+ moons. Great Red Spot is a storm larger than Earth. Protects inner planets from asteroids.",
        educational: "Jupiter demonstrates gas giant composition, powerful magnetospheres, and gravitational influences."
    },
    saturn: {
        name: "Saturn",
        position: new THREE.Vector3(9.54 * AU_SCALE, 0, 0), // 9.54 AU from Sun
        size: 9,
        color: 0xf4a460,
        orbitRadius: 9.54 * AU_SCALE,
        orbitSpeed: 0.00003,
        info: "Famous for its rings made of ice and rock. Less dense than water. 82+ moons including Titan with thick atmosphere.",
        educational: "Saturn's rings teach us about gravitational dynamics and moon formation."
    },
    uranus: {
        name: "Uranus",
        position: new THREE.Vector3(19.19 * AU_SCALE, 0, 0), // 19.19 AU from Sun
        size: 4,
        color: 0x40e0d0,
        orbitRadius: 19.19 * AU_SCALE,
        orbitSpeed: 0.00001,
        info: "Tilted 98° - rolls on its side. Coldest planetary atmosphere. Has faint rings. Discovered by William Herschel in 1781.",
        educational: "Uranus shows how planetary collisions can dramatically alter rotation and magnetic fields."
    },
    neptune: {
        name: "Neptune",
        position: new THREE.Vector3(30.07 * AU_SCALE, 0, 0), // 30.07 AU from Sun
        size: 4,
        color: 0x0000cd,
        orbitRadius: 30.07 * AU_SCALE,
        orbitSpeed: 0.000006,
        info: "Windiest planet with speeds up to 2,100 km/h. Deep blue from methane. Has 14 known moons including Triton.",
        educational: "Neptune helps us understand atmospheric dynamics and the outer solar system's formation."
    }
};

// Create celestial bodies
const bodies = {};
const orbits = {};
let orbitsVisible = true;

// Orbital angles for each planet
const orbitAngles = {};

// Create orbit paths
function createOrbitPath(radius, segments = 128) {
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
    const material = new THREE.LineBasicMaterial({
        color: 0x444444,
        transparent: true,
        opacity: 0.3
    });
    
    return new THREE.Line(geometry, material);
}

// Create all celestial bodies asynchronously to handle texture loading
async function createCelestialBodies() {
    for (const [key, data] of Object.entries(celestialBodies)) {
        let mesh;
        
        // Initialize orbit angle
        if (data.orbitRadius) {
            orbitAngles[key] = Math.random() * Math.PI * 2; // Random starting position
        }
        
        if (key === 'earth') {
            // Create Earth with realistic textures
            const earthGeometry = new THREE.SphereGeometry(data.size, 64, 64);
            
            // Create Earth material with fallback procedural texture
            const earthMaterial = new THREE.MeshPhongMaterial({
                shininess: 10
            });
            
            // Try to load Earth textures from multiple sources
            let earthTexture = await loadTexture('https://unpkg.com/three-globe@2.31.1/example/img/earth-blue-marble.jpg');
            if (!earthTexture) {
                earthTexture = await loadTexture('https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_atmos_2048.jpg');
            }
            if (!earthTexture) {
                earthTexture = await loadTexture('https://cdn.jsdelivr.net/gh/mrdoob/three.js@dev/examples/textures/planets/earth_atmos_2048.jpg');
            }
            
            if (earthTexture) {
                earthMaterial.map = earthTexture;
                const earthBump = await loadTexture('https://unpkg.com/three-globe@2.31.1/example/img/earth-topology.png');
                if (earthBump) {
                    earthMaterial.bumpMap = earthBump;
                    earthMaterial.bumpScale = 0.05;
                }
                const earthSpec = await loadTexture('https://unpkg.com/three-globe@2.31.1/example/img/earth-water.png');
                if (earthSpec) {
                    earthMaterial.specularMap = earthSpec;
                    earthMaterial.specular = new THREE.Color('grey');
                }
            } else {
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
            mesh.position.copy(data.position);
            scene.add(mesh);
            
            // Add cloud layer
            const cloudTexture = await loadTexture('https://unpkg.com/three-globe@2.31.1/example/img/earth-clouds.png');
            const cloudGeometry = new THREE.SphereGeometry(data.size * 1.01, 64, 64);
            const cloudMaterial = new THREE.MeshPhongMaterial({
                map: cloudTexture,
                transparent: true,
                opacity: cloudTexture ? 0.4 : 0.2,
                depthWrite: false
            });
            
            if (!cloudTexture) {
                cloudMaterial.color = new THREE.Color(0xffffff);
                cloudMaterial.emissive = new THREE.Color(0xffffff);
                cloudMaterial.emissiveIntensity = 0.05;
            }
            
            const cloudMesh = new THREE.Mesh(cloudGeometry, cloudMaterial);
            cloudMesh.position.copy(data.position);
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
            atmosphereMesh.position.copy(data.position);
            scene.add(atmosphereMesh);
            bodies[key + '_atmosphere'] = atmosphereMesh;
            
            // Add day/night shader
            const dayNightGeometry = new THREE.SphereGeometry(data.size * 0.99, 64, 64);
            const dayNightMaterial = new THREE.ShaderMaterial({
                transparent: true,
                uniforms: {
                    sunDirection: { value: new THREE.Vector3(1, 0, 0).normalize() }
                },
                vertexShader: `
                    varying vec3 vNormal;
                    varying vec3 vPosition;
                    void main() {
                        vNormal = normalize(normalMatrix * normal);
                        vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
                        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                    }
                `,
                fragmentShader: `
                    uniform vec3 sunDirection;
                    varying vec3 vNormal;
                    varying vec3 vPosition;
                    void main() {
                        float intensity = dot(vNormal, sunDirection);
                        float night = smoothstep(-0.2, 0.2, -intensity);
                        // City lights effect at night
                        float noise = fract(sin(dot(vPosition.xy, vec2(12.9898,78.233))) * 43758.5453);
                        vec3 cityLights = vec3(1.0, 0.8, 0.4) * noise * 0.3;
                        vec3 nightColor = vec3(0.0, 0.0, 0.1) + cityLights * night;
                        gl_FragColor = vec4(nightColor, night * 0.7);
                    }
                `
            });
            const dayNightMesh = new THREE.Mesh(dayNightGeometry, dayNightMaterial);
            dayNightMesh.position.copy(data.position);
            scene.add(dayNightMesh);
            bodies[key + '_daynight'] = dayNightMesh;
            
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
            auroraNorth.position.copy(data.position);
            scene.add(auroraNorth);
            
            const auroraSouth = new THREE.Mesh(auroraGeometry, auroraMaterial.clone());
            auroraSouth.position.copy(data.position);
            auroraSouth.rotation.x = Math.PI;
            scene.add(auroraSouth);
            
            bodies[key + '_aurora_north'] = auroraNorth;
            bodies[key + '_aurora_south'] = auroraSouth;
        } else if (key === 'moon') {
            // Create Moon with texture
            const moonGeometry = new THREE.SphereGeometry(data.size, 32, 32);
            const moonMaterial = new THREE.MeshPhongMaterial();
            
            // Try multiple sources for moon texture
            let moonTexture = await loadTexture('https://unpkg.com/three-globe@2.31.1/example/img/moon.jpg');
            if (!moonTexture) {
                moonTexture = await loadTexture('https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/moon_1024.jpg');
            }
            if (!moonTexture) {
                moonTexture = await loadTexture('https://cdn.jsdelivr.net/gh/mrdoob/three.js@dev/examples/textures/planets/moon_1024.jpg');
            }
            
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
            mesh.position.copy(data.position);
            scene.add(mesh);
        } else if (key === 'sun') {
            // Create Sun with emissive material
            const sunGeometry = new THREE.SphereGeometry(data.size, 64, 64);
            const sunTexture = await loadTexture('https://unpkg.com/three-globe@2.31.1/example/img/sun.jpg');
            
            const sunMaterial = new THREE.MeshBasicMaterial({
                map: sunTexture,
                color: sunTexture ? 0xffffff : 0xffff00,
                emissive: 0xffaa00,
                emissiveIntensity: 1
            });
            
            mesh = new THREE.Mesh(sunGeometry, sunMaterial);
            mesh.position.copy(data.position);
            scene.add(mesh);
            
            // Sun glow
            const glowGeometry = new THREE.SphereGeometry(data.size * 1.4, 32, 32);
            const glowMaterial = new THREE.MeshBasicMaterial({
                color: 0xffaa00,
                transparent: true,
                opacity: 0.35
            });
            const sunGlow = new THREE.Mesh(glowGeometry, glowMaterial);
            sunGlow.position.copy(data.position);
            scene.add(sunGlow);
        } else if (key === 'mars') {
            // Create Mars with texture
            const marsGeometry = new THREE.SphereGeometry(data.size, 64, 64);
            const marsTexture = await loadTexture('https://unpkg.com/three-globe@2.31.1/example/img/mars.jpg');
            
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
            mesh.position.copy(data.position);
            scene.add(mesh);
        } else if (key === 'jupiter') {
            // Create Jupiter with texture
            const jupiterGeometry = new THREE.SphereGeometry(data.size, 64, 64);
            const jupiterTexture = await loadTexture('https://unpkg.com/three-globe@2.31.1/example/img/jupiter.jpg');
            
            const jupiterMaterial = new THREE.MeshPhongMaterial({
                map: jupiterTexture
            });
            
            if (!jupiterTexture) {
                jupiterMaterial.color = new THREE.Color(0xdaa520);
                jupiterMaterial.emissive = new THREE.Color(0x442211);
                jupiterMaterial.emissiveIntensity = 0.1;
            }
            
            mesh = new THREE.Mesh(jupiterGeometry, jupiterMaterial);
            mesh.position.copy(data.position);
            scene.add(mesh);
        } else if (key === 'iss') {
            // Create ISS as a simple box structure
            const issGroup = new THREE.Group();
            
            // Main body
            const bodyGeometry = new THREE.BoxGeometry(data.size * 2, data.size * 0.5, data.size * 0.5);
            const bodyMaterial = new THREE.MeshPhongMaterial({ color: 0xcccccc });
            const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
            issGroup.add(body);
            
            // Solar panels
            const panelGeometry = new THREE.BoxGeometry(data.size * 4, data.size * 0.1, data.size * 2);
            const panelMaterial = new THREE.MeshPhongMaterial({ color: 0x000088, emissive: 0x000044 });
            const panel1 = new THREE.Mesh(panelGeometry, panelMaterial);
            panel1.position.x = data.size * 2;
            issGroup.add(panel1);
            
            const panel2 = new THREE.Mesh(panelGeometry, panelMaterial);
            panel2.position.x = -data.size * 2;
            issGroup.add(panel2);
            
            issGroup.position.copy(data.position);
            scene.add(issGroup);
            mesh = issGroup;
        } else {
            // Create other celestial bodies with solid colors
            const geometry = new THREE.SphereGeometry(data.size, 32, 32);
            const material = new THREE.MeshPhongMaterial({ 
                color: data.color,
                emissive: data.emissive || 0x000000,
                emissiveIntensity: data.emissive ? 0.5 : 0
            });
            mesh = new THREE.Mesh(geometry, material);
            mesh.position.copy(data.position);
            scene.add(mesh);
        }
        
        bodies[key] = mesh;
        
        // Add glow effect for black hole
        if (key === 'blackhole') {
            const glowGeometry = new THREE.SphereGeometry(data.size * 1.5, 32, 32);
            const glowMaterial = new THREE.MeshBasicMaterial({
                color: 0x800080,
                transparent: true,
                opacity: 0.3
            });
            const glow = new THREE.Mesh(glowGeometry, glowMaterial);
            glow.position.copy(data.position);
            scene.add(glow);
        }
        
        // Add rings to Saturn
        if (key === 'saturn') {
            const ringGeometry = new THREE.RingGeometry(data.size * 1.2, data.size * 2, 64);
            const ringMaterial = new THREE.MeshBasicMaterial({ 
                color: 0xf4a460, 
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.8
            });
            const rings = new THREE.Mesh(ringGeometry, ringMaterial);
            rings.rotation.x = Math.PI / 2;
            mesh.add(rings);
        }
        
        // Create orbit path for planets
        if (data.orbitRadius && key !== 'moon' && key !== 'iss') {
            const orbit = createOrbitPath(data.orbitRadius);
            scene.add(orbit);
            orbits[key] = orbit;
        }
    }
    
    // Hide loading indicator
    const loadingIndicator = document.getElementById('loading-indicator');
    if (loadingIndicator) {
        loadingIndicator.style.display = 'none';
    }
    
    // Initial travel sequence
    setTimeout(() => {
        travelTo('sun');
        setTimeout(() => {
            travelTo('earth');
        }, 2000);
    }, 500);
}

// Create celestial bodies
createCelestialBodies();

// Camera positioning
camera.position.set(200, 100, 200);
camera.lookAt(0, 0, 0);

// Travel animation
let isMoving = false;
let targetPosition = new THREE.Vector3();
let currentSpeed = 1;
let currentDestination = null;

function travelTo(destination) {
    const data = celestialBodies[destination];
    if (!data) return;
    
    // Check if body has been created yet
    if (!bodies[destination]) {
        console.log(`Waiting for ${destination} to load...`);
        setTimeout(() => travelTo(destination), 100);
        return;
    }
    
    currentDestination = destination;
    
    // Get the actual current position for moving objects
    let actualPosition = new THREE.Vector3();
    if (bodies[destination]) {
        actualPosition.copy(bodies[destination].position);
    } else {
        actualPosition.copy(data.position);
    }
    
    targetPosition.copy(actualPosition);
    
    // Special camera positioning for different objects
    if (destination === 'iss') {
        targetPosition.add(new THREE.Vector3(5, 2, 5)); // Much closer for ISS
    } else if (destination === 'moon') {
        targetPosition.add(new THREE.Vector3(20, 10, 20)); // Medium distance for Moon
    } else if (destination === 'sun') {
        targetPosition.add(new THREE.Vector3(100, 50, 100)); // Further for Sun
    } else if (['jupiter', 'saturn', 'uranus', 'neptune'].includes(destination)) {
        targetPosition.add(new THREE.Vector3(80, 40, 80)); // Further for outer planets
    } else {
        targetPosition.add(new THREE.Vector3(50, 30, 50)); // Standard distance for inner planets
    }
    
    isMoving = true;
    
    // Update UI
    document.getElementById('destination-name').textContent = data.name;
    document.getElementById('planet-info').innerHTML = data.info + 
        `<br><br><strong>Educational Value:</strong> ${data.educational}`;
    
    // Highlight active button
    document.querySelectorAll('button').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`btn-${destination}`).classList.add('active');
}

// Button event listeners
Object.keys(celestialBodies).forEach(key => {
    document.getElementById(`btn-${key}`).addEventListener('click', () => travelTo(key));
});

// Speed control
const speedSlider = document.getElementById('speed-slider');
const speedLabel = document.getElementById('speed-label');
speedSlider.addEventListener('input', (e) => {
    currentSpeed = parseInt(e.target.value);
    speedLabel.textContent = currentSpeed + 'x';
});

// Orbit toggle
const orbitToggle = document.getElementById('orbit-toggle');
orbitToggle.addEventListener('change', (e) => {
    orbitsVisible = e.target.checked;
    Object.values(orbits).forEach(orbit => {
        orbit.visible = orbitsVisible;
    });
});

// Animation variables
let moonAngle = 0;
let issAngle = 0;
let auroraTime = 0;

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    
    // Update planet positions based on orbits
    Object.entries(celestialBodies).forEach(([key, data]) => {
        if (data.orbitRadius && data.orbitSpeed && bodies[key]) {
            orbitAngles[key] += data.orbitSpeed;
            const x = Math.cos(orbitAngles[key]) * data.orbitRadius;
            const z = Math.sin(orbitAngles[key]) * data.orbitRadius;
            bodies[key].position.set(x, 0, z);
            
            // Update associated objects for Earth
            if (key === 'earth') {
                if (bodies.earth_clouds) bodies.earth_clouds.position.set(x, 0, z);
                if (bodies.earth_atmosphere) bodies.earth_atmosphere.position.set(x, 0, z);
                if (bodies.earth_daynight) bodies.earth_daynight.position.set(x, 0, z);
                if (bodies.earth_aurora_north) bodies.earth_aurora_north.position.set(x, 0, z);
                if (bodies.earth_aurora_south) bodies.earth_aurora_south.position.set(x, 0, z);
            }
        }
    });
    
    // Update Moon orbit around Earth
    if (bodies.moon && bodies.earth) {
        moonAngle += 0.01;
        const moonDistance = 8; // Scaled down for visibility
        bodies.moon.position.x = bodies.earth.position.x + Math.cos(moonAngle) * moonDistance;
        bodies.moon.position.z = bodies.earth.position.z + Math.sin(moonAngle) * moonDistance;
        bodies.moon.position.y = bodies.earth.position.y + Math.sin(moonAngle * 0.1) * 1; // Slight inclination
    }
    
    // Update ISS orbit around Earth
    if (bodies.iss && bodies.earth) {
        issAngle += 0.03; // Faster orbit (90 minutes)
        const issDistance = 4.5; // Very close to Earth
        bodies.iss.position.x = bodies.earth.position.x + Math.cos(issAngle) * issDistance;
        bodies.iss.position.z = bodies.earth.position.z + Math.sin(issAngle) * issDistance;
        bodies.iss.position.y = bodies.earth.position.y + Math.sin(issAngle * 2) * 0.5; // Slight inclination
        
        // Make ISS always face Earth
        bodies.iss.lookAt(bodies.earth.position);
    }
    
    // Update day/night cycle
    if (bodies.earth_daynight) {
        const earthToSun = new THREE.Vector3().subVectors(bodies.sun.position, bodies.earth.position).normalize();
        bodies.earth_daynight.material.uniforms.sunDirection.value = earthToSun;
        bodies.earth_daynight.rotation.y = bodies.earth.rotation.y;
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
    
    // Camera movement
    if (isMoving || (currentDestination === 'moon' || currentDestination === 'iss')) {
        // Update target position for moving objects
        if ((currentDestination === 'moon' || currentDestination === 'iss') && bodies[currentDestination]) {
            let actualPosition = new THREE.Vector3();
            actualPosition.copy(bodies[currentDestination].position);
            
            // Recalculate target position with appropriate offset
            targetPosition.copy(actualPosition);
            if (currentDestination === 'iss') {
                targetPosition.add(new THREE.Vector3(5, 2, 5));
            } else if (currentDestination === 'moon') {
                targetPosition.add(new THREE.Vector3(20, 10, 20));
            }
        }
        
        if (isMoving) {
            const distance = camera.position.distanceTo(targetPosition);
            if (distance > 1) {
                camera.position.lerp(targetPosition, 0.02 * currentSpeed);
                
                // Update distance display
                document.getElementById('distance').textContent = 
                    `Distance to destination: ${Math.round(distance)} units`;
            } else {
                isMoving = false;
                document.getElementById('distance').textContent = 'Arrived at destination';
            }
        }
        
        // Always look at the current position of the destination
        if (bodies[currentDestination]) {
            camera.lookAt(bodies[currentDestination].position);
        }
    }
    
    // Rotate planets
    Object.entries(bodies).forEach(([key, body]) => {
        if (!body) return; // Skip if body hasn't loaded yet
        
        if (key === 'earth') {
            body.rotation.y += 0.005; // Earth rotation
        } else if (key === 'earth_clouds') {
            body.rotation.y += 0.006; // Clouds rotate slightly faster
        } else if (key === 'moon') {
            body.rotation.y += 0.002; // Moon tidally locked (slower rotation)
        } else if (key === 'iss') {
            // ISS rotation handled above
        } else if (!key.includes('_clouds') && !key.includes('_daynight') && !key.includes('_aurora') && !key.includes('_atmosphere')) {
            body.rotation.y += 0.01;
        }
    });
    
    // Rotate stars
    stars.rotation.y += 0.0001;
    
    renderer.render(scene, camera);
}

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Start animation
animate();