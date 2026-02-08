import * as THREE from 'three';
import { eventBus } from '../utils/EventBus';

export class Renderer3D {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private ambientLight: THREE.AmbientLight;
  private directionalLight: THREE.DirectionalLight;
  private pointLights: THREE.PointLight[] = [];
  private hemisphereLight: THREE.HemisphereLight;
  private envMap: THREE.Texture | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.scene = new THREE.Scene();

    // Create a magical gradient background
    this.scene.background = new THREE.Color(0x1a0a2e);

    this.camera = new THREE.PerspectiveCamera(
      50,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.lookAt(0, 0, 0);
    this.fitCameraToBoard();

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = false; // Disable shadows for performance
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2; // Brighter for gem sparkle

    // Create procedural environment map for gem reflections (must be after renderer init)
    this.createEnvironmentMap();

    // Hemisphere light for soft ambient lighting (reduced for env map contrast)
    this.hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x443366, 0.15);
    this.scene.add(this.hemisphereLight);

    // Ambient light for base brightness (reduced for env map contrast)
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.10);
    this.scene.add(this.ambientLight);

    // Main directional light (from front)
    this.directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    this.directionalLight.position.set(2, 4, 10);
    this.scene.add(this.directionalLight);

    // Secondary light for depth
    const sideLight = new THREE.DirectionalLight(0xffffff, 0.5);
    sideLight.position.set(-3, 2, 6);
    this.scene.add(sideLight);

    this.setupPointLights();
    this.setupResizeHandler();
  }

  private setupPointLights(): void {
    // Reduced lighting for better env map contrast on gems
    const lightConfig = [
      { color: 0xffffff, pos: [0, 0, 10], intensity: 0.18 },   // Front fill
      { color: 0xffd700, pos: [6, 4, 6], intensity: 0.2 },     // Warm gold accent (top right)
      { color: 0xff69b4, pos: [-6, 4, 6], intensity: 0.15 },   // Pink accent (top left)
      { color: 0x4488ff, pos: [0, -5, 8], intensity: 0.15 },   // Cool blue from bottom
      { color: 0xffffff, pos: [4, -2, 7], intensity: 0.125 },  // Extra sparkle right
      { color: 0xffffff, pos: [-4, -2, 7], intensity: 0.125 }, // Extra sparkle left
    ];

    lightConfig.forEach(({ color, pos, intensity }) => {
      const light = new THREE.PointLight(color, intensity, 25);
      light.position.set(pos[0], pos[1], pos[2]);
      this.pointLights.push(light);
      this.scene.add(light);
    });
  }

  private createEnvironmentMap(): void {
    // Create HDR-like environment using PMREMGenerator for proper gem reflections
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    pmremGenerator.compileEquirectangularShader();

    // Create a bright, colorful environment scene for gem reflections
    const envScene = new THREE.Scene();

    // Gradient sky dome
    const skyGeom = new THREE.SphereGeometry(50, 32, 32);
    const skyMat = new THREE.MeshBasicMaterial({
      side: THREE.BackSide,
    });

    // Create gradient texture for sky
    const skyCanvas = document.createElement('canvas');
    skyCanvas.width = 512;
    skyCanvas.height = 512;
    const ctx = skyCanvas.getContext('2d')!;

    // Dark gradient for high-contrast gem reflections
    const gradient = ctx.createLinearGradient(0, 0, 0, 512);
    gradient.addColorStop(0, '#0b0616');
    gradient.addColorStop(0.2, '#120a2a');
    gradient.addColorStop(0.6, '#06030e');
    gradient.addColorStop(1, '#020106');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 512, 512);

    // Add high-contrast hotspots for sparkle reflections
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 10; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 200;
      const coreR = Math.random() * 2 + 1;
      const haloR = coreR * (12 + Math.random() * 10);

      const g = ctx.createRadialGradient(x, y, 0, x, y, haloR);
      g.addColorStop(0, 'rgba(255,255,255,0.9)');
      g.addColorStop(0.05, 'rgba(255,255,255,0.35)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, haloR, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(255,255,255,1)';
      ctx.beginPath();
      ctx.arc(x, y, coreR, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';

    const skyTexture = new THREE.CanvasTexture(skyCanvas);
    skyMat.map = skyTexture;
    const sky = new THREE.Mesh(skyGeom, skyMat);
    envScene.add(sky);

    // Add bright light sources in the environment for sparkle
    const lightPositions = [
      { pos: [10, 10, 10], color: 0xffffff, intensity: 3 },
      { pos: [-10, 8, 5], color: 0xffffee, intensity: 2 },
      { pos: [5, -5, 10], color: 0xffeeff, intensity: 2 },
      { pos: [-5, 10, -5], color: 0xeeffff, intensity: 1.5 },
    ];

    lightPositions.forEach(({ pos, color, intensity }) => {
      const lightGeom = new THREE.SphereGeometry(1, 8, 8);
      const lightMat = new THREE.MeshBasicMaterial({
        color: color,
      });
      const light = new THREE.Mesh(lightGeom, lightMat);
      light.position.set(pos[0], pos[1], pos[2]);
      light.scale.setScalar(intensity);
      envScene.add(light);
    });

    // Generate PMREM from the environment scene
    const envMap = pmremGenerator.fromScene(envScene, 0.1).texture;
    this.envMap = envMap;
    this.scene.environment = envMap;

    // Cleanup
    pmremGenerator.dispose();
    skyGeom.dispose();
    skyMat.dispose();
    skyTexture.dispose();
  }

  // Calculate camera Z so the 8x8 board fits in the viewport with padding for UI
  private fitCameraToBoard(): void {
    // Full board extent including gem radii: (BOARD_SIZE-1)*GEM_SPACING + GEM_SIZE
    const boardWorldSize = 7 * 1.05 + 0.85; // ~8.2 units edge-to-edge
    const aspect = window.innerWidth / window.innerHeight;
    const fovRad = (this.camera.fov * Math.PI) / 180;
    const isPortrait = aspect < 1;

    // Padding accounts for UI elements overlaying the edges
    // Portrait needs more horizontal padding since width is tighter
    const paddingH = isPortrait ? 1.35 : 1.25;
    const paddingV = isPortrait ? 1.25 : 1.3;

    const distForHeight = (boardWorldSize * paddingV * 0.5) / Math.tan(fovRad * 0.5);
    const distForWidth = (boardWorldSize * paddingH * 0.5) / (Math.tan(fovRad * 0.5) * aspect);

    const cameraZ = Math.max(distForHeight, distForWidth);
    this.camera.position.set(0, 0, Math.max(10, Math.min(cameraZ, 22)));
    this.camera.lookAt(0, 0, 0);
  }

  private setupResizeHandler(): void {
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.fitCameraToBoard();
      eventBus.emit('windowResize', window.innerWidth, window.innerHeight);
    });
  }

  getScene(): THREE.Scene {
    return this.scene;
  }

  getCamera(): THREE.PerspectiveCamera {
    return this.camera;
  }

  getRenderer(): THREE.WebGLRenderer {
    return this.renderer;
  }

  add(object: THREE.Object3D): void {
    this.scene.add(object);
  }

  remove(object: THREE.Object3D): void {
    this.scene.remove(object);
  }

  render(): void {
    this.renderer.render(this.scene, this.camera);
  }

  setCameraPosition(x: number, y: number, z: number): void {
    this.camera.position.set(x, y, z);
  }

  setCameraLookAt(x: number, y: number, z: number): void {
    this.camera.lookAt(x, y, z);
  }

  setBackgroundColor(color: number): void {
    this.scene.background = new THREE.Color(color);
  }

  getEnvMap(): THREE.Texture | null {
    return this.envMap;
  }

  dispose(): void {
    this.renderer.dispose();
    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.geometry.dispose();
        if (Array.isArray(object.material)) {
          object.material.forEach(m => m.dispose());
        } else {
          object.material.dispose();
        }
      }
    });
  }
}
