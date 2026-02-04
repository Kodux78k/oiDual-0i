// particles.module.js
// di_ prefix mantido ✨

export function di_initParticles({
  di_target = 'particles-js',
  di_config = {}
} = {}) {

  if (typeof window.particlesJS === 'undefined') {
    console.warn('[Particles] particlesJS lib não carregada');
    return;
  }

  const di_el = document.getElementById(di_target);
  if (!di_el) {
    console.warn(`[Particles] Container #${di_target} não encontrado`);
    return;
  }

  const di_defaultConfig = {
    particles: {
      number: { value: 40 },
      color: { value: ['#0ff', '#f0f'] },
      shape: { type: 'circle' },
      opacity: { value: 0.4 },
      size: { value: 2.4 },
      move: { enable: true, speed: 1.5 }
    },
    retina_detect: true
  };

  const di_finalConfig = {
    ...di_defaultConfig,
    ...di_config,
    particles: {
      ...di_defaultConfig.particles,
      ...(di_config.particles || {})
    }
  };

  window.particlesJS(di_target, di_finalConfig);
}