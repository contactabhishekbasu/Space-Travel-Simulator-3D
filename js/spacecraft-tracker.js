// Spacecraft and mission tracking system
class SpacecraftTracker {
    constructor(scene) {
        try {
            console.log('SpacecraftTracker: Initializing spacecraft tracking system');
            
            this.scene = scene;
            this.spacecraft = {};
            this.trajectories = {};
            this.modelsLoader = new SpacecraftModels();
            
            // Active and historical missions data
        this.missions = {
            voyager1: {
                name: 'Voyager 1',
                launched: new Date('1977-09-05'),
                status: 'Active',
                type: 'Probe',
                color: 0x00FF00,
                trajectory: 'interstellar',
                currentDistance: 23.5e9, // km from Sun
                speed: 17.0, // km/s
                info: 'First human-made object to enter interstellar space'
            },
            voyager2: {
                name: 'Voyager 2',
                launched: new Date('1977-08-20'),
                status: 'Active',
                type: 'Probe',
                color: 0x00FF00,
                trajectory: 'interstellar',
                currentDistance: 19.5e9, // km
                speed: 15.4, // km/s
                info: 'Only spacecraft to visit all four giant planets'
            },
            newHorizons: {
                name: 'New Horizons',
                launched: new Date('2006-01-19'),
                status: 'Active',
                type: 'Probe',
                color: 0x00FF00,
                trajectory: 'kuiper',
                currentDistance: 7.5e9, // km
                speed: 14.0, // km/s
                info: 'First spacecraft to explore Pluto and Kuiper Belt'
            },
            parker: {
                name: 'Parker Solar Probe',
                launched: new Date('2018-08-12'),
                status: 'Active',
                type: 'Solar',
                color: 0xFFAA00,
                trajectory: 'solar',
                perihelion: 0.046, // AU
                aphelion: 0.98, // AU
                info: 'Closest approach to the Sun by any spacecraft'
            },
            juno: {
                name: 'Juno',
                launched: new Date('2011-08-05'),
                status: 'Active',
                type: 'Orbiter',
                color: 0x00AAFF,
                target: 'jupiter',
                orbit: 'polar',
                info: 'Studying Jupiter\'s composition and magnetic field'
            },
            perseverance: {
                name: 'Perseverance',
                launched: new Date('2020-07-30'),
                status: 'Active',
                type: 'Rover',
                color: 0xFF4444,
                target: 'mars',
                landingSite: 'Jezero Crater',
                info: 'Searching for signs of ancient microbial life on Mars'
            },
            jwst: {
                name: 'James Webb Space Telescope',
                launched: new Date('2021-12-25'),
                status: 'Active',
                type: 'Telescope',
                color: 0xFFFFFF,
                location: 'L2',
                distance: 1.5e6, // km from Earth
                info: 'Most powerful space telescope ever built'
            },
            iss: {
                name: 'International Space Station',
                launched: new Date('1998-11-20'),
                status: 'Active',
                type: 'Station',
                color: 0xC0C0C0,
                target: 'earth',
                altitude: 408, // km above Earth
                inclination: 51.6, // degrees
                orbitalPeriod: 92.68, // minutes
                size: 109, // meters (length)
                info: 'Largest human-made object in low Earth orbit, international collaboration',
                diameter: '109m × 73m × 20m',
                mass: '420,000 kg',
                orbitalSpeed: '7.66 km/s',
                crew: '7 (typical)',
                description: 'A modular space station in low Earth orbit. It serves as a microgravity and space environment research laboratory.'
            }
        };
        
            this.createSpacecraft()
                .then(() => {
                    // this.createUI(); // Disabled - using navigation panel instead
                })
                .catch(error => {
                    console.error('SpacecraftTracker: Failed to create spacecraft:', error);
                });
            
            console.log('SpacecraftTracker: Initialization complete with', Object.keys(this.missions).length, 'missions');
            
        } catch (error) {
            console.error('SpacecraftTracker: Error during initialization:', error);
        }
    }
    
    async createSpacecraft() {
        try {
            console.log('SpacecraftTracker: Creating spacecraft objects');
            
            let createdCount = 0;
            
            for (const [key, mission] of Object.entries(this.missions)) {
            try {
                // Try to load 3D model or create improved geometry
                const mesh = await this.modelsLoader.loadModel(key);
                
                if (!mesh) {
                    console.warn(`Failed to load model for ${key}, skipping...`);
                    continue;
                }
                
                // Add to scene
                this.scene.add(mesh);
                
                // Add glow effect scaled to spacecraft size
                const spacecraftSize = this.getSpacecraftSize(key);
                const glowGeometry = new THREE.SphereGeometry(spacecraftSize * 2, 16, 16);
                const glowMaterial = new THREE.MeshBasicMaterial({
                    color: mission.color,
                    transparent: true,
                    opacity: 0.3
                });
                const glow = new THREE.Mesh(glowGeometry, glowMaterial);
                mesh.add(glow);
                
                // Create trajectory line
                const trajectoryGeometry = new THREE.BufferGeometry();
                const trajectoryMaterial = new THREE.LineBasicMaterial({
                    color: mission.color,
                    transparent: true,
                    opacity: 0.5,
                    linewidth: 2
                });
                const trajectory = new THREE.Line(trajectoryGeometry, trajectoryMaterial);
                this.scene.add(trajectory);
                
                // Setup spacecraft data
                this.spacecraft[key] = {
                    mesh: mesh,
                    trajectory: trajectory,
                    data: mission,
                    positions: []
                };
                
                // Add label
                if (window.planetLabels) {
                    window.planetLabels.createLabel(mission.name, mesh.position, 0.8);
                }
                
                createdCount++;
                console.log('SpacecraftTracker: Created spacecraft:', mission.name);
                
            } catch (error) {
                console.error(`Error creating spacecraft ${key}:`, error);
            }
        }
        
        console.log('SpacecraftTracker: Successfully created', createdCount, 'spacecraft objects');
        
        } catch (error) {
            console.error('SpacecraftTracker: Error creating spacecraft:', error);
        }
    }
    
    createUI() {
        // Mission selector panel
        const panel = document.createElement('div');
        panel.id = 'spacecraft-panel';
        panel.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(0, 0, 0, 0.8);
            border: 1px solid rgba(100, 200, 255, 0.3);
            border-radius: 10px;
            padding: 15px;
            max-width: 250px;
            backdrop-filter: blur(10px);
            display: none;
            z-index: 1001;
        `;
        
        const title = document.createElement('h3');
        title.textContent = 'Active Missions';
        title.style.cssText = `
            margin: 0 0 10px 0;
            color: #4fc3f7;
            font-size: 16px;
        `;
        panel.appendChild(title);
        
        const missionList = document.createElement('div');
        missionList.style.cssText = `
            max-height: 300px;
            overflow-y: auto;
        `;
        
        for (const [key, mission] of Object.entries(this.missions)) {
            const missionItem = document.createElement('div');
            missionItem.style.cssText = `
                padding: 8px;
                margin: 5px 0;
                background: rgba(255, 255, 255, 0.05);
                border-radius: 5px;
                cursor: pointer;
                transition: all 0.3s;
                border: 1px solid transparent;
            `;
            
            missionItem.innerHTML = `
                <div style="display: flex; align-items: center; gap: 8px;">
                    <div style="width: 10px; height: 10px; background: #${mission.color.toString(16).padStart(6, '0')}; border-radius: 50%;"></div>
                    <div>
                        <div style="font-weight: bold; color: #fff;">${mission.name}</div>
                        <div style="font-size: 11px; color: #81c784;">${mission.type} - ${mission.status}</div>
                    </div>
                </div>
            `;
            
            missionItem.addEventListener('click', () => {
                // Use the global navigateToObject function instead of focusOnSpacecraft
                if (window.navigateToObject) {
                    window.navigateToObject(key);
                } else {
                    // Fallback to the old method if navigateToObject is not available
                    this.focusOnSpacecraft(key);
                }
            });
            
            missionItem.addEventListener('mouseenter', () => {
                missionItem.style.background = 'rgba(76, 195, 247, 0.2)';
                missionItem.style.borderColor = '#4fc3f7';
            });
            
            missionItem.addEventListener('mouseleave', () => {
                missionItem.style.background = 'rgba(255, 255, 255, 0.05)';
                missionItem.style.borderColor = 'transparent';
            });
            
            missionList.appendChild(missionItem);
        }
        
        panel.appendChild(missionList);
        
        // Toggle button
        const toggleBtn = document.createElement('button');
        toggleBtn.textContent = '🚀';
        toggleBtn.title = 'Show/Hide Missions';
        toggleBtn.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(0, 0, 0, 0.8);
            border: 1px solid #4fc3f7;
            color: #4fc3f7;
            padding: 10px;
            border-radius: 50%;
            cursor: pointer;
            font-size: 20px;
            width: 50px;
            height: 50px;
            backdrop-filter: blur(10px);
            z-index: 1002;
        `;
        
        toggleBtn.addEventListener('click', () => {
            panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
            toggleBtn.style.display = panel.style.display === 'none' ? 'block' : 'none';
        });
        
        document.body.appendChild(panel);
        document.body.appendChild(toggleBtn);
    }
    
    updatePosition(key, date, ephemeris) {
        const spacecraft = this.spacecraft[key];
        if (!spacecraft) return;
        
        const mission = spacecraft.data;
        
        // Calculate position based on mission type
        let position = new THREE.Vector3();
        
        if (mission.trajectory === 'interstellar') {
            // Voyager missions - simple linear trajectory
            const daysSinceLaunch = (date - mission.launched) / (1000 * 60 * 60 * 24);
            const distance = mission.currentDistance + (mission.speed * daysSinceLaunch * 86400 / 1e9); // Convert to billion km
            
            // Direction based on launch trajectory
            const angle = key === 'voyager1' ? 35 * Math.PI / 180 : -48 * Math.PI / 180;
            position.set(
                Math.cos(angle) * distance / 100, // Scale to scene units
                Math.sin(angle) * distance / 1000, // Some vertical component
                Math.sin(angle) * distance / 100
            );
        } else if (mission.trajectory === 'solar') {
            // Parker Solar Probe - elliptical orbit
            const period = 88; // days
            const daysSinceLaunch = (date - mission.launched) / (1000 * 60 * 60 * 24);
            const orbits = daysSinceLaunch / period;
            const angle = orbits * Math.PI * 2;
            
            const a = (mission.perihelion + mission.aphelion) / 2;
            const e = (mission.aphelion - mission.perihelion) / (mission.aphelion + mission.perihelion);
            const r = a * (1 - e * e) / (1 + e * Math.cos(angle));
            
            position.set(
                r * Math.cos(angle) * 100,
                0,
                r * Math.sin(angle) * 100
            );
        } else if (mission.target) {
            // Orbiters and landers - near their target
            if (mission.type === 'Station' && mission.target === 'earth') {
                // ISS orbits Earth at specific altitude and inclination
                const earthPos = ephemeris ? ephemeris.calculatePosition('earth', date) : { x: 0, y: 0, z: 0 };
                
                // Earth's size in scene units (from space-simulator.js)
                const earthSizeInScene = 20 * 0.0092; // SUN_SIZE * SIZE_RATIOS.earth = 0.184
                const earthRadiusKm = 6371; // km
                
                // Calculate orbit radius in scene units
                const orbitRadiusKm = earthRadiusKm + mission.altitude; // 6371 + 408 = 6779 km
                const orbitRadiusScene = (orbitRadiusKm / earthRadiusKm) * earthSizeInScene; // Scale to scene
                
                // Calculate orbital position
                const orbitalPeriodMinutes = mission.orbitalPeriod || 92.68;
                const minutesSinceLaunch = (date - mission.launched) / (1000 * 60);
                const orbits = minutesSinceLaunch / orbitalPeriodMinutes;
                const angle = orbits * Math.PI * 2;
                
                // Apply inclination
                const inclination = (mission.inclination || 51.6) * Math.PI / 180;
                
                // Calculate position in orbital plane
                const x = orbitRadiusScene * Math.cos(angle);
                const y = orbitRadiusScene * Math.sin(angle) * Math.sin(inclination);
                const z = orbitRadiusScene * Math.sin(angle) * Math.cos(inclination);
                
                // Apply Earth's position (converted to scene units)
                position.set(
                    earthPos.x * 100 + x,
                    earthPos.y * 100 + y,
                    earthPos.z * 100 + z
                );
            } else {
                // Other orbiters and landers - near their target
                const targetPos = ephemeris.calculatePosition(mission.target, date);
                if (targetPos) {
                    position.set(
                        targetPos.x * 100 + Math.random() * 5,
                        targetPos.y * 100,
                        targetPos.z * 100 + Math.random() * 5
                    );
                }
            }
        } else if (mission.location === 'L2') {
            // JWST at Earth-Sun L2
            const earthPos = ephemeris.calculatePosition('earth', date);
            if (earthPos) {
                // L2 is about 1.5 million km from Earth, opposite the Sun
                // 1 AU = 149.6 million km, so 1.5 million km = 0.01 AU
                const l2DistanceAU = 0.01; // 1.5 million km in AU
                
                // Calculate direction from Sun to Earth (and beyond to L2)
                const sunToEarthDirection = new THREE.Vector3(earthPos.x, earthPos.y, earthPos.z).normalize();
                
                // L2 is beyond Earth in the same direction
                position.set(
                    earthPos.x * 100 + sunToEarthDirection.x * l2DistanceAU * 100,
                    earthPos.y * 100 + sunToEarthDirection.y * l2DistanceAU * 100,
                    earthPos.z * 100 + sunToEarthDirection.z * l2DistanceAU * 100
                );
            }
        }
        
        spacecraft.mesh.position.copy(position);
        
        // Update trajectory
        spacecraft.positions.push(position.clone());
        if (spacecraft.positions.length > 100) {
            spacecraft.positions.shift();
        }
        
        // Update trajectory line
        if (spacecraft.positions.length > 1) {
            const points = spacecraft.positions;
            spacecraft.trajectory.geometry.setFromPoints(points);
        }
        
        // Update label
        if (window.planetLabels) {
            window.planetLabels.updateLabel(mission.name, position);
        }
    }
    
    update(date, ephemeris) {
        for (const key of Object.keys(this.spacecraft)) {
            this.updatePosition(key, date, ephemeris);
        }
    }
    
    focusOnSpacecraft(key) {
        const spacecraft = this.spacecraft[key];
        if (!spacecraft) return;
        
        // Trigger camera movement to spacecraft
        if (window.cinematicCamera) {
            window.cinematicCamera.animateToPosition({
                position: spacecraft.mesh.position.clone().add(new THREE.Vector3(10, 5, 10)),
                lookAt: spacecraft.mesh.position,
                duration: 2000,
                easing: 'easeInOutQuad'
            });
        }
        
        // Show info panel
        if (window.infoPanels) {
            window.infoPanels.showMissionInfo({
                name: spacecraft.data.name,
                agency: 'NASA',
                status: spacecraft.data.status,
                launchDate: spacecraft.data.launched.toLocaleDateString(),
                duration: Math.floor((new Date() - spacecraft.data.launched) / (1000 * 60 * 60 * 24)) + ' days',
                target: spacecraft.data.target || 'Deep Space',
                progress: 100, // Could calculate based on mission goals
                objectives: [
                    spacecraft.data.info
                ],
                achievements: [] // Could add mission milestones
            });
        }
    }
    
    setVisibility(visible) {
        for (const spacecraft of Object.values(this.spacecraft)) {
            spacecraft.mesh.visible = visible;
            spacecraft.trajectory.visible = visible;
        }
    }
    
    setTrajectoryVisibility(visible) {
        for (const spacecraft of Object.values(this.spacecraft)) {
            spacecraft.trajectory.visible = visible;
        }
    }
    
    getSpacecraftSize(key) {
        // Return appropriate size for each spacecraft type
        const sizes = {
            voyager1: 0.01,
            voyager2: 0.01,
            newHorizons: 0.008,
            parker: 0.005,
            juno: 0.007,
            perseverance: 0.003,
            jwst: 0.002,
            iss: 0.00002
        };
        return sizes[key] || 0.005;
    }
}