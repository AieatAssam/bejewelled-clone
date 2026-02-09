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

    // Buttons - horizontal layout for compactness
    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = `
      margin-top: 15px;
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      justify-content: center;
    `;

    const resumeButton = this.uiManager.createButton('Resume', () => {
      eventBus.emit('changeState', 'play');
    });
    resumeButton.style.cssText += 'width: auto; padding: 12px 25px; font-size: 1.1rem;';
    buttonContainer.appendChild(resumeButton);

    const saveButton = this.uiManager.createButton('Save', () => {
      eventBus.emit('saveGame');
      this.showSaveConfirmation();
    });
    saveButton.style.cssText += 'width: auto; padding: 12px 25px; font-size: 1.1rem;';
    buttonContainer.appendChild(saveButton);

    const menuButton = this.uiManager.createButton('Menu', () => {
      this.showExitConfirmation();
    });
    menuButton.style.cssText += 'width: auto; padding: 12px 25px; font-size: 1.1rem;';
    buttonContainer.appendChild(menuButton);

    this.container.appendChild(buttonContainer);

    this.uiManager.showElement(this.container);
    this.uiManager.fadeIn(this.container);
  }

  private showSaveConfirmation(): void {
    const confirmation = document.createElement('div');
    confirmation.textContent = 'Game Saved!';
    confirmation.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      z-index: 10000;
      color: #00ff00;
      font-family: 'Georgia', serif;
      font-size: 2rem;
      font-weight: bold;
      background: rgba(0, 0, 0, 0.85);
      padding: 20px 40px;
      border: 2px solid #00ff00;
      border-radius: 12px;
      text-align: center;
      opacity: 1;
      transition: opacity 0.5s ease;
      pointer-events: none;
    `;

    document.body.appendChild(confirmation);
    setTimeout(() => {
      confirmation.style.opacity = '0';
    }, 1200);
    setTimeout(() => confirmation.remove(), 1800);
  }

  private showExitConfirmation(): void {
    if (!this.container) return;

    // Clear all children from the pause menu container
    while (this.container.firstChild) {
      this.container.removeChild(this.container.firstChild);
    }

    const message = document.createElement('div');
    message.textContent = 'Return to Main Menu?';
    message.style.cssText = `
      color: #ffd700;
      font-family: 'Cinzel Decorative', serif;
      font-size: 1.4rem;
      text-align: center;
      margin-bottom: 10px;
    `;
    this.container.appendChild(message);

    const subtitle = document.createElement('div');
    subtitle.textContent = 'Unsaved progress will be lost.';
    subtitle.style.cssText = `
      color: #ff8888;
      font-size: 1rem;
      text-align: center;
      margin-bottom: 20px;
    `;
    this.container.appendChild(subtitle);

    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = `
      display: flex;
      gap: 15px;
      justify-content: center;
    `;

    const exitButton = this.uiManager.createButton('Yes, Exit', () => {
      eventBus.emit('changeState', 'menu');
    });
    exitButton.style.cssText += 'width: auto; padding: 12px 25px; font-size: 1.1rem;';
    buttonContainer.appendChild(exitButton);

    const cancelButton = this.uiManager.createButton('Cancel', () => {
      this.restorePauseMenu();
    });
    cancelButton.style.cssText += 'width: auto; padding: 12px 25px; font-size: 1.1rem;';
    buttonContainer.appendChild(cancelButton);

    this.container.appendChild(buttonContainer);
  }

  private restorePauseMenu(): void {
    this.exit();
    this.enter();
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
