# SOLARA — Quick Start

1. **Serve the folder** (any static server):

```bash
python3 -m http.server 8000
```

(or `./start-server.sh` on Mac/Linux, `start-server.bat` on Windows)

2. **Open** http://localhost:8000 in a modern browser (WebGL2 + network access for the Three.js CDN).

3. **Explore**:
   - Drag to orbit, scroll to zoom, click any body (or its dock icon) to fly to it
   - `Esc` → system overview · `Space` → play/pause time
   - Speed slider: −10⁷× to +10⁷× real time · `NOW` resets to the current date
   - Toggles: orbit lines, labels, asteroid belt

If the screen stays black, check the browser console — texture or CDN load failures are logged and fall back gracefully.
