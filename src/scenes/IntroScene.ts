import { Scene } from '../game/GameState';
import { UIManager } from '../ui/UIManager';
import { eventBus } from '../utils/EventBus';
import { Renderer3D } from '../renderer/Renderer3D';
import { Princess, getDefaultPrincess } from '../characters/princessData';
import { DragonModel } from '../renderer/DragonModel';

export class IntroScene implements Scene {
  private uiManager: UIManager;
  private renderer: Renderer3D;
  private container: HTMLElement | null = null;
  private princess: Princess;
  private dragon: DragonModel;
  private storyPhase: number = 0;
  private phaseTime: number = 0;
  private textElement: HTMLElement | null = null;

  private storyTexts: string[] = [
    'In a kingdom of sparkling jewels and radiant gems...',
    'Princess {name} guarded the royal treasure with great care.',
    'But a cunning dragon discovered the hoard...',
    'Now the dragon steals gems whenever the princess grows careless!',
    'Match gems wisely to build your treasure...',
    'Create large combos to keep the dragon at bay!',
  ];

  constructor(uiManager: UIManager, renderer: Renderer3D) {
    this.uiManager = uiManager;
    this.renderer = renderer;
    this.princess = getDefaultPrincess();
    this.dragon = new DragonModel();
    this.renderer.add(this.dragon.getGroup());

    eventBus.on('princessSelected', (princess: Princess) => {
      this.princess = princess;
    });
  }

  enter(): void {
    this.storyPhase = 0;
    this.phaseTime = 0;
    this.createUI();
    this.showStoryText(0);
  }

  private createUI(): void {
    this.container = document.createElement('div');
    this.container.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
    `;

    this.textElement = document.createElement('div');
    this.textElement.className = 'intro-text';
    this.container.appendChild(this.textElement);

    const promptElement = document.createElement('div');
    promptElement.className = 'continue-prompt';
    promptElement.textContent = 'Click to continue...';
    this.container.appendChild(promptElement);

    this.container.addEventListener('click', () => {
      this.advanceStory();
    });

    document.addEventListener('keydown', this.handleKeyDown);

    this.uiManager.showElement(this.container);
  }

  private handleKeyDown = (e: KeyboardEvent): void => {
    if (e.key === ' ' || e.key === 'Enter') {
      this.advanceStory();
    }
  };

  private showStoryText(phase: number): void {
    if (this.textElement && phase < this.storyTexts.length) {
      let text = this.storyTexts[phase];
      text = text.replace('{name}', this.princess.name);
      this.textElement.textContent = text;
      this.textElement.style.opacity = '0';
      setTimeout(() => {
        if (this.textElement) {
          this.textElement.style.transition = 'opacity 0.5s ease-in-out';
          this.textElement.style.opacity = '1';
        }
      }, 100);

      // Show dragon flying at phase 3
      if (phase === 2) {
        this.dragon.flyAcrossScreen();
      }
    }
  }

  private advanceStory(): void {
    this.storyPhase++;
    if (this.storyPhase >= this.storyTexts.length) {
      eventBus.emit('changeState', 'play');
    } else {
      this.showStoryText(this.storyPhase);
    }
  }

  exit(): void {
    document.removeEventListener('keydown', this.handleKeyDown);

    if (this.container) {
      this.uiManager.hideCurrentUI();
      this.container = null;
      this.textElement = null;
    }
  }

  update(deltaTime: number): void {
    this.phaseTime += deltaTime;
    this.dragon.update(deltaTime);
  }

  render(): void {
    this.renderer.render();
  }
}
