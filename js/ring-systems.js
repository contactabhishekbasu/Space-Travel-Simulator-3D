// Enhanced Ring Systems - Realistic ring systems for gas giants
class RingSystems {
    constructor(scene) {
        this.scene = scene;
        this.ringMeshes = {};
        
        // Ring system data
        this.ringData = {
            saturn: {
                name: "Saturn's Rings",
                rings: [
                    { name: 'D Ring', innerRadius: 1.11, outerRadius: 1.236, opacity: 0.1, color: 0x8B7355 },
                    { name: 'C Ring', innerRadius: 1.236, outerRadius: 1.525, opacity: 0.3, color: 0x8B7355 },
                    { name: 'B Ring', innerRadius: 1.525, outerRadius: 1.95, opacity: 0.8, color: 0xD2B48C },
                    { name: 'Cassini Division', innerRadius: 1.95, outerRadius: 1.99, opacity: 0.05, color: 0x444444 },
                    { name: 'A Ring', innerRadius: 1.99, outerRadius: 2.27, opacity: 0.6, color: 0xC8B99C },
                    { name: 'Roche Division', innerRadius: 2.27, outerRadius: 2.29, opacity: 0.02, color: 0x333333 },
                    { name: 'F Ring', innerRadius: 2.32, outerRadius: 2.324, opacity: 0.4, color: 0xF4A460 },
                    { name: 'E Ring', innerRadius: 3.0, outerRadius: 8.0, opacity: 0.05, color: 0x696969 }
                ],
                inclination: 0, // Saturn's rings are in equatorial plane
                thickness: 0.02
            },
            jupiter: {
                name: "Jupiter's Rings",
                rings: [
                    { name: 'Halo Ring', innerRadius: 1.4, outerRadius: 1.71, opacity: 0.05, color: 0x8B4513 },
                    { name: 'Main Ring', innerRadius: 1.71, outerRadius: 1.806, opacity: 0.1, color: 0xA0522D },
                    { name: 'Amalthea Ring', innerRadius: 1.806, outerRadius: 2.54, opacity: 0.03, color: 0x8B4513 },
                    { name: 'Thebe Ring', innerRadius: 2.54, outerRadius: 3.7, opacity: 0.02, color: 0x696969 }
                ],
                inclination: 0,
                thickness: 0.001
            },
            uranus: {
                name: "Uranus's Rings",
                rings: [
                    { name: 'ζ (Zeta) Ring', innerRadius: 1.95, outerRadius: 1.963, opacity: 0.3, color: 0x2F4F4F },
                    { name: '6 Ring', innerRadius: 2.01, outerRadius: 2.025, opacity: 0.4, color: 0x2F4F4F },
                    { name: '5 Ring', innerRadius: 2.03, outerRadius: 2.04, opacity: 0.5, color: 0x2F4F4F },
                    { name: '4 Ring', innerRadius: 2.04, outerRadius: 2.045, opacity: 0.6, color: 0x2F4F4F },
                    { name: 'α (Alpha) Ring', innerRadius: 2.06, outerRadius: 2.067, opacity: 0.7, color: 0x696969 },
                    { name: 'β (Beta) Ring', innerRadius: 2.07, outerRadius: 2.075, opacity: 0.6, color: 0x696969 },
                    { name: 'η (Eta) Ring', innerRadius: 2.085, outerRadius: 2.09, opacity: 0.4, color: 0x2F4F4F },
                    { name: 'γ (Gamma) Ring', innerRadius: 2.09, outerRadius: 2.095, opacity: 0.5, color: 0x2F4F4F },
                    { name: 'δ (Delta) Ring', innerRadius: 2.095, outerRadius: 2.1, opacity: 0.4, color: 0x2F4F4F },
                    { name: 'λ (Lambda) Ring', innerRadius: 2.1, outerRadius: 2.105, opacity: 0.3, color: 0x2F4F4F },
                    { name: 'ε (Epsilon) Ring', innerRadius: 2.12, outerRadius: 2.14, opacity: 0.8, color: 0x696969 },
                    { name: 'ν (Nu) Ring', innerRadius: 2.16, outerRadius: 2.175, opacity: 0.2, color: 0x2F4F4F },
                    { name: 'μ (Mu) Ring', innerRadius: 2.175, outerRadius: 2.19, opacity: 0.2, color: 0x2F4F4F }
                ],
                inclination: 97.77, // Uranus's extreme tilt
                thickness: 0.001
            },
            neptune: {
                name: "Neptune's Rings",
                rings: [
                    { name: 'Galle Ring', innerRadius: 1.69, outerRadius: 1.75, opacity: 0.1, color: 0x191970 },
                    { name: 'Le Verrier Ring', innerRadius: 2.15, outerRadius: 2.18, opacity: 0.2, color: 0x4169E1 },
                    { name: 'Lassell Ring', innerRadius: 2.15, outerRadius: 2.4, opacity: 0.05, color: 0x191970 },
                    { name: 'Arago Ring', innerRadius: 2.25, outerRadius: 2.3, opacity: 0.03, color: 0x191970 },
                    { name: 'Adams Ring', innerRadius: 2.4, outerRadius: 2.45, opacity: 0.3, color: 0x4169E1 }
                ],
                inclination: 28.32,
                thickness: 0.001
            }
        };
        
        console.log('RingSystems: System initialized');
    }
    
    createRingSystem(planetName, planetMesh, planetSize) {
        const ringSystemData = this.ringData[planetName];
        if (!ringSystemData) {
            console.log(`RingSystems: No ring data for ${planetName}`);
            return null;
        }
        
        console.log(`RingSystems: Creating ring system for ${planetName}`);
        
        const ringGroup = new THREE.Group();
        ringGroup.name = `${planetName}_rings`;
        
        // Create each ring
        ringSystemData.rings.forEach((ringData, index) => {
            const ring = this.createIndividualRing(ringData, planetSize, ringSystemData.thickness);
            if (ring) {
                ring.name = `${planetName}_${ringData.name.replace(/[^a-zA-Z0-9]/g, '_')}`;
                ringGroup.add(ring);
            }
        });
        
        // Apply inclination
        if (ringSystemData.inclination) {
            ringGroup.rotation.x = ringSystemData.inclination * Math.PI / 180;
        }
        
        // Position relative to planet
        ringGroup.position.copy(planetMesh.position);
        
        // Add to scene and store reference
        this.scene.add(ringGroup);
        this.ringMeshes[planetName] = ringGroup;
        
        console.log(`RingSystems: Created ${ringSystemData.rings.length} rings for ${planetName}`);
        return ringGroup;
    }
    
    createIndividualRing(ringData, planetSize, thickness) {
        const innerRadius = ringData.innerRadius * planetSize;
        const outerRadius = ringData.outerRadius * planetSize;
        
        // Create ring geometry
        const geometry = new THREE.RingGeometry(
            innerRadius,
            outerRadius,
            64, // theta segments for smooth circles
            8   // phi segments for ring thickness
        );
        
        // Create procedural ring texture
        const texture = this.createRingTexture(ringData, innerRadius, outerRadius);
        
        // Create ring material
        const material = new THREE.MeshLambertMaterial({
            map: texture,
            color: ringData.color,
            transparent: true,
            opacity: ringData.opacity,
            side: THREE.DoubleSide,
            alphaTest: 0.01,
            depthWrite: false // Important for proper transparency sorting
        });
        
        // Create ring mesh
        const ring = new THREE.Mesh(geometry, material);
        ring.rotation.x = Math.PI / 2; // Rotate to horizontal
        
        // Add ring particles for enhanced realism
        if (ringData.opacity > 0.2) {
            const particles = this.createRingParticles(innerRadius, outerRadius, ringData.color);
            if (particles) {
                ring.add(particles);
            }
        }
        
        return ring;
    }
    
    createRingTexture(ringData, innerRadius, outerRadius) {
        const size = 512;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        
        // Create radial gradient for ring structure
        const centerX = size / 2;
        const centerY = size / 2;
        const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, size / 2);
        
        // Add ring structure variations
        const ringVariations = Math.floor(Math.random() * 20 + 10);
        for (let i = 0; i < ringVariations; i++) {
            const position = Math.random();
            const alpha = (Math.random() * 0.8 + 0.2) * ringData.opacity;
            const color = this.hexToRgb(ringData.color);
            gradient.addColorStop(position, `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`);
        }
        
        // Fill with gradient
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, size, size);
        
        // Add noise for realistic texture
        this.addNoiseToTexture(ctx, size, ringData.opacity);
        
        // Add ring gaps and divisions
        this.addRingDivisions(ctx, size, centerX, centerY);
        
        // Create texture from canvas
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        texture.generateMipmaps = true;
        texture.minFilter = THREE.LinearMipmapLinearFilter;
        texture.magFilter = THREE.LinearFilter;
        
        return texture;
    }
    
    addNoiseToTexture(ctx, size, baseOpacity) {
        const imageData = ctx.getImageData(0, 0, size, size);
        const data = imageData.data;
        
        for (let i = 0; i < data.length; i += 4) {
            // Add subtle noise to RGB channels
            const noise = (Math.random() - 0.5) * 50;
            data[i] = Math.max(0, Math.min(255, data[i] + noise));     // R
            data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise)); // G
            data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise)); // B
            
            // Add density variations to alpha
            const densityVariation = Math.random() * 0.5 + 0.5;
            data[i + 3] = Math.min(255, data[i + 3] * densityVariation);
        }
        
        ctx.putImageData(imageData, 0, 0);
    }
    
    addRingDivisions(ctx, size, centerX, centerY) {
        // Add random ring divisions (gaps)
        const divisions = Math.floor(Math.random() * 5 + 2);
        
        for (let i = 0; i < divisions; i++) {
            const radius = (Math.random() * 0.7 + 0.15) * size / 2;
            const width = Math.random() * 10 + 2;
            
            ctx.globalCompositeOperation = 'destination-out';
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            ctx.lineWidth = width;
            ctx.stroke();
            ctx.globalCompositeOperation = 'source-over';
        }
    }
    
    createRingParticles(innerRadius, outerRadius, color) {
        const particleCount = Math.min(1000, Math.floor((outerRadius - innerRadius) * 100));
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);
        
        const colorObj = new THREE.Color(color);
        
        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            
            // Random position in ring
            const angle = Math.random() * Math.PI * 2;
            const radius = innerRadius + Math.random() * (outerRadius - innerRadius);
            
            positions[i3] = Math.cos(angle) * radius;
            positions[i3 + 1] = (Math.random() - 0.5) * 0.1; // Slight vertical spread
            positions[i3 + 2] = Math.sin(angle) * radius;
            
            // Color with variations
            colors[i3] = colorObj.r * (0.8 + Math.random() * 0.4);
            colors[i3 + 1] = colorObj.g * (0.8 + Math.random() * 0.4);
            colors[i3 + 2] = colorObj.b * (0.8 + Math.random() * 0.4);
            
            // Size variations
            sizes[i] = Math.random() * 0.5 + 0.1;
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        
        const material = new THREE.PointsMaterial({
            size: 0.1,
            transparent: true,
            opacity: 0.3,
            vertexColors: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        
        return new THREE.Points(geometry, material);
    }
    
    updateRings(planetName, planetMesh) {
        const ringGroup = this.ringMeshes[planetName];
        if (ringGroup && planetMesh) {
            // Update ring position to follow planet
            ringGroup.position.copy(planetMesh.position);
            
            // Subtle ring rotation for Saturn
            if (planetName === 'saturn') {
                ringGroup.rotation.z += 0.0001;
            }
        }
    }
    
    updateAllRings(bodies) {
        Object.keys(this.ringMeshes).forEach(planetName => {
            const planetMesh = bodies[planetName];
            if (planetMesh) {
                this.updateRings(planetName, planetMesh);
            }
        });
    }
    
    setRingVisibility(planetName, visible) {
        const ringGroup = this.ringMeshes[planetName];
        if (ringGroup) {
            ringGroup.visible = visible;
            console.log(`RingSystems: ${planetName} rings ${visible ? 'shown' : 'hidden'}`);
        }
    }
    
    setAllRingsVisibility(visible) {
        Object.keys(this.ringMeshes).forEach(planetName => {
            this.setRingVisibility(planetName, visible);
        });
    }
    
    getRingInfo(planetName) {
        const ringSystemData = this.ringData[planetName];
        if (!ringSystemData) return null;
        
        return {
            name: ringSystemData.name,
            ringCount: ringSystemData.rings.length,
            rings: ringSystemData.rings.map(ring => ({
                name: ring.name,
                innerRadius: ring.innerRadius,
                outerRadius: ring.outerRadius,
                opacity: ring.opacity
            }))
        };
    }
    
    // Utility functions
    hexToRgb(hex) {
        const result = /^0x?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.toString(16).padStart(6, '0'));
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 255, g: 255, b: 255 };
    }
    
    // Clean up resources
    dispose() {
        Object.values(this.ringMeshes).forEach(ringGroup => {
            this.scene.remove(ringGroup);
            ringGroup.traverse(child => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) {
                    if (child.material.map) child.material.map.dispose();
                    child.material.dispose();
                }
            });
        });
        this.ringMeshes = {};
        console.log('RingSystems: Resources disposed');
    }
}

// Export for global access
if (typeof window !== 'undefined') {
    window.RingSystems = RingSystems;
}