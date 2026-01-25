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
    this.renderer.toneMappingExposure = 1.2; // Brighter for gem sparkle

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
    // Enhanced lighting for sparkly gem appearance
    const lightConfig = [
      { color: 0xffffff, pos: [0, 0, 10], intensity: 0.5 },   // Front fill - brighter
      { color: 0xffd700, pos: [6, 4, 6], intensity: 0.4 },    // Warm gold accent (top right)
      { color: 0xff69b4, pos: [-6, 4, 6], intensity: 0.3 },   // Pink accent (top left)
      { color: 0x4488ff, pos: [0, -5, 8], intensity: 0.3 },   // Cool blue from bottom
      { color: 0xffffff, pos: [4, -2, 7], intensity: 0.25 },  // Extra sparkle right
      { color: 0xffffff, pos: [-4, -2, 7], intensity: 0.25 }, // Extra sparkle left
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

    // Vibrant gradient for gem reflections
    const gradient = ctx.createLinearGradient(0, 0, 0, 512);
    gradient.addColorStop(0, '#ffddaa');    // Warm top (golden light)
    gradient.addColorStop(0.2, '#ffffff');   // Bright white
    gradient.addColorStop(0.4, '#aaddff');   // Light blue
    gradient.addColorStop(0.6, '#ff99cc');   // Pink
    gradient.addColorStop(0.8, '#9966ff');   // Purple
    gradient.addColorStop(1, '#2d1b4e');     // Dark bottom
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 512, 512);

    // Add bright spots for sparkle reflections
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 50; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 256; // More in upper half
      const r = Math.random() * 8 + 2;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

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
    const envMap = pmremGenerator.fromScene(envScene, 0.04).texture;
    this.envMap = envMap;
    this.scene.environment = envMap;

    // Cleanup
    pmremGenerator.dispose();
    skyGeom.dispose();
    skyMat.dispose();
    skyTexture.dispose();
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
