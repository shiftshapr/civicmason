import { STAGE, StageController } from './stage-controller.js';
import { CMThreeScene } from './three-scene.js';
import { runFallbackTransition, bindFallbackParallax } from './fallback-ui.js';
import { getGovhubOrigin, onboardingUrl, PATH_INTENTS } from './config.js';

function detectWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(
      window.WebGLRenderingContext &&
      (c.getContext('webgl') || c.getContext('experimental-webgl'))
    );
  } catch {
    return false;
  }
}

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function initGovhubLinks() {
  const o = getGovhubOrigin();
  document.querySelectorAll('[data-cm-govhub="home"]').forEach((el) => {
    el.setAttribute('href', `${o}/soft-launch/`);
  });
}

function main() {
  const root = document.getElementById('cm-root');
  const canvas = document.getElementById('cm-canvas');
  const live = document.getElementById('cm-live');
  if (!root || !canvas) return;

  initGovhubLinks();

  const useThree = !prefersReducedMotion() && detectWebGL();
  root.dataset.cmMode = useThree ? 'webgl' : 'fallback';

  const fbBg = root.querySelector('.cm-fallback-bg');
  /* Hero photography always visible; never hide .cm-fallback-bg. */
  if (useThree) {
    canvas.classList.remove('cm-hidden');
    canvas.classList.add('cm-canvas--composite');
  } else {
    canvas.classList.add('cm-hidden');
    canvas.classList.remove('cm-canvas--composite');
  }
  if (fbBg) fbBg.classList.remove('cm-fallback-bg--hidden');
  bindFallbackParallax(root);

  /** @type {CMThreeScene | null} */
  let scene = null;
  if (useThree) {
    scene = new CMThreeScene(canvas);
    scene.resize();
    scene.start();
    window.addEventListener(
      'resize',
      () => {
        scene.resize();
      },
      { passive: true },
    );
    if (!window.matchMedia('(max-width: 767px)').matches) {
      window.addEventListener(
        'mousemove',
        (e) => {
          const nx = e.clientX / window.innerWidth - 0.5;
          const ny = e.clientY / window.innerHeight - 0.5;
          scene.setParallax(nx * 2, ny * 2);
        },
        { passive: true },
      );
    }
  }

  const ctrl = new StageController({
    root,
    live,
    onStage: (next, prev) => {
      if (next === STAGE.TRANSITION) {
        root.classList.add('cm-root--transitioning');
      }
      if (prev === STAGE.TRANSITION) {
        root.classList.remove('cm-root--transitioning');
      }
    },
  });

  const btnBecome = document.getElementById('cm-become');
  const DURATION = prefersReducedMotion() ? 0 : 3800;

  btnBecome?.addEventListener('click', () => {
    if (ctrl.stage !== STAGE.THRESHOLD) return;
    ctrl.setStage(STAGE.TRANSITION);

    const afterCross = () => {
      ctrl.setStage(STAGE.VALLEY);
      window.setTimeout(() => ctrl.setStage(STAGE.GUIDED), 400);
    };

    /* CSS valley layer always crossfades; WebGL adds optional motion on top. */
    if (scene && DURATION > 0) {
      runFallbackTransition({ root, onTransitionEnd: () => {} });
      scene.runTransition(DURATION, afterCross);
    } else {
      runFallbackTransition({ root, onTransitionEnd: afterCross });
    }
  });

  document.getElementById('cm-guided-continue')?.addEventListener('click', () => {
    if (ctrl.stage !== STAGE.GUIDED) return;
    ctrl.setStage(STAGE.WALK);
  });

  let walkTaps = 0;
  const walkZone = document.getElementById('cm-walk-zone');
  const walkCount = document.getElementById('cm-walk-count');

  function onWalkAdvance() {
    if (ctrl.stage !== STAGE.WALK) return;
    walkTaps += 1;
    walkZone.dataset.cmWalkStep = String(walkTaps);
    if (walkCount) {
      walkCount.textContent =
        walkTaps >= 2 ? 'Paths visible.' : `Forward step ${walkTaps} of 2.`;
    }
    if (walkTaps >= 2) {
      ctrl.setStage(STAGE.PATHS);
    }
  }

  walkZone?.addEventListener('click', onWalkAdvance);
  walkZone?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onWalkAdvance();
    }
  });

  document.querySelectorAll('[data-cm-path]').forEach((el) => {
    el.addEventListener('click', (e) => {
      const key = el.getAttribute('data-cm-path');
      if (!key || !(key in PATH_INTENTS)) return;
      e.preventDefault();
      el.classList.add('cm-path--pulse');
      window.setTimeout(() => {
        window.location.href = onboardingUrl(PATH_INTENTS[key]);
      }, 320);
    });
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', main);
} else {
  main();
}
