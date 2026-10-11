import { STAGE } from './config.js';

/**
 * Drives data-cm-stage on #cm-root and notifies listeners.
 */
export class StageController {
  /**
   * @param {{ root: HTMLElement; onStage?: (stage: string, prev: string) => void; live?: HTMLElement | null }} opts
   */
  constructor(opts) {
    this.root = opts.root;
    this.onStage = opts.onStage || (() => {});
    this.live = opts.live || null;
    this._stage = STAGE.THRESHOLD;
    this.root.dataset.cmStage = this._stage;
  }

  get stage() {
    return this._stage;
  }

  /**
   * @param {string} next
   */
  setStage(next) {
    const prev = this._stage;
    if (next === prev) return;
    this._stage = next;
    this.root.dataset.cmStage = next;
    this.onStage(next, prev);
    if (this.live) {
      const labels = {
        [STAGE.THRESHOLD]: 'Threshold. Become a Civic Mason when you are ready.',
        [STAGE.TRANSITION]: 'Crossing the threshold.',
        [STAGE.VALLEY]: 'Valley. The commons ahead.',
        [STAGE.GUIDED]: 'Guided entry.',
        [STAGE.WALK]: 'Tap to walk forward.',
        [STAGE.PATHS]: 'Choose how you will build.',
      };
      this.live.textContent = labels[next] || next;
    }
  }
}

export { STAGE };
