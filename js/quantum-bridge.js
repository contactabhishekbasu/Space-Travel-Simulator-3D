// Quantum Bridge - Communication Layer
// Handles real-time data exchange between Space Simulator and Quantum Dashboard

class QuantumBridge {
    constructor(options = {}) {
        this.options = {
            mode: 'embedded', // 'embedded' or 'standalone'
            reconnectInterval: 5000,
            messageTimeout: 10000,
            ...options
        };
        
        // Connection state
        this.connected = false;
        this.connectionAttempts = 0;
        this.lastHeartbeat = Date.now();
        
        // Message handling
        this.messageHandlers = new Map();
        this.pendingRequests = new Map();
        this.messageId = 0;
        
        // Data channels
        this.channels = {
            performance: new BroadcastChannel('quantum-performance'),
            celestial: new BroadcastChannel('quantum-celestial'),
            user: new BroadcastChannel('quantum-user'),
            system: new BroadcastChannel('quantum-system'),
            control: new BroadcastChannel('quantum-control')
        };
        
        // Performance metrics collection
        this.performanceObserver = null;
        this.memoryInterval = null;
        
        // Initialize connection
        this.init();
    }
    
    init() {
        // Set up message listeners
        this.setupMessageListeners();
        
        // Set up performance monitoring
        this.setupPerformanceMonitoring();
        
        // Set up heartbeat
        this.setupHeartbeat();
        
        // Attempt connection
        this.connect();
    }
    
    setupMessageListeners() {
        // Listen for messages from parent window (embedded mode)
        if (this.options.mode === 'embedded') {
            window.addEventListener('message', this.handleWindowMessage.bind(this));
        }
        
        // Listen on broadcast channels
        Object.entries(this.channels).forEach(([name, channel]) => {
            channel.onmessage = (event) => {
                this.handleChannelMessage(name, event.data);
            };
        });
    }
    
    handleWindowMessage(event) {
        // Validate origin if needed
        if (event.origin !== window.location.origin && event.origin !== 'null') {
            console.warn('Quantum Bridge: Ignoring message from unknown origin:', event.origin);
            return;
        }
        
        const { type, data, id } = event.data;
        
        // Handle different message types
        switch (type) {
            case 'quantum:connect':
                this.handleConnect(data);
                break;
            case 'quantum:data':
                this.handleDataUpdate(data);
                break;
            case 'quantum:response':
                this.handleResponse(id, data);
                break;
            case 'quantum:heartbeat':
                this.handleHeartbeat();
                break;
            default:
                // Pass to registered handlers
                if (this.messageHandlers.has(type)) {
                    this.messageHandlers.get(type)(data);
                }
        }
    }
    
    handleChannelMessage(channel, data) {
        // Emit channel-specific events
        this.emit(`channel:${channel}`, data);
        
        // Update last activity
        this.lastHeartbeat = Date.now();
    }
    
    setupPerformanceMonitoring() {
        // Use Performance Observer API for accurate metrics
        if ('PerformanceObserver' in window) {
            try {
                // Monitor paint events
                this.performanceObserver = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    const metrics = this.processPerformanceEntries(entries);
                    if (metrics) {
                        this.sendPerformanceData(metrics);
                    }
                });
                
                this.performanceObserver.observe({ 
                    entryTypes: ['paint', 'navigation', 'measure', 'frame'] 
                });
            } catch (e) {
                console.warn('Quantum Bridge: Performance Observer setup failed:', e);
            }
        }
        
        // Memory monitoring
        this.memoryInterval = setInterval(() => {
            if (performance.memory) {
                const memoryData = {
                    usedJSHeapSize: performance.memory.usedJSHeapSize,
                    totalJSHeapSize: performance.memory.totalJSHeapSize,
                    jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
                    timestamp: Date.now()
                };
                this.channels.performance.postMessage({
                    type: 'memory',
                    data: memoryData
                });
            }
        }, 2000);
        
        // FPS monitoring
        this.setupFPSMonitoring();
    }
    
    setupFPSMonitoring() {
        let lastTime = performance.now();
        let frames = 0;
        let fps = 0;
        
        const measureFPS = () => {
            frames++;
            const currentTime = performance.now();
            
            if (currentTime >= lastTime + 1000) {
                fps = Math.round((frames * 1000) / (currentTime - lastTime));
                frames = 0;
                lastTime = currentTime;
                
                // Send FPS data
                this.channels.performance.postMessage({
                    type: 'fps',
                    data: {
                        fps,
                        timestamp: Date.now(),
                        smooth: this.calculateSmoothedFPS(fps)
                    }
                });
            }
            
            requestAnimationFrame(measureFPS);
        };
        
        requestAnimationFrame(measureFPS);
    }
    
    calculateSmoothedFPS(currentFPS) {
        if (!this.fpsHistory) {
            this.fpsHistory = [];
        }
        
        this.fpsHistory.push(currentFPS);
        if (this.fpsHistory.length > 60) {
            this.fpsHistory.shift();
        }
        
        const sum = this.fpsHistory.reduce((a, b) => a + b, 0);
        return Math.round(sum / this.fpsHistory.length);
    }
    
    processPerformanceEntries(entries) {
        const metrics = {};
        
        entries.forEach(entry => {
            switch (entry.entryType) {
                case 'paint':
                    if (entry.name === 'first-contentful-paint') {
                        metrics.fcp = entry.startTime;
                    } else if (entry.name === 'first-paint') {
                        metrics.fp = entry.startTime;
                    }
                    break;
                case 'navigation':
                    metrics.loadTime = entry.loadEventEnd - entry.loadEventStart;
                    metrics.domContentLoaded = entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart;
                    break;
                case 'measure':
                    if (!metrics.measures) metrics.measures = {};
                    metrics.measures[entry.name] = entry.duration;
                    break;
            }
        });
        
        return Object.keys(metrics).length > 0 ? metrics : null;
    }
    
    sendPerformanceData(metrics) {
        this.channels.performance.postMessage({
            type: 'metrics',
            data: {
                ...metrics,
                timestamp: Date.now()
            }
        });
    }
    
    setupHeartbeat() {
        setInterval(() => {
            // Send heartbeat
            this.send('quantum:heartbeat', {
                timestamp: Date.now(),
                connected: this.connected
            });
            
            // Check connection health
            if (Date.now() - this.lastHeartbeat > 30000) {
                this.connected = false;
                this.reconnect();
            }
        }, 5000);
    }
    
    connect() {
        if (this.options.mode === 'embedded') {
            // Send connection request to parent
            window.parent.postMessage({
                type: 'quantum:connect',
                data: {
                    version: '1.0.0',
                    capabilities: ['performance', 'control', 'export']
                }
            }, '*');
        } else {
            // Standalone mode - mark as connected
            this.connected = true;
            this.emit('connected');
        }
        
        this.connectionAttempts++;
    }
    
    reconnect() {
        if (this.connectionAttempts < 10) {
            setTimeout(() => {
                console.log('Quantum Bridge: Attempting reconnection...');
                this.connect();
            }, this.options.reconnectInterval);
        }
    }
    
    handleConnect(data) {
        this.connected = true;
        this.connectionAttempts = 0;
        this.emit('connected', data);
        console.log('Quantum Bridge: Connected to Space Simulator');
    }
    
    handleDataUpdate(data) {
        // Route data to appropriate channel
        const { channel, payload } = data;
        if (this.channels[channel]) {
            this.channels[channel].postMessage(payload);
        }
    }
    
    handleResponse(id, data) {
        if (this.pendingRequests.has(id)) {
            const { resolve } = this.pendingRequests.get(id);
            resolve(data);
            this.pendingRequests.delete(id);
        }
    }
    
    handleHeartbeat() {
        this.lastHeartbeat = Date.now();
        this.connected = true;
    }
    
    // Send message to simulator
    send(type, data) {
        if (this.options.mode === 'embedded') {
            window.parent.postMessage({
                type,
                data,
                timestamp: Date.now()
            }, '*');
        } else {
            // In standalone mode, emit locally
            this.emit(type, data);
        }
    }
    
    // Request data from simulator with response
    async request(type, data) {
        const id = ++this.messageId;
        
        return new Promise((resolve, reject) => {
            // Set timeout
            const timeout = setTimeout(() => {
                this.pendingRequests.delete(id);
                reject(new Error('Request timeout'));
            }, this.options.messageTimeout);
            
            // Store pending request
            this.pendingRequests.set(id, {
                resolve: (data) => {
                    clearTimeout(timeout);
                    resolve(data);
                },
                reject
            });
            
            // Send request
            this.send('quantum:request', {
                id,
                type,
                data
            });
        });
    }
    
    // Control simulator from dashboard
    sendControl(action, params) {
        this.channels.control.postMessage({
            action,
            params,
            timestamp: Date.now()
        });
        
        // Also send via window message for embedded mode
        this.send('quantum:control', {
            action,
            params
        });
    }
    
    // Event emitter functionality
    on(event, handler) {
        if (!this.messageHandlers.has(event)) {
            this.messageHandlers.set(event, []);
        }
        this.messageHandlers.get(event).push(handler);
    }
    
    off(event, handler) {
        if (this.messageHandlers.has(event)) {
            const handlers = this.messageHandlers.get(event);
            const index = handlers.indexOf(handler);
            if (index > -1) {
                handlers.splice(index, 1);
            }
        }
    }
    
    emit(event, data) {
        if (this.messageHandlers.has(event)) {
            this.messageHandlers.get(event).forEach(handler => {
                try {
                    handler(data);
                } catch (e) {
                    console.error('Quantum Bridge: Handler error:', e);
                }
            });
        }
    }
    
    // Get connection status
    isConnected() {
        return this.connected;
    }
    
    // Get performance stats
    getPerformanceStats() {
        return {
            connected: this.connected,
            connectionAttempts: this.connectionAttempts,
            lastHeartbeat: this.lastHeartbeat,
            uptime: Date.now() - this.lastHeartbeat
        };
    }
    
    // Cleanup
    destroy() {
        // Remove listeners
        if (this.options.mode === 'embedded') {
            window.removeEventListener('message', this.handleWindowMessage);
        }
        
        // Close channels
        Object.values(this.channels).forEach(channel => {
            channel.close();
        });
        
        // Clear intervals
        if (this.memoryInterval) {
            clearInterval(this.memoryInterval);
        }
        
        // Disconnect observer
        if (this.performanceObserver) {
            this.performanceObserver.disconnect();
        }
    }
}

// Export for use
window.QuantumBridge = QuantumBridge;