// Asteroid belt and minor bodies visualization
class AsteroidBelt {
    constructor(scene, innerRadius, outerRadius) {
        this.scene = scene;
        this.innerRadius = innerRadius; // ~2.2 AU
        this.outerRadius = outerRadius; // ~3.2 AU
        this.asteroids = [];
        this.asteroidGroup = new THREE.Group();
        this.scene.add(this.asteroidGroup);
        
        // Major asteroids data
        this.majorAsteroids = {
            ceres: {
                name: 'Ceres',
                radius: 473, // km
                distance: 2.77, // AU
                color: 0x999999,
                info: 'Largest asteroid, classified as dwarf planet'
            },
            pallas: {
                name: 'Pallas',
                radius: 256,
                distance: 2.77,
                color: 0x888888,
                info: 'Second most massive asteroid'
            },
            vesta: {
                name: 'Vesta',
                radius: 262.7,
                distance: 2.36,
                color: 0xAAAAAA,
                info: 'Brightest asteroid visible from Earth'
            },
            hygiea: {
                name: 'Hygiea',
                radius: 217,
                distance: 3.14,
                color: 0x777777,
                info: 'Fourth largest asteroid'
            }
        };
        
        this.createAsteroidBelt();
        this.createMajorAsteroids();
    }
    
    createAsteroidBelt() {
        // Performance optimization: Reduce count and add LOD system
        const asteroidCount = 1500; // Reduced for better performance
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(asteroidCount * 3);
        const colors = new Float32Array(asteroidCount * 3);
        const sizes = new Float32Array(asteroidCount);
        
        // Orbital elements for each asteroid (pre-computed for performance)
        this.asteroidOrbits = [];
        this.asteroidCount = asteroidCount;
        
        // Performance tracking
        this.lastUpdateTime = 0;
        this.updateInterval = 16; // Update every 16ms (~60fps)
        
        // LOD system for distance-based optimization
        this.lodDistances = {
            near: 500,    // Full detail
            medium: 1500, // Reduced detail
            far: 3000     // Minimal detail
        };
        
        // Batch update optimization
        this.batchSize = 100; // Update asteroids in batches
        this.currentBatch = 0;
        
        for (let i = 0; i < asteroidCount; i++) {
            // Generate orbital elements
            const a = this.innerRadius + Math.random() * (this.outerRadius - this.innerRadius);
            const e = Math.random() * 0.2; // Eccentricity
            const inc = (Math.random() - 0.5) * 0.2; // Inclination in radians
            const omega = Math.random() * Math.PI * 2; // Longitude of ascending node
            const w = Math.random() * Math.PI * 2; // Argument of periapsis
            const M = Math.random() * Math.PI * 2; // Mean anomaly
            
            // Store orbital elements
            this.asteroidOrbits.push({
                a: a,
                e: e,
                inc: inc,
                omega: omega,
                w: w,
                M: M,
                n: Math.sqrt(1 / (a * a * a)) // Mean motion
            });
            
            // Calculate initial position
            const pos = this.calculateAsteroidPosition(i, 0);
            positions[i * 3] = pos.x;
            positions[i * 3 + 1] = pos.y;
            positions[i * 3 + 2] = pos.z;
            
            // Size distribution (power law)
            sizes[i] = Math.pow(Math.random(), 3) * 2 + 0.5;
            
            // Color variation
            const brightness = 0.3 + Math.random() * 0.4;
            colors[i * 3] = brightness;
            colors[i * 3 + 1] = brightness * 0.9;
            colors[i * 3 + 2] = brightness * 0.8;
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        
        // Optimized shader for asteroids with performance improvements
        const asteroidMaterial = new THREE.ShaderMaterial({
            uniforms: {
                scale: { value: window.innerHeight / 2 },
                cameraPosition: { value: new THREE.Vector3() },
                lodDistances: { value: new THREE.Vector3(this.lodDistances.near, this.lodDistances.medium, this.lodDistances.far) }
            },
            vertexShader: `
                attribute float size;
                attribute vec3 color;
                varying vec3 vColor;
                varying float vDistance;
                uniform vec3 cameraPosition;
                uniform vec3 lodDistances;
                
                void main() {
                    vColor = color;
                    
                    // Calculate distance for LOD
                    vDistance = distance(position, cameraPosition);
                    
                    // LOD-based size adjustment
                    float lodFactor = 1.0;
                    if (vDistance > lodDistances.z) {
                        lodFactor = 0.1; // Very distant
                    } else if (vDistance > lodDistances.y) {
                        lodFactor = 0.5; // Medium distance
                    }
                    
                    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                    gl_PointSize = size * lodFactor * (scale / -mvPosition.z);
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                varying vec3 vColor;
                varying float vDistance;
                uniform vec3 lodDistances;
                
                void main() {
                    // Performance optimization: Skip complex calculations for distant objects
                    if (vDistance > lodDistances.z) {
                        gl_FragColor = vec4(vColor * 0.5, 1.0);
                        return;
                    }
                    
                    // Circular point with optimized calculations
                    vec2 xy = gl_PointCoord.xy - vec2(0.5);
                    float ll = dot(xy, xy);
                    
                    if (ll > 0.25) discard;
                    
                    // Distance-based detail reduction
                    float intensity = vDistance > lodDistances.y ? 
                                     1.0 - ll * 2.0 : // Simple shading for distant
                                     1.0 - ll * 4.0;  // Detailed shading for near
                    
                    gl_FragColor = vec4(vColor * intensity, 1.0);
                }
            `,
            blending: THREE.AdditiveBlending,
            depthTest: true,
            depthWrite: false,
            transparent: true
        });
        
        this.asteroidPoints = new THREE.Points(geometry, asteroidMaterial);
        this.asteroidGroup.add(this.asteroidPoints);
        
        console.log(`AsteroidBelt: Created ${asteroidCount} asteroids between ${this.innerRadius} and ${this.outerRadius} AU`);
    }
    
    createMajorAsteroids() {
        for (const [key, data] of Object.entries(this.majorAsteroids)) {
            const size = Math.max(data.radius * 0.00001, 0.5); // Scale appropriately
            const geometry = new THREE.SphereGeometry(size, 16, 16);
            const material = new THREE.MeshPhongMaterial({
                color: data.color,
                emissive: data.color,
                emissiveIntensity: 0.1
            });
            
            const mesh = new THREE.Mesh(geometry, material);
            
            // Set initial position
            const angle = Math.random() * Math.PI * 2;
            const AU_SCALE = window.AU_SCALE || 100;
            const x = Math.cos(angle) * data.distance * AU_SCALE;
            const z = Math.sin(angle) * data.distance * AU_SCALE;
            mesh.position.set(x, 0, z);
            
            this.asteroidGroup.add(mesh);
            
            // Store reference
            this.asteroids.push({
                mesh: mesh,
                data: data,
                angle: angle,
                distance: data.distance // Distance in AU, will be scaled in update
            });
            
            // Add label if available
            if (window.planetLabels) {
                window.planetLabels.createLabel(data.name, mesh.position, 0.7);
            }
        }
        console.log(`AsteroidBelt: Created ${this.asteroids.length} major asteroids: ${Object.keys(this.majorAsteroids).join(', ')}`);
    }
    
    calculateAsteroidPosition(index, time) {
        const orbit = this.asteroidOrbits[index];
        
        // Performance optimization: Cache expensive calculations
        if (!orbit.precomputed) {
            orbit.cosOmega = Math.cos(orbit.omega);
            orbit.sinOmega = Math.sin(orbit.omega);
            orbit.cosI = Math.cos(orbit.inc);
            orbit.sinI = Math.sin(orbit.inc);
            orbit.cosW = Math.cos(orbit.w);
            orbit.sinW = Math.sin(orbit.w);
            orbit.precomputed = true;
        }
        
        // Mean anomaly at time t
        const M = orbit.M + orbit.n * time;
        
        // Solve Kepler's equation (optimized for performance)
        let E = M;
        // Reduced iterations for distant asteroids
        const iterations = 3; // Was 5, reduced for performance
        for (let j = 0; j < iterations; j++) {
            E = M + orbit.e * Math.sin(E);
        }
        
        // True anomaly (optimized calculation)
        const cosE = Math.cos(E / 2);
        const sinE = Math.sin(E / 2);
        const v = 2 * Math.atan2(
            Math.sqrt(1 + orbit.e) * sinE,
            Math.sqrt(1 - orbit.e) * cosE
        );
        
        // Distance from sun - use global AU_SCALE
        const AU_SCALE = window.AU_SCALE || 100;
        const r = orbit.a * (1 - orbit.e * Math.cos(E)) * AU_SCALE;
        
        // Position in orbital plane
        const cosV = Math.cos(v);
        const sinV = Math.sin(v);
        const xOrbit = r * cosV;
        const yOrbit = r * sinV;
        
        // Rotate to 3D position using precomputed values
        const x = (orbit.cosOmega * orbit.cosW - orbit.sinOmega * orbit.sinW * orbit.cosI) * xOrbit +
                  (-orbit.cosOmega * orbit.sinW - orbit.sinOmega * orbit.cosW * orbit.cosI) * yOrbit;
        const y = (orbit.sinW * orbit.sinI) * xOrbit + (orbit.cosW * orbit.sinI) * yOrbit;
        const z = (orbit.sinOmega * orbit.cosW + orbit.cosOmega * orbit.sinW * orbit.cosI) * xOrbit +
                  (-orbit.sinOmega * orbit.sinW + orbit.cosOmega * orbit.cosW * orbit.cosI) * yOrbit;
        
        return new THREE.Vector3(x, y, z);
    }
    
    update(deltaTime, timeScale = 1) {
        // Performance optimization: Throttle updates and use LOD
        const currentTime = performance.now();
        if (currentTime - this.lastUpdateTime < this.updateInterval) {
            return; // Skip this frame to maintain 60fps
        }
        this.lastUpdateTime = currentTime;
        
        // Update asteroid positions with LOD optimization
        if (this.asteroidPoints) {
            const positions = this.asteroidPoints.geometry.attributes.position.array;
            const time = deltaTime * timeScale;
            
            // Get camera position for LOD calculations
            const cameraPos = window.camera ? window.camera.position : new THREE.Vector3();
            
            // Batch update optimization: Update only a subset each frame
            const startIdx = this.currentBatch * this.batchSize;
            const endIdx = Math.min(startIdx + this.batchSize, this.asteroidOrbits.length);
            
            for (let i = startIdx; i < endIdx; i++) {
                // Distance-based LOD optimization
                const estimatedDistance = this.asteroidOrbits[i].a * (window.AU_SCALE || 100);
                const distanceToCamera = cameraPos.distanceTo(new THREE.Vector3(
                    positions[i * 3],
                    positions[i * 3 + 1], 
                    positions[i * 3 + 2]
                ));
                
                // Skip updates for very distant asteroids
                if (distanceToCamera > this.lodDistances.far) {
                    continue;
                }
                
                // Reduced calculation frequency for distant objects
                const updateFrequency = distanceToCamera > this.lodDistances.medium ? 0.1 : 
                                       distanceToCamera > this.lodDistances.near ? 0.5 : 1.0;
                
                if (Math.random() > updateFrequency) {
                    continue;
                }
                
                const pos = this.calculateAsteroidPosition(i, time);
                positions[i * 3] = pos.x;
                positions[i * 3 + 1] = pos.y;
                positions[i * 3 + 2] = pos.z;
            }
            
            // Advance to next batch
            this.currentBatch = (this.currentBatch + 1) % Math.ceil(this.asteroidOrbits.length / this.batchSize);
            
            this.asteroidPoints.geometry.attributes.position.needsUpdate = true;
        }
        
        // Update major asteroids
        const AU_SCALE = window.AU_SCALE || 100;
        for (const asteroid of this.asteroids) {
            asteroid.angle += deltaTime * timeScale / (asteroid.distance * 50);
            const x = Math.cos(asteroid.angle) * asteroid.distance * AU_SCALE;
            const z = Math.sin(asteroid.angle) * asteroid.distance * AU_SCALE;
            asteroid.mesh.position.set(x, 0, z);
            
            // Update label if exists
            if (window.planetLabels) {
                window.planetLabels.updateLabel(asteroid.data.name, asteroid.mesh.position);
            }
        }
    }
    
    setVisibility(visible) {
        this.asteroidGroup.visible = visible;
        console.log(`AsteroidBelt: Visibility set to ${visible}. Asteroids: ${this.asteroidOrbits ? this.asteroidOrbits.length : 0}, Major asteroids: ${this.asteroids.length}`);
    }
    
    // Performance method to update camera position in shader
    updateCameraPosition(cameraPosition) {
        if (this.asteroidPoints && this.asteroidPoints.material) {
            this.asteroidPoints.material.uniforms.cameraPosition.value.copy(cameraPosition);
        }
    }
    
    // Performance method to adjust LOD distances based on performance
    adjustLODForPerformance(frameRate) {
        if (frameRate < 30) {
            // Reduce quality for better performance
            this.lodDistances.near = 300;
            this.lodDistances.medium = 1000;
            this.lodDistances.far = 2000;
            this.updateInterval = 32; // 30fps
            this.batchSize = 50;
        } else if (frameRate > 55) {
            // Increase quality when performance allows
            this.lodDistances.near = 500;
            this.lodDistances.medium = 1500;
            this.lodDistances.far = 3000;
            this.updateInterval = 16; // 60fps
            this.batchSize = 100;
        }
        
        // Update shader uniforms
        if (this.asteroidPoints && this.asteroidPoints.material) {
            this.asteroidPoints.material.uniforms.lodDistances.value.set(
                this.lodDistances.near,
                this.lodDistances.medium,
                this.lodDistances.far
            );
        }
    }
    
    // Collision detection for spacecraft
    checkCollision(position, radius) {
        for (const asteroid of this.asteroids) {
            const distance = position.distanceTo(asteroid.mesh.position);
            const asteroidRadius = asteroid.mesh.geometry.parameters?.radius || 0.5;
            if (distance < radius + asteroidRadius) {
                return asteroid.data;
            }
        }
        return null;
    }
}