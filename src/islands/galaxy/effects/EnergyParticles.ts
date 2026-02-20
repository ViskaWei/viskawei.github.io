/**
 * EnergyParticles — Edge flow particles using D3 transitions.
 * Animates small circles along edges to show energy/data flow.
 */

export interface EnergyParticleConfig {
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  color: string;
  particleCount: number;
  duration: number;   // ms per particle trip
}

/**
 * Spawn energy flow particles along edges.
 * Creates SVG circles in the d3Group and animates them from source to target.
 * Returns a cleanup function that stops all animations and removes elements.
 */
export function spawnEnergyFlow(
  d3: typeof import('d3'),
  d3Group: any,
  configs: EnergyParticleConfig[],
): () => void {
  const dots: any[] = [];

  for (const config of configs) {
    for (let p = 0; p < config.particleCount; p++) {
      const dot = d3Group.append('circle')
        .attr('class', 'energy-dot')
        .attr('r', 1.5)
        .attr('fill', config.color)
        .attr('opacity', 0.7)
        .attr('cx', config.sourceX)
        .attr('cy', config.sourceY);

      dots.push(dot);

      // Self-looping animation
      (function loop() {
        dot
          .attr('cx', config.sourceX)
          .attr('cy', config.sourceY)
          .attr('opacity', 0.7)
          .transition()
          .duration(config.duration + Math.random() * (config.duration * 0.3))
          .delay(p * (config.duration / config.particleCount))
          .ease(d3.easeLinear)
          .attr('cx', config.targetX)
          .attr('cy', config.targetY)
          .attr('opacity', 0.1)
          .on('end', loop);
      })();
    }
  }

  // Return cleanup function
  return function cleanup() {
    for (const dot of dots) {
      dot.interrupt().remove();
    }
    dots.length = 0;
  };
}

/**
 * Spawn purple-white overclock particles from a project node to upstream skill nodes.
 * Particles flow in reverse (from project → skills) with a cubic ease-out.
 * Returns a cleanup function.
 */
export function spawnOverclockFlow(
  d3: typeof import('d3'),
  d3Group: any,
  sourceX: number,
  sourceY: number,
  targets: Array<{ x: number; y: number }>,
): () => void {
  const OVERCLOCK_COLOR = '#c8a0ff';
  const PARTICLE_COUNT = 3;
  const BASE_DURATION = 800;
  const dots: any[] = [];

  for (const target of targets) {
    for (let p = 0; p < PARTICLE_COUNT; p++) {
      const dot = d3Group.append('circle')
        .attr('class', 'energy-dot overclock-particle')
        .attr('r', 2)
        .attr('fill', OVERCLOCK_COLOR)
        .attr('opacity', 0.9)
        .attr('cx', sourceX)
        .attr('cy', sourceY);

      dots.push(dot);

      (function loop() {
        dot
          .attr('cx', sourceX)
          .attr('cy', sourceY)
          .attr('opacity', 0.9)
          .transition()
          .duration(BASE_DURATION + Math.random() * 400)
          .delay(p * 300)
          .ease(d3.easeCubicOut)
          .attr('cx', target.x)
          .attr('cy', target.y)
          .attr('opacity', 0.3)
          .on('end', loop);
      })();
    }
  }

  return function cleanup() {
    for (const dot of dots) {
      dot.interrupt().remove();
    }
    dots.length = 0;
  };
}
