import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { FXAAShader } from 'three/addons/shaders/FXAAShader.js';

const BLOOM_STRENGTH = 0.55;
const BLOOM_RADIUS = 0.6;
const BLOOM_THRESHOLD = 0.85;

/**
 * Builds the HDR post-processing stack:
 *   RenderPass -> UnrealBloomPass -> OutputPass -> FXAA
 *
 * The composer's intermediate buffers are half-float, so the scene is bloomed
 * in linear HDR and only tone-mapped / encoded once, by OutputPass, using the
 * renderer's toneMapping + outputColorSpace settings.
 *
 * FXAA deliberately runs *after* OutputPass. Its luma is a fixed
 * `dot(rgb, vec3(0.299, 0.587, 0.114))` with hard-coded contrast thresholds
 * (1/8, 1/24) that assume sRGB-encoded LDR input; fed linear HDR values almost
 * no edge clears the threshold and the pass becomes a no-op. Since the renderer
 * is created with `antialias: false`, this pass is the only edge treatment we
 * get, so it has to see display-referred colour.
 *
 * @param {THREE.WebGLRenderer} renderer
 * @param {THREE.Scene} scene
 * @param {THREE.Camera} camera
 * @returns {{ composer: EffectComposer, setSize: (w:number, h:number) => void, render: (dt:number) => void }}
 */
export function createComposer(renderer, scene, camera) {
    const size = renderer.getSize(new THREE.Vector2());
    const pixelRatio = renderer.getPixelRatio();

    const composer = new EffectComposer(renderer);
    composer.setPixelRatio(pixelRatio);
    composer.setSize(size.x, size.y);

    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    const bloomPass = new UnrealBloomPass(
        new THREE.Vector2(size.x * pixelRatio, size.y * pixelRatio),
        BLOOM_STRENGTH,
        BLOOM_RADIUS,
        BLOOM_THRESHOLD
    );
    composer.addPass(bloomPass);

    // Tone map + sRGB encode here, so the antialiasing pass below operates on
    // display-referred pixels.
    const outputPass = new OutputPass();
    composer.addPass(outputPass);

    const fxaaPass = new ShaderPass(FXAAShader);
    fxaaPass.material.uniforms.resolution.value.set(
        1 / Math.max(1, size.x * pixelRatio),
        1 / Math.max(1, size.y * pixelRatio)
    );
    composer.addPass(fxaaPass);

    /**
     * Resize the whole chain. Reads the renderer's current pixel ratio so that
     * adaptive-quality changes propagate to the offscreen buffers and FXAA.
     */
    function setSize(w, h) {
        const width = Math.max(1, w);
        const height = Math.max(1, h);
        const ratio = renderer.getPixelRatio();

        composer.setPixelRatio(ratio);
        composer.setSize(width, height);

        fxaaPass.material.uniforms.resolution.value.set(
            1 / (width * ratio),
            1 / (height * ratio)
        );
    }

    function render(dt) {
        composer.render(dt);
    }

    return { composer, setSize, render };
}
