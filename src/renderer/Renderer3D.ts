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
  private envMap: THREE.CubeTexture | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.scene = new THREE.Scene();

    // Create a magical gradient background
    this.scene.background = new THREE.Color(0x1a0a2e);

    // Create procedural environment map for gem reflections
    this.createEnvironmentMap();

    this.camera = new THREE.PerspectiveCamera(
      50,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 0, 12);
    this.camera.lookAt(0, 0, 0);

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
    this.renderer.toneMappingExposure = 1.0;

    // Hemisphere light for soft ambient lighting
    this.hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x443366, 0.5);
    this.scene.add(this.hemisphereLight);

    // Ambient light for base brightness
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
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
    // Subtle accent lights
    const lightConfig = [
      { color: 0xffffff, pos: [0, 0, 8], intensity: 0.3 },   // Front fill
      { color: 0xffd700, pos: [5, 5, 5], intensity: 0.2 },   // Warm accent
    ];

    lightConfig.forEach(({ color, pos, intensity }) => {
      const light = new THREE.PointLight(color, intensity, 20);
      light.position.set(pos[0], pos[1], pos[2]);
      this.pointLights.push(light);
      this.scene.add(light);
    });
  }

  private createEnvironmentMap(): void {
    // Create a procedural environment map for gem reflections
    const size = 128;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    // Create gradient for each face
    const faces: HTMLCanvasElement[] = [];
    const faceColors = [
      ['#4a1a6b', '#2d1b4e', '#1a0a2e'], // Right - purple gradient
      ['#4a1a6b', '#2d1b4e', '#1a0a2e'], // Left
      ['#ffd700', '#ffaa00', '#ff8800'], // Top - golden
      ['#1a0a2e', '#0d0518', '#000000'], // Bottom - dark
      ['#ff69b4', '#9966ff', '#4488ff'], // Front - colorful
      ['#9966ff', '#4488ff', '#44ddff'], // Back - colorful
    ];

    faceColors.forEach((colors) => {
      const faceCanvas = document.createElement('canvas');
      faceCanvas.width = size;
      faceCanvas.height = size;
      const faceCtx = faceCanvas.getContext('2d')!;

      const gradient = faceCtx.createLinearGradient(0, 0, size, size);
      gradient.addColorStop(0, colors[0]);
      gradient.addColorStop(0.5, colors[1]);
      gradient.addColorStop(1, colors[2]);
      faceCtx.fillStyle = gradient;
      faceCtx.fillRect(0, 0, size, size);

      // Add some sparkle dots
      faceCtx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      for (let i = 0; i < 20; i++) {
        const x = Math.random() * size;
        const y = Math.random() * size;
        const r = Math.random() * 2 + 0.5;
        faceCtx.beginPath();
        faceCtx.arc(x, y, r, 0, Math.PI * 2);
        faceCtx.fill();
      }

      faces.push(faceCanvas);
    });

    const cubeTexture = new THREE.CubeTexture(faces);
    cubeTexture.needsUpdate = true;
    this.envMap = cubeTexture;
    this.scene.environment = cubeTexture;
  }

  private setupResizeHandler(): void {
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
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
