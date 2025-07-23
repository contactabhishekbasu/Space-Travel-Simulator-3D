// Quantum Dashboard Visualizations
// Custom visualization components for the Space Travel Simulator Analytics

class QuantumVisualizations {
    constructor() {
        this.charts = new Map();
        this.themes = {
            dark: {
                backgroundColor: 'transparent',
                textColor: '#e0e7ff',
                gridColor: 'rgba(59, 130, 246, 0.1)',
                axisColor: 'rgba(59, 130, 246, 0.3)',
                colors: ['#60a5fa', '#a78bfa', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6']
            }
        };
        this.currentTheme = this.themes.dark;
        this.animationFrames = new Map();
        this.dataBuffers = new Map();
    }
    
    // Create a stat panel
    createStatPanel(container, config) {
        const panel = document.createElement('div');
        panel.className = 'quantum-stat';
        panel.innerHTML = `
            <div class="quantum-stat-value" id="${config.id}-value">--</div>
            <div class="quantum-stat-label">${config.label}</div>
            <div class="quantum-stat-change" id="${config.id}-change"></div>
        `;
        container.appendChild(panel);
        
        return {
            update: (value, change) => {
                const valueEl = panel.querySelector(`#${config.id}-value`);
                const changeEl = panel.querySelector(`#${config.id}-change`);
                
                // Format value
                if (config.format === 'number') {
                    valueEl.textContent = numeral(value).format('0,0');
                } else if (config.format === 'decimal') {
                    valueEl.textContent = numeral(value).format('0,0.0');
                } else if (config.format === 'percentage') {
                    valueEl.textContent = numeral(value).format('0%');
                } else if (config.format === 'time') {
                    valueEl.textContent = this.formatDuration(value);
                } else {
                    valueEl.textContent = value;
                }
                
                // Show change if provided
                if (change !== undefined && changeEl) {
                    const changeClass = change >= 0 ? 'positive' : 'negative';
                    const arrow = change >= 0 ? '↑' : '↓';
                    changeEl.className = `quantum-stat-change ${changeClass}`;
                    changeEl.innerHTML = `${arrow} ${Math.abs(change).toFixed(1)}%`;
                }
            }
        };
    }
    
    // Create a gauge chart
    createGaugeChart(container, config) {
        const chartDom = container;
        const chart = echarts.init(chartDom, null, { renderer: 'canvas' });
        
        const option = {
            series: [{
                type: 'gauge',
                min: config.min || 0,
                max: config.max || 100,
                radius: '90%',
                progress: {
                    show: true,
                    width: 18
                },
                axisLine: {
                    lineStyle: {
                        width: 18,
                        color: [[1, 'rgba(59, 130, 246, 0.2)']]
                    }
                },
                axisTick: {
                    show: false
                },
                splitLine: {
                    show: false
                },
                axisLabel: {
                    distance: 25,
                    color: this.currentTheme.textColor,
                    fontSize: 12
                },
                anchor: {
                    show: true,
                    showAbove: true,
                    size: 20,
                    itemStyle: {
                        borderWidth: 8,
                        borderColor: config.color || this.currentTheme.colors[0]
                    }
                },
                title: {
                    show: true,
                    offsetCenter: [0, '70%'],
                    color: this.currentTheme.textColor,
                    fontSize: 14,
                    fontWeight: 600
                },
                detail: {
                    valueAnimation: true,
                    fontSize: 24,
                    fontWeight: 700,
                    offsetCenter: [0, '40%'],
                    formatter: config.formatter || '{value}',
                    color: config.color || this.currentTheme.colors[0]
                },
                data: [{
                    value: 0,
                    name: config.label || ''
                }]
            }]
        };
        
        chart.setOption(option);
        this.charts.set(config.id, chart);
        
        // Handle resize
        this.observeResize(container, chart);
        
        return {
            update: (value) => {
                const color = this.getGaugeColor(value, config);
                chart.setOption({
                    series: [{
                        progress: {
                            itemStyle: {
                                color: color
                            }
                        },
                        anchor: {
                            itemStyle: {
                                borderColor: color
                            }
                        },
                        detail: {
                            color: color
                        },
                        data: [{
                            value: value,
                            name: config.label || ''
                        }]
                    }]
                });
            },
            destroy: () => {
                chart.dispose();
                this.charts.delete(config.id);
            }
        };
    }
    
    // Create a line chart
    createLineChart(container, config) {
        const chartDom = container;
        const chart = echarts.init(chartDom, null, { renderer: 'canvas' });
        
        const option = {
            backgroundColor: this.currentTheme.backgroundColor,
            tooltip: {
                trigger: 'axis',
                backgroundColor: 'rgba(13, 27, 62, 0.95)',
                borderColor: 'rgba(59, 130, 246, 0.5)',
                textStyle: {
                    color: this.currentTheme.textColor
                },
                axisPointer: {
                    type: 'cross',
                    label: {
                        backgroundColor: 'rgba(59, 130, 246, 0.8)'
                    }
                }
            },
            legend: {
                data: config.series.map(s => s.name),
                textStyle: {
                    color: this.currentTheme.textColor
                },
                top: 10
            },
            grid: {
                left: '3%',
                right: '4%',
                bottom: '3%',
                top: '15%',
                containLabel: true
            },
            xAxis: {
                type: 'time',
                boundaryGap: false,
                axisLine: {
                    lineStyle: {
                        color: this.currentTheme.axisColor
                    }
                },
                axisLabel: {
                    color: this.currentTheme.textColor,
                    formatter: (value) => {
                        return moment(value).format('HH:mm:ss');
                    }
                },
                splitLine: {
                    lineStyle: {
                        color: this.currentTheme.gridColor
                    }
                }
            },
            yAxis: config.yAxis || [{
                type: 'value',
                name: config.yAxisName || '',
                nameTextStyle: {
                    color: this.currentTheme.textColor
                },
                axisLine: {
                    lineStyle: {
                        color: this.currentTheme.axisColor
                    }
                },
                axisLabel: {
                    color: this.currentTheme.textColor
                },
                splitLine: {
                    lineStyle: {
                        color: this.currentTheme.gridColor
                    }
                }
            }],
            series: config.series.map((s, i) => ({
                name: s.name,
                type: 'line',
                smooth: true,
                symbol: 'none',
                sampling: 'lttb',
                itemStyle: {
                    color: s.color || this.currentTheme.colors[i]
                },
                areaStyle: s.area ? {
                    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                        { offset: 0, color: `${s.color || this.currentTheme.colors[i]}40` },
                        { offset: 1, color: `${s.color || this.currentTheme.colors[i]}05` }
                    ])
                } : null,
                data: []
            }))
        };
        
        chart.setOption(option);
        this.charts.set(config.id, chart);
        
        // Handle resize
        this.observeResize(container, chart);
        
        return {
            update: (data) => {
                const series = data.map((seriesData, i) => ({
                    data: seriesData
                }));
                
                chart.setOption({
                    series: series
                });
            },
            destroy: () => {
                chart.dispose();
                this.charts.delete(config.id);
            }
        };
    }
    
    // Create a 3D solar system minimap
    create3DSolarSystem(container, config) {
        // Create Three.js scene
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ 
            antialias: true, 
            alpha: true 
        });
        
        renderer.setSize(container.clientWidth, container.clientHeight);
        renderer.setClearColor(0x000000, 0);
        container.appendChild(renderer.domElement);
        
        // Add lights
        const ambientLight = new THREE.AmbientLight(0x404040);
        scene.add(ambientLight);
        
        const pointLight = new THREE.PointLight(0xffffff, 1, 0);
        pointLight.position.set(0, 0, 0);
        scene.add(pointLight);
        
        // Create sun
        const sunGeometry = new THREE.SphereGeometry(5, 32, 32);
        const sunMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xffff00,
            emissive: 0xffff00,
            emissiveIntensity: 1
        });
        const sun = new THREE.Mesh(sunGeometry, sunMaterial);
        scene.add(sun);
        
        // Create orbit lines
        const orbitMaterial = new THREE.LineBasicMaterial({ 
            color: 0x3b82f6,
            opacity: 0.3,
            transparent: true
        });
        
        // Planet meshes
        const planets = {};
        const planetColors = {
            mercury: 0x8b7d6b,
            venus: 0xffd700,
            earth: 0x4169e1,
            mars: 0xcd5c5c,
            jupiter: 0xdaa520,
            saturn: 0xf4a460,
            uranus: 0x4fd1c5,
            neptune: 0x4169e1
        };
        
        // Camera position
        camera.position.set(100, 100, 100);
        camera.lookAt(0, 0, 0);
        
        // Controls
        let mouseX = 0, mouseY = 0;
        let targetRotationX = 0, targetRotationY = 0;
        
        container.addEventListener('mousemove', (e) => {
            const rect = container.getBoundingClientRect();
            mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
            mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;
            
            targetRotationY = mouseX * Math.PI * 0.5;
            targetRotationX = mouseY * Math.PI * 0.5;
        });
        
        // Animation loop
        let animationId;
        const animate = () => {
            animationId = requestAnimationFrame(animate);
            
            // Smooth camera rotation
            camera.position.x += (Math.sin(targetRotationY) * 150 - camera.position.x) * 0.05;
            camera.position.z += (Math.cos(targetRotationY) * 150 - camera.position.z) * 0.05;
            camera.position.y += (Math.sin(targetRotationX) * 100 - camera.position.y) * 0.05;
            camera.lookAt(0, 0, 0);
            
            // Rotate sun
            sun.rotation.y += 0.005;
            
            renderer.render(scene, camera);
        };
        
        animate();
        
        // Handle resize
        this.observeResize(container, null, () => {
            camera.aspect = container.clientWidth / container.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(container.clientWidth, container.clientHeight);
        });
        
        return {
            update: (data) => {
                // Update planet positions
                if (data.planets) {
                    Object.entries(data.planets).forEach(([name, planetData]) => {
                        if (!planets[name]) {
                            // Create planet if it doesn't exist
                            const geometry = new THREE.SphereGeometry(2, 16, 16);
                            const material = new THREE.MeshLambertMaterial({ 
                                color: planetColors[name] || 0xffffff 
                            });
                            const planet = new THREE.Mesh(geometry, material);
                            planets[name] = planet;
                            scene.add(planet);
                            
                            // Create orbit
                            const orbitRadius = planetData.distanceFromSun / 10; // Scale down
                            const orbitPoints = [];
                            for (let i = 0; i <= 64; i++) {
                                const angle = (i / 64) * Math.PI * 2;
                                orbitPoints.push(new THREE.Vector3(
                                    Math.cos(angle) * orbitRadius,
                                    0,
                                    Math.sin(angle) * orbitRadius
                                ));
                            }
                            const orbitGeometry = new THREE.BufferGeometry().setFromPoints(orbitPoints);
                            const orbit = new THREE.Line(orbitGeometry, orbitMaterial);
                            scene.add(orbit);
                        }
                        
                        // Update position
                        const planet = planets[name];
                        if (planet && planetData.position) {
                            planet.position.set(
                                planetData.position.x / 10,
                                planetData.position.y / 10,
                                planetData.position.z / 10
                            );
                        }
                    });
                }
            },
            destroy: () => {
                cancelAnimationFrame(animationId);
                renderer.dispose();
                container.removeChild(renderer.domElement);
            }
        };
    }
    
    // Create a heat map
    createHeatMap(container, config) {
        const chartDom = container;
        const chart = echarts.init(chartDom, null, { renderer: 'canvas' });
        
        const hours = Array.from({length: 24}, (_, i) => `${i}:00`);
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        
        const option = {
            backgroundColor: this.currentTheme.backgroundColor,
            tooltip: {
                position: 'top',
                backgroundColor: 'rgba(13, 27, 62, 0.95)',
                borderColor: 'rgba(59, 130, 246, 0.5)',
                textStyle: {
                    color: this.currentTheme.textColor
                }
            },
            grid: {
                left: '3%',
                right: '4%',
                bottom: '3%',
                top: '3%',
                containLabel: true
            },
            xAxis: {
                type: 'category',
                data: hours,
                splitArea: {
                    show: true,
                    areaStyle: {
                        color: ['rgba(0,0,0,0)', 'rgba(0,0,0,0.1)']
                    }
                },
                axisLine: {
                    lineStyle: {
                        color: this.currentTheme.axisColor
                    }
                },
                axisLabel: {
                    color: this.currentTheme.textColor
                }
            },
            yAxis: {
                type: 'category',
                data: days,
                splitArea: {
                    show: true,
                    areaStyle: {
                        color: ['rgba(0,0,0,0)', 'rgba(0,0,0,0.1)']
                    }
                },
                axisLine: {
                    lineStyle: {
                        color: this.currentTheme.axisColor
                    }
                },
                axisLabel: {
                    color: this.currentTheme.textColor
                }
            },
            visualMap: {
                min: 0,
                max: config.max || 100,
                calculable: true,
                orient: 'horizontal',
                left: 'center',
                bottom: '0%',
                textStyle: {
                    color: this.currentTheme.textColor
                },
                inRange: {
                    color: ['#0a0e27', '#1e40af', '#3b82f6', '#60a5fa', '#93c5fd']
                }
            },
            series: [{
                name: config.label || 'Heat Map',
                type: 'heatmap',
                data: [],
                label: {
                    show: false
                },
                emphasis: {
                    itemStyle: {
                        shadowBlur: 10,
                        shadowColor: 'rgba(0, 0, 0, 0.5)'
                    }
                }
            }]
        };
        
        chart.setOption(option);
        this.charts.set(config.id, chart);
        
        // Handle resize
        this.observeResize(container, chart);
        
        return {
            update: (data) => {
                chart.setOption({
                    series: [{
                        data: data
                    }]
                });
            },
            destroy: () => {
                chart.dispose();
                this.charts.delete(config.id);
            }
        };
    }
    
    // Create a polar chart for orbital mechanics
    createPolarChart(container, config) {
        const chartDom = container;
        const chart = echarts.init(chartDom, null, { renderer: 'canvas' });
        
        const option = {
            backgroundColor: this.currentTheme.backgroundColor,
            tooltip: {
                trigger: 'item',
                backgroundColor: 'rgba(13, 27, 62, 0.95)',
                borderColor: 'rgba(59, 130, 246, 0.5)',
                textStyle: {
                    color: this.currentTheme.textColor
                }
            },
            polar: {
                center: ['50%', '50%'],
                radius: '80%'
            },
            angleAxis: {
                type: 'value',
                startAngle: 0,
                axisLine: {
                    lineStyle: {
                        color: this.currentTheme.axisColor
                    }
                },
                axisLabel: {
                    color: this.currentTheme.textColor
                },
                splitLine: {
                    lineStyle: {
                        color: this.currentTheme.gridColor
                    }
                }
            },
            radiusAxis: {
                min: 0,
                axisLine: {
                    lineStyle: {
                        color: this.currentTheme.axisColor
                    }
                },
                axisLabel: {
                    color: this.currentTheme.textColor
                },
                splitLine: {
                    lineStyle: {
                        color: this.currentTheme.gridColor
                    }
                }
            },
            series: []
        };
        
        chart.setOption(option);
        this.charts.set(config.id, chart);
        
        // Handle resize
        this.observeResize(container, chart);
        
        return {
            update: (data) => {
                const series = data.map((item, i) => ({
                    name: item.name,
                    type: 'line',
                    coordinateSystem: 'polar',
                    symbol: 'circle',
                    symbolSize: 8,
                    lineStyle: {
                        color: this.currentTheme.colors[i % this.currentTheme.colors.length],
                        width: 2
                    },
                    itemStyle: {
                        color: this.currentTheme.colors[i % this.currentTheme.colors.length]
                    },
                    data: item.data
                }));
                
                chart.setOption({
                    series: series
                });
            },
            destroy: () => {
                chart.dispose();
                this.charts.delete(config.id);
            }
        };
    }
    
    // Create a bar chart
    createBarChart(container, config) {
        const chartDom = container;
        const chart = echarts.init(chartDom, null, { renderer: 'canvas' });
        
        const option = {
            backgroundColor: this.currentTheme.backgroundColor,
            tooltip: {
                trigger: 'axis',
                axisPointer: {
                    type: 'shadow'
                },
                backgroundColor: 'rgba(13, 27, 62, 0.95)',
                borderColor: 'rgba(59, 130, 246, 0.5)',
                textStyle: {
                    color: this.currentTheme.textColor
                }
            },
            grid: {
                left: '3%',
                right: '4%',
                bottom: '3%',
                top: '3%',
                containLabel: true
            },
            xAxis: {
                type: 'category',
                data: config.categories || [],
                axisLine: {
                    lineStyle: {
                        color: this.currentTheme.axisColor
                    }
                },
                axisLabel: {
                    color: this.currentTheme.textColor,
                    rotate: config.rotateLabels || 0
                }
            },
            yAxis: {
                type: 'value',
                axisLine: {
                    lineStyle: {
                        color: this.currentTheme.axisColor
                    }
                },
                axisLabel: {
                    color: this.currentTheme.textColor
                },
                splitLine: {
                    lineStyle: {
                        color: this.currentTheme.gridColor
                    }
                }
            },
            series: [{
                name: config.label || 'Value',
                type: 'bar',
                data: [],
                itemStyle: {
                    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                        { offset: 0, color: config.color || this.currentTheme.colors[0] },
                        { offset: 1, color: `${config.color || this.currentTheme.colors[0]}80` }
                    ]),
                    borderRadius: [4, 4, 0, 0]
                },
                emphasis: {
                    itemStyle: {
                        color: config.color || this.currentTheme.colors[0]
                    }
                }
            }]
        };
        
        chart.setOption(option);
        this.charts.set(config.id, chart);
        
        // Handle resize
        this.observeResize(container, chart);
        
        return {
            update: (data) => {
                chart.setOption({
                    xAxis: {
                        data: data.categories || config.categories
                    },
                    series: [{
                        data: data.values
                    }]
                });
            },
            destroy: () => {
                chart.dispose();
                this.charts.delete(config.id);
            }
        };
    }
    
    // Create a log panel
    createLogPanel(container, config) {
        const panel = document.createElement('div');
        panel.className = 'quantum-log';
        container.appendChild(panel);
        
        const maxEntries = config.maxEntries || 100;
        const entries = [];
        
        return {
            addEntry: (level, message) => {
                const time = moment().format('HH:mm:ss');
                const entry = document.createElement('div');
                entry.className = 'quantum-log-entry';
                entry.innerHTML = `
                    <span class="quantum-log-time">${time}</span>
                    <span class="quantum-log-level ${level}">${level.toUpperCase()}</span>
                    <span class="quantum-log-message">${message}</span>
                `;
                
                panel.insertBefore(entry, panel.firstChild);
                entries.push(entry);
                
                // Limit entries
                if (entries.length > maxEntries) {
                    const removed = entries.shift();
                    removed.remove();
                }
            },
            clear: () => {
                panel.innerHTML = '';
                entries.length = 0;
            }
        };
    }
    
    // Helper methods
    getGaugeColor(value, config) {
        if (config.thresholds) {
            if (value >= config.thresholds.danger) return '#ef4444';
            if (value >= config.thresholds.warning) return '#f59e0b';
        }
        return config.color || '#10b981';
    }
    
    formatDuration(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        
        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        } else if (minutes > 0) {
            return `${minutes}m ${secs}s`;
        } else {
            return `${secs}s`;
        }
    }
    
    observeResize(container, chart, customHandler) {
        const resizeObserver = new ResizeObserver(() => {
            if (customHandler) {
                customHandler();
            } else if (chart) {
                chart.resize();
            }
        });
        
        resizeObserver.observe(container);
        
        // Store observer for cleanup
        container._resizeObserver = resizeObserver;
    }
    
    // Create real-time FPS chart
    createFPSChart(container, config) {
        const chartDom = container;
        const chart = echarts.init(chartDom, null, { renderer: 'canvas' });
        
        // Initialize data buffer
        const bufferSize = config.bufferSize || 60;
        const dataBuffer = [];
        
        const option = {
            backgroundColor: this.currentTheme.backgroundColor,
            tooltip: {
                trigger: 'axis',
                backgroundColor: 'rgba(13, 27, 62, 0.95)',
                borderColor: 'rgba(59, 130, 246, 0.5)',
                formatter: function(params) {
                    const fps = params[0].value[1];
                    const smooth = params[1]?.value[1] || fps;
                    return `FPS: ${fps.toFixed(1)}<br/>Smooth: ${smooth.toFixed(1)}`;
                }
            },
            grid: {
                left: '5%',
                right: '5%',
                bottom: '10%',
                top: '10%',
                containLabel: true
            },
            xAxis: {
                type: 'time',
                splitLine: { show: false },
                axisLine: {
                    lineStyle: { color: this.currentTheme.axisColor }
                },
                axisLabel: {
                    color: this.currentTheme.textColor,
                    formatter: '{HH}:{mm}:{ss}'
                }
            },
            yAxis: {
                type: 'value',
                name: 'FPS',
                nameTextStyle: { color: this.currentTheme.textColor },
                min: 0,
                max: config.maxFPS || 120,
                splitLine: {
                    lineStyle: {
                        color: this.currentTheme.gridColor,
                        type: 'dashed'
                    }
                },
                axisLine: {
                    lineStyle: { color: this.currentTheme.axisColor }
                },
                axisLabel: { color: this.currentTheme.textColor }
            },
            series: [
                {
                    name: 'FPS',
                    type: 'line',
                    smooth: false,
                    symbol: 'none',
                    sampling: 'lttb',
                    itemStyle: { color: '#60a5fa' },
                    lineStyle: { width: 2 },
                    data: []
                },
                {
                    name: 'Smooth FPS',
                    type: 'line',
                    smooth: true,
                    symbol: 'none',
                    sampling: 'lttb',
                    itemStyle: { color: '#10b981' },
                    lineStyle: { width: 2, type: 'dashed' },
                    data: []
                }
            ],
            dataZoom: [{
                type: 'inside',
                start: 80,
                end: 100
            }]
        };
        
        chart.setOption(option);
        this.charts.set(config.id, chart);
        this.dataBuffers.set(config.id, dataBuffer);
        
        // Handle resize
        this.observeResize(container, chart);
        
        return {
            update: (fps, smoothFps) => {
                const now = Date.now();
                dataBuffer.push({
                    time: now,
                    fps: fps,
                    smooth: smoothFps
                });
                
                // Keep buffer size limited
                if (dataBuffer.length > bufferSize) {
                    dataBuffer.shift();
                }
                
                // Update chart
                chart.setOption({
                    series: [
                        {
                            data: dataBuffer.map(d => [d.time, d.fps])
                        },
                        {
                            data: dataBuffer.map(d => [d.time, d.smooth])
                        }
                    ]
                });
            },
            destroy: () => {
                chart.dispose();
                this.charts.delete(config.id);
                this.dataBuffers.delete(config.id);
            }
        };
    }
    
    // Create memory usage visualization
    createMemoryChart(container, config) {
        const chartDom = container;
        const chart = echarts.init(chartDom, null, { renderer: 'canvas' });
        
        const option = {
            backgroundColor: this.currentTheme.backgroundColor,
            tooltip: {
                trigger: 'item',
                backgroundColor: 'rgba(13, 27, 62, 0.95)',
                borderColor: 'rgba(59, 130, 246, 0.5)',
                formatter: '{b}: {c} MB ({d}%)'
            },
            series: [{
                type: 'pie',
                radius: ['40%', '70%'],
                avoidLabelOverlap: false,
                itemStyle: {
                    borderRadius: 10,
                    borderColor: '#0a0e27',
                    borderWidth: 2
                },
                label: {
                    show: false,
                    position: 'center'
                },
                emphasis: {
                    label: {
                        show: true,
                        fontSize: 20,
                        fontWeight: 'bold'
                    }
                },
                labelLine: { show: false },
                data: []
            }]
        };
        
        chart.setOption(option);
        this.charts.set(config.id, chart);
        
        // Handle resize
        this.observeResize(container, chart);
        
        return {
            update: (memoryData) => {
                const data = [
                    { value: memoryData.used, name: 'Used', itemStyle: { color: '#60a5fa' } },
                    { value: memoryData.total - memoryData.used, name: 'Available', itemStyle: { color: '#1e40af' } }
                ];
                
                chart.setOption({
                    series: [{
                        data: data
                    }]
                });
            },
            destroy: () => {
                chart.dispose();
                this.charts.delete(config.id);
            }
        };
    }
    
    // Create WebGL stats visualization
    createWebGLStats(container, config) {
        const chartDom = container;
        const chart = echarts.init(chartDom, null, { renderer: 'canvas' });
        
        const option = {
            backgroundColor: this.currentTheme.backgroundColor,
            tooltip: {
                trigger: 'axis',
                axisPointer: { type: 'shadow' },
                backgroundColor: 'rgba(13, 27, 62, 0.95)',
                borderColor: 'rgba(59, 130, 246, 0.5)'
            },
            legend: {
                data: ['Draw Calls', 'Triangles', 'Geometries', 'Textures'],
                textStyle: { color: this.currentTheme.textColor },
                top: 10
            },
            grid: {
                left: '3%',
                right: '4%',
                bottom: '3%',
                top: '15%',
                containLabel: true
            },
            xAxis: {
                type: 'time',
                boundaryGap: false,
                axisLine: {
                    lineStyle: { color: this.currentTheme.axisColor }
                },
                axisLabel: {
                    color: this.currentTheme.textColor,
                    formatter: '{HH}:{mm}:{ss}'
                }
            },
            yAxis: [
                {
                    type: 'value',
                    name: 'Count',
                    position: 'left',
                    axisLine: {
                        lineStyle: { color: this.currentTheme.colors[0] }
                    },
                    axisLabel: { color: this.currentTheme.textColor }
                },
                {
                    type: 'value',
                    name: 'Triangles',
                    position: 'right',
                    axisLine: {
                        lineStyle: { color: this.currentTheme.colors[1] }
                    },
                    axisLabel: { 
                        color: this.currentTheme.textColor,
                        formatter: value => (value / 1000).toFixed(0) + 'K'
                    }
                }
            ],
            series: [
                {
                    name: 'Draw Calls',
                    type: 'line',
                    smooth: true,
                    symbol: 'none',
                    yAxisIndex: 0,
                    itemStyle: { color: this.currentTheme.colors[0] },
                    data: []
                },
                {
                    name: 'Triangles',
                    type: 'line',
                    smooth: true,
                    symbol: 'none',
                    yAxisIndex: 1,
                    itemStyle: { color: this.currentTheme.colors[1] },
                    areaStyle: {
                        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                            { offset: 0, color: this.currentTheme.colors[1] + '40' },
                            { offset: 1, color: this.currentTheme.colors[1] + '05' }
                        ])
                    },
                    data: []
                }
            ]
        };
        
        chart.setOption(option);
        this.charts.set(config.id, chart);
        
        const dataBuffer = [];
        this.dataBuffers.set(config.id, dataBuffer);
        
        // Handle resize
        this.observeResize(container, chart);
        
        return {
            update: (stats) => {
                const now = Date.now();
                dataBuffer.push({
                    time: now,
                    ...stats
                });
                
                // Keep buffer size limited
                if (dataBuffer.length > 100) {
                    dataBuffer.shift();
                }
                
                chart.setOption({
                    series: [
                        {
                            data: dataBuffer.map(d => [d.time, d.calls || 0])
                        },
                        {
                            data: dataBuffer.map(d => [d.time, d.triangles || 0])
                        }
                    ]
                });
            },
            destroy: () => {
                chart.dispose();
                this.charts.delete(config.id);
                this.dataBuffers.delete(config.id);
            }
        };
    }
    
    // Create feature usage radial chart
    createFeatureUsageChart(container, config) {
        const chartDom = container;
        const chart = echarts.init(chartDom, null, { renderer: 'canvas' });
        
        const option = {
            backgroundColor: this.currentTheme.backgroundColor,
            tooltip: {
                trigger: 'item',
                backgroundColor: 'rgba(13, 27, 62, 0.95)',
                borderColor: 'rgba(59, 130, 246, 0.5)'
            },
            radar: {
                indicator: [],
                shape: 'polygon',
                splitNumber: 4,
                axisName: {
                    color: this.currentTheme.textColor
                },
                splitLine: {
                    lineStyle: {
                        color: this.currentTheme.gridColor
                    }
                },
                splitArea: {
                    show: true,
                    areaStyle: {
                        color: ['rgba(59, 130, 246, 0.05)', 'rgba(59, 130, 246, 0.1)']
                    }
                },
                axisLine: {
                    lineStyle: {
                        color: this.currentTheme.axisColor
                    }
                }
            },
            series: [{
                type: 'radar',
                data: [{
                    value: [],
                    name: 'Feature Usage',
                    symbol: 'circle',
                    symbolSize: 8,
                    lineStyle: {
                        color: '#60a5fa',
                        width: 2
                    },
                    areaStyle: {
                        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                            { offset: 0, color: '#60a5fa60' },
                            { offset: 1, color: '#60a5fa20' }
                        ])
                    }
                }]
            }]
        };
        
        chart.setOption(option);
        this.charts.set(config.id, chart);
        
        // Handle resize
        this.observeResize(container, chart);
        
        return {
            update: (features) => {
                const indicator = features.map(f => ({
                    name: f.name,
                    max: 100
                }));
                
                const values = features.map(f => f.usage);
                
                chart.setOption({
                    radar: { indicator },
                    series: [{
                        data: [{
                            value: values,
                            name: 'Feature Usage'
                        }]
                    }]
                });
            },
            destroy: () => {
                chart.dispose();
                this.charts.delete(config.id);
            }
        };
    }
    
    // Create planet visit flow diagram
    createPlanetFlowDiagram(container, config) {
        // Initialize D3.js flow diagram
        const width = container.clientWidth;
        const height = container.clientHeight;
        
        const svg = d3.select(container)
            .append('svg')
            .attr('width', width)
            .attr('height', height);
        
        const g = svg.append('g');
        
        // Add zoom behavior
        const zoom = d3.zoom()
            .scaleExtent([0.5, 3])
            .on('zoom', (event) => {
                g.attr('transform', event.transform);
            });
        
        svg.call(zoom);
        
        // Force simulation
        const simulation = d3.forceSimulation()
            .force('link', d3.forceLink().id(d => d.id).distance(100))
            .force('charge', d3.forceManyBody().strength(-300))
            .force('center', d3.forceCenter(width / 2, height / 2));
        
        // Store references
        const flowData = {
            svg, g, simulation,
            nodes: [],
            links: []
        };
        
        this.dataBuffers.set(config.id, flowData);
        
        return {
            update: (visits) => {
                // Convert visits to nodes and links
                const nodes = [];
                const links = [];
                const nodeMap = new Map();
                
                visits.forEach((visit, i) => {
                    if (!nodeMap.has(visit.planet)) {
                        const node = {
                            id: visit.planet,
                            name: visit.planet,
                            visits: 0,
                            radius: 10
                        };
                        nodes.push(node);
                        nodeMap.set(visit.planet, node);
                    }
                    
                    const node = nodeMap.get(visit.planet);
                    node.visits++;
                    node.radius = Math.min(30, 10 + node.visits * 2);
                    
                    // Create links between consecutive visits
                    if (i > 0) {
                        const sourceId = visits[i - 1].planet;
                        const targetId = visit.planet;
                        
                        let link = links.find(l => 
                            (l.source === sourceId && l.target === targetId) ||
                            (l.source === targetId && l.target === sourceId)
                        );
                        
                        if (!link) {
                            links.push({
                                source: sourceId,
                                target: targetId,
                                value: 1
                            });
                        } else {
                            link.value++;
                        }
                    }
                });
                
                // Update visualization
                this.updateFlowDiagram(flowData, nodes, links);
            },
            destroy: () => {
                svg.remove();
                this.dataBuffers.delete(config.id);
            }
        };
    }
    
    // Helper method to update flow diagram
    updateFlowDiagram(flowData, nodes, links) {
        const { g, simulation } = flowData;
        
        // Update links
        const link = g.selectAll('.link')
            .data(links, d => `${d.source}-${d.target}`);
        
        link.exit().remove();
        
        const linkEnter = link.enter()
            .append('line')
            .attr('class', 'link')
            .style('stroke', '#60a5fa40')
            .style('stroke-width', d => Math.sqrt(d.value) * 2);
        
        const linkUpdate = linkEnter.merge(link);
        
        // Update nodes
        const node = g.selectAll('.node')
            .data(nodes, d => d.id);
        
        node.exit().remove();
        
        const nodeEnter = node.enter()
            .append('g')
            .attr('class', 'node')
            .call(d3.drag()
                .on('start', dragstarted)
                .on('drag', dragged)
                .on('end', dragended));
        
        nodeEnter.append('circle')
            .attr('r', d => d.radius)
            .style('fill', '#60a5fa')
            .style('stroke', '#1e40af')
            .style('stroke-width', 2);
        
        nodeEnter.append('text')
            .attr('dy', '.35em')
            .attr('text-anchor', 'middle')
            .style('fill', '#e0e7ff')
            .style('font-size', '12px')
            .text(d => d.name);
        
        const nodeUpdate = nodeEnter.merge(node);
        
        // Update simulation
        simulation.nodes(nodes);
        simulation.force('link').links(links);
        simulation.alpha(0.3).restart();
        
        simulation.on('tick', () => {
            linkUpdate
                .attr('x1', d => d.source.x)
                .attr('y1', d => d.source.y)
                .attr('x2', d => d.target.x)
                .attr('y2', d => d.target.y);
            
            nodeUpdate
                .attr('transform', d => `translate(${d.x},${d.y})`);
        });
        
        // Drag functions
        function dragstarted(event, d) {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
        }
        
        function dragged(event, d) {
            d.fx = event.x;
            d.fy = event.y;
        }
        
        function dragended(event, d) {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
        }
    }
    
    // Create performance timeline
    createPerformanceTimeline(container, config) {
        const chartDom = container;
        const chart = echarts.init(chartDom, null, { renderer: 'canvas' });
        
        const option = {
            backgroundColor: this.currentTheme.backgroundColor,
            tooltip: {
                trigger: 'axis',
                backgroundColor: 'rgba(13, 27, 62, 0.95)',
                borderColor: 'rgba(59, 130, 246, 0.5)'
            },
            toolbox: {
                feature: {
                    dataZoom: { yAxisIndex: 'none' },
                    restore: {},
                    saveAsImage: {}
                },
                iconStyle: {
                    borderColor: this.currentTheme.textColor
                }
            },
            dataZoom: [{
                type: 'inside',
                start: 0,
                end: 100
            }, {
                start: 0,
                end: 100
            }],
            xAxis: {
                type: 'time',
                boundaryGap: false,
                axisLine: {
                    lineStyle: { color: this.currentTheme.axisColor }
                },
                axisLabel: { color: this.currentTheme.textColor }
            },
            yAxis: {
                type: 'value',
                name: 'Performance Score',
                nameTextStyle: { color: this.currentTheme.textColor },
                boundaryGap: [0, '100%'],
                axisLine: {
                    lineStyle: { color: this.currentTheme.axisColor }
                },
                axisLabel: { color: this.currentTheme.textColor }
            },
            series: [{
                name: 'Performance',
                type: 'line',
                smooth: true,
                symbol: 'none',
                areaStyle: {
                    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                        { offset: 0, color: '#60a5fa80' },
                        { offset: 1, color: '#60a5fa20' }
                    ])
                },
                itemStyle: { color: '#60a5fa' },
                data: []
            }]
        };
        
        chart.setOption(option);
        this.charts.set(config.id, chart);
        
        return {
            update: (data) => {
                chart.setOption({
                    series: [{
                        data: data.map(d => [d.timestamp, d.score])
                    }]
                });
            },
            destroy: () => {
                chart.dispose();
                this.charts.delete(config.id);
            }
        };
    }
    
    // Cleanup all charts
    destroy() {
        // Clear animation frames
        this.animationFrames.forEach((frameId) => {
            cancelAnimationFrame(frameId);
        });
        this.animationFrames.clear();
        
        // Dispose charts
        this.charts.forEach((chart, id) => {
            chart.dispose();
        });
        this.charts.clear();
        
        // Clear data buffers
        this.dataBuffers.clear();
    }
}

// Export for use in dashboard
window.QuantumVisualizations = QuantumVisualizations;