// Orbit trails visualization
class OrbitTrails {
    constructor(scene) {
        this.scene = scene;
        this.trails = {};
        this.maxPoints = 500;
    }

    createTrail(name, color = 0x444444) {
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(this.maxPoints * 3);
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const material = new THREE.LineBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.4,
            blending: THREE.AdditiveBlending
        });
        
        const line = new THREE.Line(geometry, material);
        line.frustumCulled = false;
        
        this.scene.add(line);
        
        this.trails[name] = {
            line: line,
            positions: positions,
            currentIndex: 0,
            geometry: geometry
        };
        
        return line;
    }

    updateTrail(name, position) {
        const trail = this.trails[name];
        if (!trail) return;
        
        const index = trail.currentIndex * 3;
        trail.positions[index] = position.x;
        trail.positions[index + 1] = position.y;
        trail.positions[index + 2] = position.z;
        
        trail.currentIndex = (trail.currentIndex + 1) % this.maxPoints;
        
        // Update geometry
        trail.geometry.attributes.position.needsUpdate = true;
        trail.geometry.setDrawRange(0, Math.min(trail.currentIndex, this.maxPoints));
    }

    clearTrail(name) {
        const trail = this.trails[name];
        if (!trail) return;
        
        trail.positions.fill(0);
        trail.currentIndex = 0;
        trail.geometry.attributes.position.needsUpdate = true;
    }

    setTrailVisibility(name, visible) {
        const trail = this.trails[name];
        if (trail) {
            trail.line.visible = visible;
        }
    }

    removeTrail(name) {
        const trail = this.trails[name];
        if (trail) {
            this.scene.remove(trail.line);
            delete this.trails[name];
        }
    }
}