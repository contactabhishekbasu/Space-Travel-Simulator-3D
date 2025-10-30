// Moon systems for gas giants
class MoonSystems {
    constructor(scene) {
        this.scene = scene;
        this.moonGroups = {};
        this.moons = {};
        
        // Performance optimization
        this.lastUpdateTime = 0;
        this.updateInterval = 33; // Update every 33ms (~30fps for moons)
        this.lodDistances = {
            near: 1000,   // Full detail moons
            medium: 3000, // Reduced detail
            far: 6000     // Minimal or no updates
        };
        
        // Batch processing for moon updates
        this.moonUpdateBatch = 0;
        this.batchSize = 5; // Update 5 moons per frame
        
        // Major moons data (simplified orbital elements)
        this.moonData = {
            jupiter: {
                io: {
                    name: 'Io',
                    radius: 1821.6,  // km
                    distance: 421800, // km from Jupiter
                    period: 1.769,    // days
                    color: 0xFFFF99,
                    info: 'Most volcanically active body in the solar system'
                },
                europa: {
                    name: 'Europa',
                    radius: 1560.8,
                    distance: 671100,
                    period: 3.551,
                    color: 0xFFFFEE,
                    info: 'Ice-covered ocean moon, potential for life'
                },
                ganymede: {
                    name: 'Ganymede',
                    radius: 2634.1,
                    distance: 1070400,
                    period: 7.155,
                    color: 0xCCBBAA,
                    info: 'Largest moon in the solar system'
                },
                callisto: {
                    name: 'Callisto',
                    radius: 2410.3,
                    distance: 1882700,
                    period: 16.689,
                    color: 0x998877,
                    info: 'Heavily cratered ancient surface'
                }
            },
            saturn: {
                mimas: {
                    name: 'Mimas',
                    radius: 198.2,
                    distance: 185539,
                    period: 0.942,
                    color: 0xDDDDDD,
                    info: 'Death Star moon with giant crater'
                },
                enceladus: {
                    name: 'Enceladus',
                    radius: 252.1,
                    distance: 238037,
                    period: 1.370,
                    color: 0xFFFFFF,
                    info: 'Ice geysers from subsurface ocean'
                },
                tethys: {
                    name: 'Tethys',
                    radius: 531.0,
                    distance: 294672,
                    period: 1.888,
                    color: 0xEEEEEE,
                    info: 'Ice moon with giant canyon'
                },
                dione: {
                    name: 'Dione',
                    radius: 561.4,
                    distance: 377415,
                    period: 2.737,
                    color: 0xDDDDCC,
                    info: 'Wispy terrain from tectonic fractures'
                },
                rhea: {
                    name: 'Rhea',
                    radius: 763.8,
                    distance: 527068,
                    period: 4.518,
                    color: 0xCCCCBB,
                    info: 'Second largest moon of Saturn'
                },
                titan: {
                    name: 'Titan',
                    radius: 2574.7,
                    distance: 1221865,
                    period: 15.945,
                    color: 0xDDAA44,
                    info: 'Thick atmosphere, lakes of methane'
                },
                iapetus: {
                    name: 'Iapetus',
                    radius: 734.5,
                    distance: 3560854,
                    period: 79.322,
                    color: 0x443322,
                    info: 'Two-toned moon, one dark, one bright'
                }
            },
            uranus: {
                miranda: {
                    name: 'Miranda',
                    radius: 235.8,
                    distance: 129900,
                    period: 1.413,
                    color: 0xCCBBAA,
                    info: 'Frankenstein moon with varied terrain'
                },
                ariel: {
                    name: 'Ariel',
                    radius: 578.9,
                    distance: 190900,
                    period: 2.520,
                    color: 0xDDCCBB,
                    info: 'Brightest moon of Uranus'
                },
                umbriel: {
                    name: 'Umbriel',
                    radius: 584.7,
                    distance: 266000,
                    period: 4.144,
                    color: 0x776655,
                    info: 'Darkest moon of Uranus'
                },
                titania: {
                    name: 'Titania',
                    radius: 788.9,
                    distance: 436300,
                    period: 8.706,
                    color: 0xBBAA99,
                    info: 'Largest moon of Uranus'
                },
                oberon: {
                    name: 'Oberon',
                    radius: 761.4,
                    distance: 583500,
                    period: 13.463,
                    color: 0xAA9988,
                    info: 'Outermost major moon of Uranus'
                }
            },
            neptune: {
                triton: {
                    name: 'Triton',
                    radius: 1353.4,
                    distance: 354759,
                    period: -5.877, // Negative = retrograde
                    color: 0xFFCCCC,
                    info: 'Retrograde orbit, nitrogen geysers'
                },
                nereid: {
                    name: 'Nereid',
                    radius: 170,
                    distance: 5513818,
                    period: 360.13,
                    color: 0xCCCCCC,
                    info: 'Highly eccentric orbit'
                }
            }
        };
        
        // Scaling factors
        this.moonSizeScale = 0.0001; // Scale moon radii
        this.orbitScale = 0.0001;    // Scale orbital distances
        
        // Performance tracking
        this.totalMoons = 0;
        this.activeMoons = 0;
    }
    
    createMoonSystem(planetName, planetMesh, planetRadius) {
        if (!this.moonData[planetName]) return;
        
        const moonGroup = new THREE.Group();
        this.moonGroups[planetName] = moonGroup;
        this.scene.add(moonGroup);
        
        const moons = this.moonData[planetName];
        
        for (const [moonKey, moonInfo] of Object.entries(moons)) {
            // Create moon mesh
            const moonRadius = moonInfo.radius * this.moonSizeScale;
            const moonGeometry = new THREE.SphereGeometry(
                Math.max(moonRadius, planetRadius * 0.05), // Minimum size for visibility
                16, 
                16
            );
            
            const moonMaterial = new THREE.MeshPhongMaterial({
                color: moonInfo.color,
                emissive: moonInfo.color,
                emissiveIntensity: 0.1
            });
            
            const moonMesh = new THREE.Mesh(moonGeometry, moonMaterial);
            
            // Create moon container for orbital motion
            const moonContainer = new THREE.Group();
            moonContainer.add(moonMesh);
            moonGroup.add(moonContainer);
            
            // Create orbit line
            const orbitRadius = moonInfo.distance * this.orbitScale + planetRadius * 1.5;
            const orbitPoints = [];
            const segments = 64;
            
            for (let i = 0; i <= segments; i++) {
                const angle = (i / segments) * Math.PI * 2;
                orbitPoints.push(new THREE.Vector3(
                    Math.cos(angle) * orbitRadius,
                    0,
                    Math.sin(angle) * orbitRadius
                ));
            }
            
            const orbitGeometry = new THREE.BufferGeometry().setFromPoints(orbitPoints);
            const orbitMaterial = new THREE.LineBasicMaterial({
                color: 0x444444,
                transparent: true,
                opacity: 0.3
            });
            
            const orbitLine = new THREE.Line(orbitGeometry, orbitMaterial);
            moonGroup.add(orbitLine);
            
            // Store moon data
            this.moons[`${planetName}_${moonKey}`] = {
                mesh: moonMesh,
                container: moonContainer,
                orbitLine: orbitLine,
                data: moonInfo,
                orbitRadius: orbitRadius,
                orbitAngle: Math.random() * Math.PI * 2,
                planetName: planetName
            };
            
            this.totalMoons++;
            
            // Add label if planet labels exist
            if (window.planetLabels) {
                window.planetLabels.createLabel(moonInfo.name, moonMesh.position, 0.5);
            }
        }
    }
    
    update(deltaTime, planetPositions, timeScale = 1) {
        // Check if planetPositions is provided
        if (!planetPositions) {
            console.warn('MoonSystems: planetPositions not provided to update method');
            return;
        }

        // Performance optimization: Throttle updates
        const currentTime = performance.now();
        if (currentTime - this.lastUpdateTime < this.updateInterval) {
            return;
        }
        this.lastUpdateTime = currentTime;

        // Get camera position for LOD calculations
        const cameraPos = window.camera ? window.camera.position : new THREE.Vector3();
        
        // Convert moons to array for batch processing
        const moonEntries = Object.entries(this.moons);
        this.activeMoons = 0;
        
        // Batch processing: Update only a subset each frame
        const startIdx = this.moonUpdateBatch * this.batchSize;
        const endIdx = Math.min(startIdx + this.batchSize, moonEntries.length);
        
        for (let i = startIdx; i < endIdx; i++) {
            const [key, moon] = moonEntries[i];
            const planetPos = planetPositions?.[moon.planetName];
            if (!planetPos) continue;
            
            // Distance-based LOD optimization
            const moonGroup = this.moonGroups[moon.planetName];
            if (moonGroup) {
                const distanceToCamera = cameraPos.distanceTo(moonGroup.position);
                
                // Skip very distant moons
                if (distanceToCamera > this.lodDistances.far) {
                    moon.mesh.visible = false;
                    continue;
                }
                
                moon.mesh.visible = true;
                this.activeMoons++;
                
                // Reduce update frequency for distant moons
                const updateFrequency = distanceToCamera > this.lodDistances.medium ? 0.1 : 
                                       distanceToCamera > this.lodDistances.near ? 0.5 : 1.0;
                
                if (Math.random() > updateFrequency) {
                    continue;
                }
            }
            
            // Update moon orbital position
            const angularSpeed = (2 * Math.PI) / (Math.abs(moon.data.period) * 86400); // rad/s
            moon.orbitAngle += angularSpeed * deltaTime * timeScale * Math.sign(moon.data.period);
            
            // Position moon in orbit
            const x = Math.cos(moon.orbitAngle) * moon.orbitRadius;
            const z = Math.sin(moon.orbitAngle) * moon.orbitRadius;
            moon.mesh.position.set(x, 0, z);
            
            // Update moon group position to follow planet
            if (moonGroup && planetPos) {
                moonGroup.position.copy(planetPos);
            }
            
            // Update label position if it exists (less frequently)
            if (window.planetLabels && Math.random() < 0.1) {
                const worldPos = new THREE.Vector3();
                moon.mesh.getWorldPosition(worldPos);
                window.planetLabels.updateLabel(moon.data.name, worldPos);
            }
        }
        
        // Advance to next batch
        this.moonUpdateBatch = (this.moonUpdateBatch + 1) % Math.ceil(moonEntries.length / this.batchSize);
    }
    
    setVisibility(visible) {
        for (const moonGroup of Object.values(this.moonGroups)) {
            moonGroup.visible = visible;
        }
    }
    
    // Performance method to adjust LOD based on frame rate
    adjustLODForPerformance(frameRate) {
        if (frameRate < 30) {
            // Reduce quality for better performance
            this.lodDistances.near = 500;
            this.lodDistances.medium = 1500;
            this.lodDistances.far = 3000;
            this.updateInterval = 50; // 20fps
            this.batchSize = 3;
        } else if (frameRate > 55) {
            // Increase quality when performance allows
            this.lodDistances.near = 1000;
            this.lodDistances.medium = 3000;
            this.lodDistances.far = 6000;
            this.updateInterval = 33; // 30fps
            this.batchSize = 5;
        }
    }
    
    // Get performance statistics
    getPerformanceStats() {
        return {
            totalMoons: this.totalMoons,
            activeMoons: this.activeMoons,
            updateInterval: this.updateInterval,
            batchSize: this.batchSize
        };
    }
    
    setOrbitVisibility(visible) {
        for (const moon of Object.values(this.moons)) {
            moon.orbitLine.visible = visible;
        }
    }
    
    getMoonInfo(moonMesh) {
        for (const [key, moon] of Object.entries(this.moons)) {
            if (moon.mesh === moonMesh) {
                return moon.data;
            }
        }
        return null;
    }
    
    highlightMoon(moonName, planetName) {
        const key = `${planetName}_${moonName.toLowerCase()}`;
        const moon = this.moons[key];
        
        if (moon) {
            // Temporarily increase emissive intensity
            moon.mesh.material.emissiveIntensity = 0.5;
            
            setTimeout(() => {
                moon.mesh.material.emissiveIntensity = 0.1;
            }, 2000);
            
            return moon.mesh.position.clone().add(
                this.moonGroups[planetName].position
            );
        }
        
        return null;
    }
}