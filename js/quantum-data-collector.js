// Quantum Dashboard Data Collector
// Handles data collection from the Space Travel Simulator

class QuantumDataCollector {
    constructor(options = {}) {
        this.options = {
            updateInterval: 1000, // Default 1 second
            maxHistorySize: 1000,
            ...options
        };
        
        // Data storage
        this.data = {
            performance: {
                current: {},
                history: []
            },
            celestial: {
                current: {},
                history: []
            },
            user: {
                current: {},
                history: []
            },
            system: {
                current: {},
                history: []
            }
        };
        
        // Metrics tracking
        this.metrics = {
            session: {
                startTime: Date.now(),
                duration: 0,
                interactions: 0,
                planetsVisited: new Set(),
                featuresUsed: new Set()
            }
        };
        
        // Connection state
        this.connected = false;
        this.simulator = null;
        this.bridge = null;
        
        // Real-time performance tracking
        this.realtimeMetrics = {
            fps: { current: 0, history: [], smooth: 0 },
            memory: { current: {}, history: [] },
            render: { current: {}, history: [] }
        };
        
        // Update timer
        this.updateTimer = null;
        
        // Event emitter pattern for data updates
        this.listeners = {};
    }
    
    // Initialize connection to simulator
    init() {
        // Initialize Quantum Bridge
        this.bridge = new QuantumBridge({
            mode: window.parent !== window ? 'embedded' : 'standalone'
        });
        
        // Set up bridge event listeners
        this.setupBridgeListeners();
        
        // Wait for bridge connection
        this.bridge.on('connected', () => {
            this.connected = true;
            console.log('QuantumDataCollector: Connected via Quantum Bridge');
            this.emit('connected');
        });
        
        // Start data collection
        this.startCollection();
        
        // Listen for visibility changes
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pause();
            } else {
                this.resume();
            }
        });
    }
    
    // Set up bridge event listeners
    setupBridgeListeners() {
        // Performance channel
        this.bridge.channels.performance.onmessage = (event) => {
            this.processPerformanceData(event.data);
        };
        
        // Celestial channel
        this.bridge.channels.celestial.onmessage = (event) => {
            this.processCelestialData(event.data);
        };
        
        // User channel
        this.bridge.channels.user.onmessage = (event) => {
            this.processUserData(event.data);
        };
        
        // System channel
        this.bridge.channels.system.onmessage = (event) => {
            this.processSystemData(event.data);
        };
    }
    
    // Connect to simulator window
    connectToSimulator(simulatorWindow) {
        try {
            // Test access to simulator
            if (simulatorWindow.performanceMonitor || simulatorWindow.window?.performanceMonitor) {
                this.simulator = simulatorWindow.window || simulatorWindow;
                this.connected = true;
                console.log('QuantumDataCollector: Connected to simulator');
                this.emit('connected');
            } else {
                console.warn('QuantumDataCollector: Unable to access simulator data');
                this.connectStandalone();
            }
        } catch (e) {
            console.warn('QuantumDataCollector: Cross-origin access denied, using standalone mode');
            this.connectStandalone();
        }
    }
    
    // Standalone connection (uses localStorage bridge)
    connectStandalone() {
        this.connected = false;
        console.log('QuantumDataCollector: Running in standalone mode');
        
        // Listen for data via localStorage events
        window.addEventListener('storage', (e) => {
            if (e.key === 'quantum-dashboard-data') {
                try {
                    const data = JSON.parse(e.newValue);
                    this.processExternalData(data);
                } catch (err) {
                    console.error('Error parsing external data:', err);
                }
            }
        });
    }
    
    // Start collecting data
    startCollection() {
        if (this.updateTimer) return;
        
        this.updateTimer = setInterval(() => {
            this.collect();
        }, this.options.updateInterval);
        
        // Initial collection
        this.collect();
    }
    
    // Pause collection
    pause() {
        if (this.updateTimer) {
            clearInterval(this.updateTimer);
            this.updateTimer = null;
        }
    }
    
    // Resume collection
    resume() {
        this.startCollection();
    }
    
    // Main data collection method
    collect() {
        const timestamp = Date.now();
        
        // Update session duration
        this.metrics.session.duration = timestamp - this.metrics.session.startTime;
        
        if (this.connected && this.bridge) {
            // Request data from simulator via bridge
            this.requestSimulatorData(timestamp);
        } else {
            // Generate demo data in standalone mode
            this.generateDemoData(timestamp);
        }
        
        // Emit update event
        this.emit('update', {
            timestamp,
            data: this.data,
            metrics: this.metrics
        });
        
        // Clean up old history
        this.pruneHistory();
    }
    
    // Request data from simulator
    async requestSimulatorData(timestamp) {
        try {
            // Request all data types
            const requests = [
                this.bridge.request('quantum:getData', { type: 'performance' }),
                this.bridge.request('quantum:getData', { type: 'celestial' }),
                this.bridge.request('quantum:getData', { type: 'user' }),
                this.bridge.request('quantum:getData', { type: 'system' })
            ];
            
            // Wait for all requests (with timeout handling)
            const results = await Promise.allSettled(requests);
            
            // Process successful results
            results.forEach((result, index) => {
                if (result.status === 'fulfilled') {
                    const types = ['performance', 'celestial', 'user', 'system'];
                    this.processDataUpdate(types[index], result.value, timestamp);
                }
            });
        } catch (e) {
            console.error('Error requesting simulator data:', e);
        }
    }
    
    // Process data update from bridge
    processDataUpdate(type, data, timestamp) {
        if (!data) return;
        
        // Update current data
        this.data[type].current = data;
        
        // Add to history with timestamp
        this.data[type].history.push({
            timestamp,
            ...data
        });
    }
    
    // Process real-time performance data from bridge
    processPerformanceData(data) {
        const { type: dataType, data: metrics } = data;
        
        switch (dataType) {
            case 'fps':
                this.realtimeMetrics.fps.current = metrics.fps;
                this.realtimeMetrics.fps.smooth = metrics.smooth;
                this.realtimeMetrics.fps.history.push({
                    timestamp: metrics.timestamp,
                    value: metrics.fps
                });
                
                // Update main data
                this.data.performance.current.fps = metrics.fps;
                this.data.performance.current.smoothFps = metrics.smooth;
                break;
                
            case 'memory':
                this.realtimeMetrics.memory.current = metrics;
                this.data.performance.current.memory = {
                    used: Math.round(metrics.usedJSHeapSize / 1048576), // MB
                    total: Math.round(metrics.totalJSHeapSize / 1048576), // MB
                    limit: Math.round(metrics.jsHeapSizeLimit / 1048576) // MB
                };
                break;
                
            case 'metrics':
                // General performance metrics
                Object.assign(this.data.performance.current, metrics);
                break;
        }
        
        // Emit performance update
        this.emit('performance:update', this.data.performance.current);
    }
    
    // Process celestial data from bridge
    processCelestialData(data) {
        Object.assign(this.data.celestial.current, data);
        this.emit('celestial:update', this.data.celestial.current);
    }
    
    // Process user data from bridge
    processUserData(data) {
        Object.assign(this.data.user.current, data);
        
        // Update metrics
        if (data.planetsVisited) {
            data.planetsVisited.forEach(planet => {
                this.metrics.session.planetsVisited.add(planet);
            });
        }
        
        if (data.featuresUsed) {
            data.featuresUsed.forEach(feature => {
                this.metrics.session.featuresUsed.add(feature);
            });
        }
        
        this.emit('user:update', this.data.user.current);
    }
    
    // Process system data from bridge
    processSystemData(data) {
        Object.assign(this.data.system.current, data);
        this.emit('system:update', this.data.system.current);
    }
    
    // Collect performance data
    collectPerformanceData(timestamp) {
        try {
            const perfMonitor = this.simulator.performanceMonitor;
            const perfDashboard = this.simulator.performanceDashboard;
            
            if (perfMonitor) {
                const stats = perfMonitor.getPerformanceStats();
                
                this.data.performance.current = {
                    fps: parseFloat(stats.currentFPS),
                    avgFps: parseFloat(stats.averageFPS),
                    minFps: parseFloat(stats.minFPS),
                    maxFps: parseFloat(stats.maxFPS),
                    frameTime: parseFloat(stats.deltaTime),
                    performanceLevel: stats.performanceLevel,
                    adaptiveChanges: stats.adaptiveChanges
                };
                
                // Memory usage
                if (stats.memoryUsage) {
                    this.data.performance.current.memory = {
                        geometries: stats.memoryUsage.geometries || 0,
                        textures: stats.memoryUsage.textures || 0,
                        programs: stats.memoryUsage.programs || 0,
                        calls: stats.memoryUsage.calls || 0,
                        triangles: stats.memoryUsage.triangles || 0
                    };
                }
                
                // GPU info
                if (stats.gpu) {
                    this.data.performance.current.gpu = stats.gpu;
                    this.data.performance.current.systemTier = stats.systemTier;
                }
            }
            
            // Get additional metrics from performance dashboard if available
            if (perfDashboard) {
                const techMetrics = perfDashboard.technicalMetrics;
                if (techMetrics && techMetrics.webgl) {
                    this.data.performance.current.webgl = {
                        vendor: techMetrics.webgl.vendor,
                        renderer: techMetrics.webgl.renderer,
                        drawCalls: techMetrics.rendering.drawCalls.slice(-1)[0] || 0,
                        triangles: techMetrics.rendering.triangles.slice(-1)[0] || 0,
                        shaderSwitches: techMetrics.rendering.shaderSwitches.slice(-1)[0] || 0
                    };
                }
            }
            
            // Add to history
            this.data.performance.history.push({
                timestamp,
                ...this.data.performance.current
            });
            
        } catch (e) {
            console.error('Error collecting performance data:', e);
        }
    }
    
    // Collect celestial data
    collectCelestialData(timestamp) {
        try {
            const celestialBodies = this.simulator.celestialBodies;
            const camera = this.simulator.camera;
            const timeControls = this.simulator.timeControls;
            const ephemeris = this.simulator.ephemerisEngine;
            
            if (celestialBodies) {
                // Current celestial state
                const planetData = {};
                
                Object.entries(celestialBodies).forEach(([name, body]) => {
                    if (body.mesh && body.mesh.position) {
                        const pos = body.mesh.position;
                        const distanceFromSun = pos.length();
                        
                        planetData[name] = {
                            position: {
                                x: pos.x,
                                y: pos.y,
                                z: pos.z
                            },
                            distanceFromSun: distanceFromSun,
                            visible: body.mesh.visible
                        };
                        
                        // Add velocity if available
                        if (body.velocity) {
                            planetData[name].velocity = body.velocity;
                        }
                    }
                });
                
                this.data.celestial.current = {
                    planets: planetData,
                    timeScale: timeControls ? timeControls.timeScale : 1,
                    currentDate: timeControls ? timeControls.currentDate : new Date(),
                    ephemerisActive: ephemeris ? ephemeris.isActive : false
                };
                
                // Camera data
                if (camera) {
                    this.data.celestial.current.camera = {
                        position: {
                            x: camera.position.x,
                            y: camera.position.y,
                            z: camera.position.z
                        },
                        target: this.simulator.cameraFollowTarget || 'free'
                    };
                }
                
                // Add to history (sample less frequently)
                if (this.data.celestial.history.length === 0 || 
                    timestamp - this.data.celestial.history[this.data.celestial.history.length - 1].timestamp > 5000) {
                    this.data.celestial.history.push({
                        timestamp,
                        ...this.data.celestial.current
                    });
                }
            }
        } catch (e) {
            console.error('Error collecting celestial data:', e);
        }
    }
    
    // Collect user interaction data
    collectUserData(timestamp) {
        try {
            // Track feature usage
            if (this.simulator.settingsPanel) {
                const settings = this.simulator.settingsPanel.settings;
                Object.entries(settings).forEach(([key, setting]) => {
                    if (setting.enabled) {
                        this.metrics.session.featuresUsed.add(key);
                    }
                });
            }
            
            // Track spacecraft panel usage
            if (this.simulator.spacecraftTracker && this.simulator.spacecraftTracker.isVisible) {
                this.metrics.session.featuresUsed.add('spacecraftPanel');
            }
            
            this.data.user.current = {
                sessionDuration: Math.floor(this.metrics.session.duration / 1000), // seconds
                interactions: this.metrics.session.interactions,
                planetsVisited: this.metrics.session.planetsVisited.size,
                featuresUsed: this.metrics.session.featuresUsed.size,
                activeFeatures: Array.from(this.metrics.session.featuresUsed)
            };
            
        } catch (e) {
            console.error('Error collecting user data:', e);
        }
    }
    
    // Collect system data
    collectSystemData(timestamp) {
        try {
            const renderer = this.simulator.renderer;
            const scene = this.simulator.scene;
            
            this.data.system.current = {
                rendererInfo: {},
                sceneInfo: {},
                textureInfo: {},
                errors: []
            };
            
            // Renderer info
            if (renderer && renderer.info) {
                const info = renderer.info;
                this.data.system.current.rendererInfo = {
                    calls: info.render.calls,
                    triangles: info.render.triangles,
                    points: info.render.points,
                    lines: info.render.lines,
                    geometries: info.memory.geometries,
                    textures: info.memory.textures,
                    programs: info.programs ? info.programs.length : 0
                };
            }
            
            // Scene info
            if (scene) {
                let objectCount = 0;
                let lightCount = 0;
                
                scene.traverse((obj) => {
                    objectCount++;
                    if (obj.isLight) lightCount++;
                });
                
                this.data.system.current.sceneInfo = {
                    objects: objectCount,
                    lights: lightCount
                };
            }
            
            // Texture manager info
            if (this.simulator.textureManager) {
                const textureStats = this.simulator.textureManager.getStats();
                this.data.system.current.textureInfo = textureStats;
            }
            
            // Check for errors in dev log
            if (this.simulator.devLogs) {
                const recentErrors = this.simulator.devLogs
                    .filter(log => log.type === 'error' && log.timestamp > timestamp - 60000)
                    .slice(-5);
                this.data.system.current.errors = recentErrors;
            }
            
        } catch (e) {
            console.error('Error collecting system data:', e);
        }
    }
    
    // Generate demo data for standalone mode
    generateDemoData(timestamp) {
        // Performance data
        const baseFps = 60;
        const fpsVariation = Math.sin(timestamp / 5000) * 10 + Math.random() * 5;
        
        this.data.performance.current = {
            fps: Math.max(30, baseFps + fpsVariation),
            avgFps: baseFps,
            minFps: baseFps - 15,
            maxFps: baseFps + 10,
            frameTime: 16.67 + Math.random() * 5,
            performanceLevel: baseFps + fpsVariation > 50 ? 'good' : 'low',
            memory: {
                geometries: 150 + Math.floor(Math.random() * 50),
                textures: 80 + Math.floor(Math.random() * 20),
                programs: 25,
                calls: 200 + Math.floor(Math.random() * 100),
                triangles: 50000 + Math.floor(Math.random() * 20000)
            }
        };
        
        this.data.performance.history.push({
            timestamp,
            ...this.data.performance.current
        });
        
        // Celestial data
        this.data.celestial.current = {
            planets: {
                earth: {
                    position: {
                        x: Math.cos(timestamp / 10000) * 150,
                        y: 0,
                        z: Math.sin(timestamp / 10000) * 150
                    },
                    distanceFromSun: 150,
                    visible: true
                },
                mars: {
                    position: {
                        x: Math.cos(timestamp / 15000) * 200,
                        y: 0,
                        z: Math.sin(timestamp / 15000) * 200
                    },
                    distanceFromSun: 200,
                    visible: true
                }
            },
            timeScale: 1,
            currentDate: new Date(),
            ephemerisActive: true
        };
        
        // User data
        this.data.user.current = {
            sessionDuration: Math.floor((timestamp - this.metrics.session.startTime) / 1000),
            interactions: Math.floor(Math.random() * 100),
            planetsVisited: Math.floor(Math.random() * 8) + 1,
            featuresUsed: Math.floor(Math.random() * 15) + 5
        };
        
        // System data
        this.data.system.current = {
            rendererInfo: {
                calls: 150 + Math.floor(Math.random() * 50),
                triangles: 50000 + Math.floor(Math.random() * 10000),
                geometries: 100 + Math.floor(Math.random() * 50),
                textures: 50 + Math.floor(Math.random() * 20)
            },
            sceneInfo: {
                objects: 200 + Math.floor(Math.random() * 50),
                lights: 5
            }
        };
    }
    
    // Process external data (from localStorage bridge)
    processExternalData(data) {
        if (data.performance) {
            this.data.performance.current = data.performance;
            this.data.performance.history.push({
                timestamp: Date.now(),
                ...data.performance
            });
        }
        
        if (data.celestial) {
            this.data.celestial.current = data.celestial;
        }
        
        if (data.user) {
            this.data.user.current = data.user;
        }
        
        if (data.system) {
            this.data.system.current = data.system;
        }
        
        this.emit('update', {
            timestamp: Date.now(),
            data: this.data,
            metrics: this.metrics
        });
    }
    
    // Prune old history data
    pruneHistory() {
        const maxSize = this.options.maxHistorySize;
        
        Object.keys(this.data).forEach(category => {
            if (this.data[category].history && this.data[category].history.length > maxSize) {
                this.data[category].history = this.data[category].history.slice(-maxSize);
            }
        });
    }
    
    // Get current data snapshot
    getSnapshot() {
        return {
            timestamp: Date.now(),
            data: this.data,
            metrics: this.metrics,
            connected: this.connected
        };
    }
    
    // Get historical data for a time range
    getHistoricalData(category, timeRange) {
        const now = Date.now();
        const startTime = now - this.parseTimeRange(timeRange);
        
        if (!this.data[category] || !this.data[category].history) {
            return [];
        }
        
        return this.data[category].history.filter(entry => entry.timestamp >= startTime);
    }
    
    // Parse time range string
    parseTimeRange(range) {
        const units = {
            m: 60 * 1000,
            h: 60 * 60 * 1000,
            d: 24 * 60 * 60 * 1000
        };
        
        const match = range.match(/(\d+)([mhd])/);
        if (match) {
            const value = parseInt(match[1]);
            const unit = match[2];
            return value * (units[unit] || units.m);
        }
        
        return 15 * 60 * 1000; // Default 15 minutes
    }
    
    // Track user interaction
    trackInteraction(type, data) {
        this.metrics.session.interactions++;
        
        if (type === 'planetClick' && data.planet) {
            this.metrics.session.planetsVisited.add(data.planet);
        }
        
        if (type === 'featureToggle' && data.feature) {
            if (data.enabled) {
                this.metrics.session.featuresUsed.add(data.feature);
            }
        }
        
        this.emit('interaction', { type, data });
    }
    
    // Event emitter methods
    on(event, callback) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(callback);
    }
    
    off(event, callback) {
        if (!this.listeners[event]) return;
        
        const index = this.listeners[event].indexOf(callback);
        if (index > -1) {
            this.listeners[event].splice(index, 1);
        }
    }
    
    emit(event, data) {
        if (!this.listeners[event]) return;
        
        this.listeners[event].forEach(callback => {
            try {
                callback(data);
            } catch (e) {
                console.error('Error in event listener:', e);
            }
        });
    }
    
    // Cleanup
    destroy() {
        this.pause();
        this.listeners = {};
        this.data = null;
        this.metrics = null;
    }
}

// Export for use in dashboard
window.QuantumDataCollector = QuantumDataCollector;