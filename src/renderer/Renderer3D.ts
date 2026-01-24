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
    this.renderer.toneMappingExposure = 1.2;

    // Hemisphere light for soft ambient lighting
    this.hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x444499, 0.6);
    this.scene.add(this.hemisphereLight);

    // Ambient light for base brightness
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(this.ambientLight);

    // Main directional light (from camera direction)
    this.directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    this.directionalLight.position.set(2, 4, 10);
    this.scene.add(this.directionalLight);

    // Add rim light for sparkle
    const rimLight = new THREE.DirectionalLight(0xffd700, 0.4);
    rimLight.position.set(-5, 3, -2);
    this.scene.add(rimLight);

    this.setupPointLights();
    this.setupResizeHandler();
  }

  private setupPointLights(): void {
    // Colorful accent lights for magical feel
    const lightConfig = [
      { color: 0xff69b4, pos: [-6, 4, 4], intensity: 0.4 },  // Pink
      { color: 0x9966ff, pos: [6, 4, 4], intensity: 0.4 },   // Purple
      { color: 0xffd700, pos: [0, -4, 6], intensity: 0.3 },  // Gold
      { color: 0x44ddff, pos: [0, 6, 3], intensity: 0.3 },   // Cyan
    ];

    lightConfig.forEach(({ color, pos, intensity }) => {
      const light = new THREE.PointLight(color, intensity, 15);
      light.position.set(pos[0], pos[1], pos[2]);
      this.pointLights.push(light);
      this.scene.add(light);
    });
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
