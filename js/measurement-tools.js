// Measurement Tools - Distance, angle, and size measurements in space
class MeasurementTools {
    constructor(scene, camera, renderer) {
        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;
        this.isEnabled = false;
        this.currentTool = 'distance'; // 'distance', 'angle', 'size'
        
        // Measurement state
        this.measurements = [];
        this.currentMeasurement = null;
        this.measurementPoints = [];
        
        // Visual elements
        this.measurementGroup = new THREE.Group();
        this.scene.add(this.measurementGroup);
        
        // UI elements
        this.measurementPanel = null;
        this.measurementList = null;
        
        // Constants
        this.AU_TO_KM = 149597870.7;
        this.AU_TO_MILES = 92955807.3;
        
        this.createUI();
        this.setupEventListeners();
        
        console.log('MeasurementTools: System initialized');
    }
    
    createUI() {
        // Create measurement panel
        const panel = document.createElement('div');
        panel.id = 'measurement-panel';
        panel.style.cssText = `
            position: fixed;
            top: 50%;
            right: 20px;
            transform: translateY(-50%);
            background: linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.9));
            border: 1px solid rgba(100, 200, 255, 0.3);
            border-radius: 15px;
            padding: 20px;
            min-width: 300px;
            max-height: 60vh;
            overflow-y: auto;
            backdrop-filter: blur(15px);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5), 0 0 40px rgba(99, 102, 241, 0.1);
            z-index: 900;
            display: none;
            font-family: 'Courier New', monospace;
        `;
        
        panel.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: between; margin-bottom: 15px;">
                <h3 style="margin: 0; color: #60a5fa; font-size: 16px; text-shadow: 0 0 10px rgba(96, 165, 250, 0.3);">
                    📏 MEASUREMENTS
                </h3>
                <button id="measurement-close" style="
                    background: none;
                    border: none;
                    color: #94a3b8;
                    font-size: 18px;
                    cursor: pointer;
                    margin-left: auto;
                    padding: 4px;
                ">✕</button>
            </div>
            
            <div id="measurement-tools" style="margin-bottom: 15px;">
                <div style="color: #94a3b8; font-size: 12px; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 1px;">Tools:</div>
                <div style="display: flex; gap: 8px; margin-bottom: 12px;">
                    <button id="tool-distance" class="measurement-tool-btn active" data-tool="distance">Distance</button>
                    <button id="tool-angle" class="measurement-tool-btn" data-tool="angle">Angle</button>
                    <button id="tool-size" class="measurement-tool-btn" data-tool="size">Size</button>
                </div>
                <div id="measurement-instructions" style="
                    background: rgba(99, 102, 241, 0.1);
                    border: 1px solid rgba(99, 102, 241, 0.3);
                    border-radius: 8px;
                    padding: 10px;
                    font-size: 11px;
                    color: #cbd5e1;
                    line-height: 1.4;
                ">
                    Click on two celestial objects to measure the distance between them.
                </div>
            </div>
            
            <div style="margin-bottom: 15px;">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
                    <span style="color: #94a3b8; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Active Measurements:</span>
                    <button id="clear-all-measurements" style="
                        background: rgba(239, 68, 68, 0.2);
                        border: 1px solid rgba(239, 68, 68, 0.4);
                        color: #f87171;
                        padding: 4px 8px;
                        border-radius: 6px;
                        font-size: 10px;
                        cursor: pointer;
                    ">Clear All</button>
                </div>
                <div id="measurement-list" style="
                    max-height: 200px;
                    overflow-y: auto;
                "></div>
            </div>
            
            <div id="measurement-units" style="margin-top: 15px; padding-top: 15px; border-top: 1px solid rgba(100, 116, 139, 0.3);">
                <div style="color: #94a3b8; font-size: 12px; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 1px;">Units:</div>
                <div style="display: flex; gap: 6px;">
                    <button id="unit-au" class="measurement-unit-btn active" data-unit="au">AU</button>
                    <button id="unit-km" class="measurement-unit-btn" data-unit="km">KM</button>
                    <button id="unit-miles" class="measurement-unit-btn" data-unit="miles">Miles</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(panel);
        this.measurementPanel = panel;
        this.measurementList = document.getElementById('measurement-list');
        
        // Add CSS styles for buttons
        const style = document.createElement('style');
        style.textContent = `
            .measurement-tool-btn, .measurement-unit-btn {
                background: linear-gradient(135deg, rgba(30, 41, 59, 0.8), rgba(51, 65, 85, 0.8));
                border: 1px solid rgba(99, 102, 241, 0.3);
                color: #94a3b8;
                padding: 6px 12px;
                border-radius: 8px;
                cursor: pointer;
                font-size: 11px;
                font-weight: 600;
                transition: all 0.3s;
                text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
            }
            
            .measurement-tool-btn:hover, .measurement-unit-btn:hover {
                background: linear-gradient(135deg, rgba(51, 65, 85, 0.9), rgba(71, 85, 105, 0.9));
                border-color: rgba(99, 102, 241, 0.6);
                color: #e0e7ff;
                box-shadow: 0 0 10px rgba(99, 102, 241, 0.2);
            }
            
            .measurement-tool-btn.active, .measurement-unit-btn.active {
                background: linear-gradient(135deg, rgba(99, 102, 241, 0.6), rgba(79, 70, 229, 0.6));
                border-color: rgba(99, 102, 241, 0.8);
                color: #f0f9ff;
                box-shadow: 0 0 15px rgba(99, 102, 241, 0.4);
            }
            
            .measurement-item {
                background: rgba(30, 41, 59, 0.5);
                border: 1px solid rgba(100, 116, 139, 0.3);
                border-radius: 8px;
                padding: 10px;
                margin-bottom: 8px;
                font-size: 11px;
                position: relative;
            }
            
            .measurement-item .measurement-type {
                color: #60a5fa;
                font-weight: 700;
                text-transform: uppercase;
                font-size: 10px;
                letter-spacing: 1px;
            }
            
            .measurement-item .measurement-value {
                color: #81c784;
                font-size: 14px;
                font-weight: 700;
                margin: 4px 0;
                text-shadow: 0 0 8px rgba(129, 199, 132, 0.3);
            }
            
            .measurement-item .measurement-objects {
                color: #cbd5e1;
                font-size: 10px;
            }
            
            .measurement-delete {
                position: absolute;
                top: 8px;
                right: 8px;
                background: rgba(239, 68, 68, 0.2);
                border: none;
                color: #f87171;
                width: 20px;
                height: 20px;
                border-radius: 50%;
                cursor: pointer;
                font-size: 12px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .measurement-delete:hover {
                background: rgba(239, 68, 68, 0.4);
                color: #fecaca;
            }
        `;
        document.head.appendChild(style);
    }
    
    setupEventListeners() {
        // Close button
        document.getElementById('measurement-close').addEventListener('click', () => {
            this.toggle();
        });
        
        // Tool selection
        document.querySelectorAll('.measurement-tool-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tool = e.target.dataset.tool;
                this.selectTool(tool);
            });
        });
        
        // Unit selection
        document.querySelectorAll('.measurement-unit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const unit = e.target.dataset.unit;
                this.selectUnit(unit);
            });
        });
        
        // Clear all measurements
        document.getElementById('clear-all-measurements').addEventListener('click', () => {
            this.clearAllMeasurements();
        });
    }
    
    toggle() {
        this.isEnabled = !this.isEnabled;
        this.measurementPanel.style.display = this.isEnabled ? 'block' : 'none';
        
        if (!this.isEnabled) {
            this.cancelCurrentMeasurement();
        }
        
        console.log(`MeasurementTools: ${this.isEnabled ? 'Enabled' : 'Disabled'}`);
    }
    
    selectTool(tool) {
        this.currentTool = tool;
        this.cancelCurrentMeasurement();
        
        // Update active button
        document.querySelectorAll('.measurement-tool-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tool === tool);
        });
        
        // Update instructions
        const instructions = document.getElementById('measurement-instructions');
        switch (tool) {
            case 'distance':
                instructions.textContent = 'Click on two celestial objects to measure the distance between them.';
                break;
            case 'angle':
                instructions.textContent = 'Click on three celestial objects to measure the angle between them.';
                break;
            case 'size':
                instructions.textContent = 'Click on a celestial object to measure its apparent size from your viewpoint.';
                break;
        }
        
        console.log(`MeasurementTools: Selected tool: ${tool}`);
    }
    
    selectUnit(unit) {
        this.currentUnit = unit;
        
        // Update active button
        document.querySelectorAll('.measurement-unit-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.unit === unit);
        });
        
        // Update existing measurements
        this.updateMeasurementDisplay();
        
        console.log(`MeasurementTools: Selected unit: ${unit}`);
    }
    
    handleObjectClick(objectName, position) {
        if (!this.isEnabled) return;
        
        this.measurementPoints.push({
            name: objectName,
            position: position.clone()
        });
        
        console.log(`MeasurementTools: Added point ${objectName} at`, position);
        
        // Check if we have enough points for the current tool
        const requiredPoints = this.getRequiredPoints();
        if (this.measurementPoints.length >= requiredPoints) {
            this.completeMeasurement();
        }
    }
    
    getRequiredPoints() {
        switch (this.currentTool) {
            case 'distance': return 2;
            case 'angle': return 3;
            case 'size': return 1;
            default: return 2;
        }
    }
    
    completeMeasurement() {
        let measurement;
        
        switch (this.currentTool) {
            case 'distance':
                measurement = this.measureDistance();
                break;
            case 'angle':
                measurement = this.measureAngle();
                break;
            case 'size':
                measurement = this.measureSize();
                break;
        }
        
        if (measurement) {
            this.measurements.push(measurement);
            this.createMeasurementVisual(measurement);
            this.updateMeasurementDisplay();
            console.log('MeasurementTools: Measurement completed:', measurement);
        }
        
        this.measurementPoints = [];
    }
    
    measureDistance() {
        if (this.measurementPoints.length < 2) return null;
        
        const point1 = this.measurementPoints[0];
        const point2 = this.measurementPoints[1];
        const distance = point1.position.distanceTo(point2.position);
        
        return {
            type: 'distance',
            id: Date.now(),
            objects: [point1.name, point2.name],
            positions: [point1.position, point2.position],
            value: distance,
            timestamp: new Date()
        };
    }
    
    measureAngle() {
        if (this.measurementPoints.length < 3) return null;
        
        const point1 = this.measurementPoints[0];
        const point2 = this.measurementPoints[1]; // vertex
        const point3 = this.measurementPoints[2];
        
        const vec1 = point1.position.clone().sub(point2.position).normalize();
        const vec2 = point3.position.clone().sub(point2.position).normalize();
        const angle = vec1.angleTo(vec2) * (180 / Math.PI);
        
        return {
            type: 'angle',
            id: Date.now(),
            objects: [point1.name, point2.name, point3.name],
            positions: [point1.position, point2.position, point3.position],
            value: angle,
            timestamp: new Date()
        };
    }
    
    measureSize() {
        if (this.measurementPoints.length < 1) return null;
        
        const point = this.measurementPoints[0];
        const distance = this.camera.position.distanceTo(point.position);
        
        // Estimate apparent size based on distance and known object sizes
        // This is a simplified calculation
        const apparentSize = Math.atan(1 / distance) * (180 / Math.PI) * 3600; // arcseconds
        
        return {
            type: 'size',
            id: Date.now(),
            objects: [point.name],
            positions: [point.position],
            value: apparentSize,
            distance: distance,
            timestamp: new Date()
        };
    }
    
    createMeasurementVisual(measurement) {
        const group = new THREE.Group();
        group.userData = { measurementId: measurement.id };
        
        switch (measurement.type) {
            case 'distance':
                this.createDistanceVisual(group, measurement);
                break;
            case 'angle':
                this.createAngleVisual(group, measurement);
                break;
            case 'size':
                this.createSizeVisual(group, measurement);
                break;
        }
        
        this.measurementGroup.add(group);
    }
    
    createDistanceVisual(group, measurement) {
        const pos1 = measurement.positions[0];
        const pos2 = measurement.positions[1];
        
        // Create line
        const geometry = new THREE.BufferGeometry().setFromPoints([pos1, pos2]);
        const material = new THREE.LineBasicMaterial({
            color: 0x60a5fa,
            linewidth: 2,
            transparent: true,
            opacity: 0.8
        });
        const line = new THREE.Line(geometry, material);
        group.add(line);
        
        // Create endpoint markers
        const markerGeometry = new THREE.SphereGeometry(2, 8, 8);
        const markerMaterial = new THREE.MeshBasicMaterial({
            color: 0x81c784,
            transparent: true,
            opacity: 0.9
        });
        
        const marker1 = new THREE.Mesh(markerGeometry, markerMaterial);
        marker1.position.copy(pos1);
        group.add(marker1);
        
        const marker2 = new THREE.Mesh(markerGeometry, markerMaterial);
        marker2.position.copy(pos2);
        group.add(marker2);
        
        // Create label
        const midpoint = pos1.clone().lerp(pos2, 0.5);
        this.createLabel(group, midpoint, this.formatDistance(measurement.value));
    }
    
    createAngleVisual(group, measurement) {
        const pos1 = measurement.positions[0];
        const pos2 = measurement.positions[1]; // vertex
        const pos3 = measurement.positions[2];
        
        // Create lines from vertex to other points
        const geometry1 = new THREE.BufferGeometry().setFromPoints([pos2, pos1]);
        const geometry2 = new THREE.BufferGeometry().setFromPoints([pos2, pos3]);
        
        const material = new THREE.LineBasicMaterial({
            color: 0xa78bfa,
            linewidth: 2,
            transparent: true,
            opacity: 0.8
        });
        
        const line1 = new THREE.Line(geometry1, material);
        const line2 = new THREE.Line(geometry2, material);
        group.add(line1);
        group.add(line2);
        
        // Create arc to show angle
        const radius = Math.min(pos2.distanceTo(pos1), pos2.distanceTo(pos3)) * 0.3;
        const arc = this.createAngleArc(pos2, pos1, pos3, radius);
        if (arc) group.add(arc);
        
        // Create label
        this.createLabel(group, pos2, `${measurement.value.toFixed(1)}°`);
    }
    
    createSizeVisual(group, measurement) {
        const pos = measurement.positions[0];
        
        // Create indicator ring
        const geometry = new THREE.RingGeometry(5, 7, 16);
        const material = new THREE.MeshBasicMaterial({
            color: 0xf59e0b,
            transparent: true,
            opacity: 0.7,
            side: THREE.DoubleSide
        });
        
        const ring = new THREE.Mesh(geometry, material);
        ring.position.copy(pos);
        ring.lookAt(this.camera.position);
        group.add(ring);
        
        // Create label
        this.createLabel(group, pos, `${measurement.value.toFixed(2)}" arc`);
    }
    
    createAngleArc(vertex, point1, point3, radius) {
        const vec1 = point1.clone().sub(vertex).normalize();
        const vec2 = point3.clone().sub(vertex).normalize();
        const angle = vec1.angleTo(vec2);
        
        const curve = new THREE.EllipseCurve(
            0, 0,
            radius, radius,
            0, angle,
            false,
            0
        );
        
        const points = curve.getPoints(32);
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({
            color: 0xa78bfa,
            transparent: true,
            opacity: 0.6
        });
        
        const arc = new THREE.Line(geometry, material);
        arc.position.copy(vertex);
        
        // Orient the arc properly
        const normal = vec1.clone().cross(vec2).normalize();
        const up = new THREE.Vector3(0, 1, 0);
        arc.lookAt(vertex.clone().add(normal));
        
        return arc;
    }
    
    createLabel(group, position, text) {
        // This would typically use a text geometry or sprite
        // For now, we'll store the label info for HTML overlay
        group.userData.label = {
            position: position,
            text: text
        };
    }
    
    formatDistance(distance) {
        const unit = this.currentUnit || 'au';
        
        switch (unit) {
            case 'au':
                return `${distance.toFixed(3)} AU`;
            case 'km':
                return `${(distance * this.AU_TO_KM).toExponential(3)} km`;
            case 'miles':
                return `${(distance * this.AU_TO_MILES).toExponential(3)} mi`;
            default:
                return `${distance.toFixed(3)} AU`;
        }
    }
    
    updateMeasurementDisplay() {
        this.measurementList.innerHTML = '';
        
        this.measurements.forEach(measurement => {
            const item = document.createElement('div');
            item.className = 'measurement-item';
            
            let valueText = '';
            switch (measurement.type) {
                case 'distance':
                    valueText = this.formatDistance(measurement.value);
                    break;
                case 'angle':
                    valueText = `${measurement.value.toFixed(1)}°`;
                    break;
                case 'size':
                    valueText = `${measurement.value.toFixed(2)}" arc`;
                    break;
            }
            
            item.innerHTML = `
                <div class="measurement-type">${measurement.type.toUpperCase()}</div>
                <div class="measurement-value">${valueText}</div>
                <div class="measurement-objects">${measurement.objects.join(' → ')}</div>
                <button class="measurement-delete" onclick="window.measurementTools.deleteMeasurement(${measurement.id})">✕</button>
            `;
            
            this.measurementList.appendChild(item);
        });
    }
    
    deleteMeasurement(id) {
        // Remove from array
        this.measurements = this.measurements.filter(m => m.id !== id);
        
        // Remove visual
        const visual = this.measurementGroup.children.find(child => 
            child.userData.measurementId === id
        );
        if (visual) {
            this.measurementGroup.remove(visual);
        }
        
        this.updateMeasurementDisplay();
        console.log(`MeasurementTools: Deleted measurement ${id}`);
    }
    
    clearAllMeasurements() {
        this.measurements = [];
        this.measurementGroup.clear();
        this.updateMeasurementDisplay();
        this.cancelCurrentMeasurement();
        console.log('MeasurementTools: All measurements cleared');
    }
    
    cancelCurrentMeasurement() {
        this.measurementPoints = [];
        this.currentMeasurement = null;
    }
    
    update() {
        // Update label positions and visibility
        this.measurementGroup.children.forEach(group => {
            if (group.userData.label) {
                // Update label positioning based on camera
                // This would typically update HTML overlay positions
            }
        });
    }
    
    // Public API
    enable() {
        if (!this.isEnabled) this.toggle();
    }
    
    disable() {
        if (this.isEnabled) this.toggle();
    }
    
    isActive() {
        return this.isEnabled;
    }
}

// Export for global access
if (typeof window !== 'undefined') {
    window.MeasurementTools = MeasurementTools;
}