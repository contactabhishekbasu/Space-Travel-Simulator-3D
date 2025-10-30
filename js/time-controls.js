// Advanced time control system like NASA Eyes
class TimeControls {
    constructor(ephemerisEngine) {
        this.ephemeris = ephemerisEngine;
        this.currentDate = new Date();
        this.timeScale = 1; // 1 = real-time
        this.isPaused = false;
        this.lastUpdateTime = performance.now();
        
        // Time scale presets (seconds per second)
        this.timeScalePresets = {
            'real': 1,
            'minute': 60,
            'hour': 3600,
            'day': 86400,
            'week': 604800,
            'month': 2592000,
            'year': 31536000
        };
        
        this.createUI();
        this.setupEventListeners();
        this.updateDisplay();
    }
    
    createUI() {
        const container = document.createElement('div');
        container.id = 'time-controls-container';
        container.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.9));
            border: 1px solid rgba(100, 200, 255, 0.3);
            border-radius: 15px;
            padding: 12px 18px;
            display: flex;
            align-items: center;
            gap: 12px;
            backdrop-filter: blur(15px);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5), 0 0 40px rgba(99, 102, 241, 0.1);
            z-index: 1000;
            font-family: 'Courier New', monospace;
        `;
        
        // Compact date display - single line only
        const dateDisplay = document.createElement('div');
        dateDisplay.id = 'time-date-display';
        dateDisplay.style.cssText = `
            color: #60a5fa;
            font-size: 12px;
            font-weight: 600;
            min-width: 140px;
            letter-spacing: 0.5px;
            text-shadow: 0 0 10px rgba(96, 165, 250, 0.3);
        `;
        container.appendChild(dateDisplay);
        
        // Compact Play/Pause button
        const playPauseBtn = document.createElement('button');
        playPauseBtn.id = 'time-play-pause';
        playPauseBtn.innerHTML = '⏸';
        playPauseBtn.style.cssText = `
            background: linear-gradient(135deg, rgba(30, 41, 59, 0.8), rgba(51, 65, 85, 0.8));
            border: 1px solid #4fc3f7;
            color: #4fc3f7;
            font-size: 14px;
            width: 30px;
            height: 30px;
            border-radius: 50%;
            cursor: pointer;
            transition: all 0.3s;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 0 10px rgba(79, 195, 247, 0.2);
        `;
        playPauseBtn.addEventListener('mouseover', () => {
            playPauseBtn.style.boxShadow = '0 0 20px rgba(79, 195, 247, 0.4)';
            playPauseBtn.style.transform = 'scale(1.1)';
        });
        playPauseBtn.addEventListener('mouseout', () => {
            playPauseBtn.style.boxShadow = '0 0 10px rgba(79, 195, 247, 0.2)';
            playPauseBtn.style.transform = 'scale(1)';
        });
        container.appendChild(playPauseBtn);
        
        // Compact time scale control
        const sliderContainer = document.createElement('div');
        sliderContainer.style.cssText = `
            display: flex;
            align-items: center;
            gap: 8px;
        `;
        
        const sliderLabel = document.createElement('div');
        sliderLabel.id = 'time-scale-label';
        sliderLabel.style.cssText = `
            color: #81c784;
            font-size: 10px;
            font-weight: 600;
            min-width: 60px;
            text-align: center;
            text-shadow: 0 0 8px rgba(129, 199, 132, 0.3);
        `;
        sliderLabel.textContent = '1x';
        sliderContainer.appendChild(sliderLabel);
        
        const timeSlider = document.createElement('input');
        timeSlider.id = 'time-scale-slider';
        timeSlider.type = 'range';
        timeSlider.min = '-7';
        timeSlider.max = '7';
        timeSlider.value = '0';
        timeSlider.style.cssText = `
            width: 100px;
            height: 4px;
            background: linear-gradient(to right, rgba(129, 199, 132, 0.3), rgba(129, 199, 132, 0.7));
            border-radius: 2px;
            outline: none;
            -webkit-appearance: none;
        `;
        sliderContainer.appendChild(timeSlider);
        container.appendChild(sliderContainer);
        
        // Compact preset buttons
        const presetContainer = document.createElement('div');
        presetContainer.style.cssText = `
            display: flex;
            gap: 4px;
        `;
        
        ['1h', '1d', '1m', '1y'].forEach((preset, index) => {
            const btn = document.createElement('button');
            btn.className = 'time-preset-btn';
            btn.textContent = preset;
            btn.dataset.preset = ['1hr', '1day', '1mo', '1yr'][index];
            btn.style.cssText = `
                background: linear-gradient(135deg, rgba(76, 195, 247, 0.1), rgba(76, 195, 247, 0.05));
                border: 1px solid rgba(76, 195, 247, 0.3);
                color: #4fc3f7;
                padding: 4px 8px;
                border-radius: 8px;
                cursor: pointer;
                font-size: 10px;
                font-weight: 600;
                transition: all 0.3s;
                text-shadow: 0 0 6px rgba(79, 195, 247, 0.2);
            `;
            btn.addEventListener('mouseover', () => {
                btn.style.background = 'linear-gradient(135deg, rgba(76, 195, 247, 0.2), rgba(76, 195, 247, 0.1))';
                btn.style.boxShadow = '0 0 10px rgba(79, 195, 247, 0.3)';
            });
            btn.addEventListener('mouseout', () => {
                btn.style.background = 'linear-gradient(135deg, rgba(76, 195, 247, 0.1), rgba(76, 195, 247, 0.05))';
                btn.style.boxShadow = 'none';
            });
            presetContainer.appendChild(btn);
        });
        container.appendChild(presetContainer);
        
        // Compact utility buttons
        const utilityContainer = document.createElement('div');
        utilityContainer.style.cssText = `
            display: flex;
            gap: 6px;
        `;
        
        // Jump to date button
        const jumpBtn = document.createElement('button');
        jumpBtn.id = 'time-jump-btn';
        jumpBtn.textContent = '📅';
        jumpBtn.title = 'Jump to date';
        jumpBtn.style.cssText = `
            background: linear-gradient(135deg, rgba(129, 199, 132, 0.1), rgba(129, 199, 132, 0.05));
            border: 1px solid rgba(129, 199, 132, 0.4);
            color: #81c784;
            padding: 6px 8px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 12px;
            transition: all 0.3s;
            text-shadow: 0 0 8px rgba(129, 199, 132, 0.2);
        `;
        jumpBtn.addEventListener('mouseover', () => {
            jumpBtn.style.boxShadow = '0 0 12px rgba(129, 199, 132, 0.4)';
            jumpBtn.style.transform = 'scale(1.05)';
        });
        jumpBtn.addEventListener('mouseout', () => {
            jumpBtn.style.boxShadow = 'none';
            jumpBtn.style.transform = 'scale(1)';
        });
        utilityContainer.appendChild(jumpBtn);
        
        // Now button
        const nowBtn = document.createElement('button');
        nowBtn.id = 'time-now-btn';
        nowBtn.textContent = 'NOW';
        nowBtn.style.cssText = `
            background: linear-gradient(135deg, rgba(129, 199, 132, 0.2), rgba(129, 199, 132, 0.1));
            border: 1px solid rgba(129, 199, 132, 0.5);
            color: #81c784;
            padding: 6px 12px;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 700;
            font-size: 10px;
            transition: all 0.3s;
            text-shadow: 0 0 10px rgba(129, 199, 132, 0.3);
        `;
        nowBtn.addEventListener('mouseover', () => {
            nowBtn.style.boxShadow = '0 0 15px rgba(129, 199, 132, 0.5)';
            nowBtn.style.transform = 'scale(1.05)';
        });
        nowBtn.addEventListener('mouseout', () => {
            nowBtn.style.boxShadow = 'none';
            nowBtn.style.transform = 'scale(1)';
        });
        utilityContainer.appendChild(nowBtn);
        container.appendChild(utilityContainer);
        
        document.body.appendChild(container);
        
        // Date picker modal
        this.createDatePicker();
    }
    
    createDatePicker() {
        const modal = document.createElement('div');
        modal.id = 'date-picker-modal';
        modal.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.9);
            border: 1px solid rgba(100, 200, 255, 0.3);
            border-radius: 10px;
            padding: 20px;
            display: none;
            z-index: 2000;
            backdrop-filter: blur(10px);
        `;
        
        const title = document.createElement('h3');
        title.textContent = 'Jump to Date & Time';
        title.style.cssText = `
            color: #4fc3f7;
            margin: 0 0 15px 0;
        `;
        modal.appendChild(title);
        
        const input = document.createElement('input');
        input.id = 'date-picker-input';
        input.type = 'datetime-local';
        input.style.cssText = `
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid #4fc3f7;
            color: white;
            padding: 8px;
            border-radius: 5px;
            margin-bottom: 15px;
            width: 100%;
        `;
        modal.appendChild(input);
        
        const buttonContainer = document.createElement('div');
        buttonContainer.style.cssText = `
            display: flex;
            gap: 10px;
            justify-content: flex-end;
        `;
        
        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = 'Cancel';
        cancelBtn.style.cssText = `
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid #666;
            color: #666;
            padding: 8px 16px;
            border-radius: 5px;
            cursor: pointer;
        `;
        
        const goBtn = document.createElement('button');
        goBtn.textContent = 'Go';
        goBtn.style.cssText = `
            background: rgba(76, 195, 247, 0.2);
            border: 1px solid #4fc3f7;
            color: #4fc3f7;
            padding: 8px 16px;
            border-radius: 5px;
            cursor: pointer;
        `;
        
        buttonContainer.appendChild(cancelBtn);
        buttonContainer.appendChild(goBtn);
        modal.appendChild(buttonContainer);
        
        document.body.appendChild(modal);
        
        // Event listeners for modal
        cancelBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });
        
        goBtn.addEventListener('click', () => {
            try {
                const selectedDate = new Date(input.value);
                if (isNaN(selectedDate.getTime())) {
                    console.error('TimeControls: Invalid date selected');
                    alert('Please enter a valid date');
                    return;
                }
                this.setDate(selectedDate);
                modal.style.display = 'none';
            } catch (error) {
                console.error('TimeControls: Error parsing date:', error);
                alert('Invalid date format');
            }
        });
    }
    
    setupEventListeners() {
        // Play/Pause
        document.getElementById('time-play-pause').addEventListener('click', () => {
            this.togglePause();
        });
        
        // Time scale slider
        document.getElementById('time-scale-slider').addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            this.setTimeScaleFromSlider(value);
        });
        
        // Preset buttons
        document.querySelectorAll('.time-preset-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const preset = e.target.dataset.preset;
                this.setTimeScalePreset(preset);
            });
        });
        
        // Jump to date
        document.getElementById('time-jump-btn').addEventListener('click', () => {
            const modal = document.getElementById('date-picker-modal');
            const input = document.getElementById('date-picker-input');
            
            // Set current date as default
            const now = this.currentDate;
            const dateStr = now.toISOString().slice(0, 16);
            input.value = dateStr;
            
            modal.style.display = 'block';
        });
        
        // Now button
        document.getElementById('time-now-btn').addEventListener('click', () => {
            this.jumpToNow();
        });
    }
    
    setTimeScaleFromSlider(value) {
        // Convert slider value to time scale
        // -7 to 7, where 0 is real-time
        if (value === 0) {
            this.timeScale = 1;
        } else if (value > 0) {
            this.timeScale = Math.pow(10, value);
        } else {
            this.timeScale = -Math.pow(10, -value);
        }
        
        this.updateTimeScaleDisplay();
        
        // Track time scale change for AI insights
        if (window.dashboardController && window.dashboardController.dashboard) {
            window.dashboardController.dashboard.trackUserInteraction('time_control', {
                action: 'scale_change',
                scale: this.timeScale,
                source: 'slider',
                feature: 'time_navigation'
            });
        }
    }
    
    setTimeScalePreset(preset) {
        switch(preset) {
            case '1hr':
                this.timeScale = 3600;
                break;
            case '1day':
                this.timeScale = 86400;
                break;
            case '1mo':
                this.timeScale = 2592000;
                break;
            case '1yr':
                this.timeScale = 31536000;
                break;
        }
        
        // Update slider
        const slider = document.getElementById('time-scale-slider');
        slider.value = Math.log10(Math.abs(this.timeScale)) * Math.sign(this.timeScale);
        
        this.updateTimeScaleDisplay();
        
        // Track time preset use for AI insights
        if (window.dashboardController && window.dashboardController.dashboard) {
            window.dashboardController.dashboard.trackUserInteraction('time_control', {
                action: 'preset_change',
                preset: preset,
                scale: this.timeScale,
                feature: 'time_navigation'
            });
        }
    }
    
    updateTimeScaleDisplay() {
        const label = document.getElementById('time-scale-label');
        
        if (Math.abs(this.timeScale) === 1) {
            label.textContent = '1x';
        } else if (Math.abs(this.timeScale) < 60) {
            label.textContent = `${Math.abs(this.timeScale)}x${this.timeScale < 0 ? '←' : ''}`;
        } else if (Math.abs(this.timeScale) < 3600) {
            const minutes = Math.abs(this.timeScale) / 60;
            label.textContent = `${minutes.toFixed(0)}min${this.timeScale < 0 ? '←' : ''}`;
        } else if (Math.abs(this.timeScale) < 86400) {
            const hours = Math.abs(this.timeScale) / 3600;
            label.textContent = `${hours.toFixed(0)}hr${this.timeScale < 0 ? '←' : ''}`;
        } else if (Math.abs(this.timeScale) < 2592000) {
            const days = Math.abs(this.timeScale) / 86400;
            label.textContent = `${days.toFixed(0)}d${this.timeScale < 0 ? '←' : ''}`;
        } else {
            const years = Math.abs(this.timeScale) / 31536000;
            label.textContent = `${years.toFixed(0)}y${this.timeScale < 0 ? '←' : ''}`;
        }
    }
    
    togglePause() {
        this.isPaused = !this.isPaused;
        const btn = document.getElementById('time-play-pause');
        btn.innerHTML = this.isPaused ? '▶' : '⏸';
        
        // Track time control interaction for AI insights
        if (window.dashboardController && window.dashboardController.dashboard) {
            window.dashboardController.dashboard.trackUserInteraction('time_control', {
                action: this.isPaused ? 'pause' : 'play',
                feature: 'time_navigation'
            });
        }
    }
    
    jumpToNow() {
        this.currentDate = new Date();
        this.updateDisplay();
        
        // Track time jump for AI insights
        if (window.dashboardController && window.dashboardController.dashboard) {
            window.dashboardController.dashboard.trackUserInteraction('time_control', {
                action: 'jump_to_now',
                feature: 'time_navigation'
            });
        }
    }
    
    setDate(date) {
        this.currentDate = date;
        this.updateDisplay();
        
        // Track date jump for AI insights
        if (window.dashboardController && window.dashboardController.dashboard) {
            window.dashboardController.dashboard.trackUserInteraction('time_control', {
                action: 'jump_to_date',
                date: date.toISOString(),
                feature: 'time_navigation'
            });
        }
    }
    
    update() {
        if (!this.isPaused) {
            const now = performance.now();
            const deltaTime = (now - this.lastUpdateTime) / 1000; // Convert to seconds
            
            // Update current date based on time scale
            const msToAdd = deltaTime * this.timeScale * 1000;
            this.currentDate = new Date(this.currentDate.getTime() + msToAdd);
            
            this.lastUpdateTime = now;
            this.updateDisplay();
        } else {
            this.lastUpdateTime = performance.now();
        }
    }
    
    updateDisplay() {
        const display = document.getElementById('time-date-display');
        
        // Single compact format: MMM DD YYYY HH:MM
        const options = {
            year: 'numeric',
            month: 'short',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        };
        
        const dateStr = this.currentDate.toLocaleDateString('en-US', options);
        display.textContent = dateStr;
    }
    
    getCurrentDate() {
        return new Date(this.currentDate);
    }
    
    // Get positions for current time
    getCurrentPositions() {
        return this.ephemeris.getAllPositions(this.currentDate);
    }
}