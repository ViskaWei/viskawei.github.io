export interface SentryArrayConfig {
  color: string;
  scale: number;
}

export function createSentryArray(
  THREE: typeof import('three'),
  config: SentryArrayConfig
): {
  group: import('three').Group;
  update: (time: number) => void;
  dispose: () => void;
} {
  const group = new THREE.Group();
  group.scale.setScalar(config.scale);

  const accentColor = new THREE.Color(config.color);

  // Dark core sphere
  const coreGeo = new THREE.SphereGeometry(0.4, 16, 16);
  const coreMat = new THREE.MeshStandardMaterial({
    color: '#111111',
    metalness: 0.95,
    roughness: 0.1,
  });
  const core = new THREE.Mesh(coreGeo, coreMat);
  group.add(core);

  // Antenna spikes — 4 cones pointing outward
  const spikeGeo = new THREE.ConeGeometry(0.08, 0.5, 8);
  const spikeMat = new THREE.MeshStandardMaterial({
    color: accentColor,
    emissive: accentColor,
    emissiveIntensity: 2.0,
    metalness: 0.8,
    roughness: 0.2,
  });

  const spikeDirections: [number, number, number, number][] = [
    [0, 0.45, 0, 0],             // top — no rotation
    [0, -0.45, 0, Math.PI],      // bottom — flip
    [-0.45, 0, 0, -Math.PI / 2], // left — rotate Z
    [0.45, 0, 0, Math.PI / 2],   // right — rotate Z
  ];

  const spikes: import('three').Mesh[] = [];
  const spikeGeos: import('three').BufferGeometry[] = [];
  const spikeMats: import('three').Material[] = [];

  for (const [px, py, _pz, angle] of spikeDirections) {
    const spike = new THREE.Mesh(spikeGeo, spikeMat);
    spike.position.set(px, py, 0);

    if (angle !== 0) {
      // Top spike needs no rotation, others rotate around Z
      if (px !== 0) {
        spike.rotation.z = angle;
      } else {
        spike.rotation.z = angle;
      }
    }

    spikes.push(spike);
    group.add(spike);
  }
  spikeGeos.push(spikeGeo);
  spikeMats.push(spikeMat);

  // Scan wave ring
  const scanGeo = new THREE.TorusGeometry(0.5, 0.01, 8, 32);
  const scanMat = new THREE.MeshStandardMaterial({
    color: accentColor,
    emissive: accentColor,
    emissiveIntensity: 1.5,
    transparent: true,
    opacity: 0.8,
    depthWrite: false,
  });
  const scanRing = new THREE.Mesh(scanGeo, scanMat);
  scanRing.rotation.x = Math.PI / 2;
  group.add(scanRing);

  let scanPhase = 0;
  const scanInterval = 3.0; // seconds between scans
  const scanDuration = 1.5; // seconds for scan to expand and fade

  const geometries = [coreGeo, ...spikeGeos, scanGeo];
  const materials = [coreMat, ...spikeMats, scanMat];

  function update(time: number) {
    // Slow rotation of spikes group via core parent rotation
    const spikeRotation = time * 0.1;
    for (const spike of spikes) {
      // Slight wobble on each spike
      spike.rotation.x += Math.sin(time * 0.5) * 0.001;
    }

    // Scan wave cycle
    scanPhase = (time % scanInterval) / scanDuration;

    if (scanPhase <= 1.0) {
      // Scan is active
      const scale = 1.0 + scanPhase * 2.0;
      scanRing.scale.setScalar(scale);
      scanMat.opacity = 0.8 * (1.0 - scanPhase);
      scanRing.visible = true;
    } else {
      scanRing.visible = false;
    }

    // Rotate entire group slowly
    group.rotation.y = spikeRotation;
  }

  function dispose() {
    for (const geo of geometries) geo.dispose();
    for (const mat of materials) mat.dispose();
  }

  return { group, update, dispose };
}
