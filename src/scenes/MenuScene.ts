import { Scene } from '../game/GameState';
import { UIManager } from '../ui/UIManager';
import { eventBus } from '../utils/EventBus';
import { Renderer3D } from '../renderer/Renderer3D';
import * as THREE from 'three';

export class MenuScene implements Scene {
  private uiManager: UIManager;
  private renderer: Renderer3D;
  private container: HTMLElement | null = null;
  private decorativeGems: THREE.Mesh[] = [];
  private time: number = 0;

  constructor(uiManager: UIManager, renderer: Renderer3D) {
    this.uiManager = uiManager;
    this.renderer = renderer;
  }

  enter(): void {
    this.createUI();
    this.createDecorativeGems();
  }

  private createUI(): void {
    this.container = this.uiManager.createContainer();

    const title = this.uiManager.createTitle('Princess Puzzle');
    this.container.appendChild(title);

    const subtitle = document.createElement('p');
    subtitle.textContent = 'A Jewel Matching Adventure';
    subtitle.style.cssText = `
      font-family: 'Georgia', serif;
      font-size: 1.5rem;
      color: #ff69b4;
      margin-bottom: 2rem;
    `;
    this.container.appendChild(subtitle);

    const playButton = this.uiManager.createButton('Play', () => {
      eventBus.emit('changeState', 'select');
    });
    this.container.appendChild(playButton);

    const continueButton = this.uiManager.createButton('Continue', () => {
      eventBus.emit('loadGame');
      eventBus.emit('changeState', 'play');
    });
    this.container.appendChild(continueButton);

    this.uiManager.showElement(this.container);
    this.uiManager.fadeIn(this.container);
  }

  private createDecorativeGems(): void {
    const colors = [0xff69b4, 0x9966cc, 0xffd700, 0x00ced1, 0xff4500];
    const scene = this.renderer.getScene();

    for (let i = 0; i < 15; i++) {
      const geometry = new THREE.OctahedronGeometry(0.3, 0);
      const material = new THREE.MeshStandardMaterial({
        color: colors[i % colors.length],
        emissive: colors[i % colors.length],
        emissiveIntensity: 0.3,
        metalness: 0.5,
        roughness: 0.2,
      });

      const gem = new THREE.Mesh(geometry, material);
      gem.position.set(
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 10,
        -5 - Math.random() * 5
      );
      gem.userData.rotationSpeed = 0.5 + Math.random() * 1;
      gem.userData.floatSpeed = 1 + Math.random() * 2;
      gem.userData.floatOffset = Math.random() * Math.PI * 2;

      scene.add(gem);
      this.decorativeGems.push(gem);
    }
  }

  exit(): void {
    if (this.container) {
      this.uiManager.hideCurrentUI();
      this.container = null;
    }

    const scene = this.renderer.getScene();
    for (const gem of this.decorativeGems) {
      scene.remove(gem);
      gem.geometry.dispose();
      (gem.material as THREE.Material).dispose();
    }
    this.decorativeGems = [];
  }

  update(deltaTime: number): void {
    this.time += deltaTime;

    for (const gem of this.decorativeGems) {
      gem.rotation.y += deltaTime * gem.userData.rotationSpeed;
      gem.rotation.x += deltaTime * gem.userData.rotationSpeed * 0.5;
      gem.position.y += Math.sin(this.time * gem.userData.floatSpeed + gem.userData.floatOffset) * deltaTime * 0.5;
    }
  }

  render(): void {
    this.renderer.render();
  }
}
