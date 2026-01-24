import * as THREE from 'three';
import { Scene } from '../game/GameState';
import { UIManager } from '../ui/UIManager';
import { Renderer3D } from '../renderer/Renderer3D';
import { Board } from '../puzzle/Board';
import { BoardController } from '../puzzle/BoardController';
import { GemMeshManager } from '../renderer/GemMesh';
import { ParticleSystem } from '../renderer/ParticleSystem';
import { DragonModel } from '../renderer/DragonModel';
import { ScoreDisplay } from '../ui/ScoreDisplay';
import { DragonEvent } from '../puzzle/DragonEvent';
import { eventBus } from '../utils/EventBus';
import { Princess, getDefaultPrincess } from '../characters/princessData';
import { GEM_COLORS } from '../puzzle/Gem';

export class GameScene implements Scene {
  private uiManager: UIManager;
  private renderer: Renderer3D;
  private board: Board;
  private controller: BoardController;
  private gemMeshManager: GemMeshManager;
  private particleSystem: ParticleSystem;
  private dragon: DragonModel;
  private scoreDisplay: ScoreDisplay;
  private dragonEvent: DragonEvent;
  private princess: Princess;

  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  private selectedGem: { row: number; col: number } | null = null;
  private isProcessing: boolean = false;
  private dragonWarning: HTMLElement | null = null;

  constructor(uiManager: UIManager, renderer: Renderer3D) {
    this.uiManager = uiManager;
    this.renderer = renderer;
    this.princess = getDefaultPrincess();

    this.board = new Board();
    this.controller = new BoardController(this.board);
    this.gemMeshManager = new GemMeshManager(renderer.getScene());
    this.particleSystem = new ParticleSystem(renderer.getScene());
    this.dragon = new DragonModel();
    this.renderer.add(this.dragon.getGroup());

    this.scoreDisplay = new ScoreDisplay();
    this.dragonEvent = new DragonEvent();

    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    this.setupEventListeners();

    eventBus.on('princessSelected', (princess: Princess) => {
      this.princess = princess;
    });
  }

  private setupEventListeners(): void {
    eventBus.on('dragonEvent', () => {
      this.triggerDragonAttack();
    });

    eventBus.on('gemsRemoved', (matches: unknown[], cascadeCount: number) => {
      // Emit particles for matched gems
      for (const match of matches as { gems: { position: { row: number; col: number }; type: string }[] }[]) {
        for (const gem of match.gems) {
          const pos = this.gemMeshManager.getFactory().boardToWorld(gem.position.row, gem.position.col);
          const colors = GEM_COLORS[gem.type as keyof typeof GEM_COLORS];
          this.particleSystem.emitCollect(pos, new THREE.Color(colors.glow));
        }
      }

      if (cascadeCount > 1) {
        this.particleSystem.emitCombo(new THREE.Vector3(0, 0, 1), cascadeCount);
      }
    });
  }

  enter(): void {
    this.initializeGame();
    this.setupInput();
    this.createUI();
  }

  private initializeGame(): void {
    this.controller.initializeBoard();
    this.dragonEvent.resetCollection();

    // Create meshes for all gems
    for (const gem of this.board.getAllGems()) {
      this.gemMeshManager.addGem(gem);
    }

    this.controller.ensureValidMoves();
  }

  private setupInput(): void {
    const canvas = this.renderer.getRenderer().domElement;

    canvas.addEventListener('click', (event) => {
      if (this.isProcessing) return;

      this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

      this.raycaster.setFromCamera(this.mouse, this.renderer.getCamera());

      const gemMeshes: THREE.Mesh[] = [];
      for (const gem of this.board.getAllGems()) {
        const mesh = this.gemMeshManager.getMesh(gem.id);
        if (mesh) gemMeshes.push(mesh);
      }

      const intersects = this.raycaster.intersectObjects(gemMeshes);

      if (intersects.length > 0) {
        const mesh = intersects[0].object as THREE.Mesh;
        const gem = mesh.userData.gem;
        this.handleGemClick(gem.position.row, gem.position.col);
      }
    });
  }

  private handleGemClick(row: number, col: number): void {
    if (!this.selectedGem) {
      this.selectedGem = { row, col };
      this.highlightGem(row, col);
    } else {
      const pos1 = this.selectedGem;
      const pos2 = { row, col };

      if (this.board.areAdjacent(pos1, pos2)) {
        this.trySwap(pos1, pos2);
      }

      this.unhighlightGem(pos1.row, pos1.col);
      this.selectedGem = null;
    }
  }

  private highlightGem(row: number, col: number): void {
    const gem = this.board.getGem(row, col);
    if (gem) {
      const mesh = this.gemMeshManager.getMesh(gem.id);
      if (mesh) {
        mesh.scale.setScalar(1.2);
      }
    }
  }

  private unhighlightGem(row: number, col: number): void {
    const gem = this.board.getGem(row, col);
    if (gem) {
      const mesh = this.gemMeshManager.getMesh(gem.id);
      if (mesh) {
        mesh.scale.setScalar(1.0);
      }
    }
  }

  private async trySwap(pos1: { row: number; col: number }, pos2: { row: number; col: number }): Promise<void> {
    const result = this.controller.trySwap(pos1, pos2);

    if (result.success) {
      this.isProcessing = true;

      // Animate swap
      const gem1 = this.board.getGem(pos1.row, pos1.col);
      const gem2 = this.board.getGem(pos2.row, pos2.col);

      if (gem1) this.gemMeshManager.updateGemPosition(gem1.id, pos1.row, pos1.col);
      if (gem2) this.gemMeshManager.updateGemPosition(gem2.id, pos2.row, pos2.col);

      // Wait for animation
      await this.waitForAnimation();

      // Process cascade
      await this.processCascade();

      this.isProcessing = false;
    }
  }

  private async processCascade(): Promise<void> {
    const result = this.controller.processCascade();

    // Remove matched gem meshes
    for (const gem of result.collectedGems) {
      this.gemMeshManager.removeGem(gem.id);
    }

    // Update positions after gravity
    for (const gem of this.board.getAllGems()) {
      this.gemMeshManager.updateGemPosition(gem.id, gem.position.row, gem.position.col);
    }

    // Spawn new gems
    for (const gem of this.board.getAllGems()) {
      if (!this.gemMeshManager.getMesh(gem.id)) {
        this.gemMeshManager.spawnGemFromTop(gem);
      }
    }

    await this.waitForAnimation();

    // Check for more matches from cascade
    const newMatches = this.controller.getMatchFinder().findAllMatches(this.board);
    if (newMatches.length > 0) {
      await this.processCascade();
    }

    // Ensure valid moves exist
    if (!this.controller.hasValidMoves()) {
      this.controller.shuffle();
      this.syncMeshPositions();
    }
  }

  private syncMeshPositions(): void {
    for (const gem of this.board.getAllGems()) {
      this.gemMeshManager.updateGemPosition(gem.id, gem.position.row, gem.position.col, false);
    }
  }

  private waitForAnimation(): Promise<void> {
    return new Promise((resolve) => {
      const checkAnimation = () => {
        if (!this.gemMeshManager.isAnimating()) {
          resolve();
        } else {
          requestAnimationFrame(checkAnimation);
        }
      };
      setTimeout(checkAnimation, 100);
    });
  }

  private triggerDragonAttack(): void {
    this.showDragonWarning();
    this.dragon.flyAcrossScreen(() => {
      this.hideDragonWarning();
    });
  }

  private showDragonWarning(): void {
    this.dragonWarning = document.createElement('div');
    this.dragonWarning.id = 'dragon-warning';
    this.dragonWarning.textContent = 'Dragon Incoming!';
    this.uiManager.getOverlay().appendChild(this.dragonWarning);
  }

  private hideDragonWarning(): void {
    if (this.dragonWarning) {
      this.dragonWarning.remove();
      this.dragonWarning = null;
    }
  }

  private createUI(): void {
    this.uiManager.getOverlay().appendChild(this.scoreDisplay.getElement());
    this.scoreDisplay.show();
  }

  exit(): void {
    this.scoreDisplay.hide();
    this.gemMeshManager.clear();
    this.board.clear();
  }

  update(deltaTime: number): void {
    this.gemMeshManager.update(deltaTime);
    this.particleSystem.update(deltaTime);
    this.dragon.update(deltaTime);
    this.scoreDisplay.update();
  }

  render(): void {
    this.renderer.render();
  }

  getBoard(): Board {
    return this.board;
  }

  getController(): BoardController {
    return this.controller;
  }

  getDragonEvent(): DragonEvent {
    return this.dragonEvent;
  }

  getScore(): number {
    return this.scoreDisplay.getScore();
  }
}
