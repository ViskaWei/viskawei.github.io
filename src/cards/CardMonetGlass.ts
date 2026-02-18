/** SpecViT card — Glass particles in Monet palette with impressionist glow */

import * as THREE from 'three';
import { PALETTE_ARRAY, observeVisibility } from './_shared';

export function initMonetGlass(container: HTMLElement): void {
  observeVisibility(container, () => {
    const COUNT = 120;
    const rect = container.getBoundingClientRect();

    // Renderer
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(rect.width, rect.height);
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.position = 'absolute';
    renderer.domElement.style.top = '0';
    renderer.domElement.style.left = '0';
    container.appendChild(renderer.domElement);

    // Scene + Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, rect.width / rect.height, 0.1, 100);
    camera.position.z = 5;

    // Particles
    const positions = new Float32Array(COUNT * 3);
    const colors = new Float32Array(COUNT * 3);
    const velocities: number[] = [];
    const sizes = new Float32Array(COUNT);

    const palette = PALETTE_ARRAY.map(c => new THREE.Color(c));

    for (let i = 0; i < COUNT; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 8;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 5;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 4;

      velocities.push(
        (Math.random() - 0.5) * 0.008,
        (Math.random() - 0.5) * 0.006,
        (Math.random() - 0.5) * 0.003
      );

      const color = palette[Math.floor(Math.random() * palette.length)];
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;

      sizes[i] = 0.12 + Math.random() * 0.3;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    // Custom shader for soft glowing particles
    const vertexShader = `
      attribute float size;
      varying vec3 vColor;
      void main() {
        vColor = color;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = size * (300.0 / -mvPosition.z);
        gl_Position = projectionMatrix * mvPosition;
      }
    `;
    const fragmentShader = `
      varying vec3 vColor;
      void main() {
        float d = length(gl_PointCoord - vec2(0.5));
        if (d > 0.5) discard;
        float alpha = smoothstep(0.5, 0.05, d) * 0.7;
        gl_FragColor = vec4(vColor, alpha);
      }
    `;

    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      vertexColors: true,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const points = new THREE.Points(geometry, material);
    scene.add(points);

    // Connecting lines between nearby particles for a network effect
    const lineGeometry = new THREE.BufferGeometry();
    const maxLines = COUNT * 4;
    const linePositions = new Float32Array(maxLines * 6);
    const lineColors = new Float32Array(maxLines * 6);
    lineGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
    lineGeometry.setAttribute('color', new THREE.BufferAttribute(lineColors, 3));

    const lineMaterial = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.2,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const lines = new THREE.LineSegments(lineGeometry, lineMaterial);
    scene.add(lines);

    // Mouse parallax
    let mouseX = 0, mouseY = 0;
    const onMove = (e: MouseEvent) => {
      const r = container.getBoundingClientRect();
      mouseX = ((e.clientX - r.left) / r.width - 0.5) * 2;
      mouseY = ((e.clientY - r.top) / r.height - 0.5) * 2;
    };
    container.addEventListener('mousemove', onMove);

    // Animation
    let animId: number;
    function animate() {
      animId = requestAnimationFrame(animate);

      const pos = geometry.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < COUNT; i++) {
        const ix = i * 3;
        (pos.array as Float32Array)[ix] += velocities[ix];
        (pos.array as Float32Array)[ix + 1] += velocities[ix + 1];
        (pos.array as Float32Array)[ix + 2] += velocities[ix + 2];

        // Wrap
        if (pos.array[ix] > 4) (pos.array as Float32Array)[ix] = -4;
        if (pos.array[ix] < -4) (pos.array as Float32Array)[ix] = 4;
        if (pos.array[ix + 1] > 3) (pos.array as Float32Array)[ix + 1] = -3;
        if (pos.array[ix + 1] < -3) (pos.array as Float32Array)[ix + 1] = 3;
      }
      pos.needsUpdate = true;

      // Update connecting lines
      let lineIdx = 0;
      const threshold = 1.8;
      const lp = lineGeometry.attributes.position as THREE.BufferAttribute;
      const lc = lineGeometry.attributes.color as THREE.BufferAttribute;

      for (let i = 0; i < COUNT && lineIdx < maxLines; i++) {
        for (let j = i + 1; j < COUNT && lineIdx < maxLines; j++) {
          const dx = pos.array[i * 3] - pos.array[j * 3];
          const dy = pos.array[i * 3 + 1] - pos.array[j * 3 + 1];
          const dz = pos.array[i * 3 + 2] - pos.array[j * 3 + 2];
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

          if (dist < threshold) {
            const fade = 1.0 - dist / threshold;
            const li = lineIdx * 6;
            (lp.array as Float32Array)[li] = pos.array[i * 3];
            (lp.array as Float32Array)[li + 1] = pos.array[i * 3 + 1];
            (lp.array as Float32Array)[li + 2] = pos.array[i * 3 + 2];
            (lp.array as Float32Array)[li + 3] = pos.array[j * 3];
            (lp.array as Float32Array)[li + 4] = pos.array[j * 3 + 1];
            (lp.array as Float32Array)[li + 5] = pos.array[j * 3 + 2];

            const avgR = (colors[i * 3] + colors[j * 3]) * 0.5 * fade;
            const avgG = (colors[i * 3 + 1] + colors[j * 3 + 1]) * 0.5 * fade;
            const avgB = (colors[i * 3 + 2] + colors[j * 3 + 2]) * 0.5 * fade;
            (lc.array as Float32Array)[li] = avgR;
            (lc.array as Float32Array)[li + 1] = avgG;
            (lc.array as Float32Array)[li + 2] = avgB;
            (lc.array as Float32Array)[li + 3] = avgR;
            (lc.array as Float32Array)[li + 4] = avgG;
            (lc.array as Float32Array)[li + 5] = avgB;

            lineIdx++;
          }
        }
      }
      // Zero out remaining lines
      for (let i = lineIdx * 6; i < maxLines * 6; i++) {
        (lp.array as Float32Array)[i] = 0;
      }
      lp.needsUpdate = true;
      lc.needsUpdate = true;
      lineGeometry.setDrawRange(0, lineIdx * 2);

      camera.position.x += (mouseX * 0.4 - camera.position.x) * 0.03;
      camera.position.y += (-mouseY * 0.3 - camera.position.y) * 0.03;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    }
    animate();

    return () => {
      cancelAnimationFrame(animId);
      container.removeEventListener('mousemove', onMove);
      renderer.dispose();
      geometry.dispose();
      material.dispose();
      lineGeometry.dispose();
      lineMaterial.dispose();
      renderer.domElement.remove();
    };
  });
}
