// Quantum Dashboard Professional - Main Controller
// Enterprise-grade performance analytics for Space Travel Simulator 3D

class QuantumDashboard {
    constructor(options = {}) {
        this.options = {
            container: null,
            layout: 'overview',
            gridOptions: {
                cellHeight: 70,
                margin: 12,
                float: true,
                animate: true,
                resizable: {
                    handles: 'e, se, s, sw, w'
                },
                draggable: {
                    handle: '.quantum-panel-header'
                },
                column: 12,
                ...options.gridOptions
            },
            ...options
        };
        
        // Core components
        this.grid = null;
        this.dataCollector = null;
        this.visualizations = null;
        this.panels = null;
        this.bridge = null;
        
        // State management
        this.state = {
            currentTab: 'overview',
            panels: {},
            settings: {
                refreshRate: 1000,
                quality: 'high',
                theme: 'dark'
            },
            performance: {
                updateCount: 0,
                lastUpdate: Date.now(),
                avgUpdateTime: 0
            },
            alerts: [],
            logs: [],
            systemHealth: {
                fps: 60,
                memory: 0,
                drawCalls: 0,
                cpuLoad: 0
            }
        };
        
        // Real-time data buffers
        this.realtimeData = {
            fps: [],
            memory: [],
            drawCalls: [],
            events: [],
            performance: []
        };
        
        // Performance tracking
        this.performanceBuffer = [];
        this.maxBufferSize = 60; // 60 seconds of data at 1fps
    }
    
    // Initialize dashboard
    async init() {
        try {
            // Initialize components
            this.initializeComponents();
            
            // Setup grid
            this.initializeGrid();
            
            // Setup controls
            this.setupControls();
            
            // Setup tab navigation
            this.setupTabNavigation();
            
            // Load initial tab
            this.switchTab(this.state.currentTab);
            
            // Start data collection
            this.dataCollector.init();
            
            // Start update loop
            this.startUpdates();
            
            // Setup keyboard shortcuts
            this.setupKeyboardShortcuts();
            
            // Initialize system console
            this.initializeConsole();
            
            // Log success
            this.log('success', 'Quantum Dashboard Professional initialized');
            
        } catch (error) {
            console.error('Failed to initialize Quantum Dashboard:', error);
            this.log('error', `Initialization failed: ${error.message}`);
        }
    }
    
    // Initialize core components
    initializeComponents() {
        // Create data collector with optimized settings
        this.dataCollector = new QuantumDataCollector({
            updateInterval: 100, // 10Hz for smooth updates
            maxHistorySize: 600, // 1 minute of data at 10Hz
            bufferData: true
        });
        
        // Create visualization engine
        this.visualizations = new QuantumVisualizations();
        
        // Create panel manager
        this.panels = new QuantumPanels(this.visualizations, this.dataCollector);
        
        // Listen for data updates
        this.dataCollector.on('update', (data) => {
            this.handleDataUpdate(data);
        });
        
        // Listen for performance metrics
        this.dataCollector.on('performance:update', (data) => {
            this.updatePerformanceMetrics(data);
        });
        
        // Setup bridge for simulator connection
        this.setupBridge();
    }
    
    // Initialize GridStack
    initializeGrid() {
        if (!this.options.container) {
            throw new Error('Container element not provided');
        }
        
        // Initialize GridStack with optimized settings
        this.grid = GridStack.init(this.options.gridOptions, this.options.container);
        
        // Handle resize events for chart responsiveness
        this.grid.on('resizestop', (event, el) => {
            window.dispatchEvent(new Event('resize'));
            this.updateCharts();
        });
    }
    
    // Setup control handlers
    setupControls() {
        // Export button
        const exportBtn = document.getElementById('exportBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportData());
        }
        
        // Settings button
        const settingsBtn = document.getElementById('settingsBtn');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => this.showSettings());
        }
        
        // Close button
        const closeBtn = document.getElementById('closeBtn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.close());
        }
    }
    
    // Setup tab navigation
    setupTabNavigation() {
        const tabs = document.querySelectorAll('.quantum-tab');
        
        tabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabName = e.currentTarget.dataset.tab;
                this.switchTab(tabName);
            });
        });
    }
    
    // Switch active tab
    switchTab(tabName) {
        // Update active tab styling
        document.querySelectorAll('.quantum-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });
        
        // Update current tab state
        this.state.currentTab = tabName;
        
        // Load tab layout
        this.loadTabLayout(tabName);
        
        // Log tab switch
        this.log('info', `Switched to ${tabName} tab`);
    }
    
    // Load layout for specific tab
    loadTabLayout(tabName) {
        // Clear existing panels
        this.clearDashboard();
        
        // Get layout configuration for tab
        const layout = this.panels.getLayout(tabName);
        if (!layout) {
            console.error(`Layout not found for tab: ${tabName}`);
            return;
        }
        
        // Add panels according to layout
        layout.panels.forEach(panelConfig => {
            this.addPanel(panelConfig);
        });
        
        // Special handling for console tab
        if (tabName === 'console') {
            this.focusConsole();
        }
    }
    
    // Add a panel to the dashboard
    addPanel(config) {
        // Create grid item wrapper
        const gridItem = document.createElement('div');
        gridItem.className = 'grid-stack-item';
        gridItem.setAttribute('gs-x', config.x || 0);
        gridItem.setAttribute('gs-y', config.y || 0);
        gridItem.setAttribute('gs-w', config.w || 3);
        gridItem.setAttribute('gs-h', config.h || 3);
        gridItem.setAttribute('gs-id', config.id);
        
        // Create content wrapper
        const content = document.createElement('div');
        content.className = 'grid-stack-item-content';
        gridItem.appendChild(content);
        
        // Create panel
        this.panels.createPanel(config, content);
        
        // Add to grid with animation
        this.grid.addWidget(gridItem);
    }
    
    // Clear dashboard
    clearDashboard() {
        this.panels.clearAll();
        this.grid.removeAll();
    }
    
    // Handle data updates
    handleDataUpdate(update) {
        const startTime = performance.now();
        
        // Update state
        this.state.performance.updateCount++;
        
        // Update all panels with debouncing for performance
        requestAnimationFrame(() => {
            this.panels.updateAll(update.data);
        });
        
        // Track performance
        const updateTime = performance.now() - startTime;
        this.trackPerformance(updateTime);
    }
    
    // Update performance metrics
    updatePerformanceMetrics(data) {
        // Update system health
        this.state.systemHealth = {
            fps: data.fps || 60,
            memory: data.memory || 0,
            drawCalls: data.drawCalls || 0,
            cpuLoad: data.cpuLoad || 0
        };
        
        // Update real-time buffers
        this.updateRealtimeBuffer('fps', data.fps);
        this.updateRealtimeBuffer('memory', data.memory);
        this.updateRealtimeBuffer('drawCalls', data.drawCalls);
        
        // Check for performance issues
        this.checkPerformanceAlerts(data);
    }
    
    // Update real-time data buffer
    updateRealtimeBuffer(type, value) {
        const buffer = this.realtimeData[type];
        if (!buffer) return;
        
        buffer.push({
            value,
            timestamp: Date.now()
        });
        
        // Keep buffer size limited
        if (buffer.length > this.maxBufferSize) {
            buffer.shift();
        }
    }
    
    // Track dashboard performance
    trackPerformance(updateTime) {
        this.performanceBuffer.push(updateTime);
        
        if (this.performanceBuffer.length > 100) {
            this.performanceBuffer.shift();
        }
        
        // Calculate average
        const avgTime = this.performanceBuffer.reduce((a, b) => a + b, 0) / this.performanceBuffer.length;
        this.state.performance.avgUpdateTime = avgTime;
        
        // Log if performance degrades
        if (avgTime > 16.67) { // Below 60fps
            this.log('warning', `Dashboard update time: ${avgTime.toFixed(2)}ms`);
        }
    }
    
    // Check for performance alerts
    checkPerformanceAlerts(data) {
        // FPS Alert
        if (data.fps < 30) {
            this.log('warning', `Low FPS detected: ${data.fps.toFixed(1)} FPS`);
        }
        
        // Memory Alert
        if (data.memory > 80) {
            this.log('warning', `High memory usage: ${data.memory.toFixed(1)}%`);
        }
        
        // Draw Calls Alert
        if (data.drawCalls > 1000) {
            this.log('warning', `High draw calls: ${data.drawCalls}`);
        }
    }
    
    // Initialize system console
    initializeConsole() {
        // Add initial log entries
        this.log('info', 'System console initialized');
        this.log('success', 'Connected to Space Travel Simulator');
        this.log('info', `Dashboard mode: ${this.state.currentTab}`);
    }
    
    // Log message to console
    log(level, message) {
        const entry = {
            time: new Date().toLocaleTimeString('en-US', { hour12: false }),
            level,
            message,
            timestamp: Date.now()
        };
        
        this.state.logs.push(entry);
        
        // Keep log size limited
        if (this.state.logs.length > 1000) {
            this.state.logs.shift();
        }
        
        // Update console panel if active
        if (this.state.currentTab === 'console') {
            this.panels.updateConsole(entry);
        }
        
        // Also log to browser console
        const consoleMethod = level === 'error' ? 'error' : level === 'warning' ? 'warn' : 'log';
        console[consoleMethod](`[Quantum] ${message}`);
    }
    
    // Focus console panel
    focusConsole() {
        // Scroll to bottom of console
        const consoleBody = document.querySelector('.quantum-console-body');
        if (consoleBody) {
            consoleBody.scrollTop = consoleBody.scrollHeight;
        }
    }
    
    // Start update loop
    startUpdates() {
        // Use requestAnimationFrame for smooth updates
        const update = () => {
            if (this.state.settings.refreshRate > 0) {
                this.refresh();
                setTimeout(() => {
                    requestAnimationFrame(update);
                }, this.state.settings.refreshRate);
            }
        };
        
        requestAnimationFrame(update);
    }
    
    // Refresh dashboard
    refresh() {
        // Collect latest data
        this.dataCollector.collect();
        
        // Update charts if needed
        if (Date.now() - this.lastChartUpdate > 1000) {
            this.updateCharts();
            this.lastChartUpdate = Date.now();
        }
    }
    
    // Update all charts
    updateCharts() {
        this.panels.updateCharts();
    }
    
    // Setup keyboard shortcuts
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Tab switching with number keys
            if (e.key >= '1' && e.key <= '6' && !e.ctrlKey && !e.metaKey && !e.altKey) {
                const tabs = ['overview', 'product', 'technical', 'design', 'console', 'ai'];
                const index = parseInt(e.key) - 1;
                if (tabs[index]) {
                    this.switchTab(tabs[index]);
                }
            }
            
            // Ctrl/Cmd + E for export
            if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
                e.preventDefault();
                this.exportData();
            }
            
            // ESC to close
            if (e.key === 'Escape') {
                this.close();
            }
        });
    }
    
    // Setup bridge connection
    setupBridge() {
        // Connect to simulator if available
        if (window.opener || window.parent !== window) {
            this.bridge = this.dataCollector.bridge;
            this.log('success', 'Connected to Space Simulator');
        }
    }
    
    // Export dashboard data
    exportData() {
        const exportData = {
            metadata: {
                version: '3.0',
                timestamp: Date.now(),
                dashboard: 'Quantum Dashboard Professional',
                tab: this.state.currentTab
            },
            systemHealth: this.state.systemHealth,
            performance: {
                avgUpdateTime: this.state.performance.avgUpdateTime,
                updateCount: this.state.performance.updateCount
            },
            data: this.dataCollector.getSnapshot(),
            logs: this.state.logs.slice(-100) // Last 100 log entries
        };
        
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
            type: 'application/json' 
        });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `quantum-dashboard-export-${Date.now()}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
        this.log('success', 'Dashboard data exported');
    }
    
    // Show settings dialog
    showSettings() {
        // TODO: Implement settings modal
        this.log('info', 'Settings dialog requested');
    }
    
    // Close dashboard
    close() {
        if (window.opener) {
            window.close();
        } else {
            this.log('info', 'Dashboard close requested');
        }
    }
    
    // Get current statistics
    getStatistics() {
        return {
            uptime: Date.now() - this.startTime,
            updateCount: this.state.performance.updateCount,
            avgUpdateTime: this.state.performance.avgUpdateTime,
            systemHealth: this.state.systemHealth,
            activeTab: this.state.currentTab,
            logCount: this.state.logs.length
        };
    }
    
    // Cleanup
    destroy() {
        // Stop updates
        this.state.settings.refreshRate = 0;
        
        // Destroy components
        if (this.dataCollector) {
            this.dataCollector.destroy();
        }
        
        if (this.panels) {
            this.panels.clearAll();
        }
        
        if (this.grid) {
            this.grid.destroy();
        }
        
        this.log('info', 'Dashboard destroyed');
    }
}

// Export for global use
window.QuantumDashboard = QuantumDashboard;