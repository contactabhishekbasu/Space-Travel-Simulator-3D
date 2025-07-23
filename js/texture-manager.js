// Texture Manager for performance optimization
class TextureManager {
    constructor() {
        this.textures = new Map();
        this.textureCache = new Map();
        this.loadingQueue = [];
        this.isLoading = false;
        this.maxCacheSize = 50; // Maximum textures to keep in memory
        this.maxTextureSize = 2048; // Maximum texture resolution for performance
        
        // Performance tracking
        this.loadedTextures = 0;
        this.cachedTextures = 0;
        this.totalMemoryUsage = 0;
        
        // LOD texture paths
        this.texturePaths = {
            low: 'textures/low/',
            high: 'textures/high/'
        };
        
        // Texture compression settings
        this.compressionFormats = {
            desktop: ['s3tc', 'etc1'],
            mobile: ['pvrtc', 'astc', 'etc2']
        };
        
        this.loader = new THREE.TextureLoader();
        this.currentMode = 'high'; // 'low' or 'high'
        
        console.log('TextureManager: Initialized with cache size', this.maxCacheSize);
    }
    
    // Set texture quality mode
    setQualityMode(mode) {
        if (mode === this.currentMode) return;
        
        this.currentMode = mode;
        console.log(`TextureManager: Switched to ${mode} quality mode`);
        
        // Preload common textures for the new mode
        this.preloadCommonTextures();
    }
    
    // Load texture with caching and optimization
    async loadTexture(name, priority = 'normal') {
        const cacheKey = `${name}-${this.currentMode}`;
        
        // Check cache first
        if (this.textureCache.has(cacheKey)) {
            this.cachedTextures++;
            return this.textureCache.get(cacheKey);
        }
        
        // Queue for loading if not immediate priority
        if (priority !== 'immediate' && this.isLoading) {
            return new Promise((resolve) => {
                this.loadingQueue.push({ name, cacheKey, resolve });
            });
        }
        
        return this.loadTextureImmediate(name, cacheKey);
    }
    
    // Load texture immediately
    async loadTextureImmediate(name, cacheKey) {
        this.isLoading = true;
        
        try {
            const texturePath = this.getTexturePath(name);
            const texture = await this.loadTextureFromPath(texturePath);
            
            // Optimize texture
            this.optimizeTexture(texture);
            
            // Cache the texture
            this.cacheTexture(cacheKey, texture);
            
            this.loadedTextures++;
            console.log(`TextureManager: Loaded ${name} (${this.currentMode} quality)`);
            
            return texture;
            
        } catch (error) {
            console.warn(`TextureManager: Failed to load ${name}, trying fallback`, error);
            return this.loadFallbackTexture(name);
        } finally {
            this.isLoading = false;
            this.processQueue();
        }
    }
    
    // Get optimized texture path
    getTexturePath(name) {
        const basePath = this.texturePaths[this.currentMode];
        const resolution = this.currentMode === 'high' ? '8k' : '2k';
        return `${basePath}${resolution}_${name}.jpg`;
    }
    
    // Load texture from path with error handling
    loadTextureFromPath(path) {
        return new Promise((resolve, reject) => {
            this.loader.load(
                path,
                resolve,
                (progress) => {
                    // Optional progress tracking
                },
                reject
            );
        });
    }
    
    // Optimize texture for performance
    optimizeTexture(texture) {
        // Set appropriate wrap mode
        texture.wrapS = THREE.ClampToEdgeWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;
        
        // Set filtering for performance vs quality
        if (this.currentMode === 'low') {
            texture.minFilter = THREE.LinearFilter;
            texture.magFilter = THREE.LinearFilter;
        } else {
            texture.minFilter = THREE.LinearMipMapLinearFilter;
            texture.magFilter = THREE.LinearFilter;
        }
        
        // Generate mipmaps for better performance at distance
        texture.generateMipmaps = this.currentMode === 'high';
        
        // Set anisotropy based on quality mode
        const maxAnisotropy = this.currentMode === 'high' ? 4 : 1;
        texture.anisotropy = Math.min(maxAnisotropy, window.renderer?.capabilities?.getMaxAnisotropy() || 1);
        
        // Estimate memory usage
        this.estimateTextureMemory(texture);
    }
    
    // Cache texture with memory management
    cacheTexture(key, texture) {
        // Check cache size limit
        if (this.textureCache.size >= this.maxCacheSize) {
            this.cleanOldTextures();
        }
        
        this.textureCache.set(key, {
            texture: texture,
            lastUsed: performance.now(),
            memorySize: this.estimateTextureMemory(texture)
        });
    }
    
    // Clean old textures from cache
    cleanOldTextures() {
        const entries = Array.from(this.textureCache.entries());
        
        // Sort by last used time
        entries.sort((a, b) => a[1].lastUsed - b[1].lastUsed);
        
        // Remove oldest 25% of textures
        const toRemove = Math.floor(entries.length * 0.25);
        for (let i = 0; i < toRemove; i++) {
            const [key, data] = entries[i];
            this.disposeTexture(data.texture);
            this.textureCache.delete(key);
            console.log(`TextureManager: Removed old texture ${key} from cache`);
        }
    }
    
    // Load fallback texture
    async loadFallbackTexture(name) {
        // Try different resolutions or create procedural texture
        const fallbackPath = `${this.texturePaths.low}2k_${name}.jpg`;
        
        try {
            const texture = await this.loadTextureFromPath(fallbackPath);
            this.optimizeTexture(texture);
            return texture;
        } catch (error) {
            // Create a procedural fallback
            return this.createProceduralTexture(name);
        }
    }
    
    // Create procedural texture as last resort
    createProceduralTexture(name) {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');
        
        // Generate different patterns based on name
        if (name.includes('sun')) {
            this.generateSunTexture(ctx, canvas.width, canvas.height);
        } else if (name.includes('earth')) {
            this.generateEarthTexture(ctx, canvas.width, canvas.height);
        } else {
            this.generateGenericPlanetTexture(ctx, canvas.width, canvas.height);
        }
        
        const texture = new THREE.CanvasTexture(canvas);
        this.optimizeTexture(texture);
        
        console.log(`TextureManager: Generated procedural texture for ${name}`);
        return texture;
    }
    
    // Generate sun texture
    generateSunTexture(ctx, width, height) {
        const gradient = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, width/2);
        gradient.addColorStop(0, '#FFD700');
        gradient.addColorStop(0.7, '#FF8C00');
        gradient.addColorStop(1, '#FF4500');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
        
        // Add some noise
        for (let i = 0; i < 1000; i++) {
            ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.3})`;
            ctx.fillRect(Math.random() * width, Math.random() * height, 2, 2);
        }
    }
    
    // Generate earth texture
    generateEarthTexture(ctx, width, height) {
        // Simple blue with green continents
        ctx.fillStyle = '#1E90FF';
        ctx.fillRect(0, 0, width, height);
        
        // Add some green landmasses
        ctx.fillStyle = '#228B22';
        for (let i = 0; i < 20; i++) {
            ctx.beginPath();
            ctx.arc(Math.random() * width, Math.random() * height, Math.random() * 50 + 20, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    // Generate generic planet texture
    generateGenericPlanetTexture(ctx, width, height) {
        const hue = Math.random() * 360;
        ctx.fillStyle = `hsl(${hue}, 70%, 50%)`;
        ctx.fillRect(0, 0, width, height);
        
        // Add some variation
        for (let i = 0; i < 100; i++) {
            ctx.fillStyle = `hsla(${hue + Math.random() * 60 - 30}, 70%, ${30 + Math.random() * 40}%, 0.3)`;
            ctx.fillRect(Math.random() * width, Math.random() * height, Math.random() * 20 + 5, Math.random() * 20 + 5);
        }
    }
    
    // Estimate texture memory usage
    estimateTextureMemory(texture) {
        const width = texture.image?.width || 512;
        const height = texture.image?.height || 512;
        const bytesPerPixel = 4; // RGBA
        const memorySize = width * height * bytesPerPixel;
        
        this.totalMemoryUsage += memorySize;
        return memorySize;
    }
    
    // Process loading queue
    processQueue() {
        if (this.loadingQueue.length === 0 || this.isLoading) return;
        
        const next = this.loadingQueue.shift();
        this.loadTextureImmediate(next.name, next.cacheKey)
            .then(next.resolve);
    }
    
    // Preload common textures
    async preloadCommonTextures() {
        const commonTextures = ['sun', 'earth', 'mars', 'jupiter', 'saturn'];
        
        console.log('TextureManager: Preloading common textures for', this.currentMode, 'mode');
        
        for (const name of commonTextures) {
            try {
                await this.loadTexture(name, 'immediate');
            } catch (error) {
                console.warn(`TextureManager: Failed to preload ${name}`, error);
            }
        }
        
        console.log('TextureManager: Preloading complete');
    }
    
    // Dispose texture properly
    disposeTexture(texture) {
        if (texture && texture.dispose) {
            texture.dispose();
            this.totalMemoryUsage -= this.estimateTextureMemory(texture);
        }
    }
    
    // Get performance statistics
    getPerformanceStats() {
        return {
            loadedTextures: this.loadedTextures,
            cachedTextures: this.textureCache.size,
            queueLength: this.loadingQueue.length,
            totalMemoryMB: (this.totalMemoryUsage / (1024 * 1024)).toFixed(2),
            currentMode: this.currentMode,
            cacheHitRate: this.cachedTextures > 0 ? 
                         ((this.cachedTextures / (this.loadedTextures + this.cachedTextures)) * 100).toFixed(1) + '%' : '0%'
        };
    }
    
    // Adaptive quality based on performance
    adaptiveQuality(frameRate, memoryUsage) {
        if (frameRate < 25 || memoryUsage > 512) { // 512MB threshold
            if (this.currentMode === 'high') {
                this.setQualityMode('low');
                this.clearCache(); // Clear high-res textures
                console.log('TextureManager: Switched to low quality due to performance');
            }
        } else if (frameRate > 50 && memoryUsage < 256) { // 256MB threshold
            if (this.currentMode === 'low') {
                this.setQualityMode('high');
                console.log('TextureManager: Switched to high quality due to good performance');
            }
        }
    }
    
    // Clear texture cache
    clearCache() {
        for (const [key, data] of this.textureCache.entries()) {
            this.disposeTexture(data.texture);
        }
        this.textureCache.clear();
        this.totalMemoryUsage = 0;
        console.log('TextureManager: Cache cleared');
    }
    
    // Cleanup on destroy
    destroy() {
        this.clearCache();
        this.loadingQueue = [];
        console.log('TextureManager: Destroyed and cleaned up');
    }
}