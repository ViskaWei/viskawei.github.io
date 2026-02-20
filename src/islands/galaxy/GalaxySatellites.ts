/**
 * GalaxySatellites — Framework/tool icons orbiting parent course stars.
 * Uses Three.js InstancedMesh per shape type for performance.
 * Only visible at zoom > 1.5x.
 */

export interface Satellite {
  id: string;
  name: string;
  parentNodeId: string;  // which course node this orbits
  shape: 'diamond' | 'cube' | 'octahedron';
  orbitRadius: number;   // in pixels
  orbitSpeed: number;    // radians per second
}

export const SATELLITE_DATA: Satellite[] = [
  // AI / ML frameworks
  { id: 'sat-pytorch', name: 'PyTorch', parentNodeId: 'EN601682', shape: 'diamond', orbitRadius: 22, orbitSpeed: 0.8 },
  { id: 'sat-tensorflow', name: 'TensorFlow', parentNodeId: 'EN601682', shape: 'cube', orbitRadius: 28, orbitSpeed: 0.6 },
  { id: 'sat-sklearn', name: 'Scikit-learn', parentNodeId: 'EN553636', shape: 'diamond', orbitRadius: 26, orbitSpeed: 0.55 },
  { id: 'sat-huggingface', name: 'HuggingFace', parentNodeId: 'EN601668', shape: 'octahedron', orbitRadius: 24, orbitSpeed: 0.7 },
  { id: 'sat-jax', name: 'JAX', parentNodeId: 'AS171749', shape: 'cube', orbitRadius: 22, orbitSpeed: 0.75 },
  { id: 'sat-wandb', name: 'W&B', parentNodeId: 'AS171801', shape: 'octahedron', orbitRadius: 20, orbitSpeed: 0.85 },

  // Data / Visualization
  { id: 'sat-numpy', name: 'NumPy', parentNodeId: 'EN553636', shape: 'octahedron', orbitRadius: 20, orbitSpeed: 0.9 },
  { id: 'sat-pandas', name: 'Pandas', parentNodeId: 'EN553636', shape: 'cube', orbitRadius: 24, orbitSpeed: 0.7 },
  { id: 'sat-d3', name: 'D3.js', parentNodeId: 'EN553636', shape: 'diamond', orbitRadius: 30, orbitSpeed: 0.5 },
  { id: 'sat-matplotlib', name: 'Matplotlib', parentNodeId: 'EN553636', shape: 'octahedron', orbitRadius: 32, orbitSpeed: 0.45 },
  { id: 'sat-scipy', name: 'SciPy', parentNodeId: 'EN553620', shape: 'cube', orbitRadius: 22, orbitSpeed: 0.65 },

  // Languages
  { id: 'sat-python', name: 'Python', parentNodeId: 'EN553636', shape: 'cube', orbitRadius: 34, orbitSpeed: 0.4 },
  { id: 'sat-julia', name: 'Julia', parentNodeId: 'EN553626', shape: 'octahedron', orbitRadius: 24, orbitSpeed: 0.75 },
  { id: 'sat-javascript', name: 'JavaScript', parentNodeId: 'EN601633', shape: 'diamond', orbitRadius: 22, orbitSpeed: 0.8 },
  { id: 'sat-typescript', name: 'TypeScript', parentNodeId: 'EN601633', shape: 'cube', orbitRadius: 26, orbitSpeed: 0.65 },
  { id: 'sat-cpp', name: 'C++', parentNodeId: 'EN601664', shape: 'octahedron', orbitRadius: 20, orbitSpeed: 0.85 },
  { id: 'sat-sql', name: 'SQL', parentNodeId: 'EN553636', shape: 'diamond', orbitRadius: 36, orbitSpeed: 0.35 },

  // Physics / Math tools
  { id: 'sat-mathematica', name: 'Mathematica', parentNodeId: 'PHYS221A', shape: 'cube', orbitRadius: 24, orbitSpeed: 0.7 },
  { id: 'sat-latex', name: 'LaTeX', parentNodeId: 'PHYS232A', shape: 'diamond', orbitRadius: 20, orbitSpeed: 0.9 },
  { id: 'sat-matlab', name: 'MATLAB', parentNodeId: 'PHYS33000', shape: 'octahedron', orbitRadius: 22, orbitSpeed: 0.75 },
  { id: 'sat-sympy', name: 'SymPy', parentNodeId: 'PHYS232B', shape: 'cube', orbitRadius: 26, orbitSpeed: 0.6 },
  { id: 'sat-astropy', name: 'AstroPy', parentNodeId: 'PHYS46000', shape: 'diamond', orbitRadius: 24, orbitSpeed: 0.65 },

  // DevOps / Infra
  { id: 'sat-docker', name: 'Docker', parentNodeId: 'EN601664', shape: 'cube', orbitRadius: 26, orbitSpeed: 0.6 },
  { id: 'sat-git', name: 'Git', parentNodeId: 'EN601633', shape: 'octahedron', orbitRadius: 30, orbitSpeed: 0.5 },
  { id: 'sat-linux', name: 'Linux', parentNodeId: 'EN601664', shape: 'diamond', orbitRadius: 30, orbitSpeed: 0.5 },
  { id: 'sat-cuda', name: 'CUDA', parentNodeId: 'EN601682', shape: 'octahedron', orbitRadius: 32, orbitSpeed: 0.45 },
  { id: 'sat-slurm', name: 'Slurm', parentNodeId: 'AS171801', shape: 'cube', orbitRadius: 26, orbitSpeed: 0.6 },

  // Web / Frontend
  { id: 'sat-react', name: 'React', parentNodeId: 'EN601633', shape: 'diamond', orbitRadius: 34, orbitSpeed: 0.45 },
  { id: 'sat-threejs', name: 'Three.js', parentNodeId: 'EN601633', shape: 'octahedron', orbitRadius: 38, orbitSpeed: 0.35 },
  { id: 'sat-astro', name: 'Astro', parentNodeId: 'EN601633', shape: 'cube', orbitRadius: 36, orbitSpeed: 0.4 },

  // Finance / Stochastic
  { id: 'sat-bloomberg', name: 'Bloomberg', parentNodeId: 'EN553627', shape: 'diamond', orbitRadius: 22, orbitSpeed: 0.8 },
  { id: 'sat-quantlib', name: 'QuantLib', parentNodeId: 'EN553628', shape: 'cube', orbitRadius: 24, orbitSpeed: 0.7 },

  // Topology / Math
  { id: 'sat-sage', name: 'SageMath', parentNodeId: 'MATH31700', shape: 'octahedron', orbitRadius: 22, orbitSpeed: 0.75 },
  { id: 'sat-tikz', name: 'TikZ', parentNodeId: 'MATH31800', shape: 'diamond', orbitRadius: 20, orbitSpeed: 0.85 },

  // NLP / Translation
  { id: 'sat-fairseq', name: 'Fairseq', parentNodeId: 'EN601668', shape: 'cube', orbitRadius: 28, orbitSpeed: 0.55 },
  { id: 'sat-sentencepiece', name: 'SentencePiece', parentNodeId: 'EN601668', shape: 'diamond', orbitRadius: 30, orbitSpeed: 0.5 },
];

// Shape geometry sizes (approximate pixel equivalent for InstancedMesh)
const SATELLITE_SCALE = 1.5;

type THREE = typeof import('three');

export function createSatelliteSystem(
  THREE: THREE,
  satellites: Satellite[],
  nodePositions: Map<string, { x: number; y: number }>,
  clusterColors: Map<string, string>,
): {
  group: import('three').Group;
  update: (time: number, zoomLevel: number) => void;
  dispose: () => void;
} {
  const group = new THREE.Group();
  group.visible = false;  // hidden until zoom > 1.5

  // Filter to satellites whose parent actually exists
  const validSatellites = satellites.filter(s => nodePositions.has(s.parentNodeId));

  // Group by shape for instanced rendering
  const shapeGroups: Record<string, Satellite[]> = {
    diamond: [],
    cube: [],
    octahedron: [],
  };
  for (const sat of validSatellites) {
    shapeGroups[sat.shape].push(sat);
  }

  // Geometry per shape
  const geometries: Record<string, import('three').BufferGeometry> = {
    diamond: new THREE.OctahedronGeometry(SATELLITE_SCALE, 0),
    cube: new THREE.BoxGeometry(SATELLITE_SCALE * 1.4, SATELLITE_SCALE * 1.4, SATELLITE_SCALE * 1.4),
    octahedron: new THREE.OctahedronGeometry(SATELLITE_SCALE * 1.2, 1),
  };

  // Scale diamond to be elongated (diamond shape)
  geometries.diamond.scale(0.7, 1.3, 0.7);

  // Material — metallic appearance
  const material = new THREE.MeshStandardMaterial({
    metalness: 0.8,
    roughness: 0.3,
    emissive: new THREE.Color(0x444466),
    emissiveIntensity: 0.3,
  });

  // Create one InstancedMesh per shape
  const meshes: { mesh: import('three').InstancedMesh; sats: Satellite[] }[] = [];
  const dummy = new THREE.Object3D();

  for (const [shape, sats] of Object.entries(shapeGroups)) {
    if (sats.length === 0) continue;
    const geom = geometries[shape];
    const mesh = new THREE.InstancedMesh(geom, material.clone(), sats.length);
    mesh.frustumCulled = false;

    // Set initial instance colors from parent cluster
    for (let i = 0; i < sats.length; i++) {
      const parentPos = nodePositions.get(sats[i].parentNodeId)!;
      const colorHex = clusterColors.get(sats[i].parentNodeId) || '#ffffff';
      const color = new THREE.Color(colorHex);
      // Brighten the color slightly
      color.lerp(new THREE.Color(0xffffff), 0.3);
      mesh.setColorAt(i, color);

      // Initial position (will be updated in update())
      dummy.position.set(parentPos.x, parentPos.y, 0);
      dummy.scale.setScalar(1);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;

    group.add(mesh);
    meshes.push({ mesh, sats });
  }

  function update(time: number, zoomLevel: number) {
    // Only visible when zoomed in past 1.5x
    const shouldBeVisible = zoomLevel > 1.5;
    group.visible = shouldBeVisible;
    if (!shouldBeVisible) return;

    // Fade in/out based on zoom proximity to threshold
    const opacity = Math.min(1, (zoomLevel - 1.5) * 2);
    for (const { mesh } of meshes) {
      const mat = mesh.material as import('three').MeshStandardMaterial;
      mat.opacity = opacity;
      mat.transparent = opacity < 1;
    }

    const timeSec = time / 1000;

    for (const { mesh, sats } of meshes) {
      for (let i = 0; i < sats.length; i++) {
        const sat = sats[i];
        const parentPos = nodePositions.get(sat.parentNodeId);
        if (!parentPos) continue;

        // Calculate orbit position
        const angle = timeSec * sat.orbitSpeed + i * 1.7;  // offset each satellite
        const ox = parentPos.x + Math.cos(angle) * sat.orbitRadius;
        const oy = parentPos.y + Math.sin(angle) * sat.orbitRadius;

        dummy.position.set(ox, oy, 0);
        // Slow rotation on the satellite itself
        dummy.rotation.set(timeSec * 0.5, timeSec * 0.7 + i, timeSec * 0.3);
        dummy.scale.setScalar(1);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
      }
      mesh.instanceMatrix.needsUpdate = true;
    }
  }

  function dispose() {
    for (const [, geom] of Object.entries(geometries)) {
      geom.dispose();
    }
    for (const { mesh } of meshes) {
      (mesh.material as import('three').MeshStandardMaterial).dispose();
      mesh.dispose();
    }
    group.clear();
  }

  return { group, update, dispose };
}
