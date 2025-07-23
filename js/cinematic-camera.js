// Cinematic camera movements inspired by NASA's Eyes
class CinematicCamera {
    constructor(camera, scene) {
        this.camera = camera;
        this.scene = scene;
        this.isAnimating = false;
        this.animations = [];
        
        // Predefined cinematic shots
        this.cinematicShots = {
            solarSystemOverview: {
                position: new THREE.Vector3(500, 300, 500),
                lookAt: new THREE.Vector3(0, 0, 0),
                duration: 5000,
                easing: 'easeInOutQuad'
            },
            earthCloseup: {
                position: new THREE.Vector3(50, 20, 50),
                lookAt: 'earth',
                duration: 3000,
                easing: 'easeInOutCubic'
            },
            sunDive: {
                path: [
                    new THREE.Vector3(300, 100, 300),
                    new THREE.Vector3(150, 50, 150),
                    new THREE.Vector3(80, 0, 80)
                ],
                lookAt: 'sun',
                duration: 4000,
                easing: 'easeInQuad'
            },
            planetTour: {
                waypoints: ['mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn'],
                duration: 20000,
                easing: 'easeInOutQuad'
            }
        };
    }
    
    // Easing functions
    easingFunctions = {
        linear: t => t,
        easeInQuad: t => t * t,
        easeOutQuad: t => t * (2 - t),
        easeInOutQuad: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
        easeInCubic: t => t * t * t,
        easeOutCubic: t => (--t) * t * t + 1,
        easeInOutCubic: t => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1
    };
    
    startCinematicShot(shotName) {
        const shot = this.cinematicShots[shotName];
        if (!shot) return;
        
        this.isAnimating = true;
        
        if (shot.waypoints) {
            this.animatePlanetTour(shot);
        } else if (shot.path) {
            this.animateAlongPath(shot);
        } else {
            this.animateToPosition(shot);
        }
    }
    
    animateToPosition(shot) {
        const startPosition = this.camera.position.clone();
        const endPosition = shot.position.clone();
        const startTime = Date.now();
        const easing = this.easingFunctions[shot.easing] || this.easingFunctions.linear;
        
        const animate = () => {
            if (!this.isAnimating) return;
            
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / shot.duration, 1);
            const easedProgress = easing(progress);
            
            // Interpolate position
            this.camera.position.lerpVectors(startPosition, endPosition, easedProgress);
            
            // Update look at
            if (typeof shot.lookAt === 'string' && window.bodies && window.bodies[shot.lookAt]) {
                this.camera.lookAt(window.bodies[shot.lookAt].position);
            } else if (shot.lookAt) {
                this.camera.lookAt(shot.lookAt);
            }
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                this.isAnimating = false;
            }
        };
        
        animate();
    }
    
    animateAlongPath(shot) {
        const curve = new THREE.CatmullRomCurve3(shot.path);
        const startTime = Date.now();
        const easing = this.easingFunctions[shot.easing] || this.easingFunctions.linear;
        
        const animate = () => {
            if (!this.isAnimating) return;
            
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / shot.duration, 1);
            const easedProgress = easing(progress);
            
            // Get position along curve
            const position = curve.getPoint(easedProgress);
            this.camera.position.copy(position);
            
            // Update look at
            if (typeof shot.lookAt === 'string' && window.bodies && window.bodies[shot.lookAt]) {
                this.camera.lookAt(window.bodies[shot.lookAt].position);
            } else if (shot.lookAt) {
                this.camera.lookAt(shot.lookAt);
            }
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                this.isAnimating = false;
            }
        };
        
        animate();
    }
    
    animatePlanetTour(shot) {
        let currentIndex = 0;
        const visitPlanet = () => {
            if (currentIndex >= shot.waypoints.length || !this.isAnimating) {
                this.isAnimating = false;
                return;
            }
            
            const planetName = shot.waypoints[currentIndex];
            const planet = window.bodies[planetName];
            
            if (planet) {
                const targetPosition = planet.position.clone();
                targetPosition.add(new THREE.Vector3(50, 30, 50)); // Offset for viewing
                
                this.animateToPosition({
                    position: targetPosition,
                    lookAt: planetName,
                    duration: shot.duration / shot.waypoints.length,
                    easing: shot.easing
                });
                
                setTimeout(() => {
                    currentIndex++;
                    visitPlanet();
                }, shot.duration / shot.waypoints.length + 1000); // Pause at each planet
            }
        };
        
        visitPlanet();
    }
    
    stopAnimation() {
        this.isAnimating = false;
    }
    
    // Smooth follow function for tracking objects
    smoothFollow(target, offset = new THREE.Vector3(50, 30, 50), smoothness = 0.1) {
        if (!target) return;
        
        const desiredPosition = target.position.clone().add(offset);
        this.camera.position.lerp(desiredPosition, smoothness);
        this.camera.lookAt(target.position);
    }
    
    // Orbit around target
    orbitAroundTarget(target, radius = 100, speed = 0.001) {
        if (!target) return;
        
        const time = Date.now() * speed;
        const x = target.position.x + Math.cos(time) * radius;
        const z = target.position.z + Math.sin(time) * radius;
        const y = target.position.y + radius * 0.5;
        
        this.camera.position.set(x, y, z);
        this.camera.lookAt(target.position);
    }
}