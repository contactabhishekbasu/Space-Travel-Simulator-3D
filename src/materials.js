/**
 * materials.js — the shader library for the AAA solar system rebuild.
 *
 * Everything here is pure factory code: it builds geometry + materials and hands
 * them back ready to be parented. No module-level state, no scene access.
 *
 * Conventions shared with the rest of the app:
 *   - The sun sits at the world origin, so every lit shader takes a world-space
 *     unit `sunDirection` uniform (surface -> sun) which `planets.js` refreshes
 *     each frame.
 *   - Shaders output *linear HDR*. Tone mapping (ACES) and the sRGB encode are
 *     done once at the end of the post chain by OutputPass, so nothing here
 *     clamps or gamma-encodes.
 *   - Colour textures are uploaded with `colorSpace = SRGBColorSpace`, i.e. the
 *     sampler already returns linear values.
 *   - The renderer runs with `logarithmicDepthBuffer: true`; every custom shader
 *     therefore pulls in three's logdepth chunks so it depth-tests consistently
 *     against the built-in materials.
 */

import * as THREE from 'three';

/** Slightly warm white for the photosphere — used by every sun-lit highlight. */
const SUN_TINT = 'vec3( 1.0, 0.958, 0.902 )';

/**
 * World-space vertex stage shared by the custom shaders: forwards uv, world
 * position and world normal, then hands over to the log-depth chunk.
 */
const WORLD_VERTEX_SHADER = /* glsl */ `
	#include <common>
	#include <logdepthbuf_pars_vertex>

	varying vec2 vUv;
	varying vec3 vWorldPosition;
	varying vec3 vWorldNormal;

	void main() {

		vUv = uv;

		vec4 worldPosition = modelMatrix * vec4( position, 1.0 );
		vWorldPosition = worldPosition.xyz;
		vWorldNormal = normalize( mat3( modelMatrix ) * normal );

		gl_Position = projectionMatrix * viewMatrix * worldPosition;

		#include <logdepthbuf_vertex>

	}
`;

/**
 * The same stage plus the object's world-space origin. Shaders that reason about
 * the planet as a sphere — the atmosphere halo and the rings' analytic shadow —
 * need that centre, and neither mesh is offset inside its parent group.
 */
const CENTERED_WORLD_VERTEX_SHADER = /* glsl */ `
	#include <common>
	#include <logdepthbuf_pars_vertex>

	varying vec2 vUv;
	varying vec3 vWorldPosition;
	varying vec3 vWorldNormal;
	varying vec3 vPlanetCenter;

	void main() {

		vUv = uv;

		vec4 worldPosition = modelMatrix * vec4( position, 1.0 );
		vWorldPosition = worldPosition.xyz;
		vWorldNormal = normalize( mat3( modelMatrix ) * normal );
		vPlanetCenter = ( modelMatrix * vec4( 0.0, 0.0, 0.0, 1.0 ) ).xyz;

		gl_Position = projectionMatrix * viewMatrix * worldPosition;

		#include <logdepthbuf_vertex>

	}
`;

// ---------------------------------------------------------------------------
// Earth
// ---------------------------------------------------------------------------

const EARTH_FRAGMENT_SHADER = /* glsl */ `
	#include <common>
	#include <logdepthbuf_pars_fragment>

	#ifdef EARTH_DAYMAP
		uniform sampler2D dayMap;
	#endif
	#ifdef EARTH_NIGHTMAP
		uniform sampler2D nightMap;
	#endif
	#ifdef EARTH_NORMALMAP
		uniform sampler2D normalMap;
	#endif
	#ifdef EARTH_SPECMAP
		uniform sampler2D specMap;
	#endif

	uniform vec3 sunDirection;

	varying vec2 vUv;
	varying vec3 vWorldPosition;
	varying vec3 vWorldNormal;

	// Screen-space derivative tangent frame — gives us a TBN basis without
	// shipping a tangent attribute. Both vectors come back sharing one scale
	// factor, exactly like three's tangent-less normal mapping.
	void earthTangentFrame( in vec3 surfacePosition, in vec3 surfaceNormal, in vec2 uv, out vec3 tangent, out vec3 bitangent ) {

		vec3 q0 = dFdx( surfacePosition );
		vec3 q1 = dFdy( surfacePosition );
		vec2 st0 = dFdx( uv );
		vec2 st1 = dFdy( uv );

		vec3 q1perp = cross( q1, surfaceNormal );
		vec3 q0perp = cross( surfaceNormal, q0 );

		tangent = q1perp * st0.x + q0perp * st1.x;
		bitangent = q1perp * st0.y + q0perp * st1.y;

		float det = max( dot( tangent, tangent ), dot( bitangent, bitangent ) );
		float scale = ( det == 0.0 ) ? 0.0 : inversesqrt( det );

		tangent *= scale;
		bitangent *= scale;

	}

	void main() {

		vec3 geoNormal = normalize( vWorldNormal );
		vec3 viewDir = normalize( cameraPosition - vWorldPosition );
		vec3 lightDir = normalize( sunDirection );

		vec3 normal = geoNormal;

		#ifdef EARTH_NORMALMAP
			vec3 tangent;
			vec3 bitangent;
			earthTangentFrame( vWorldPosition, geoNormal, vUv, tangent, bitangent );

			vec3 mapN = texture2D( normalMap, vUv ).xyz * 2.0 - 1.0;
			mapN.xy *= 0.85;
			normal = normalize( tangent * mapN.x + bitangent * mapN.y + geoNormal * mapN.z );
		#endif

		// The smooth sphere normal drives the terminator so relief detail never
		// punches holes through the day/night blend.
		float geoNdotL = dot( geoNormal, lightDir );
		float NdotL = dot( normal, lightDir );

		// Soft lambert wrap — a touch of light bleeds past the geometric
		// terminator, which is what atmospheric scattering actually does.
		const float WRAP = 0.15;
		float diffuse = clamp( ( NdotL + WRAP ) / ( 1.0 + WRAP ), 0.0, 1.0 );

		vec3 sunColor = ${SUN_TINT};

		#ifdef EARTH_DAYMAP
			vec3 dayAlbedo = texture2D( dayMap, vUv ).rgb;
			// The 8k plate is a punchy consumer scan — vegetation comes back
			// emerald. Orbital imagery reads olive against a far less electric
			// ocean, so ease the saturation off before lighting it.
			float albedoLuma = dot( dayAlbedo, vec3( 0.2126, 0.7152, 0.0722 ) );
			dayAlbedo = mix( vec3( albedoLuma ), dayAlbedo, 0.86 );
		#else
			vec3 dayAlbedo = vec3( 0.16, 0.28, 0.46 );
		#endif

		vec3 color = dayAlbedo * diffuse * sunColor;

		// Terminator band: the long air path filters the sunlight orange.
		float terminator = 1.0 - smoothstep( 0.0, 0.30, abs( geoNdotL ) );
		color = mix( color, color * vec3( 1.30, 0.84, 0.56 ), terminator * 0.55 );
		color += dayAlbedo * vec3( 0.42, 0.16, 0.06 ) * terminator * clamp( geoNdotL + 0.18, 0.0, 1.0 ) * 0.5;

		// Whisper of ambient/earthshine so the unlit limb keeps its silhouette.
		color += dayAlbedo * vec3( 0.020, 0.026, 0.038 );

		// Aerial perspective: toward the limb the line of sight crosses a much
		// longer air column, so the ground desaturates and shifts to the pale
		// blue-grey of the scattered sky instead of holding full punch to the
		// edge of the disc.
		float mu = clamp( dot( geoNormal, viewDir ), 0.0, 1.0 );
		float airPath = pow( 1.0 - mu, 1.6 );
		vec3 hazeColor = vec3( 0.32, 0.46, 0.72 ) * ( dot( color, vec3( 0.3333 ) ) + 0.10 );
		color = mix( color, hazeColor, airPath * clamp( geoNdotL + 0.05, 0.0, 1.0 ) * 0.65 );

		#ifdef EARTH_SPECMAP
			// Ocean mask: the specular map is white over water, black over land.
			// The hard ramp keeps the glint off the coastline instead of letting
			// it spill inland over Iberia and the Maghreb.
			float ocean = smoothstep( 0.55, 0.92, texture2D( specMap, vUv ).r );

			// Open water is optically smooth at this scale. Perturbing the normal
			// with texture-space sinusoids put well over one cycle per pixel once
			// the camera closed in, which is what produced the diagonal moire, so
			// the glint now rides the sphere normal with only a trace of relief.
			vec3 waterNormal = normalize( mix( normal, geoNormal, 0.6 ) );

			// Tight lobe, modest gain: a soft bright patch that stays under the
			// ACES shoulder rather than a clipped white disc.
			vec3 halfVector = normalize( lightDir + viewDir );
			float glint = pow( max( dot( waterNormal, halfVector ), 0.0 ), 110.0 );
			color += sunColor * glint * ocean * clamp( geoNdotL * 4.0, 0.0, 1.0 ) * 0.45;
		#endif

		#ifdef EARTH_NIGHTMAP
			// City lights fade in just past the terminator, boosted so the bloom
			// pass picks up the brightest conurbations.
			float nightMask = smoothstep( 0.08, -0.12, geoNdotL );
			vec3 cityLights = texture2D( nightMap, vUv ).rgb;
			color += cityLights * vec3( 1.0, 0.80, 0.55 ) * nightMask * 1.6;
		#endif

		// Fresnel lift along the lit limb — the hairline of brightness that sits
		// underneath the atmosphere shell. Deliberately faint: the shell owns the
		// halo now, and stacking two rim terms is what drew a painted blue
		// outline around the disc.
		float fresnel = pow( 1.0 - mu, 4.0 );
		color += vec3( 0.28, 0.45, 0.85 ) * fresnel * clamp( geoNdotL + 0.10, 0.0, 1.0 ) * 0.12;

		gl_FragColor = vec4( color, 1.0 );

		#include <logdepthbuf_fragment>

	}
`;

/**
 * The hero material: day/night terminator, city lights, ocean sun-glint, aerial
 * perspective toward the limb and derivative-based normal mapping, all in
 * linear HDR.
 *
 * Everything here is static in time — the surface is driven purely by geometry
 * and `sunDirection`, so there is no animation uniform to keep fed.
 *
 * @param {Object} textures
 * @param {THREE.Texture} textures.day      colour albedo (sRGB)
 * @param {THREE.Texture} [textures.night]  city lights (sRGB)
 * @param {THREE.Texture} [textures.normal] tangent-space normals (linear data)
 * @param {THREE.Texture} [textures.specular] ocean mask, white = water (linear data)
 * @returns {THREE.ShaderMaterial} uniforms: dayMap, nightMap, normalMap, specMap,
 *          sunDirection (world-space unit Vector3)
 */
export function createEarthMaterial( textures = {} ) {

	const { day = null, night = null, normal = null, specular = null } = textures;

	const uniforms = {
		sunDirection: { value: new THREE.Vector3( 1, 0, 0 ) }
	};
	const defines = {};

	if ( day ) {

		uniforms.dayMap = { value: day };
		defines.EARTH_DAYMAP = '';

	}

	if ( night ) {

		uniforms.nightMap = { value: night };
		defines.EARTH_NIGHTMAP = '';

	}

	if ( normal ) {

		uniforms.normalMap = { value: normal };
		defines.EARTH_NORMALMAP = '';

	}

	if ( specular ) {

		uniforms.specMap = { value: specular };
		defines.EARTH_SPECMAP = '';

	}

	const material = new THREE.ShaderMaterial( {
		name: 'EarthSurfaceMaterial',
		uniforms,
		defines,
		vertexShader: WORLD_VERTEX_SHADER,
		fragmentShader: EARTH_FRAGMENT_SHADER
	} );

	return material;

}

// ---------------------------------------------------------------------------
// Atmosphere shell
// ---------------------------------------------------------------------------

const ATMOSPHERE_FRAGMENT_SHADER = /* glsl */ `
	#include <common>
	#include <logdepthbuf_pars_fragment>

	uniform vec3 glowColor;
	uniform float glowIntensity;
	uniform vec3 sunDirection;
	uniform float planetRadius;
	uniform float shellRadius;

	// The shared vertex stage also forwards vUv and the shell normal; the halo
	// is reconstructed from the view ray instead, so both go unread here.
	varying vec3 vWorldPosition;
	varying vec3 vPlanetCenter;

	void main() {

		vec3 lightDir = normalize( sunDirection );

		// Work in impact-parameter space rather than off the shell's own normal.
		// A plain fresnel rim is a property of the *mesh*, so it smears inward
		// across the silhouette and paints an outline over the planet; the
		// distance at which this view ray passes the planet's centre is the
		// quantity the air column actually depends on, and it confines the glow
		// to a true exterior halo. Same trick the sun's corona uses.
		vec3 rayDir = normalize( vWorldPosition - cameraPosition );
		vec3 toCenter = vPlanetCenter - cameraPosition;
		float along = dot( toCenter, rayDir );
		vec3 offset = ( cameraPosition + rayDir * along ) - vPlanetCenter;
		float b = length( offset );

		// Inside the silhouette we are looking at the planet, not through air:
		// the haze over the disc belongs to the surface shader, not the shell.
		if ( along <= 0.0 || b <= planetRadius || b >= shellRadius ) discard;

		float x = saturate( ( b - planetRadius ) / max( shellRadius - planetRadius, 1e-4 ) );

		// Two-term altitude profile: a broad wash for the deep Rayleigh column
		// plus a tight hairline hugging the surface. That pairing is what gives
		// a real limb its white -> cyan -> deep blue -> black ramp instead of a
		// flat band with a hard step at either edge.
		float halo = 0.62 * pow( 1.0 - x, 3.0 ) + 0.38 * pow( 1.0 - x, 10.0 );

		// The ray's closest-approach point sits directly above the patch of
		// surface we are grazing, so its sun angle tells us whether this sector
		// of the limb is in daylight.
		vec3 limbDir = offset / max( b, 1e-6 );
		float sunAngle = dot( limbDir, lightDir );

		// Rim strength has to follow the sun around the limb. The ramp is biased
		// past zero on purpose: on a fully-lit disc every visible limb point sits
		// on the terminator, and a ramp centred at zero therefore lit the entire
		// annulus at half strength — the uniform painted outline. Biased, a full
		// phase gets a discreet edge while a crescent's sunward limb still reaches
		// full brightness. The floor is a trace of night-side airglow, kept so the
		// dark limb still reads as a silhouette against the starfield rather than
		// dissolving into it.
		const float NIGHT_RIM = 0.15;
		float dayFactor = smoothstep( -0.15, 0.45, sunAngle );
		float rim = mix( NIGHT_RIM, 1.0, dayFactor );

		// Backlit halo: forward scattering when we look roughly sunward lights
		// the whole annulus, including the sector that is otherwise in shadow.
		float backLit = clamp( dot( rayDir, lightDir ), 0.0, 1.0 );
		float forwardScatter = pow( smoothstep( 0.55, 1.0, backLit ), 2.5 );

		// The shallow layer next to the ground has scattered far less of its
		// blue away, so lift the innermost slice toward the sun's own colour.
		vec3 tint = mix( glowColor, mix( glowColor, ${SUN_TINT}, 0.55 ), pow( 1.0 - x, 8.0 ) );

		vec3 color = tint * halo * glowIntensity * rim;
		color += tint * halo * glowIntensity * forwardScatter * 0.9;
		color = mix( color, color * vec3( 1.25, 1.02, 0.82 ), forwardScatter * 0.6 );

		gl_FragColor = vec4( color, 1.0 );

		#include <logdepthbuf_fragment>

	}
`;

// A shell flush with the surface leaves the halo nowhere to fall off, so the
// glow degenerates into a hard outline. Enforce a floor on the air column.
const MIN_ATMOSPHERE_THICKNESS = 0.012;

/**
 * Additive back-side scattering shell. Parent it to the planet group; it needs
 * no light in the scene, only its `sunDirection` uniform.
 *
 * The shader shades by the view ray's impact parameter, so the glow is a real
 * exterior halo between `planetRadius` and `shellRadius`: fragments projecting
 * inside the planet's silhouette are discarded rather than washed over the disc.
 *
 * @param {number} radius planet radius in scene units
 * @param {Object} [options]
 * @param {number} [options.color] glow colour as an sRGB hex
 * @param {number} [options.intensity] overall brightness multiplier
 * @param {number} [options.thickness] shell height as a fraction of the radius
 * @returns {THREE.Mesh} uniforms: glowColor, glowIntensity, sunDirection
 *          (world-space unit Vector3), planetRadius, shellRadius
 */
export function createAtmosphere( radius, options = {} ) {

	const {
		color = 0x6da8ff,
		intensity = 1.0,
		thickness = 0.025
	} = options;

	const shellRadius = radius * ( 1.0 + Math.max( thickness, MIN_ATMOSPHERE_THICKNESS ) );

	const geometry = new THREE.SphereGeometry( shellRadius, 96, 96 );

	const material = new THREE.ShaderMaterial( {
		name: 'AtmosphereMaterial',
		uniforms: {
			glowColor: { value: new THREE.Color( color ) },
			glowIntensity: { value: intensity },
			sunDirection: { value: new THREE.Vector3( 1, 0, 0 ) },
			planetRadius: { value: radius },
			shellRadius: { value: shellRadius }
		},
		vertexShader: CENTERED_WORLD_VERTEX_SHADER,
		fragmentShader: ATMOSPHERE_FRAGMENT_SHADER,
		side: THREE.BackSide,
		blending: THREE.AdditiveBlending,
		transparent: true,
		depthWrite: false
	} );

	const mesh = new THREE.Mesh( geometry, material );
	mesh.name = 'Atmosphere';
	mesh.renderOrder = 2;

	return mesh;

}

// ---------------------------------------------------------------------------
// Saturn's rings
// ---------------------------------------------------------------------------

const RING_FRAGMENT_SHADER = /* glsl */ `
	#include <common>
	#include <logdepthbuf_pars_fragment>

	uniform sampler2D ringMap;
	uniform vec3 sunDirection;
	uniform float planetRadius;
	uniform float innerR;
	uniform float outerR;

	varying vec2 vUv;
	varying vec3 vWorldPosition;
	varying vec3 vWorldNormal;
	varying vec3 vPlanetCenter;

	void main() {

		// --- coverage ----------------------------------------------------------
		// UVs were rewritten so u runs radially across the ring strip.
		float radial = clamp( vUv.x, 0.0, 1.0 );
		vec4 texel = texture2D( ringMap, vec2( radial, 0.5 ) );
		float density = clamp( texel.a, 0.0, 1.0 );

		vec3 planeNormal = normalize( vWorldNormal );
		vec3 viewDir = normalize( cameraPosition - vWorldPosition );

		// Beer-Lambert along the line of sight. The sheet is a handful of
		// particles deep face-on and many times that edge-on, so the same band
		// reads translucent from above and near solid from the side. It also has
		// to carry the occlusion: the additive starfield is drawn far earlier in
		// the transparent queue, so anything short of alpha 1.0 lets stars through
		// in proportion to ( 1.0 - alpha ). A flat gain never got there either.
		float grazing = clamp( abs( dot( planeNormal, viewDir ) ), 0.0, 1.0 );
		float pathLength = 1.0 / max( grazing, 0.12 );
		float transparency = max( 1.0 - density * 0.97, 1e-3 );
		float alpha = clamp( 1.0 - pow( transparency, pathLength ), 0.0, 1.0 );

		// Beer-Lambert only approaches full opacity asymptotically, and the plate's
		// B ring peaks around 0.8-0.9 density rather than a clean 1.0, so face-on
		// (pathLength == 1) the densest band still settled near alpha 0.85 and let
		// roughly one part in seven of the additive starfield behind it through —
		// a scatter of white specks over the brightest band. Saturate the optically
		// thick core to a true 1.0. The ramp starts above the A ring's density, so
		// the C ring, the Cassini division and the thin outer material keep the
		// partial alpha that makes them read as translucent sheet.
		alpha = mix( alpha, 1.0, smoothstep( 0.55, 0.8, density ) );

		// First operation, ahead of all shading: this material writes depth, and
		// a fragment in a division is empty space, not ring. Letting it claim
		// depth turns every gap into an occluder that hides the ring plane behind
		// it — the torn black flakes. Discarding keeps the depth buffer honest
		// while the surviving fragments still block the stars.
		if ( alpha < 0.06 ) discard;

		// --- albedo ------------------------------------------------------------
		// Ring particles are dirty water ice, but the plate reads sepia: pull most
		// of the saturation out and grade toward a faintly cold neutral.
		vec3 albedo = texel.rgb;
		float albedoLuma = dot( albedo, vec3( 0.2126, 0.7152, 0.0722 ) );
		albedo = mix( albedo, vec3( albedoLuma ) * vec3( 0.98, 0.995, 1.03 ), 0.62 );
		// A floor well under the C ring's own albedo: it never flattens the plate's
		// tonal structure, it only guarantees that no path through this shader can
		// land on black.
		albedo = max( albedo, vec3( 0.012 ) );

		// --- illumination geometry ---------------------------------------------
		vec3 lightDir = normalize( sunDirection );
		vec3 facingNormal = gl_FrontFacing ? planeNormal : - planeNormal;

		// A thin sheet lit from one side: the sunward face reflects, the far face
		// transmits. Blend across the edge-on sliver rather than stepping.
		float litSide = clamp( smoothstep( -0.05, 0.05, dot( facingNormal, lightDir ) ), 0.0, 1.0 );

		// Grazing sunlight spreads the same flux over more ring plane — but at low
		// sun each particle also presents a larger cross-section, so the falloff is
		// gentle and floored. The rings never go out.
		float sunElevation = clamp( abs( dot( planeNormal, lightDir ) ), 0.0, 1.0 );
		float illumination = clamp( 0.80 + 0.20 * pow( max( sunElevation, 1e-3 ), 0.35 ), 0.0, 1.0 );

		// Looking sunward through the sheet: micron ice grains scatter hard into
		// the forward lobe, which is why backlit rings glow.
		float backLit = clamp( - dot( viewDir, lightDir ), 0.0, 1.0 );
		float forwardScatter = clamp( smoothstep( 0.15, 1.0, backLit ), 0.0, 1.0 );

		// --- analytic planet shadow --------------------------------------------
		// Cast from this ring particle toward the sun and measure how close that
		// ray passes to the planet's centre.
		vec3 toPlanet = vPlanetCenter - vWorldPosition;
		float alongSun = dot( toPlanet, lightDir );
		float offAxis = length( toPlanet - lightDir * alongSun );

		// The penumbra widens with distance from the occluder, so the shadow edge
		// softens as it sweeps out across the A ring.
		float ringRadius = mix( innerR, outerR, radial );
		float penumbra = max( planetRadius * 0.06 + max( ringRadius - planetRadius, 0.0 ) * 0.02, 1e-3 );

		// Edges built so edge0 < edge1 by construction. smoothstep is undefined for
		// a reversed or degenerate interval, and an undefined shadow term is exactly
		// how black shards get painted across the plane.
		float umbraEdge = max( planetRadius - penumbra, 0.0 );
		float lightReach = clamp( smoothstep( umbraEdge, umbraEdge + 2.0 * penumbra, offAxis ), 0.0, 1.0 );

		// Only the sector genuinely behind the planet is eclipsed; where alongSun
		// turns negative the ring is on the sunward side.
		float behindPlanet = step( 0.0, alongSun );
		// The umbra still catches ring-shine and Saturn's own reflected light, so
		// it bottoms out well above black.
		float shadow = clamp( mix( 1.0, mix( 0.12, 1.0, lightReach ), behindPlanet ), 0.0, 1.0 );

		// --- shading ------------------------------------------------------------
		vec3 sunColor = ${SUN_TINT};

		// Transmission through the sheet — never a flat multiplier, which is what
		// crushed the unlit face to charcoal. Diffusely transmitted light is dimmer
		// and cooler than the reflected face, and it survives best where the sheet
		// is optically thin, so the C ring and the divisions stay luminous while
		// the dense B ring reads comparatively muted. The forward-scatter term then
		// lifts the whole unlit face when we are looking back toward the sun.
		float openness = clamp( 1.0 - density, 0.0, 1.0 );
		float transmission = clamp( 0.55 + 0.30 * openness + 0.45 * openness * forwardScatter, 0.0, 1.6 );

		vec3 litColor = albedo * sunColor;
		vec3 unlitColor = albedo * mix( sunColor, vec3( 0.84, 0.92, 1.12 ), 0.6 ) * transmission;

		// The plate is a dim scan — its brightest band sits around 0.22 linear,
		// nowhere near the ~0.5 geometric albedo of water ice. Without this lift
		// even a fully sunlit ring tone-maps to mid grey.
		const float ICE_GAIN = 1.85;
		vec3 color = mix( unlitColor, litColor, litSide ) * illumination * ICE_GAIN * shadow;

		// Sparse gaps forward-scatter hardest: with the sun behind the rings the
		// divisions glow as haze instead of dropping out.
		color += albedo * sunColor * forwardScatter * openness * 0.30 * shadow;

		// Saturn-shine: from the ring plane the planet is an enormous bright disc,
		// so even the deepest shade keeps a faint fill.
		color += albedo * vec3( 0.060, 0.055, 0.048 );

		gl_FragColor = vec4( max( color, vec3( 0.0 ) ), alpha );

		#include <logdepthbuf_fragment>

	}
`;

/**
 * Saturn's ring plane. The geometry is built in the XY plane (rotate the mesh
 * by -PI/2 on X to lay it into the ecliptic) and its UVs are rewritten so the
 * 8192x500 ring strip samples radially.
 *
 * `planetRadius` defaults to a plausible fraction of the inner radius; set
 * `mesh.material.uniforms.planetRadius.value` to the real planet radius for an
 * exact shadow.
 *
 * Depth handling is the subtle part. The plane is alpha-blended, but it also
 * writes depth so that transparent geometry queued behind it — the additive
 * starfield above all — cannot shine through the optically thick bands. That is
 * only safe because the shader discards every fragment thin enough to count as
 * empty space before it can claim a depth value; an earlier revision instead
 * carried a separate alpha-tested depth-only pass, whose slightly different
 * vertex maths z-fought the shaded pass and tore black flakes out of the rings.
 *
 * @param {number} innerR inner ring radius in scene units
 * @param {number} outerR outer ring radius in scene units
 * @param {THREE.Texture} ringTexture RGBA strip, alpha = particle density
 * @returns {THREE.Mesh} uniforms: ringMap, sunDirection, planetRadius, innerR, outerR
 */
export function createSaturnRings( innerR, outerR, ringTexture ) {

	const geometry = new THREE.RingGeometry( innerR, outerR, 256, 8 );

	// RingGeometry's default UVs are a planar projection of the disc; remap so
	// that u is the normalised radius and v parks in the middle of the strip.
	const position = geometry.attributes.position;
	const uv = geometry.attributes.uv;
	const span = Math.max( outerR - innerR, 1e-6 );

	for ( let i = 0; i < position.count; i ++ ) {

		const radius = Math.hypot( position.getX( i ), position.getY( i ) );
		uv.setXY( i, THREE.MathUtils.clamp( ( radius - innerR ) / span, 0, 1 ), 0.5 );

	}

	uv.needsUpdate = true;

	const material = new THREE.ShaderMaterial( {
		name: 'SaturnRingMaterial',
		uniforms: {
			ringMap: { value: ringTexture },
			sunDirection: { value: new THREE.Vector3( 1, 0, 0 ) },
			planetRadius: { value: innerR * 0.8 },
			innerR: { value: innerR },
			outerR: { value: outerR }
		},
		vertexShader: CENTERED_WORLD_VERTEX_SHADER,
		fragmentShader: RING_FRAGMENT_SHADER,
		side: THREE.DoubleSide,
		blending: THREE.NormalBlending,
		transparent: true,
		// Safe only in combination with the shader's alpha discard — see the
		// note in the doc comment above.
		depthWrite: true,
		depthTest: true
	} );

	const mesh = new THREE.Mesh( geometry, material );
	mesh.name = 'SaturnRings';
	mesh.renderOrder = 3;

	return mesh;

}

// ---------------------------------------------------------------------------
// Cloud shell
// ---------------------------------------------------------------------------

/**
 * Translucent cloud shell for Earth. Uses a standard material so the scene's
 * point light gives the clouds the same terminator as the surface below.
 *
 * @param {number} radius planet radius in scene units
 * @param {THREE.Texture} cloudTexture greyscale cloud map (sRGB)
 * @returns {THREE.Mesh}
 */
export function createCloudSphere( radius, cloudTexture ) {

	const geometry = new THREE.SphereGeometry( radius * 1.006, 96, 96 );

	// The map doubles as the opacity source, so pin the colour space here: the
	// alpha maths below assumes the sampler hands back linearised texels.
	cloudTexture.colorSpace = THREE.SRGBColorSpace;

	const material = new THREE.MeshStandardMaterial( {
		name: 'CloudMaterial',
		map: cloudTexture,
		alphaMap: cloudTexture,
		// Clouds are the brightest thing on Earth; push past white to make up
		// for the 1/PI in the diffuse BRDF and to feed a little bloom.
		color: new THREE.Color( 1.32, 1.32, 1.36 ),
		roughness: 1.0,
		metalness: 0.0,
		transparent: true,
		opacity: 0.9,
		depthWrite: false
	} );

	material.onBeforeCompile = ( shader ) => {

		shader.fragmentShader = shader.fragmentShader.replace(
			'#include <alphamap_fragment>',
			/* glsl */ `
			vec4 cloudTexel = texture2D( alphaMap, vAlphaMapUv );
			float cloudDensity = max( cloudTexel.r, max( cloudTexel.g, cloudTexel.b ) );
			// Re-apply the perceptual curve the sRGB sampler removed, otherwise
			// every wisp of cirrus collapses to nothing.
			cloudDensity = pow( clamp( cloudDensity, 0.0, 1.0 ), 0.4545 );
			diffuseColor.a *= smoothstep( 0.03, 0.55, cloudDensity );
			`
		);

	};

	// Keep this variant in its own program slot so it can never be handed a
	// cached program compiled from an unmodified MeshStandardMaterial.
	material.customProgramCacheKey = () => 'cloud-sphere-luminance-alpha';

	const mesh = new THREE.Mesh( geometry, material );
	mesh.name = 'CloudSphere';
	mesh.renderOrder = 1;

	return mesh;

}
