import { eventBus } from '../utils/EventBus';

export type GameStateType = 'menu' | 'select' | 'intro' | 'play' | 'pause';

export interface Scene {
  enter(): void;
  exit(): void;
  update(deltaTime: number): void;
  render(): void;
}

export class GameState {
  private currentState: GameStateType = 'menu';
  private scenes: Map<GameStateType, Scene> = new Map();

  constructor() {
    this.setupStateChangeListener();
  }

  private setupStateChangeListener(): void {
    eventBus.on('stateChanged', (newState: unknown) => {
      console.log(`Game state changed to: ${newState}`);
    });
  }

  registerScene(state: GameStateType, scene: Scene): void {
    this.scenes.set(state, scene);
  }

  setState(newState: GameStateType): void {
    if (newState === this.currentState) return;

    const currentScene = this.scenes.get(this.currentState);
    if (currentScene) {
      currentScene.exit();
    }

    const previousState = this.currentState;
    this.currentState = newState;

    const newScene = this.scenes.get(newState);
    if (newScene) {
      newScene.enter();
    }

    eventBus.emit('stateChanged', newState, previousState);
  }

  getState(): GameStateType {
    return this.currentState;
  }

  update(deltaTime: number): void {
    const currentScene = this.scenes.get(this.currentState);
    if (currentScene) {
      currentScene.update(deltaTime);
    }
  }

  render(): void {
    const currentScene = this.scenes.get(this.currentState);
    if (currentScene) {
      currentScene.render();
    }
  }
}
