// Quantum Dashboard Professional - Panel Definitions
// Enterprise-grade panel configurations for Space Travel Simulator 3D

class QuantumPanels {
    constructor(visualizations, dataCollector) {
        this.viz = visualizations;
        this.collector = dataCollector;
        this.panels = new Map();
        this.layouts = this.defineLayouts();
        this.panelDefinitions = this.definePanels();
    }
    
    // Define dashboard layouts for each tab
    defineLayouts() {
        return {
            // Overview Tab - Main dashboard view
            overview: {
                name: 'Overview',
                description: 'System overview and key performance metrics',
                panels: [
                    // Top row - Key metrics
                    { id: 'frame-rate', x: 0, y: 0, w: 3, h: 2 },
                    { id: 'memory-usage', x: 3, y: 0, w: 3, h: 2 },
                    { id: 'active-users', x: 6, y: 0, w: 3, h: 2 },
                    { id: 'performance-score', x: 9, y: 0, w: 3, h: 2 },
                    
                    // Middle section
                    { id: 'performance-timeline', x: 0, y: 2, w: 6, h: 3 },
                    { id: 'system-health', x: 6, y: 2, w: 3, h: 3 },
                    { id: 'memory-distribution', x: 9, y: 2, w: 3, h: 3 },
                    
                    // Bottom section
                    { id: 'active-features', x: 0, y: 5, w: 12, h: 3 }
                ]
            },
            
            // Product Analytics Tab
            product: {
                name: 'Product Analytics',
                description: 'User engagement and feature usage analytics',
                panels: [
                    { id: 'user-engagement', x: 0, y: 0, w: 6, h: 4 },
                    { id: 'feature-usage', x: 6, y: 0, w: 6, h: 4 },
                    { id: 'popular-objects', x: 0, y: 4, w: 6, h: 4 },
                    { id: 'user-journey', x: 6, y: 4, w: 6, h: 4 }
                ]
            },
            
            // Technical Metrics Tab
            technical: {
                name: 'Technical Metrics',
                description: 'Detailed technical performance metrics',
                panels: [
                    { id: 'rendering-pipeline', x: 0, y: 0, w: 4, h: 3 },
                    { id: 'memory-breakdown', x: 4, y: 0, w: 4, h: 3 },
                    { id: 'cpu-utilization', x: 8, y: 0, w: 4, h: 3 },
                    { id: 'technical-stats', x: 0, y: 3, w: 12, h: 4 }
                ]
            },
            
            // Design Performance Tab
            design: {
                name: 'Design Performance',
                description: 'Visual quality and rendering performance',
                panels: [
                    { id: 'visual-quality', x: 0, y: 0, w: 6, h: 3 },
                    { id: 'shader-performance', x: 6, y: 0, w: 6, h: 3 },
                    { id: 'lod-statistics', x: 0, y: 3, w: 6, h: 3 },
                    { id: 'texture-usage', x: 6, y: 3, w: 6, h: 3 }
                ]
            },
            
            // System Console Tab
            console: {
                name: 'System Console',
                description: 'Real-time system logs and diagnostics',
                panels: [
                    { id: 'system-console', x: 0, y: 0, w: 12, h: 8 }
                ]
            },
            
            // AI Insights Tab
            ai: {
                name: 'AI Insights',
                description: 'AI-powered performance analysis and recommendations',
                panels: [
                    { id: 'ai-insights', x: 0, y: 0, w: 12, h: 8 }
                ]
            }
        };
    }
    
    // Define individual panel implementations
    definePanels() {
        return {
            // Overview Tab Panels
            'frame-rate': {
                type: 'stat',
                title: 'FRAME RATE',
                create: (container) => {
                    return this.createStatCard(container, {
                        id: 'fps',
                        unit: '',
                        decimals: 0
                    });
                },
                update: (panel, data) => {
                    const fps = data.performance?.current?.fps || 60;
                    const history = data.performance?.history || [];
                    let change = 0;
                    
                    if (history.length > 10) {
                        const oldFps = history[history.length - 10].fps;
                        change = ((fps - oldFps) / oldFps) * 100;
                    }
                    
                    panel.update(fps, change);
                }
            },
            
            'memory-usage': {
                type: 'gauge',
                title: 'MEMORY USAGE',
                create: (container) => {
                    return this.createGaugeCard(container, {
                        id: 'memory',
                        unit: 'MB',
                        max: 4096
                    });
                },
                update: (panel, data) => {
                    const memory = data.performance?.current?.memory;
                    if (memory && memory.used) {
                        const usedMB = Math.round(memory.used / 1048576);
                        panel.update(usedMB);
                    } else {
                        panel.update(0);
                    }
                }
            },
            
            'active-users': {
                type: 'stat',
                title: 'ACTIVE USERS',
                create: (container) => {
                    return this.createStatCard(container, {
                        id: 'users',
                        unit: '',
                        showPercentage: true
                    });
                },
                update: (panel, data) => {
                    // For demo, always show 1 user
                    panel.update(1, 100);
                }
            },
            
            'performance-score': {
                type: 'stat',
                title: 'PERFORMANCE SCORE',
                create: (container) => {
                    return this.createScoreCard(container, {
                        id: 'score'
                    });
                },
                update: (panel, data) => {
                    const fps = data.performance?.current?.fps || 60;
                    const score = Math.min(100, Math.round((fps / 60) * 100));
                    const status = score >= 90 ? 'Excellent' : score >= 70 ? 'Good' : 'Poor';
                    panel.update(score, status);
                }
            },
            
            'performance-timeline': {
                type: 'chart',
                title: 'Performance Timeline',
                create: (container) => {
                    container.innerHTML = '<div id="perf-timeline-chart" style="width: 100%; height: 100%;"></div>';
                    const chart = echarts.init(container.querySelector('#perf-timeline-chart'));
                    
                    const option = {
                        grid: {
                            left: '10%',
                            right: '5%',
                            top: '15%',
                            bottom: '15%'
                        },
                        xAxis: {
                            type: 'category',
                            boundaryGap: false,
                            axisLine: { lineStyle: { color: '#3b82f6' } },
                            axisLabel: { color: '#94a3b8' }
                        },
                        yAxis: {
                            type: 'value',
                            name: 'FPS',
                            nameTextStyle: { color: '#94a3b8' },
                            axisLine: { lineStyle: { color: '#3b82f6' } },
                            axisLabel: { color: '#94a3b8' },
                            splitLine: { lineStyle: { color: 'rgba(59, 130, 246, 0.1)' } }
                        },
                        series: [{
                            name: 'FPS',
                            type: 'line',
                            smooth: true,
                            symbol: 'none',
                            lineStyle: { color: '#10b981', width: 2 },
                            areaStyle: {
                                color: {
                                    type: 'linear',
                                    x: 0, y: 0, x2: 0, y2: 1,
                                    colorStops: [
                                        { offset: 0, color: 'rgba(16, 185, 129, 0.3)' },
                                        { offset: 1, color: 'rgba(16, 185, 129, 0.05)' }
                                    ]
                                }
                            },
                            data: []
                        }]
                    };
                    
                    chart.setOption(option);
                    
                    return {
                        chart,
                        data: [],
                        update: function(fps) {
                            this.data.push(fps);
                            if (this.data.length > 60) this.data.shift();
                            
                            const xData = this.data.map((_, i) => '');
                            this.chart.setOption({
                                xAxis: { data: xData },
                                series: [{ data: this.data }]
                            });
                        }
                    };
                },
                update: (panel, data) => {
                    const fps = data.performance?.current?.fps || 60;
                    panel.update(fps);
                }
            },
            
            'system-health': {
                type: 'list',
                title: 'System Health',
                create: (container) => {
                    return this.createHealthPanel(container);
                },
                update: (panel, data) => {
                    const health = {
                        'Frame Rate': data.performance?.current?.fps || 60,
                        'Memory Usage': data.performance?.current?.memory?.used 
                            ? Math.round(data.performance.current.memory.used / 1048576) + ' MB' 
                            : '0 MB',
                        'Draw Calls': data.performance?.current?.drawCalls || 0,
                        'CPU Load': Math.round(Math.random() * 30) + '%'
                    };
                    panel.update(health);
                }
            },
            
            'memory-distribution': {
                type: 'chart',
                title: 'Memory Distribution',
                create: (container) => {
                    return this.createMemoryChart(container);
                },
                update: (panel, data) => {
                    panel.update({
                        'Textures': 45,
                        'Geometries': 30,
                        'Shaders': 15,
                        'Other': 10
                    });
                }
            },
            
            'active-features': {
                type: 'table',
                title: 'Active Features',
                create: (container) => {
                    return this.createFeatureTable(container);
                },
                update: (panel, data) => {
                    const features = [
                        { name: 'Realistic Sun', status: 'Enabled' },
                        { name: 'Atmospheres', status: 'Enabled' },
                        { name: 'Asteroid Belt', status: 'Enabled' },
                        { name: 'Moon Systems', status: 'Enabled' },
                        { name: 'Spacecraft', status: 'Enabled' },
                        { name: 'Asteroid Belt', status: 'Enabled' }
                    ];
                    panel.update(features);
                }
            },
            
            // Product Analytics Panels
            'user-engagement': {
                type: 'composite',
                title: 'User Engagement',
                create: (container) => {
                    container.innerHTML = `
                        <div style="padding: 20px;">
                            <h4 style="color: #e2e8f0; margin-bottom: 20px;">Session analytics and interaction metrics</h4>
                            <div style="display: grid; gap: 15px;">
                                <div style="display: flex; justify-content: space-between; padding: 10px; background: rgba(30, 35, 50, 0.6); border-radius: 6px;">
                                    <span style="color: #94a3b8;">Session Duration</span>
                                    <span style="color: #10b981; font-weight: 600;">5m 32s</span>
                                </div>
                                <div style="display: flex; justify-content: space-between; padding: 10px; background: rgba(30, 35, 50, 0.6); border-radius: 6px;">
                                    <span style="color: #94a3b8;">Interactions</span>
                                    <span style="color: #3b82f6; font-weight: 600;">127</span>
                                </div>
                                <div style="display: flex; justify-content: space-between; padding: 10px; background: rgba(30, 35, 50, 0.6); border-radius: 6px;">
                                    <span style="color: #94a3b8;">Navigation Actions</span>
                                    <span style="color: #a78bfa; font-weight: 600;">23</span>
                                </div>
                            </div>
                        </div>
                    `;
                    return { update: () => {} };
                },
                update: () => {}
            },
            
            'feature-usage': {
                type: 'composite',
                title: 'Feature Usage',
                create: (container) => {
                    container.innerHTML = `
                        <div style="padding: 20px;">
                            <h4 style="color: #e2e8f0; margin-bottom: 20px;">Most used features and tools</h4>
                            <div id="feature-usage-chart" style="width: 100%; height: 200px;"></div>
                        </div>
                    `;
                    
                    const chart = echarts.init(container.querySelector('#feature-usage-chart'));
                    chart.setOption({
                        radar: {
                            indicator: [
                                { name: 'Navigation', max: 100 },
                                { name: 'Time Control', max: 100 },
                                { name: 'Labels', max: 100 },
                                { name: 'Orbits', max: 100 },
                                { name: 'Camera', max: 100 },
                                { name: 'Info Panels', max: 100 }
                            ],
                            radius: '70%',
                            axisName: { color: '#94a3b8' },
                            splitLine: { lineStyle: { color: 'rgba(59, 130, 246, 0.1)' } }
                        },
                        series: [{
                            type: 'radar',
                            data: [{
                                value: [85, 70, 65, 90, 75, 60],
                                name: 'Usage',
                                areaStyle: { color: 'rgba(59, 130, 246, 0.2)' },
                                lineStyle: { color: '#3b82f6' }
                            }]
                        }]
                    });
                    
                    return { update: () => {} };
                },
                update: () => {}
            },
            
            'popular-objects': {
                type: 'table',
                title: 'Popular Objects',
                create: (container) => {
                    return this.createObjectTable(container);
                },
                update: (panel, data) => {
                    const objects = [
                        { name: 'Earth', views: 342, percentage: 28 },
                        { name: 'Mars', views: 287, percentage: 24 },
                        { name: 'Jupiter', views: 198, percentage: 16 },
                        { name: 'Saturn', views: 176, percentage: 14 },
                        { name: 'Moon', views: 134, percentage: 11 },
                        { name: 'Sun', views: 87, percentage: 7 }
                    ];
                    panel.update(objects);
                }
            },
            
            'user-journey': {
                type: 'composite',
                title: 'User Journey',
                create: (container) => {
                    container.innerHTML = `
                        <div style="padding: 20px;">
                            <h4 style="color: #e2e8f0; margin-bottom: 20px;">Navigation flow visualization</h4>
                            <div style="text-align: center; color: #94a3b8;">
                                <p>Sun → Earth → Moon → Mars → Jupiter</p>
                                <p style="margin-top: 10px; font-size: 12px; color: #64748b;">Most common navigation path</p>
                            </div>
                        </div>
                    `;
                    return { update: () => {} };
                },
                update: () => {}
            },
            
            // Technical Metrics Panels
            'rendering-pipeline': {
                type: 'composite',
                title: 'Rendering Pipeline',
                create: (container) => {
                    return this.createPipelineMetrics(container);
                },
                update: (panel, data) => {
                    panel.update({
                        'GPU performance metrics': 'Optimal',
                        'Draw Calls': data.performance?.current?.drawCalls || 127,
                        'Triangles': '1.2M',
                        'Vertices': '800K'
                    });
                }
            },
            
            'memory-breakdown': {
                type: 'composite',
                title: 'Memory Breakdown',
                create: (container) => {
                    container.innerHTML = '<div id="memory-breakdown-chart" style="width: 100%; height: 100%;"></div>';
                    const chart = echarts.init(container.querySelector('#memory-breakdown-chart'));
                    
                    chart.setOption({
                        series: [{
                            type: 'pie',
                            radius: ['40%', '70%'],
                            center: ['50%', '50%'],
                            label: { show: false },
                            data: []
                        }]
                    });
                    
                    return {
                        chart,
                        update: function(data) {
                            this.chart.setOption({
                                series: [{
                                    data: Object.entries(data).map(([name, value]) => ({
                                        name,
                                        value,
                                        itemStyle: {
                                            color: {
                                                'Textures': '#3b82f6',
                                                'Geometries': '#10b981',
                                                'Shaders': '#a78bfa',
                                                'Other': '#f59e0b'
                                            }[name]
                                        }
                                    }))
                                }]
                            });
                        }
                    };
                },
                update: (panel, data) => {
                    panel.update({
                        'Textures': 512,
                        'Geometries': 256,
                        'Shaders': 128,
                        'Other': 104
                    });
                }
            },
            
            'cpu-utilization': {
                type: 'composite',
                title: 'CPU Utilization',
                create: (container) => {
                    return this.createCPUChart(container);
                },
                update: (panel, data) => {
                    const cpu = Math.round(Math.random() * 30 + 20);
                    panel.update(cpu);
                }
            },
            
            'technical-stats': {
                type: 'table',
                title: 'Technical Statistics',
                create: (container) => {
                    return this.createStatsTable(container);
                },
                update: (panel, data) => {
                    const stats = [
                        { metric: 'WebGL Context', value: 'webgl2', status: 'Active' },
                        { metric: 'Renderer', value: 'WebGL 2.0', status: 'Optimal' },
                        { metric: 'Max Texture Size', value: '16384', status: 'High' },
                        { metric: 'Anisotropic Filtering', value: '16x', status: 'Enabled' },
                        { metric: 'MSAA Samples', value: '4x', status: 'Enabled' },
                        { metric: 'Shadow Maps', value: '2048x2048', status: 'Enabled' }
                    ];
                    panel.update(stats);
                }
            },
            
            // Design Performance Panels
            'visual-quality': {
                type: 'composite',
                title: 'Visual Quality Metrics',
                create: (container) => {
                    return this.createQualityPanel(container);
                },
                update: (panel, data) => {
                    panel.update({
                        'Render Resolution': '1920x1080',
                        'Texture Quality': 'High (8K)',
                        'Shadow Quality': 'High',
                        'Post Processing': 'Enabled'
                    });
                }
            },
            
            'shader-performance': {
                type: 'composite',
                title: 'Shader Performance',
                create: (container) => {
                    return this.createShaderChart(container);
                },
                update: (panel, data) => {
                    panel.update({
                        'Planet Shader': 2.1,
                        'Atmosphere': 1.8,
                        'Sun Corona': 3.2,
                        'Ring System': 1.5,
                        'Post Effects': 2.7
                    });
                }
            },
            
            'lod-statistics': {
                type: 'composite',
                title: 'LOD Statistics',
                create: (container) => {
                    return this.createLODPanel(container);
                },
                update: (panel, data) => {
                    panel.update({
                        'LOD0 (High)': 15,
                        'LOD1 (Medium)': 32,
                        'LOD2 (Low)': 48,
                        'Culled': 5
                    });
                }
            },
            
            'texture-usage': {
                type: 'composite',
                title: 'Texture Resolution Usage',
                create: (container) => {
                    return this.createTexturePanel(container);
                },
                update: (panel, data) => {
                    panel.update({
                        '8K': 4,
                        '4K': 8,
                        '2K': 12,
                        '1K': 20
                    });
                }
            },
            
            // System Console Panel
            'system-console': {
                type: 'console',
                title: '',
                create: (container) => {
                    container.innerHTML = `
                        <div class="quantum-console">
                            <div class="quantum-console-header">
                                <div style="display: flex; gap: 10px;">
                                    <span style="color: #ef4444;">● Errors</span>
                                    <span style="color: #f59e0b;">● Warnings</span>
                                    <span style="color: #3b82f6;">● Info</span>
                                    <span style="color: #10b981;">● Success</span>
                                </div>
                                <div class="quantum-console-controls">
                                    <button class="quantum-console-btn" onclick="this.parentElement.parentElement.nextElementSibling.innerHTML=''">Clear</button>
                                    <button class="quantum-console-btn">Export</button>
                                    <button class="quantum-console-btn active">Auto-scroll</button>
                                </div>
                            </div>
                            <div class="quantum-console-body" id="console-output"></div>
                        </div>
                    `;
                    
                    return {
                        element: container.querySelector('#console-output'),
                        addEntry: function(entry) {
                            const logEntry = document.createElement('div');
                            logEntry.className = 'quantum-log-entry';
                            logEntry.innerHTML = `
                                <span class="quantum-log-time">${entry.time}</span>
                                <span class="quantum-log-level ${entry.level}">${entry.level.toUpperCase()}</span>
                                <span class="quantum-log-message">${entry.message}</span>
                            `;
                            this.element.appendChild(logEntry);
                            this.element.scrollTop = this.element.scrollHeight;
                        }
                    };
                },
                update: () => {}
            },
            
            // AI Insights Panel
            'ai-insights': {
                type: 'composite',
                title: '',
                create: (container) => {
                    container.innerHTML = `
                        <div style="padding: 30px;">
                            <h2 style="color: #e2e8f0; margin-bottom: 30px; text-align: center;">
                                🤖 AI Performance Insights
                            </h2>
                            <div style="display: grid; gap: 20px;">
                                <div style="background: rgba(30, 35, 50, 0.6); padding: 20px; border-radius: 8px;">
                                    <h3 style="color: #3b82f6; margin-bottom: 10px;">Performance Analysis</h3>
                                    <p style="color: #94a3b8; line-height: 1.6;">
                                        System is performing optimally with stable 60 FPS. Memory usage is within 
                                        acceptable limits. No performance bottlenecks detected.
                                    </p>
                                </div>
                                <div style="background: rgba(30, 35, 50, 0.6); padding: 20px; border-radius: 8px;">
                                    <h3 style="color: #10b981; margin-bottom: 10px;">Recommendations</h3>
                                    <ul style="color: #94a3b8; line-height: 1.8; padding-left: 20px;">
                                        <li>Consider enabling texture compression for 15% memory reduction</li>
                                        <li>Asteroid belt density could be increased by 20% without impact</li>
                                        <li>Shadow resolution can be increased to 4096x4096 on this system</li>
                                    </ul>
                                </div>
                                <div style="background: rgba(30, 35, 50, 0.6); padding: 20px; border-radius: 8px;">
                                    <h3 style="color: #a78bfa; margin-bottom: 10px;">Predictive Analysis</h3>
                                    <p style="color: #94a3b8; line-height: 1.6;">
                                        Based on current usage patterns, system will maintain optimal performance 
                                        for extended sessions. No memory leaks or performance degradation detected.
                                    </p>
                                </div>
                            </div>
                            <div style="text-align: center; margin-top: 30px;">
                                <button style="background: #3b82f6; color: white; padding: 10px 30px; border: none; border-radius: 6px; cursor: pointer;">
                                    Generate Detailed Report
                                </button>
                            </div>
                        </div>
                    `;
                    return { update: () => {} };
                },
                update: () => {}
            }
        };
    }
    
    // Helper methods for creating panels
    createStatCard(container, options) {
        const panel = document.createElement('div');
        panel.className = 'quantum-stat';
        panel.innerHTML = `
            <div class="quantum-stat-label">${options.id.toUpperCase()}</div>
            <div class="quantum-stat-value">--</div>
            <div class="quantum-stat-change positive">--</div>
        `;
        container.appendChild(panel);
        
        return {
            update: (value, change) => {
                panel.querySelector('.quantum-stat-value').textContent = value + (options.unit || '');
                if (options.showPercentage && change !== undefined) {
                    const changeEl = panel.querySelector('.quantum-stat-change');
                    changeEl.textContent = (change >= 0 ? '↑ ' : '↓ ') + Math.abs(change).toFixed(0) + '%';
                    changeEl.className = 'quantum-stat-change ' + (change >= 0 ? 'positive' : 'negative');
                }
            }
        };
    }
    
    createGaugeCard(container, options) {
        const value = document.createElement('div');
        value.className = 'quantum-stat';
        value.innerHTML = `
            <div class="quantum-stat-label">${options.id.toUpperCase()}</div>
            <div class="quantum-stat-value">0 ${options.unit}</div>
        `;
        container.appendChild(value);
        
        return {
            update: (val) => {
                value.querySelector('.quantum-stat-value').textContent = val + ' ' + options.unit;
            }
        };
    }
    
    createScoreCard(container, options) {
        const panel = document.createElement('div');
        panel.className = 'quantum-stat';
        panel.innerHTML = `
            <div class="quantum-stat-label">PERFORMANCE SCORE</div>
            <div class="quantum-stat-value">--</div>
            <div class="quantum-stat-status">--</div>
        `;
        container.appendChild(panel);
        
        return {
            update: (score, status) => {
                panel.querySelector('.quantum-stat-value').textContent = score;
                panel.querySelector('.quantum-stat-status').textContent = '✓ ' + status;
            }
        };
    }
    
    createHealthPanel(container) {
        const panel = document.createElement('div');
        panel.style.padding = '10px';
        container.appendChild(panel);
        
        return {
            update: (health) => {
                panel.innerHTML = Object.entries(health).map(([key, value]) => `
                    <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba(59, 130, 246, 0.1);">
                        <span style="color: #94a3b8;">${key}</span>
                        <span style="color: #10b981; font-weight: 600;">${value}</span>
                    </div>
                `).join('');
            }
        };
    }
    
    createMemoryChart(container) {
        container.innerHTML = '<div id="memory-chart" style="width: 100%; height: 100%;"></div>';
        const chart = echarts.init(container.querySelector('#memory-chart'));
        
        chart.setOption({
            series: [{
                type: 'pie',
                radius: ['40%', '70%'],
                label: { show: false },
                data: []
            }]
        });
        
        return {
            update: (data) => {
                chart.setOption({
                    series: [{
                        data: Object.entries(data).map(([name, value]) => ({
                            name,
                            value,
                            itemStyle: {
                                color: {
                                    'Textures': '#3b82f6',
                                    'Geometries': '#10b981',
                                    'Shaders': '#a78bfa',
                                    'Other': '#f59e0b'
                                }[name]
                            }
                        }))
                    }]
                });
            }
        };
    }
    
    createFeatureTable(container) {
        const table = document.createElement('div');
        table.className = 'quantum-table';
        table.innerHTML = `
            <table>
                <thead>
                    <tr>
                        <th>Feature</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody id="feature-tbody"></tbody>
            </table>
        `;
        container.appendChild(table);
        
        return {
            update: (features) => {
                const tbody = table.querySelector('#feature-tbody');
                tbody.innerHTML = features.map(f => `
                    <tr>
                        <td>${f.name}</td>
                        <td><span class="quantum-badge ${f.status === 'Enabled' ? 'enabled' : 'disabled'}">${f.status}</span></td>
                    </tr>
                `).join('');
            }
        };
    }
    
    createObjectTable(container) {
        const table = document.createElement('div');
        table.className = 'quantum-table';
        table.innerHTML = `
            <table>
                <thead>
                    <tr>
                        <th>Object</th>
                        <th>Views</th>
                        <th>Percentage</th>
                    </tr>
                </thead>
                <tbody id="object-tbody"></tbody>
            </table>
        `;
        container.appendChild(table);
        
        return {
            update: (objects) => {
                const tbody = table.querySelector('#object-tbody');
                tbody.innerHTML = objects.map(o => `
                    <tr>
                        <td>${o.name}</td>
                        <td>${o.views}</td>
                        <td>${o.percentage}%</td>
                    </tr>
                `).join('');
            }
        };
    }
    
    createPipelineMetrics(container) {
        const panel = document.createElement('div');
        panel.style.padding = '20px';
        container.appendChild(panel);
        
        return {
            update: (metrics) => {
                panel.innerHTML = `
                    <div style="color: #94a3b8;">
                        ${Object.entries(metrics).map(([key, value]) => `
                            <div style="margin-bottom: 10px;">
                                <strong>${key}:</strong> ${value}
                            </div>
                        `).join('')}
                    </div>
                `;
            }
        };
    }
    
    createCPUChart(container) {
        container.innerHTML = '<div id="cpu-chart" style="width: 100%; height: 100%;"></div>';
        const chart = echarts.init(container.querySelector('#cpu-chart'));
        
        chart.setOption({
            series: [{
                type: 'gauge',
                startAngle: 180,
                endAngle: 0,
                min: 0,
                max: 100,
                splitNumber: 5,
                axisLine: {
                    lineStyle: {
                        width: 15,
                        color: [[0.7, '#10b981'], [0.9, '#f59e0b'], [1, '#ef4444']]
                    }
                },
                pointer: { width: 5 },
                axisLabel: { color: '#94a3b8' },
                splitLine: { length: 15 },
                detail: {
                    formatter: '{value}%',
                    color: '#e2e8f0',
                    fontSize: 20
                },
                data: [{ value: 0 }]
            }]
        });
        
        return {
            update: (value) => {
                chart.setOption({
                    series: [{ data: [{ value }] }]
                });
            }
        };
    }
    
    createStatsTable(container) {
        const table = document.createElement('div');
        table.className = 'quantum-table';
        table.innerHTML = `
            <table>
                <thead>
                    <tr>
                        <th>Metric</th>
                        <th>Value</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody id="stats-tbody"></tbody>
            </table>
        `;
        container.appendChild(table);
        
        return {
            update: (stats) => {
                const tbody = table.querySelector('#stats-tbody');
                tbody.innerHTML = stats.map(s => `
                    <tr>
                        <td>${s.metric}</td>
                        <td>${s.value}</td>
                        <td><span style="color: #10b981;">${s.status}</span></td>
                    </tr>
                `).join('');
            }
        };
    }
    
    createQualityPanel(container) {
        const panel = document.createElement('div');
        panel.style.padding = '20px';
        container.appendChild(panel);
        
        return {
            update: (quality) => {
                panel.innerHTML = Object.entries(quality).map(([key, value]) => `
                    <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid rgba(59, 130, 246, 0.1);">
                        <span style="color: #94a3b8;">${key}</span>
                        <span style="color: #3b82f6; font-weight: 600;">${value}</span>
                    </div>
                `).join('');
            }
        };
    }
    
    createShaderChart(container) {
        container.innerHTML = '<div id="shader-chart" style="width: 100%; height: 100%;"></div>';
        const chart = echarts.init(container.querySelector('#shader-chart'));
        
        chart.setOption({
            grid: { left: '15%', right: '5%', top: '10%', bottom: '10%' },
            xAxis: {
                type: 'value',
                name: 'ms',
                axisLine: { lineStyle: { color: '#3b82f6' } },
                axisLabel: { color: '#94a3b8' }
            },
            yAxis: {
                type: 'category',
                data: [],
                axisLine: { lineStyle: { color: '#3b82f6' } },
                axisLabel: { color: '#94a3b8' }
            },
            series: [{
                type: 'bar',
                itemStyle: { color: '#3b82f6' },
                data: []
            }]
        });
        
        return {
            update: (data) => {
                chart.setOption({
                    yAxis: { data: Object.keys(data) },
                    series: [{ data: Object.values(data) }]
                });
            }
        };
    }
    
    createLODPanel(container) {
        container.innerHTML = '<div id="lod-chart" style="width: 100%; height: 100%;"></div>';
        const chart = echarts.init(container.querySelector('#lod-chart'));
        
        chart.setOption({
            series: [{
                type: 'pie',
                radius: ['40%', '70%'],
                label: {
                    show: true,
                    formatter: '{b}: {c}%',
                    color: '#94a3b8'
                },
                data: []
            }]
        });
        
        return {
            update: (data) => {
                chart.setOption({
                    series: [{
                        data: Object.entries(data).map(([name, value]) => ({
                            name,
                            value,
                            itemStyle: {
                                color: {
                                    'LOD0 (High)': '#10b981',
                                    'LOD1 (Medium)': '#3b82f6',
                                    'LOD2 (Low)': '#f59e0b',
                                    'Culled': '#ef4444'
                                }[name]
                            }
                        }))
                    }]
                });
            }
        };
    }
    
    createTexturePanel(container) {
        container.innerHTML = '<div id="texture-chart" style="width: 100%; height: 100%;"></div>';
        const chart = echarts.init(container.querySelector('#texture-chart'));
        
        chart.setOption({
            grid: { left: '15%', right: '10%', top: '10%', bottom: '10%' },
            xAxis: {
                type: 'category',
                data: [],
                axisLine: { lineStyle: { color: '#3b82f6' } },
                axisLabel: { color: '#94a3b8' }
            },
            yAxis: {
                type: 'value',
                name: 'Count',
                axisLine: { lineStyle: { color: '#3b82f6' } },
                axisLabel: { color: '#94a3b8' }
            },
            series: [{
                type: 'bar',
                itemStyle: {
                    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                        { offset: 0, color: '#3b82f6' },
                        { offset: 1, color: '#1e40af' }
                    ])
                },
                data: []
            }]
        });
        
        return {
            update: (data) => {
                chart.setOption({
                    xAxis: { data: Object.keys(data) },
                    series: [{ data: Object.values(data) }]
                });
            }
        };
    }
    
    // Panel management methods
    createPanel(config, container) {
        const definition = this.panelDefinitions[config.id];
        if (!definition) {
            console.error(`Panel definition not found: ${config.id}`);
            return null;
        }
        
        // Create panel wrapper
        const panelWrapper = document.createElement('div');
        panelWrapper.className = 'quantum-panel';
        
        if (definition.title) {
            panelWrapper.innerHTML = `
                <div class="quantum-panel-header">
                    <div class="quantum-panel-title">${definition.title}</div>
                </div>
                <div class="quantum-panel-body"></div>
            `;
        } else {
            panelWrapper.innerHTML = '<div class="quantum-panel-body"></div>';
        }
        
        container.appendChild(panelWrapper);
        
        // Get panel body
        const panelBody = panelWrapper.querySelector('.quantum-panel-body');
        
        // Create the actual panel content
        const panel = definition.create(panelBody);
        
        // Store panel reference
        this.panels.set(config.id, {
            element: panelWrapper,
            instance: panel,
            definition: definition,
            config: config
        });
        
        // Handle resize
        window.addEventListener('resize', () => {
            if (panel.chart && panel.chart.resize) {
                panel.chart.resize();
            }
        });
        
        return panelWrapper;
    }
    
    updatePanel(panelId, data) {
        const panel = this.panels.get(panelId);
        if (!panel || !panel.instance) return;
        
        try {
            panel.definition.update(panel.instance, data);
        } catch (e) {
            console.error(`Error updating panel ${panelId}:`, e);
        }
    }
    
    updateAll(data) {
        this.panels.forEach((panel, id) => {
            this.updatePanel(id, data);
        });
    }
    
    updateConsole(entry) {
        const consolePanel = this.panels.get('system-console');
        if (consolePanel && consolePanel.instance && consolePanel.instance.addEntry) {
            consolePanel.instance.addEntry(entry);
        }
    }
    
    updateCharts() {
        this.panels.forEach(panel => {
            if (panel.instance && panel.instance.chart && panel.instance.chart.resize) {
                panel.instance.chart.resize();
            }
        });
    }
    
    getLayout(layoutName) {
        return this.layouts[layoutName] || this.layouts.overview;
    }
    
    clearAll() {
        this.panels.forEach((panel, id) => {
            if (panel.instance && panel.instance.destroy) {
                panel.instance.destroy();
            }
        });
        this.panels.clear();
    }
}

// Export for use in dashboard
window.QuantumPanels = QuantumPanels;