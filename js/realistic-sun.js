// Ultra-realistic sun visualization with advanced shaders and effects

// devLog fallback for consistent logging
const devLog = window.devLog || {
    success: (msg, ...args) => console.log(`✓ ${msg}`, ...args),
    error: (msg, ...args) => console.error(`✗ ${msg}`, ...args),
    warning: (msg, ...args) => console.warn(`⚠ ${msg}`, ...args),
    info: (msg, ...args) => console.log(`ℹ ${msg}`, ...args)
};

class RealisticSun {
    constructor(scene, position, size) {
        devLog.info('RealisticSun: Constructor called', { position, size });
        
        this.scene = scene;
        this.position = position;
        this.size = size;
        this.time = 0;
        
        try {
            // Create all sun components
            this.group = new THREE.Group();
            this.group.position.copy(position);
            
            devLog.info('RealisticSun: Creating sun components...');
            this.createSunCore();
            devLog.success('RealisticSun: Sun core created');

            this.createChromosphere();
            devLog.success('RealisticSun: Chromosphere created');

            this.createCorona();
            devLog.success('RealisticSun: Corona created');

            this.createSolarFlares();
            devLog.success('RealisticSun: Solar flares created');

            this.createProminences();
            devLog.success('RealisticSun: Prominences created');

            // Disabled heat distortion due to rendering artifacts
            // this.createHeatDistortion();
            // devLog.success('RealisticSun: Heat distortion created');

            this.scene.add(this.group);
            devLog.success('RealisticSun: All components created and added to scene');

        } catch (error) {
            devLog.error('RealisticSun: Error during construction:', error);
            // Create a fallback simple sun
            this.createFallbackSun();
        }
    }
    
    createFallbackSun() {
        devLog.warning('RealisticSun: Creating fallback simple sun due to error');
        const geometry = new THREE.SphereGeometry(this.size, 64, 64);
        const material = new THREE.MeshBasicMaterial({
            color: 0xffaa00,
            emissive: 0xffaa00,
            emissiveIntensity: 0.8
        });
        const mesh = new THREE.Mesh(geometry, material);
        this.group = new THREE.Group();
        this.group.add(mesh);
        this.group.position.copy(this.position);
        this.scene.add(this.group);
    }
    
    createSunCore() {
        // Advanced sun surface shader with granulation and convection
        const sunGeometry = new THREE.SphereGeometry(this.size, 128, 128);
        
        const sunShader = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                turbulence: { value: 0.65 },
                brightness: { value: 0.8 },
                sunTexture: { value: null },
                textureStrength: { value: 1.0 },
                // Sunspot parameters
                sunspotIntensity: { value: 0.15 },
                sunspotScale: { value: 3.0 },
                // Surface granulation
                granulationScale: { value: 50.0 },
                granulationSpeed: { value: 0.1 },
                // Color temperature
                colorTemp: { value: new THREE.Color(1.0, 0.85, 0.6) },
                // Performance controls
                cameraDistance: { value: 1000.0 },
                lodLevel: { value: 1.0 }, // 0=minimal, 1=full detail
                performanceMode: { value: 0.0 } // 0=high quality, 1=performance
            },
            vertexShader: `
                varying vec2 vUv;
                varying vec3 vNormal;
                varying vec3 vPosition;
                varying vec3 vWorldPosition;
                
                void main() {
                    vUv = uv;
                    vNormal = normalize(normalMatrix * normal);
                    vPosition = position;
                    vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform float time;
                uniform float turbulence;
                uniform float brightness;
                uniform sampler2D sunTexture;
                uniform float textureStrength;
                uniform float sunspotIntensity;
                uniform float sunspotScale;
                uniform float granulationScale;
                uniform float granulationSpeed;
                uniform vec3 colorTemp;
                
                varying vec2 vUv;
                varying vec3 vNormal;
                varying vec3 vPosition;
                varying vec3 vWorldPosition;
                
                // Noise functions for procedural textures
                vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
                vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
                vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
                vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
                
                float snoise(vec3 v) {
                    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
                    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
                    
                    vec3 i = floor(v + dot(v, C.yyy));
                    vec3 x0 = v - i + dot(i, C.xxx);
                    
                    vec3 g = step(x0.yzx, x0.xyz);
                    vec3 l = 1.0 - g;
                    vec3 i1 = min(g.xyz, l.zxy);
                    vec3 i2 = max(g.xyz, l.zxy);
                    
                    vec3 x1 = x0 - i1 + C.xxx;
                    vec3 x2 = x0 - i2 + C.yyy;
                    vec3 x3 = x0 - D.yyy;
                    
                    i = mod289(i);
                    vec4 p = permute(permute(permute(
                        i.z + vec4(0.0, i1.z, i2.z, 1.0))
                        + i.y + vec4(0.0, i1.y, i2.y, 1.0))
                        + i.x + vec4(0.0, i1.x, i2.x, 1.0));
                    
                    float n_ = 0.142857142857;
                    vec3 ns = n_ * D.wyz - D.xzx;
                    
                    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
                    
                    vec4 x_ = floor(j * ns.z);
                    vec4 y_ = floor(j - 7.0 * x_);
                    
                    vec4 x = x_ *ns.x + ns.yyyy;
                    vec4 y = y_ *ns.x + ns.yyyy;
                    vec4 h = 1.0 - abs(x) - abs(y);
                    
                    vec4 b0 = vec4(x.xy, y.xy);
                    vec4 b1 = vec4(x.zw, y.zw);
                    
                    vec4 s0 = floor(b0)*2.0 + 1.0;
                    vec4 s1 = floor(b1)*2.0 + 1.0;
                    vec4 sh = -step(h, vec4(0.0));
                    
                    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
                    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
                    
                    vec3 p0 = vec3(a0.xy, h.x);
                    vec3 p1 = vec3(a0.zw, h.y);
                    vec3 p2 = vec3(a1.xy, h.z);
                    vec3 p3 = vec3(a1.zw, h.w);
                    
                    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
                    p0 *= norm.x;
                    p1 *= norm.y;
                    p2 *= norm.z;
                    p3 *= norm.w;
                    
                    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
                    m = m * m;
                    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
                }
                
                // Performance-optimized fractal brownian motion
                float fbm(vec3 p, int octaves) {
                    float value = 0.0;
                    float amplitude = 1.0;
                    float frequency = 1.0;
                    
                    // Performance optimization: Reduce octaves based on distance and LOD
                    int maxOctaves = int(mix(float(octaves), 2.0, performanceMode));
                    maxOctaves = int(mix(2.0, float(maxOctaves), lodLevel));
                    
                    for (int i = 0; i < 6; i++) { // Fixed loop for WebGL compatibility
                        if (i >= maxOctaves) break;
                        value += amplitude * snoise(p * frequency);
                        amplitude *= 0.5;
                        frequency *= 2.0;
                    }
                    
                    return value;
                }
                
                // Simplified noise for performance mode
                float fastNoise(vec3 p) {
                    return sin(p.x * 5.0) * cos(p.y * 4.0) * sin(p.z * 3.0) * 0.5;
                }
                
                void main() {
                    vec3 pos = vPosition * 0.02;
                    float t = time * 0.05;
                    
                    // Performance optimization: Skip complex calculations for distant views
                    if (performanceMode > 0.5) {
                        // Fast path for performance mode
                        vec3 baseColor = colorTemp;
                        
                        #ifdef USE_MAP
                            vec3 textureColor = texture2D(sunTexture, vUv).rgb;
                            baseColor = mix(colorTemp, textureColor, textureStrength);
                        #endif
                        
                        // Simple noise for basic surface variation
                        float simpleNoise = fastNoise(pos * 20.0 + vec3(t));
                        float variation = simpleNoise * 0.1 + 0.9;
                        
                        // Basic limb darkening
                        float limbDarkening = dot(normalize(vNormal), vec3(0.0, 0.0, 1.0));
                        limbDarkening = mix(0.5, 1.0, pow(limbDarkening, 0.4));
                        
                        vec3 surfaceColor = baseColor * variation * limbDarkening * brightness;
                        gl_FragColor = vec4(surfaceColor, 1.0);
                        return;
                    }
                    
                    // Full quality path
                    vec3 baseColor = colorTemp;
                    vec3 textureColor = colorTemp;
                    
                    // Sample texture if available
                    #ifdef USE_MAP
                        textureColor = texture2D(sunTexture, vUv).rgb;
                        // Enhance texture contrast and color
                        textureColor = pow(textureColor, vec3(0.8)); // Brighten mid-tones
                        textureColor *= vec3(1.0, 0.95, 0.85); // Warm tint
                    #endif
                    
                    // Blend texture with procedural color
                    baseColor = mix(colorTemp, textureColor, textureStrength);
                    
                    // LOD-based detail levels
                    int granulationOctaves = int(mix(2.0, 4.0, lodLevel));
                    int convectionOctaves = int(mix(1.0, 3.0, lodLevel));
                    
                    // Surface granulation (convection cells) - LOD optimized
                    float granulation = fbm(pos * granulationScale + vec3(t * granulationSpeed), granulationOctaves);
                    granulation = pow(granulation * 0.5 + 0.5, 1.5);
                    granulation = mix(0.8, 1.2, granulation); // Reduce contrast
                    
                    // Large-scale convection patterns
                    float convection = fbm(pos * 2.0 + vec3(t * 0.02), convectionOctaves);
                    convection = convection * 0.2 + 0.8; // More subtle
                    
                    // Sunspots - only calculate if LOD is high enough
                    float sunspots = 1.0;
                    if (lodLevel > 0.5) {
                        float sunspotMask = fbm(pos * 1.5 + vec3(t * 0.005), 2);
                        sunspotMask = smoothstep(0.4, 0.6, sunspotMask);
                        sunspots = fbm(pos * sunspotScale + vec3(t * 0.01), 2);
                        sunspots = smoothstep(0.3, 0.7, sunspots);
                        sunspots = 1.0 - (sunspots * sunspotIntensity * sunspotMask);
                    }
                    
                    // Combine all surface features
                    vec3 surfaceColor = baseColor * granulation * convection * sunspots;
                    
                    // Limb darkening (edges appear darker)
                    float limbDarkening = dot(normalize(vNormal), vec3(0.0, 0.0, 1.0));
                    limbDarkening = pow(limbDarkening, 0.4); // Less aggressive darkening
                    limbDarkening = mix(0.5, 1.0, limbDarkening); // Maintain visibility at edges
                    surfaceColor *= limbDarkening;
                    
                    // Temperature variation - only if high LOD
                    if (lodLevel > 0.7) {
                        float tempVariation = fbm(pos * 10.0 + vec3(t * 0.1), 2) * 0.1;
                        vec3 hotColor = vec3(1.0, 0.98, 0.9);
                        vec3 coolColor = vec3(1.0, 0.88, 0.7);
                        surfaceColor = mix(surfaceColor * coolColor, surfaceColor * hotColor, tempVariation + 0.5);
                        
                        // Add slight turbulence at the edges
                        float edgeTurbulence = 1.0 - limbDarkening;
                        surfaceColor += vec3(1.0, 0.95, 0.8) * edgeTurbulence * turbulence * 0.1;
                    }
                    
                    // Brightness and emission
                    surfaceColor *= brightness;
                    
                    // Ensure minimum brightness so details are visible
                    surfaceColor = max(surfaceColor, vec3(0.2, 0.15, 0.1));
                    
                    gl_FragColor = vec4(surfaceColor, 1.0);
                }
            `,
            side: THREE.FrontSide
        });
        
        // Load sun texture if available
        const textureLoader = new THREE.TextureLoader();
        const textureMode = window.simulationMode || 'high';
        const texturePath = `textures/${textureMode}/${textureMode === 'high' ? '8k' : '2k'}_sun.jpg`;
        
        devLog.info(`RealisticSun: Loading texture from ${texturePath}`);

        textureLoader.load(
            texturePath,
            (texture) => {
                devLog.success('RealisticSun: Sun texture loaded successfully');
                sunShader.uniforms.sunTexture.value = texture;
                sunShader.defines = { USE_MAP: true };
                sunShader.needsUpdate = true;
            },
            (progress) => {
                // Loading progress
                if (progress.lengthComputable) {
                    const percent = Math.round((progress.loaded / progress.total) * 100);
                    if (percent % 25 === 0) { // Log every 25%
                        devLog.info(`RealisticSun: Loading texture ${percent}%`);
                    }
                }
            },
            (error) => {
                devLog.error('RealisticSun: Failed to load sun texture:', error);
                devLog.warning('RealisticSun: Continuing without texture (shader will use procedural effects)');
                // Don't set USE_MAP define - shader will work without texture
            }
        );
        
        this.sunCore = new THREE.Mesh(sunGeometry, sunShader);
        
        // Debug shader compilation
        if (sunShader.needsUpdate) {
            devLog.info('RealisticSun: Shader compilation triggered');
        }
        
        this.group.add(this.sunCore);
        
        console.log('RealisticSun: Sun core mesh created and added to group');
        
        // Inner glow for emission
        const innerGlowGeometry = new THREE.SphereGeometry(this.size * 1.02, 64, 64);
        const innerGlowMaterial = new THREE.ShaderMaterial({
            uniforms: {
                glowColor: { value: new THREE.Color(1.0, 0.9, 0.6) },
                intensity: { value: 0.3 }  // Reduced intensity
            },
            vertexShader: `
                varying vec3 vNormal;
                void main() {
                    vNormal = normalize(normalMatrix * normal);
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform vec3 glowColor;
                uniform float intensity;
                varying vec3 vNormal;
                
                void main() {
                    float glow = pow(0.8 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 3.0);
                    gl_FragColor = vec4(glowColor * intensity, glow);
                }
            `,
            side: THREE.BackSide,
            blending: THREE.AdditiveBlending,
            transparent: true
        });
        
        const innerGlow = new THREE.Mesh(innerGlowGeometry, innerGlowMaterial);
        innerGlow.renderOrder = 1;  // Render after sun core
        this.group.add(innerGlow);
    }
    
    createChromosphere() {
        // Chromosphere layer - reddish atmosphere visible during eclipses
        const chromosphereGeometry = new THREE.SphereGeometry(this.size * 1.05, 64, 64);
        
        const chromosphereMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                color: { value: new THREE.Color(1.0, 0.3, 0.1) },
                intensity: { value: 0.3 }
            },
            vertexShader: `
                varying vec3 vNormal;
                varying vec3 vPosition;
                
                void main() {
                    vNormal = normalize(normalMatrix * normal);
                    vPosition = position;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform float time;
                uniform vec3 color;
                uniform float intensity;
                
                varying vec3 vNormal;
                varying vec3 vPosition;
                
                void main() {
                    float rim = 1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0)));
                    rim = pow(rim, 3.0);
                    
                    // Add some movement
                    float noise = sin(vPosition.x * 10.0 + time) * 0.1 + 0.9;
                    
                    gl_FragColor = vec4(color * intensity * noise, rim * 0.6);
                }
            `,
            side: THREE.BackSide,
            blending: THREE.AdditiveBlending,
            transparent: true,
            depthWrite: false
        });
        
        this.chromosphere = new THREE.Mesh(chromosphereGeometry, chromosphereMaterial);
        this.chromosphere.renderOrder = 1;  // Same as inner glow
        this.group.add(this.chromosphere);
    }
    
    createCorona() {
        // Multi-layered corona effect
        const coronaLayers = 3;
        this.coronas = [];
        
        for (let i = 0; i < coronaLayers; i++) {
            const scale = 1.2 + i * 0.3;
            const coronaGeometry = new THREE.SphereGeometry(this.size * scale, 32, 32);
            
            const coronaMaterial = new THREE.ShaderMaterial({
                uniforms: {
                    time: { value: 0 },
                    layerIndex: { value: i },
                    baseColor: { value: new THREE.Color(1.0, 0.95, 0.8) },
                    intensity: { value: 0.05 / (i + 1) }  // Reduced intensity
                },
                vertexShader: `
                    varying vec3 vNormal;
                    varying vec3 vPosition;
                    varying vec2 vUv;
                    
                    void main() {
                        vUv = uv;
                        vNormal = normalize(normalMatrix * normal);
                        vPosition = position;
                        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                    }
                `,
                fragmentShader: `
                    uniform float time;
                    uniform float layerIndex;
                    uniform vec3 baseColor;
                    uniform float intensity;
                    
                    varying vec3 vNormal;
                    varying vec3 vPosition;
                    varying vec2 vUv;
                    
                    // Simple noise for corona movement
                    float hash(vec2 p) {
                        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
                    }
                    
                    float noise(vec2 p) {
                        vec2 i = floor(p);
                        vec2 f = fract(p);
                        f = f * f * (3.0 - 2.0 * f);
                        
                        return mix(mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), f.x),
                                  mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
                    }
                    
                    void main() {
                        // Edge glow calculation
                        float rim = 1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0)));
                        rim = pow(rim, 2.0 - layerIndex * 0.3);
                        
                        // Animated plasma streams
                        float theta = atan(vPosition.y, vPosition.x);
                        float phi = acos(vPosition.z / length(vPosition));
                        
                        float stream1 = sin(theta * 3.0 + time * 0.5 + layerIndex) * 0.5 + 0.5;
                        float stream2 = sin(phi * 5.0 - time * 0.3) * 0.5 + 0.5;
                        float plasma = stream1 * stream2;
                        
                        // Add turbulence
                        vec2 noiseCoord = vec2(theta, phi) * 5.0 + time * 0.1;
                        float turbulence = noise(noiseCoord) * 0.3 + 0.7;
                        
                        // Combine effects
                        float alpha = rim * plasma * turbulence * intensity;
                        vec3 color = baseColor * (1.0 + layerIndex * 0.1);
                        
                        gl_FragColor = vec4(color, alpha);
                    }
                `,
                side: THREE.BackSide,
                blending: THREE.AdditiveBlending,
                transparent: true,
                depthWrite: false
            });
            
            const corona = new THREE.Mesh(coronaGeometry, coronaMaterial);
            corona.renderOrder = 2 + i;  // Render in order, after inner glow
            this.group.add(corona);
            this.coronas.push(corona);
        }
    }
    
    createSolarFlares() {
        // Dynamic solar flares
        this.flares = [];
        const flareCount = 6;
        
        for (let i = 0; i < flareCount; i++) {
            const flareGeometry = new THREE.ConeGeometry(this.size * 0.1, this.size * 2, 8);
            
            const flareMaterial = new THREE.ShaderMaterial({
                uniforms: {
                    time: { value: 0 },
                    flareColor: { value: new THREE.Color(1.0, 0.9, 0.5) },
                    intensity: { value: 0.0 },
                    life: { value: 0.0 }
                },
                vertexShader: `
                    varying vec3 vPosition;
                    varying float vY;
                    
                    void main() {
                        vPosition = position;
                        vY = position.y;
                        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                    }
                `,
                fragmentShader: `
                    uniform float time;
                    uniform vec3 flareColor;
                    uniform float intensity;
                    uniform float life;
                    
                    varying vec3 vPosition;
                    varying float vY;
                    
                    void main() {
                        float fade = 1.0 - (vY / ${this.size * 2.0});
                        fade = pow(fade, 2.0);
                        
                        float pulse = sin(time * 10.0 + vY * 5.0) * 0.2 + 0.8;
                        
                        float alpha = fade * intensity * life * pulse;
                        gl_FragColor = vec4(flareColor * (1.0 + vY * 0.001), alpha);
                    }
                `,
                blending: THREE.AdditiveBlending,
                transparent: true,
                depthWrite: false,
                side: THREE.DoubleSide
            });
            
            const flare = new THREE.Mesh(flareGeometry, flareMaterial);
            flare.visible = false;
            
            // Position randomly on sun surface
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;
            flare.position.set(
                Math.sin(phi) * Math.cos(theta) * this.size,
                Math.cos(phi) * this.size,
                Math.sin(phi) * Math.sin(theta) * this.size
            );
            flare.lookAt(flare.position.clone().multiplyScalar(2));
            
            this.group.add(flare);
            this.flares.push({
                mesh: flare,
                life: 0,
                active: false,
                nextFlare: Math.random() * 10
            });
        }
    }
    
    createProminences() {
        // Magnetic loop prominences
        this.prominences = [];
        const prominenceCount = 4;
        
        for (let i = 0; i < prominenceCount; i++) {
            const curve = new THREE.CatmullRomCurve3([
                new THREE.Vector3(0, 0, 0),
                new THREE.Vector3(this.size * 0.3, this.size * 0.5, 0),
                new THREE.Vector3(this.size * 0.6, this.size * 0.7, 0),
                new THREE.Vector3(this.size * 0.8, this.size * 0.5, 0),
                new THREE.Vector3(this.size * 1.0, 0, 0)
            ]);
            
            const tubeGeometry = new THREE.TubeGeometry(curve, 32, this.size * 0.05, 8, false);
            
            const prominenceMaterial = new THREE.ShaderMaterial({
                uniforms: {
                    time: { value: 0 },
                    color: { value: new THREE.Color(1.0, 0.3, 0.2) },
                    intensity: { value: 0.0 }
                },
                vertexShader: `
                    varying vec3 vPosition;
                    
                    void main() {
                        vPosition = position;
                        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                    }
                `,
                fragmentShader: `
                    uniform float time;
                    uniform vec3 color;
                    uniform float intensity;
                    
                    varying vec3 vPosition;
                    
                    void main() {
                        float glow = sin(vPosition.x * 10.0 + time * 5.0) * 0.3 + 0.7;
                        gl_FragColor = vec4(color * glow, intensity);
                    }
                `,
                blending: THREE.AdditiveBlending,
                transparent: true,
                depthWrite: false
            });
            
            const prominence = new THREE.Mesh(tubeGeometry, prominenceMaterial);
            prominence.rotation.z = (i / prominenceCount) * Math.PI * 2;
            prominence.visible = false;
            
            this.group.add(prominence);
            this.prominences.push({
                mesh: prominence,
                active: false,
                life: 0,
                nextActive: Math.random() * 15
            });
        }
    }
    
    createHeatDistortion() {
        // Heat shimmer effect using screen-space distortion
        const heatGeometry = new THREE.SphereGeometry(this.size * 3, 32, 32);
        
        this.heatDistortion = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                distortionStrength: { value: 0.02 }
            },
            vertexShader: `
                varying vec3 vNormal;
                varying vec3 vPosition;
                
                void main() {
                    vNormal = normalize(normalMatrix * normal);
                    vPosition = position;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform float time;
                uniform float distortionStrength;
                
                varying vec3 vNormal;
                varying vec3 vPosition;
                
                void main() {
                    float rim = 1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0)));
                    rim = pow(rim, 3.0);
                    
                    // Create heat distortion pattern
                    float distortion = sin(vPosition.x * 5.0 + time * 2.0) * 
                                      cos(vPosition.y * 5.0 - time * 1.5) * 
                                      sin(vPosition.z * 5.0 + time);
                    
                    gl_FragColor = vec4(1.0, 0.9, 0.7, rim * distortionStrength * (0.5 + distortion * 0.5));
                }
            `,
            side: THREE.BackSide,
            transparent: true,
            depthWrite: false
        });
        
        const heatMesh = new THREE.Mesh(heatGeometry, this.heatDistortion);
        this.group.add(heatMesh);
    }
    
    update(deltaTime) {
        this.time += deltaTime;
        
        // Update sun core
        if (this.sunCore && this.sunCore.material.uniforms) {
            this.sunCore.material.uniforms.time.value = this.time;
            
            // Pulse brightness slightly
            const pulse = Math.sin(this.time * 0.5) * 0.02 + 1.0;
            this.sunCore.material.uniforms.brightness.value = 0.8 * pulse;
        }
        
        // Rotate sun slowly
        this.sunCore.rotation.y += 0.0001;
        
        // Update chromosphere
        if (this.chromosphere) {
            this.chromosphere.material.uniforms.time.value = this.time;
        }
        
        // Update coronas with different speeds
        this.coronas.forEach((corona, index) => {
            corona.material.uniforms.time.value = this.time * (1 + index * 0.2);
            corona.rotation.y = this.time * 0.0002 * (index + 1);
        });
        
        // Update solar flares
        this.flares.forEach(flare => {
            flare.nextFlare -= deltaTime;
            
            if (!flare.active && flare.nextFlare <= 0) {
                // Activate flare
                flare.active = true;
                flare.life = 0;
                flare.mesh.visible = true;
                
                // Reposition
                const theta = Math.random() * Math.PI * 2;
                const phi = Math.random() * Math.PI;
                flare.mesh.position.set(
                    Math.sin(phi) * Math.cos(theta) * this.size,
                    Math.cos(phi) * this.size,
                    Math.sin(phi) * Math.sin(theta) * this.size
                );
                flare.mesh.lookAt(flare.mesh.position.clone().multiplyScalar(2));
            }
            
            if (flare.active) {
                flare.life += deltaTime * 0.5;
                
                if (flare.life > 1) {
                    // Deactivate
                    flare.active = false;
                    flare.mesh.visible = false;
                    flare.nextFlare = 5 + Math.random() * 10;
                } else {
                    // Update intensity
                    const intensity = Math.sin(flare.life * Math.PI);
                    flare.mesh.material.uniforms.intensity.value = intensity;
                    flare.mesh.material.uniforms.life.value = flare.life;
                    flare.mesh.material.uniforms.time.value = this.time;
                }
            }
        });
        
        // Update prominences
        this.prominences.forEach(prom => {
            prom.nextActive -= deltaTime;
            
            if (!prom.active && prom.nextActive <= 0) {
                prom.active = true;
                prom.life = 0;
                prom.mesh.visible = true;
                prom.mesh.rotation.z = Math.random() * Math.PI * 2;
            }
            
            if (prom.active) {
                prom.life += deltaTime * 0.3;
                
                if (prom.life > 1) {
                    prom.active = false;
                    prom.mesh.visible = false;
                    prom.nextActive = 10 + Math.random() * 15;
                } else {
                    const intensity = Math.sin(prom.life * Math.PI) * 0.6;
                    prom.mesh.material.uniforms.intensity.value = intensity;
                    prom.mesh.material.uniforms.time.value = this.time;
                    
                    // Animate the prominence
                    prom.mesh.rotation.x = Math.sin(this.time * 0.5) * 0.1;
                }
            }
        });
        
        // Update heat distortion (disabled)
        // if (this.heatDistortion) {
        //     this.heatDistortion.uniforms.time.value = this.time;
        // }
    }
    
    updatePosition(newPosition) {
        this.position = newPosition;
        this.group.position.copy(newPosition);
    }
    
    // Performance optimization methods
    updatePerformanceUniforms(cameraDistance, frameRate) {
        if (!this.sunCore || !this.sunCore.material.uniforms) return;
        
        // Update camera distance for LOD calculations
        this.sunCore.material.uniforms.cameraDistance.value = cameraDistance;
        
        // Adjust LOD level based on distance and performance
        let lodLevel = 1.0;
        if (cameraDistance > 5000) {
            lodLevel = 0.3; // Far away - minimal detail
        } else if (cameraDistance > 2000) {
            lodLevel = 0.6; // Medium distance - reduced detail
        }
        
        // Further reduce LOD if frame rate is low
        if (frameRate < 30) {
            lodLevel *= 0.5;
        }
        
        this.sunCore.material.uniforms.lodLevel.value = lodLevel;
        
        // Performance mode: Switch to fast rendering when needed
        const performanceMode = (frameRate < 25 || cameraDistance > 8000) ? 1.0 : 0.0;
        this.sunCore.material.uniforms.performanceMode.value = performanceMode;
        
        // Adjust visibility of expensive effects based on performance
        if (frameRate < 20) {
            // Disable expensive effects
            this.coronas.forEach(corona => corona.visible = false);
            this.flares.forEach(flare => flare.mesh.visible = false);
            this.prominences.forEach(prominence => prominence.mesh.visible = false);
        } else if (frameRate < 40) {
            // Reduce some effects
            this.coronas.forEach((corona, index) => {
                corona.visible = index < 2; // Show only first 2 corona layers
            });
        } else {
            // Enable all effects
            this.coronas.forEach(corona => corona.visible = true);
        }
    }
    
    // Adaptive quality based on distance
    setDistanceBasedQuality(distance) {
        if (!this.sunCore) return;

        // Adjust geometry complexity based on distance
        if (distance > 10000) {
            // Very far - consider using lower poly geometry
            if (this.sunCore.geometry.parameters?.widthSegments > 32) {
                const lowPolyGeometry = new THREE.SphereGeometry(this.size, 32, 32);
                this.sunCore.geometry.dispose();
                this.sunCore.geometry = lowPolyGeometry;
            }
        }
    }
    
    // Get performance statistics
    getPerformanceStats() {
        const activeCorona = this.coronas ? this.coronas.filter(c => c.visible).length : 0;
        const activeFlares = this.flares ? this.flares.filter(f => f.active).length : 0;
        const activeProminences = this.prominences ? this.prominences.filter(p => p.active).length : 0;
        
        return {
            activeCorona: activeCorona,
            activeFlares: activeFlares,
            activeProminences: activeProminences,
            lodLevel: this.sunCore?.material?.uniforms?.lodLevel?.value || 0,
            performanceMode: this.sunCore?.material?.uniforms?.performanceMode?.value || 0
        };
    }
    
    dispose() {
        // Clean up resources
        this.group.traverse(child => {
            if (child.geometry) child.geometry.dispose();
            if (child.material) {
                if (child.material.map) child.material.map.dispose();
                child.material.dispose();
            }
        });
        this.scene.remove(this.group);
    }
}