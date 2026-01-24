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
import { GEM_COLORS, GemType, createGem } from '../puzzle/Gem';

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
  private dragStartScreenPos: THREE.Vector2 = new THREE.Vector2();
  private pendingStolenCount: number = 0;
  private isInitialized: boolean = false;

  // UI elements
  private princessMini: HTMLElement | null = null;
  private dragonMeter: HTMLElement | null = null;
  private dragonMeterFill: HTMLElement | null = null;
  private hintButton: HTMLElement | null = null;
  private shuffleButton: HTMLElement | null = null;
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

    // Stolen message is now shown after dragon animation completes
    eventBus.on('dragonStole', (result: { totalStolen: number }) => {
      this.pendingStolenCount = result.totalStolen;
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
    // Only initialize on first entry, not when returning from pause
    if (!this.isInitialized) {
      this.initializeGame();
      this.isInitialized = true;
    }
    this.setupInput();
    this.createUI();
    this.updateDragonMeter(); // Restore dragon meter display
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
          this.dragStartScreenPos.set(event.clientX, event.clientY);
        }
      }
    });

    // Mouse move - track drag
    canvas.addEventListener('mousemove', (event) => {
      if (!this.isDragging || !this.dragStartPos || this.isProcessing) return;

      const dx = event.clientX - this.dragStartScreenPos.x;
      const dy = event.clientY - this.dragStartScreenPos.y;
      const dragThreshold = 25;

      // Check if dragged far enough to trigger a swap
      if (Math.abs(dx) > dragThreshold || Math.abs(dy) > dragThreshold) {
        let targetRow = this.dragStartPos.row;
        let targetCol = this.dragStartPos.col;

        // Determine drag direction
        if (Math.abs(dx) > Math.abs(dy)) {
          targetCol += dx > 0 ? 1 : -1;
        } else {
          targetRow += dy > 0 ? 1 : -1;
        }

        // Validate target position and attempt swap
        if (this.board.isValidPosition(targetRow, targetCol)) {
          // Clear any selection first
          if (this.selectedGem) {
            this.gemMeshManager.setSelected(this.selectedGem.id, false);
            this.selectedGem = null;
          }
          this.trySwap(this.dragStartPos, { row: targetRow, col: targetCol });
        }

        this.endDrag();
      }
    });

    // Mouse up - end drag or handle click
    canvas.addEventListener('mouseup', (event) => {
      if (this.isProcessing) {
        this.endDrag();
        return;
      }

      if (this.isDragging && this.dragStartPos) {
        const dx = event.clientX - this.dragStartScreenPos.x;
        const dy = event.clientY - this.dragStartScreenPos.y;

        // If movement was small, treat as a click
        if (Math.abs(dx) < 10 && Math.abs(dy) < 10) {
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
          this.dragStartScreenPos.set(touch.clientX, touch.clientY);
        }
      }
    }, { passive: false });

    canvas.addEventListener('touchmove', (event) => {
      if (!this.isDragging || !this.dragStartPos || this.isProcessing) return;
      event.preventDefault();

      const touch = event.touches[0];
      const dx = touch.clientX - this.dragStartScreenPos.x;
      const dy = touch.clientY - this.dragStartScreenPos.y;
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
          if (this.selectedGem) {
            this.gemMeshManager.setSelected(this.selectedGem.id, false);
            this.selectedGem = null;
          }
          this.trySwap(this.dragStartPos, { row: targetRow, col: targetCol });
        }

        this.endDrag();
      }
    }, { passive: false });

    canvas.addEventListener('touchend', (event) => {
      if (this.isProcessing) {
        this.endDrag();
        return;
      }

      // Handle tap as click if no significant movement
      if (this.isDragging && this.dragStartPos) {
        const touch = event.changedTouches[0];
        if (touch) {
          const dx = touch.clientX - this.dragStartScreenPos.x;
          const dy = touch.clientY - this.dragStartScreenPos.y;
          if (Math.abs(dx) < 15 && Math.abs(dy) < 15) {
            this.handleClick(this.dragStartPos);
          }
        }
      }
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

  private handleClick(clickedPos: { row: number; col: number }): void {
    const clickedGem = this.board.getGem(clickedPos.row, clickedPos.col);
    if (!clickedGem) return;

    // If no gem selected, select the clicked one
    if (!this.selectedGem) {
      this.selectedGem = { ...clickedPos, id: clickedGem.id };
      this.gemMeshManager.setSelected(clickedGem.id, true);
      return;
    }

    // If clicking on the already selected gem, deselect it
    if (this.selectedGem.row === clickedPos.row && this.selectedGem.col === clickedPos.col) {
      this.gemMeshManager.setSelected(this.selectedGem.id, false);
      this.selectedGem = null;
      return;
    }

    // If clicking on an adjacent gem, try to swap
    if (this.board.areAdjacent(this.selectedGem, clickedPos)) {
      const prevSelected = this.selectedGem;
      this.gemMeshManager.setSelected(prevSelected.id, false);
      this.selectedGem = null;
      this.trySwap(prevSelected, clickedPos);
      return;
    }

    // Clicking on a non-adjacent gem - switch selection to the new gem
    this.gemMeshManager.setSelected(this.selectedGem.id, false);
    this.selectedGem = { ...clickedPos, id: clickedGem.id };
    this.gemMeshManager.setSelected(clickedGem.id, true);
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

      await this.waitForAnimation();
      await this.processCascade();

      this.updateDragonMeter();
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

          mesh1.position.x += 0.15;
          mesh2.position.x -= 0.15;

          setTimeout(() => {
            mesh1.position.copy(originalPos1);
            mesh2.position.copy(originalPos2);
          }, 100);
        }
      }
    }
  }

  private async processCascade(): Promise<void> {
    await this.processCascadeStep(1);
  }

  private async processCascadeStep(cascadeLevel: number): Promise<void> {
    const matchFinder = this.controller.getMatchFinder();
    const matches = matchFinder.findAllMatches(this.board);

    if (matches.length === 0) {
      return;
    }

    // Show cascade level if > 1
    if (cascadeLevel > 1) {
      this.showCascadeText(cascadeLevel);
    }

    // Collect gem IDs that will be removed
    const gemIdsToRemove: string[] = [];
    const matchedGemTypes: GemType[] = [];
    for (const match of matches) {
      for (const gem of match.gems) {
        const boardGem = this.board.getGem(gem.position.row, gem.position.col);
        if (boardGem && !gemIdsToRemove.includes(boardGem.id)) {
          gemIdsToRemove.push(boardGem.id);
          matchedGemTypes.push(boardGem.type);
        }
      }
    }

    // Step 1: Highlight matched gems (player can see what's matching)
    this.gemMeshManager.highlightMatched(gemIdsToRemove);
    await this.delay(400); // Let player see highlighted gems

    // Step 2: Emit particles, create flying gems, and animate removal
    for (const match of matches) {
      for (const gem of match.gems) {
        const pos = this.gemMeshManager.getFactory().boardToWorld(gem.position.row, gem.position.col);
        const colors = GEM_COLORS[gem.type as keyof typeof GEM_COLORS];
        this.particleSystem.emitCollect(pos, new THREE.Color(colors.glow));

        // Create flying gem animation to purse
        const screenPos = this.worldToScreen(pos);
        this.scoreDisplay.createFlyingGem(screenPos.x, screenPos.y, gem.type as GemType);
      }
    }

    await this.gemMeshManager.animateRemoval(gemIdsToRemove);

    // Pulse purse with collected gem colors
    this.scoreDisplay.pulseWithColors(matchedGemTypes);

    // Step 3: Actually remove gems from board and mesh manager
    for (const match of matches) {
      for (const gem of match.gems) {
        const boardGem = this.board.getGem(gem.position.row, gem.position.col);
        if (boardGem) {
          this.dragonEvent.addToCollection(boardGem.type);
          this.board.removeGem(gem.position.row, gem.position.col);
          this.gemMeshManager.removeGem(boardGem.id);
        }
      }
    }

    // Update score to show total gems collected (not arbitrary points)
    const gemsCollected = gemIdsToRemove.length;
    this.scoreDisplay.addScore(gemsCollected);

    // Track small chains for dragon event
    this.trackSmallChains(matches);

    // Step 4: Apply gravity
    this.applyGravity();

    // Step 5: Fill empty spaces
    this.fillEmptySpaces();

    await this.waitForAnimation();
    await this.delay(150); // Small pause before checking for new matches

    // Step 6: Check for new cascades
    await this.processCascadeStep(cascadeLevel + 1);
  }

  private showCascadeText(level: number): void {
    const text = document.createElement('div');
    text.className = 'cascade-text';
    text.textContent = `${level}x Cascade!`;
    this.uiManager.getOverlay().appendChild(text);

    setTimeout(() => {
      text.classList.add('fade-out');
      setTimeout(() => text.remove(), 500);
    }, 1000);
  }

  private calculateCascadeScore(matches: { length: number }[], cascadeLevel: number): number {
    let baseScore = 0;
    for (const match of matches) {
      if (match.length === 3) {
        baseScore += 50;
      } else if (match.length === 4) {
        baseScore += 150;
      } else if (match.length >= 5) {
        baseScore += 500;
      }
    }
    return baseScore * cascadeLevel;
  }

  private trackSmallChains(matches: { length: number }[]): void {
    const hasOnlySmallMatches = matches.every(m => m.length === 3);
    if (hasOnlySmallMatches && matches.length === 1) {
      const chains = this.controller.getConsecutiveSmallChains() + 1;
      this.controller.setConsecutiveSmallChains(chains);
      if (chains >= 3) {
        eventBus.emit('dragonEvent');
        this.controller.setConsecutiveSmallChains(0);
      }
    } else {
      this.controller.setConsecutiveSmallChains(0);
    }
  }

  private applyGravity(): void {
    for (let col = 0; col < 8; col++) {
      let writeRow = 7;
      for (let row = 7; row >= 0; row--) {
        const gem = this.board.getGem(row, col);
        if (gem) {
          if (row !== writeRow) {
            this.board.setGem(writeRow, col, gem);
            this.board.setGem(row, col, null);
            gem.position = { row: writeRow, col };
            this.gemMeshManager.updateGemPosition(gem.id, writeRow, col);
          }
          writeRow--;
        }
      }
    }
  }

  private fillEmptySpaces(): void {
    for (let col = 0; col < 8; col++) {
      for (let row = 0; row < 8; row++) {
        if (!this.board.getGem(row, col)) {
          const gem = createGem(this.getRandomGemType(), { row, col });
          this.board.setGem(row, col, gem);
          this.gemMeshManager.spawnGemFromTop(gem);
        }
      }
    }
  }

  private getRandomGemType(): GemType {
    const types = Object.values(GemType);
    return types[Math.floor(Math.random() * types.length)];
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Convert world position to screen coordinates for flying gem animations
  private worldToScreen(worldPos: THREE.Vector3): { x: number; y: number } {
    const camera = this.renderer.getCamera();
    const vector = worldPos.clone();
    vector.project(camera);

    const canvas = this.renderer.getRenderer().domElement;
    const x = (vector.x * 0.5 + 0.5) * canvas.clientWidth;
    const y = (-vector.y * 0.5 + 0.5) * canvas.clientHeight;

    return { x, y };
  }

  private syncMeshPositions(): void {
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
      // Show stolen message after dragon finishes
      if (this.pendingStolenCount > 0) {
        this.showStolenMessage(this.pendingStolenCount);
        this.pendingStolenCount = 0;
      }
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

  private showStolenMessage(totalStolen: number): void {
    const message = document.createElement('div');
    message.id = 'dragon-stolen-message';
    message.innerHTML = `🐉 Dragon stole <strong>${totalStolen}</strong> gem${totalStolen !== 1 ? 's' : ''}!`;
    this.uiManager.getOverlay().appendChild(message);

    setTimeout(() => {
      message.classList.add('fade-out');
      setTimeout(() => message.remove(), 500);
    }, 2500);
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
    this.uiManager.getOverlay().appendChild(this.scoreDisplay.getElement());
    this.uiManager.getOverlay().appendChild(this.scoreDisplay.getComboElement());
    this.scoreDisplay.show();

    this.createPrincessMini();
    this.createDragonMeter();
    this.createHintButton();
    this.createShuffleButton();
    this.createDecorations();
  }

  private createPrincessMini(): void {
    this.princessMini = document.createElement('div');
    this.princessMini.id = 'princess-mini';

    const primaryColor = this.princess.colors.primary.toString(16).padStart(6, '0');
    const secondaryColor = this.princess.colors.secondary.toString(16).padStart(6, '0');
    const accentColor = this.princess.colors.accent.toString(16).padStart(6, '0');

    this.princessMini.style.background = `linear-gradient(180deg, #${secondaryColor} 0%, #${primaryColor} 100%)`;

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 70 85');
    svg.setAttribute('width', '70');
    svg.setAttribute('height', '85');

    const face = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
    face.setAttribute('cx', '35');
    face.setAttribute('cy', '45');
    face.setAttribute('rx', '18');
    face.setAttribute('ry', '22');
    face.setAttribute('fill', '#ffe4c4');
    svg.appendChild(face);

    const hair = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
    hair.setAttribute('cx', '35');
    hair.setAttribute('cy', '48');
    hair.setAttribute('rx', '24');
    hair.setAttribute('ry', '32');
    hair.setAttribute('fill', `#${accentColor}`);
    svg.insertBefore(hair, face);

    const crown = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    crown.setAttribute('d', 'M20 22 L25 12 L30 18 L35 8 L40 18 L45 12 L50 22 Z');
    crown.setAttribute('fill', '#ffd700');
    svg.appendChild(crown);

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

    const smile = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    smile.setAttribute('d', 'M28 55 Q35 62 42 55');
    smile.setAttribute('stroke', '#c97878');
    smile.setAttribute('stroke-width', '2');
    smile.setAttribute('fill', 'none');
    svg.appendChild(smile);

    const dress = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    dress.setAttribute('d', 'M20 70 Q35 65 50 70 L55 90 L15 90 Z');
    dress.setAttribute('fill', `#${primaryColor}`);
    svg.appendChild(dress);

    this.princessMini.appendChild(svg);
    this.uiManager.getOverlay().appendChild(this.princessMini);
  }

  private createDragonMeter(): void {
    this.dragonMeter = document.createElement('div');
    this.dragonMeter.id = 'dragon-meter-container';

    const title = document.createElement('div');
    title.id = 'dragon-meter-title';
    title.innerHTML = '🐉 Dragon Threat';
    this.dragonMeter.appendChild(title);

    const meterBar = document.createElement('div');
    meterBar.id = 'dragon-meter';

    this.dragonMeterFill = document.createElement('div');
    this.dragonMeterFill.id = 'dragon-meter-fill';
    meterBar.appendChild(this.dragonMeterFill);

    this.dragonMeter.appendChild(meterBar);

    const hint = document.createElement('div');
    hint.id = 'dragon-meter-hint';
    hint.textContent = 'Small matches (3) anger dragon. Big combos (4+) calm him!';
    this.dragonMeter.appendChild(hint);

    this.uiManager.getOverlay().appendChild(this.dragonMeter);
  }

  private createHintButton(): void {
    this.hintButton = document.createElement('button');
    this.hintButton.id = 'hint-button';
    this.hintButton.className = 'game-tooltip';
    this.hintButton.innerHTML = '?';
    this.hintButton.setAttribute('data-tooltip', 'Show Hint - Highlight a valid move');

    this.hintButton.addEventListener('click', () => {
      this.showHint();
    });

    this.uiManager.getOverlay().appendChild(this.hintButton);
  }

  private createShuffleButton(): void {
    this.shuffleButton = document.createElement('button');
    this.shuffleButton.id = 'shuffle-button';
    this.shuffleButton.className = 'game-tooltip';
    this.shuffleButton.innerHTML = '✨';
    this.shuffleButton.setAttribute('data-tooltip', 'Fairy Dust - Shuffle board (costs 20% gems)');

    this.shuffleButton.addEventListener('click', () => {
      this.useFairyDust();
    });

    this.uiManager.getOverlay().appendChild(this.shuffleButton);
  }

  private useFairyDust(): void {
    if (this.isProcessing) return;

    const total = this.dragonEvent.getCollectionTotal();
    if (total < 5) {
      this.showFairyDustMessage('Not enough gems for Fairy Dust!', false);
      return;
    }

    // Cost: 20% of collection (minimum 1 gem)
    const cost = Math.max(1, Math.floor(total * 0.2));

    // Deduct gems from collection
    this.dragonEvent.payFairyDustCost(cost);

    // Shuffle the board
    this.controller.shuffle();
    this.syncMeshPositions();
    this.controller.ensureValidMoves();

    this.showFairyDustMessage(`✨ Fairy Dust used! (${cost} gems spent)`, true);
  }

  private showFairyDustMessage(text: string, success: boolean): void {
    const message = document.createElement('div');
    message.id = 'fairy-dust-message';
    message.textContent = text;
    message.style.color = success ? '#ffdd44' : '#ff6666';
    this.uiManager.getOverlay().appendChild(message);

    setTimeout(() => {
      message.classList.add('fade-out');
      setTimeout(() => message.remove(), 500);
    }, 2000);
  }

  private createDecorations(): void {
    this.gameDecorations = document.createElement('div');
    this.gameDecorations.className = 'game-frame';

    const corners = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];
    corners.forEach(corner => {
      const decoration = document.createElement('div');
      decoration.className = `corner-decoration ${corner}`;

      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('viewBox', '0 0 60 60');
      svg.setAttribute('width', '60');
      svg.setAttribute('height', '60');

      const swirl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      swirl.setAttribute('d', 'M5 5 Q5 30 30 30 Q30 55 55 55');
      swirl.setAttribute('fill', 'none');
      swirl.setAttribute('stroke', '#ffd700');
      swirl.setAttribute('stroke-width', '3');
      swirl.setAttribute('stroke-linecap', 'round');
      svg.appendChild(swirl);

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
    // Just hide UI elements, don't destroy game state (we might return from pause)
    this.scoreDisplay.hide();

    if (this.selectedGem) {
      this.gemMeshManager.setSelected(this.selectedGem.id, false);
      this.selectedGem = null;
    }
    this.isDragging = false;
    this.dragStartPos = null;

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
    if (this.shuffleButton) {
      this.shuffleButton.remove();
      this.shuffleButton = null;
    }
    if (this.gameDecorations) {
      this.gameDecorations.remove();
      this.gameDecorations = null;
    }

    const comboEl = this.scoreDisplay.getComboElement();
    if (comboEl.parentNode) {
      comboEl.remove();
    }

    const scoreEl = this.scoreDisplay.getElement();
    if (scoreEl.parentNode) {
      scoreEl.remove();
    }
  }

  resetGame(): void {
    // Called when starting a truly new game
    this.isInitialized = false;
    this.gemMeshManager.clear();
    this.board.clear();
    this.scoreDisplay.reset();
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

  restoreState(
    boardState: (string | null)[][],
    collection: Map<GemType, number>,
    score: number,
    dragonCounter: number
  ): void {
    // Reset and restore board
    this.board.clear();
    this.gemMeshManager.clear();

    // Restore gems from saved state
    for (let row = 0; row < boardState.length; row++) {
      for (let col = 0; col < boardState[row].length; col++) {
        const gemType = boardState[row][col];
        if (gemType) {
          const gem = createGem(gemType as GemType, { row, col });
          this.board.setGem(row, col, gem);
          this.gemMeshManager.addGem(gem);
        }
      }
    }

    // Restore collection
    this.dragonEvent.setCollection(collection);

    // Restore score
    this.scoreDisplay.setScore(score);

    // Restore dragon counter
    this.controller.setConsecutiveSmallChains(dragonCounter);

    this.isInitialized = true;
  }
}
