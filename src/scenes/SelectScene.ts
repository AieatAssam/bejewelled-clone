import { Scene } from '../game/GameState';
import { UIManager } from '../ui/UIManager';
import { eventBus } from '../utils/EventBus';
import { Renderer3D } from '../renderer/Renderer3D';
import { PRINCESSES, Princess } from '../characters/princessData';

export class SelectScene implements Scene {
  private uiManager: UIManager;
  private renderer: Renderer3D;
  private container: HTMLElement | null = null;
  private selectedPrincess: Princess | null = null;

  constructor(uiManager: UIManager, renderer: Renderer3D) {
    this.uiManager = uiManager;
    this.renderer = renderer;
  }

  enter(): void {
    this.createUI();
  }

  private createUI(): void {
    this.container = this.uiManager.createContainer();

    const title = this.uiManager.createTitle('Choose Your Princess');
    title.style.marginBottom = '1rem';
    this.container.appendChild(title);

    const grid = document.createElement('div');
    grid.className = 'princess-grid';
    this.container.appendChild(grid);

    for (const princess of PRINCESSES) {
      const card = this.createPrincessCard(princess);
      grid.appendChild(card);
    }

    const backButton = this.uiManager.createButton('Back', () => {
      eventBus.emit('changeState', 'menu');
    });
    backButton.style.marginTop = '20px';
    this.container.appendChild(backButton);

    this.uiManager.showElement(this.container);
    this.uiManager.fadeIn(this.container);
  }

  private createPrincessCard(princess: Princess): HTMLElement {
    const card = document.createElement('div');
    card.className = 'princess-card';

    const primaryColor = princess.colors.primary.toString(16).padStart(6, '0');
    const secondaryColor = princess.colors.secondary.toString(16).padStart(6, '0');

    card.style.background = `linear-gradient(135deg, #${primaryColor} 0%, #${secondaryColor} 100%)`;

    const avatar = document.createElement('div');
    avatar.style.cssText = `
      width: 60px;
      height: 60px;
      background: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2rem;
    `;
    avatar.textContent = princess.name[0];
    card.appendChild(avatar);

    const name = document.createElement('div');
    name.className = 'princess-name';
    name.textContent = princess.name;
    card.appendChild(name);

    const theme = document.createElement('div');
    theme.style.cssText = `
      font-size: 0.9rem;
      opacity: 0.9;
    `;
    theme.textContent = princess.theme;
    card.appendChild(theme);

    card.addEventListener('click', () => {
      this.selectPrincess(princess);
    });

    card.addEventListener('mouseenter', () => {
      card.style.transform = 'scale(1.1)';
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = 'scale(1)';
    });

    return card;
  }

  private selectPrincess(princess: Princess): void {
    this.selectedPrincess = princess;
    eventBus.emit('princessSelected', princess);
    eventBus.emit('changeState', 'intro');
  }

  getSelectedPrincess(): Princess | null {
    return this.selectedPrincess;
  }

  exit(): void {
    if (this.container) {
      this.uiManager.hideCurrentUI();
      this.container = null;
    }
  }

  update(deltaTime: number): void {
    // No animation needed
  }

  render(): void {
    this.renderer.render();
  }
}
