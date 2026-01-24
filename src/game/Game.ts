import { GameState, GameStateType } from './GameState';
import { SaveManager } from './SaveManager';
import { UIManager } from '../ui/UIManager';
import { Renderer3D } from '../renderer/Renderer3D';
import { MenuScene } from '../scenes/MenuScene';
import { SelectScene } from '../scenes/SelectScene';
import { IntroScene } from '../scenes/IntroScene';
import { GameScene } from '../scenes/GameScene';
import { PauseScene } from '../scenes/PauseScene';
import { DragonEvent } from '../puzzle/DragonEvent';
import { eventBus } from '../utils/EventBus';
import { getPrincessById } from '../characters/princessData';

export class Game {
  private gameState: GameState;
  private saveManager: SaveManager;
  private uiManager: UIManager;
  private renderer: Renderer3D;
  private animationFrameId: number | null = null;
  private lastTime: number = 0;

  private menuScene: MenuScene;
  private selectScene: SelectScene;
  private introScene: IntroScene;
  private gameScene: GameScene;
  private pauseScene: PauseScene;

  constructor() {
    const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;

    this.gameState = new GameState();
    this.saveManager = new SaveManager();
    this.uiManager = new UIManager();
    this.renderer = new Renderer3D(canvas);

    // Create dragon event for sharing between scenes
    const dragonEvent = new DragonEvent();

    // Initialize all scenes
    this.menuScene = new MenuScene(this.uiManager, this.renderer);
    this.selectScene = new SelectScene(this.uiManager, this.renderer);
    this.introScene = new IntroScene(this.uiManager, this.renderer);
    this.gameScene = new GameScene(this.uiManager, this.renderer);
    this.pauseScene = new PauseScene(this.uiManager, this.renderer, dragonEvent);

    // Register scenes
    this.gameState.registerScene('menu', this.menuScene);
    this.gameState.registerScene('select', this.selectScene);
    this.gameState.registerScene('intro', this.introScene);
    this.gameState.registerScene('play', this.gameScene);
    this.gameState.registerScene('pause', this.pauseScene);

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    eventBus.on('changeState', (state: unknown) => {
      const newState = state as GameStateType;
      // Reset game when going to menu or starting fresh from intro
      if (newState === 'menu' || newState === 'intro') {
        this.gameScene.resetGame();
      }
      this.gameState.setState(newState);
    });

    eventBus.on('saveGame', () => {
      this.saveGame();
    });

    eventBus.on('loadGame', () => {
      this.loadGame();
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

  private saveGame(): void {
    const princess = this.selectScene.getSelectedPrincess();
    if (!princess) return;

    const board = this.gameScene.getBoard();
    const score = this.gameScene.getScore();
    const dragonEvent = this.gameScene.getDragonEvent();
    const controller = this.gameScene.getController();

    const saveData = this.saveManager.createSaveData(
      princess,
      score,
      board.toArray(),
      dragonEvent.getCollection(),
      controller.getConsecutiveSmallChains()
    );

    if (this.saveManager.save(saveData)) {
      console.log('Game saved successfully');
    }
  }

  private loadGame(): void {
    const saveData = this.saveManager.load();
    if (!saveData) {
      console.log('No save data found');
      return;
    }

    // Restore princess
    const princess = getPrincessById(saveData.princessId);
    if (princess) {
      eventBus.emit('princessSelected', princess);
    }

    // The game scene will need to be modified to accept restored state
    console.log('Game loaded:', saveData);
  }

  start(): void {
    console.log('Princess Puzzle Game starting...');
    // Enter the initial menu scene (state is already 'menu', so we need to force enter)
    this.gameState.enterCurrentScene();
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
    this.renderer.dispose();
  }
}
