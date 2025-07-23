// Black hole ray tracing shader based on oseiskar/black-hole
// This creates a static black hole visualization using screen-space ray tracing

const blackHoleVertexShader = `
    varying vec2 vUv;
    void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;

const blackHoleFragmentShader = `
    precision highp float;
    
    uniform float time;
    uniform vec2 resolution;
    uniform vec3 blackHolePosition;
    uniform vec3 cameraPosition;
    uniform mat4 cameraMatrix;
    
    varying vec2 vUv;
    
    #define PI 3.14159265359
    #define BLACK_HOLE_RADIUS 1.0
    #define ACCRETION_INNER 3.0
    #define ACCRETION_OUTER 12.0
    
    // Ray-sphere intersection
    float raySphere(vec3 ro, vec3 rd, vec3 center, float radius) {
        vec3 oc = ro - center;
        float b = dot(oc, rd);
        float c = dot(oc, oc) - radius * radius;
        float h = b * b - c;
        if (h < 0.0) return -1.0;
        return -b - sqrt(h);
    }
    
    // Schwarzschild metric - bend light ray
    vec3 bendRay(vec3 pos, vec3 dir, float h2) {
        float r = length(pos);
        float r2 = r * r;
        float deflection = BLACK_HOLE_RADIUS * 1.5 / r2;
        
        vec3 tangent = normalize(cross(pos, dir));
        vec3 binormal = cross(dir, tangent);
        
        return normalize(dir + binormal * deflection);
    }
    
    // Integrate ray through curved spacetime
    bool traceRay(vec3 ro, vec3 rd, out vec3 hitPos, out float diskHit) {
        vec3 pos = ro;
        vec3 dir = rd;
        diskHit = -1.0;
        
        float stepSize = 0.1;
        float h2 = length(cross(pos, dir)) * length(cross(pos, dir)); // Angular momentum
        
        for (int i = 0; i < 200; i++) {
            // Check event horizon
            float r = length(pos);
            if (r < BLACK_HOLE_RADIUS * 1.5) {
                return true; // Hit black hole
            }
            
            // Check accretion disk
            if (abs(pos.y) < 0.01 && diskHit < 0.0) {
                float diskR = length(pos.xz);
                if (diskR > ACCRETION_INNER && diskR < ACCRETION_OUTER) {
                    diskHit = diskR;
                    hitPos = pos;
                }
            }
            
            // March ray
            pos += dir * stepSize;
            
            // Bend ray
            dir = bendRay(pos, dir, h2);
            
            // Escape condition
            if (r > 50.0) break;
        }
        
        return false;
    }
    
    // Accretion disk color
    vec3 diskColor(float r, float angle) {
        float temp = pow((ACCRETION_INNER / r), 0.75);
        
        // Spiral structure
        float spiral = sin(angle * 5.0 - log(r) * 10.0 + time * 2.0) * 0.1 + 0.9;
        
        // Temperature to color
        vec3 color;
        if (temp > 0.8) {
            color = mix(vec3(1.0, 0.9, 0.7), vec3(0.7, 0.7, 1.0), (temp - 0.8) * 5.0);
        } else if (temp > 0.4) {
            color = mix(vec3(1.0, 0.6, 0.1), vec3(1.0, 0.9, 0.7), (temp - 0.4) * 2.5);
        } else {
            color = mix(vec3(0.8, 0.1, 0.0), vec3(1.0, 0.6, 0.1), temp * 2.5);
        }
        
        // Doppler shift
        float velocity = sqrt(BLACK_HOLE_RADIUS / (2.0 * r));
        float doppler = 1.0 + velocity * sin(angle - time);
        
        return color * spiral * doppler * temp * 3.0;
    }
    
    // Background stars
    vec3 stars(vec3 dir) {
        vec3 color = vec3(0.0);
        
        // Simple star field
        float s = sin(dot(dir, vec3(12.9898, 78.233, 543.21)) * 43758.5453);
        s = fract(s);
        if (s > 0.995) {
            float brightness = (s - 0.995) * 200.0;
            color = vec3(brightness);
        }
        
        // Milky way band
        float milky = smoothstep(0.4, 0.5, abs(dir.y));
        milky *= smoothstep(0.7, 0.5, abs(dir.x + dir.z));
        color += vec3(0.03, 0.03, 0.05) * (1.0 - milky);
        
        return color;
    }
    
    void main() {
        vec2 uv = (vUv - 0.5) * 2.0;
        uv.x *= resolution.x / resolution.y;
        
        // Camera ray
        vec3 ro = vec3(0.0, 0.0, 20.0); // Fixed camera position
        vec3 rd = normalize(vec3(uv, -2.0));
        
        // Trace ray
        vec3 hitPos;
        float diskHit;
        bool hitBlackHole = traceRay(ro, rd, hitPos, diskHit);
        
        vec3 color = vec3(0.0);
        
        if (hitBlackHole) {
            // Black hole is black
            color = vec3(0.0);
        } else {
            // Background
            color = stars(rd);
            
            // Accretion disk
            if (diskHit > 0.0) {
                float angle = atan(hitPos.z, hitPos.x);
                vec3 dColor = diskColor(diskHit, angle);
                color = mix(color, dColor, 0.8);
            }
        }
        
        // Photon ring
        float minDist = 100.0;
        vec3 pos = ro;
        vec3 dir = rd;
        for (int i = 0; i < 50; i++) {
            float r = length(pos);
            minDist = min(minDist, r);
            pos += dir * 0.1;
            dir = bendRay(pos, dir, 1.0);
        }
        
        if (minDist < BLACK_HOLE_RADIUS * 3.0) {
            float ring = exp(-(minDist - BLACK_HOLE_RADIUS * 2.7) * 10.0);
            color += vec3(1.0, 0.8, 0.5) * ring * 0.5;
        }
        
        gl_FragColor = vec4(color, 1.0);
    }
`;

// Create black hole visualization for our simulator
function createOseiskarBlackHole(scene, position, size) {
    // Create a large plane that will render the black hole
    const geometry = new THREE.PlaneGeometry(size * 40, size * 40);
    
    const material = new THREE.ShaderMaterial({
        uniforms: {
            time: { value: 0 },
            resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
            blackHolePosition: { value: position },
            cameraPosition: { value: new THREE.Vector3() },
            cameraMatrix: { value: new THREE.Matrix4() }
        },
        vertexShader: blackHoleVertexShader,
        fragmentShader: blackHoleFragmentShader,
        side: THREE.DoubleSide
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(position);
    
    return { mesh, material };
}