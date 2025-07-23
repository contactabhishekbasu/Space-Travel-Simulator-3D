// WebGL Charts - GPU-accelerated chart rendering with shared context
class WebGLChartRenderer {
    constructor(canvas, options = {}) {
        this.canvas = canvas;
        this.gl = null;
        this.options = {
            antialias: true,
            alpha: true,
            premultipliedAlpha: false,
            preserveDrawingBuffer: false,
            ...options
        };
        
        this.programs = {};
        this.buffers = {};
        this.textures = {};
        this.framebuffers = {};
        
        this.width = canvas.width;
        this.height = canvas.height;
        
        this.pixelRatio = window.devicePixelRatio || 1;
        
        this.initializeContext();
    }
    
    initializeContext() {
        try {
            // Try WebGL2 first, fallback to WebGL1
            this.gl = this.canvas.getContext('webgl2', this.options) || 
                      this.canvas.getContext('webgl', this.options);
            
            if (!this.gl) {
                console.error('[WebGL Charts] Failed to create WebGL context');
                throw new Error('WebGL not supported');
            }
            
            console.log('[WebGL Charts] Context created successfully');
            
            const gl = this.gl;
            
            // Set up WebGL state
            gl.enable(gl.BLEND);
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
            
            // Handle resize
            this.resizeCanvas();
            
            // Create shared resources
            this.createSharedPrograms();
            this.createSharedBuffers();
            
        } catch (error) {
            console.error('[WebGL Charts] Initialization failed:', error);
            throw error;
        }
    }
    
    createSharedPrograms() {
        // Line chart shader program
        this.programs.line = this.createProgram(
            // Vertex shader
            `
            attribute vec2 a_position;
            attribute float a_value;
            attribute float a_alpha;
            
            uniform vec2 u_resolution;
            uniform vec2 u_dataRange;
            uniform float u_thickness;
            
            varying float v_alpha;
            varying vec2 v_position;
            
            void main() {
                vec2 normalized = vec2(
                    a_position.x / u_resolution.x * 2.0 - 1.0,
                    (a_value - u_dataRange.x) / (u_dataRange.y - u_dataRange.x) * 2.0 - 1.0
                );
                
                gl_Position = vec4(normalized, 0.0, 1.0);
                gl_PointSize = u_thickness;
                v_alpha = a_alpha;
                v_position = a_position;
            }
            `,
            // Fragment shader
            `
            precision highp float;
            
            uniform vec4 u_color;
            uniform float u_glowIntensity;
            uniform vec2 u_resolution;
            
            varying float v_alpha;
            varying vec2 v_position;
            
            void main() {
                vec2 center = gl_PointCoord - vec2(0.5);
                float dist = length(center);
                
                // Soft circle with glow
                float alpha = smoothstep(0.5, 0.0, dist);
                alpha *= v_alpha;
                
                // Add glow effect
                vec3 color = u_color.rgb;
                if (u_glowIntensity > 0.0) {
                    float glow = exp(-dist * 3.0) * u_glowIntensity;
                    color += vec3(glow);
                }
                
                gl_FragColor = vec4(color, alpha * u_color.a);
            }
            `
        );
        
        // Area chart shader program
        this.programs.area = this.createProgram(
            // Vertex shader
            `
            attribute vec2 a_position;
            attribute float a_value;
            
            uniform vec2 u_resolution;
            uniform vec2 u_dataRange;
            
            varying vec2 v_position;
            varying float v_value;
            
            void main() {
                vec2 normalized = vec2(
                    a_position.x / u_resolution.x * 2.0 - 1.0,
                    (a_value - u_dataRange.x) / (u_dataRange.y - u_dataRange.x) * 2.0 - 1.0
                );
                
                gl_Position = vec4(normalized.x, normalized.y, 0.0, 1.0);
                v_position = a_position;
                v_value = a_value;
            }
            `,
            // Fragment shader
            `
            precision highp float;
            
            uniform vec4 u_color;
            uniform vec4 u_gradientColor;
            uniform vec2 u_dataRange;
            
            varying vec2 v_position;
            varying float v_value;
            
            void main() {
                float gradient = (v_value - u_dataRange.x) / (u_dataRange.y - u_dataRange.x);
                vec4 color = mix(u_gradientColor, u_color, gradient);
                gl_FragColor = color;
            }
            `
        );
        
        // Heatmap shader program
        this.programs.heatmap = this.createProgram(
            // Vertex shader
            `
            attribute vec2 a_position;
            attribute float a_intensity;
            
            uniform vec2 u_resolution;
            uniform float u_pointSize;
            
            varying float v_intensity;
            
            void main() {
                vec2 normalized = vec2(
                    a_position.x / u_resolution.x * 2.0 - 1.0,
                    1.0 - a_position.y / u_resolution.y * 2.0
                );
                
                gl_Position = vec4(normalized, 0.0, 1.0);
                gl_PointSize = u_pointSize;
                v_intensity = a_intensity;
            }
            `,
            // Fragment shader
            `
            precision highp float;
            
            uniform sampler2D u_colorRamp;
            
            varying float v_intensity;
            
            void main() {
                vec2 center = gl_PointCoord - vec2(0.5);
                float dist = length(center);
                
                if (dist > 0.5) {
                    discard;
                }
                
                float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
                vec4 color = texture2D(u_colorRamp, vec2(v_intensity, 0.5));
                gl_FragColor = vec4(color.rgb, color.a * alpha);
            }
            `
        );
    }
    
    createSharedBuffers() {
        const gl = this.gl;
        
        // Create a quad buffer for backgrounds
        const quadVertices = new Float32Array([
            -1, -1,
             1, -1,
            -1,  1,
             1,  1
        ]);
        
        this.buffers.quad = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.quad);
        gl.bufferData(gl.ARRAY_BUFFER, quadVertices, gl.STATIC_DRAW);
        
        // Create dynamic buffers for data
        this.buffers.lineData = gl.createBuffer();
        this.buffers.areaData = gl.createBuffer();
        this.buffers.pointData = gl.createBuffer();
    }
    
    createProgram(vertexSource, fragmentSource) {
        const gl = this.gl;
        
        const vertexShader = this.compileShader(vertexSource, gl.VERTEX_SHADER);
        const fragmentShader = this.compileShader(fragmentSource, gl.FRAGMENT_SHADER);
        
        const program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.error('Program link failed:', gl.getProgramInfoLog(program));
            return null;
        }
        
        // Cache attribute and uniform locations
        const attributes = {};
        const uniforms = {};
        
        const numAttributes = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);
        for (let i = 0; i < numAttributes; i++) {
            const info = gl.getActiveAttrib(program, i);
            attributes[info.name] = gl.getAttribLocation(program, info.name);
        }
        
        const numUniforms = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
        for (let i = 0; i < numUniforms; i++) {
            const info = gl.getActiveUniform(program, i);
            uniforms[info.name] = gl.getUniformLocation(program, info.name);
        }
        
        return { program, attributes, uniforms };
    }
    
    compileShader(source, type) {
        const gl = this.gl;
        const shader = gl.createShader(type);
        
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            const error = gl.getShaderInfoLog(shader);
            const shaderType = type === gl.VERTEX_SHADER ? 'Vertex' : 'Fragment';
            console.error(`[WebGL Charts] ${shaderType} shader compilation failed:`, error);
            console.error('Shader source:', source);
            gl.deleteShader(shader);
            return null;
        }
        
        return shader;
    }
    
    resizeCanvas() {
        const width = this.canvas.clientWidth * this.pixelRatio;
        const height = this.canvas.clientHeight * this.pixelRatio;
        
        if (this.canvas.width !== width || this.canvas.height !== height) {
            this.canvas.width = width;
            this.canvas.height = height;
            this.width = width;
            this.height = height;
            
            const gl = this.gl;
            gl.viewport(0, 0, width, height);
        }
    }
    
    // High-performance line chart
    drawLineChart(data, options = {}) {
        try {
            const gl = this.gl;
            const program = this.programs.line;
            
            // Validate inputs
            if (!data || data.length === 0) {
                console.warn('[WebGL Charts] No data to render');
                return;
            }
            
            if (!program || !program.program) {
                console.error('[WebGL Charts] Line chart program not available');
                return;
            }
            
            console.log('[WebGL Charts] Drawing line chart with', data.length, 'points');
            
            // Default options
            const opts = {
                color: [0.0, 0.7, 1.0, 1.0], // Cyan
                thickness: 2.0,
                glowIntensity: 0.5,
                dataRange: this.calculateDataRange(data),
                smooth: true,
                ...options
            };
            
            // Prepare data for GPU
            const vertexData = new Float32Array(data.length * 4); // x, y, value, alpha
            
            for (let i = 0; i < data.length; i++) {
                const x = (i / (data.length - 1)) * this.width;
                vertexData[i * 4] = x;
                vertexData[i * 4 + 1] = 0; // Not used in line chart
                vertexData[i * 4 + 2] = data[i];
                vertexData[i * 4 + 3] = 1.0; // Full alpha
            }
        
        // Upload data to GPU
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.lineData);
        gl.bufferData(gl.ARRAY_BUFFER, vertexData, gl.DYNAMIC_DRAW);
        
        // Use program
        gl.useProgram(program.program);
        
        // Set attributes
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.lineData);
        gl.enableVertexAttribArray(program.attributes.a_position);
        gl.vertexAttribPointer(program.attributes.a_position, 2, gl.FLOAT, false, 16, 0);
        
        gl.enableVertexAttribArray(program.attributes.a_value);
        gl.vertexAttribPointer(program.attributes.a_value, 1, gl.FLOAT, false, 16, 8);
        
        gl.enableVertexAttribArray(program.attributes.a_alpha);
        gl.vertexAttribPointer(program.attributes.a_alpha, 1, gl.FLOAT, false, 16, 12);
        
        // Set uniforms
        gl.uniform2f(program.uniforms.u_resolution, this.width, this.height);
        gl.uniform2f(program.uniforms.u_dataRange, opts.dataRange.min, opts.dataRange.max);
        gl.uniform4fv(program.uniforms.u_color, opts.color);
        gl.uniform1f(program.uniforms.u_thickness, opts.thickness * this.pixelRatio);
        gl.uniform1f(program.uniforms.u_glowIntensity, opts.glowIntensity);
        
        // Draw as line strip with points for glow
        if (opts.smooth && data.length > 2) {
            gl.drawArrays(gl.LINE_STRIP, 0, data.length);
        }
        gl.drawArrays(gl.POINTS, 0, data.length);
        
        // Cleanup
        gl.disableVertexAttribArray(program.attributes.a_position);
        gl.disableVertexAttribArray(program.attributes.a_value);
        gl.disableVertexAttribArray(program.attributes.a_alpha);
        
        } catch (error) {
            console.error('[WebGL Charts] Error drawing line chart:', error);
        }
    }
    
    // High-performance area chart
    drawAreaChart(data, options = {}) {
        const gl = this.gl;
        const program = this.programs.area;
        
        if (!program || !data || data.length === 0) return;
        
        const opts = {
            color: [0.0, 0.7, 1.0, 0.8],
            gradientColor: [0.0, 0.7, 1.0, 0.2],
            dataRange: this.calculateDataRange(data),
            ...options
        };
        
        // Create triangles for area fill
        const vertexData = new Float32Array(data.length * 2 * 3); // 2 triangles per data point
        
        for (let i = 0; i < data.length - 1; i++) {
            const x1 = (i / (data.length - 1)) * this.width;
            const x2 = ((i + 1) / (data.length - 1)) * this.width;
            
            // Triangle 1
            vertexData[i * 12] = x1;
            vertexData[i * 12 + 1] = data[i];
            
            vertexData[i * 12 + 2] = x2;
            vertexData[i * 12 + 3] = data[i + 1];
            
            vertexData[i * 12 + 4] = x1;
            vertexData[i * 12 + 5] = opts.dataRange.min;
            
            // Triangle 2
            vertexData[i * 12 + 6] = x2;
            vertexData[i * 12 + 7] = data[i + 1];
            
            vertexData[i * 12 + 8] = x1;
            vertexData[i * 12 + 9] = opts.dataRange.min;
            
            vertexData[i * 12 + 10] = x2;
            vertexData[i * 12 + 11] = opts.dataRange.min;
        }
        
        // Upload and draw
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.areaData);
        gl.bufferData(gl.ARRAY_BUFFER, vertexData, gl.DYNAMIC_DRAW);
        
        gl.useProgram(program.program);
        
        gl.enableVertexAttribArray(program.attributes.a_position);
        gl.vertexAttribPointer(program.attributes.a_position, 1, gl.FLOAT, false, 8, 0);
        
        gl.enableVertexAttribArray(program.attributes.a_value);
        gl.vertexAttribPointer(program.attributes.a_value, 1, gl.FLOAT, false, 8, 4);
        
        gl.uniform2f(program.uniforms.u_resolution, this.width, this.height);
        gl.uniform2f(program.uniforms.u_dataRange, opts.dataRange.min, opts.dataRange.max);
        gl.uniform4fv(program.uniforms.u_color, opts.color);
        gl.uniform4fv(program.uniforms.u_gradientColor, opts.gradientColor);
        
        gl.drawArrays(gl.TRIANGLES, 0, (data.length - 1) * 6);
        
        gl.disableVertexAttribArray(program.attributes.a_position);
        gl.disableVertexAttribArray(program.attributes.a_value);
    }
    
    calculateDataRange(data) {
        if (!data || data.length === 0) {
            return { min: 0, max: 1 };
        }
        
        let min = data[0];
        let max = data[0];
        
        for (let i = 1; i < data.length; i++) {
            if (data[i] < min) min = data[i];
            if (data[i] > max) max = data[i];
        }
        
        // Add padding
        const range = max - min;
        const padding = range * 0.1;
        
        return { 
            min: min - padding, 
            max: max + padding 
        };
    }
    
    clear(color = [0, 0, 0, 0]) {
        const gl = this.gl;
        gl.clearColor(...color);
        gl.clear(gl.COLOR_BUFFER_BIT);
    }
    
    destroy() {
        const gl = this.gl;
        
        // Delete programs
        Object.values(this.programs).forEach(p => {
            if (p && p.program) {
                gl.deleteProgram(p.program);
            }
        });
        
        // Delete buffers
        Object.values(this.buffers).forEach(buffer => {
            if (buffer) {
                gl.deleteBuffer(buffer);
            }
        });
        
        // Delete textures
        Object.values(this.textures).forEach(texture => {
            if (texture) {
                gl.deleteTexture(texture);
            }
        });
        
        // Clear references
        this.programs = {};
        this.buffers = {};
        this.textures = {};
    }
}

// Export for use
window.WebGLChartRenderer = WebGLChartRenderer;