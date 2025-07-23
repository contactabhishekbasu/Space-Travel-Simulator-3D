// Spacecraft 3D Models and Textures Loader
class SpacecraftModels {
    constructor() {
        this.models = {};
        this.textures = {};
        this.gltfLoader = typeof THREE.GLTFLoader !== 'undefined' ? new THREE.GLTFLoader() : null;
        this.stlLoader = typeof THREE.STLLoader !== 'undefined' ? new THREE.STLLoader() : null;
        this.textureLoader = new THREE.TextureLoader();
        
        // Model configurations with support for multiple formats
        this.modelConfigs = {
            voyager1: {
                modelUrls: [
                    'models/spacecraft/voyager.glb',
                    'models/spacecraft/voyager.stl',
                    'models/spacecraft/voyager.mb'
                ],
                textureUrl: 'textures/spacecraft/voyager_texture.jpg',
                scale: 0.01,
                rotation: { x: 0, y: 0, z: 0 },
                fallbackColor: 0xC0C0C0,
                description: 'Voyager 1 - Interstellar Space Probe'
            },
            voyager2: {
                modelUrls: [
                    'models/spacecraft/voyager.glb',
                    'models/spacecraft/voyager.stl',
                    'models/spacecraft/voyager.mb'
                ],
                textureUrl: 'textures/spacecraft/voyager_texture.jpg',
                scale: 0.01,
                rotation: { x: 0, y: 0, z: 0 },
                fallbackColor: 0xC0C0C0,
                description: 'Voyager 2 - Interstellar Space Probe'
            },
            newHorizons: {
                modelUrls: [
                    'models/spacecraft/new-horizons.glb',
                    'models/spacecraft/new-horizons.stl',
                    'models/spacecraft/new-horizons.mb'
                ],
                textureUrl: 'textures/spacecraft/new_horizons_texture.jpg',
                scale: 0.008,
                rotation: { x: 0, y: 0, z: 0 },
                fallbackColor: 0xD4D4D4,
                description: 'New Horizons - Pluto Explorer'
            },
            parker: {
                modelUrls: [
                    'models/spacecraft/parker-solar-probe.glb',
                    'models/spacecraft/parker-solar-probe.stl',
                    'models/spacecraft/parker-solar-probe.mb'
                ],
                textureUrl: 'textures/spacecraft/parker_texture.jpg',
                scale: 0.005,
                rotation: { x: 0, y: 0, z: 0 },
                fallbackColor: 0xFFD700,
                description: 'Parker Solar Probe - Sun Explorer'
            },
            juno: {
                modelUrls: [
                    'models/spacecraft/juno.glb',
                    'models/spacecraft/juno.stl',
                    'models/spacecraft/juno.mb'
                ],
                textureUrl: 'textures/spacecraft/juno_texture.jpg',
                scale: 0.007,
                rotation: { x: 0, y: 0, z: 0 },
                fallbackColor: 0x4169E1,
                description: 'Juno - Jupiter Orbiter'
            },
            perseverance: {
                modelUrls: [
                    'models/spacecraft/perseverance.glb',
                    'models/spacecraft/perseverance.stl',
                    'models/spacecraft/perseverance.mb'
                ],
                textureUrl: 'textures/spacecraft/perseverance_texture.jpg',
                scale: 0.003,
                rotation: { x: 0, y: 0, z: 0 },
                fallbackColor: 0xCD853F,
                description: 'Perseverance - Mars Rover'
            },
            jwst: {
                modelUrls: [
                    'models/spacecraft/jwst.glb',
                    'models/spacecraft/jwst.stl',
                    'models/spacecraft/jwst.mb'
                ],
                textureUrl: 'textures/spacecraft/jwst_texture.jpg',
                scale: 0.002,
                rotation: { x: 0, y: 0, z: 0 },
                fallbackColor: 0xFFD700,
                description: 'James Webb Space Telescope'
            },
            iss: {
                modelUrls: [
                    'models/spacecraft/iss.glb',
                    'models/spacecraft/iss.stl',
                    'models/spacecraft/iss.mb'
                ],
                textureUrl: 'textures/spacecraft/iss_texture.jpg',
                scale: 0.00002, // ISS is 109m, need very tiny scale (1/5 of previous)
                rotation: { x: 0, y: 0, z: 0 },
                fallbackColor: 0xE0E0E0,
                description: 'International Space Station'
            }
        };
    }
    
    async loadModel(spacecraftKey) {
        const config = this.modelConfigs[spacecraftKey];
        if (!config) {
            console.warn(`No model config for spacecraft: ${spacecraftKey}`);
            return null;
        }
        
        // Try to load from cache first
        if (this.models[spacecraftKey]) {
            console.log(`Using cached model for ${spacecraftKey}`);
            return this.models[spacecraftKey].clone();
        }
        
        // Try to load 3D model from available formats
        for (const modelUrl of config.modelUrls) {
            try {
                const model = await this.load3DModel(modelUrl);
                if (model) {
                    // Apply scale and rotation
                    model.scale.set(config.scale, config.scale, config.scale);
                    model.rotation.set(config.rotation.x, config.rotation.y, config.rotation.z);
                    
                    // Apply material/texture if STL (STL files don't include materials)
                    if (modelUrl.endsWith('.stl')) {
                        this.applyMaterialToSTL(model, config);
                    }
                    
                    // Add to cache
                    this.models[spacecraftKey] = model;
                    console.log(`Loaded 3D model for ${spacecraftKey} from ${modelUrl}`);
                    return model.clone();
                }
            } catch (error) {
                console.log(`Failed to load ${modelUrl}: ${error.message}`);
            }
        }
        
        console.log(`No 3D models found for ${spacecraftKey}, falling back to procedural geometry`);
        // Fallback to textured geometry
        return this.createTexturedSpacecraft(spacecraftKey, config);
    }
    
    load3DModel(url) {
        return new Promise((resolve, reject) => {
            const extension = url.split('.').pop().toLowerCase();
            
            if (extension === 'glb' || extension === 'gltf') {
                if (!this.gltfLoader) {
                    reject(new Error('GLTFLoader not available'));
                    return;
                }
                this.gltfLoader.load(
                    url,
                    (gltf) => resolve(gltf.scene),
                    (progress) => console.log('Loading progress:', progress),
                    (error) => reject(error)
                );
            } else if (extension === 'stl') {
                if (!this.stlLoader) {
                    reject(new Error('STLLoader not available'));
                    return;
                }
                this.stlLoader.load(
                    url,
                    (geometry) => {
                        // STL files only contain geometry, need to create mesh
                        const material = new THREE.MeshPhongMaterial({
                            color: 0xAAAAAA,
                            metalness: 0.7,
                            roughness: 0.3
                        });
                        const mesh = new THREE.Mesh(geometry, material);
                        resolve(mesh);
                    },
                    (progress) => console.log('Loading progress:', progress),
                    (error) => reject(error)
                );
            } else if (extension === 'mb') {
                // Maya Binary files need to be converted first
                reject(new Error('Maya Binary (.mb) files must be converted to GLB or STL format first'));
            } else {
                reject(new Error(`Unsupported file format: ${extension}`));
            }
        });
    }
    
    applyMaterialToSTL(model, config) {
        // Apply texture or color to STL model
        let material;
        
        if (config.textureUrl) {
            try {
                const texture = this.textureLoader.load(config.textureUrl);
                material = new THREE.MeshPhongMaterial({
                    map: texture,
                    metalness: 0.7,
                    roughness: 0.3
                });
            } catch (error) {
                console.log('Failed to load texture, using fallback color');
                material = new THREE.MeshPhongMaterial({
                    color: config.fallbackColor,
                    metalness: 0.7,
                    roughness: 0.3
                });
            }
        } else {
            material = new THREE.MeshPhongMaterial({
                color: config.fallbackColor,
                metalness: 0.7,
                roughness: 0.3
            });
        }
        
        // Apply material to all meshes in the model
        model.traverse((child) => {
            if (child.isMesh) {
                child.material = material;
            }
        });
    }
    
    createTexturedSpacecraft(key, config) {
        const group = new THREE.Group();
        
        // Try to load texture
        let material;
        try {
            const texture = this.textureLoader.load(config.textureUrl);
            material = new THREE.MeshPhongMaterial({
                map: texture,
                metalness: 0.7,
                roughness: 0.3
            });
        } catch (error) {
            // Fallback to colored material
            material = new THREE.MeshPhongMaterial({
                color: config.fallbackColor,
                metalness: 0.7,
                roughness: 0.3
            });
        }
        
        // Create improved geometry based on spacecraft type
        switch(key) {
            case 'voyager1':
            case 'voyager2':
                group.add(this.createVoyagerGeometry(material));
                break;
            case 'newHorizons':
                group.add(this.createNewHorizonsGeometry(material));
                break;
            case 'parker':
                group.add(this.createParkerSolarProbeGeometry(material));
                break;
            case 'juno':
                group.add(this.createJunoGeometry(material));
                break;
            case 'perseverance':
                group.add(this.createPerseveranceGeometry(material));
                break;
            case 'jwst':
                group.add(this.createJWSTGeometry(material));
                break;
            case 'iss':
                group.add(this.createISSGeometry(material));
                break;
        }
        
        return group;
    }
    
    createVoyagerGeometry(material) {
        const voyagerGroup = new THREE.Group();
        
        // Main bus (octagonal)
        const busGeometry = new THREE.CylinderGeometry(0.9, 0.9, 1.8, 8);
        const bus = new THREE.Mesh(busGeometry, material);
        voyagerGroup.add(bus);
        
        // High-gain antenna dish
        const dishGeometry = new THREE.CylinderGeometry(0.1, 1.9, 0.2, 32);
        const dishMaterial = new THREE.MeshPhongMaterial({
            color: 0xFFFFFF,
            metalness: 0.9,
            roughness: 0.1
        });
        const dish = new THREE.Mesh(dishGeometry, dishMaterial);
        dish.position.y = 1.5;
        dish.rotation.x = Math.PI * 0.1;
        voyagerGroup.add(dish);
        
        // RTG boom
        const rtgBoomGeometry = new THREE.CylinderGeometry(0.05, 0.05, 3);
        const rtgBoom = new THREE.Mesh(rtgBoomGeometry, material);
        rtgBoom.position.set(-1.5, 0, 0);
        rtgBoom.rotation.z = Math.PI / 2;
        voyagerGroup.add(rtgBoom);
        
        // RTG cylinders
        for (let i = 0; i < 3; i++) {
            const rtgGeometry = new THREE.CylinderGeometry(0.15, 0.15, 0.8);
            const rtg = new THREE.Mesh(rtgGeometry, material);
            rtg.position.set(-2.5 - i * 0.5, 0, 0);
            voyagerGroup.add(rtg);
        }
        
        // Magnetometer boom
        const magBoomGeometry = new THREE.CylinderGeometry(0.03, 0.03, 13);
        const magBoom = new THREE.Mesh(magBoomGeometry, material);
        magBoom.position.set(0, 0, -6.5);
        magBoom.rotation.x = Math.PI / 2;
        voyagerGroup.add(magBoom);
        
        // Science boom
        const sciBoomGeometry = new THREE.CylinderGeometry(0.03, 0.03, 2.5);
        const sciBoom = new THREE.Mesh(sciBoomGeometry, material);
        sciBoom.position.set(1.25, 0, 0);
        sciBoom.rotation.z = Math.PI / 2;
        voyagerGroup.add(sciBoom);
        
        // Golden record
        const recordGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.02, 32);
        const recordMaterial = new THREE.MeshPhongMaterial({
            color: 0xFFD700,
            metalness: 0.9,
            roughness: 0.1,
            emissive: 0xFFD700,
            emissiveIntensity: 0.1
        });
        const record = new THREE.Mesh(recordGeometry, recordMaterial);
        record.position.set(0, -0.91, 0.5);
        record.rotation.x = Math.PI / 2;
        voyagerGroup.add(record);
        
        return voyagerGroup;
    }
    
    createNewHorizonsGeometry(material) {
        const nhGroup = new THREE.Group();
        
        // Main body (triangular prism)
        const bodyShape = new THREE.Shape();
        bodyShape.moveTo(0, 0.8);
        bodyShape.lineTo(-0.7, -0.4);
        bodyShape.lineTo(0.7, -0.4);
        bodyShape.closePath();
        
        const extrudeSettings = {
            depth: 1.2,
            bevelEnabled: false
        };
        
        const bodyGeometry = new THREE.ExtrudeGeometry(bodyShape, extrudeSettings);
        const body = new THREE.Mesh(bodyGeometry, material);
        body.rotation.x = Math.PI / 2;
        body.position.z = -0.6;
        nhGroup.add(body);
        
        // High-gain antenna
        const dishGeometry = new THREE.CylinderGeometry(0.05, 1.1, 0.15, 32);
        const dishMaterial = new THREE.MeshPhongMaterial({
            color: 0xFFFFFF,
            metalness: 0.9,
            roughness: 0.1
        });
        const dish = new THREE.Mesh(dishGeometry, dishMaterial);
        dish.position.y = 1.2;
        nhGroup.add(dish);
        
        // RTG
        const rtgGeometry = new THREE.CylinderGeometry(0.15, 0.15, 1.2);
        const rtg = new THREE.Mesh(rtgGeometry, material);
        rtg.position.set(-0.8, 0, 0);
        rtg.rotation.z = Math.PI / 4;
        nhGroup.add(rtg);
        
        // Science instruments
        const instrumentGeometry = new THREE.BoxGeometry(0.3, 0.3, 0.4);
        const instrument = new THREE.Mesh(instrumentGeometry, material);
        instrument.position.set(0, -0.5, 0.8);
        nhGroup.add(instrument);
        
        return nhGroup;
    }
    
    createParkerSolarProbeGeometry(material) {
        const parkerGroup = new THREE.Group();
        
        // Heat shield (large disc)
        const shieldGeometry = new THREE.CylinderGeometry(1.8, 1.8, 0.3, 32);
        const shieldMaterial = new THREE.MeshPhongMaterial({
            color: 0x333333,
            metalness: 0.9,
            roughness: 0.1,
            side: THREE.DoubleSide
        });
        const shield = new THREE.Mesh(shieldGeometry, shieldMaterial);
        shield.position.y = 1.5;
        shield.rotation.x = Math.PI / 2;
        parkerGroup.add(shield);
        
        // Spacecraft bus
        const busGeometry = new THREE.BoxGeometry(0.8, 1.2, 0.8);
        const bus = new THREE.Mesh(busGeometry, material);
        parkerGroup.add(bus);
        
        // Solar panels (retracted configuration)
        const panelGeometry = new THREE.BoxGeometry(0.6, 0.1, 1.2);
        const panelMaterial = new THREE.MeshPhongMaterial({
            color: 0x000044,
            metalness: 0.8,
            roughness: 0.2
        });
        
        const panel1 = new THREE.Mesh(panelGeometry, panelMaterial);
        panel1.position.set(0.5, 0, 0);
        panel1.rotation.z = Math.PI / 6;
        parkerGroup.add(panel1);
        
        const panel2 = new THREE.Mesh(panelGeometry, panelMaterial);
        panel2.position.set(-0.5, 0, 0);
        panel2.rotation.z = -Math.PI / 6;
        parkerGroup.add(panel2);
        
        // Cooling radiators
        const radiatorGeometry = new THREE.BoxGeometry(0.1, 0.8, 0.4);
        const radiatorMaterial = new THREE.MeshPhongMaterial({
            color: 0xCCCCCC,
            metalness: 0.9,
            roughness: 0.1
        });
        
        for (let i = 0; i < 4; i++) {
            const angle = (i * Math.PI * 2) / 4;
            const radiator = new THREE.Mesh(radiatorGeometry, radiatorMaterial);
            radiator.position.set(Math.cos(angle) * 0.6, -0.3, Math.sin(angle) * 0.6);
            radiator.rotation.y = angle;
            parkerGroup.add(radiator);
        }
        
        return parkerGroup;
    }
    
    createJunoGeometry(material) {
        const junoGroup = new THREE.Group();
        
        // Central body (hexagonal)
        const bodyGeometry = new THREE.CylinderGeometry(0.8, 0.8, 1.5, 6);
        const body = new THREE.Mesh(bodyGeometry, material);
        junoGroup.add(body);
        
        // Three large solar panels (distinctive triangular shape)
        const panelShape = new THREE.Shape();
        panelShape.moveTo(0, 0);
        panelShape.lineTo(0, 0.8);
        panelShape.lineTo(8, 1.2);
        panelShape.lineTo(8, -1.2);
        panelShape.lineTo(0, -0.8);
        panelShape.closePath();
        
        const panelExtrudeSettings = {
            depth: 0.05,
            bevelEnabled: false
        };
        
        const panelGeometry = new THREE.ExtrudeGeometry(panelShape, panelExtrudeSettings);
        const panelMaterial = new THREE.MeshPhongMaterial({
            color: 0x000066,
            metalness: 0.8,
            roughness: 0.2,
            emissive: 0x000033,
            emissiveIntensity: 0.3,
            side: THREE.DoubleSide
        });
        
        for (let i = 0; i < 3; i++) {
            const angle = (i * 2 * Math.PI) / 3;
            const panel = new THREE.Mesh(panelGeometry, panelMaterial);
            panel.position.set(Math.cos(angle) * 0.8, 0, Math.sin(angle) * 0.8);
            panel.rotation.y = angle;
            panel.rotation.z = -Math.PI / 2;
            junoGroup.add(panel);
        }
        
        // High-gain antenna
        const antennaGeometry = new THREE.CylinderGeometry(0.05, 0.9, 0.2, 32);
        const antennaMaterial = new THREE.MeshPhongMaterial({
            color: 0xFFFFFF,
            metalness: 0.9,
            roughness: 0.1
        });
        const antenna = new THREE.Mesh(antennaGeometry, antennaMaterial);
        antenna.position.y = 0.9;
        junoGroup.add(antenna);
        
        // Magnetometer boom
        const magBoomGeometry = new THREE.CylinderGeometry(0.02, 0.02, 3);
        const magBoom = new THREE.Mesh(magBoomGeometry, material);
        magBoom.position.set(0, 0, -1.5);
        magBoom.rotation.x = Math.PI / 2;
        junoGroup.add(magBoom);
        
        return junoGroup;
    }
    
    createPerseveranceGeometry(material) {
        const roverGroup = new THREE.Group();
        
        // Main body with more detail
        const bodyGeometry = new THREE.BoxGeometry(1.5, 0.8, 2.2);
        const body = new THREE.Mesh(bodyGeometry, material);
        body.position.y = 0.5;
        roverGroup.add(body);
        
        // Wheels (6 wheels)
        const wheelGeometry = new THREE.CylinderGeometry(0.25, 0.25, 0.15, 16);
        const wheelMaterial = new THREE.MeshPhongMaterial({
            color: 0x333333,
            metalness: 0.8,
            roughness: 0.6
        });
        
        const wheelPositions = [
            { x: 0.7, z: 0.9 },
            { x: 0.7, z: 0 },
            { x: 0.7, z: -0.9 },
            { x: -0.7, z: 0.9 },
            { x: -0.7, z: 0 },
            { x: -0.7, z: -0.9 }
        ];
        
        wheelPositions.forEach(pos => {
            const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
            wheel.position.set(pos.x, 0, pos.z);
            wheel.rotation.z = Math.PI / 2;
            roverGroup.add(wheel);
        });
        
        // Rocker-bogie suspension
        const suspensionGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.6);
        const suspensionMaterial = new THREE.MeshPhongMaterial({
            color: 0x666666,
            metalness: 0.7,
            roughness: 0.3
        });
        
        for (let side = -1; side <= 1; side += 2) {
            const suspension = new THREE.Mesh(suspensionGeometry, suspensionMaterial);
            suspension.position.set(side * 0.7, 0.25, 0);
            suspension.rotation.x = Math.PI / 2;
            roverGroup.add(suspension);
        }
        
        // Mast with cameras
        const mastGeometry = new THREE.CylinderGeometry(0.05, 0.05, 2);
        const mast = new THREE.Mesh(mastGeometry, material);
        mast.position.set(0, 1.5, -0.5);
        roverGroup.add(mast);
        
        // Camera head (SuperCam and Mastcam-Z)
        const cameraHeadGeometry = new THREE.BoxGeometry(0.5, 0.3, 0.4);
        const cameraHead = new THREE.Mesh(cameraHeadGeometry, material);
        cameraHead.position.set(0, 2.5, -0.5);
        roverGroup.add(cameraHead);
        
        // RTG (MMRTG)
        const rtgGeometry = new THREE.CylinderGeometry(0.3, 0.3, 1);
        const rtgMaterial = new THREE.MeshPhongMaterial({
            color: 0x222222,
            metalness: 0.8,
            roughness: 0.2
        });
        const rtg = new THREE.Mesh(rtgGeometry, rtgMaterial);
        rtg.position.set(-0.3, 0.8, -1.3);
        rtg.rotation.x = Math.PI / 2;
        roverGroup.add(rtg);
        
        // Robotic arm
        const armSegment1 = new THREE.BoxGeometry(0.1, 0.1, 0.8);
        const arm1 = new THREE.Mesh(armSegment1, material);
        arm1.position.set(0.6, 0.6, 0.4);
        arm1.rotation.y = Math.PI / 4;
        roverGroup.add(arm1);
        
        // Ingenuity helicopter dock
        const heliDockGeometry = new THREE.BoxGeometry(0.4, 0.1, 0.4);
        const heliDock = new THREE.Mesh(heliDockGeometry, material);
        heliDock.position.set(0, -0.1, 1);
        roverGroup.add(heliDock);
        
        // High-gain antenna
        const hgaGeometry = new THREE.CylinderGeometry(0.02, 0.3, 0.05, 16);
        const hga = new THREE.Mesh(hgaGeometry, wheelMaterial);
        hga.position.set(0.5, 0.9, -0.8);
        hga.rotation.z = -Math.PI / 4;
        roverGroup.add(hga);
        
        return roverGroup;
    }
    
    createJWSTGeometry(material) {
        const jwstGroup = new THREE.Group();
        
        // Sunshield layers (5 layers)
        const shieldMaterial = new THREE.MeshPhongMaterial({
            color: 0xFFD700,
            metalness: 0.9,
            roughness: 0.1,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.7
        });
        
        for (let i = 0; i < 5; i++) {
            const shieldGeometry = new THREE.PlaneGeometry(10, 7 - i * 0.3);
            const shield = new THREE.Mesh(shieldGeometry, shieldMaterial);
            shield.position.y = -0.5 - i * 0.2;
            shield.rotation.x = Math.PI / 2;
            jwstGroup.add(shield);
        }
        
        // Primary mirror (18 hexagonal segments)
        const hexRadius = 0.32;
        const hexGeometry = new THREE.CylinderGeometry(hexRadius, hexRadius, 0.1, 6);
        const mirrorMaterial = new THREE.MeshPhongMaterial({
            color: 0xFFD700,
            metalness: 0.95,
            roughness: 0.05,
            emissive: 0xFFD700,
            emissiveIntensity: 0.1
        });
        
        // Create hexagonal mirror array
        const mirrorGroup = new THREE.Group();
        const positions = [
            // Center
            { x: 0, z: 0 },
            // Inner ring
            { x: hexRadius * 1.75, z: 0 },
            { x: hexRadius * 0.875, z: hexRadius * 1.515 },
            { x: -hexRadius * 0.875, z: hexRadius * 1.515 },
            { x: -hexRadius * 1.75, z: 0 },
            { x: -hexRadius * 0.875, z: -hexRadius * 1.515 },
            { x: hexRadius * 0.875, z: -hexRadius * 1.515 },
            // Outer ring
            { x: hexRadius * 3.5, z: 0 },
            { x: hexRadius * 2.625, z: hexRadius * 1.515 },
            { x: hexRadius * 1.75, z: hexRadius * 3.03 },
            { x: 0, z: hexRadius * 3.03 },
            { x: -hexRadius * 1.75, z: hexRadius * 3.03 },
            { x: -hexRadius * 2.625, z: hexRadius * 1.515 },
            { x: -hexRadius * 3.5, z: 0 },
            { x: -hexRadius * 2.625, z: -hexRadius * 1.515 },
            { x: -hexRadius * 1.75, z: -hexRadius * 3.03 },
            { x: 0, z: -hexRadius * 3.03 },
            { x: hexRadius * 1.75, z: -hexRadius * 3.03 },
            { x: hexRadius * 2.625, z: -hexRadius * 1.515 }
        ];
        
        positions.forEach(pos => {
            const mirror = new THREE.Mesh(hexGeometry, mirrorMaterial);
            mirror.position.set(pos.x, 1.5, pos.z);
            mirror.rotation.x = Math.PI / 2;
            mirror.rotation.y = Math.PI / 6;
            mirrorGroup.add(mirror);
        });
        
        jwstGroup.add(mirrorGroup);
        
        // Secondary mirror support
        const strutGeometry = new THREE.CylinderGeometry(0.05, 0.05, 5);
        const strutMaterial = new THREE.MeshPhongMaterial({
            color: 0x444444,
            metalness: 0.8,
            roughness: 0.2
        });
        
        for (let i = 0; i < 3; i++) {
            const angle = (i * 2 * Math.PI) / 3;
            const strut = new THREE.Mesh(strutGeometry, strutMaterial);
            strut.position.set(Math.cos(angle) * 2, 1.5, Math.sin(angle) * 2);
            strut.rotation.z = Math.PI / 3;
            strut.rotation.y = angle;
            jwstGroup.add(strut);
        }
        
        // Secondary mirror
        const secondaryGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.1, 32);
        const secondary = new THREE.Mesh(secondaryGeometry, mirrorMaterial);
        secondary.position.y = 4;
        secondary.rotation.x = Math.PI / 2;
        jwstGroup.add(secondary);
        
        // Spacecraft bus
        const busGeometry = new THREE.BoxGeometry(2, 1.5, 2);
        const bus = new THREE.Mesh(busGeometry, material);
        bus.position.y = 0.75;
        jwstGroup.add(bus);
        
        // Solar panel
        const solarPanelGeometry = new THREE.BoxGeometry(2, 0.1, 3);
        const solarPanelMaterial = new THREE.MeshPhongMaterial({
            color: 0x000066,
            metalness: 0.8,
            roughness: 0.2
        });
        const solarPanel = new THREE.Mesh(solarPanelGeometry, solarPanelMaterial);
        solarPanel.position.set(-1.5, 0.75, 0);
        solarPanel.rotation.z = Math.PI / 8;
        jwstGroup.add(solarPanel);
        
        // High-gain antenna
        const hgaGeometry = new THREE.CylinderGeometry(0.02, 0.4, 0.1, 32);
        const hga = new THREE.Mesh(hgaGeometry, strutMaterial);
        hga.position.set(1, 0.75, 1);
        hga.rotation.x = Math.PI / 4;
        jwstGroup.add(hga);
        
        return jwstGroup;
    }
    
    createISSGeometry(material) {
        const issGroup = new THREE.Group();
        
        // ISS has a modular structure with multiple components
        // Scale factor to make ISS appropriately sized (109m actual -> ~0.1 scene units)
        const scaleFactor = 0.01;
        
        // Main truss structure (backbone)
        const trussLength = 10 * scaleFactor;
        const trussGeometry = new THREE.BoxGeometry(trussLength, 0.3 * scaleFactor, 0.3 * scaleFactor);
        const trussMaterial = new THREE.MeshPhongMaterial({
            color: 0xAAAAAA,
            metalness: 0.8,
            roughness: 0.2
        });
        const mainTruss = new THREE.Mesh(trussGeometry, trussMaterial);
        issGroup.add(mainTruss);
        
        // Solar array wings (8 large solar panels)
        const solarArrayGeometry = new THREE.BoxGeometry(3 * scaleFactor, 0.05 * scaleFactor, 1.2 * scaleFactor);
        const solarMaterial = new THREE.MeshPhongMaterial({
            color: 0x000044,
            metalness: 0.9,
            roughness: 0.1,
            emissive: 0x000022,
            emissiveIntensity: 0.3,
            side: THREE.DoubleSide
        });
        
        // Port side solar arrays
        for (let i = 0; i < 4; i++) {
            const solarPanel = new THREE.Mesh(solarArrayGeometry, solarMaterial);
            solarPanel.position.set(-3 - i * 3.2, 0, (i % 2) * 2.5 - 1.25);
            issGroup.add(solarPanel);
        }
        
        // Starboard side solar arrays
        for (let i = 0; i < 4; i++) {
            const solarPanel = new THREE.Mesh(solarArrayGeometry, solarMaterial);
            solarPanel.position.set(3 + i * 3.2, 0, (i % 2) * 2.5 - 1.25);
            issGroup.add(solarPanel);
        }
        
        // Modules (pressurized compartments)
        const moduleGeometry = new THREE.CylinderGeometry(0.4, 0.4, 1.5, 8);
        const moduleMaterial = new THREE.MeshPhongMaterial({
            color: 0xE0E0E0,
            metalness: 0.7,
            roughness: 0.3
        });
        
        // US Lab Module (Destiny)
        const usLab = new THREE.Mesh(moduleGeometry, moduleMaterial);
        usLab.rotation.z = Math.PI / 2;
        usLab.position.set(2, 0, 0);
        issGroup.add(usLab);
        
        // Russian Service Module (Zvezda)
        const zvezda = new THREE.Mesh(moduleGeometry, moduleMaterial);
        zvezda.rotation.z = Math.PI / 2;
        zvezda.position.set(-2, 0, 0);
        issGroup.add(zvezda);
        
        // Unity Node (Node 1)
        const unity = new THREE.Mesh(moduleGeometry, moduleMaterial);
        unity.position.set(0, 0, 0);
        issGroup.add(unity);
        
        // Harmony Node (Node 2)
        const harmony = new THREE.Mesh(moduleGeometry, moduleMaterial);
        harmony.rotation.z = Math.PI / 2;
        harmony.position.set(3.5, 0, 0);
        issGroup.add(harmony);
        
        // Tranquility Node (Node 3)
        const tranquility = new THREE.Mesh(moduleGeometry, moduleMaterial);
        tranquility.position.set(0, 0, -1.5);
        issGroup.add(tranquility);
        
        // Cupola (observation dome)
        const cupolaGeometry = new THREE.SphereGeometry(0.35, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2);
        const cupolaMaterial = new THREE.MeshPhongMaterial({
            color: 0x4444FF,
            metalness: 0.9,
            roughness: 0.1,
            transparent: true,
            opacity: 0.7
        });
        const cupola = new THREE.Mesh(cupolaGeometry, cupolaMaterial);
        cupola.position.set(0, -0.5, -1.5);
        cupola.rotation.x = Math.PI;
        issGroup.add(cupola);
        
        // Japanese Experiment Module (Kibo)
        const kiboGeometry = new THREE.BoxGeometry(2, 0.8, 0.8);
        const kibo = new THREE.Mesh(kiboGeometry, moduleMaterial);
        kibo.position.set(4, 0, 1);
        issGroup.add(kibo);
        
        // Columbus Module (ESA)
        const columbus = new THREE.Mesh(moduleGeometry, moduleMaterial);
        columbus.rotation.z = Math.PI / 2;
        columbus.position.set(1, 0, 1);
        issGroup.add(columbus);
        
        // Radiators (thermal control)
        const radiatorGeometry = new THREE.BoxGeometry(2, 0.02, 0.8);
        const radiatorMaterial = new THREE.MeshPhongMaterial({
            color: 0x666666,
            metalness: 0.9,
            roughness: 0.1
        });
        
        for (let i = 0; i < 3; i++) {
            const radiator = new THREE.Mesh(radiatorGeometry, radiatorMaterial);
            radiator.position.set(i * 1.5 - 1.5, 0.6, 0);
            radiator.rotation.x = Math.PI / 6;
            issGroup.add(radiator);
        }
        
        // Canadarm2 (robotic arm)
        const armBase = new THREE.CylinderGeometry(0.1, 0.1, 0.5);
        const armMaterial = new THREE.MeshPhongMaterial({
            color: 0xFFFFFF,
            metalness: 0.8,
            roughness: 0.2
        });
        const arm1 = new THREE.Mesh(armBase, armMaterial);
        arm1.position.set(0, 0.3, 0);
        issGroup.add(arm1);
        
        const armSegmentGeometry = new THREE.CylinderGeometry(0.08, 0.08, 1.5);
        const armSegment = new THREE.Mesh(armSegmentGeometry, armMaterial);
        armSegment.position.set(0, 0.8, 0);
        armSegment.rotation.z = Math.PI / 4;
        issGroup.add(armSegment);
        
        // Communication antennas
        const antennaGeometry = new THREE.CylinderGeometry(0.02, 0.2, 0.8);
        const antennaMaterial = new THREE.MeshPhongMaterial({
            color: 0xFFFFFF,
            metalness: 0.9,
            roughness: 0.1
        });
        
        const antenna1 = new THREE.Mesh(antennaGeometry, antennaMaterial);
        antenna1.position.set(-1, 0.5, 0);
        issGroup.add(antenna1);
        
        const antenna2 = new THREE.Mesh(antennaGeometry, antennaMaterial);
        antenna2.position.set(1, 0.5, 0);
        issGroup.add(antenna2);
        
        // Docking ports
        const dockingPortGeometry = new THREE.CylinderGeometry(0.25, 0.25, 0.1, 16);
        const dockingPortMaterial = new THREE.MeshPhongMaterial({
            color: 0xFF0000,
            metalness: 0.8,
            roughness: 0.2
        });
        
        const dockingPort1 = new THREE.Mesh(dockingPortGeometry, dockingPortMaterial);
        dockingPort1.position.set(5, 0, 0);
        dockingPort1.rotation.z = Math.PI / 2;
        issGroup.add(dockingPort1);
        
        const dockingPort2 = new THREE.Mesh(dockingPortGeometry, dockingPortMaterial);
        dockingPort2.position.set(-5, 0, 0);
        dockingPort2.rotation.z = Math.PI / 2;
        issGroup.add(dockingPort2);
        
        return issGroup;
    }
}

// Export for use in spacecraft-tracker.js
window.SpacecraftModels = SpacecraftModels;