/**
 * Galaxy Background — Stellaris Edition
 * Three.js WebGL renderer with:
 *   - Voronoi-tessellated territory nebula shader (every pixel belongs to a cluster)
 *   - Territory border glow + galactic core void
 *   - Multi-octave FBM for oil-painting nebula richness
 *   - Dense territory-local star particles (~300 per cluster, multi-colored)
 *   - Dense hyperlane web connecting stars
 *   - HDR bloom, parallax star layers, warp effects, fog of war
 */

import type { SkillCluster } from '../data/skilltree';

export interface TerritoryStarData {
  x: number;
  y: number;
  clusterId: string;
  size: number;
}

export interface GalaxyBG {
  update(time: number): void;
  resize(w: number, h: number): void;
  setMousePosition(x: number, y: number): void;
  setWarpIntensity(value: number): void;
  setFogOfWar(activeClusterId: string | null): void;
  setBaseBrightness(values: number[]): void;
  getTerritoryStars(): TerritoryStarData[];
}

// Secondary colors for within-territory color variation (oil-painting depth)
const SECONDARY_COLORS: Record<string, string> = {
  physics:     '#2890b8',
  math:        '#b89830',
  cs:          '#30a050',
  aiml:        '#b83838',
  engineering: '#28a0a0',
  data:        '#9030b8',
  business:    '#b86828',
};

function hexToRgb(hex: string): [number, number, number] {
  return [
    parseInt(hex.slice(1, 3), 16) / 255,
    parseInt(hex.slice(3, 5), 16) / 255,
    parseInt(hex.slice(5, 7), 16) / 255,
  ];
}

export function createGalaxyBackground(
  container: HTMLElement,
  clusters: SkillCluster[],
  width: number,
  height: number,
): GalaxyBG {
  let w = width;
  let h = height;
  let mouseX = 0;
  let mouseY = 0;
  let smoothMouseX = 0;
  let smoothMouseY = 0;
  let warpTarget = 0;
  let warpCurrent = 0;

  // Compute cluster positions in normalized UV space
  const clusterUVs: [number, number][] = [];
  const clusterColors: [number, number, number][] = [];
  const clusterSecondaryColors: [number, number, number][] = [];
  const fogMask: number[] = [];

  const cx = w / 2;
  const cy = h / 2;
  const scale = Math.min(w, h) / 800;

  for (const cluster of clusters) {
    const nx = cx + Math.cos(cluster.angle) * cluster.radius * scale;
    const ny = cy + Math.sin(cluster.angle) * cluster.radius * scale;
    clusterUVs.push([nx / w, ny / h]);
    clusterColors.push(hexToRgb(cluster.nebulaColor));
    clusterSecondaryColors.push(hexToRgb(SECONDARY_COLORS[cluster.id] || cluster.nebulaColor));
    fogMask.push(1.0);
  }

  // Pad to 7 entries
  while (clusterUVs.length < 7) {
    clusterUVs.push([0, 0]);
    clusterColors.push([0, 0, 0]);
    clusterSecondaryColors.push([0, 0, 0]);
    fogMask.push(0.0);
  }

  // Territory-local stars (generated once, reused)
  const territoryStars: TerritoryStarData[] = [];

  function generateTerritoryStars() {
    territoryStars.length = 0;
    const starScale = Math.min(w, h) / 800;
    const centerX = w / 2;
    const centerY = h / 2;

    // Star color distribution: 60% white, 15% yellow, 10% blue, 10% green, 5% red
    const colorWeights = [0.6, 0.15, 0.10, 0.10, 0.05];

    for (const cluster of clusters) {
      const clCx = centerX + Math.cos(cluster.angle) * cluster.radius * starScale;
      const clCy = centerY + Math.sin(cluster.angle) * cluster.radius * starScale;
      const spreadRadius = 180 * starScale;

      for (let i = 0; i < 500; i++) {
        // Distribute within territory with gaussian-like falloff
        const angle = Math.random() * Math.PI * 2;
        const r = spreadRadius * Math.sqrt(Math.random()) * (0.4 + Math.random() * 0.6);
        const sx = clCx + Math.cos(angle) * r;
        const sy = clCy + Math.sin(angle) * r;

        // Size distribution: mostly tiny, some medium, rare bright
        let size: number;
        const sizeRoll = Math.random();
        if (sizeRoll < 0.7) size = 0.5 + Math.random() * 1.5; // tiny
        else if (sizeRoll < 0.92) size = 2.0 + Math.random() * 2.0; // medium
        else size = 4.0 + Math.random() * 2.0; // bright

        territoryStars.push({ x: sx, y: sy, clusterId: cluster.id, size });
      }
    }
  }

  generateTerritoryStars();

  // ── Three.js setup (lazy loaded) ─────────────────────────────
  let ready = false;
  let bloomPassRef: any = null;
  let starMaterials: any[] = [];
  let territoryStarMaterialRef: any = null;
  let hyperlaneMaterialRef: any = null;

  let uTime: any = null;
  let uFogMask: any = null;
  let composerRef: any = null;
  let rendererRef: any = null;

  Promise.all([
    import('three'),
    import('three/examples/jsm/postprocessing/EffectComposer.js'),
    import('three/examples/jsm/postprocessing/RenderPass.js'),
    import('three/examples/jsm/postprocessing/UnrealBloomPass.js'),
    import('three/examples/jsm/postprocessing/OutputPass.js'),
  ]).then(([THREE, { EffectComposer }, { RenderPass }, { UnrealBloomPass }, { OutputPass }]) => {
    // ── Renderer ────────────────────────────────────────────
    const dpr = Math.min(window.devicePixelRatio, 1.5);
    const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false });
    renderer.setPixelRatio(dpr);
    renderer.setSize(w, h);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.domElement.style.position = 'absolute';
    renderer.domElement.style.top = '0';
    renderer.domElement.style.left = '0';
    renderer.domElement.style.zIndex = '0';
    renderer.domElement.style.pointerEvents = 'none';
    container.insertBefore(renderer.domElement, container.firstChild);
    rendererRef = renderer;

    const camera = new THREE.OrthographicCamera(0, w, 0, -h, -1000, 1000);
    camera.position.z = 500;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#050710');

    // ── Bloom pipeline ──────────────────────────────────────
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));

    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(w, h),
      0.5,   // strength (subtle baseline, Stellaris relies on nebula color not bloom)
      0.4,   // radius
      0.82,  // threshold
    );
    composer.addPass(bloomPass);
    composer.addPass(new OutputPass());
    bloomPassRef = bloomPass;
    composerRef = composer;

    // ═══════════════════════════════════════════════════════════
    // VORONOI TERRITORY NEBULA SHADER
    // Every pixel belongs to the closest cluster. Rich FBM nebula
    // painting with border glow and galactic core void.
    // ═══════════════════════════════════════════════════════════

    const nebulaVertShader = `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;

    const nebulaFragShader = `
      precision highp float;
      varying vec2 vUv;
      uniform float uTime;
      uniform vec2 uClusterPositions[7];
      uniform vec3 uClusterColors[7];
      uniform vec3 uClusterSecondaryColors[7];
      uniform float uFogMask[7];
      uniform int uClusterCount;

      // ── Noise functions ──────────────────────────────────
      vec3 mod289v3(vec3 x) { return x - floor(x * (1.0/289.0)) * 289.0; }
      vec2 mod289v2(vec2 x) { return x - floor(x * (1.0/289.0)) * 289.0; }
      vec3 permute(vec3 x) { return mod289v3(((x*34.0)+1.0)*x); }

      float snoise(vec2 v) {
        const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                           -0.577350269189626, 0.024390243902439);
        vec2 i = floor(v + dot(v, C.yy));
        vec2 x0 = v - i + dot(i, C.xx);
        vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
        vec4 x12 = x0.xyxy + C.xxzz;
        x12.xy -= i1;
        i = mod289v2(i);
        vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
        vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
        m = m*m; m = m*m;
        vec3 x = 2.0 * fract(p * C.www) - 1.0;
        vec3 h = abs(x) - 0.5;
        vec3 ox = floor(x + 0.5);
        vec3 a0 = x - ox;
        m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
        vec3 g;
        g.x = a0.x * x0.x + h.x * x0.y;
        g.yz = a0.yz * x12.xz + h.yz * x12.yw;
        return 130.0 * dot(m, g);
      }

      // Multi-octave FBM for rich cloud textures
      float fbm(vec2 p) {
        float f = 0.0;
        float amp = 0.5;
        for (int i = 0; i < 5; i++) {
          f += amp * snoise(p);
          p *= 2.1;
          amp *= 0.42;
        }
        return f;
      }

      // Warped FBM for organic territory shapes
      float warpedFbm(vec2 p, float t) {
        vec2 q = vec2(fbm(p + vec2(0.0, 0.0) + t * 0.1),
                      fbm(p + vec2(5.2, 1.3) + t * 0.12));
        return fbm(p + 2.0 * q);
      }

      void main() {
        vec2 uv = vUv;
        float t = uTime * 0.04;

        // ── Voronoi: find nearest and 2nd nearest cluster ──
        float d1 = 99.0;  // nearest distance
        float d2 = 99.0;  // 2nd nearest distance
        int nearest = 0;
        int secondNearest = 0;

        for (int i = 0; i < 7; i++) {
          if (i >= uClusterCount) break;
          vec2 cPos = uClusterPositions[i];

          // Noise-warp the cluster position for organic territory shapes
          vec2 warpSeed = cPos * 4.0 + vec2(float(i) * 2.1, float(i) * 3.7);
          float wx = fbm(warpSeed + t * 0.15) * 0.06;
          float wy = fbm(warpSeed + vec2(3.3, 7.1) + t * 0.12) * 0.06;
          vec2 warpedPos = cPos + vec2(wx, wy);

          float d = length(uv - warpedPos);

          if (d < d1) {
            d2 = d1;
            secondNearest = nearest;
            d1 = d;
            nearest = i;
          } else if (d < d2) {
            d2 = d;
            secondNearest = i;
          }
        }

        // Distance to Voronoi border
        float borderDist = d2 - d1;

        // ── Territory nebula color ─────────────────────────
        vec3 primaryCol = uClusterColors[nearest];
        vec3 secondaryCol = uClusterSecondaryColors[nearest];

        // Multi-layer FBM for oil-painting cloud wisps
        vec2 nebulaUV = uv * 4.0 + vec2(float(nearest) * 1.7, float(nearest) * 2.3);
        float cloud1 = fbm(nebulaUV + t * 0.2) * 0.5 + 0.5;
        float cloud2 = fbm(nebulaUV * 2.3 + vec2(3.1, 7.2) + t * 0.15) * 0.5 + 0.5;
        float cloud3 = warpedFbm(uv * 6.0 + vec2(float(nearest) * 4.3), t);
        float cloudMix = cloud3 * 0.5 + 0.5;

        // Blend primary and secondary colors within territory
        vec3 territoryColor = mix(primaryCol, secondaryCol, cloud1 * 0.6);
        territoryColor = mix(territoryColor, primaryCol * 1.3, cloud2 * 0.3);

        // Intensity varies across territory (0.3 - 0.95) for rich Stellaris look
        float baseIntensity = 0.30 + cloud1 * 0.30 + cloud2 * 0.20 + cloudMix * 0.15;

        // Fade intensity near territory borders for softer transitions
        float borderFade = smoothstep(0.0, 0.06, borderDist);
        baseIntensity *= mix(0.5, 1.0, borderFade);

        // Fog of war
        baseIntensity *= uFogMask[nearest];

        vec3 nebulaColor = territoryColor * baseIntensity;

        // ── Territory border glow ──────────────────────────
        // Visible glowing line where territories meet (Stellaris border style)
        float borderLine = smoothstep(0.03, 0.0, borderDist) * 0.55;
        vec3 borderColor = mix(uClusterColors[nearest], uClusterColors[secondNearest], 0.5);
        // Modulate border brightness with fog
        float borderFog = min(uFogMask[nearest], uFogMask[secondNearest]);
        nebulaColor += borderColor * borderLine * borderFog;

        // ── Galactic core void ─────────────────────────────
        // Dark void at center with warm orange-yellow glow edge
        vec2 center = vec2(0.5, 0.5);
        float coreDist = length(uv - center);
        // Noise-warped void radius for organic shape (larger, like Stellaris black hole)
        float coreNoise = fbm(uv * 6.0 + t * 0.3) * 0.04;
        float coreRadius = 0.10 + coreNoise;

        // Darken inside the core
        float coreDarken = smoothstep(coreRadius + 0.04, coreRadius - 0.02, coreDist);
        nebulaColor *= 1.0 - coreDarken * 0.92;

        // Warm glow at core edge (brighter orange-yellow like Stellaris)
        float coreEdge = smoothstep(coreRadius + 0.08, coreRadius, coreDist)
                       * smoothstep(coreRadius - 0.03, coreRadius + 0.02, coreDist);
        vec3 coreGlow = vec3(1.0, 0.7, 0.25) * coreEdge * 0.45;
        nebulaColor += coreGlow;

        // ── Deep space base (subtle) ───────────────────────
        float vignette = smoothstep(0.0, 0.9, length(uv - 0.5));
        vec3 base = mix(vec3(0.02, 0.018, 0.035), vec3(0.008, 0.008, 0.02), vignette);

        vec3 finalColor = base + nebulaColor;
        gl_FragColor = vec4(finalColor, 1.0);
      }
    `;

    const nebulaUniforms = {
      uTime: { value: 0 },
      uClusterPositions: { value: clusterUVs.map(p => new THREE.Vector2(p[0], p[1])) },
      uClusterColors: { value: clusterColors.map(c => new THREE.Vector3(c[0], c[1], c[2])) },
      uClusterSecondaryColors: { value: clusterSecondaryColors.map(c => new THREE.Vector3(c[0], c[1], c[2])) },
      uFogMask: { value: fogMask.slice() },
      uClusterCount: { value: Math.min(clusters.length, 7) },
    };

    uTime = nebulaUniforms.uTime;
    uFogMask = nebulaUniforms.uFogMask;

    const nebulaMat = new THREE.ShaderMaterial({
      vertexShader: nebulaVertShader,
      fragmentShader: nebulaFragShader,
      uniforms: nebulaUniforms,
      depthWrite: false,
      transparent: false,
    });

    const nebulaGeo = new THREE.PlaneGeometry(w, h);
    const nebulaMesh = new THREE.Mesh(nebulaGeo, nebulaMat);
    nebulaMesh.position.set(w / 2, -h / 2, -800);
    scene.add(nebulaMesh);

    // ── Grid lines (subtle hex-grid feel) ─────────────────────
    const gridPositions: number[] = [];
    const gridSpacing = 80;
    for (let x = 0; x < w; x += gridSpacing) {
      gridPositions.push(x, 0, -500, x, -h, -500);
    }
    for (let y = 0; y < h; y += gridSpacing) {
      gridPositions.push(0, -y, -500, w, -y, -500);
    }

    const gridGeo = new THREE.BufferGeometry();
    gridGeo.setAttribute('position', new THREE.Float32BufferAttribute(gridPositions, 3));
    const gridMat = new THREE.LineBasicMaterial({
      color: 0x8888cc,
      transparent: true,
      opacity: 0.02,
    });
    scene.add(new THREE.LineSegments(gridGeo, gridMat));

    // ═══════════════════════════════════════════════════════════
    // BACKGROUND STAR PARTICLES (3 parallax layers)
    // ═══════════════════════════════════════════════════════════

    const starLayers = [
      { count: 400, z: -600, sizeMin: 0.4, sizeMax: 1.2, brightnessMax: 0.8, parallax: 0.02 },
      { count: 200, z: -300, sizeMin: 0.8, sizeMax: 2.0, brightnessMax: 1.0, parallax: 0.05 },
      { count: 80,  z: -100, sizeMin: 1.5, sizeMax: 3.5, brightnessMax: 1.5, parallax: 0.1 },
    ];

    const bgStarVertShader = `
      attribute float aSize;
      attribute float aBrightness;
      attribute float aPhase;
      attribute float aSpeed;
      uniform float uTime;
      uniform float uWarpIntensity;
      uniform vec2 uMouseOffset;
      uniform float uParallaxFactor;
      varying float vBrightness;
      varying float vAlpha;

      void main() {
        float twinkle = sin(uTime * aSpeed + aPhase);
        vAlpha = aBrightness * (0.5 + 0.5 * twinkle);
        vBrightness = aBrightness;

        vec3 pos = position;
        pos.xy += uMouseOffset * uParallaxFactor * 30.0;

        float warpScale = 1.0 + uWarpIntensity * 2.0;
        float sz = aSize * warpScale;

        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        gl_PointSize = sz * 2.0;
        gl_Position = projectionMatrix * mvPosition;
      }
    `;

    const bgStarFragShader = `
      precision highp float;
      varying float vBrightness;
      varying float vAlpha;

      void main() {
        vec2 coord = gl_PointCoord - 0.5;
        float dist = length(coord);
        if (dist > 0.5) discard;

        float coreFalloff = 1.0 - smoothstep(0.0, 0.5, dist);
        float hdrCore = coreFalloff * coreFalloff;
        float hdr = vBrightness * hdrCore * 1.8;
        vec3 color = vec3(0.78, 0.82, 0.90);
        gl_FragColor = vec4(color * hdr, vAlpha * coreFalloff);
      }
    `;

    for (const layer of starLayers) {
      const positions: number[] = [];
      const sizes: number[] = [];
      const brightnesses: number[] = [];
      const phases: number[] = [];
      const speeds: number[] = [];

      for (let i = 0; i < layer.count; i++) {
        positions.push(Math.random() * w, -Math.random() * h, layer.z);
        sizes.push(layer.sizeMin + Math.random() * (layer.sizeMax - layer.sizeMin));
        brightnesses.push(0.2 + Math.random() * layer.brightnessMax);
        phases.push(Math.random() * Math.PI * 2);
        speeds.push(0.3 + Math.random() * 0.7);
      }

      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      geo.setAttribute('aSize', new THREE.Float32BufferAttribute(sizes, 1));
      geo.setAttribute('aBrightness', new THREE.Float32BufferAttribute(brightnesses, 1));
      geo.setAttribute('aPhase', new THREE.Float32BufferAttribute(phases, 1));
      geo.setAttribute('aSpeed', new THREE.Float32BufferAttribute(speeds, 1));

      const mat = new THREE.ShaderMaterial({
        vertexShader: bgStarVertShader,
        fragmentShader: bgStarFragShader,
        uniforms: {
          uTime: { value: 0 },
          uWarpIntensity: { value: 0 },
          uMouseOffset: { value: new THREE.Vector2(0, 0) },
          uParallaxFactor: { value: layer.parallax },
        },
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });

      scene.add(new THREE.Points(geo, mat));
      starMaterials.push(mat);
    }

    // ═══════════════════════════════════════════════════════════
    // TERRITORY-LOCAL STAR PARTICLES (~2100 stars)
    // Multi-colored twinkling stars within each territory
    // ═══════════════════════════════════════════════════════════

    const tStarVertShader = `
      attribute float aSize;
      attribute float aBrightness;
      attribute float aPhase;
      attribute float aSpeed;
      attribute vec3 aColor;
      attribute float aClusterIdx;
      uniform float uTime;
      uniform float uWarpIntensity;
      uniform float uFogMaskStars[7];
      varying float vBrightness;
      varying float vAlpha;
      varying vec3 vColor;

      float getFogStar(int idx) {
        if (idx == 0) return uFogMaskStars[0];
        if (idx == 1) return uFogMaskStars[1];
        if (idx == 2) return uFogMaskStars[2];
        if (idx == 3) return uFogMaskStars[3];
        if (idx == 4) return uFogMaskStars[4];
        if (idx == 5) return uFogMaskStars[5];
        return uFogMaskStars[6];
      }

      void main() {
        float fog = getFogStar(int(aClusterIdx));

        float twinkle = sin(uTime * aSpeed + aPhase);
        vAlpha = aBrightness * (0.45 + 0.55 * twinkle) * fog;
        vBrightness = aBrightness * fog;
        vColor = aColor;

        float warpScale = 1.0 + uWarpIntensity * 1.5;
        float sz = aSize * warpScale * fog;

        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = sz * 2.0;
        gl_Position = projectionMatrix * mvPosition;
      }
    `;

    const tStarFragShader = `
      precision highp float;
      varying float vBrightness;
      varying float vAlpha;
      varying vec3 vColor;

      void main() {
        vec2 coord = gl_PointCoord - 0.5;
        float dist = length(coord);
        if (dist > 0.5) discard;
        if (vAlpha < 0.01) discard;

        float coreFalloff = 1.0 - smoothstep(0.0, 0.5, dist);
        float hdrCore = coreFalloff * coreFalloff;
        float hdr = vBrightness * hdrCore * 2.0;
        gl_FragColor = vec4(vColor * hdr, vAlpha * coreFalloff);
      }
    `;

    // Star color palette matching Stellaris
    const STAR_COLORS = [
      [1.0, 1.0, 1.0],     // white (60%)
      [1.0, 0.95, 0.7],    // yellow (15%)
      [0.6, 0.75, 1.0],    // blue (10%)
      [0.6, 1.0, 0.7],     // green (10%)
      [1.0, 0.5, 0.4],     // red (5%)
    ];
    const COLOR_THRESHOLDS = [0.6, 0.75, 0.85, 0.95, 1.0];

    // Cluster ID → index map for shader fog lookup
    const clusterIdxMap = new Map(clusters.map((c, i) => [c.id, i]));

    {
      const positions: number[] = [];
      const sizes: number[] = [];
      const brightnesses: number[] = [];
      const phases: number[] = [];
      const speeds: number[] = [];
      const colors: number[] = [];
      const clusterIndices: number[] = [];

      for (const star of territoryStars) {
        positions.push(star.x, -star.y, -200);
        sizes.push(star.size);
        brightnesses.push(0.3 + Math.random() * 0.9);
        phases.push(Math.random() * Math.PI * 2);
        speeds.push(0.2 + Math.random() * 0.8);
        clusterIndices.push(clusterIdxMap.get(star.clusterId) ?? 0);

        // Pick color from Stellaris distribution
        const roll = Math.random();
        let colorIdx = 0;
        for (let c = 0; c < COLOR_THRESHOLDS.length; c++) {
          if (roll < COLOR_THRESHOLDS[c]) { colorIdx = c; break; }
        }
        const sc = STAR_COLORS[colorIdx];
        colors.push(sc[0], sc[1], sc[2]);
      }

      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      geo.setAttribute('aSize', new THREE.Float32BufferAttribute(sizes, 1));
      geo.setAttribute('aBrightness', new THREE.Float32BufferAttribute(brightnesses, 1));
      geo.setAttribute('aPhase', new THREE.Float32BufferAttribute(phases, 1));
      geo.setAttribute('aSpeed', new THREE.Float32BufferAttribute(speeds, 1));
      geo.setAttribute('aColor', new THREE.Float32BufferAttribute(colors, 3));
      geo.setAttribute('aClusterIdx', new THREE.Float32BufferAttribute(clusterIndices, 1));

      const mat = new THREE.ShaderMaterial({
        vertexShader: tStarVertShader,
        fragmentShader: tStarFragShader,
        uniforms: {
          uTime: { value: 0 },
          uWarpIntensity: { value: 0 },
          uFogMaskStars: { value: Array.from(baseBrightness) },
        },
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });

      scene.add(new THREE.Points(geo, mat));
      territoryStarMaterialRef = mat;
    }

    // ═══════════════════════════════════════════════════════════
    // DENSE HYPERLANE WEB
    // Nearest-neighbor connections between territory stars
    // ═══════════════════════════════════════════════════════════

    {
      // Build spatial index per cluster for efficient neighbor lookup
      const clusterStarMap = new Map<string, TerritoryStarData[]>();
      for (const star of territoryStars) {
        if (!clusterStarMap.has(star.clusterId)) clusterStarMap.set(star.clusterId, []);
        clusterStarMap.get(star.clusterId)!.push(star);
      }

      const lanePositions: number[] = [];
      const laneColors: number[] = [];
      const laneClusterIndices: number[] = [];

      // For each star, connect to 2 nearest neighbors in same cluster
      for (const [clusterId, stars] of clusterStarMap) {
        const cluster = clusters.find(c => c.id === clusterId);
        const col = cluster ? hexToRgb(cluster.color) : [0.5, 0.5, 0.5] as [number, number, number];
        const ci = clusterIdxMap.get(clusterId) ?? 0;

        // Connect every 2nd star for dense Stellaris-style web
        for (let i = 0; i < stars.length; i += 2) {
          const star = stars[i];
          let nearest1Dist = Infinity, nearest2Dist = Infinity;
          let nearest1Idx = -1, nearest2Idx = -1;

          for (let j = 0; j < stars.length; j++) {
            if (i === j) continue;
            const dx = star.x - stars[j].x;
            const dy = star.y - stars[j].y;
            const d = dx * dx + dy * dy;
            if (d < nearest1Dist) {
              nearest2Dist = nearest1Dist;
              nearest2Idx = nearest1Idx;
              nearest1Dist = d;
              nearest1Idx = j;
            } else if (d < nearest2Dist) {
              nearest2Dist = d;
              nearest2Idx = j;
            }
          }

          // Only connect if within reasonable distance
          const maxDist = 80 * scale;
          const maxDistSq = maxDist * maxDist;

          if (nearest1Idx >= 0 && nearest1Dist < maxDistSq) {
            const n1 = stars[nearest1Idx];
            lanePositions.push(star.x, -star.y, -200, n1.x, -n1.y, -200);
            laneColors.push(col[0], col[1], col[2], col[0], col[1], col[2]);
            laneClusterIndices.push(ci, ci);
          }
          if (nearest2Idx >= 0 && nearest2Dist < maxDistSq) {
            const n2 = stars[nearest2Idx];
            lanePositions.push(star.x, -star.y, -200, n2.x, -n2.y, -200);
            laneColors.push(col[0], col[1], col[2], col[0], col[1], col[2]);
            laneClusterIndices.push(ci, ci);
          }
        }
      }

      if (lanePositions.length > 0) {
        const laneVertShader = `
          attribute vec3 color;
          attribute float aClusterIdx;
          uniform float uFogMaskLanes[7];
          varying vec3 vColor;
          varying float vFog;

          float getFogLane(int idx) {
            if (idx == 0) return uFogMaskLanes[0];
            if (idx == 1) return uFogMaskLanes[1];
            if (idx == 2) return uFogMaskLanes[2];
            if (idx == 3) return uFogMaskLanes[3];
            if (idx == 4) return uFogMaskLanes[4];
            if (idx == 5) return uFogMaskLanes[5];
            return uFogMaskLanes[6];
          }

          void main() {
            vFog = getFogLane(int(aClusterIdx));
            vColor = color;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `;

        const laneFragShader = `
          precision highp float;
          varying vec3 vColor;
          varying float vFog;

          void main() {
            if (vFog < 0.01) discard;
            gl_FragColor = vec4(vColor * vFog, 0.15 * vFog);
          }
        `;

        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute(lanePositions, 3));
        geo.setAttribute('color', new THREE.Float32BufferAttribute(laneColors, 3));
        geo.setAttribute('aClusterIdx', new THREE.Float32BufferAttribute(laneClusterIndices, 1));

        const mat = new THREE.ShaderMaterial({
          vertexShader: laneVertShader,
          fragmentShader: laneFragShader,
          uniforms: {
            uFogMaskLanes: { value: Array.from(baseBrightness) },
          },
          transparent: true,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        });

        scene.add(new THREE.LineSegments(geo, mat));
        hyperlaneMaterialRef = mat;
      }
    }

    // ── Resize handler ──────────────────────────────────────
    const resizeInternal = (newW: number, newH: number) => {
      camera.right = newW;
      camera.bottom = -newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
      composer.setSize(newW, newH);
      bloomPass.resolution.set(newW, newH);

      nebulaMesh.geometry.dispose();
      nebulaMesh.geometry = new THREE.PlaneGeometry(newW, newH);
      nebulaMesh.position.set(newW / 2, -newH / 2, -800);

      const ncx = newW / 2;
      const ncy = newH / 2;
      const ns = Math.min(newW, newH) / 800;
      for (let i = 0; i < clusters.length && i < 7; i++) {
        const nx = ncx + Math.cos(clusters[i].angle) * clusters[i].radius * ns;
        const ny = ncy + Math.sin(clusters[i].angle) * clusters[i].radius * ns;
        nebulaUniforms.uClusterPositions.value[i].set(nx / newW, ny / newH);
      }
    };

    (renderer as any).__resizeFn = resizeInternal;

    // Re-apply baseBrightness that may have been set before Three.js loaded
    syncFogToStarsAndLanes(Array.from(baseBrightness));
    if (uFogMask) {
      for (let i = 0; i < 7; i++) {
        uFogMask.value[i] = baseBrightness[i];
      }
    }

    ready = true;
  });

  // ── Public API ──────────────────────────────────────────────

  function update(time: number) {
    if (!ready) return;

    smoothMouseX += (mouseX - smoothMouseX) * 0.05;
    smoothMouseY += (mouseY - smoothMouseY) * 0.05;
    warpCurrent += (warpTarget - warpCurrent) * 0.08;

    const t = time * 0.001;

    if (uTime) uTime.value = t;

    for (const mat of starMaterials) {
      mat.uniforms.uTime.value = t;
      mat.uniforms.uWarpIntensity.value = warpCurrent;
      mat.uniforms.uMouseOffset.value.set(smoothMouseX, smoothMouseY);
    }

    if (territoryStarMaterialRef) {
      territoryStarMaterialRef.uniforms.uTime.value = t;
      territoryStarMaterialRef.uniforms.uWarpIntensity.value = warpCurrent;
    }

    if (bloomPassRef) {
      bloomPassRef.strength = 0.5 + Math.min(1, warpCurrent) * 0.8;
    }

    if (composerRef) {
      composerRef.render();
    }
  }

  function resize(newW: number, newH: number) {
    w = newW;
    h = newH;
    if (rendererRef && (rendererRef as any).__resizeFn) {
      (rendererRef as any).__resizeFn(newW, newH);
    }
  }

  function setMousePosition(x: number, y: number) {
    mouseX = (x / w - 0.5) * 2;
    mouseY = (y / h - 0.5) * 2;
  }

  function setWarpIntensity(value: number) {
    warpTarget = Math.max(0, Math.min(1, value));
  }

  const baseBrightness = new Float32Array(7).fill(1.0);

  /** Propagate fog values to territory star + hyperlane shaders */
  function syncFogToStarsAndLanes(values: number[]) {
    if (territoryStarMaterialRef?.uniforms?.uFogMaskStars) {
      for (let i = 0; i < 7; i++) {
        territoryStarMaterialRef.uniforms.uFogMaskStars.value[i] = values[i];
      }
    }
    if (hyperlaneMaterialRef?.uniforms?.uFogMaskLanes) {
      for (let i = 0; i < 7; i++) {
        hyperlaneMaterialRef.uniforms.uFogMaskLanes.value[i] = values[i];
      }
    }
  }

  function setBaseBrightness(values: number[]) {
    for (let i = 0; i < Math.min(values.length, 7); i++) {
      baseBrightness[i] = values[i];
    }
    // Apply immediately when no active fog-of-war selection
    if (uFogMask) {
      for (let i = 0; i < 7; i++) {
        uFogMask.value[i] = baseBrightness[i];
      }
    }
    syncFogToStarsAndLanes(Array.from(baseBrightness));
  }

  function setFogOfWar(activeClusterId: string | null) {
    if (!uFogMask) return;
    const fogValues: number[] = [];
    for (let i = 0; i < clusters.length && i < 7; i++) {
      if (activeClusterId === null) {
        uFogMask.value[i] = baseBrightness[i];
        fogValues.push(baseBrightness[i]);
      } else {
        const val = clusters[i].id === activeClusterId ? 1.0 : 0.12;
        uFogMask.value[i] = val;
        fogValues.push(val);
      }
    }
    syncFogToStarsAndLanes(fogValues);
  }

  function getTerritoryStars(): TerritoryStarData[] {
    return territoryStars;
  }

  return { update, resize, setMousePosition, setWarpIntensity, setFogOfWar, setBaseBrightness, getTerritoryStars };
}
