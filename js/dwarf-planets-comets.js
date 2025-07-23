// Dwarf Planets and Comets - Educational celestial objects beyond the main planets
class DwarfPlanetsComets {
    constructor(scene) {
        this.scene = scene;
        this.dwarfPlanets = {};
        this.comets = {};
        this.asteroids = {};
        
        // AU scale factor (should match main simulator)
        this.AU_SCALE = 100;
        this.SUN_SIZE = 3;
        
        // Dwarf planet data
        this.dwarfPlanetData = {
            ceres: {
                name: "Ceres",
                position: new THREE.Vector3(2.77 * this.AU_SCALE, 0, 0),
                size: this.SUN_SIZE * 0.008, // About 940 km diameter
                color: 0x8B7D6B,
                orbitRadius: 2.77, // AU
                orbitSpeed: 0.00001,
                info: "Largest object in the asteroid belt. The only dwarf planet in the inner solar system.",
                type: "dwarf_planet",
                category: "Asteroid Belt",
                discoveryYear: 1801,
                diameter: "940 km",
                mass: "9.39 × 10²⁰ kg",
                orbitalPeriod: "4.6 Earth years",
                rotationPeriod: "9.07 hours",
                composition: "Rock and ice",
                temperature: "-105°C (average)",
                description: "Ceres is the largest object in the asteroid belt and the closest dwarf planet to the Sun. It contains about one-third of the asteroid belt's total mass."
            },
            pluto: {
                name: "Pluto",
                position: new THREE.Vector3(39.5 * this.AU_SCALE, 0, 0),
                size: this.SUN_SIZE * 0.018, // About 2370 km diameter  
                color: 0xD2B48C,
                orbitRadius: 39.5, // AU (highly elliptical, this is average)
                orbitSpeed: 0.000004,
                info: "Former ninth planet, now classified as a dwarf planet. Has five known moons including Charon.",
                type: "dwarf_planet",
                category: "Kuiper Belt",
                discoveryYear: 1930,
                diameter: "2,370 km",
                mass: "1.31 × 10²² kg",
                orbitalPeriod: "248 Earth years",
                rotationPeriod: "6.39 Earth days",
                moons: "5 (Charon, Styx, Nix, Kerberos, Hydra)",
                composition: "Rock and nitrogen ice",
                temperature: "-230°C (average)",
                description: "Pluto is a complex world of ice and rock in the outer solar system. Despite being reclassified as a dwarf planet in 2006, it remains one of the most fascinating objects in our solar system."
            },
            eris: {
                name: "Eris",
                position: new THREE.Vector3(67.7 * this.AU_SCALE, 0, 0),
                size: this.SUN_SIZE * 0.019, // About 2326 km diameter
                color: 0xE6E6FA,
                orbitRadius: 67.7, // AU (highly elliptical)
                orbitSpeed: 0.000002,
                info: "Most massive dwarf planet. Its discovery led to Pluto's reclassification.",
                type: "dwarf_planet",
                category: "Scattered Disk",
                discoveryYear: 2005,
                diameter: "2,326 km",
                mass: "1.66 × 10²² kg",
                orbitalPeriod: "558 Earth years",
                rotationPeriod: "25.9 hours",
                moons: "1 (Dysnomia)",
                composition: "Rock and methane ice",
                temperature: "-240°C (average)",
                description: "Eris is the most massive known dwarf planet and the ninth-most massive object known to orbit the Sun. It's located in the scattered disk, a distant region of the solar system."
            },
            haumea: {
                name: "Haumea",
                position: new THREE.Vector3(43.3 * this.AU_SCALE, 0, 0),
                size: this.SUN_SIZE * 0.012, // Elongated, ~1400 km long axis
                color: 0xFFFAF0,
                orbitRadius: 43.3, // AU
                orbitSpeed: 0.0000035,
                info: "Elongated dwarf planet that spins rapidly. Has its own ring system.",
                type: "dwarf_planet",
                category: "Kuiper Belt",
                discoveryYear: 2004,
                diameter: "~1,400 × 1,100 km (elongated)",
                mass: "4.01 × 10²¹ kg",
                orbitalPeriod: "285 Earth years",
                rotationPeriod: "3.9 hours (fastest in solar system)",
                moons: "2 (Hi'iaka, Namaka)",
                composition: "Crystalline water ice",
                rings: "Yes (discovered 2017)",
                temperature: "-240°C (average)",
                description: "Haumea is unique among dwarf planets for its rapid rotation and elongated shape. It's the first Kuiper Belt object found to have rings."
            },
            makemake: {
                name: "Makemake",
                position: new THREE.Vector3(45.8 * this.AU_SCALE, 0, 0),
                size: this.SUN_SIZE * 0.011, // About 1430 km diameter
                color: 0xDEB887,
                orbitRadius: 45.8, // AU
                orbitSpeed: 0.0000033,
                info: "Second-brightest Kuiper Belt object after Pluto. Named after Easter Island creation deity.",
                type: "dwarf_planet",
                category: "Kuiper Belt",
                discoveryYear: 2005,
                diameter: "1,430 km",
                mass: "~3.1 × 10²¹ kg",
                orbitalPeriod: "310 Earth years",
                rotationPeriod: "22.5 hours",
                moons: "1 (S/2015 (136472) 1)",
                composition: "Rock and methane ice",
                temperature: "-240°C (average)",
                description: "Makemake is the second-brightest object in the Kuiper Belt and was named after a creation deity from Easter Island mythology."
            }
        };
        
        // Famous comet data (simplified orbits)
        this.cometData = {
            halley: {
                name: "Halley's Comet",
                position: new THREE.Vector3(35 * this.AU_SCALE, 0, 0), // Approximate position
                size: this.SUN_SIZE * 0.001, // About 15 km nucleus
                color: 0x87CEEB,
                orbitRadius: 35, // Highly elliptical, this is approximate
                orbitSpeed: 0.000005,
                info: "Most famous comet. Visible from Earth every 75-76 years. Last seen in 1986, next in 2061.",
                type: "comet",
                period: "75-76 years",
                nextApproach: "2061",
                lastSeen: "1986",
                nucleus: "15 × 8 × 8 km",
                composition: "Dirty snowball (ice, dust, rock)",
                perihelion: "0.59 AU",
                aphelion: "35.1 AU",
                eccentricity: 0.967,
                description: "Halley's Comet is the most famous comet, visible to the naked eye every 75-76 years. It has been observed and recorded by astronomers since at least 240 BC."
            },
            encke: {
                name: "Encke's Comet",
                position: new THREE.Vector3(2.2 * this.AU_SCALE, 0, 0),
                size: this.SUN_SIZE * 0.0005, // About 4.8 km nucleus
                color: 0x98FB98,
                orbitRadius: 2.2, // AU
                orbitSpeed: 0.00003,
                info: "Shortest orbital period of any known comet at 3.3 years.",
                type: "comet",
                period: "3.3 years",
                nucleus: "4.8 km diameter",
                composition: "Ice and dust",
                perihelion: "0.34 AU",
                aphelion: "4.1 AU",
                eccentricity: 0.85,
                description: "Encke's Comet has the shortest known orbital period of any comet, completing an orbit around the Sun in just 3.3 years."
            },
            hale_bopp: {
                name: "Hale-Bopp",
                position: new THREE.Vector3(150 * this.AU_SCALE, 0, 0), // Far from sun currently
                size: this.SUN_SIZE * 0.003, // About 40 km nucleus
                color: 0xFFB6C1,
                orbitRadius: 150, // Highly elliptical
                orbitSpeed: 0.0000008,
                info: "Great Comet of 1997. One of the brightest comets of the 20th century.",
                type: "comet",
                period: "~2533 years",
                lastSeen: "1997",
                nextReturn: "~4530 CE",
                nucleus: "40-80 km diameter",
                composition: "Ice, dust, and rock",
                perihelion: "0.91 AU",
                aphelion: "371 AU",
                eccentricity: 0.995,
                description: "Hale-Bopp was one of the most widely observed comets of the 20th century and one of the brightest seen for many decades."
            }
        };
        
        // Notable asteroids
        this.asteroidData = {
            vesta: {
                name: "Vesta",
                position: new THREE.Vector3(2.36 * this.AU_SCALE, 0, 0),
                size: this.SUN_SIZE * 0.006, // About 525 km diameter
                color: 0x696969,
                orbitRadius: 2.36,
                orbitSpeed: 0.000015,
                info: "Second-largest asteroid. Has a large crater from an ancient collision.",
                type: "asteroid",
                category: "Main Belt",
                diameter: "525 km",
                mass: "2.59 × 10²⁰ kg",
                composition: "Basaltic rock",
                description: "Vesta is the second-largest asteroid and the brightest asteroid visible from Earth. It has a large crater from an ancient collision that nearly destroyed it."
            },
            pallas: {
                name: "Pallas",
                position: new THREE.Vector3(2.77 * this.AU_SCALE, 0, 0),
                size: this.SUN_SIZE * 0.006, // About 510 km diameter  
                color: 0x708090,
                orbitRadius: 2.77,
                orbitSpeed: 0.000012,
                info: "Third-largest asteroid. Has an unusual tilted orbit.",
                type: "asteroid",
                category: "Main Belt",
                diameter: "510 km",
                mass: "2.11 × 10²⁰ kg",
                composition: "Carbonaceous",
                description: "Pallas is the third-largest asteroid with a highly inclined and eccentric orbit that makes it unique among large asteroids."
            }
        };
        
        this.orbitAngles = {};
        this.cometTails = {};
        
        console.log('DwarfPlanetsComets: System initialized');
    }
    
    createAllObjects() {
        // Create dwarf planets
        Object.keys(this.dwarfPlanetData).forEach(key => {
            this.createDwarfPlanet(key);
        });
        
        // Create comets
        Object.keys(this.cometData).forEach(key => {
            this.createComet(key);
        });
        
        // Create notable asteroids
        Object.keys(this.asteroidData).forEach(key => {
            this.createAsteroid(key);
        });
        
        console.log(`DwarfPlanetsComets: Created ${Object.keys(this.dwarfPlanetData).length} dwarf planets, ${Object.keys(this.cometData).length} comets, and ${Object.keys(this.asteroidData).length} notable asteroids`);
    }
    
    createDwarfPlanet(key) {
        const data = this.dwarfPlanetData[key];
        if (!data) return null;
        
        // Create geometry and material
        const geometry = new THREE.SphereGeometry(data.size, 32, 32);
        const material = new THREE.MeshPhongMaterial({
            color: data.color,
            shininess: 5
        });
        
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(data.position.x, data.position.y, data.position.z);
        mesh.name = key;
        
        // Add to scene
        this.scene.add(mesh);
        this.dwarfPlanets[key] = mesh;
        
        // Initialize orbit angle
        this.orbitAngles[key] = Math.random() * Math.PI * 2;
        
        console.log(`DwarfPlanetsComets: Created dwarf planet ${data.name}`);
        return mesh;
    }
    
    createComet(key) {
        const data = this.cometData[key];
        if (!data) return null;
        
        // Create comet nucleus
        const nucleusGeometry = new THREE.SphereGeometry(data.size, 16, 16);
        const nucleusMaterial = new THREE.MeshPhongMaterial({
            color: data.color,
            emissive: data.color,
            emissiveIntensity: 0.1
        });
        
        const nucleus = new THREE.Mesh(nucleusGeometry, nucleusMaterial);
        
        // Create coma (fuzzy atmosphere around nucleus)
        const comaGeometry = new THREE.SphereGeometry(data.size * 5, 16, 16);
        const comaMaterial = new THREE.MeshBasicMaterial({
            color: 0xE6E6FA,
            transparent: true,
            opacity: 0.3,
            blending: THREE.AdditiveBlending
        });
        
        const coma = new THREE.Mesh(comaGeometry, comaMaterial);
        
        // Create comet group
        const cometGroup = new THREE.Group();
        cometGroup.add(nucleus);
        cometGroup.add(coma);
        
        // Create comet tail
        const tail = this.createCometTail(data.size);
        if (tail) {
            cometGroup.add(tail);
            this.cometTails[key] = tail;
        }
        
        cometGroup.position.set(data.position.x, data.position.y, data.position.z);
        cometGroup.name = key;
        
        // Add to scene
        this.scene.add(cometGroup);
        this.comets[key] = cometGroup;
        
        // Initialize orbit angle
        this.orbitAngles[key] = Math.random() * Math.PI * 2;
        
        console.log(`DwarfPlanetsComets: Created comet ${data.name}`);
        return cometGroup;
    }
    
    createCometTail(nucleusSize) {
        const tailLength = nucleusSize * 200;
        const particles = [];
        
        // Create particle positions for tail
        for (let i = 0; i < 100; i++) {
            const distance = (i / 100) * tailLength;
            const spread = (i / 100) * nucleusSize * 10;
            
            particles.push(
                -distance + (Math.random() - 0.5) * spread,
                (Math.random() - 0.5) * spread * 0.5,
                (Math.random() - 0.5) * spread
            );
        }
        
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(particles, 3));
        
        const material = new THREE.PointsMaterial({
            color: 0x87CEEB,
            size: nucleusSize * 2,
            transparent: true,
            opacity: 0.6,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        
        return new THREE.Points(geometry, material);
    }
    
    createAsteroid(key) {
        const data = this.asteroidData[key];
        if (!data) return null;
        
        // Create irregular asteroid shape
        const geometry = new THREE.SphereGeometry(data.size, 16, 16);
        
        // Make it irregular by modifying vertices
        const positions = geometry.attributes.position.array;
        for (let i = 0; i < positions.length; i += 3) {
            const vertex = new THREE.Vector3(positions[i], positions[i + 1], positions[i + 2]);
            const noise = (Math.random() - 0.5) * 0.3;
            vertex.multiplyScalar(1 + noise);
            positions[i] = vertex.x;
            positions[i + 1] = vertex.y;
            positions[i + 2] = vertex.z;
        }
        geometry.attributes.position.needsUpdate = true;
        geometry.computeVertexNormals();
        
        const material = new THREE.MeshPhongMaterial({
            color: data.color,
            shininess: 1,
            flatShading: true // Makes it look more rocky
        });
        
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(data.position.x, data.position.y, data.position.z);
        mesh.name = key;
        
        // Add to scene
        this.scene.add(mesh);
        this.asteroids[key] = mesh;
        
        // Initialize orbit angle
        this.orbitAngles[key] = Math.random() * Math.PI * 2;
        
        console.log(`DwarfPlanetsComets: Created asteroid ${data.name}`);
        return mesh;
    }
    
    update() {
        // Update dwarf planet orbits
        Object.keys(this.dwarfPlanets).forEach(key => {
            const data = this.dwarfPlanetData[key];
            const mesh = this.dwarfPlanets[key];
            if (data && mesh && data.orbitRadius) {
                this.orbitAngles[key] += data.orbitSpeed;
                const x = Math.cos(this.orbitAngles[key]) * data.orbitRadius * this.AU_SCALE;
                const z = Math.sin(this.orbitAngles[key]) * data.orbitRadius * this.AU_SCALE;
                mesh.position.set(x, 0, z);
                mesh.rotation.y += 0.01; // Simple rotation
            }
        });
        
        // Update comet orbits
        Object.keys(this.comets).forEach(key => {
            const data = this.cometData[key];
            const mesh = this.comets[key];
            if (data && mesh && data.orbitRadius) {
                this.orbitAngles[key] += data.orbitSpeed;
                const x = Math.cos(this.orbitAngles[key]) * data.orbitRadius * this.AU_SCALE;
                const z = Math.sin(this.orbitAngles[key]) * data.orbitRadius * this.AU_SCALE;
                mesh.position.set(x, 0, z);
                
                // Update comet tail direction (should point away from sun)
                const tail = this.cometTails[key];
                if (tail) {
                    const sunDirection = new THREE.Vector3(0, 0, 0).sub(mesh.position).normalize();
                    tail.lookAt(mesh.position.clone().add(sunDirection));
                }
            }
        });
        
        // Update asteroid orbits
        Object.keys(this.asteroids).forEach(key => {
            const data = this.asteroidData[key];
            const mesh = this.asteroids[key];
            if (data && mesh && data.orbitRadius) {
                this.orbitAngles[key] += data.orbitSpeed;
                const x = Math.cos(this.orbitAngles[key]) * data.orbitRadius * this.AU_SCALE;
                const z = Math.sin(this.orbitAngles[key]) * data.orbitRadius * this.AU_SCALE;
                mesh.position.set(x, 0, z);
                mesh.rotation.y += 0.02; // Faster rotation for asteroids
                mesh.rotation.x += 0.01;
            }
        });
    }
    
    setVisibility(visible) {
        const allObjects = [
            ...Object.values(this.dwarfPlanets),
            ...Object.values(this.comets),
            ...Object.values(this.asteroids)
        ];
        
        allObjects.forEach(obj => {
            if (obj) obj.visible = visible;
        });
        
        console.log(`DwarfPlanetsComets: Objects ${visible ? 'shown' : 'hidden'}`);
    }
    
    getObjectInfo(objectName) {
        // Check dwarf planets
        if (this.dwarfPlanetData[objectName]) {
            return this.dwarfPlanetData[objectName];
        }
        
        // Check comets
        if (this.cometData[objectName]) {
            return this.cometData[objectName];
        }
        
        // Check asteroids
        if (this.asteroidData[objectName]) {
            return this.asteroidData[objectName];
        }
        
        return null;
    }
    
    getAllObjects() {
        return {
            dwarfPlanets: this.dwarfPlanets,
            comets: this.comets,
            asteroids: this.asteroids
        };
    }
    
    dispose() {
        // Clean up dwarf planets
        Object.values(this.dwarfPlanets).forEach(mesh => {
            this.scene.remove(mesh);
            if (mesh.geometry) mesh.geometry.dispose();
            if (mesh.material) mesh.material.dispose();
        });
        
        // Clean up comets
        Object.values(this.comets).forEach(group => {
            this.scene.remove(group);
            group.traverse(child => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) child.material.dispose();
            });
        });
        
        // Clean up asteroids
        Object.values(this.asteroids).forEach(mesh => {
            this.scene.remove(mesh);
            if (mesh.geometry) mesh.geometry.dispose();
            if (mesh.material) mesh.material.dispose();
        });
        
        this.dwarfPlanets = {};
        this.comets = {};
        this.asteroids = {};
        this.cometTails = {};
        
        console.log('DwarfPlanetsComets: Resources disposed');
    }
}

// Export for global access
if (typeof window !== 'undefined') {
    window.DwarfPlanetsComets = DwarfPlanetsComets;
}