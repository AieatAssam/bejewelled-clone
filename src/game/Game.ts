import { GameState, GameStateType } from './GameState';
import { eventBus } from '../utils/EventBus';

export class Game {
  private gameState: GameState;
  private animationFrameId: number | null = null;
  private lastTime: number = 0;

  constructor() {
    this.gameState = new GameState();
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    eventBus.on('changeState', (state: unknown) => {
      this.gameState.setState(state as GameStateType);
    });

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (this.gameState.getState() === 'play') {
          eventBus.emit('changeState', 'pause');
        } else if (this.gameState.getState() === 'pause') {
          eventBus.emit('changeState', 'play');
        }
      }
    });
  }

  start(): void {
    console.log('Princess Puzzle Game starting...');
    this.gameState.setState('menu');
    this.lastTime = performance.now();
    this.gameLoop();
  }

  private gameLoop(): void {
    const currentTime = performance.now();
    const deltaTime = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;

    this.update(deltaTime);
    this.render();

    this.animationFrameId = requestAnimationFrame(() => this.gameLoop());
  }

  private update(deltaTime: number): void {
    this.gameState.update(deltaTime);
  }

  private render(): void {
    this.gameState.render();
  }

  stop(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }
}
