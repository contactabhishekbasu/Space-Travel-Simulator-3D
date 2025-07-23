// Enhanced Performance Dashboard - Product + Technical + Design perspectives
class PerformanceDashboard {
    constructor() {
        this.isVisible = false;
        this.updateInterval = 1000; // 1 second updates
        this.charts = {};
        this.activeTab = 'overview';
        
        // Product Manager Metrics
        this.productMetrics = {
            userEngagement: {
                sessionStart: Date.now(),
                totalInteractions: 0,
                planetViews: {},
                featuresUsed: {},
                navigationPattern: [],
                timeSpentPerFeature: {}
            },
            userExperience: {
                smoothFrames: 0,
                choppyFrames: 0,
                loadingTimes: [],
                errorImpactEvents: [],
                frustrationScore: 0
            }
        };
        
        // Technical Manager Metrics
        this.technicalMetrics = {
            performance: {
                fps: [],
                frameTime: [],
                renderTime: [],
                cpuUsage: [],
                gpuUsage: []
            },
            memory: {
                heapUsed: [],
                heapTotal: [],
                heapLimit: [],
                textureMemory: [],
                geometryMemory: [],
                bufferMemory: []
            },
            rendering: {
                drawCalls: [],
                triangles: [],
                vertices: [],
                shaderSwitches: [],
                textureBinds: [],
                culledObjects: []
            },
            javascript: {
                executionTime: [],
                gcPauses: [],
                domNodes: [],
                eventListeners: []
            },
            network: {
                assetLoadTimes: {},
                failedRequests: [],
                cacheHitRate: [],
                bandwidthUsage: []
            }
        };
        
        // System state tracking
        this.systemState = {
            startTime: performance.now(),
            totalFrames: 0,
            errorCount: 0,
            warningCount: 0,
            lastGCTime: 0,
            peakMemoryUsage: 0
        };
        
        // Health thresholds for color coding
        this.healthThresholds = {
            fps: { excellent: 55, good: 45, warning: 30, critical: 15 },
            memory: { excellent: 256, good: 512, warning: 1024, critical: 2048 },
            frameTime: { excellent: 16, good: 22, warning: 33, critical: 50 },
            cacheHit: { excellent: 85, good: 70, warning: 50, critical: 30 },
            userEngagement: { excellent: 300, good: 120, warning: 60, critical: 30 } // seconds
        };
        
        this.createDashboard();
        this.startMonitoring();
        
        console.log('Enhanced Performance Dashboard: Initialized with Product + Technical + Design metrics');
    }
    
    createDashboard() {
        // Create dashboard container
        const dashboard = document.createElement('div');
        dashboard.id = 'performance-dashboard';
        dashboard.className = 'performance-dashboard hidden';
        dashboard.innerHTML = this.getDashboardHTML();
        document.body.appendChild(dashboard);
        
        // Add enhanced CSS
        this.addDashboardCSS();
        
        // Initialize charts
        this.initializeCharts();
        
        // Add event listeners
        this.addEventListeners();
        
        console.log('Enhanced Performance Dashboard: Multi-perspective UI created');
    }
    
    getDashboardHTML() {
        return `
            <div class="dashboard-header">
                <div class="dashboard-title">
                    <h2>🚀 Space Simulator Analytics Dashboard</h2>
                    <div class="dashboard-controls">
                        <button id="dashboard-refresh" class="btn-control" title="Refresh Data">🔄</button>
                        <button id="dashboard-export" class="btn-control" title="Export Report">📊</button>
                        <button id="dashboard-fullscreen" class="btn-control" title="Toggle Fullscreen">⛶</button>
                        <button id="dashboard-close" class="btn-control" title="Close">✕</button>
                    </div>
                </div>
                <div class="dashboard-status">
                    <div class="status-indicator" id="overall-status">
                        <span class="status-dot excellent"></span>
                        <span class="status-text">System Healthy</span>
                    </div>
                    <div class="session-info">
                        <span class="uptime">Session: <span id="session-time">00:00:00</span></span>
                        <span class="interactions">Interactions: <span id="total-interactions">0</span></span>
                    </div>
                </div>
            </div>
            
            <!-- Tab Navigation -->
            <div class="dashboard-tabs">
                <button class="tab-button active" data-tab="overview">📊 Overview</button>
                <button class="tab-button" data-tab="product">👤 User Experience</button>
                <button class="tab-button" data-tab="technical">⚙️ Technical Performance</button>
                <button class="tab-button" data-tab="console">🖥️ Space Console</button>
                <button class="tab-button" data-tab="insights">💡 Insights</button>
            </div>
            
            <div class="dashboard-content">
                <!-- Overview Tab -->
                <div class="tab-content active" id="overview-tab">
                    ${this.getOverviewTabHTML()}
                </div>
                
                <!-- Product/UX Tab -->
                <div class="tab-content" id="product-tab">
                    ${this.getProductTabHTML()}
                </div>
                
                <!-- Technical Tab -->
                <div class="tab-content" id="technical-tab">
                    ${this.getTechnicalTabHTML()}
                </div>
                
                <!-- Space Console Tab -->
                <div class="tab-content" id="console-tab">
                    ${this.getConsoleTabHTML()}
                </div>
                
                <!-- Insights Tab -->
                <div class="tab-content" id="insights-tab">
                    ${this.getInsightsTabHTML()}
                </div>
            </div>
        `;
    }
    
    getOverviewTabHTML() {
        return `
            <!-- Critical KPIs Row -->
            <div class="dashboard-row kpi-row">
                <div class="panel kpi-panel">
                    <div class="panel-header">
                        <h3>🎯 Critical Health Indicators</h3>
                        <div class="metric-explanation">Real-time system health at a glance</div>
                    </div>
                    <div class="kpi-grid">
                        <div class="kpi-card" data-tooltip="Frames rendered per second - Higher is smoother">
                            <div class="kpi-icon">🎮</div>
                            <div class="kpi-label">Performance FPS</div>
                            <div class="kpi-value excellent" id="kpi-fps">60</div>
                            <div class="kpi-trend" id="kpi-fps-trend">📈</div>
                        </div>
                        <div class="kpi-card" data-tooltip="Memory used by the application - Lower is better">
                            <div class="kpi-icon">🧠</div>
                            <div class="kpi-label">Memory Usage</div>
                            <div class="kpi-value good" id="kpi-memory">128 MB</div>
                            <div class="kpi-trend" id="kpi-memory-trend">📊</div>
                        </div>
                        <div class="kpi-card" data-tooltip="User engagement level - Time actively using the app">
                            <div class="kpi-icon">👤</div>
                            <div class="kpi-label">User Engagement</div>
                            <div class="kpi-value excellent" id="kpi-engagement">High</div>
                            <div class="kpi-trend" id="kpi-engagement-trend">📈</div>
                        </div>
                        <div class="kpi-card" data-tooltip="System errors affecting user experience">
                            <div class="kpi-icon">🚨</div>
                            <div class="kpi-label">Error Rate</div>
                            <div class="kpi-value excellent" id="kpi-errors">0.1%</div>
                            <div class="kpi-trend" id="kpi-errors-trend">📉</div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Performance Overview -->
            <div class="dashboard-row">
                <div class="panel chart-panel">
                    <div class="panel-header">
                        <h3>📈 Performance Trend</h3>
                        <div class="metric-explanation">FPS and frame time over the last 5 minutes</div>
                    </div>
                    <div class="chart-container">
                        <canvas id="overview-performance-chart"></canvas>
                    </div>
                </div>
                
                <div class="panel chart-panel">
                    <div class="panel-header">
                        <h3>🧠 Memory Overview</h3>
                        <div class="metric-explanation">Memory usage breakdown by category</div>
                    </div>
                    <div class="chart-container">
                        <canvas id="overview-memory-chart"></canvas>
                    </div>
                </div>
            </div>
        `;
    }
    
    getProductTabHTML() {
        return `
            <!-- User Engagement Metrics -->
            <div class="dashboard-row">
                <div class="panel metric-panel">
                    <div class="panel-header">
                        <h3>👤 User Engagement Analytics</h3>
                        <div class="metric-explanation">How users interact with your space simulator</div>
                    </div>
                    <div class="metric-grid">
                        <div class="metric-card">
                            <div class="metric-label">Session Duration</div>
                            <div class="metric-value" id="session-duration">0m 0s</div>
                            <div class="metric-desc">Time spent in current session</div>
                        </div>
                        <div class="metric-card">
                            <div class="metric-label">Total Interactions</div>
                            <div class="metric-value" id="total-user-interactions">0</div>
                            <div class="metric-desc">Clicks, drags, and navigation actions</div>
                        </div>
                        <div class="metric-card">
                            <div class="metric-label">Features Used</div>
                            <div class="metric-value" id="features-used-count">0</div>
                            <div class="metric-desc">Unique features accessed this session</div>
                        </div>
                        <div class="metric-card">
                            <div class="metric-label">Experience Quality</div>
                            <div class="metric-value excellent" id="experience-quality">Excellent</div>
                            <div class="metric-desc">Based on smooth performance and low errors</div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Feature Usage -->
            <div class="dashboard-row">
                <div class="panel chart-panel">
                    <div class="panel-header">
                        <h3>🎯 Most Popular Celestial Objects</h3>
                        <div class="metric-explanation">Which space objects users explore most</div>
                    </div>
                    <div class="chart-container">
                        <canvas id="popular-objects-chart"></canvas>
                    </div>
                </div>
                
                <div class="panel chart-panel">
                    <div class="panel-header">
                        <h3>🛠️ Feature Adoption</h3>
                        <div class="metric-explanation">Which controls and features users actually use</div>
                    </div>
                    <div class="chart-container">
                        <canvas id="feature-usage-chart"></canvas>
                    </div>
                </div>
            </div>
            
            <!-- User Journey -->
            <div class="dashboard-row">
                <div class="panel journey-panel">
                    <div class="panel-header">
                        <h3>🗺️ User Journey</h3>
                        <div class="metric-explanation">Navigation pattern through the solar system</div>
                    </div>
                    <div class="journey-timeline" id="user-journey">
                        <!-- Dynamic journey timeline will be populated here -->
                    </div>
                </div>
            </div>
        `;
    }
    
    getTechnicalTabHTML() {
        return `
            <!-- System Performance -->
            <div class="dashboard-row">
                <div class="panel chart-panel">
                    <div class="panel-header">
                        <h3>⚡ Rendering Performance</h3>
                        <div class="metric-explanation">GPU and rendering pipeline metrics</div>
                    </div>
                    <div class="chart-container">
                        <canvas id="rendering-chart"></canvas>
                    </div>
                </div>
                
                <div class="panel chart-panel">
                    <div class="panel-header">
                        <h3>🧠 Memory Breakdown</h3>
                        <div class="metric-explanation">Detailed memory usage by component</div>
                    </div>
                    <div class="chart-container">
                        <canvas id="memory-breakdown-chart"></canvas>
                    </div>
                </div>
            </div>
            
            <!-- Technical KPIs -->
            <div class="dashboard-row">
                <div class="panel technical-kpi-panel">
                    <div class="panel-header">
                        <h3>🔧 Technical Metrics</h3>
                        <div class="metric-explanation">Detailed performance indicators for optimization</div>
                    </div>
                    <div class="technical-metrics-grid">
                        <div class="tech-metric">
                            <div class="tech-label">Draw Calls</div>
                            <div class="tech-value" id="draw-calls">0</div>
                            <div class="tech-desc">Number of GPU draw operations per frame</div>
                        </div>
                        <div class="tech-metric">
                            <div class="tech-label">Triangles</div>
                            <div class="tech-value" id="triangle-count">0</div>
                            <div class="tech-desc">Total triangles rendered per frame</div>
                        </div>
                        <div class="tech-metric">
                            <div class="tech-label">Texture Memory</div>
                            <div class="tech-value" id="texture-memory">0 MB</div>
                            <div class="tech-desc">GPU memory used by textures</div>
                        </div>
                        <div class="tech-metric">
                            <div class="tech-label">JavaScript Heap</div>
                            <div class="tech-value" id="js-heap">0 MB</div>
                            <div class="tech-desc">Memory used by JavaScript objects</div>
                        </div>
                        <div class="tech-metric">
                            <div class="tech-label">Cache Hit Rate</div>
                            <div class="tech-value" id="cache-hit-rate">0%</div>
                            <div class="tech-desc">Percentage of cached asset requests</div>
                        </div>
                        <div class="tech-metric">
                            <div class="tech-label">Network Latency</div>
                            <div class="tech-value" id="network-latency">0ms</div>
                            <div class="tech-desc">Average asset loading time</div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Debug Information -->
            <div class="dashboard-row">
                <div class="panel debug-panel">
                    <div class="panel-header">
                        <h3>🐛 Debug Information</h3>
                        <div class="metric-explanation">Technical details for troubleshooting</div>
                    </div>
                    <div class="debug-info" id="debug-info">
                        <!-- Debug information will be populated here -->
                    </div>
                </div>
            </div>
        `;
    }
    
    getConsoleTabHTML() {
        return `
            <div class="dashboard-row console-row">
                <div class="panel console-panel">
                    <div class="panel-header">
                        <h3>🖥️ Space Console Logs</h3>
                        <div class="metric-explanation">All system logs and debug information from your space exploration</div>
                        <div class="console-controls">
                            <button class="btn-console" id="console-clear-btn">Clear</button>
                            <button class="btn-console" id="console-export-btn">Export</button>
                            <select id="console-filter">
                                <option value="all">All Logs</option>
                                <option value="error">Errors Only</option>
                                <option value="warning">Warnings Only</option>
                                <option value="success">Success Only</option>
                                <option value="info">Info Only</option>
                            </select>
                        </div>
                    </div>
                    <div class="console-content" id="dashboard-console-content">
                        <div class="console-loading">Loading console logs...</div>
                    </div>
                </div>
            </div>
        `;
    }
    
    getInsightsTabHTML() {
        return `
            <div class="dashboard-row insights-row">
                <div class="panel insights-panel">
                    <div class="panel-header">
                        <h3>💡 Performance Insights</h3>
                        <div class="metric-explanation">AI-powered recommendations to improve your space simulator</div>
                    </div>
                    <div class="insights-content" id="insights-content">
                        <!-- Insights will be generated here -->
                    </div>
                </div>
            </div>
            
            <div class="dashboard-row">
                <div class="panel optimization-panel">
                    <div class="panel-header">
                        <h3>🚀 Optimization Recommendations</h3>
                        <div class="metric-explanation">Specific actions to improve performance</div>
                    </div>
                    <div class="optimization-list" id="optimization-recommendations">
                        <!-- Recommendations will be populated here -->
                    </div>
                </div>
            </div>
        `;
    }
    
    addDashboardCSS() {
        const existingStyle = document.getElementById('dashboard-styles');
        if (existingStyle) existingStyle.remove();
        
        const style = document.createElement('style');
        style.id = 'dashboard-styles';
        style.textContent = `
            .performance-dashboard {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 95vw;
                height: 90vh;
                max-width: 1600px;
                max-height: 1000px;
                background: linear-gradient(135deg, rgba(10, 15, 30, 0.95), rgba(20, 25, 40, 0.95));
                border: 2px solid rgba(55, 178, 77, 0.3);
                border-radius: 15px;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8);
                z-index: 10000;
                backdrop-filter: blur(20px);
                color: #e0e0e0;
                font-family: 'Segoe UI', system-ui, sans-serif;
                display: flex;
                flex-direction: column;
                overflow: hidden;
            }
            
            .performance-dashboard.hidden {
                display: none;
            }
            
            .dashboard-header {
                padding: 20px 25px;
                border-bottom: 1px solid rgba(55, 178, 77, 0.2);
                background: rgba(0, 0, 0, 0.3);
            }
            
            .dashboard-title {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 10px;
            }
            
            .dashboard-title h2 {
                margin: 0;
                color: #37b24d;
                font-size: 24px;
                font-weight: 600;
            }
            
            .dashboard-controls {
                display: flex;
                gap: 10px;
            }
            
            .btn-control {
                background: rgba(55, 178, 77, 0.2);
                border: 1px solid rgba(55, 178, 77, 0.4);
                color: #37b24d;
                padding: 8px 12px;
                border-radius: 6px;
                cursor: pointer;
                transition: all 0.3s ease;
                font-size: 14px;
            }
            
            .btn-control:hover {
                background: rgba(55, 178, 77, 0.3);
                transform: translateY(-2px);
            }
            
            .dashboard-status {
                display: flex;
                justify-content: space-between;
                align-items: center;
                font-size: 14px;
            }
            
            .status-indicator {
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            .status-dot {
                width: 12px;
                height: 12px;
                border-radius: 50%;
                animation: pulse 2s infinite;
            }
            
            .status-dot.excellent { background: #37b24d; }
            .status-dot.good { background: #51cf66; }
            .status-dot.warning { background: #ffd43b; }
            .status-dot.critical { background: #ff6b6b; }
            
            @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.6; }
            }
            
            .session-info {
                display: flex;
                gap: 20px;
                color: #a0a0a0;
            }
            
            .dashboard-tabs {
                display: flex;
                background: rgba(0, 0, 0, 0.2);
                border-bottom: 1px solid rgba(55, 178, 77, 0.2);
            }
            
            .tab-button {
                background: none;
                border: none;
                color: #a0a0a0;
                padding: 15px 25px;
                cursor: pointer;
                transition: all 0.3s ease;
                border-bottom: 3px solid transparent;
                font-size: 14px;
                font-weight: 500;
            }
            
            .tab-button:hover {
                color: #37b24d;
                background: rgba(55, 178, 77, 0.1);
            }
            
            .tab-button.active {
                color: #37b24d;
                border-bottom-color: #37b24d;
                background: rgba(55, 178, 77, 0.15);
            }
            
            .dashboard-content {
                flex: 1;
                overflow-y: auto;
                padding: 0;
            }
            
            .tab-content {
                display: none;
                padding: 20px;
                height: 100%;
                overflow-y: auto;
            }
            
            .tab-content.active {
                display: block;
            }
            
            .dashboard-row {
                display: flex;
                gap: 20px;
                margin-bottom: 20px;
                min-height: 200px;
            }
            
            .dashboard-row.kpi-row {
                min-height: auto;
            }
            
            .panel {
                background: rgba(0, 0, 0, 0.4);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 10px;
                padding: 0;
                flex: 1;
                backdrop-filter: blur(10px);
            }
            
            .panel-header {
                padding: 15px 20px;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                background: rgba(255, 255, 255, 0.05);
                border-radius: 10px 10px 0 0;
            }
            
            .panel-header h3 {
                margin: 0 0 5px 0;
                color: #37b24d;
                font-size: 16px;
                font-weight: 600;
            }
            
            .metric-explanation {
                font-size: 12px;
                color: #a0a0a0;
                margin: 0;
            }
            
            .kpi-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 15px;
                padding: 20px;
            }
            
            .kpi-card {
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 8px;
                padding: 20px;
                text-align: center;
                transition: all 0.3s ease;
                cursor: pointer;
            }
            
            .kpi-card:hover {
                transform: translateY(-3px);
                box-shadow: 0 10px 30px rgba(55, 178, 77, 0.2);
            }
            
            .kpi-icon {
                font-size: 24px;
                margin-bottom: 10px;
            }
            
            .kpi-label {
                font-size: 12px;
                color: #a0a0a0;
                margin-bottom: 8px;
            }
            
            .kpi-value {
                font-size: 24px;
                font-weight: bold;
                margin-bottom: 5px;
            }
            
            .kpi-value.excellent { color: #37b24d; }
            .kpi-value.good { color: #51cf66; }
            .kpi-value.warning { color: #ffd43b; }
            .kpi-value.critical { color: #ff6b6b; }
            
            .kpi-trend {
                font-size: 14px;
            }
            
            .chart-container {
                padding: 20px;
                height: 300px;
                position: relative;
            }
            
            .chart-container canvas {
                width: 100% !important;
                height: 100% !important;
            }
            
            .console-content {
                height: 500px;
                overflow-y: auto;
                padding: 20px;
                font-family: 'Courier New', monospace;
                font-size: 12px;
                background: rgba(0, 0, 0, 0.6);
                border-radius: 0 0 10px 10px;
            }
            
            .console-loading {
                text-align: center;
                color: #a0a0a0;
                padding: 50px;
            }
            
            .metric-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 15px;
                padding: 20px;
            }
            
            .metric-card {
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 8px;
                padding: 20px;
                text-align: center;
            }
            
            .metric-label {
                font-size: 14px;
                color: #37b24d;
                margin-bottom: 10px;
                font-weight: 600;
            }
            
            .metric-value {
                font-size: 28px;
                font-weight: bold;
                margin-bottom: 8px;
                color: #e0e0e0;
            }
            
            .metric-desc {
                font-size: 11px;
                color: #a0a0a0;
                line-height: 1.4;
            }
            
            /* Scrollbar styling */
            .dashboard-content::-webkit-scrollbar,
            .console-content::-webkit-scrollbar {
                width: 8px;
            }
            
            .dashboard-content::-webkit-scrollbar-track,
            .console-content::-webkit-scrollbar-track {
                background: rgba(0, 0, 0, 0.3);
            }
            
            .dashboard-content::-webkit-scrollbar-thumb,
            .console-content::-webkit-scrollbar-thumb {
                background: rgba(55, 178, 77, 0.5);
                border-radius: 4px;
            }
            
            .console-controls {
                display: flex;
                gap: 10px;
                margin-left: auto;
            }
            
            .btn-console {
                background: rgba(55, 178, 77, 0.2);
                border: 1px solid rgba(55, 178, 77, 0.4);
                color: #37b24d;
                padding: 5px 10px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 12px;
            }
            
            .btn-console:hover {
                background: rgba(55, 178, 77, 0.3);
            }
            
            #console-filter {
                background: rgba(0, 0, 0, 0.5);
                border: 1px solid rgba(55, 178, 77, 0.4);
                color: #e0e0e0;
                padding: 5px 10px;
                border-radius: 4px;
                font-size: 12px;
            }
            
            .console-entry {
                padding: 5px 0;
                border-bottom: 1px solid rgba(255, 255, 255, 0.05);
                font-family: 'Courier New', monospace;
                font-size: 11px;
                line-height: 1.4;
            }
            
            .console-entry.success { color: #37b24d; }
            .console-entry.error { color: #ff6b6b; }
            .console-entry.warning { color: #ffd43b; }
            .console-entry.info { color: #e0e0e0; }
            
            .console-timestamp {
                color: #a0a0a0;
                margin-right: 10px;
            }
            
            .console-message {
                color: inherit;
            }
            
            .console-empty {
                text-align: center;
                color: #a0a0a0;
                padding: 50px 20px;
                font-style: italic;
            }
            
            .technical-metrics-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 15px;
                padding: 20px;
            }
            
            .tech-metric {
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 8px;
                padding: 15px;
                text-align: center;
            }
            
            .tech-label {
                font-size: 12px;
                color: #37b24d;
                margin-bottom: 8px;
                font-weight: 600;
            }
            
            .tech-value {
                font-size: 20px;
                font-weight: bold;
                margin-bottom: 5px;
                color: #e0e0e0;
            }
            
            .tech-desc {
                font-size: 10px;
                color: #a0a0a0;
                line-height: 1.3;
            }
        `;
        
        document.head.appendChild(style);
    }
    
    initializeCharts() {
        // Initialize charts when Chart.js is available
        if (typeof Chart === 'undefined') {
            setTimeout(() => this.initializeCharts(), 100);
            return;
        }
        
        // Chart configurations will be added here
        this.createOverviewCharts();
        this.createProductCharts();
        this.createTechnicalCharts();
    }
    
    createOverviewCharts() {
        // Performance overview chart with FPS and Frame Time
        const perfCtx = document.getElementById('overview-performance-chart')?.getContext('2d');
        if (perfCtx) {
            this.charts.overviewPerformance = new Chart(perfCtx, {
                type: 'line',
                data: {
                    labels: [],
                    datasets: [{
                        label: 'FPS',
                        data: [],
                        borderColor: '#37b24d',
                        backgroundColor: 'rgba(55, 178, 77, 0.1)',
                        tension: 0.4,
                        yAxisID: 'y-fps'
                    }, {
                        label: 'Frame Time (ms)',
                        data: [],
                        borderColor: '#ffd43b',
                        backgroundColor: 'rgba(255, 212, 59, 0.1)',
                        tension: 0.4,
                        yAxisID: 'y-frametime'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { 
                            display: true,
                            labels: { color: '#e0e0e0' }
                        },
                        tooltip: { 
                            mode: 'index',
                            intersect: false 
                        }
                    },
                    scales: {
                        'y-fps': { 
                            type: 'linear',
                            display: true,
                            position: 'left',
                            beginAtZero: true,
                            max: 120,
                            grid: { color: 'rgba(255, 255, 255, 0.1)' },
                            ticks: { color: '#37b24d' },
                            title: {
                                display: true,
                                text: 'FPS',
                                color: '#37b24d'
                            }
                        },
                        'y-frametime': {
                            type: 'linear',
                            display: true,
                            position: 'right',
                            beginAtZero: true,
                            max: 50,
                            grid: { drawOnChartArea: false },
                            ticks: { color: '#ffd43b' },
                            title: {
                                display: true,
                                text: 'Frame Time (ms)',
                                color: '#ffd43b'
                            }
                        },
                        x: {
                            grid: { color: 'rgba(255, 255, 255, 0.1)' },
                            ticks: { color: '#a0a0a0' }
                        }
                    }
                }
            });
        }
        
        // Memory overview chart
        const memCtx = document.getElementById('overview-memory-chart')?.getContext('2d');
        if (memCtx) {
            this.charts.overviewMemory = new Chart(memCtx, {
                type: 'doughnut',
                data: {
                    labels: ['JavaScript Heap', 'Textures', 'Geometries', 'Other'],
                    datasets: [{
                        data: [0, 0, 0, 0],
                        backgroundColor: [
                            '#37b24d',
                            '#ff6b6b',
                            '#4dabf7',
                            '#ffd43b'
                        ]
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { 
                            position: 'bottom',
                            labels: { color: '#e0e0e0' }
                        }
                    }
                }
            });
        }
    }
    
    createProductCharts() {
        // Popular objects chart
        const objCtx = document.getElementById('popular-objects-chart')?.getContext('2d');
        if (objCtx) {
            this.charts.popularObjects = new Chart(objCtx, {
                type: 'bar',
                data: {
                    labels: [],
                    datasets: [{
                        label: 'Views',
                        data: [],
                        backgroundColor: '#37b24d'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: { color: 'rgba(255, 255, 255, 0.1)' },
                            ticks: { color: '#a0a0a0' }
                        },
                        x: {
                            grid: { color: 'rgba(255, 255, 255, 0.1)' },
                            ticks: { color: '#a0a0a0' }
                        }
                    }
                }
            });
        }
        
        // Feature usage chart
        const featureCtx = document.getElementById('feature-usage-chart')?.getContext('2d');
        if (featureCtx) {
            this.charts.featureUsage = new Chart(featureCtx, {
                type: 'doughnut',
                data: {
                    labels: [],
                    datasets: [{
                        data: [],
                        backgroundColor: [
                            '#37b24d',
                            '#339af0',
                            '#ff6b6b',
                            '#ffd43b',
                            '#69db7c',
                            '#ff8e8e'
                        ]
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: { color: '#e0e0e0' }
                        }
                    }
                }
            });
        }
    }
    
    createTechnicalCharts() {
        // Rendering performance chart
        const renderCtx = document.getElementById('rendering-chart')?.getContext('2d');
        if (renderCtx) {
            this.charts.rendering = new Chart(renderCtx, {
                type: 'line',
                data: {
                    labels: [],
                    datasets: [{
                        label: 'Draw Calls',
                        data: [],
                        borderColor: '#37b24d',
                        backgroundColor: 'rgba(55, 178, 77, 0.1)',
                        tension: 0.4
                    }, {
                        label: 'Triangles (thousands)',
                        data: [],
                        borderColor: '#339af0',
                        backgroundColor: 'rgba(51, 154, 240, 0.1)',
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: true,
                            labels: { color: '#e0e0e0' }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: { color: 'rgba(255, 255, 255, 0.1)' },
                            ticks: { color: '#a0a0a0' }
                        },
                        x: {
                            grid: { color: 'rgba(255, 255, 255, 0.1)' },
                            ticks: { color: '#a0a0a0' }
                        }
                    }
                }
            });
        }
        
        // Memory breakdown chart
        const memBreakCtx = document.getElementById('memory-breakdown-chart')?.getContext('2d');
        if (memBreakCtx) {
            this.charts.memoryBreakdown = new Chart(memBreakCtx, {
                type: 'line',
                data: {
                    labels: [],
                    datasets: [{
                        label: 'JS Heap (MB)',
                        data: [],
                        borderColor: '#37b24d',
                        backgroundColor: 'rgba(55, 178, 77, 0.1)',
                        tension: 0.4
                    }, {
                        label: 'Textures',
                        data: [],
                        borderColor: '#ff6b6b',
                        backgroundColor: 'rgba(255, 107, 107, 0.1)',
                        tension: 0.4
                    }, {
                        label: 'Geometries',
                        data: [],
                        borderColor: '#339af0',
                        backgroundColor: 'rgba(51, 154, 240, 0.1)',
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: true,
                            labels: { color: '#e0e0e0' }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: { color: 'rgba(255, 255, 255, 0.1)' },
                            ticks: { color: '#a0a0a0' }
                        },
                        x: {
                            grid: { color: 'rgba(255, 255, 255, 0.1)' },
                            ticks: { color: '#a0a0a0' }
                        }
                    }
                }
            });
        }
    }
    
    addEventListeners() {
        // Tab switching
        document.querySelectorAll('.tab-button').forEach(button => {
            button.addEventListener('click', (e) => {
                const tabName = e.target.dataset.tab;
                this.switchTab(tabName);
            });
        });
        
        // Control buttons
        document.getElementById('dashboard-close')?.addEventListener('click', () => this.hide());
        document.getElementById('dashboard-refresh')?.addEventListener('click', () => this.refreshData());
        document.getElementById('dashboard-export')?.addEventListener('click', () => this.exportReport());
        document.getElementById('dashboard-fullscreen')?.addEventListener('click', () => this.toggleFullscreen());
        
        // Console controls
        document.getElementById('console-clear-btn')?.addEventListener('click', () => this.clearConsole());
        document.getElementById('console-export-btn')?.addEventListener('click', () => this.exportConsole());
        document.getElementById('console-filter')?.addEventListener('change', (e) => this.filterConsole(e.target.value));
    }
    
    switchTab(tabName) {
        // Hide all tabs
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelectorAll('.tab-button').forEach(button => {
            button.classList.remove('active');
        });
        
        // Show selected tab
        document.getElementById(tabName + '-tab')?.classList.add('active');
        document.querySelector(`[data-tab="${tabName}"]`)?.classList.add('active');
        
        this.activeTab = tabName;
        
        // Update console content if switching to console tab
        if (tabName === 'console') {
            this.updateConsoleTab();
        }
        
        // Generate insights if switching to insights tab
        if (tabName === 'insights') {
            this.generateInsights();
        }
    }
    
    updateConsoleTab() {
        const consoleContent = document.getElementById('dashboard-console-content');
        if (!consoleContent) return;
        
        // Get logs from the main dev console
        const logs = window.devLogs || [];
        
        // Apply current filter
        const filter = document.getElementById('console-filter')?.value || 'all';
        const filteredLogs = filter === 'all' ? logs : logs.filter(log => log.type === filter);
        
        let html = '';
        filteredLogs.forEach(log => {
            const timeStr = new Date(log.fullTime).toLocaleTimeString();
            html += `
                <div class="console-entry ${log.type}">
                    <span class="console-timestamp">[${timeStr}]</span>
                    <span class="console-message">${this.escapeHtml(log.message)}</span>
                </div>
            `;
        });
        
        if (html === '') {
            html = '<div class="console-empty">No logs available. Start interacting with the space simulator to see logs.</div>';
        }
        
        consoleContent.innerHTML = html;
        consoleContent.scrollTop = consoleContent.scrollHeight;
    }
    
    escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
    
    generateInsights() {
        const insightsContent = document.getElementById('insights-content');
        const optimizationList = document.getElementById('optimization-recommendations');
        
        if (!insightsContent || !optimizationList) return;
        
        // Generate insights based on current metrics
        const insights = this.analyzePerformance();
        
        insightsContent.innerHTML = insights.insights.map(insight => `
            <div class="insight-card ${insight.severity}">
                <div class="insight-icon">${insight.icon}</div>
                <div class="insight-content">
                    <h4>${insight.title}</h4>
                    <p>${insight.description}</p>
                </div>
            </div>
        `).join('');
        
        optimizationList.innerHTML = insights.recommendations.map(rec => `
            <div class="optimization-item">
                <div class="optimization-priority ${rec.priority}">${rec.priority.toUpperCase()}</div>
                <div class="optimization-text">
                    <strong>${rec.title}</strong>
                    <p>${rec.description}</p>
                </div>
            </div>
        `).join('');
    }
    
    analyzePerformance() {
        // Analyze current performance and generate insights
        const avgFps = this.getAverageFPS();
        const memoryUsage = this.getCurrentMemoryUsage();
        const sessionTime = (Date.now() - this.productMetrics.userEngagement.sessionStart) / 1000;
        
        const insights = [];
        const recommendations = [];
        
        // FPS Analysis
        if (avgFps < this.healthThresholds.fps.warning) {
            insights.push({
                severity: 'warning',
                icon: '⚠️',
                title: 'Performance Issues Detected',
                description: `Your frame rate is averaging ${avgFps.toFixed(1)} FPS, which may cause choppy animations. Consider reducing visual quality settings.`
            });
            recommendations.push({
                priority: 'high',
                title: 'Reduce Visual Quality',
                description: 'Switch to low texture quality mode or disable some visual effects to improve performance.'
            });
        } else if (avgFps > this.healthThresholds.fps.excellent) {
            insights.push({
                severity: 'success',
                icon: '✅',
                title: 'Excellent Performance',
                description: `Your system is running smoothly at ${avgFps.toFixed(1)} FPS. You could potentially increase visual quality settings.`
            });
        }
        
        // Memory Analysis
        if (memoryUsage > this.healthThresholds.memory.warning) {
            insights.push({
                severity: 'warning',
                icon: '🧠',
                title: 'High Memory Usage',
                description: `Memory usage is at ${memoryUsage}MB. Consider restarting the application if performance degrades.`
            });
            recommendations.push({
                priority: 'medium',
                title: 'Monitor Memory Usage',
                description: 'High memory usage detected. Close other browser tabs or restart the application if needed.'
            });
        }
        
        // Engagement Analysis
        if (sessionTime > 300) { // 5 minutes
            insights.push({
                severity: 'info',
                icon: '🎉',
                title: 'Great Engagement!',
                description: `You've been exploring space for ${Math.floor(sessionTime/60)} minutes. You're really getting into it!`
            });
        }
        
        return { insights, recommendations };
    }
    
    startMonitoring() {
        // Initialize empty data arrays if needed
        if (this.technicalMetrics.memory.textureMemory.length === 0) {
            this.technicalMetrics.memory.textureMemory.push(0);
        }
        if (this.technicalMetrics.memory.geometryMemory.length === 0) {
            this.technicalMetrics.memory.geometryMemory.push(0);
        }
        if (this.technicalMetrics.rendering.drawCalls.length === 0) {
            this.technicalMetrics.rendering.drawCalls.push(0);
            this.technicalMetrics.rendering.triangles.push(0);
            this.technicalMetrics.rendering.vertices.push(0);
        }
        
        this.monitoringInterval = setInterval(() => {
            this.collectMetrics();
            this.updateDisplay();
        }, this.updateInterval);
        
        console.log('Enhanced Performance Dashboard: Started comprehensive monitoring');
    }
    
    collectMetrics() {
        // Collect Product Manager metrics
        this.collectProductMetrics();
        
        // Collect Technical Manager metrics
        this.collectTechnicalMetrics();
        
        // Update system state
        this.systemState.totalFrames++;
    }
    
    collectProductMetrics() {
        const now = Date.now();
        const sessionTime = now - this.productMetrics.userEngagement.sessionStart;
        
        // Update session metrics
        this.productMetrics.userEngagement.sessionTime = sessionTime;
        
        // Track user interactions (this would be called from the main app)
        // For now, we'll simulate some data
    }
    
    collectTechnicalMetrics() {
        const now = Date.now();
        
        // Collect FPS and frame time from performance monitor
        if (window.performanceMonitor) {
            const fps = window.performanceMonitor.currentFPS;
            const frameTime = window.performanceMonitor.deltaTime;
            this.technicalMetrics.performance.fps.push(fps);
            this.technicalMetrics.performance.frameTime.push(frameTime);
            
            // Get rendering stats from Three.js renderer
            if (window.renderer && window.renderer.info) {
                const info = window.renderer.info;
                this.technicalMetrics.rendering.drawCalls.push(info.render.calls);
                this.technicalMetrics.rendering.triangles.push(info.render.triangles);
                this.technicalMetrics.rendering.vertices.push(info.render.points);
            }
        } else {
            // Fallback to simulated data
            const fps = this.getCurrentFPS();
            this.technicalMetrics.performance.fps.push(fps);
            this.technicalMetrics.performance.frameTime.push(1000 / fps);
        }
        
        // Collect memory info
        if (performance.memory) {
            const memInfo = performance.memory;
            this.technicalMetrics.memory.heapUsed.push(memInfo.usedJSHeapSize / 1024 / 1024);
            this.technicalMetrics.memory.heapTotal.push(memInfo.totalJSHeapSize / 1024 / 1024);
            this.technicalMetrics.memory.heapLimit.push(memInfo.jsHeapSizeLimit / 1024 / 1024);
            
            // Get texture and geometry memory from renderer
            if (window.renderer && window.renderer.info) {
                const info = window.renderer.info;
                // Estimate texture memory (count * average size)
                const textureMemoryMB = info.memory.textures * 4; // ~4MB per texture average
                const geometryMemoryMB = info.memory.geometries * 0.5; // ~0.5MB per geometry average
                this.technicalMetrics.memory.textureMemory.push(textureMemoryMB);
                this.technicalMetrics.memory.geometryMemory.push(geometryMemoryMB);
            }
        }
        
        // Keep only last 300 data points (5 minutes at 1 second intervals)
        Object.values(this.technicalMetrics).forEach(category => {
            Object.values(category).forEach(metric => {
                if (Array.isArray(metric) && metric.length > 300) {
                    metric.splice(0, metric.length - 300);
                }
            });
        });
    }
    
    getCurrentFPS() {
        // Get actual FPS from performance monitor
        if (window.performanceMonitor) {
            return window.performanceMonitor.currentFPS;
        }
        // Fallback to simulated value if monitor not available
        return 60 + (Math.random() - 0.5) * 10;
    }
    
    getAverageFPS() {
        // Try to get from performance monitor first
        if (window.performanceMonitor) {
            return window.performanceMonitor.averageFPS;
        }
        // Fallback to local calculation
        const fpsData = this.technicalMetrics.performance.fps;
        if (fpsData.length === 0) return 60;
        return fpsData.reduce((a, b) => a + b, 0) / fpsData.length;
    }
    
    getCurrentMemoryUsage() {
        if (performance.memory) {
            return Math.round(performance.memory.usedJSHeapSize / 1024 / 1024);
        }
        return 128; // Fallback value
    }
    
    updateDisplay() {
        if (!this.isVisible) return;
        
        // Update overview KPIs
        this.updateOverviewKPIs();
        
        // Update charts
        this.updateCharts();
        
        // Update active tab
        if (this.activeTab === 'product') {
            this.updateProductTab();
        } else if (this.activeTab === 'technical') {
            this.updateTechnicalTab();
        } else if (this.activeTab === 'console') {
            this.updateConsoleTab();
        }
        
        // Update session info
        this.updateSessionInfo();
    }
    
    updateOverviewKPIs() {
        const avgFps = this.getAverageFPS();
        const memoryUsage = this.getCurrentMemoryUsage();
        const sessionTime = (Date.now() - this.productMetrics.userEngagement.sessionStart) / 1000;
        
        // Update FPS
        const fpsElement = document.getElementById('kpi-fps');
        if (fpsElement) {
            fpsElement.textContent = Math.round(avgFps);
            fpsElement.className = 'kpi-value ' + this.getHealthStatus(avgFps, this.healthThresholds.fps);
        }
        
        // Update Memory
        const memoryElement = document.getElementById('kpi-memory');
        if (memoryElement) {
            memoryElement.textContent = memoryUsage + ' MB';
            memoryElement.className = 'kpi-value ' + this.getHealthStatus(memoryUsage, this.healthThresholds.memory, true);
        }
        
        // Update Engagement
        const engagementElement = document.getElementById('kpi-engagement');
        if (engagementElement) {
            const engagementLevel = sessionTime > 300 ? 'High' : sessionTime > 120 ? 'Medium' : 'Low';
            engagementElement.textContent = engagementLevel;
            engagementElement.className = 'kpi-value ' + this.getHealthStatus(sessionTime, this.healthThresholds.userEngagement);
        }
        
        // Update Error Rate
        const errorElement = document.getElementById('kpi-errors');
        if (errorElement) {
            const errorRate = this.systemState.totalFrames > 0 ? 
                (this.systemState.errorCount / this.systemState.totalFrames * 100).toFixed(1) + '%' : '0%';
            errorElement.textContent = errorRate;
        }
    }
    
    updateProductTab() {
        const sessionTime = (Date.now() - this.productMetrics.userEngagement.sessionStart) / 1000;
        const minutes = Math.floor(sessionTime / 60);
        const seconds = Math.floor(sessionTime % 60);
        
        const sessionElement = document.getElementById('session-duration');
        if (sessionElement) {
            sessionElement.textContent = `${minutes}m ${seconds}s`;
        }
        
        const interactionsElement = document.getElementById('total-user-interactions');
        if (interactionsElement) {
            interactionsElement.textContent = this.productMetrics.userEngagement.totalInteractions;
        }
        
        const featuresElement = document.getElementById('features-used-count');
        if (featuresElement) {
            featuresElement.textContent = Object.keys(this.productMetrics.userEngagement.featuresUsed).length;
        }
    }
    
    updateTechnicalTab() {
        // Update technical metrics display with real data
        if (window.renderer && window.renderer.info) {
            const info = window.renderer.info;
            
            const drawCallsElement = document.getElementById('draw-calls');
            if (drawCallsElement) {
                drawCallsElement.textContent = info.render.calls;
            }
            
            const triangleElement = document.getElementById('triangle-count');
            if (triangleElement) {
                triangleElement.textContent = info.render.triangles.toLocaleString();
            }
            
            const textureMemElement = document.getElementById('texture-memory');
            if (textureMemElement) {
                // Estimate texture memory (textures count * average size)
                // Assuming average of 4MB per texture (varies based on quality)
                const estimatedMB = Math.round(info.memory.textures * 4);
                textureMemElement.textContent = estimatedMB + ' MB';
            }
        }
        
        const jsHeapElement = document.getElementById('js-heap');
        if (jsHeapElement) {
            jsHeapElement.textContent = this.getCurrentMemoryUsage() + ' MB';
        }
        
        // Update cache hit rate
        const cacheElement = document.getElementById('cache-hit-rate');
        if (cacheElement) {
            // Calculate cache hit rate if texture manager is available
            if (window.textureManager && window.textureManager.cacheHits !== undefined) {
                const hits = window.textureManager.cacheHits;
                const total = window.textureManager.totalRequests || 1;
                const rate = (hits / total * 100).toFixed(1);
                cacheElement.textContent = rate + '%';
            } else {
                cacheElement.textContent = '85%'; // Default value
            }
        }
        
        // Update debug info
        this.updateDebugInfo();
    }
    
    updateSessionInfo() {
        const sessionTime = (Date.now() - this.productMetrics.userEngagement.sessionStart) / 1000;
        const hours = Math.floor(sessionTime / 3600);
        const minutes = Math.floor((sessionTime % 3600) / 60);
        const seconds = Math.floor(sessionTime % 60);
        
        const sessionElement = document.getElementById('session-time');
        if (sessionElement) {
            sessionElement.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
        
        const interactionsElement = document.getElementById('total-interactions');
        if (interactionsElement) {
            interactionsElement.textContent = this.productMetrics.userEngagement.totalInteractions;
        }
    }
    
    getHealthStatus(value, thresholds, reverse = false) {
        if (reverse) {
            // For metrics where lower is better (like memory usage)
            if (value <= thresholds.excellent) return 'excellent';
            if (value <= thresholds.good) return 'good';
            if (value <= thresholds.warning) return 'warning';
            return 'critical';
        } else {
            // For metrics where higher is better (like FPS)
            if (value >= thresholds.excellent) return 'excellent';
            if (value >= thresholds.good) return 'good';
            if (value >= thresholds.warning) return 'warning';
            return 'critical';
        }
    }
    
    // Public API methods
    show() {
        const dashboard = document.getElementById('performance-dashboard');
        if (dashboard) {
            dashboard.classList.remove('hidden');
            this.isVisible = true;
            
            // Update console tab if it's active
            if (this.activeTab === 'console') {
                this.updateConsoleTab();
            }
        }
    }
    
    hide() {
        const dashboard = document.getElementById('performance-dashboard');
        if (dashboard) {
            dashboard.classList.add('hidden');
            this.isVisible = false;
        }
    }
    
    trackUserInteraction(type, data = {}) {
        this.productMetrics.userEngagement.totalInteractions++;
        
        // Track feature usage
        if (data.feature) {
            if (!this.productMetrics.userEngagement.featuresUsed[data.feature]) {
                this.productMetrics.userEngagement.featuresUsed[data.feature] = 0;
            }
            this.productMetrics.userEngagement.featuresUsed[data.feature]++;
        }
        
        // Track navigation pattern
        if (data.target) {
            this.productMetrics.userEngagement.navigationPattern.push({
                timestamp: Date.now(),
                action: type,
                target: data.target
            });
            
            // Keep only last 50 navigation steps
            if (this.productMetrics.userEngagement.navigationPattern.length > 50) {
                this.productMetrics.userEngagement.navigationPattern.shift();
            }
            
            // Update user journey chart if on product tab
            if (this.activeTab === 'product' && this.charts.userJourney) {
                this.updateUserJourneyChart();
            }
            
            // Track planet views
            if (type === 'planet_view') {
                if (!this.productMetrics.userEngagement.planetViews[data.target]) {
                    this.productMetrics.userEngagement.planetViews[data.target] = 0;
                }
                this.productMetrics.userEngagement.planetViews[data.target]++;
            }
        }
    }
    
    exportReport() {
        const report = {
            timestamp: new Date().toISOString(),
            session: {
                duration: Date.now() - this.productMetrics.userEngagement.sessionStart,
                interactions: this.productMetrics.userEngagement.totalInteractions,
                featuresUsed: this.productMetrics.userEngagement.featuresUsed,
                planetViews: this.productMetrics.userEngagement.planetViews
            },
            performance: {
                averageFPS: this.getAverageFPS(),
                memoryUsage: this.getCurrentMemoryUsage(),
                totalFrames: this.systemState.totalFrames,
                errors: this.systemState.errorCount
            },
            technical: this.technicalMetrics
        };
        
        const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `space-simulator-report-${new Date().toISOString().slice(0, 19)}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }
    
    clearConsole() {
        const consoleContent = document.getElementById('dashboard-console-content');
        if (consoleContent) {
            consoleContent.innerHTML = '<div class="console-empty">Console cleared.</div>';
        }
    }
    
    exportConsole() {
        const logs = window.devLogs || [];
        const logText = logs.map(log => `[${log.timestamp}] ${log.type.toUpperCase()}: ${log.message}`).join('\n');
        
        const blob = new Blob([logText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `space-simulator-console-${new Date().toISOString().slice(0, 19)}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    }
    
    filterConsole(filter) {
        // Console filtering is handled in updateConsoleTab
        this.updateConsoleTab();
    }
    
    updateCharts() {
        // Update performance chart
        if (this.charts.overviewPerformance) {
            const now = new Date().toLocaleTimeString();
            const fpsData = this.technicalMetrics.performance.fps;
            const frameTimeData = this.technicalMetrics.performance.frameTime;
            
            if (fpsData.length > 0) {
                // Keep only last 60 data points
                const maxPoints = 60;
                const startIdx = Math.max(0, fpsData.length - maxPoints);
                
                const labels = [];
                for (let i = startIdx; i < fpsData.length; i++) {
                    labels.push('');
                }
                
                this.charts.overviewPerformance.data.labels = labels;
                this.charts.overviewPerformance.data.datasets[0].data = fpsData.slice(startIdx);
                this.charts.overviewPerformance.data.datasets[1].data = frameTimeData.slice(startIdx);
                this.charts.overviewPerformance.update('none');
            }
        }
        
        // Update memory chart
        if (this.charts.overviewMemory) {
            const memData = this.technicalMetrics.memory;
            const heapUsed = memData.heapUsed[memData.heapUsed.length - 1] || 0;
            const textures = memData.textureMemory[memData.textureMemory.length - 1] || 0;
            const geometries = memData.geometryMemory[memData.geometryMemory.length - 1] || 0;
            const other = 10; // Base system memory
            
            // Only update if we have actual data
            if (heapUsed > 0 || textures > 0 || geometries > 0) {
                this.charts.overviewMemory.data.datasets[0].data = [
                    Math.round(heapUsed),
                    Math.round(textures),
                    Math.round(geometries),
                    Math.round(other)
                ];
                this.charts.overviewMemory.update('none');
            }
        }
        
        // Update rendering chart
        if (this.charts.rendering) {
            const renderData = this.technicalMetrics.rendering;
            const maxPoints = 60;
            
            if (renderData.drawCalls.length > 0) {
                const startIdx = Math.max(0, renderData.drawCalls.length - maxPoints);
                const labels = [];
                for (let i = startIdx; i < renderData.drawCalls.length; i++) {
                    labels.push('');
                }
                
                this.charts.rendering.data.labels = labels;
                this.charts.rendering.data.datasets[0].data = renderData.drawCalls.slice(startIdx);
                this.charts.rendering.data.datasets[1].data = renderData.triangles.slice(startIdx).map(t => t / 1000);
                this.charts.rendering.update('none');
            }
        }
        
        // Update memory breakdown chart
        if (this.charts.memoryBreakdown) {
            const memData = this.technicalMetrics.memory;
            const maxPoints = 60;
            
            if (memData.heapUsed.length > 0) {
                const startIdx = Math.max(0, memData.heapUsed.length - maxPoints);
                const labels = [];
                for (let i = startIdx; i < memData.heapUsed.length; i++) {
                    labels.push('');
                }
                
                this.charts.memoryBreakdown.data.labels = labels;
                this.charts.memoryBreakdown.data.datasets[0].data = memData.heapUsed.slice(startIdx);
                this.charts.memoryBreakdown.data.datasets[1].data = memData.textureMemory.slice(startIdx);
                this.charts.memoryBreakdown.data.datasets[2].data = memData.geometryMemory.slice(startIdx);
                this.charts.memoryBreakdown.update('none');
            }
        }
        
        // Update product charts
        if (this.activeTab === 'product') {
            this.updateProductCharts();
        }
    }
    
    updateProductCharts() {
        // Update popular objects chart
        if (this.charts.popularObjects) {
            const planetViews = this.productMetrics.userEngagement.planetViews;
            const sortedPlanets = Object.entries(planetViews)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 10);
            
            this.charts.popularObjects.data.labels = sortedPlanets.map(([name]) => name);
            this.charts.popularObjects.data.datasets[0].data = sortedPlanets.map(([,count]) => count);
            this.charts.popularObjects.update('none');
        }
        
        // Update feature usage chart
        if (this.charts.featureUsage) {
            const features = this.productMetrics.userEngagement.featuresUsed;
            const sortedFeatures = Object.entries(features)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 6);
            
            this.charts.featureUsage.data.labels = sortedFeatures.map(([name]) => name);
            this.charts.featureUsage.data.datasets[0].data = sortedFeatures.map(([,count]) => count);
            this.charts.featureUsage.update('none');
        }
        
        // Update user journey display
        this.updateUserJourneyDisplay();
    }
    
    updateUserJourneyDisplay() {
        const journeyContainer = document.getElementById('user-journey');
        if (!journeyContainer) return;
        
        const navPattern = this.productMetrics.userEngagement.navigationPattern;
        const last10 = navPattern.slice(-10);
        
        if (last10.length === 0) {
            journeyContainer.innerHTML = '<div style="text-align: center; color: #a0a0a0; padding: 40px;">No navigation history yet. Start exploring!</div>';
            return;
        }
        
        let html = '<div style="display: flex; align-items: center; gap: 10px; overflow-x: auto; padding: 10px;">';
        last10.forEach((nav, idx) => {
            const time = new Date(nav.timestamp).toLocaleTimeString();
            const isLast = idx === last10.length - 1;
            html += `
                <div style="background: ${isLast ? 'rgba(51, 154, 240, 0.2)' : 'rgba(255, 255, 255, 0.05)'}; 
                           border: 1px solid ${isLast ? '#339af0' : 'rgba(255, 255, 255, 0.1)'}; 
                           border-radius: 8px; padding: 10px 15px; text-align: center; min-width: 100px;
                           ${isLast ? 'box-shadow: 0 0 10px rgba(51, 154, 240, 0.3);' : ''}">
                    <div style="font-size: 10px; color: #a0a0a0; margin-bottom: 5px;">${time}</div>
                    <div style="font-size: 14px; font-weight: 600; color: #e0e0e0;">${nav.target}</div>
                </div>
                ${!isLast ? '<div style="color: #339af0; font-size: 20px; margin: 0 5px;">→</div>' : ''}
            `;
        });
        html += '</div>';
        
        journeyContainer.innerHTML = html;
    }
    
    updateDebugInfo() {
        const debugInfo = document.getElementById('debug-info');
        if (!debugInfo) return;
        
        const perfStats = window.performanceMonitor ? window.performanceMonitor.getPerformanceStats() : null;
        const systemInfo = window.performanceMonitor ? window.performanceMonitor.systemCapabilities : null;
        
        let html = '<div class="debug-sections">';
        
        // Performance stats
        if (perfStats) {
            html += `
                <div class="debug-section">
                    <h4>Performance Stats</h4>
                    <div class="debug-row">
                        <span>Current FPS:</span>
                        <span>${perfStats.currentFPS}</span>
                    </div>
                    <div class="debug-row">
                        <span>Average FPS:</span>
                        <span>${perfStats.averageFPS}</span>
                    </div>
                    <div class="debug-row">
                        <span>Min/Max FPS:</span>
                        <span>${perfStats.minFPS} / ${perfStats.maxFPS}</span>
                    </div>
                    <div class="debug-row">
                        <span>Frame Time:</span>
                        <span>${perfStats.deltaTime}</span>
                    </div>
                    <div class="debug-row">
                        <span>Performance Level:</span>
                        <span class="${perfStats.performanceLevel}">${perfStats.performanceLevel}</span>
                    </div>
                </div>
            `;
        }
        
        // System info
        if (systemInfo) {
            html += `
                <div class="debug-section">
                    <h4>System Capabilities</h4>
                    <div class="debug-row">
                        <span>GPU:</span>
                        <span title="${systemInfo.gpu}">${systemInfo.gpu.substring(0, 30)}...</span>
                    </div>
                    <div class="debug-row">
                        <span>System Tier:</span>
                        <span>${systemInfo.tier}</span>
                    </div>
                    <div class="debug-row">
                        <span>Memory Tier:</span>
                        <span>${systemInfo.memory}</span>
                    </div>
                    <div class="debug-row">
                        <span>Max Texture Size:</span>
                        <span>${systemInfo.maxTextureSize}</span>
                    </div>
                </div>
            `;
        }
        
        // Renderer info
        if (window.renderer && window.renderer.info) {
            const info = window.renderer.info;
            html += `
                <div class="debug-section">
                    <h4>Renderer Info</h4>
                    <div class="debug-row">
                        <span>Programs:</span>
                        <span>${info.programs?.length || 0}</span>
                    </div>
                    <div class="debug-row">
                        <span>Geometries:</span>
                        <span>${info.memory.geometries}</span>
                    </div>
                    <div class="debug-row">
                        <span>Textures:</span>
                        <span>${info.memory.textures}</span>
                    </div>
                </div>
            `;
        }
        
        html += '</div>';
        
        // Add CSS for debug info if not already added
        if (!document.getElementById('debug-info-styles')) {
            const style = document.createElement('style');
            style.id = 'debug-info-styles';
            style.textContent = `
                .debug-sections {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                    gap: 20px;
                    padding: 20px;
                }
                .debug-section {
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 8px;
                    padding: 15px;
                }
                .debug-section h4 {
                    margin: 0 0 10px 0;
                    color: #37b24d;
                    font-size: 14px;
                }
                .debug-row {
                    display: flex;
                    justify-content: space-between;
                    padding: 5px 0;
                    font-size: 12px;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
                }
                .debug-row:last-child {
                    border-bottom: none;
                }
                .debug-row span:first-child {
                    color: #a0a0a0;
                }
                .debug-row span:last-child {
                    color: #e0e0e0;
                    font-family: 'Courier New', monospace;
                }
                .debug-row .excellent { color: #37b24d; }
                .debug-row .good { color: #51cf66; }
                .debug-row .warning { color: #ffd43b; }
                .debug-row .critical { color: #ff6b6b; }
            `;
            document.head.appendChild(style);
        }
        
        debugInfo.innerHTML = html;
    }
    
    refreshData() {
        this.collectMetrics();
        this.updateDisplay();
    }
    
    toggleFullscreen() {
        const dashboard = document.getElementById('performance-dashboard');
        if (dashboard) {
            if (dashboard.style.width === '100vw') {
                dashboard.style.width = '95vw';
                dashboard.style.height = '90vh';
            } else {
                dashboard.style.width = '100vw';
                dashboard.style.height = '100vh';
            }
        }
    }
    
    destroy() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
        }
        
        const dashboard = document.getElementById('performance-dashboard');
        if (dashboard) {
            dashboard.remove();
        }
        
        const styles = document.getElementById('dashboard-styles');
        if (styles) {
            styles.remove();
        }
        
        console.log('Enhanced Performance Dashboard: Destroyed and cleaned up');
    }
}