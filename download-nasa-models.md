# How to Download NASA 3D Models

Since I cannot directly download files from websites, here's a guide on how to manually download the spacecraft models from NASA's 3D Resources site.

## Quick Download Links

Based on the NASA 3D Resources site, here are the direct search links for each spacecraft:

1. **Voyager**: 
   - Search: https://nasa3d.arc.nasa.gov/search/voyager
   - Look for "Voyager" or "Voyager Probe"

2. **New Horizons**: 
   - Search: https://nasa3d.arc.nasa.gov/search/new%20horizons
   - Model confirmed available

3. **Parker Solar Probe**: 
   - Search: https://nasa3d.arc.nasa.gov/search/parker
   - Model confirmed available

4. **Juno**: 
   - Search: https://nasa3d.arc.nasa.gov/search/juno
   - Multiple models available

5. **Perseverance**: 
   - Search: https://nasa3d.arc.nasa.gov/search/perseverance
   - Model confirmed available

6. **James Webb Space Telescope**: 
   - Search: https://nasa3d.arc.nasa.gov/search/jwst
   - Or search: https://nasa3d.arc.nasa.gov/search/james%20webb
   - Multiple models available

## Manual Download Steps

1. **Visit the model page**:
   - Click on the spacecraft model you want
   - You'll see a 3D preview and download options

2. **Choose format**:
   - Look for download buttons (usually on the right side)
   - Preferred formats in order:
     - GLB (best for web)
     - STL (good for geometry)
     - OBJ (can convert to GLB)
     - 3DS (can convert)

3. **Download and rename**:
   - Save to `models/spacecraft/` directory
   - Rename according to our naming convention:
     - `voyager.glb` or `voyager.stl`
     - `new-horizons.glb` or `new-horizons.stl`
     - `parker-solar-probe.glb` or `parker-solar-probe.stl`
     - `juno.glb` or `juno.stl`
     - `perseverance.glb` or `perseverance.stl`
     - `jwst.glb` or `jwst.stl`

## Alternative: Batch Download Script

If you want to automate downloads, you could create a Python script using legitimate methods:

```python
# Example structure (requires implementation)
import requests
import time

# NASA's API or direct model URLs (if available)
models = {
    'voyager': 'model_url_here',
    'new-horizons': 'model_url_here',
    # etc...
}

# Download with proper headers and respect rate limits
for name, url in models.items():
    # Implementation would go here
    # Always respect NASA's terms of service
    time.sleep(1)  # Rate limiting
```

## Important Notes

- All NASA 3D models are free to use
- Always check the usage guidelines on each model page
- Some models may have multiple versions (choose the most detailed)
- STL files are often available for 3D printing
- GLB/GLTF formats work best for web applications

## Fallback

Remember, if you don't download the models, the simulator will still work! It will use the detailed procedural geometry we've created for each spacecraft.