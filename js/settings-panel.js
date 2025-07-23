// Settings Panel for Visual Features
class SettingsPanel {
    constructor() {
        this.container = null;
        this.isVisible = false;
        this.settings = {
            // Core rendering
            planets: { 
                enabled: true, 
                label: 'Planets', 
                category: 'core',
                description: 'Show/hide all planets (Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, Neptune)'
            },
            moons: { 
                enabled: true, 
                label: 'Moons', 
                category: 'core',
                description: 'Show/hide planetary moons including Earth\'s Moon and major moons of gas giants'
            },
            sun: { 
                enabled: true, 
                label: 'Sun', 
                category: 'core',
                description: 'Show/hide the Sun with all its realistic surface features and effects'
            },
            
            // Visual effects
            planetTextures: { 
                enabled: true, 
                label: 'Planet Textures', 
                category: 'visuals',
                description: 'Toggle between realistic planet textures and solid colors'
            },
            planetLabels: { 
                enabled: true, 
                label: 'Planet Labels', 
                category: 'visuals',
                description: 'Show/hide floating text labels that identify each celestial body'
            },
            orbits: { 
                enabled: true, 
                label: 'Orbit Lines', 
                category: 'visuals',
                description: 'Show/hide the orbital paths of planets and other objects'
            },
            orbitTrails: { 
                enabled: false, 
                label: 'Orbit Trails', 
                category: 'visuals',
                description: 'Show/hide animated trails that follow objects in their orbits'
            },
            
            // Atmospheric effects
            atmospheres: { 
                enabled: true, 
                label: 'Atmospheres', 
                category: 'atmosphere',
                description: 'Show/hide atmospheric glow effects around planets with atmospheres'
            },
            auroras: { 
                enabled: true, 
                label: 'Auroras', 
                category: 'atmosphere',
                description: 'Show/hide aurora effects at Earth\'s poles'
            },
            earthCityLights: { 
                enabled: true, 
                label: 'Earth City Lights', 
                category: 'atmosphere',
                description: 'Show/hide city lights on the night side of Earth'
            },
            
            // Sun effects
            sunGlow: { 
                enabled: true, 
                label: 'Sun Glow', 
                category: 'sun',
                description: 'Show/hide the inner glow effect around the Sun'
            },
            sunCorona: { 
                enabled: true, 
                label: 'Sun Corona', 
                category: 'sun',
                description: 'Show/hide the Sun\'s corona (outer atmosphere) layers'
            },
            solarFlares: { 
                enabled: true, 
                label: 'Solar Flares', 
                category: 'sun',
                description: 'Show/hide animated solar flare eruptions from the Sun\'s surface'
            },
            sunspots: { 
                enabled: true, 
                label: 'Sunspots', 
                category: 'sun',
                description: 'Show/hide dark sunspot regions on the Sun\'s surface'
            },
            
            // Space objects
            asteroids: { 
                enabled: true, 
                label: 'Asteroids', 
                category: 'objects',
                description: 'Show/hide the asteroid belt between Mars and Jupiter with 2000+ objects'
            },
            spacecraft: { 
                enabled: true, 
                label: 'Spacecraft', 
                category: 'objects',
                description: 'Show/hide active space missions like Voyager, JWST, and other probes'
            },
            dwarfPlanets: { 
                enabled: true, 
                label: 'Dwarf Planets', 
                category: 'objects',
                description: 'Show/hide dwarf planets like Pluto, Ceres, Eris, and others'
            },
            comets: { 
                enabled: true, 
                label: 'Comets', 
                category: 'objects',
                description: 'Show/hide comets with their characteristic tails and orbits'
            },
            
            // Special features
            blackHole: { 
                enabled: true, 
                label: 'Black Hole', 
                category: 'special',
                description: 'Show/hide Sagittarius A* black hole with gravitational lensing effects'
            },
            saturnRings: { 
                enabled: true, 
                label: 'Saturn Rings', 
                category: 'special',
                description: 'Show/hide Saturn\'s iconic ring system'
            },
            skybox: { 
                enabled: true, 
                label: 'Skybox/Stars', 
                category: 'special',
                description: 'Show/hide the star field background and Milky Way galaxy'
            },
            
            // UI elements
            infoPanels: { 
                enabled: true, 
                label: 'Info Panels', 
                category: 'ui',
                description: 'Show/hide information panels that appear when clicking on objects'
            },
            cameraModeDisplay: { 
                enabled: true, 
                label: 'Camera Mode Display', 
                category: 'ui',
                description: 'Show/hide the camera mode indicator in the bottom left'
            },
            distanceDisplay: { 
                enabled: true, 
                label: 'Distance Display', 
                category: 'ui',
                description: 'Show/hide distance information in the control panel'
            },
            devConsole: { 
                enabled: true, 
                label: 'Dev Console', 
                category: 'ui',
                description: 'Show/hide the developer console for debugging information'
            }
        };
        
        this.createPanel();
        this.createToggleButton();
    }
    
    createToggleButton() {
        // Create gear icon button
        const button = document.createElement('button');
        button.id = 'settings-toggle-btn';
        button.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px;">
                <circle cx="12" cy="12" r="1"></circle>
                <path d="M20.2 12.2A7 7 0 0 0 12.2 3.8M20.2 12.2l1.4 1.4A7 7 0 0 1 13.4 22.2M20.2 12.2A7 7 0 0 1 12.2 20.8M3.8 12.2A7 7 0 0 1 12.2 3.8M3.8 12.2l-1.4 1.4A7 7 0 0 0 10.6 22.2M3.8 12.2A7 7 0 0 0 12.2 20.8"></path>
                <path d="M12 8v8M8 12h8"></path>
            </svg>
            SETTINGS
        `;
        button.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.9));
            border: 1px solid rgba(100, 116, 139, 0.3);
            border-radius: 8px;
            padding: 10px 15px;
            cursor: pointer;
            color: #60a5fa;
            z-index: 1002;
            transition: all 0.3s ease;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3), 
                        0 0 20px rgba(99, 102, 241, 0.1),
                        inset 0 0 20px rgba(99, 102, 241, 0.05);
            backdrop-filter: blur(10px);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 1px;
        `;
        
        button.addEventListener('mouseenter', () => {
            button.style.borderColor = 'rgba(99, 102, 241, 0.8)';
            button.style.boxShadow = '0 6px 24px rgba(0, 0, 0, 0.4), 0 0 40px rgba(99, 102, 241, 0.3)';
            button.style.transform = 'scale(1.05)';
            button.style.color = '#e0e7ff';
        });
        
        button.addEventListener('mouseleave', () => {
            button.style.borderColor = 'rgba(99, 102, 241, 0.4)';
            button.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.3), 0 0 20px rgba(99, 102, 241, 0.1)';
            button.style.transform = 'scale(1)';
            button.style.color = '#60a5fa';
        });
        
        button.addEventListener('click', () => {
            this.toggle();
            // Add click animation
            button.style.transform = 'scale(0.95)';
            setTimeout(() => {
                button.style.transform = 'scale(1)';
            }, 150);
        });
        
        document.body.appendChild(button);
    }
    
    createPanel() {
        // Create main container
        const container = document.createElement('div');
        container.id = 'settings-panel';
        container.style.cssText = `
            position: fixed;
            top: 60px;
            left: 20px;
            width: 350px;
            max-height: 80vh;
            background: linear-gradient(135deg, rgba(15, 23, 42, 0.98), rgba(30, 41, 59, 0.95));
            border: 1px solid rgba(100, 116, 139, 0.5);
            border-radius: 15px;
            padding: 20px;
            display: none;
            z-index: 1003;
            overflow-y: auto;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5), 0 0 80px rgba(99, 102, 241, 0.1);
            backdrop-filter: blur(10px);
            font-family: Arial, sans-serif;
        `;
        
        // Add title
        const title = document.createElement('h2');
        title.textContent = 'Visual Settings';
        title.style.cssText = `
            margin: 0 0 20px 0;
            color: #e0e7ff;
            font-size: 20px;
            text-align: center;
            text-shadow: 0 0 20px rgba(99, 102, 241, 0.5);
        `;
        container.appendChild(title);
        
        // Create categories
        const categories = {
            core: 'Core Rendering',
            visuals: 'Visual Effects',
            atmosphere: 'Atmospheric Effects',
            sun: 'Sun Effects',
            objects: 'Space Objects',
            special: 'Special Features',
            ui: 'UI Elements'
        };
        
        Object.entries(categories).forEach(([categoryKey, categoryLabel]) => {
            const categoryDiv = document.createElement('div');
            categoryDiv.style.cssText = 'margin-bottom: 20px;';
            
            const categoryTitle = document.createElement('h3');
            categoryTitle.textContent = categoryLabel;
            categoryTitle.style.cssText = `
                color: #60a5fa;
                font-size: 14px;
                margin-bottom: 10px;
                text-transform: uppercase;
                letter-spacing: 1px;
                border-bottom: 1px solid rgba(99, 102, 241, 0.3);
                padding-bottom: 5px;
            `;
            categoryDiv.appendChild(categoryTitle);
            
            // Add settings for this category
            Object.entries(this.settings).forEach(([key, setting]) => {
                if (setting.category === categoryKey) {
                    const settingDiv = this.createSettingToggle(key, setting);
                    categoryDiv.appendChild(settingDiv);
                }
            });
            
            container.appendChild(categoryDiv);
        });
        
        // Add close button
        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '×';
        closeBtn.style.cssText = `
            position: absolute;
            right: 10px;
            top: 10px;
            background: transparent;
            border: 1px solid rgba(255, 255, 255, 0.3);
            color: white;
            width: 30px;
            height: 30px;
            border-radius: 50%;
            cursor: pointer;
            font-size: 20px;
            transition: all 0.3s ease;
        `;
        closeBtn.addEventListener('click', () => this.hide());
        closeBtn.addEventListener('mouseenter', () => {
            closeBtn.style.borderColor = 'rgba(255, 255, 255, 0.8)';
            closeBtn.style.transform = 'scale(1.1)';
        });
        closeBtn.addEventListener('mouseleave', () => {
            closeBtn.style.borderColor = 'rgba(255, 255, 255, 0.3)';
            closeBtn.style.transform = 'scale(1)';
        });
        container.appendChild(closeBtn);
        
        // Add reset button
        const resetBtn = document.createElement('button');
        resetBtn.textContent = 'Reset All';
        resetBtn.style.cssText = `
            width: 100%;
            padding: 10px;
            margin-top: 20px;
            background: linear-gradient(135deg, rgba(239, 68, 68, 0.8), rgba(220, 38, 38, 0.8));
            border: 1px solid rgba(239, 68, 68, 0.6);
            color: white;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 600;
            transition: all 0.3s ease;
        `;
        resetBtn.addEventListener('click', () => this.resetAll());
        resetBtn.addEventListener('mouseenter', () => {
            resetBtn.style.transform = 'translateY(-2px)';
            resetBtn.style.boxShadow = '0 5px 15px rgba(239, 68, 68, 0.3)';
        });
        resetBtn.addEventListener('mouseleave', () => {
            resetBtn.style.transform = 'translateY(0)';
            resetBtn.style.boxShadow = 'none';
        });
        container.appendChild(resetBtn);
        
        document.body.appendChild(container);
        this.container = container;
    }
    
    createSettingToggle(key, setting) {
        const div = document.createElement('div');
        div.style.cssText = `
            display: flex;
            flex-direction: column;
            padding: 12px 15px;
            margin-bottom: 8px;
            background: rgba(30, 41, 59, 0.6);
            border-radius: 10px;
            border: 1px solid rgba(71, 85, 105, 0.3);
            transition: all 0.3s ease;
        `;
        
        div.addEventListener('mouseenter', () => {
            div.style.background = 'rgba(51, 65, 85, 0.7)';
            div.style.borderColor = 'rgba(99, 102, 241, 0.4)';
            div.style.transform = 'translateY(-1px)';
        });
        
        div.addEventListener('mouseleave', () => {
            div.style.background = 'rgba(30, 41, 59, 0.6)';
            div.style.borderColor = 'rgba(71, 85, 105, 0.3)';
            div.style.transform = 'translateY(0)';
        });
        
        // Top row: label and toggle
        const topRow = document.createElement('div');
        topRow.style.cssText = `
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 5px;
        `;
        
        const label = document.createElement('span');
        label.textContent = setting.label;
        label.style.cssText = `
            color: #e0e7ff;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            flex: 1;
        `;
        
        const switchContainer = document.createElement('label');
        switchContainer.style.cssText = `
            position: relative;
            display: inline-block;
            width: 52px;
            height: 28px;
            cursor: pointer;
        `;
        
        const input = document.createElement('input');
        input.type = 'checkbox';
        input.checked = setting.enabled;
        input.id = `toggle-${key}`;
        input.style.cssText = 'opacity: 0; width: 0; height: 0;';
        
        const slider = document.createElement('span');
        const isEnabled = setting.enabled;
        slider.style.cssText = `
            position: absolute;
            cursor: pointer;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: ${isEnabled ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, #6b7280, #4b5563)'};
            transition: all 0.4s cubic-bezier(0.4, 0.0, 0.2, 1);
            border-radius: 28px;
            box-shadow: ${isEnabled ? 'inset 0 2px 4px rgba(0, 0, 0, 0.1), 0 0 8px rgba(16, 185, 129, 0.3)' : 'inset 0 2px 4px rgba(0, 0, 0, 0.1)'};
        `;
        
        const sliderButton = document.createElement('span');
        sliderButton.style.cssText = `
            position: absolute;
            content: "";
            height: 22px;
            width: 22px;
            left: ${isEnabled ? '27px' : '3px'};
            bottom: 3px;
            background: linear-gradient(135deg, #ffffff, #f3f4f6);
            transition: all 0.4s cubic-bezier(0.4, 0.0, 0.2, 1);
            border-radius: 50%;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2), 0 1px 3px rgba(0, 0, 0, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.8);
        `;
        
        // Add icons to slider button
        const icon = document.createElement('div');
        icon.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 10px;
            font-weight: bold;
            color: ${isEnabled ? '#10b981' : '#6b7280'};
            transition: color 0.3s ease;
        `;
        icon.textContent = isEnabled ? '✓' : '✕';
        sliderButton.appendChild(icon);
        
        slider.appendChild(sliderButton);
        
        // Helper function to update toggle visuals - DEFINE FIRST
        const updateToggleVisuals = (slider, sliderButton, icon, checked) => {
            console.log(`%c🎨 Updating visual state for toggle: ${checked}`, 'color: #8b5cf6; font-weight: bold;');
            
            if (checked) {
                slider.style.background = 'linear-gradient(135deg, #10b981, #059669)';
                slider.style.boxShadow = 'inset 0 2px 4px rgba(0, 0, 0, 0.1), 0 0 8px rgba(16, 185, 129, 0.3)';
                sliderButton.style.left = '27px';
                sliderButton.style.transform = '';
                icon.style.color = '#10b981';
                icon.textContent = '✓';
            } else {
                slider.style.background = 'linear-gradient(135deg, #6b7280, #4b5563)';
                slider.style.boxShadow = 'inset 0 2px 4px rgba(0, 0, 0, 0.1)';
                sliderButton.style.left = '3px';
                sliderButton.style.transform = '';
                icon.style.color = '#6b7280';
                icon.textContent = '✕';
            }
        };
        
        // Set initial visual state
        updateToggleVisuals(slider, sliderButton, icon, setting.enabled);
        
        // Handle toggle change
        const toggleChange = (e) => {
            const checked = e.checked !== undefined ? e.checked : (e.target ? e.target.checked : input.checked);
            
            console.log(`%c🎛️ TOGGLE STATE CHANGE: ${key} = ${checked}`, 'color: #ff6b35; font-weight: bold; font-size: 14px;');
            
            // Update the setting state
            setting.enabled = checked;
            
            // Update the checkbox state if it's not already correct
            if (input.checked !== checked) {
                input.checked = checked;
            }
            
            // Log to dev console with visual indicator
            this.logToDevConsole(`🎯 USER CLICKED: ${key.toUpperCase()} toggle → ${checked ? 'ENABLED' : 'DISABLED'}`, checked ? 'success' : 'warning');
            
            // Animate slider with immediate visual feedback
            updateToggleVisuals(slider, sliderButton, icon, checked);
            
            // Apply the setting
            console.log(`%c📡 Dispatching settingChanged event for ${key}`, 'color: #4fc3f7;');
            this.applySettings(key, checked);
        };
        
        // Handle the actual checkbox change
        input.addEventListener('change', (e) => {
            console.log(`%c📋 Checkbox change event for ${key}: ${e.target.checked}`, 'color: #f59e0b;');
            toggleChange(e);
        });
        
        // Make entire toggle area clickable
        const handleToggleClick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            const newState = !input.checked;
            console.log(`%c🎚️ Toggle area clicked for ${key}, changing to: ${newState}`, 'color: #607d8b;');
            input.checked = newState;
            toggleChange({ target: input, checked: newState });
        };
        
        // Add click handlers to different parts of the toggle
        topRow.addEventListener('click', handleToggleClick);
        slider.addEventListener('click', handleToggleClick);
        switchContainer.addEventListener('click', handleToggleClick);
        
        switchContainer.appendChild(input);
        switchContainer.appendChild(slider);
        
        topRow.appendChild(label);
        topRow.appendChild(switchContainer);
        
        // Description
        const description = document.createElement('div');
        description.textContent = setting.description;
        description.style.cssText = `
            color: #94a3b8;
            font-size: 11px;
            line-height: 1.4;
            margin-top: 2px;
            opacity: 0.9;
        `;
        
        div.appendChild(topRow);
        div.appendChild(description);
        
        // Store reference for easy access
        div.dataset.settingKey = key;
        div.toggleInput = input;
        
        return div;
    }
    
    applySettings(key, enabled) {
        console.log(`%c⚡ APPLYING SETTING: ${key} = ${enabled}`, 'color: #9c27b0; font-weight: bold;');
        
        // Log to dev console
        this.logToDevConsole(`⚙️ SETTINGS PANEL: ${key.toUpperCase()} toggled ${enabled ? 'ON' : 'OFF'}`, enabled ? 'success' : 'warning');
        
        // Dispatch event for other systems to listen to
        const event = new CustomEvent('settingChanged', {
            detail: { setting: key, enabled: enabled }
        });
        
        console.log(`%c📢 Dispatching event:`, 'color: #009688;', event);
        window.dispatchEvent(event);
        
        // Also trigger immediately for testing
        if (window.settingsConnector) {
            console.log(`%c🔧 Direct call to settings connector`, 'color: #795548;');
            window.settingsConnector.handleSettingChange(key, enabled);
        } else {
            console.warn('⚠️ Settings connector not found!');
            this.logToDevConsole('❌ Settings connector not found!', 'error');
        }
    }
    
    // Helper method to log to dev console
    logToDevConsole(message, type = 'info') {
        const devLogContent = document.getElementById('dev-log-content');
        if (!devLogContent) return;
        
        const timestamp = new Date().toLocaleTimeString();
        const entry = document.createElement('div');
        entry.className = `dev-log-entry ${type}`;
        entry.innerHTML = `<span class="dev-log-timestamp">${timestamp}</span>[PANEL] ${message}`;
        
        devLogContent.appendChild(entry);
        
        // Auto-scroll to bottom
        devLogContent.scrollTop = devLogContent.scrollHeight;
        
        // Limit entries to prevent memory issues
        const entries = devLogContent.children;
        if (entries.length > 100) {
            devLogContent.removeChild(entries[0]);
        }
    }
    
    resetAll() {
        if (confirm('Reset all settings to default? This will enable all visual features.')) {
            Object.keys(this.settings).forEach(key => {
                this.settings[key].enabled = true;
                this.applySettings(key, true);
            });
            
            // Update all toggle states in the current panel
            const settingDivs = this.container.querySelectorAll('[data-setting-key]');
            settingDivs.forEach(div => {
                const key = div.dataset.settingKey;
                const input = div.toggleInput;
                const setting = this.settings[key];
                
                if (input && setting) {
                    input.checked = true;
                    // Trigger change event to update visual state
                    input.dispatchEvent(new Event('change'));
                }
            });
            
            console.log('All settings reset to default');
        }
    }
    
    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }
    
    show() {
        this.container.style.display = 'block';
        this.isVisible = true;
    }
    
    hide() {
        this.container.style.display = 'none';
        this.isVisible = false;
    }
    
    getSetting(key) {
        return this.settings[key]?.enabled ?? true;
    }
}

// Export for global access
if (typeof window !== 'undefined') {
    window.SettingsPanel = SettingsPanel;
}

// Initialize after the class is fully defined
(function() {
    // Auto-initialize when DOM is ready
    document.addEventListener('DOMContentLoaded', function() {
        setTimeout(function() {
            if (!window.settingsPanel) {
                try {
                    console.log('%c🎛️ Auto-initializing Settings Panel...', 'color: #ff6b35; font-weight: bold;');
                    window.settingsPanel = new window.SettingsPanel();
                    console.log('%c✅ Settings Panel initialized successfully', 'color: #4caf50; font-weight: bold;');
                    console.log('Settings Panel instance:', window.settingsPanel);
                    
                    // Log to dev console
                    const devLogContent = document.getElementById('dev-log-content');
                    if (devLogContent) {
                        const timestamp = new Date().toLocaleTimeString();
                        const entry = document.createElement('div');
                        entry.className = 'dev-log-entry success';
                        entry.innerHTML = `<span class="dev-log-timestamp">${timestamp}</span>[PANEL] ✅ Settings Panel ready and button created`;
                        devLogContent.appendChild(entry);
                        devLogContent.scrollTop = devLogContent.scrollHeight;
                    }
                } catch (error) {
                    console.error('Failed to initialize Settings Panel:', error);
                    console.error('Error details:', error.stack);
                    
                    // Log error to dev console
                    const devLogContent = document.getElementById('dev-log-content');
                    if (devLogContent) {
                        const timestamp = new Date().toLocaleTimeString();
                        const entry = document.createElement('div');
                        entry.className = 'dev-log-entry error';
                        entry.innerHTML = `<span class="dev-log-timestamp">${timestamp}</span>[PANEL] ❌ Settings Panel failed: ${error.message}`;
                        devLogContent.appendChild(entry);
                        devLogContent.scrollTop = devLogContent.scrollHeight;
                    }
                }
            } else {
                console.log('%c⚠️ Settings Panel already exists', 'color: #ff9800; font-weight: bold;');
            }
        }, 1000);
    });
})();