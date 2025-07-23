// Enhanced sun effects with volumetric lighting
class SunEffects {
    constructor(scene, sunPosition, sunSize) {
        this.scene = scene;
        this.sunPosition = sunPosition;
        this.sunSize = sunSize;
        
        this.createVolumetricLight();
        this.createLensFlare();
        this.createSolarWind();
    }
    
    createVolumetricLight() {
        // Create volumetric light rays
        const rayCount = 12;
        const rayGroup = new THREE.Group();
        
        for (let i = 0; i < rayCount; i++) {
            const angle = (i / rayCount) * Math.PI * 2;
            
            const rayGeometry = new THREE.ConeGeometry(this.sunSize * 0.5, this.sunSize * 50, 4, 1, true);
            const rayMaterial = new THREE.ShaderMaterial({
                uniforms: {
                    time: { value: 0 },
                    color: { value: new THREE.Color(1, 0.9, 0.7) },
                    opacity: { value: 0.1 }
                },
                vertexShader: `
                    varying vec3 vPosition;
                    varying float vDistance;
                    void main() {
                        vPosition = position;
                        vDistance = length(position);
                        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                    }
                `,
                fragmentShader: `
                    uniform float time;
                    uniform vec3 color;
                    uniform float opacity;
                    varying vec3 vPosition;
                    varying float vDistance;
                    
                    void main() {
                        float fade = 1.0 - (vDistance / 50.0);
                        float pulse = sin(time * 2.0 + vDistance * 0.1) * 0.1 + 0.9;
                        
                        gl_FragColor = vec4(color, opacity * fade * pulse);
                    }
                `,
                transparent: true,
                blending: THREE.AdditiveBlending,
                side: THREE.DoubleSide,
                depthWrite: false
            });
            
            const ray = new THREE.Mesh(rayGeometry, rayMaterial);
            ray.rotation.z = angle;
            ray.rotation.x = Math.PI / 2;
            rayGroup.add(ray);
        }
        
        rayGroup.position.copy(this.sunPosition);
        this.scene.add(rayGroup);
        this.volumetricLight = rayGroup;
    }
    
    createLensFlare() {
        // Create lens flare effect
        const flareTexture = this.createFlareTexture();
        
        const flareMaterial = new THREE.SpriteMaterial({
            map: flareTexture,
            blending: THREE.AdditiveBlending,
            color: 0xffeeaa,
            opacity: 0.6
        });
        
        const flareSprite = new THREE.Sprite(flareMaterial);
        flareSprite.scale.set(this.sunSize * 5, this.sunSize * 5, 1);
        flareSprite.position.copy(this.sunPosition);
        
        this.scene.add(flareSprite);
        this.lensFlare = flareSprite;
    }
    
    createFlareTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        
        const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
        gradient.addColorStop(0.2, 'rgba(255, 245, 200, 0.8)');
        gradient.addColorStop(0.4, 'rgba(255, 220, 100, 0.6)');
        gradient.addColorStop(0.7, 'rgba(255, 180, 50, 0.3)');
        gradient.addColorStop(1, 'rgba(255, 180, 50, 0)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 256, 256);
        
        return new THREE.CanvasTexture(canvas);
    }
    
    createSolarWind() {
        // Create particle system for solar wind
        const particleCount = 1000;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const velocities = new Float32Array(particleCount * 3);
        
        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * this.sunSize;
            
            positions[i3] = Math.cos(angle) * radius;
            positions[i3 + 1] = Math.sin(angle) * radius;
            positions[i3 + 2] = 0;
            
            velocities[i3] = Math.cos(angle) * 0.5;
            velocities[i3 + 1] = Math.sin(angle) * 0.5;
            velocities[i3 + 2] = 0;
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
        
        const material = new THREE.PointsMaterial({
            color: 0xffaa00,
            size: 2,
            transparent: true,
            opacity: 0.4,
            blending: THREE.AdditiveBlending
        });
        
        const particles = new THREE.Points(geometry, material);
        particles.position.copy(this.sunPosition);
        
        this.scene.add(particles);
        this.solarWind = particles;
    }
    
    update(time) {
        // Update volumetric light
        if (this.volumetricLight) {
            this.volumetricLight.rotation.y = time * 0.05;
            this.volumetricLight.children.forEach((ray, i) => {
                if (ray.material.uniforms) {
                    ray.material.uniforms.time.value = time;
                }
            });
        }
        
        // Update lens flare
        if (this.lensFlare) {
            const scale = 1 + Math.sin(time * 3) * 0.1;
            this.lensFlare.scale.set(
                this.sunSize * 5 * scale,
                this.sunSize * 5 * scale,
                1
            );
        }
        
        // Update solar wind
        if (this.solarWind) {
            const positions = this.solarWind.geometry.attributes.position.array;
            const velocities = this.solarWind.geometry.attributes.velocity.array;
            
            for (let i = 0; i < positions.length; i += 3) {
                positions[i] += velocities[i] * 0.5;
                positions[i + 1] += velocities[i + 1] * 0.5;
                
                const distance = Math.sqrt(positions[i] * positions[i] + positions[i + 1] * positions[i + 1]);
                if (distance > this.sunSize * 10) {
                    const angle = Math.random() * Math.PI * 2;
                    const radius = Math.random() * this.sunSize;
                    
                    positions[i] = Math.cos(angle) * radius;
                    positions[i + 1] = Math.sin(angle) * radius;
                }
            }
            
            this.solarWind.geometry.attributes.position.needsUpdate = true;
        }
    }
    
    updatePosition(newPosition) {
        this.sunPosition = newPosition;
        if (this.volumetricLight) this.volumetricLight.position.copy(newPosition);
        if (this.lensFlare) this.lensFlare.position.copy(newPosition);
        if (this.solarWind) this.solarWind.position.copy(newPosition);
    }
}