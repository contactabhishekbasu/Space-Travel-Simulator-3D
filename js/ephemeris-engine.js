// Ephemeris Engine - Calculate real planetary positions using VSOP87 theory
class EphemerisEngine {
    constructor() {
        // Julian Date for J2000.0 epoch
        this.J2000 = 2451545.0;
        
        // Performance optimization: Caching system
        this.positionCache = new Map();
        this.cacheTimeout = 1000; // Cache for 1 second
        this.lastCalculationTime = new Map();
        
        // Batch calculation optimization
        this.calculationQueue = [];
        this.isCalculating = false;
        
        // Performance tracking
        this.calculationCount = 0;
        this.cacheHits = 0;
        
        // Orbital elements at J2000.0 epoch
        this.orbitalElements = {
            mercury: {
                a: 0.38709927,      // Semi-major axis (AU)
                e: 0.20563593,      // Eccentricity
                i: 7.00497902,      // Inclination (degrees)
                L: 252.25032350,    // Mean longitude (degrees)
                w: 77.45779628,     // Longitude of perihelion (degrees)
                omega: 48.33076593, // Longitude of ascending node (degrees)
                // Rates of change per century
                da: 0.00000037,
                de: 0.00001906,
                di: -0.00594749,
                dL: 149472.67411175,
                dw: 0.16047689,
                domega: -0.12534081
            },
            venus: {
                a: 0.72333566,
                e: 0.00677672,
                i: 3.39467605,
                L: 181.97909950,
                w: 131.60246718,
                omega: 76.67984255,
                da: 0.00000390,
                de: -0.00004107,
                di: -0.00078890,
                dL: 58517.81538729,
                dw: 0.00268329,
                domega: -0.27769418
            },
            earth: {
                a: 1.00000261,
                e: 0.01671123,
                i: -0.00001531,
                L: 100.46457166,
                w: 102.93768193,
                omega: 0.0,
                da: 0.00000562,
                de: -0.00004392,
                di: -0.01294668,
                dL: 35999.37244981,
                dw: 0.32327364,
                domega: 0.0
            },
            mars: {
                a: 1.52371034,
                e: 0.09339410,
                i: 1.84969142,
                L: -4.55343205,
                w: -23.94362959,
                omega: 49.55953891,
                da: 0.00001847,
                de: 0.00007882,
                di: -0.00813131,
                dL: 19140.30268499,
                dw: 0.44441088,
                domega: -0.29257343
            },
            jupiter: {
                a: 5.20288700,
                e: 0.04838624,
                i: 1.30439695,
                L: 34.39644051,
                w: 14.72847983,
                omega: 100.47390909,
                da: -0.00011607,
                de: -0.00013253,
                di: -0.00183714,
                dL: 3034.74612775,
                dw: 0.21252668,
                domega: 0.20469106
            },
            saturn: {
                a: 9.53667594,
                e: 0.05386179,
                i: 2.48599187,
                L: 49.95424423,
                w: 92.59887831,
                omega: 113.66242448,
                da: -0.00125060,
                de: -0.00050991,
                di: 0.00193609,
                dL: 1222.49362201,
                dw: -0.41897216,
                domega: -0.28867794
            },
            uranus: {
                a: 19.18916464,
                e: 0.04725744,
                i: 0.77263783,
                L: 313.23810451,
                w: 170.95427630,
                omega: 74.01692503,
                da: -0.00196176,
                de: -0.00004397,
                di: -0.00242939,
                dL: 428.48202785,
                dw: 0.40805281,
                domega: 0.04240589
            },
            neptune: {
                a: 30.06992276,
                e: 0.00859048,
                i: 1.77004347,
                L: -55.12002969,
                w: 44.96476227,
                omega: 131.78422574,
                da: 0.00026291,
                de: 0.00005105,
                di: 0.00035372,
                dL: 218.45945325,
                dw: -0.32241464,
                domega: -0.00508664
            }
        };
        
        // Moon orbital elements (simplified)
        this.moonElements = {
            a: 0.00257,  // Semi-major axis in AU (384,400 km)
            e: 0.0549,   // Eccentricity
            i: 5.145,    // Inclination to ecliptic
            period: 27.321661  // Orbital period in days
        };
    }
    
    // Convert date to Julian Date
    dateToJulian(date) {
        const year = date.getUTCFullYear();
        const month = date.getUTCMonth() + 1;
        const day = date.getUTCDate();
        const hour = date.getUTCHours();
        const minute = date.getUTCMinutes();
        const second = date.getUTCSeconds();
        
        const dayFraction = (hour + minute / 60 + second / 3600) / 24;
        
        let a = Math.floor((14 - month) / 12);
        let y = year + 4800 - a;
        let m = month + 12 * a - 3;
        
        let jdn = day + Math.floor((153 * m + 2) / 5) + 365 * y + 
                  Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
        
        return jdn + dayFraction;
    }
    
    // Calculate planetary position for a given date with caching
    calculatePosition(planetName, date) {
        try {
            const now = performance.now();
            const cacheKey = `${planetName}-${Math.floor(date.getTime() / this.cacheTimeout)}`;
            
            // Check cache first
            const cached = this.positionCache.get(cacheKey);
            if (cached && (now - cached.timestamp) < this.cacheTimeout) {
                this.cacheHits++;
                return cached.position;
            }
            
            const jd = this.dateToJulian(date);
            const T = (jd - this.J2000) / 36525.0; // Centuries since J2000.0
            
            const elements = this.orbitalElements[planetName];
            if (!elements) {
                if (Math.random() < 0.01) { // Log occasionally
                    console.warn('EphemerisEngine: No orbital elements for', planetName);
                }
                return null;
            }
            
            this.calculationCount++;
            
            // Log calculation for debugging (but not too frequently)
            if (Math.random() < 0.0001) { // Log ~0.01% of calculations
                console.log('EphemerisEngine: Calculating position for', planetName, 'at', date);
            }
        
        // Calculate current orbital elements
        const a = elements.a + elements.da * T;
        const e = elements.e + elements.de * T;
        const i = (elements.i + elements.di * T) * Math.PI / 180;
        const L = (elements.L + elements.dL * T) * Math.PI / 180;
        const w = (elements.w + elements.dw * T) * Math.PI / 180;
        const omega = (elements.omega + elements.domega * T) * Math.PI / 180;
        
        // Mean anomaly
        const M = L - w;
        
        // Solve Kepler's equation for eccentric anomaly (optimized)
        let E = M;
        // Reduced iterations for performance, sufficient accuracy for visualization
        const maxIterations = e > 0.1 ? 8 : 5; // Fewer iterations for low eccentricity
        for (let j = 0; j < maxIterations; j++) {
            const deltaE = (M - E + e * Math.sin(E)) / (1 - e * Math.cos(E));
            E += deltaE;
            if (Math.abs(deltaE) < 1e-8) break; // Early exit when converged
        }
        
        // True anomaly
        const v = 2 * Math.atan2(
            Math.sqrt(1 + e) * Math.sin(E / 2),
            Math.sqrt(1 - e) * Math.cos(E / 2)
        );
        
        // Distance from sun
        const r = a * (1 - e * Math.cos(E));
        
        // Position in orbital plane
        const xOrbit = r * Math.cos(v);
        const yOrbit = r * Math.sin(v);
        
        // Convert to ecliptic coordinates
        const cosOmega = Math.cos(omega);
        const sinOmega = Math.sin(omega);
        const cosI = Math.cos(i);
        const sinI = Math.sin(i);
        const cosW = Math.cos(w - omega);
        const sinW = Math.sin(w - omega);
        
        const x = (cosOmega * cosW - sinOmega * sinW * cosI) * xOrbit +
                  (-cosOmega * sinW - sinOmega * cosW * cosI) * yOrbit;
        const y = (sinOmega * cosW + cosOmega * sinW * cosI) * xOrbit +
                  (-sinOmega * sinW + cosOmega * cosW * cosI) * yOrbit;
        const z = (sinW * sinI) * xOrbit + (cosW * sinI) * yOrbit;
        
            const result = {
                x: x,
                y: y,
                z: z,
                r: r,
                v: v,
                orbitalSpeed: Math.sqrt(1 / r) // Relative orbital speed
            };
            
            // Cache the result
            this.positionCache.set(cacheKey, {
                position: result,
                timestamp: now
            });
            
            // Clean old cache entries periodically
            if (this.positionCache.size > 100) {
                this.cleanCache();
            }
            
            return result;
            
        } catch (error) {
            console.error('EphemerisEngine: Error calculating position for', planetName, ':', error);
            return null;
        }
    }
    
    // Calculate moon position relative to Earth
    calculateMoonPosition(date) {
        const jd = this.dateToJulian(date);
        const T = (jd - this.J2000) / 36525.0;
        
        // Simplified lunar theory
        const L0 = (218.316 + 13.176396 * (jd - this.J2000)) * Math.PI / 180;
        const l = (134.963 + 13.064993 * (jd - this.J2000)) * Math.PI / 180;
        const F = (93.272 + 13.229350 * (jd - this.J2000)) * Math.PI / 180;
        
        const longitude = L0 + 6.289 * Math.PI / 180 * Math.sin(l);
        const latitude = 5.128 * Math.PI / 180 * Math.sin(F);
        const distance = 385000 / 149597870.7; // Convert km to AU
        
        return {
            x: distance * Math.cos(latitude) * Math.cos(longitude),
            y: distance * Math.cos(latitude) * Math.sin(longitude),
            z: distance * Math.sin(latitude)
        };
    }
    
    // Get all planetary positions for a specific date (batch optimized)
    getAllPositions(date) {
        const positions = {};
        
        // Batch calculation for better performance
        const planetNames = Object.keys(this.orbitalElements);
        const batchSize = 3; // Process in smaller batches
        
        for (let i = 0; i < planetNames.length; i += batchSize) {
            const batch = planetNames.slice(i, i + batchSize);
            for (const planet of batch) {
                positions[planet] = this.calculatePosition(planet, date);
            }
        }
        
        // Add moon position relative to Earth
        if (positions.earth) {
            const moonPos = this.calculateMoonPosition(date);
            positions.moon = {
                x: positions.earth.x + moonPos.x,
                y: positions.earth.y + moonPos.y,
                z: positions.earth.z + moonPos.z
            };
        }
        
        return positions;
    }
    
    // Performance method to clean old cache entries
    cleanCache() {
        const now = performance.now();
        for (const [key, value] of this.positionCache.entries()) {
            if (now - value.timestamp > this.cacheTimeout * 2) {
                this.positionCache.delete(key);
            }
        }
    }
    
    // Performance statistics
    getPerformanceStats() {
        const hitRate = this.calculationCount > 0 ? 
                       (this.cacheHits / (this.cacheHits + this.calculationCount)) * 100 : 0;
        
        return {
            calculations: this.calculationCount,
            cacheHits: this.cacheHits,
            hitRate: hitRate.toFixed(2) + '%',
            cacheSize: this.positionCache.size
        };
    }
    
    // Reset performance counters
    resetPerformanceStats() {
        this.calculationCount = 0;
        this.cacheHits = 0;
        this.positionCache.clear();
    }
    
    // Calculate phase angle for proper lighting
    getPhaseAngle(planetPosition, sunPosition = {x: 0, y: 0, z: 0}) {
        const dx = planetPosition.x - sunPosition.x;
        const dy = planetPosition.y - sunPosition.y;
        const dz = planetPosition.z - sunPosition.z;
        
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
        const angle = Math.atan2(dy, dx);
        
        return { distance, angle };
    }
    
    // Get retrograde motion periods
    getRetrogradePeriods(planetName, startDate, endDate) {
        const periods = [];
        let isRetrograde = false;
        let lastLongitude = null;
        
        const msPerDay = 24 * 60 * 60 * 1000;
        const days = (endDate - startDate) / msPerDay;
        
        for (let d = 0; d <= days; d++) {
            const date = new Date(startDate.getTime() + d * msPerDay);
            const pos = this.calculatePosition(planetName, date);
            const longitude = Math.atan2(pos.y, pos.x);
            
            if (lastLongitude !== null) {
                let delta = longitude - lastLongitude;
                
                // Normalize angle difference
                if (delta > Math.PI) delta -= 2 * Math.PI;
                if (delta < -Math.PI) delta += 2 * Math.PI;
                
                const currentlyRetrograde = delta < 0;
                
                if (currentlyRetrograde !== isRetrograde) {
                    periods.push({
                        date: date,
                        entering: currentlyRetrograde
                    });
                    isRetrograde = currentlyRetrograde;
                }
            }
            
            lastLongitude = longitude;
        }
        
        return periods;
    }
}