// Advanced atmospheric scattering system
class AtmosphereSystem {
    constructor() {
        this.atmospheres = {};
        
        // Atmospheric properties for planets
        this.atmosphereData = {
            earth: {
                thickness: 1.025, // Relative to planet radius
                color: new THREE.Color(0.3, 0.5, 1.0),
                density: 1.0,
                scattering: new THREE.Vector3(5.8e-3, 13.5e-3, 33.1e-3), // Rayleigh
                hasCloudLayer: true
            },
            venus: {
                thickness: 1.05,
                color: new THREE.Color(0.9, 0.8, 0.5),
                density: 90.0,
                scattering: new THREE.Vector3(8.0e-3, 12.0e-3, 2.0e-3),
                hasCloudLayer: true
            },
            mars: {
                thickness: 1.006,
                color: new THREE.Color(0.8, 0.6, 0.4),
                density: 0.01,
                scattering: new THREE.Vector3(19.0e-3, 7.0e-3, 2.0e-3),
                hasCloudLayer: false
            },
            jupiter: {
                thickness: 1.1,
                color: new THREE.Color(0.8, 0.7, 0.6),
                density: 1.3,
                scattering: new THREE.Vector3(12.0e-3, 10.0e-3, 8.0e-3),
                hasCloudLayer: true
            },
            saturn: {
                thickness: 1.08,
                color: new THREE.Color(0.9, 0.8, 0.6),
                density: 0.7,
                scattering: new THREE.Vector3(15.0e-3, 12.0e-3, 9.0e-3),
                hasCloudLayer: true
            },
            uranus: {
                thickness: 1.04,
                color: new THREE.Color(0.4, 0.7, 0.8),
                density: 0.42,
                scattering: new THREE.Vector3(4.0e-3, 20.0e-3, 25.0e-3),
                hasCloudLayer: true
            },
            neptune: {
                thickness: 1.04,
                color: new THREE.Color(0.2, 0.3, 0.9),
                density: 0.45,
                scattering: new THREE.Vector3(2.0e-3, 8.0e-3, 30.0e-3),
                hasCloudLayer: true
            },
            titan: {
                thickness: 1.2,
                color: new THREE.Color(0.9, 0.7, 0.4),
                density: 1.45,
                scattering: new THREE.Vector3(20.0e-3, 15.0e-3, 5.0e-3),
                hasCloudLayer: true
            }
        };
    }
    
    createAtmosphere(planetMesh, planetName, planetRadius) {
        try {
            console.log('AtmosphereSystem: Creating atmosphere for', planetName, 'with radius', planetRadius);
            
            const data = this.atmosphereData[planetName];
            if (!data) {
                console.warn('AtmosphereSystem: No atmosphere data found for', planetName);
                return null;
            }
            
            console.log('AtmosphereSystem: Using atmosphere data:', data);
        
        // Create atmosphere geometry
        const atmosphere = new THREE.Group();
        
        // Main atmosphere with scattering shader
        const atmosphereGeometry = new THREE.SphereGeometry(
            planetRadius * data.thickness,
            64,
            64
        );
        
        const atmosphereShader = new THREE.ShaderMaterial({
            uniforms: {
                lightDirection: { value: new THREE.Vector3(1, 0, 0) },
                planetRadius: { value: planetRadius },
                atmosphereRadius: { value: planetRadius * data.thickness },
                atmosphereColor: { value: data.color },
                scatteringCoefficients: { value: data.scattering },
                density: { value: data.density },
                cameraPosition: { value: new THREE.Vector3() },
                time: { value: 0 }
            },
            vertexShader: `
                varying vec3 vWorldPosition;
                varying vec3 vNormal;
                varying vec2 vUv;
                varying float vDepth;
                
                void main() {
                    vUv = uv;
                    vNormal = normalize(normalMatrix * normal);
                    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
                    vWorldPosition = worldPosition.xyz;
                    
                    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                    vDepth = -mvPosition.z;
                    
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                uniform vec3 lightDirection;
                uniform float planetRadius;
                uniform float atmosphereRadius;
                uniform vec3 atmosphereColor;
                uniform vec3 scatteringCoefficients;
                uniform float density;
                uniform vec3 cameraPosition;
                uniform float time;
                
                varying vec3 vWorldPosition;
                varying vec3 vNormal;
                varying vec2 vUv;
                varying float vDepth;
                
                const int numSamples = 16;
                const float PI = 3.14159265359;
                
                // Rayleigh phase function
                float rayleighPhase(float cosTheta) {
                    return 3.0 / (16.0 * PI) * (1.0 + cosTheta * cosTheta);
                }
                
                // Mie phase function (simplified Henyey-Greenstein)
                float miePhase(float cosTheta, float g) {
                    float g2 = g * g;
                    float num = 1.0 - g2;
                    float denom = pow(1.0 + g2 - 2.0 * g * cosTheta, 1.5);
                    return num / (4.0 * PI * denom);
                }
                
                // Calculate optical depth
                float opticalDepth(vec3 rayOrigin, vec3 rayDirection, float rayLength) {
                    float stepSize = rayLength / float(numSamples);
                    float depth = 0.0;
                    
                    for (int i = 0; i < numSamples; i++) {
                        vec3 samplePos = rayOrigin + rayDirection * (float(i) + 0.5) * stepSize;
                        float height = length(samplePos) - planetRadius;
                        float relativeHeight = height / (atmosphereRadius - planetRadius);
                        
                        // Exponential density falloff
                        float localDensity = exp(-relativeHeight * density * 8.0);
                        depth += localDensity * stepSize;
                    }
                    
                    return depth;
                }
                
                void main() {
                    vec3 rayOrigin = cameraPosition;
                    vec3 rayDirection = normalize(vWorldPosition - cameraPosition);
                    
                    // Calculate intersection with atmosphere
                    float a = dot(rayDirection, rayDirection);
                    float b = 2.0 * dot(rayOrigin, rayDirection);
                    float c = dot(rayOrigin, rayOrigin) - atmosphereRadius * atmosphereRadius;
                    float discriminant = b * b - 4.0 * a * c;
                    
                    if (discriminant < 0.0) discard;
                    
                    float t1 = (-b - sqrt(discriminant)) / (2.0 * a);
                    float t2 = (-b + sqrt(discriminant)) / (2.0 * a);
                    
                    // Ray length through atmosphere
                    float rayLength = t2 - max(t1, 0.0);
                    
                    // Light scattering calculation
                    vec3 inScattering = vec3(0.0);
                    float stepSize = rayLength / float(numSamples);
                    
                    for (int i = 0; i < numSamples; i++) {
                        vec3 samplePos = rayOrigin + rayDirection * (t1 + (float(i) + 0.5) * stepSize);
                        float height = length(samplePos) - planetRadius;
                        float relativeHeight = height / (atmosphereRadius - planetRadius);
                        
                        // Height-based density
                        float localDensity = exp(-relativeHeight * density * 8.0);
                        
                        // Calculate scattering
                        float lightOpticalDepth = opticalDepth(samplePos, lightDirection, atmosphereRadius * 2.0);
                        float viewOpticalDepth = opticalDepth(samplePos, -rayDirection, stepSize * float(i));
                        
                        vec3 transmittance = exp(-(lightOpticalDepth + viewOpticalDepth) * scatteringCoefficients);
                        
                        // Add turbulence for dynamic atmosphere
                        float turbulence = sin(relativeHeight * 10.0 + time * 0.5) * 0.1;
                        localDensity *= (1.0 + turbulence);
                        
                        inScattering += transmittance * localDensity * stepSize;
                    }
                    
                    // Apply phase functions
                    float cosTheta = dot(rayDirection, lightDirection);
                    float rayleigh = rayleighPhase(cosTheta);
                    float mie = miePhase(cosTheta, 0.76);
                    
                    vec3 scatteredLight = inScattering * scatteringCoefficients * (rayleigh + mie * 0.1);
                    vec3 finalColor = scatteredLight * atmosphereColor;
                    
                    // Edge glow effect
                    float rim = 1.0 - abs(dot(vNormal, normalize(cameraPosition - vWorldPosition)));
                    rim = pow(rim, 2.0);
                    finalColor += atmosphereColor * rim * 0.5;
                    
                    // Distance fade
                    float distanceFade = exp(-vDepth * 0.00001);
                    
                    // Final alpha based on scattering density and rim
                    float alpha = clamp(length(scatteredLight) * 5.0 + rim * 0.3, 0.0, 1.0) * distanceFade;
                    
                    gl_FragColor = vec4(finalColor, alpha);
                }
            `,
            side: THREE.BackSide,
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });
        
        const atmosphereMesh = new THREE.Mesh(atmosphereGeometry, atmosphereShader);
        atmosphere.add(atmosphereMesh);
        
        // Add cloud layer if applicable
        if (data.hasCloudLayer) {
            const cloudGeometry = new THREE.SphereGeometry(
                planetRadius * (1 + (data.thickness - 1) * 0.3),
                32,
                32
            );
            
            const cloudMaterial = new THREE.ShaderMaterial({
                uniforms: {
                    time: { value: 0 },
                    cloudColor: { value: new THREE.Color(1, 1, 1) },
                    opacity: { value: 0.3 }
                },
                vertexShader: `
                    varying vec2 vUv;
                    varying vec3 vNormal;
                    
                    void main() {
                        vUv = uv;
                        vNormal = normalize(normalMatrix * normal);
                        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                    }
                `,
                fragmentShader: `
                    uniform float time;
                    uniform vec3 cloudColor;
                    uniform float opacity;
                    
                    varying vec2 vUv;
                    varying vec3 vNormal;
                    
                    // Simple noise function
                    float noise(vec2 uv) {
                        return fract(sin(dot(uv, vec2(12.9898, 78.233))) * 43758.5453);
                    }
                    
                    void main() {
                        // Animated cloud pattern
                        vec2 animatedUv = vUv + vec2(time * 0.01, time * 0.005);
                        float cloudPattern = noise(animatedUv * 10.0) * 0.5 + 0.5;
                        cloudPattern *= noise(animatedUv * 20.0) * 0.5 + 0.5;
                        cloudPattern = smoothstep(0.3, 0.7, cloudPattern);
                        
                        // Edge fade
                        float rim = 1.0 - abs(dot(vNormal, vec3(0, 0, 1)));
                        rim = pow(rim, 3.0);
                        
                        gl_FragColor = vec4(cloudColor, cloudPattern * opacity * (1.0 - rim));
                    }
                `,
                transparent: true,
                depthWrite: false,
                side: THREE.DoubleSide
            });
            
            const cloudMesh = new THREE.Mesh(cloudGeometry, cloudMaterial);
            atmosphere.add(cloudMesh);
            
            // Store reference for updates
            atmosphere.userData.cloudMesh = cloudMesh;
        }
        
        // Store atmosphere reference
        this.atmospheres[planetName] = {
            group: atmosphere,
            shader: atmosphereShader,
            data: data
        };
        
            // Mark as atmosphere for visibility toggling
            atmosphere.userData.isAtmosphere = true;
            
            console.log('AtmosphereSystem: Successfully created atmosphere for', planetName);
            return atmosphere;
            
        } catch (error) {
            console.error('AtmosphereSystem: Error creating atmosphere for', planetName, ':', error);
            return null;
        }
    }
    
    update(deltaTime, camera, sunPosition) {
        try {
            for (const [name, atmosphere] of Object.entries(this.atmospheres)) {
                if (!atmosphere || !atmosphere.shader) {
                    console.warn('AtmosphereSystem: Invalid atmosphere data for', name);
                    continue;
                }
                
                const shader = atmosphere.shader;
            
            // Update uniforms
            shader.uniforms.time.value += deltaTime;
            shader.uniforms.cameraPosition.value.copy(camera.position);
            
            // Update light direction based on sun position
            const planetPos = atmosphere.group.position;
            const lightDir = new THREE.Vector3()
                .subVectors(sunPosition, planetPos)
                .normalize();
            shader.uniforms.lightDirection.value.copy(lightDir);
            
            // Update cloud layer if exists
            if (atmosphere.group.userData.cloudMesh) {
                const cloudMaterial = atmosphere.group.userData.cloudMesh.material;
                cloudMaterial.uniforms.time.value += deltaTime;
                
                // Rotate clouds slowly
                atmosphere.group.userData.cloudMesh.rotation.y += deltaTime * 0.01;
            }
            }
        } catch (error) {
            console.error('AtmosphereSystem: Error during update:', error);
        }
    }
    
    setQuality(quality) {
        // Adjust shader complexity based on quality setting
        const samples = quality === 'high' ? 16 : 8;
        
        for (const atmosphere of Object.values(this.atmospheres)) {
            // Would need to recompile shaders with different sample counts
            // For now, just adjust opacity
            atmosphere.shader.uniforms.density.value = 
                atmosphere.data.density * (quality === 'high' ? 1 : 0.7);
        }
    }
}