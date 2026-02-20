export interface LaserBeamConfig {
  sourcePosition: [number, number, number];
  targetPositions: [number, number, number][];
  color: string;
}

export function createLaserBeams(
  THREE: typeof import('three'),
  configs: LaserBeamConfig[]
): {
  group: import('three').Group;
  update: (time: number) => void;
  dispose: () => void;
} {
  const group = new THREE.Group();

  const geometries: import('three').BufferGeometry[] = [];
  const materials: import('three').Material[] = [];

  interface BeamEntry {
    geometry: import('three').BufferGeometry;
    colorAttr: import('three').BufferAttribute;
    baseColor: import('three').Color;
    segmentCount: number;
  }

  const beams: BeamEntry[] = [];

  for (const config of configs) {
    const baseColor = new THREE.Color(config.color);
    const [sx, sy, sz] = config.sourcePosition;

    // Each target gets a line segment from source to target
    // We use 2 vertices per line segment for LineSegments
    const segmentCount = config.targetPositions.length;
    const positions = new Float32Array(segmentCount * 2 * 3);
    const colors = new Float32Array(segmentCount * 2 * 3);

    for (let i = 0; i < segmentCount; i++) {
      const [tx, ty, tz] = config.targetPositions[i];
      const offset = i * 6; // 2 vertices * 3 components

      // Source vertex
      positions[offset] = sx;
      positions[offset + 1] = sy;
      positions[offset + 2] = sz;

      // Target vertex
      positions[offset + 3] = tx;
      positions[offset + 4] = ty;
      positions[offset + 5] = tz;

      // Initial colors (will be animated)
      colors[offset] = baseColor.r;
      colors[offset + 1] = baseColor.g;
      colors[offset + 2] = baseColor.b;
      colors[offset + 3] = baseColor.r;
      colors[offset + 4] = baseColor.g;
      colors[offset + 5] = baseColor.b;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const colorAttr = new THREE.BufferAttribute(colors, 3);
    geometry.setAttribute('color', colorAttr);

    const material = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      linewidth: 1,
    });

    const lineSegments = new THREE.LineSegments(geometry, material);
    group.add(lineSegments);

    geometries.push(geometry);
    materials.push(material);

    beams.push({
      geometry,
      colorAttr,
      baseColor,
      segmentCount,
    });
  }

  function update(time: number) {
    for (const beam of beams) {
      const { colorAttr, baseColor, segmentCount } = beam;
      const colors = colorAttr.array as Float32Array;

      for (let i = 0; i < segmentCount; i++) {
        const offset = i * 6;

        // Pulse effect: brightness oscillates, phase offset per segment
        const pulse = 0.4 + 0.6 * Math.abs(Math.sin(time * 2.0 - i * 0.5));

        // Source vertex — brighter (pulse toward source)
        const sourceBright = Math.min(pulse * 1.3, 1.0);
        colors[offset] = baseColor.r * sourceBright;
        colors[offset + 1] = baseColor.g * sourceBright;
        colors[offset + 2] = baseColor.b * sourceBright;

        // Target vertex — dimmer
        const targetBright = pulse * 0.5;
        colors[offset + 3] = baseColor.r * targetBright;
        colors[offset + 4] = baseColor.g * targetBright;
        colors[offset + 5] = baseColor.b * targetBright;
      }

      colorAttr.needsUpdate = true;
    }
  }

  function dispose() {
    for (const geo of geometries) geo.dispose();
    for (const mat of materials) mat.dispose();
  }

  return { group, update, dispose };
}
