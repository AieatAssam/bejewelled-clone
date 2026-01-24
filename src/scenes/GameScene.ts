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
import { getDefaultPrincess } from '../characters/princessData';
import { Princess } from '../characters/Princess';
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
  private selectedGem: { row: number; col: number; id: string } | null = null;
  private isProcessing: boolean = false;
  private dragonWarning: HTMLElement | null = null;

  // Drag state
  private isDragging: boolean = false;
  private dragStartPos: { row: number; col: number } | null = null;
  private dragCurrentPos: THREE.Vector2 = new THREE.Vector2();

  // UI elements
  private princessMini: HTMLElement | null = null;
  private dragonMeter: HTMLElement | null = null;
  private dragonMeterFill: HTMLElement | null = null;
  private hintButton: HTMLElement | null = null;
  private gameDecorations: HTMLElement | null = null;

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

    eventBus.on('gemsRemoved', (matches: { gems: { position: { row: number; col: number }; type: string }[] }[], cascadeCount: number) => {
      for (const match of matches) {
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

    // Ensure valid moves exist at start
    this.ensureValidMovesWithFeedback();
  }

  private ensureValidMovesWithFeedback(): void {
    if (!this.controller.hasValidMoves()) {
      this.showShuffleMessage();
      this.controller.shuffle();
      this.syncMeshPositions();
    }
  }

  private showShuffleMessage(): void {
    const warning = document.createElement('div');
    warning.id = 'no-moves-warning';
    warning.textContent = 'Shuffling board...';
    this.uiManager.getOverlay().appendChild(warning);

    setTimeout(() => {
      warning.remove();
    }, 2000);
  }

  private setupInput(): void {
    const canvas = this.renderer.getRenderer().domElement;

    // Mouse down - start potential drag
    canvas.addEventListener('mousedown', (event) => {
      if (this.isProcessing) return;

      this.updateMouse(event);
      const boardPos = this.getBoardPositionFromMouse();

      if (boardPos) {
        const gem = this.board.getGem(boardPos.row, boardPos.col);
        if (gem) {
          this.isDragging = true;
          this.dragStartPos = boardPos;
          this.dragCurrentPos.set(event.clientX, event.clientY);

          // If we already had a selection, clear it
          if (this.selectedGem) {
            this.gemMeshManager.setSelected(this.selectedGem.id, false);
          }

          // Select this gem
          this.selectedGem = { ...boardPos, id: gem.id };
          this.gemMeshManager.setSelected(gem.id, true);
        }
      }
    });

    // Mouse move - track drag
    canvas.addEventListener('mousemove', (event) => {
      if (!this.isDragging || !this.dragStartPos || this.isProcessing) return;

      const dx = event.clientX - this.dragCurrentPos.x;
      const dy = event.clientY - this.dragCurrentPos.y;
      const dragThreshold = 25;

      // Check if dragged far enough to trigger a swap
      if (Math.abs(dx) > dragThreshold || Math.abs(dy) > dragThreshold) {
        let targetRow = this.dragStartPos.row;
        let targetCol = this.dragStartPos.col;

        // Determine drag direction
        if (Math.abs(dx) > Math.abs(dy)) {
          // Horizontal drag
          targetCol += dx > 0 ? 1 : -1;
        } else {
          // Vertical drag
          targetRow += dy > 0 ? 1 : -1;
        }

        // Validate target position
        if (this.board.isValidPosition(targetRow, targetCol)) {
          this.trySwap(this.dragStartPos, { row: targetRow, col: targetCol });
        }

        this.endDrag();
      }
    });

    // Mouse up - end drag or handle click
    canvas.addEventListener('mouseup', (event) => {
      if (this.isProcessing) return;

      if (this.isDragging && this.dragStartPos) {
        // Check if it was just a click (no significant movement)
        const dx = event.clientX - this.dragCurrentPos.x;
        const dy = event.clientY - this.dragCurrentPos.y;

        if (Math.abs(dx) < 10 && Math.abs(dy) < 10) {
          // It was a click, not a drag
          this.handleClick(this.dragStartPos);
        }
      }

      this.endDrag();
    });

    // Touch support
    canvas.addEventListener('touchstart', (event) => {
      if (this.isProcessing) return;
      event.preventDefault();

      const touch = event.touches[0];
      this.updateMouseFromTouch(touch);
      const boardPos = this.getBoardPositionFromMouse();

      if (boardPos) {
        const gem = this.board.getGem(boardPos.row, boardPos.col);
        if (gem) {
          this.isDragging = true;
          this.dragStartPos = boardPos;
          this.dragCurrentPos.set(touch.clientX, touch.clientY);

          if (this.selectedGem) {
            this.gemMeshManager.setSelected(this.selectedGem.id, false);
          }

          this.selectedGem = { ...boardPos, id: gem.id };
          this.gemMeshManager.setSelected(gem.id, true);
        }
      }
    }, { passive: false });

    canvas.addEventListener('touchmove', (event) => {
      if (!this.isDragging || !this.dragStartPos || this.isProcessing) return;
      event.preventDefault();

      const touch = event.touches[0];
      const dx = touch.clientX - this.dragCurrentPos.x;
      const dy = touch.clientY - this.dragCurrentPos.y;
      const dragThreshold = 35;

      if (Math.abs(dx) > dragThreshold || Math.abs(dy) > dragThreshold) {
        let targetRow = this.dragStartPos.row;
        let targetCol = this.dragStartPos.col;

        if (Math.abs(dx) > Math.abs(dy)) {
          targetCol += dx > 0 ? 1 : -1;
        } else {
          targetRow += dy > 0 ? 1 : -1;
        }

        if (this.board.isValidPosition(targetRow, targetCol)) {
          this.trySwap(this.dragStartPos, { row: targetRow, col: targetCol });
        }

        this.endDrag();
      }
    }, { passive: false });

    canvas.addEventListener('touchend', () => {
      this.endDrag();
    });
  }

  private updateMouse(event: MouseEvent): void {
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  }

  private updateMouseFromTouch(touch: Touch): void {
    this.mouse.x = (touch.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(touch.clientY / window.innerHeight) * 2 + 1;
  }

  private getBoardPositionFromMouse(): { row: number; col: number } | null {
    this.raycaster.setFromCamera(this.mouse, this.renderer.getCamera());

    // Create a plane at z=0 for intersection
    const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    const intersection = new THREE.Vector3();

    if (this.raycaster.ray.intersectPlane(plane, intersection)) {
      return this.gemMeshManager.getFactory().worldToBoard(intersection);
    }

    return null;
  }

  private endDrag(): void {
    this.isDragging = false;
    this.dragStartPos = null;
  }

  private handleClick(pos: { row: number; col: number }): void {
    // If clicking on already selected gem, deselect it
    if (this.selectedGem &&
        this.selectedGem.row === pos.row &&
        this.selectedGem.col === pos.col) {
      this.gemMeshManager.setSelected(this.selectedGem.id, false);
      this.selectedGem = null;
      return;
    }

    // If we have a selected gem, try to swap with clicked position
    if (this.selectedGem) {
      if (this.board.areAdjacent(this.selectedGem, pos)) {
        this.trySwap(this.selectedGem, pos);
      } else {
        // Not adjacent - select new gem instead
        this.gemMeshManager.setSelected(this.selectedGem.id, false);
        const gem = this.board.getGem(pos.row, pos.col);
        if (gem) {
          this.selectedGem = { ...pos, id: gem.id };
          this.gemMeshManager.setSelected(gem.id, true);
        }
      }
    }
  }

  private async trySwap(pos1: { row: number; col: number }, pos2: { row: number; col: number }): Promise<void> {
    // Clear selection
    if (this.selectedGem) {
      this.gemMeshManager.setSelected(this.selectedGem.id, false);
      this.selectedGem = null;
    }

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

      // Update dragon meter
      this.updateDragonMeter();

      // Ensure valid moves exist after cascade
      this.ensureValidMovesWithFeedback();

      this.isProcessing = false;
    } else {
      // Invalid swap - animate shake
      const gem1 = this.board.getGem(pos1.row, pos1.col);
      const gem2 = this.board.getGem(pos2.row, pos2.col);

      if (gem1 && gem2) {
        const mesh1 = this.gemMeshManager.getMesh(gem1.id);
        const mesh2 = this.gemMeshManager.getMesh(gem2.id);

        if (mesh1 && mesh2) {
          const originalPos1 = mesh1.position.clone();
          const originalPos2 = mesh2.position.clone();

          // Shake animation
          mesh1.position.x += 0.1;
          mesh2.position.x -= 0.1;

          setTimeout(() => {
            mesh1.position.copy(originalPos1);
            mesh2.position.copy(originalPos2);
          }, 100);
        }
      }
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
  }

  private syncMeshPositions(): void {
    // Clear and recreate all gem meshes
    this.gemMeshManager.clear();
    for (const gem of this.board.getAllGems()) {
      this.gemMeshManager.addGem(gem);
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
      setTimeout(checkAnimation, 50);
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

  private updateDragonMeter(): void {
    if (this.dragonMeterFill) {
      const chains = this.controller.getConsecutiveSmallChains();
      const percentage = (chains / 3) * 100;
      this.dragonMeterFill.style.width = `${percentage}%`;
    }
  }

  private showHint(): void {
    if (this.isProcessing) return;

    // Find a valid move
    const hint = this.findValidMove();
    if (hint) {
      this.gemMeshManager.highlightHint(hint.row, hint.col);
    }
  }

  private findValidMove(): { row: number; col: number } | null {
    const matchFinder = this.controller.getMatchFinder();

    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 7; col++) {
        if (matchFinder.wouldCreateMatch(this.board, { row, col }, { row, col: col + 1 })) {
          return { row, col };
        }
      }
    }

    for (let row = 0; row < 7; row++) {
      for (let col = 0; col < 8; col++) {
        if (matchFinder.wouldCreateMatch(this.board, { row, col }, { row: row + 1, col })) {
          return { row, col };
        }
      }
    }

    return null;
  }

  private createUI(): void {
    // Add score display (purse)
    this.uiManager.getOverlay().appendChild(this.scoreDisplay.getElement());
    this.uiManager.getOverlay().appendChild(this.scoreDisplay.getComboElement());
    this.scoreDisplay.show();

    // Add mini princess portrait
    this.createPrincessMini();

    // Add dragon meter
    this.createDragonMeter();

    // Add hint button
    this.createHintButton();

    // Add decorative corners
    this.createDecorations();
  }

  private createPrincessMini(): void {
    this.princessMini = document.createElement('div');
    this.princessMini.id = 'princess-mini';

    const primaryColor = this.princess.colors.primary.toString(16).padStart(6, '0');
    const secondaryColor = this.princess.colors.secondary.toString(16).padStart(6, '0');
    const accentColor = this.princess.colors.accent.toString(16).padStart(6, '0');

    this.princessMini.style.background = `linear-gradient(180deg, #${secondaryColor} 0%, #${primaryColor} 100%)`;

    // Create mini SVG portrait
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 70 85');
    svg.setAttribute('width', '70');
    svg.setAttribute('height', '85');

    // Face
    const face = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
    face.setAttribute('cx', '35');
    face.setAttribute('cy', '45');
    face.setAttribute('rx', '18');
    face.setAttribute('ry', '22');
    face.setAttribute('fill', '#ffe4c4');
    svg.appendChild(face);

    // Hair
    const hair = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
    hair.setAttribute('cx', '35');
    hair.setAttribute('cy', '48');
    hair.setAttribute('rx', '24');
    hair.setAttribute('ry', '32');
    hair.setAttribute('fill', `#${accentColor}`);
    svg.insertBefore(hair, face);

    // Crown
    const crown = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    crown.setAttribute('d', 'M20 22 L25 12 L30 18 L35 8 L40 18 L45 12 L50 22 Z');
    crown.setAttribute('fill', '#ffd700');
    svg.appendChild(crown);

    // Eyes
    const eyeL = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
    eyeL.setAttribute('cx', '28');
    eyeL.setAttribute('cy', '42');
    eyeL.setAttribute('rx', '4');
    eyeL.setAttribute('ry', '5');
    eyeL.setAttribute('fill', `#${primaryColor}`);
    svg.appendChild(eyeL);

    const eyeR = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
    eyeR.setAttribute('cx', '42');
    eyeR.setAttribute('cy', '42');
    eyeR.setAttribute('rx', '4');
    eyeR.setAttribute('ry', '5');
    eyeR.setAttribute('fill', `#${primaryColor}`);
    svg.appendChild(eyeR);

    // Smile
    const smile = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    smile.setAttribute('d', 'M28 55 Q35 62 42 55');
    smile.setAttribute('stroke', '#c97878');
    smile.setAttribute('stroke-width', '2');
    smile.setAttribute('fill', 'none');
    svg.appendChild(smile);

    // Dress
    const dress = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    dress.setAttribute('d', 'M20 70 Q35 65 50 70 L55 90 L15 90 Z');
    dress.setAttribute('fill', `#${primaryColor}`);
    svg.appendChild(dress);

    this.princessMini.appendChild(svg);
    this.uiManager.getOverlay().appendChild(this.princessMini);
  }

  private createDragonMeter(): void {
    this.dragonMeter = document.createElement('div');
    this.dragonMeter.id = 'dragon-meter';

    this.dragonMeterFill = document.createElement('div');
    this.dragonMeterFill.id = 'dragon-meter-fill';
    this.dragonMeter.appendChild(this.dragonMeterFill);

    const label = document.createElement('div');
    label.id = 'dragon-meter-label';
    label.textContent = 'Dragon Warning';
    this.dragonMeter.appendChild(label);

    this.uiManager.getOverlay().appendChild(this.dragonMeter);
  }

  private createHintButton(): void {
    this.hintButton = document.createElement('button');
    this.hintButton.id = 'hint-button';
    this.hintButton.innerHTML = '?';
    this.hintButton.title = 'Show hint';

    this.hintButton.addEventListener('click', () => {
      this.showHint();
    });

    this.uiManager.getOverlay().appendChild(this.hintButton);
  }

  private createDecorations(): void {
    this.gameDecorations = document.createElement('div');
    this.gameDecorations.className = 'game-frame';

    // Corner decorations
    const corners = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];
    corners.forEach(corner => {
      const decoration = document.createElement('div');
      decoration.className = `corner-decoration ${corner}`;

      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('viewBox', '0 0 60 60');
      svg.setAttribute('width', '60');
      svg.setAttribute('height', '60');

      // Decorative swirl
      const swirl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      swirl.setAttribute('d', 'M5 5 Q5 30 30 30 Q30 55 55 55');
      swirl.setAttribute('fill', 'none');
      swirl.setAttribute('stroke', '#ffd700');
      swirl.setAttribute('stroke-width', '3');
      swirl.setAttribute('stroke-linecap', 'round');
      svg.appendChild(swirl);

      // Small gem
      const gem = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      gem.setAttribute('cx', '15');
      gem.setAttribute('cy', '15');
      gem.setAttribute('r', '6');
      gem.setAttribute('fill', '#ff69b4');
      svg.appendChild(gem);

      decoration.appendChild(svg);
      this.gameDecorations!.appendChild(decoration);
    });

    this.uiManager.getOverlay().appendChild(this.gameDecorations!);
  }

  exit(): void {
    this.scoreDisplay.hide();
    this.gemMeshManager.clear();
    this.board.clear();

    // Clear selection state
    if (this.selectedGem) {
      this.selectedGem = null;
    }
    this.isDragging = false;
    this.dragStartPos = null;

    // Remove UI elements
    if (this.princessMini) {
      this.princessMini.remove();
      this.princessMini = null;
    }
    if (this.dragonMeter) {
      this.dragonMeter.remove();
      this.dragonMeter = null;
    }
    if (this.hintButton) {
      this.hintButton.remove();
      this.hintButton = null;
    }
    if (this.gameDecorations) {
      this.gameDecorations.remove();
      this.gameDecorations = null;
    }

    const comboEl = this.scoreDisplay.getComboElement();
    if (comboEl.parentNode) {
      comboEl.remove();
    }
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
