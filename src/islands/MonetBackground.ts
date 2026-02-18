/** Full-viewport animated Monet background using Three.js shader */

export function initMonetBackground(container: HTMLElement): void {
  // Skip on mobile — CSS fallback handles it
  if (window.innerWidth < 768 || !window.WebGLRenderingContext) return;

  import('three').then((THREE) => {
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.domElement.style.position = 'fixed';
    renderer.domElement.style.top = '0';
    renderer.domElement.style.left = '0';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.zIndex = '-1';
    renderer.domElement.style.pointerEvents = 'none';
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const vertexShader = `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position, 1.0);
      }
    `;

    const fragmentShader = `
      precision mediump float;
      varying vec2 vUv;
      uniform float uTime;
      uniform vec2 uMouse;
      uniform vec2 uResolution;

      // Simplex-like noise
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

      void main() {
        vec2 uv = vUv;
        float t = uTime * 0.03;
        vec2 mouse = uMouse * 0.02;

        // Layer multiple noise octaves with Monet colors
        float n1 = snoise(uv * 2.0 + t * 0.5 + mouse) * 0.5 + 0.5;
        float n2 = snoise(uv * 3.0 - t * 0.3 - mouse * 0.5) * 0.5 + 0.5;
        float n3 = snoise(uv * 1.5 + t * 0.2 + vec2(5.0, 3.0)) * 0.5 + 0.5;
        float n4 = snoise(uv * 4.0 - t * 0.4 + vec2(10.0, 7.0)) * 0.5 + 0.5;

        // Monet palette colors
        vec3 lavender = vec3(0.769, 0.710, 0.878);
        vec3 sky      = vec3(0.627, 0.784, 0.910);
        vec3 mint     = vec3(0.659, 0.859, 0.773);
        vec3 yellow   = vec3(0.941, 0.902, 0.627);
        vec3 rose     = vec3(0.910, 0.706, 0.784);

        // Blend colors based on noise
        vec3 c1 = mix(lavender, sky, n1);
        vec3 c2 = mix(mint, yellow, n2);
        vec3 c3 = mix(rose, lavender, n3);
        vec3 color = mix(c1, c2, n3);
        color = mix(color, c3, n4 * 0.3);

        // Soft wash — visible but not overpowering
        float alpha = 0.18 + n4 * 0.12;

        // Slightly stronger in the corners for depth
        float vignette = smoothstep(0.0, 0.7, length(uv - 0.5));
        alpha *= 1.0 + vignette * 0.3;

        gl_FragColor = vec4(color, alpha);
      }
    `;

    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uMouse: { value: new THREE.Vector2(0, 0) },
        uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
      },
      transparent: true,
      depthWrite: false,
    });

    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
    scene.add(quad);

    // Mouse tracking
    let mouseX = 0, mouseY = 0;
    document.addEventListener('mousemove', (e) => {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    });

    // Animation at 30fps
    let animId: number;
    let lastTime = 0;
    function animate(time: number) {
      animId = requestAnimationFrame(animate);
      if (time - lastTime < 33) return; // ~30fps cap
      lastTime = time;

      material.uniforms.uTime.value = time * 0.001;
      material.uniforms.uMouse.value.set(mouseX, mouseY);
      renderer.render(scene, camera);
    }
    animId = requestAnimationFrame(animate);

    // Resize
    const onResize = () => {
      renderer.setSize(window.innerWidth, window.innerHeight);
      material.uniforms.uResolution.value.set(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', onResize);
  });
}
