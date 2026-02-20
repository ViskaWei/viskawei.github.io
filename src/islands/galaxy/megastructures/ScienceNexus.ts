export interface ScienceNexusConfig {
  color: string;
  scale: number;
}

export function createScienceNexus(
  THREE: typeof import('three'),
  config: ScienceNexusConfig
): {
  group: import('three').Group;
  update: (time: number) => void;
  dispose: () => void;
} {
  const group = new THREE.Group();
  group.scale.setScalar(config.scale);

  const color = new THREE.Color(config.color);

  // Core icosahedron with physical material
  const coreGeo = new THREE.IcosahedronGeometry(0.5, 1);
  const coreMat = new THREE.MeshPhysicalMaterial({
    color,
    emissive: color,
    emissiveIntensity: 0.3,
    transmission: 0.6,
    roughness: 0.1,
    transparent: true,
    opacity: 0.85,
  });
  const core = new THREE.Mesh(coreGeo, coreMat);
  group.add(core);

  // Outer ring 1
  const ring1Geo = new THREE.TorusGeometry(0.8, 0.02, 16, 64);
  const ringMat = new THREE.MeshStandardMaterial({
    color: '#888888',
    metalness: 0.95,
    roughness: 0.1,
  });
  const ring1 = new THREE.Mesh(ring1Geo, ringMat);
  ring1.rotation.x = Math.PI * 0.4;
  ring1.rotation.z = Math.PI * 0.1;
  group.add(ring1);

  // Outer ring 2
  const ring2Geo = new THREE.TorusGeometry(0.9, 0.02, 16, 64);
  const ring2Mat = ringMat.clone();
  const ring2 = new THREE.Mesh(ring2Geo, ring2Mat);
  ring2.rotation.x = Math.PI * 0.7;
  ring2.rotation.z = -Math.PI * 0.3;
  group.add(ring2);

  // Inner ring
  const ring3Geo = new THREE.TorusGeometry(0.55, 0.015, 12, 48);
  const ring3Mat = ringMat.clone();
  const ring3 = new THREE.Mesh(ring3Geo, ring3Mat);
  ring3.rotation.x = Math.PI * 0.5;
  ring3.rotation.y = Math.PI * 0.25;
  group.add(ring3);

  // Data stream particles
  const particleCount = 30;
  const particleGeo = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);
  const phases = new Float32Array(particleCount); // track phase for each particle

  for (let i = 0; i < particleCount; i++) {
    phases[i] = Math.random() * Math.PI * 2;
    // Initial positions will be set in update
    positions[i * 3] = 0;
    positions[i * 3 + 1] = 0;
    positions[i * 3 + 2] = 0;
  }

  particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const particleMat = new THREE.PointsMaterial({
    color,
    size: 0.03,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const particles = new THREE.Points(particleGeo, particleMat);
  group.add(particles);

  // Store ring radii for particle paths
  const ringRadii = [0.8, 0.9, 0.55];
  const ringRotations = [
    { x: Math.PI * 0.4, z: Math.PI * 0.1 },
    { x: Math.PI * 0.7, z: -Math.PI * 0.3 },
    { x: Math.PI * 0.5, z: Math.PI * 0.25 },
  ];

  const geometries = [coreGeo, ring1Geo, ring2Geo, ring3Geo, particleGeo];
  const materials = [coreMat, ringMat, ring2Mat, ring3Mat, particleMat];

  function update(time: number) {
    // Counter-rotate rings
    ring1.rotation.y = time * 0.15;
    ring2.rotation.y = -time * 0.12;
    ring3.rotation.y = time * 0.2;

    // Animate particles along ring paths
    const posAttr = particleGeo.getAttribute('position') as import('three').BufferAttribute;
    for (let i = 0; i < particleCount; i++) {
      const ringIdx = i % 3;
      const radius = ringRadii[ringIdx];
      const rot = ringRotations[ringIdx];
      const angle = phases[i] + time * (0.3 + ringIdx * 0.1);

      // Position on a circle in the XY plane
      let px = Math.cos(angle) * radius;
      let py = Math.sin(angle) * radius;
      let pz = 0;

      // Apply ring rotation (simplified Euler rotation)
      const cosX = Math.cos(rot.x);
      const sinX = Math.sin(rot.x);
      const cosZ = Math.cos(rot.z);
      const sinZ = Math.sin(rot.z);

      // Rotate around X
      const y1 = py * cosX - pz * sinX;
      const z1 = py * sinX + pz * cosX;
      py = y1;
      pz = z1;

      // Rotate around Z
      const x2 = px * cosZ - py * sinZ;
      const y2 = px * sinZ + py * cosZ;
      px = x2;
      py = y2;

      posAttr.setXYZ(i, px, py, pz);
    }
    posAttr.needsUpdate = true;
  }

  function dispose() {
    for (const geo of geometries) geo.dispose();
    for (const mat of materials) mat.dispose();
  }

  return { group, update, dispose };
}
