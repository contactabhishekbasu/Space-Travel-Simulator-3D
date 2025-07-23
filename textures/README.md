# Texture Files Setup

This directory contains texture files for the Space Travel Simulator 3D.

## Directory Structure

```
textures/
├── low/          # 2K resolution textures (Low mode)
└── high/         # 4K/8K resolution textures (High mode)
```

## Required Texture Files

Download the following texture files from [Solar System Scope](https://www.solarsystemscope.com/textures/):

### For Low Mode - Place in `textures/low/`:
- 2k_sun.jpg
- 2k_mercury.jpg
- 2k_venus_surface.jpg
- 2k_earth_daymap.jpg
- 2k_earth_clouds.jpg
- 2k_earth_nightmap.jpg
- 2k_moon.jpg
- 2k_mars.jpg
- 2k_jupiter.jpg
- 2k_saturn.jpg
- 2k_saturn_ring_alpha.png
- 2k_uranus.jpg
- 2k_neptune.jpg
- 2k_stars.jpg
- 2k_stars_milky_way.jpg

### For High Mode - Place in `textures/high/`:

The simulator will automatically try multiple resolutions in this order: 8K → 4K → 2K → Online

**8K textures (preferred):**
- 8k_sun.jpg
- 8k_mercury.jpg
- 8k_venus_surface.jpg
- 8k_earth_daymap.jpg
- 8k_earth_clouds.jpg
- 8k_earth_nightmap.jpg
- 8k_moon.jpg
- 8k_mars.jpg
- 8k_jupiter.jpg
- 8k_saturn.jpg
- 8k_saturn_ring_alpha.png
- 8k_uranus.jpg
- 8k_neptune.jpg
- 8k_stars.jpg
- 8k_stars_milky_way.jpg

**4K textures (fallback if 8K not available):**
- 4k_sun.jpg
- 4k_mercury.jpg
- 4k_venus_surface.jpg
- 4k_earth_daymap.jpg
- 4k_earth_clouds.jpg
- 4k_earth_nightmap.jpg
- 4k_moon.jpg
- 4k_mars.jpg
- 4k_jupiter.jpg
- 4k_saturn.jpg
- 4k_saturn_ring_alpha.png
- 4k_uranus.jpg
- 4k_neptune.jpg
- 4k_stars.jpg
- 4k_stars_milky_way.jpg

Note: If neither 8K nor 4K textures are found, the simulator will use 2K textures from the low folder, then fall back to online textures.

## Download Instructions

1. Visit https://www.solarsystemscope.com/textures/
2. Download each texture in both 2K and 8K resolutions
3. Place the 2K textures in the `textures/2k/` directory
4. Place the 8K textures in the `textures/8k/` directory
5. Ensure the filenames match exactly as listed above

## Usage

The simulator will automatically load the appropriate textures based on the selected mode:
- **Low Mode**: Uses 2K textures for better performance
- **High Mode**: Uses 8K textures for maximum visual quality