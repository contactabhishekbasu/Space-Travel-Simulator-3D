// Settings Connector - Links settings panel to actual visual systems
class SettingsConnector {
    constructor() {
        this.setupEventListeners();
        this.debugMode = true;
    }
    
    setupEventListeners() {
        window.addEventListener('settingChanged', (event) => {
            const { setting, enabled } = event.detail;
            this.handleSettingChange(setting, enabled);
        });
    }
    
    // Debug helper to inspect available objects
    debugAvailableObjects() {
        console.log('=== DEBUGGING AVAILABLE OBJECTS ===');
        this.logToDevConsole('🔍 DEBUGGING AVAILABLE OBJECTS', 'info');
        
        console.log('scene:', typeof scene !== 'undefined' ? scene : 'undefined');
        console.log('bodies:', typeof bodies !== 'undefined' ? Object.keys(bodies) : 'undefined');
        console.log('celestialBodies:', typeof celestialBodies !== 'undefined' ? Object.keys(celestialBodies) : 'undefined');
        console.log('window.moonSystems:', window.moonSystems);
        console.log('window.asteroidBelt:', window.asteroidBelt);
        console.log('window.spacecraftTracker:', window.spacecraftTracker);
        console.log('window.realisticSun:', window.realisticSun);
        console.log('skyboxGroup:', typeof skyboxGroup !== 'undefined' ? skyboxGroup : 'undefined');
        
        if (typeof scene !== 'undefined') {
            console.log('Scene children count:', scene.children.length);
            this.logToDevConsole(`Scene has ${scene.children.length} objects`, 'info');
            console.log('Scene children types:', scene.children.map(child => ({
                type: child.type,
                userData: child.userData,
                name: child.name,
                visible: child.visible
            })));
        }
        
        // Log available systems to dev console
        const systems = {
            'Bodies': typeof bodies !== 'undefined' ? Object.keys(bodies).length : 0,
            'Moon Systems': !!window.moonSystems,
            'Asteroid Belt': !!window.asteroidBelt,
            'Spacecraft': !!window.spacecraftTracker,
            'Realistic Sun': !!window.realisticSun,
            'Skybox': !!window.skyboxGroup,
            'Planet Labels': !!window.planetLabels
        };
        
        Object.entries(systems).forEach(([name, value]) => {
            this.logToDevConsole(`${name}: ${value}`, 'info');
        });
    }
    
    // Helper method to log to dev console
    logToDevConsole(message, type = 'info') {
        const devLogContent = document.getElementById('dev-log-content');
        if (!devLogContent) return;
        
        const timestamp = new Date().toLocaleTimeString();
        const entry = document.createElement('div');
        entry.className = `dev-log-entry ${type}`;
        entry.innerHTML = `<span class="dev-log-timestamp">${timestamp}</span>[SETTINGS] ${message}`;
        
        devLogContent.appendChild(entry);
        
        // Auto-scroll to bottom
        devLogContent.scrollTop = devLogContent.scrollHeight;
        
        // Limit entries to prevent memory issues
        const entries = devLogContent.children;
        if (entries.length > 100) {
            devLogContent.removeChild(entries[0]);
        }
    }
    
    handleSettingChange(setting, enabled) {
        console.log(`%c🔧 Applying setting: ${setting} = ${enabled}`, `color: ${enabled ? '#10b981' : '#ef4444'}; font-weight: bold;`);
        
        // Log to dev console
        this.logToDevConsole(`🎛️ SETTING CHANGED: ${setting.toUpperCase()} = ${enabled ? 'ON' : 'OFF'}`, enabled ? 'success' : 'warning');
        
        // Debug available objects on first toggle
        if (this.debugMode) {
            this.debugAvailableObjects();
            this.debugMode = false; // Only show once
        }
        
        try {
            switch(setting) {
                // Core rendering
                case 'planets':
                    this.togglePlanets(enabled);
                    break;
                case 'moons':
                    this.toggleMoons(enabled);
                    break;
                case 'sun':
                    this.toggleSun(enabled);
                    break;
                    
                // Visual effects
                case 'planetTextures':
                    this.togglePlanetTextures(enabled);
                    break;
                case 'planetLabels':
                    this.togglePlanetLabels(enabled);
                    break;
                case 'orbits':
                    this.toggleOrbits(enabled);
                    break;
                case 'orbitTrails':
                    this.toggleOrbitTrails(enabled);
                    break;
                    
                // Atmospheric effects
                case 'atmospheres':
                    this.toggleAtmospheres(enabled);
                    break;
                case 'auroras':
                    this.toggleAuroras(enabled);
                    break;
                case 'earthCityLights':
                    this.toggleEarthCityLights(enabled);
                    break;
                    
                // Sun effects
                case 'sunGlow':
                case 'sunCorona':
                case 'solarFlares':
                case 'sunspots':
                    this.toggleSunEffects(setting, enabled);
                    break;
                    
                // Space objects
                case 'asteroids':
                    this.toggleAsteroids(enabled);
                    break;
                case 'spacecraft':
                    this.toggleSpacecraft(enabled);
                    break;
                case 'dwarfPlanets':
                    this.toggleDwarfPlanets(enabled);
                    break;
                case 'comets':
                    this.toggleComets(enabled);
                    break;
                    
                // Special features
                case 'blackHole':
                    this.toggleBlackHole(enabled);
                    break;
                case 'saturnRings':
                    this.toggleSaturnRings(enabled);
                    break;
                case 'skybox':
                    this.toggleSkybox(enabled);
                    break;
                    
                // UI elements
                case 'infoPanels':
                    this.toggleInfoPanels(enabled);
                    break;
                case 'cameraModeDisplay':
                    this.toggleCameraModeDisplay(enabled);
                    break;
                case 'distanceDisplay':
                    this.toggleDistanceDisplay(enabled);
                    break;
                case 'devConsole':
                    this.toggleDevConsole(enabled);
                    break;
                    
                default:
                    console.warn(`Unknown setting: ${setting}`);
            }
        } catch (error) {
            console.error(`Error applying setting ${setting}:`, error);
        }
    }
    
    // Core rendering toggles
    togglePlanets(enabled) {
        // Log to dev console
        this.logToDevConsole(`🪐 PLANETS ${enabled ? 'ENABLED' : 'DISABLED'}`, enabled ? 'success' : 'warning');
        
        // Check if we can access global variables
        if (typeof window.bodies === 'undefined' && typeof bodies === 'undefined') {
            const errorMsg = '❌ Bodies object not found in global scope';
            console.error(errorMsg);
            this.logToDevConsole(errorMsg, 'error');
            return;
        }
        
        // Use global bodies object
        const bodiesObj = window.bodies || bodies;
        
        let count = 0;
        const affectedPlanets = [];
        
        // Filter to only actual planet meshes, not materials or effects
        const planetKeys = ['mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune'];
        
        Object.keys(bodiesObj).forEach(key => {
            if (bodiesObj[key] && bodiesObj[key].type === 'Mesh' && planetKeys.includes(key)) {
                console.log(`Setting planet ${key} visible to ${enabled}`);
                bodiesObj[key].visible = enabled;
                affectedPlanets.push(key);
                count++;
            }
        });
        
        // Also check if there are other planet objects in scene directly
        const sceneObj = window.scene || scene;
        if (sceneObj) {
            sceneObj.children.forEach(child => {
                if (child.userData && child.userData.type === 'planet' && planetKeys.includes(child.userData.name)) {
                    console.log(`Setting scene planet ${child.userData.name} visible to ${enabled}`);
                    child.visible = enabled;
                    if (!affectedPlanets.includes(child.userData.name)) {
                        affectedPlanets.push(child.userData.name);
                        count++;
                    }
                }
            });
        }
        
        const resultMsg = `${enabled ? 'Showed' : 'Hid'} ${count} planets: ${affectedPlanets.join(', ')}`;
        console.log(`✅ ${resultMsg}`);
        this.logToDevConsole(resultMsg, enabled ? 'success' : 'info');
        
        // The animation loop will handle the rendering automatically
    }
    
    toggleMoons(enabled) {
        this.logToDevConsole(`🌙 MOONS ${enabled ? 'ENABLED' : 'DISABLED'}`, enabled ? 'success' : 'warning');
        
        if (window.moonSystems && typeof window.moonSystems.setVisible === 'function') {
            window.moonSystems.setVisible(enabled);
            const msg = `${enabled ? 'Showed' : 'Hid'} moon systems`;
            console.log(msg);
            this.logToDevConsole(msg, enabled ? 'success' : 'info');
        } else {
            // Fallback: find moon objects in scene
            let count = 0;
            if (typeof scene !== 'undefined') {
                scene.children.forEach(child => {
                    if (child.userData && child.userData.type === 'moon') {
                        child.visible = enabled;
                        count++;
                    }
                });
                const msg = `${enabled ? 'Showed' : 'Hid'} ${count} individual moons`;
                console.log(msg);
                this.logToDevConsole(msg, enabled ? 'success' : 'info');
            } else {
                this.logToDevConsole('❌ Scene not available for moon toggle', 'error');
            }
        }
    }
    
    toggleSun(enabled) {
        this.logToDevConsole(`☀️ SUN ${enabled ? 'ENABLED' : 'DISABLED'}`, enabled ? 'success' : 'warning');
        
        let operations = [];
        
        if (typeof bodies !== 'undefined' && bodies.sun) {
            bodies.sun.visible = enabled;
            operations.push('sun mesh');
        }
        
        if (window.realisticSun && typeof window.realisticSun.setVisible === 'function') {
            window.realisticSun.setVisible(enabled);
            operations.push('realistic sun effects');
        } else if (window.realisticSun && window.realisticSun.group) {
            window.realisticSun.group.visible = enabled;
            operations.push('realistic sun group');
        }
        
        const msg = `${enabled ? 'Showed' : 'Hid'} sun: ${operations.join(', ')}`;
        console.log(msg);
        this.logToDevConsole(msg, enabled ? 'success' : 'info');
    }
    
    // Visual effects toggles
    togglePlanetTextures(enabled) {
        Object.keys(bodies).forEach(key => {
            if (bodies[key] && bodies[key].material) {
                if (enabled) {
                    // Restore original material/texture
                    this.restoreOriginalTexture(key);
                } else {
                    // Replace with solid color
                    this.replaceWithSolidColor(key);
                }
            }
        });
    }
    
    togglePlanetLabels(enabled) {
        if (window.planetLabels) {
            window.planetLabels.setVisible(enabled);
        }
    }
    
    toggleOrbits(enabled) {
        this.logToDevConsole(`🔄 ORBITS ${enabled ? 'ENABLED' : 'DISABLED'}`, enabled ? 'success' : 'warning');
        
        const sceneObj = window.scene || scene;
        if (!sceneObj) {
            const errorMsg = '❌ Scene not found';
            console.warn(errorMsg);
            this.logToDevConsole(errorMsg, 'error');
            return;
        }
        
        let count = 0;
        sceneObj.children.forEach(child => {
            if (child.userData && child.userData.type === 'orbit') {
                child.visible = enabled;
                count++;
            }
        });
        
        // Also check global orbits object
        const orbitsObj = window.orbits || orbits;
        if (orbitsObj) {
            Object.values(orbitsObj).forEach(orbit => {
                if (orbit && orbit.visible !== undefined) {
                    orbit.visible = enabled;
                    count++;
                }
            });
        }
        
        const msg = `${enabled ? 'Showed' : 'Hid'} ${count} orbit lines`;
        console.log(`✅ ${msg}`);
        this.logToDevConsole(msg, enabled ? 'success' : 'info');
    }
    
    toggleOrbitTrails(enabled) {
        if (window.orbitTrails) {
            window.orbitTrails.setVisible(enabled);
        }
    }
    
    // Atmospheric effects toggles
    toggleAtmospheres(enabled) {
        if (window.atmosphereSystem) {
            window.atmosphereSystem.setVisible(enabled);
        }
    }
    
    toggleAuroras(enabled) {
        // Find aurora objects in scene
        scene.children.forEach(child => {
            if (child.userData && child.userData.type === 'aurora') {
                child.visible = enabled;
            }
        });
    }
    
    toggleEarthCityLights(enabled) {
        // This would modify Earth's night shader
        if (bodies.earth && bodies.earth.material && bodies.earth.material.uniforms) {
            // Assuming there's a uniform for city lights
            if (bodies.earth.material.uniforms.showCityLights) {
                bodies.earth.material.uniforms.showCityLights.value = enabled;
            }
        }
    }
    
    // Sun effects toggles
    toggleSunEffects(effectType, enabled) {
        if (window.realisticSun) {
            switch(effectType) {
                case 'sunGlow':
                    window.realisticSun.toggleGlow(enabled);
                    break;
                case 'sunCorona':
                    window.realisticSun.toggleCorona(enabled);
                    break;
                case 'solarFlares':
                    window.realisticSun.toggleFlares(enabled);
                    break;
                case 'sunspots':
                    window.realisticSun.toggleSunspots(enabled);
                    break;
            }
        }
    }
    
    // Space objects toggles
    toggleAsteroids(enabled) {
        if (window.asteroidBelt) {
            window.asteroidBelt.setVisible(enabled);
        }
    }
    
    toggleSpacecraft(enabled) {
        if (window.spacecraftTracker) {
            window.spacecraftTracker.setVisible(enabled);
        }
    }
    
    toggleDwarfPlanets(enabled) {
        if (window.dwarfPlanetsComets) {
            window.dwarfPlanetsComets.setDwarfPlanetsVisible(enabled);
        }
    }
    
    toggleComets(enabled) {
        if (window.dwarfPlanetsComets) {
            window.dwarfPlanetsComets.setCometsVisible(enabled);
        }
    }
    
    // Special features toggles
    toggleBlackHole(enabled) {
        scene.children.forEach(child => {
            if (child.userData && child.userData.type === 'blackhole') {
                child.visible = enabled;
            }
        });
    }
    
    toggleSaturnRings(enabled) {
        if (window.ringSystems) {
            window.ringSystems.setVisible('saturn', enabled);
        }
    }
    
    toggleSkybox(enabled) {
        this.logToDevConsole(`🌌 SKYBOX ${enabled ? 'ENABLED' : 'DISABLED'}`, enabled ? 'success' : 'warning');
        
        const skybox = window.skyboxGroup || skyboxGroup;
        if (skybox) {
            skybox.visible = enabled;
            const msg = `${enabled ? 'Showed' : 'Hid'} skybox`;
            console.log(`✅ ${msg}`);
            this.logToDevConsole(msg, enabled ? 'success' : 'info');
        } else {
            const errorMsg = '❌ Skybox not found';
            console.warn(errorMsg);
            this.logToDevConsole(errorMsg, 'error');
        }
    }
    
    // UI elements toggles
    toggleInfoPanels(enabled) {
        const infoPanel = document.getElementById('info');
        const simpleInfoPanel = document.getElementById('simple-info-panel');
        
        let count = 0;
        if (infoPanel) {
            infoPanel.style.display = enabled ? 'block' : 'none';
            count++;
        }
        if (simpleInfoPanel) {
            simpleInfoPanel.style.display = enabled ? 'block' : 'none';
            count++;
        }
        console.log(`✅ ${enabled ? 'Showed' : 'Hid'} ${count} info panels`);
    }
    
    toggleCameraModeDisplay(enabled) {
        const cameraModeElement = document.getElementById('camera-mode');
        if (cameraModeElement) {
            cameraModeElement.style.display = enabled ? 'block' : 'none';
            console.log(`✅ ${enabled ? 'Showed' : 'Hid'} camera mode display`);
        } else {
            console.warn('❌ Camera mode display element not found');
        }
    }
    
    toggleDistanceDisplay(enabled) {
        const distanceElement = document.getElementById('distance');
        if (distanceElement) {
            distanceElement.style.display = enabled ? 'block' : 'none';
            console.log(`✅ ${enabled ? 'Showed' : 'Hid'} distance display`);
        } else {
            console.warn('❌ Distance display element not found');
        }
    }
    
    toggleDevConsole(enabled) {
        const devContainer = document.getElementById('dev-log-container');
        if (devContainer) {
            if (enabled) {
                devContainer.classList.add('dev-mode-active');
            } else {
                devContainer.classList.remove('dev-mode-active');
            }
            console.log(`✅ ${enabled ? 'Showed' : 'Hid'} dev console`);
        } else {
            console.warn('❌ Dev console container not found');
        }
    }
    
    // Helper methods
    restoreOriginalTexture(planetKey) {
        // This would restore the original texture - simplified for now
        console.log(`Restoring texture for ${planetKey}`);
    }
    
    replaceWithSolidColor(planetKey) {
        // This would replace texture with solid color - simplified for now
        console.log(`Replacing texture with solid color for ${planetKey}`);
        if (bodies[planetKey] && bodies[planetKey].material) {
            // Create a simple colored material
            const planetData = celestialBodies[planetKey];
            if (planetData && planetData.color) {
                bodies[planetKey].material = new THREE.MeshBasicMaterial({ 
                    color: planetData.color 
                });
            }
        }
    }
}

// Initialize after DOM loads and systems are ready
document.addEventListener('DOMContentLoaded', () => {
    // Wait for other systems to initialize
    setTimeout(() => {
        if (!window.settingsConnector) {
            try {
                console.log('%c🔧 Auto-initializing Settings Connector...', 'color: #ff6b35; font-weight: bold;');
                window.settingsConnector = new SettingsConnector();
                console.log('%c✅ Settings connector initialized and ready', 'color: #4caf50; font-weight: bold;');
                
                // Test the event system
                console.log('%c🧪 Testing event system...', 'color: #ff9800;');
                window.dispatchEvent(new CustomEvent('settingChanged', {
                    detail: { setting: 'test', enabled: true }
                }));
            } catch (error) {
                console.error('Failed to initialize Settings Connector:', error);
            }
        }
    }, 1000);
});