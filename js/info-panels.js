// NASA-style information panels with comprehensive educational content
class InfoPanels {
    constructor() {
        this.currentPanel = null;
        
        try {
            this.celestialData = this.initializeCelestialData();
            console.log('InfoPanels: Celestial data initialized with', Object.keys(this.celestialData).length, 'objects');
            console.log('InfoPanels: Available objects:', Object.keys(this.celestialData));
            
            this.createPanelContainer();
            console.log('InfoPanels: Panel container created successfully');
        } catch (error) {
            console.error('InfoPanels: Error during initialization:', error);
        }
    }
    
    initializeCelestialData() {
        return {
            'The Sun': {
                type: 'Star',
                classification: 'G-type main-sequence star (G2V)',
                description: 'Our home star, a middle-aged yellow dwarf that powers all life on Earth through nuclear fusion in its core.',
                mass: '1.989 × 10³⁰ kg (333,000 × Earth)',
                diameter: '1,391,000 km (109 × Earth)',
                radius: '695,700 km',
                volume: '1.41 × 10¹⁸ km³ (1.3 million × Earth)',
                density: '1.408 g/cm³',
                surfaceGravity: '274 m/s² (28 × Earth)',
                escapeVelocity: '617.7 km/s',
                temperature: {
                    core: '15.7 million K',
                    surface: '5,778 K',
                    corona: '2 million K'
                },
                composition: {
                    hydrogen: '73.46%',
                    helium: '24.85%',
                    oxygen: '0.77%',
                    carbon: '0.29%',
                    iron: '0.16%',
                    other: '0.47%'
                },
                age: '4.6 billion years',
                luminosity: '3.828 × 10²⁶ watts',
                magneticField: '1-2 Gauss (surface), up to 3,000 Gauss (sunspots)',
                rotationPeriod: '25.05 days (equator), 34.4 days (poles)',
                distanceFromGalacticCenter: '26,660 light-years',
                orbitalPeriodAroundGalaxy: '225-250 million years',
                interestingFacts: [
                    'Contains 99.86% of the Solar System\'s mass',
                    'Produces energy through nuclear fusion, converting 600 million tons of hydrogen to helium every second',
                    'Solar wind travels at speeds of 300-800 km/s',
                    'One million Earths could fit inside the Sun',
                    'Light from the Sun takes 8 minutes 20 seconds to reach Earth'
                ],
                missions: ['Parker Solar Probe', 'Solar Orbiter', 'SOHO', 'SDO']
            },
            'Mercury': {
                type: 'Terrestrial Planet',
                classification: 'Inner rocky planet',
                description: 'The smallest and innermost planet with extreme temperature variations and the most eccentric orbit.',
                mass: '3.301 × 10²³ kg (0.055 × Earth)',
                diameter: '4,879 km (0.383 × Earth)',
                radius: '2,439.7 km',
                volume: '6.083 × 10¹⁰ km³',
                density: '5.427 g/cm³',
                surfaceGravity: '3.7 m/s²',
                escapeVelocity: '4.25 km/s',
                temperature: {
                    day: '430°C (800°F)',
                    night: '-180°C (-290°F)',
                    average: '167°C (332°F)'
                },
                atmosphere: 'Exosphere - O₂ (42%), Na (29%), H₂ (22%), He (6%), K (0.5%)',
                magneticField: '1% of Earth\'s strength',
                moons: 0,
                rings: false,
                orbitalPeriod: '88 Earth days',
                rotationPeriod: '59 Earth days',
                distanceFromSun: {
                    average: '57.9 million km (0.39 AU)',
                    perihelion: '46 million km',
                    aphelion: '69.8 million km'
                },
                orbitalEccentricity: 0.205,
                axialTilt: '0.034°',
                interestingFacts: [
                    'Smallest planet in the Solar System',
                    'Has the most eccentric orbit of all planets',
                    'Surface is heavily cratered like the Moon',
                    'Has water ice in permanently shadowed polar craters',
                    'Experiences the greatest temperature variation in the Solar System'
                ],
                missions: ['MESSENGER', 'BepiColombo', 'Mariner 10']
            },
            'Venus': {
                type: 'Terrestrial Planet',
                classification: 'Inner rocky planet',
                description: 'Earth\'s "sister planet" with a runaway greenhouse effect making it the hottest planet in the Solar System.',
                mass: '4.867 × 10²⁴ kg (0.815 × Earth)',
                diameter: '12,104 km (0.949 × Earth)',
                radius: '6,051.8 km',
                volume: '9.284 × 10¹¹ km³',
                density: '5.243 g/cm³',
                surfaceGravity: '8.87 m/s²',
                escapeVelocity: '10.36 km/s',
                temperature: {
                    surface: '462°C (864°F)',
                    clouds: '-45°C (-49°F)'
                },
                atmosphere: 'CO₂ (96.5%), N₂ (3.5%), SO₂, H₂O, CO, He, Ne',
                atmosphericPressure: '92 bar (92 × Earth)',
                clouds: 'Sulfuric acid droplets',
                magneticField: 'No intrinsic field',
                moons: 0,
                rings: false,
                orbitalPeriod: '224.7 Earth days',
                rotationPeriod: '243 Earth days (retrograde)',
                distanceFromSun: {
                    average: '108.2 million km (0.72 AU)',
                    perihelion: '107.5 million km',
                    aphelion: '108.9 million km'
                },
                orbitalEccentricity: 0.007,
                axialTilt: '177.4° (retrograde)',
                interestingFacts: [
                    'Hottest planet in the Solar System due to greenhouse effect',
                    'Rotates backwards (retrograde) compared to most planets',
                    'A day on Venus is longer than its year',
                    'Surface pressure would crush most spacecraft in minutes',
                    'Often called Earth\'s "sister planet" due to similar size'
                ],
                missions: ['Magellan', 'Venus Express', 'Akatsuki', 'Venera series']
            },
            'Earth': {
                type: 'Terrestrial Planet',
                classification: 'Inner rocky planet',
                description: 'Our blue marble home, the only known planet with life, protected by a magnetic field and blessed with liquid water.',
                mass: '5.972 × 10²⁴ kg',
                diameter: '12,742 km',
                radius: '6,371 km',
                volume: '1.083 × 10¹² km³',
                density: '5.514 g/cm³',
                surfaceGravity: '9.807 m/s²',
                escapeVelocity: '11.186 km/s',
                temperature: {
                    average: '15°C (59°F)',
                    highest: '56.7°C (134°F)',
                    lowest: '-89.2°C (-128.6°F)'
                },
                atmosphere: 'N₂ (78.08%), O₂ (20.95%), Ar (0.93%), CO₂ (0.04%)',
                atmosphericPressure: '1 bar (sea level)',
                water: '71% surface coverage',
                magneticField: '25-65 μT',
                moons: 1,
                naturalSatellites: ['Moon'],
                artificialSatellites: '~4,500 active',
                rings: false,
                orbitalPeriod: '365.256 days',
                rotationPeriod: '23.934 hours',
                distanceFromSun: {
                    average: '149.6 million km (1 AU)',
                    perihelion: '147.1 million km',
                    aphelion: '152.1 million km'
                },
                orbitalEccentricity: 0.017,
                axialTilt: '23.44°',
                interestingFacts: [
                    'Only known planet with life',
                    'Largest terrestrial planet in the Solar System',
                    'Plate tectonics continuously reshape the surface',
                    'Protected by a strong magnetic field from solar radiation',
                    'Home to over 8.7 million species'
                ],
                geologicalFeatures: ['Oceans', 'Continents', 'Mountain ranges', 'Volcanoes', 'Tectonic plates']
            },
            'Moon': {
                type: 'Natural Satellite',
                classification: 'Earth\'s moon',
                description: 'Earth\'s only natural satellite, responsible for tides and stabilizing our planet\'s axial tilt.',
                parent: 'Earth',
                mass: '7.342 × 10²² kg (0.0123 × Earth)',
                diameter: '3,474.8 km (0.273 × Earth)',
                radius: '1,737.4 km',
                volume: '2.196 × 10¹⁰ km³',
                density: '3.344 g/cm³',
                surfaceGravity: '1.62 m/s²',
                escapeVelocity: '2.38 km/s',
                temperature: {
                    day: '127°C (260°F)',
                    night: '-173°C (-280°F)',
                    average: '-23°C (-9°F)'
                },
                atmosphere: 'Trace exosphere',
                synchronousRotation: true,
                orbitalPeriod: '27.321 days',
                rotationPeriod: '27.321 days',
                distanceFromEarth: {
                    average: '384,400 km',
                    perigee: '356,500 km',
                    apogee: '406,700 km'
                },
                orbitalEccentricity: 0.0549,
                inclination: '5.145° to ecliptic',
                interestingFacts: [
                    'Formed 4.5 billion years ago from debris after Earth impact',
                    'Gradually moving away from Earth at 3.8 cm per year',
                    'Causes Earth\'s tides through gravitational pull',
                    'Always shows the same face to Earth (tidal locking)',
                    'Has water ice in permanently shadowed polar craters'
                ],
                missions: ['Apollo program', 'Luna program', 'Chang\'e program', 'Artemis program']
            },
            'Mars': {
                type: 'Terrestrial Planet',
                classification: 'Inner rocky planet',
                description: 'The "Red Planet" with evidence of ancient water flows and the target for future human exploration.',
                mass: '6.417 × 10²³ kg (0.107 × Earth)',
                diameter: '6,779 km (0.532 × Earth)',
                radius: '3,389.5 km',
                volume: '1.631 × 10¹¹ km³',
                density: '3.933 g/cm³',
                surfaceGravity: '3.71 m/s²',
                escapeVelocity: '5.03 km/s',
                temperature: {
                    average: '-63°C (-81°F)',
                    summer: '20°C (68°F)',
                    winter: '-143°C (-225°F)'
                },
                atmosphere: 'CO₂ (95.3%), N₂ (2.7%), Ar (1.6%), O₂ (0.13%)',
                atmosphericPressure: '0.006 bar',
                water: 'Frozen at poles, possible liquid brine flows',
                magneticField: 'No global field, localized crustal fields',
                moons: 2,
                naturalSatellites: ['Phobos', 'Deimos'],
                rings: false,
                orbitalPeriod: '687 Earth days',
                rotationPeriod: '24.623 hours',
                distanceFromSun: {
                    average: '227.9 million km (1.52 AU)',
                    perihelion: '206.6 million km',
                    aphelion: '249.2 million km'
                },
                orbitalEccentricity: 0.094,
                axialTilt: '25.19°',
                interestingFacts: [
                    'Has the largest volcano in the Solar System (Olympus Mons)',
                    'Has the deepest canyon in the Solar System (Valles Marineris)',
                    'Evidence suggests it once had rivers, lakes, and possibly oceans',
                    'Dust storms can engulf the entire planet',
                    'Has seasons similar to Earth due to axial tilt'
                ],
                missions: ['Perseverance', 'Curiosity', 'InSight', 'Mars Reconnaissance Orbiter']
            },
            'Jupiter': {
                type: 'Gas Giant',
                classification: 'Outer planet',
                description: 'The largest planet, a gas giant with a Great Red Spot storm and 95+ moons including the four Galilean satellites.',
                mass: '1.898 × 10²⁷ kg (317.8 × Earth)',
                diameter: '139,820 km (10.97 × Earth)',
                radius: '69,911 km',
                volume: '1.431 × 10¹⁵ km³',
                density: '1.326 g/cm³',
                surfaceGravity: '24.79 m/s²',
                escapeVelocity: '59.5 km/s',
                temperature: {
                    cloudTop: '-108°C (-162°F)',
                    core: '20,000°C (36,000°F)'
                },
                atmosphere: 'H₂ (89.8%), He (10.2%), CH₄, NH₃, HD, C₂H₆',
                composition: {
                    hydrogen: '~75%',
                    helium: '~24%',
                    other: '~1%'
                },
                magneticField: '20,000× Earth\'s strength',
                moons: 95,
                majorMoons: ['Io', 'Europa', 'Ganymede', 'Callisto'],
                rings: 'Faint ring system',
                orbitalPeriod: '11.86 Earth years',
                rotationPeriod: '9.925 hours',
                distanceFromSun: {
                    average: '778.5 million km (5.20 AU)',
                    perihelion: '740.5 million km',
                    aphelion: '816.6 million km'
                },
                orbitalEccentricity: 0.049,
                axialTilt: '3.13°',
                interestingFacts: [
                    'Largest planet in the Solar System',
                    'Has a Great Red Spot storm larger than Earth',
                    'Acts as a "vacuum cleaner" protecting inner planets from asteroids',
                    'Emits more heat than it receives from the Sun',
                    'Has at least 95 known moons'
                ],
                missions: ['Juno', 'Galileo', 'Voyager 1 & 2', 'Pioneer 10 & 11']
            },
            'Saturn': {
                type: 'Gas Giant',
                classification: 'Outer planet',
                description: 'Famous for its rings made of ice and rock. Less dense than water. 82+ moons including Titan with thick atmosphere.',
                mass: '5.683 × 10²⁶ kg (95.16 × Earth)',
                diameter: '116,460 km (9.14 × Earth)',
                radius: '58,232 km',
                volume: '8.271 × 10¹⁴ km³',
                density: '0.687 g/cm³ (less than water)',
                surfaceGravity: '10.44 m/s²',
                escapeVelocity: '35.5 km/s',
                temperature: {
                    cloudTop: '-139°C (-218°F)',
                    core: '11,700°C (21,000°F)'
                },
                atmosphere: 'H₂ (96.3%), He (3.25%), CH₄, NH₃, HD, C₂H₆',
                composition: {
                    hydrogen: '~75%',
                    helium: '~25%',
                    other: 'trace'
                },
                magneticField: '580× Earth\'s strength',
                moons: 146,
                majorMoons: ['Titan', 'Rhea', 'Iapetus', 'Dione', 'Tethys', 'Enceladus', 'Mimas'],
                rings: 'Prominent ring system with 7 main groups',
                ringComposition: 'Water ice (93-99%), rocky material',
                orbitalPeriod: '29.46 Earth years',
                rotationPeriod: '10.656 hours',
                distanceFromSun: {
                    average: '1.432 billion km (9.58 AU)',
                    perihelion: '1.353 billion km',
                    aphelion: '1.515 billion km'
                },
                orbitalEccentricity: 0.057,
                axialTilt: '26.73°',
                interestingFacts: [
                    'Could float in water due to low density',
                    'Ring system is made of billions of ice and rock particles',
                    'Titan has a thick atmosphere and liquid methane lakes',
                    'Enceladus has geysers shooting water into space',
                    'Hexagonal storm at north pole'
                ],
                missions: ['Cassini-Huygens', 'Voyager 1 & 2', 'Pioneer 11']
            },
            'Uranus': {
                type: 'Ice Giant',
                classification: 'Outer planet',
                description: 'The tilted ice giant that rotates on its side, with a faint ring system and 27 known moons.',
                mass: '8.681 × 10²⁵ kg (14.54 × Earth)',
                diameter: '50,724 km (3.98 × Earth)',
                radius: '25,362 km',
                volume: '6.833 × 10¹³ km³',
                density: '1.271 g/cm³',
                surfaceGravity: '8.87 m/s²',
                escapeVelocity: '21.3 km/s',
                temperature: {
                    cloudTop: '-197°C (-323°F)',
                    core: '5,000°C (9,000°F)'
                },
                atmosphere: 'H₂ (82.5%), He (15.2%), CH₄ (2.3%)',
                composition: {
                    water: '~60%',
                    methane: '~15%',
                    ammonia: '~15%',
                    rock: '~10%'
                },
                magneticField: 'Tilted 59° from rotation axis',
                moons: 27,
                majorMoons: ['Titania', 'Oberon', 'Umbriel', 'Ariel', 'Miranda'],
                rings: '13 known rings',
                orbitalPeriod: '84.01 Earth years',
                rotationPeriod: '17.24 hours (retrograde)',
                distanceFromSun: {
                    average: '2.867 billion km (19.2 AU)',
                    perihelion: '2.742 billion km',
                    aphelion: '3.004 billion km'
                },
                orbitalEccentricity: 0.046,
                axialTilt: '97.77° (sideways)',
                interestingFacts: [
                    'Rotates on its side, possibly due to ancient collision',
                    'Has the coldest planetary atmosphere in Solar System',
                    'Discovered by William Herschel in 1781',
                    'Only visited by Voyager 2 in 1986',
                    'Has a faint ring system discovered in 1977'
                ],
                missions: ['Voyager 2']
            },
            'Neptune': {
                type: 'Ice Giant',
                classification: 'Outer planet',
                description: 'The windiest planet with supersonic winds and a backwards-orbiting moon Triton, likely a captured Kuiper Belt object.',
                mass: '1.024 × 10²⁶ kg (17.15 × Earth)',
                diameter: '49,244 km (3.86 × Earth)',
                radius: '24,622 km',
                volume: '6.254 × 10¹³ km³',
                density: '1.638 g/cm³',
                surfaceGravity: '11.15 m/s²',
                escapeVelocity: '23.5 km/s',
                temperature: {
                    cloudTop: '-201°C (-330°F)',
                    core: '5,400°C (9,800°F)'
                },
                atmosphere: 'H₂ (80%), He (19%), CH₄ (1%)',
                composition: {
                    water: '~60%',
                    methane: '~15%',
                    ammonia: '~15%',
                    rock: '~10%'
                },
                winds: 'Fastest in Solar System up to 2,100 km/h',
                magneticField: 'Tilted 47° from rotation axis',
                moons: 16,
                majorMoons: ['Triton', 'Nereid', 'Proteus'],
                rings: '5 main rings',
                orbitalPeriod: '164.79 Earth years',
                rotationPeriod: '16.11 hours',
                distanceFromSun: {
                    average: '4.495 billion km (30.05 AU)',
                    perihelion: '4.444 billion km',
                    aphelion: '4.546 billion km'
                },
                orbitalEccentricity: 0.011,
                axialTilt: '28.32°',
                interestingFacts: [
                    'Windiest planet with speeds up to 2,100 km/h',
                    'Discovered mathematically before being seen',
                    'Triton orbits backwards and is likely a captured Kuiper Belt object',
                    'Has a Great Dark Spot similar to Jupiter\'s Red Spot',
                    'Emits more heat than it receives from the Sun'
                ],
                missions: ['Voyager 2']
            },
            'Sagittarius A*': {
                type: 'Supermassive Black Hole',
                classification: 'Galactic center',
                description: 'The supermassive black hole at the center of our Milky Way galaxy, first imaged by the Event Horizon Telescope.',
                mass: '4.154 × 10⁶ solar masses',
                schwarzschildRadius: '12.3 million km',
                eventHorizon: '24.6 million km diameter',
                angularSize: '52 microarcseconds (from Earth)',
                distanceFromEarth: '26,670 light-years',
                rotationRate: 'Near maximum (a = 0.9 - 0.95)',
                accretionDisk: {
                    temperature: 'Millions of degrees K',
                    luminosity: 'Variable, relatively low',
                    size: '~1 AU'
                },
                surroundingStars: {
                    S2: 'Orbital period: 16.05 years',
                    S0_2: 'Closest approach: 120 AU',
                    count: '~40 known S-stars'
                },
                discoveryMethod: 'Radio observations and stellar orbits',
                nobelPrize: '2020 Physics (Genzel & Ghez)',
                interestingFacts: [
                    'First image captured by Event Horizon Telescope in 2022',
                    'Stars orbit at speeds up to 8,000 km/s near it',
                    'Relatively quiet compared to other galactic black holes',
                    'Surrounded by a cluster of millions of stars',
                    'Key evidence for existence of supermassive black holes'
                ],
                research: ['Event Horizon Telescope', 'Keck Observatory', 'VLT', 'Chandra X-ray']
            }
        };
    }
    
    createPanelContainer() {
        const container = document.createElement('div');
        container.id = 'info-panel-container';
        container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            width: 550px;
            max-width: 40vw;
            max-height: 80vh;
            background: linear-gradient(135deg, rgba(15, 23, 42, 0.98) 0%, rgba(30, 41, 59, 0.95) 100%);
            border: 1px solid rgba(100, 116, 139, 0.4);
            border-radius: 20px;
            padding: 0;
            color: white;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            display: none;
            backdrop-filter: blur(20px);
            box-shadow: 0 10px 50px rgba(0, 0, 0, 0.7), 
                        0 0 100px rgba(99, 102, 241, 0.1),
                        inset 0 0 60px rgba(99, 102, 241, 0.03);
            overflow: hidden;
            z-index: 1000;
        `;
        document.body.appendChild(container);
        this.container = container;
    }
    
    showPlanetInfo(planetData) {
        try {
            console.log('================== InfoPanels Debug ==================');
            console.log('InfoPanels: Showing planet info for:', planetData.name);
            console.log('InfoPanels: planetData keys:', Object.keys(planetData));
            console.log('InfoPanels: planetData.mass:', planetData.mass);
            console.log('InfoPanels: planetData.diameter:', planetData.diameter);
            console.log('InfoPanels: planetData.temperature:', planetData.temperature);
            
            // Get comprehensive data from our database - try exact match first, then case variations
            let data = this.celestialData[planetData.name] || {};
            
            // If no exact match, try case-insensitive search
            if (Object.keys(data).length === 0) {
                const nameVariations = [
                    planetData.name,
                    planetData.name.toLowerCase(),
                    planetData.name.toUpperCase(),
                    planetData.name.charAt(0).toUpperCase() + planetData.name.slice(1).toLowerCase()
                ];
                
                for (const variant of nameVariations) {
                    if (this.celestialData[variant]) {
                        data = this.celestialData[variant];
                        console.log('InfoPanels: Found data using variant:', variant);
                        break;
                    }
                }
            }
            
            console.log('InfoPanels: Found celestialData:', Object.keys(data).length > 0 ? 'YES' : 'NO', 'keys:', Object.keys(data).length);
            
            // Create merged data, prioritizing InfoPanels data but keeping planetData as fallback
            const mergedData = { ...planetData, ...data };
            console.log('InfoPanels: MergedData keys:', Object.keys(mergedData));
            
            // If we didn't find data by exact name match, but we have planetData properties,
            // ensure we at least use the basic info from celestialBodies
            if (Object.keys(data).length === 0 && planetData.info) {
                console.log('InfoPanels: No exact match found, using planetData properties');
                // Use the info field as description if we don't have one
                if (!mergedData.description && planetData.info) {
                    mergedData.description = planetData.info;
                }
                // Create interesting facts from available data
                if (!mergedData.interestingFacts) {
                    mergedData.interestingFacts = [];
                    if (planetData.educational) {
                        mergedData.interestingFacts.push(planetData.educational);
                    }
                    if (planetData.temperature) {
                        mergedData.interestingFacts.push(`Temperature: ${planetData.temperature}`);
                    }
                    if (planetData.orbitalPeriod) {
                        mergedData.interestingFacts.push(`Orbital period: ${planetData.orbitalPeriod}`);
                    }
                }
            }
            
            // Map gravity to surfaceGravity if needed
            if (!mergedData.surfaceGravity && planetData.gravity) {
                mergedData.surfaceGravity = planetData.gravity;
            }
            
            // Ensure we have the name property
            if (!mergedData.name && planetData.name) {
                mergedData.name = planetData.name;
            }
            
            if (!mergedData.name) {
                console.warn('InfoPanels: No name provided for planet data');
                return;
            }
            
            // Ensure we have a type
            if (!mergedData.type && planetData.type) {
                mergedData.type = planetData.type;
            } else if (!mergedData.type) {
                // Guess the type based on the name
                if (mergedData.name.includes('Sun')) {
                    mergedData.type = 'Star';
                } else if (mergedData.name === 'Moon') {
                    mergedData.type = 'Natural Satellite';
                } else if (mergedData.name.includes('Sagittarius')) {
                    mergedData.type = 'Black Hole';
                } else {
                    mergedData.type = 'Planet';
                }
            }
            
            console.log('InfoPanels: Data from celestialData:', Object.keys(data).length, 'properties');
            console.log('InfoPanels: Merged data contains', Object.keys(mergedData).length, 'properties');
            console.log('InfoPanels: Sample merged data properties:', {
                name: mergedData.name,
                type: mergedData.type,
                mass: mergedData.mass,
                diameter: mergedData.diameter,
                hasDescription: !!mergedData.description,
                hasInterestingFacts: !!mergedData.interestingFacts,
                surfaceGravity: mergedData.surfaceGravity,
                escapeVelocity: mergedData.escapeVelocity,
                composition: mergedData.composition,
                atmosphere: mergedData.atmosphere,
                orbitalPeriod: mergedData.orbitalPeriod,
                missions: mergedData.missions
            });
            console.log('InfoPanels: Full merged data:', mergedData);
            
            // Create tabs for different categories
            const tabId = Math.random().toString(36).substr(2, 9);
            console.log('InfoPanels: Generated tab ID:', tabId);
            
            // Build the overview content - simplified approach
            let overviewContent = '';
            const desc = mergedData.description || mergedData.info || 'No description available';
            overviewContent = `
                <div style="
                    background: linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(34, 197, 94, 0.1) 100%);
                    border: 1px solid rgba(99, 102, 241, 0.2);
                    border-radius: 12px;
                    padding: 20px;
                    margin-bottom: 25px;
                ">
                    <h3 style="color: #60a5fa; font-size: 16px; margin: 0 0 10px 0; font-weight: 500;">
                        About ${mergedData.name || 'Unknown'}
                    </h3>
                    <p style="color: #e0e7ff; line-height: 1.7; margin: 0; font-size: 15px;">
                        ${desc}
                    </p>
                </div>
            `;
            
            // Build key facts - simplified
            let keyFactsContent = '';
            let factsHtml = '';
            
            // Always show these facts if they exist
            if (mergedData.mass) {
                factsHtml += `
                    <div style="display: flex; justify-content: space-between; padding: 8px; background: rgba(99, 102, 241, 0.05); border-radius: 6px; margin-bottom: 5px;">
                        <span style="color: #cbd5e1; font-size: 12px;">Mass</span>
                        <span style="color: #f0f9ff; font-weight: 500; font-size: 12px;">${mergedData.mass}</span>
                    </div>`;
            }
            
            if (mergedData.diameter) {
                factsHtml += `
                    <div style="display: flex; justify-content: space-between; padding: 8px; background: rgba(99, 102, 241, 0.05); border-radius: 6px; margin-bottom: 5px;">
                        <span style="color: #cbd5e1; font-size: 12px;">Diameter</span>
                        <span style="color: #f0f9ff; font-weight: 500; font-size: 12px;">${mergedData.diameter}</span>
                    </div>`;
            }
            
            if (mergedData.temperature) {
                const tempValue = typeof mergedData.temperature === 'object' ? 
                    (mergedData.temperature.average || mergedData.temperature.surface || Object.values(mergedData.temperature)[0]) : 
                    mergedData.temperature;
                factsHtml += `
                    <div style="display: flex; justify-content: space-between; padding: 8px; background: rgba(99, 102, 241, 0.05); border-radius: 6px; margin-bottom: 5px;">
                        <span style="color: #cbd5e1; font-size: 12px;">Temperature</span>
                        <span style="color: #f0f9ff; font-weight: 500; font-size: 12px;">${tempValue}</span>
                    </div>`;
            }
            
            if (mergedData.moons !== undefined && mergedData.moons !== null) {
                factsHtml += `
                    <div style="display: flex; justify-content: space-between; padding: 8px; background: rgba(99, 102, 241, 0.05); border-radius: 6px; margin-bottom: 5px;">
                        <span style="color: #cbd5e1; font-size: 12px;">Moons</span>
                        <span style="color: #f0f9ff; font-weight: 500; font-size: 12px;">${mergedData.moons}</span>
                    </div>`;
            }
            
            // Always create the key facts section, even if empty
            keyFactsContent = `
                <div style="margin-top: 20px;">
                    <h3 style="color: #60a5fa; font-size: 16px; margin: 0 0 15px 0; font-weight: 500;">
                        Key Facts
                    </h3>
                    <div style="display: flex; flex-direction: column; gap: 8px;">
                        ${factsHtml || '<p style="color: #94a3b8;">No key facts available</p>'}
                    </div>
                </div>
            `;
            
            // Build interesting facts - simplified
            let interestingFactsContent = '';
            const facts = mergedData.interestingFacts || [];
            
            // If no interesting facts, try to create some from available data
            if (facts.length === 0 && mergedData.educational) {
                facts.push(mergedData.educational);
            }
            
            if (facts.length > 0) {
                const factsItems = facts.slice(0, 3).map(fact => 
                    `<li style="color: #e0e7ff; line-height: 1.4; font-size: 13px;">${fact}</li>`
                ).join('');
                
                interestingFactsContent = `
                    <div style="margin-top: 20px;">
                        <h3 style="color: #60a5fa; font-size: 16px; margin: 0 0 10px 0; font-weight: 500;">
                            Interesting Facts
                        </h3>
                        <ul style="margin: 0; padding-left: 16px; display: flex; flex-direction: column; gap: 6px;">
                            ${factsItems}
                        </ul>
                    </div>
                `;
            }
            
            console.log('Content built - overview length:', overviewContent.length, 'keyFacts length:', keyFactsContent.length);
            console.log('Overview content preview:', overviewContent.substring(0, 200));
            console.log('Key facts content preview:', keyFactsContent.substring(0, 200));
            
            // Now build the complete panel HTML using the prepared content
            let panelHTML = `
            <div class="info-panel-header" style="
                padding: 20px 20px 15px;
                background: linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, transparent 100%);
                border-bottom: 1px solid rgba(100, 116, 139, 0.3);
            ">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <h2 style="margin: 0; color: #f0f9ff; font-size: 24px; font-weight: 300; letter-spacing: -0.5px;">
                            ${mergedData.name}
                        </h2>
                        <div style="display: flex; gap: 15px; margin-top: 8px;">
                            <span style="color: #6366f1; font-size: 14px; font-weight: 500;">
                                ${mergedData.type || 'Celestial Object'}
                            </span>
                            ${mergedData.classification ? `
                            <span style="color: #94a3b8; font-size: 14px;">
                                ${mergedData.classification}
                            </span>
                            ` : ''}
                        </div>
                    </div>
                    <button onclick="window.infoPanels.hide()" style="
                        background: rgba(239, 68, 68, 0.1);
                        border: 1px solid rgba(239, 68, 68, 0.3);
                        color: #fca5a5;
                        padding: 8px 16px;
                        border-radius: 8px;
                        cursor: pointer;
                        font-size: 14px;
                        transition: all 0.2s;
                    " onmouseover="this.style.background='rgba(239, 68, 68, 0.2)'" 
                       onmouseout="this.style.background='rgba(239, 68, 68, 0.1)'">
                        ✕
                    </button>
                </div>
            </div>
            
            <!-- Tabs Navigation -->
            <div class="tabs-nav" style="
                display: flex;
                gap: 1px;
                padding: 0 20px;
                background: rgba(30, 41, 59, 0.5);
                border-bottom: 1px solid rgba(100, 116, 139, 0.3);
            ">
                <button class="tab-button active" onclick="window.infoPanels.switchTab('${tabId}', 'overview')" style="
                    background: transparent;
                    border: none;
                    color: #e0e7ff;
                    padding: 12px 16px;
                    cursor: pointer;
                    font-size: 12px;
                    font-weight: 500;
                    position: relative;
                    transition: all 0.2s;
                " data-tab="overview">
                    Overview
                </button>
                <button class="tab-button" onclick="window.infoPanels.switchTab('${tabId}', 'physical')" style="
                    background: transparent;
                    border: none;
                    color: #94a3b8;
                    padding: 12px 16px;
                    cursor: pointer;
                    font-size: 12px;
                    font-weight: 500;
                    position: relative;
                    transition: all 0.2s;
                " data-tab="physical">
                    Physical
                </button>
                <button class="tab-button" onclick="window.infoPanels.switchTab('${tabId}', 'orbital')" style="
                    background: transparent;
                    border: none;
                    color: #94a3b8;
                    padding: 12px 16px;
                    cursor: pointer;
                    font-size: 12px;
                    font-weight: 500;
                    position: relative;
                    transition: all 0.2s;
                " data-tab="orbital">
                    Orbital
                </button>
                <button class="tab-button" onclick="window.infoPanels.switchTab('${tabId}', 'atmosphere')" style="
                    background: transparent;
                    border: none;
                    color: #94a3b8;
                    padding: 12px 16px;
                    cursor: pointer;
                    font-size: 12px;
                    font-weight: 500;
                    position: relative;
                    transition: all 0.2s;
                " data-tab="atmosphere">
                    Climate
                </button>
                <button class="tab-button" onclick="window.infoPanels.switchTab('${tabId}', 'exploration')" style="
                    background: transparent;
                    border: none;
                    color: #94a3b8;
                    padding: 12px 16px;
                    cursor: pointer;
                    font-size: 12px;
                    font-weight: 500;
                    position: relative;
                    transition: all 0.2s;
                " data-tab="exploration">
                    Missions
                </button>
            </div>
            
            <!-- Tab Content -->
            <div class="tab-content" style="
                padding: 20px;
                max-height: 400px;
                overflow-y: auto;
            " data-tab-id="${tabId}">
                <!-- Overview Tab -->
                <div class="tab-panel active" data-panel="overview">
                    ${overviewContent}
                    ${keyFactsContent}
                    ${interestingFactsContent}
                </div>
                
                <!-- Physical Properties Tab -->
                <div class="tab-panel" data-panel="physical" style="display: none;">
                    <h3 style="color: #60a5fa; font-size: 18px; margin: 0 0 20px 0;">Physical Properties</h3>
                    <div style="display: flex; flex-direction: column; gap: 20px;">
                        <div style="background: rgba(30, 41, 59, 0.3); border: 1px solid rgba(100, 116, 139, 0.2); border-radius: 12px; padding: 20px;">
                            <h4 style="color: #60a5fa; font-size: 14px; margin: 0 0 15px 0;">Size & Mass</h4>
                            ${mergedData.mass ? `<p style="color: #e0e7ff; margin: 5px 0;"><strong>Mass:</strong> ${mergedData.mass}</p>` : ''}
                            ${mergedData.diameter ? `<p style="color: #e0e7ff; margin: 5px 0;"><strong>Diameter:</strong> ${mergedData.diameter}</p>` : ''}
                            ${mergedData.radius ? `<p style="color: #e0e7ff; margin: 5px 0;"><strong>Radius:</strong> ${mergedData.radius}</p>` : ''}
                            ${mergedData.volume ? `<p style="color: #e0e7ff; margin: 5px 0;"><strong>Volume:</strong> ${mergedData.volume}</p>` : ''}
                            ${mergedData.density ? `<p style="color: #e0e7ff; margin: 5px 0;"><strong>Density:</strong> ${mergedData.density}</p>` : ''}
                        </div>
                        <div style="background: rgba(30, 41, 59, 0.3); border: 1px solid rgba(100, 116, 139, 0.2); border-radius: 12px; padding: 20px;">
                            <h4 style="color: #60a5fa; font-size: 14px; margin: 0 0 15px 0;">Gravity & Motion</h4>
                            ${mergedData.surfaceGravity || mergedData.gravity ? `<p style="color: #e0e7ff; margin: 5px 0;"><strong>Surface Gravity:</strong> ${mergedData.surfaceGravity || mergedData.gravity}</p>` : ''}
                            ${mergedData.escapeVelocity ? `<p style="color: #e0e7ff; margin: 5px 0;"><strong>Escape Velocity:</strong> ${mergedData.escapeVelocity}</p>` : ''}
                            ${mergedData.rotationPeriod ? `<p style="color: #e0e7ff; margin: 5px 0;"><strong>Rotation Period:</strong> ${mergedData.rotationPeriod}</p>` : ''}
                            ${mergedData.axialTilt ? `<p style="color: #e0e7ff; margin: 5px 0;"><strong>Axial Tilt:</strong> ${mergedData.axialTilt}</p>` : ''}
                        </div>
                    </div>
                </div>
                
                <!-- Orbital Mechanics Tab -->
                <div class="tab-panel" data-panel="orbital" style="display: none;">
                    <h3 style="color: #60a5fa; font-size: 18px; margin: 0 0 20px 0;">Orbital Mechanics</h3>
                    <div style="display: flex; flex-direction: column; gap: 20px;">
                        ${this.createDataCard('Orbital Parameters', [
                            { label: 'Orbital Period', value: mergedData.orbitalPeriod },
                            { label: 'Average Distance', value: mergedData.distanceFromSun?.average || mergedData.distanceFromEarth?.average || mergedData.distanceFromSun },
                            { label: 'Perihelion', value: mergedData.distanceFromSun?.perihelion || mergedData.distanceFromEarth?.perigee },
                            { label: 'Aphelion', value: mergedData.distanceFromSun?.aphelion || mergedData.distanceFromEarth?.apogee },
                            { label: 'Eccentricity', value: mergedData.orbitalEccentricity },
                            { label: 'Inclination', value: mergedData.inclination }
                        ])}
                        ${mergedData.majorMoons || mergedData.naturalSatellites ? 
                        this.createDataCard('Natural Satellites', 
                            (mergedData.majorMoons || mergedData.naturalSatellites || []).map(moon => ({
                                label: 'Moon',
                                value: moon
                            }))
                        ) : ''}
                    </div>
                </div>
                
                <!-- Atmosphere & Climate Tab -->
                <div class="tab-panel" data-panel="atmosphere" style="display: none;">
                    <h3 style="color: #60a5fa; font-size: 18px; margin: 0 0 20px 0;">Atmosphere & Climate</h3>
                    <div style="display: flex; flex-direction: column; gap: 20px;">
                        ${this.createDataCard('Atmospheric Composition', [
                            { label: 'Composition', value: mergedData.atmosphere },
                            { label: 'Pressure', value: mergedData.atmosphericPressure },
                            { label: 'Clouds', value: mergedData.clouds },
                            { label: 'Magnetic Field', value: mergedData.magneticField }
                        ])}
                        ${this.createDataCard('Temperature Ranges', 
                            mergedData.temperature ? (
                                typeof mergedData.temperature === 'object' ?
                                Object.entries(mergedData.temperature).map(([key, value]) => ({
                                    label: key.charAt(0).toUpperCase() + key.slice(1),
                                    value: value
                                })) :
                                [{ label: 'Temperature', value: mergedData.temperature }]
                            ) : []
                        )}
                    </div>
                </div>
                
                <!-- Exploration Tab -->
                <div class="tab-panel" data-panel="exploration" style="display: none;">
                    <h3 style="color: #60a5fa; font-size: 18px; margin: 0 0 20px 0;">Exploration & Missions</h3>
                    ${mergedData.missions ? `
                    <div>
                        <h3 style="color: #60a5fa; font-size: 18px; margin: 0 0 15px 0; font-weight: 500;">
                            Space Missions
                        </h3>
                        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px;">
                            ${mergedData.missions.map(mission => `
                                <div style="
                                    padding: 12px;
                                    background: rgba(99, 102, 241, 0.1);
                                    border: 1px solid rgba(99, 102, 241, 0.2);
                                    border-radius: 8px;
                                    color: #e0e7ff;
                                ">
                                    ${mission}
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    ` : '<p style="color: #94a3b8;">No mission data available</p>'}
                    
                    ${mergedData.research ? `
                    <div style="margin-top: 20px;">
                        <h3 style="color: #60a5fa; font-size: 18px; margin: 0 0 15px 0; font-weight: 500;">
                            Research Facilities
                        </h3>
                        <div style="display: flex; flex-wrap: wrap; gap: 10px;">
                            ${mergedData.research.map(facility => `
                                <span style="
                                    padding: 8px 16px;
                                    background: rgba(34, 197, 94, 0.1);
                                    border: 1px solid rgba(34, 197, 94, 0.3);
                                    border-radius: 20px;
                                    color: #86efac;
                                    font-size: 14px;
                                ">
                                    ${facility}
                                </span>
                            `).join('')}
                        </div>
                    </div>
                    ` : ''}
                </div>
            </div>
            
            <!-- Footer -->
            <div style="
                padding: 15px 30px;
                background: rgba(30, 41, 59, 0.5);
                border-top: 1px solid rgba(100, 116, 139, 0.3);
                display: flex;
                justify-content: space-between;
                align-items: center;
            ">
                <div style="font-size: 12px; color: #64748b;">
                    Data Source: NASA Solar System Exploration & ESA
                </div>
                <div style="display: flex; gap: 20px; font-size: 12px;">
                    ${mergedData.age ? `<span style="color: #94a3b8;">Age: <strong style="color: #e0e7ff;">${mergedData.age}</strong></span>` : ''}
                    ${mergedData.discoveryMethod ? `<span style="color: #94a3b8;">Discovery: <strong style="color: #e0e7ff;">${mergedData.discoveryMethod}</strong></span>` : ''}
                </div>
            </div>
        `;
        
            // Add active tab indicator style
            this.addTabStyles();
            
            // Set the HTML
            this.container.innerHTML = panelHTML;
            this.container.style.display = 'block';
            this.currentPanel = planetData.name;
            
            // Force visibility
            this.container.style.visibility = 'visible';
            this.container.style.opacity = '1';
            
            // Check if container is actually visible
            const rect = this.container.getBoundingClientRect();
            console.log('InfoPanels: Container position:', {
                top: rect.top,
                right: rect.right,
                width: rect.width,
                height: rect.height,
                display: this.container.style.display,
                visibility: this.container.style.visibility
            });
            
            console.log('InfoPanels: Successfully displayed info panel for', planetData.name);
            
        } catch (error) {
            console.error('InfoPanels: Error showing planet info for', planetData.name, ':', error);
            console.error('InfoPanels: Error details:', error.stack);
            this.container.style.display = 'none';
        }
    }
    
    createDataCard(title, items) {
        const validItems = items.filter(item => item && item.value && item.value !== 'Not available' && item.value !== undefined);
        if (validItems.length === 0) {
            return `
                <div style="
                    background: rgba(30, 41, 59, 0.3);
                    border: 1px solid rgba(100, 116, 139, 0.2);
                    border-radius: 12px;
                    padding: 20px;
                ">
                    <h4 style="
                        color: #60a5fa;
                        font-size: 14px;
                        margin: 0 0 15px 0;
                        font-weight: 500;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                    ">
                        ${title}
                    </h4>
                    <p style="color: #94a3b8; font-size: 13px;">No data available</p>
                </div>
            `;
        }
        
        return `
            <div style="
                background: rgba(30, 41, 59, 0.3);
                border: 1px solid rgba(100, 116, 139, 0.2);
                border-radius: 12px;
                padding: 20px;
            ">
                <h4 style="
                    color: #60a5fa;
                    font-size: 14px;
                    margin: 0 0 15px 0;
                    font-weight: 500;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                ">
                    ${title}
                </h4>
                <div style="display: flex; flex-direction: column; gap: 8px;">
                    ${validItems.map(item => `
                        <div style="display: flex; justify-content: space-between; gap: 10px;">
                            <span style="color: #94a3b8; font-size: 13px;">${item.label}:</span>
                            <span style="color: #e0e7ff; font-size: 13px; text-align: right; font-weight: 500;">
                                ${item.value}
                            </span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    addTabStyles() {
        if (!document.getElementById('info-panel-styles')) {
            const style = document.createElement('style');
            style.id = 'info-panel-styles';
            style.textContent = `
                .tab-button {
                    position: relative;
                }
                .tab-button::after {
                    content: '';
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    width: 100%;
                    height: 2px;
                    background: transparent;
                    transition: background 0.2s;
                }
                .tab-button.active::after {
                    background: #6366f1;
                }
                .tab-button:hover {
                    color: #e0e7ff !important;
                }
                .tab-content::-webkit-scrollbar {
                    width: 8px;
                }
                .tab-content::-webkit-scrollbar-track {
                    background: rgba(30, 41, 59, 0.3);
                    border-radius: 4px;
                }
                .tab-content::-webkit-scrollbar-thumb {
                    background: rgba(99, 102, 241, 0.3);
                    border-radius: 4px;
                }
                .tab-content::-webkit-scrollbar-thumb:hover {
                    background: rgba(99, 102, 241, 0.5);
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    switchTab(tabId, tabName) {
        try {
            console.log('InfoPanels: Switching to tab:', tabName, 'with ID:', tabId);
            
            const container = document.querySelector(`[data-tab-id="${tabId}"]`);
            if (!container) {
                console.error('InfoPanels: Tab container not found for ID:', tabId);
                return;
            }
            
            // Update tab buttons
            const buttons = container.parentElement.querySelectorAll('.tab-button');
            console.log('InfoPanels: Found', buttons.length, 'tab buttons');
            
            buttons.forEach(btn => {
                if (btn.getAttribute('data-tab') === tabName) {
                    btn.classList.add('active');
                    btn.style.color = '#e0e7ff';
                } else {
                    btn.classList.remove('active');
                    btn.style.color = '#94a3b8';
                }
            });
            
            // Update tab panels
            const panels = container.querySelectorAll('.tab-panel');
            console.log('InfoPanels: Found', panels.length, 'tab panels');
            
            let panelFound = false;
            panels.forEach(panel => {
                if (panel.getAttribute('data-panel') === tabName) {
                    panel.style.display = 'block';
                    panel.classList.add('active');
                    panelFound = true;
                } else {
                    panel.style.display = 'none';
                    panel.classList.remove('active');
                }
            });
            
            if (!panelFound) {
                console.warn('InfoPanels: No panel found for tab:', tabName);
            } else {
                console.log('InfoPanels: Successfully switched to tab:', tabName);
            }
            
        } catch (error) {
            console.error('InfoPanels: Error switching tabs:', error);
        }
    }
    
    showMissionInfo(missionData) {
        this.container.innerHTML = `
            <div class="mission-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <div>
                    <h2 style="margin: 0; color: #ff9800; font-size: 24px;">${missionData.name}</h2>
                    <span style="color: #ffd54f; font-size: 14px;">${missionData.agency} | ${missionData.status}</span>
                </div>
                <button onclick="window.infoPanels.hide()" style="
                    background: none;
                    border: 1px solid #ff9800;
                    color: #ff9800;
                    padding: 5px 15px;
                    border-radius: 5px;
                    cursor: pointer;
                ">Close</button>
            </div>
            
            <div class="mission-timeline" style="margin: 20px 0;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                    <span><strong>Launch:</strong> ${missionData.launchDate}</span>
                    <span><strong>Duration:</strong> ${missionData.duration}</span>
                    <span><strong>Target:</strong> ${missionData.target}</span>
                </div>
                <div class="progress-bar" style="background: rgba(255,255,255,0.1); height: 4px; border-radius: 2px;">
                    <div style="background: #ff9800; height: 100%; width: ${missionData.progress}%; border-radius: 2px;"></div>
                </div>
            </div>
            
            <div class="mission-objectives" style="margin: 20px 0;">
                <h3 style="color: #ffb74d; font-size: 16px; margin-bottom: 10px;">Mission Objectives</h3>
                <ul style="margin: 0; padding-left: 20px;">
                    ${missionData.objectives.map(obj => `<li>${obj}</li>`).join('')}
                </ul>
            </div>
            
            ${missionData.achievements ? `
            <div class="mission-achievements" style="margin: 20px 0;">
                <h3 style="color: #81c784; font-size: 16px; margin-bottom: 10px;">Key Achievements</h3>
                <ul style="margin: 0; padding-left: 20px;">
                    ${missionData.achievements.map(ach => `<li>${ach}</li>`).join('')}
                </ul>
            </div>
            ` : ''}
        `;
        
        this.container.style.display = 'block';
        this.currentPanel = missionData.name;
    }
    
    hide() {
        this.container.style.display = 'none';
        this.currentPanel = null;
    }
    
    update() {
        // Auto-hide if camera moves away
        if (this.currentPanel && this.container.style.display === 'block') {
            // Add logic to check distance and hide if needed
        }
    }
}