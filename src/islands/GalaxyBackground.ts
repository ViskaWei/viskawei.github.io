/**
 * Galaxy Background — Three.js WebGL renderer with HDR bloom, procedural nebulae,
 * parallax star particles, warp effects, and fog of war.
 * Replaces Canvas 2D with a Stellaris-level deep space backdrop.
 */

import type { SkillCluster } from '../data/skilltree';

export interface GalaxyBG {
  update(time: number): void;
  resize(w: number, h: number): void;
  setMousePosition(x: number, y: number): void;
  setWarpIntensity(value: number): void;
  setFogOfWar(activeClusterId: string | null): void;
}

export function createGalaxyBackground(
  container: HTMLElement,
  clusters: SkillCluster[],
  width: number,
  height: number,
): GalaxyBG {
  // State
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
  const fogMask: number[] = [];

  const cx = w / 2;
  const cy = h / 2;
  const scale = Math.min(w, h) / 800;

  for (const cluster of clusters) {
    const nx = cx + Math.cos(cluster.angle) * cluster.radius * scale;
    const ny = cy + Math.sin(cluster.angle) * cluster.radius * scale;
    clusterUVs.push([nx / w, ny / h]);

    // Parse nebulaColor hex to RGB floats
    const r = parseInt(cluster.nebulaColor.slice(1, 3), 16) / 255;
    const g = parseInt(cluster.nebulaColor.slice(3, 5), 16) / 255;
    const b = parseInt(cluster.nebulaColor.slice(5, 7), 16) / 255;
    clusterColors.push([r, g, b]);
    fogMask.push(1.0);
  }

  // Pad to 7 entries (uniform arrays need fixed size)
  while (clusterUVs.length < 7) {
    clusterUVs.push([0, 0]);
    clusterColors.push([0, 0, 0]);
    fogMask.push(0.0);
  }

  // ── Three.js setup (lazy loaded) ─────────────────────────────
  let ready = false;
  let bloomPassRef: any = null;
  let starMaterials: any[] = [];
  let starGroups: any[] = [];

  // Uniform refs
  let uTime: any = null;
  let uFogMask: any = null;
  let uWarpIntensity: any = null;
  let uMouseOffset: any = null;
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

    // ── Camera: orthographic mapped to pixel coords ─────────
    // left=0, right=w, top=0, bottom=-h, near=-1000, far=1000
    const camera = new THREE.OrthographicCamera(0, w, 0, -h, -1000, 1000);
    camera.position.z = 500;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#050710');

    // ── Bloom pipeline ──────────────────────────────────────
    const composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(w, h),
      0.8,   // strength
      0.4,   // radius
      0.85,  // threshold
    );
    composer.addPass(bloomPass);
    composer.addPass(new OutputPass());
    bloomPassRef = bloomPass;
    composerRef = composer;

    // ── Nebula fullscreen quad ──────────────────────────────
    const nebulaVertShader = `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;

    // Flatten cluster data for uniforms
    const clusterPosFlat: number[] = [];
    const clusterColFlat: number[] = [];
    for (let i = 0; i < 7; i++) {
      clusterPosFlat.push(clusterUVs[i][0], clusterUVs[i][1]);
      clusterColFlat.push(clusterColors[i][0], clusterColors[i][1], clusterColors[i][2]);
    }

    const nebulaFragShader = `
      precision highp float;
      varying vec2 vUv;
      uniform float uTime;
      uniform vec2 uClusterPositions[7];
      uniform vec3 uClusterColors[7];
      uniform float uFogMask[7];
      uniform int uClusterCount;

      // Simplex noise (ported from MonetBackground.ts)
      vec3 mod289(vec3 x) { return x - floor(x * (1.0/289.0)) * 289.0; }
      vec2 mod289(vec2 x) { return x - floor(x * (1.0/289.0)) * 289.0; }
      vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

      float snoise(vec2 v) {
        const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                           -0.577350269189626, 0.024390243902439);
        vec2 i = floor(v + dot(v, C.yy));
        vec2 x0 = v - i + dot(i, C.xx);
        vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
        vec4 x12 = x0.xyxy + C.xxzz;
        x12.xy -= i1;
        i = mod289(i);
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

      // 4-octave FBM
      float fbm(vec2 p) {
        float f = 0.0;
        float amp = 0.5;
        for (int i = 0; i < 4; i++) {
          f += amp * snoise(p);
          p *= 2.1;
          amp *= 0.45;
        }
        return f;
      }

      void main() {
        vec2 uv = vUv;
        float t = uTime * 0.04;
        vec3 color = vec3(0.0);

        for (int i = 0; i < 7; i++) {
          if (i >= uClusterCount) break;
          vec2 cPos = uClusterPositions[i];
          float dist = length(uv - cPos);

          // Noise-warped distance for organic nebula shapes
          vec2 warpedUV = uv * 3.0 + vec2(float(i) * 1.7, float(i) * 2.3);
          float noiseWarp = fbm(warpedUV + t * 0.3) * 0.12;
          float warpedDist = dist + noiseWarp;

          // Nebula intensity: falls off with distance, modulated by noise
          float intensity = smoothstep(0.45, 0.0, warpedDist);
          float detail = fbm(uv * 5.0 + vec2(float(i) * 3.1) + t * 0.15);
          intensity *= (0.7 + 0.3 * detail);

          // Apply fog mask
          intensity *= uFogMask[i];

          // Nebulae at moderate intensity for visible depth
          color += uClusterColors[i] * intensity * 0.4;
        }

        // Deep space base gradient — blue-purple ambient, not pure black
        float vignette = smoothstep(0.0, 0.8, length(uv - 0.5));
        vec3 base = mix(vec3(0.025, 0.02, 0.045), vec3(0.012, 0.012, 0.028), vignette);

        color = base + color;
        gl_FragColor = vec4(color, 1.0);
      }
    `;

    const nebulaUniforms = {
      uTime: { value: 0 },
      uClusterPositions: { value: clusterUVs.map(p => new THREE.Vector2(p[0], p[1])) },
      uClusterColors: { value: clusterColors.map(c => new THREE.Vector3(c[0], c[1], c[2])) },
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

    // Fullscreen quad at z=-800 (behind everything)
    const nebulaGeo = new THREE.PlaneGeometry(w, h);
    const nebulaMesh = new THREE.Mesh(nebulaGeo, nebulaMat);
    nebulaMesh.position.set(w / 2, -h / 2, -800);
    scene.add(nebulaMesh);

    // ── Grid lines ──────────────────────────────────────────
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
      opacity: 0.025,
    });
    const gridLines = new THREE.LineSegments(gridGeo, gridMat);
    scene.add(gridLines);

    // ── Star particles (3 depth layers) ─────────────────────
    const starLayers = [
      { count: 400, z: -600, sizeMin: 0.4, sizeMax: 1.2, brightnessMax: 0.8, parallax: 0.02 },
      { count: 200, z: -300, sizeMin: 0.8, sizeMax: 2.0, brightnessMax: 1.0, parallax: 0.05 },
      { count: 80,  z: -100, sizeMin: 1.5, sizeMax: 3.5, brightnessMax: 1.5, parallax: 0.1 },
    ];

    const starVertShader = `
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

    const starFragShader = `
      precision highp float;
      varying float vBrightness;
      varying float vAlpha;

      void main() {
        vec2 coord = gl_PointCoord - 0.5;
        float dist = length(coord);
        if (dist > 0.5) discard;

        // Soft core with HDR brightness for bloom pickup
        float coreFalloff = 1.0 - smoothstep(0.0, 0.5, dist);
        float hdrCore = coreFalloff * coreFalloff;

        // Stars with brightness > 1.0 emit HDR values → bloom picks them up
        float hdr = vBrightness * hdrCore * 1.8;

        vec3 color = vec3(0.78, 0.82, 0.90); // blueish white
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
        positions.push(
          Math.random() * w,
          -Math.random() * h,
          layer.z,
        );
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
        vertexShader: starVertShader,
        fragmentShader: starFragShader,
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

      const points = new THREE.Points(geo, mat);
      scene.add(points);
      starMaterials.push(mat);
      starGroups.push(points);
    }

    // Keep references for warp uniform
    uWarpIntensity = starMaterials[0]?.uniforms.uWarpIntensity;
    uMouseOffset = starMaterials[0]?.uniforms.uMouseOffset;

    // ── Resize handler ──────────────────────────────────────
    const resizeInternal = (newW: number, newH: number) => {
      camera.right = newW;
      camera.bottom = -newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
      composer.setSize(newW, newH);
      bloomPass.resolution.set(newW, newH);

      // Update nebula quad
      nebulaMesh.geometry.dispose();
      nebulaMesh.geometry = new THREE.PlaneGeometry(newW, newH);
      nebulaMesh.position.set(newW / 2, -newH / 2, -800);

      // Recalculate cluster UVs
      const ncx = newW / 2;
      const ncy = newH / 2;
      const ns = Math.min(newW, newH) / 800;
      for (let i = 0; i < clusters.length && i < 7; i++) {
        const nx = ncx + Math.cos(clusters[i].angle) * clusters[i].radius * ns;
        const ny = ncy + Math.sin(clusters[i].angle) * clusters[i].radius * ns;
        nebulaUniforms.uClusterPositions.value[i].set(nx / newW, ny / newH);
      }
    };

    // Store internal resize for external call
    (renderer as any).__resizeFn = resizeInternal;
    (renderer as any).__composer = composer;

    ready = true;
  });

  // ── Public API ──────────────────────────────────────────────

  function update(time: number) {
    if (!ready) return;

    // Smooth mouse
    smoothMouseX += (mouseX - smoothMouseX) * 0.05;
    smoothMouseY += (mouseY - smoothMouseY) * 0.05;

    // Smooth warp
    warpCurrent += (warpTarget - warpCurrent) * 0.08;

    const t = time * 0.001;

    // Update nebula time
    if (uTime) uTime.value = t;

    // Update star uniforms
    for (const mat of starMaterials) {
      mat.uniforms.uTime.value = t;
      mat.uniforms.uWarpIntensity.value = warpCurrent;
      mat.uniforms.uMouseOffset.value.set(smoothMouseX, smoothMouseY);
    }

    // Bloom warp effect
    if (bloomPassRef) {
      bloomPassRef.strength = 0.8 + warpCurrent * 1.7;
    }

    // Render
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
    // Normalize to -1..1
    mouseX = (x / w - 0.5) * 2;
    mouseY = (y / h - 0.5) * 2;
  }

  function setWarpIntensity(value: number) {
    warpTarget = Math.max(0, Math.min(1, value));
  }

  function setFogOfWar(activeClusterId: string | null) {
    if (!uFogMask) return;
    for (let i = 0; i < clusters.length && i < 7; i++) {
      if (activeClusterId === null) {
        uFogMask.value[i] = 1.0;
      } else {
        uFogMask.value[i] = clusters[i].id === activeClusterId ? 1.0 : 0.15;
      }
    }
  }

  return { update, resize, setMousePosition, setWarpIntensity, setFogOfWar };
}
