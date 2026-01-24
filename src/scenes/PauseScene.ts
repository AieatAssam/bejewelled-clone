import { Scene } from '../game/GameState';
import { UIManager } from '../ui/UIManager';
import { Renderer3D } from '../renderer/Renderer3D';
import { PurseUI } from '../ui/PurseUI';
import { DragonEvent } from '../puzzle/DragonEvent';
import { eventBus } from '../utils/EventBus';

export class PauseScene implements Scene {
  private uiManager: UIManager;
  private renderer: Renderer3D;
  private container: HTMLElement | null = null;
  private purseUI: PurseUI;
  private dragonEvent: DragonEvent;

  constructor(uiManager: UIManager, renderer: Renderer3D, dragonEvent: DragonEvent) {
    this.uiManager = uiManager;
    this.renderer = renderer;
    this.dragonEvent = dragonEvent;
    this.purseUI = new PurseUI(dragonEvent);
  }

  enter(): void {
    this.createUI();
  }

  private createUI(): void {
    this.container = document.createElement('div');
    this.container.id = 'pause-menu';

    const title = this.uiManager.createTitle('Paused');
    title.style.marginBottom = '20px';
    this.container.appendChild(title);

    // Add purse display
    this.purseUI.update();
    this.container.appendChild(this.purseUI.getElement());

    // Buttons
    const buttonContainer = document.createElement('div');
    buttonContainer.style.marginTop = '20px';

    const resumeButton = this.uiManager.createButton('Resume', () => {
      eventBus.emit('changeState', 'play');
    });
    buttonContainer.appendChild(resumeButton);

    const saveButton = this.uiManager.createButton('Save Game', () => {
      eventBus.emit('saveGame');
      this.showSaveConfirmation();
    });
    buttonContainer.appendChild(saveButton);

    const menuButton = this.uiManager.createButton('Main Menu', () => {
      eventBus.emit('changeState', 'menu');
    });
    buttonContainer.appendChild(menuButton);

    this.container.appendChild(buttonContainer);

    this.uiManager.showElement(this.container);
    this.uiManager.fadeIn(this.container);
  }

  private showSaveConfirmation(): void {
    const confirmation = document.createElement('div');
    confirmation.textContent = 'Game Saved!';
    confirmation.style.cssText = `
      color: #00ff00;
      font-family: 'Georgia', serif;
      font-size: 1.2rem;
      margin-top: 10px;
      animation: fadeOut 2s forwards;
    `;

    if (this.container) {
      this.container.appendChild(confirmation);
      setTimeout(() => confirmation.remove(), 2000);
    }
  }

  exit(): void {
    if (this.container) {
      this.uiManager.hideCurrentUI();
      this.container = null;
    }
  }

  update(deltaTime: number): void {
    // Pause menu doesn't need updates
  }

  render(): void {
    // Keep rendering the game scene behind the pause menu
    this.renderer.render();
  }

  updateDragonEvent(dragonEvent: DragonEvent): void {
    this.dragonEvent = dragonEvent;
    this.purseUI = new PurseUI(dragonEvent);
  }
}
