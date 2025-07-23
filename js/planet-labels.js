// Planet labels that always face the camera
class PlanetLabels {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;
        this.labels = {};
        this.sprites = {};
    }

    createLabel(name, position, color = 0xffffff) {
        // Create canvas for text
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 256;
        canvas.height = 64;
        
        // Configure text
        context.font = '32px Arial';
        context.fillStyle = '#ffffff';
        context.strokeStyle = '#000000';
        context.lineWidth = 3;
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        
        // Draw text with outline
        context.strokeText(name, 128, 32);
        context.fillText(name, 128, 32);
        
        // Create texture and sprite
        const texture = new THREE.CanvasTexture(canvas);
        const spriteMaterial = new THREE.SpriteMaterial({
            map: texture,
            transparent: true,
            opacity: 0.8
        });
        
        const sprite = new THREE.Sprite(spriteMaterial);
        sprite.scale.set(40, 10, 1);
        sprite.position.copy(position);
        sprite.position.y += 20; // Offset above planet
        
        this.scene.add(sprite);
        this.sprites[name] = sprite;
        
        return sprite;
    }

    updateLabel(name, position) {
        if (this.sprites[name]) {
            this.sprites[name].position.copy(position);
            this.sprites[name].position.y += 20;
            
            // Fade based on distance
            const distance = this.camera.position.distanceTo(position);
            const opacity = Math.max(0, Math.min(1, (1000 - distance) / 800));
            this.sprites[name].material.opacity = opacity;
        }
    }

    hideLabel(name) {
        if (this.sprites[name]) {
            this.sprites[name].visible = false;
        }
    }

    showLabel(name) {
        if (this.sprites[name]) {
            this.sprites[name].visible = true;
        }
    }

    removeLabel(name) {
        if (this.sprites[name]) {
            this.scene.remove(this.sprites[name]);
            delete this.sprites[name];
        }
    }
}