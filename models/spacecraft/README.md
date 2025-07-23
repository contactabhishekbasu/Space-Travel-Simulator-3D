# Spacecraft 3D Models

This directory is for storing 3D models of spacecraft. The simulator now supports loading real 3D models for all spacecraft!

## Supported File Formats

The simulator now supports multiple 3D file formats:
- **GLB/GLTF** - Recommended format, includes materials and textures
- **STL** - Common 3D printing format, geometry only (materials applied automatically)
- **MB (Maya Binary)** - Requires conversion to GLB or STL first (see conversion instructions below)

## Downloading NASA 3D Models

All spacecraft models are available for free from NASA's official 3D Resources site:

1. Visit **[nasa3d.arc.nasa.gov](https://nasa3d.arc.nasa.gov)**
2. Search for the following spacecraft models:
   - **Voyager** (for Voyager 1 & 2)
   - **New Horizons**
   - **Parker Solar Probe**
   - **Juno**
   - **Perseverance**
   - **James Webb Space Telescope** (or "JWST with Instruments")

3. Download each model in your preferred format (GLB, STL, or MB)

4. Place files in this directory with these naming conventions:
   - GLB files: `voyager.glb`, `new-horizons.glb`, etc.
   - STL files: `voyager.stl`, `new-horizons.stl`, etc.
   - MB files: Must be converted first (see below)

## File Priority

The loader will try to load models in this order:
1. GLB/GLTF files (best quality, includes materials)
2. STL files (geometry only, materials applied automatically)
3. MB files (after conversion)
4. Fallback to procedural geometry if no files found

## Converting Maya Binary (.mb) Files

Maya Binary files must be converted before use:

### Option 1: Using Autodesk Maya
1. Open the .mb file in Maya
2. File → Export All
3. Choose "OBJ" or "FBX" format
4. Use an online converter to convert to GLB/STL

### Option 2: Using Free Tools
1. **Blender** (free):
   - Install Blender
   - Import FBX/OBJ (if converted from Maya)
   - Export as GLB or STL
   
2. **FreeCAD** (free):
   - Can import some formats and export as STL

### Option 3: Online Converters
- [anyconv.com](https://anyconv.com) - Supports many format conversions
- [convertio.co](https://convertio.co) - Another online converter

## STL File Notes

STL files only contain geometry (no materials or textures). The simulator will:
- Apply metallic spacecraft materials automatically
- Use textures if available in `textures/spacecraft/`
- Use fallback colors specific to each spacecraft

## Textures (Optional)

You can add textures in the `textures/spacecraft/` directory:
- `voyager_texture.jpg`
- `new_horizons_texture.jpg`
- `parker_texture.jpg`
- `juno_texture.jpg`
- `perseverance_texture.jpg`
- `jwst_texture.jpg`

Textures will be automatically applied to STL models.

## Fallback System

If 3D models are not found, the simulator will automatically use enhanced geometric representations with accurate proportions and details for each spacecraft.

## Troubleshooting

- **Model appears too large/small**: Adjust the `scale` value in `spacecraft-models.js`
- **Model orientation wrong**: Adjust the `rotation` values in `spacecraft-models.js`
- **STL appears gray**: Add a texture file or the simulator will use default metallic material
- **MB file won't load**: Convert to GLB or STL first using the methods above

## License

All NASA 3D models are free to use. Please check individual model pages for specific usage guidelines.