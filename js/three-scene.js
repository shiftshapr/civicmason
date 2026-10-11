/**
 * Three.js overlay: composites on top of CSS hero photography (transparent canvas).
 * Geometry is hidden until runTransition(); threshold is always the real door images.
 */
import * as THREE from 'three';

function smoothstep(t) {
  const x = Math.min(1, Math.max(0, t));
  return x * x * (3 - 2 * x);
}

export class CMThreeScene {
  /**
   * @param {HTMLCanvasElement} canvas
   */
  constructor(canvas) {
    this.canvas = canvas;
    this._raf = 0;
    this._transitionRaf = 0;
    this._running = false;

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.setClearColor(0x000000, 0);

    this.scene = new THREE.Scene();
    this.scene.background = null;

    const aspect = 1;
    this.camera = new THREE.PerspectiveCamera(48, aspect, 0.1, 120);
    this.camera.position.set(0, 1.45, 4.2);

    this._parallax = { x: 0, y: 0 };
    this._baseCam = this.camera.position.clone();

    this.worldGroup = new THREE.Group();
    this.scene.add(this.worldGroup);
    this.worldGroup.visible = false;

    const amb = new THREE.AmbientLight(0x4a4538, 0.35);
    this.scene.add(amb);

    this.torch = new THREE.PointLight(0xffa64d, 2.2, 18, 2);
    this.torch.position.set(1.35, 1.8, 2.1);
    this.worldGroup.add(this.torch);

    const moon = new THREE.DirectionalLight(0xc9d8f0, 0.15);
    moon.position.set(-3, 6, -4);
    this.worldGroup.add(moon);

    const valleyLight = new THREE.HemisphereLight(0x8fa8c8, 0x1a1510, 0.25);
    this.worldGroup.add(valleyLight);

    const stoneMat = new THREE.MeshStandardMaterial({
      color: 0x2a2e2c,
      roughness: 0.92,
      metalness: 0.05,
    });
    const wallGeo = new THREE.BoxGeometry(8, 5, 0.4);
    const leftWall = new THREE.Mesh(wallGeo, stoneMat);
    leftWall.position.set(-2.6, 2.2, 0);
    const rightWall = new THREE.Mesh(wallGeo, stoneMat);
    rightWall.position.set(2.6, 2.2, 0);
    this.worldGroup.add(leftWall, rightWall);

    const lintel = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.5, 0.45), stoneMat);
    lintel.position.set(0, 4.35, 0);
    this.worldGroup.add(lintel);

    const doorMat = new THREE.MeshStandardMaterial({
      color: 0x1c1410,
      roughness: 0.88,
      metalness: 0.08,
    });
    const doorGeo = new THREE.BoxGeometry(2.2, 3.6, 0.12);
    this.door = new THREE.Mesh(doorGeo, doorMat);
    this.doorPivot = new THREE.Group();
    this.doorPivot.position.set(-2.15, 0, 0.05);
    this.doorPivot.add(this.door);
    this.door.position.set(1.1, 1.85, 0);
    this.worldGroup.add(this.doorPivot);

    const valleyMat = new THREE.MeshStandardMaterial({
      color: 0x2d3a32,
      roughness: 1,
      metalness: 0,
      emissive: 0x1a2820,
      emissiveIntensity: 0.35,
      transparent: true,
      opacity: 0.45,
    });
    this.valleyPlane = new THREE.Mesh(new THREE.PlaneGeometry(80, 80, 1, 1), valleyMat);
    this.valleyPlane.rotation.x = -Math.PI / 2;
    this.valleyPlane.position.set(0, 0, -22);
    this.worldGroup.add(this.valleyPlane);

    const n = 24;
    const positions = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 45;
      positions[i * 3 + 1] = 0.15 + Math.random() * 0.4;
      positions[i * 3 + 2] = -18 - Math.random() * 25;
    }
    const dotsGeo = new THREE.BufferGeometry();
    dotsGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const dotsMat = new THREE.PointsMaterial({
      color: 0xffe8c4,
      size: 0.12,
      transparent: true,
      opacity: 0.35,
      depthWrite: false,
      sizeAttenuation: true,
    });
    this.builderLights = new THREE.Points(dotsGeo, dotsMat);
    this.worldGroup.add(this.builderLights);

    this._camZStart = this.camera.position.z;
    this._camZEnd = -1.2;
    this._doorOpen = 0.95;
  }

  resize() {
    const w = this.canvas.clientWidth || window.innerWidth;
    const h = this.canvas.clientHeight || window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setSize(w, h, false);
  }

  setParallax(nx, ny) {
    this._parallax.x = nx;
    this._parallax.y = ny;
  }

  start() {
    this._running = true;
    const loop = () => {
      if (!this._running) return;
      this.camera.position.x = this._baseCam.x + this._parallax.x * 0.08;
      this.camera.position.y = this._baseCam.y + this._parallax.y * 0.05;
      this.renderer.render(this.scene, this.camera);
      this._raf = requestAnimationFrame(loop);
    };
    this._raf = requestAnimationFrame(loop);
  }

  stop() {
    this._running = false;
    cancelAnimationFrame(this._raf);
    cancelAnimationFrame(this._transitionRaf);
  }

  /**
   * @param {number} durationMs
   * @param {() => void} onComplete
   */
  runTransition(durationMs, onComplete) {
    this.worldGroup.visible = true;
    this.canvas.classList.add('cm-canvas--transition-active');

    const start = performance.now();
    const camZ0 = this.camera.position.z;
    const camZ1 = this._camZEnd;

    const tick = (now) => {
      const raw = (now - start) / durationMs;
      const t = smoothstep(raw);
      this.doorPivot.rotation.y = t * this._doorOpen;
      this.camera.position.z = camZ0 + (camZ1 - camZ0) * t;
      this.torch.intensity = 2.2 * (1 - t * 0.92);
      if (this.builderLights.material && 'opacity' in this.builderLights.material) {
        this.builderLights.material.opacity = 0.35 + t * 0.45;
      }
      if (raw < 1) {
        this._transitionRaf = requestAnimationFrame(tick);
      } else {
        this._transitionRaf = 0;
        this.worldGroup.visible = false;
        this.canvas.classList.remove('cm-canvas--transition-active');
        this.doorPivot.rotation.y = 0;
        this.camera.position.z = camZ0;
        this.torch.intensity = 2.2;
        if (this.builderLights.material && 'opacity' in this.builderLights.material) {
          this.builderLights.material.opacity = 0.35;
        }
        onComplete();
      }
    };
    this._transitionRaf = requestAnimationFrame(tick);
  }

  dispose() {
    this.stop();
    this.renderer.dispose();
  }
}
