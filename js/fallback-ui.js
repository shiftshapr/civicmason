/**
 * Static / reduced-motion path: CSS crossfade between threshold and valley art.
 * @param {{ root: HTMLElement; onTransitionEnd?: () => void }} opts
 */
export function runFallbackTransition(opts) {
  const { root, onTransitionEnd } = opts;
  const bg = root.querySelector('.cm-fallback-bg');
  if (!bg) {
    onTransitionEnd && onTransitionEnd();
    return;
  }
  const instant = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  bg.classList.add('cm-fallback-bg--valley');
  if (instant) {
    requestAnimationFrame(() => onTransitionEnd && onTransitionEnd());
    return;
  }
  const onEnd = (e) => {
    if (e.propertyName !== 'opacity') return;
    bg.removeEventListener('transitionend', onEnd);
    onTransitionEnd && onTransitionEnd();
  };
  bg.addEventListener('transitionend', onEnd);
  window.setTimeout(() => {
    onTransitionEnd && onTransitionEnd();
  }, 2500);
}

/**
 * Parallax on fallback hero (desktop): background-position shift.
 */
export function bindFallbackParallax(root) {
  if (window.matchMedia('(max-width: 767px)').matches) return;
  const bg = root.querySelector('.cm-fallback-bg');
  if (!bg) return;
  const onMove = (e) => {
    const nx = (e.clientX / window.innerWidth - 0.5) * 2;
    const ny = (e.clientY / window.innerHeight - 0.5) * 2;
    bg.style.setProperty('--cm-parallax-x', `${nx * 1.5}%`);
    bg.style.setProperty('--cm-parallax-y', `${ny * 1}%`);
  };
  window.addEventListener('mousemove', onMove, { passive: true });
}
