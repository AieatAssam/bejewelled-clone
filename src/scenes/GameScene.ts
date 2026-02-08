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
import { GEM_COLORS, GemType, createGem, PowerupType } from '../puzzle/Gem';

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
  private isInitialized: boolean = false;

  // Streak and engagement tracking
  private moveStreak: number = 0;
  private bestStreak: number = 0;
  private totalMoves: number = 0;
  private streakDisplay: HTMLElement | null = null;

  // Hint cost tracking (increases with each use, max 10)
  private hintUseCount: number = 0;
  private static readonly HINT_BASE_COST = 2;
  private static readonly HINT_MAX_COST = 10;

  // Deferred dragon/streak tracking (to account for cascades)
  private pendingMoveHadBigMatch: boolean = false;
  private pendingMoveMaxCascade: number = 0;
  private pendingMoveWasSmallOnly: boolean = false;

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
    this.gemMeshManager = new GemMeshManager(renderer.getScene(), renderer.getCubeEnvMap());
    this.particleSystem = new ParticleSystem(renderer.getScene());
    this.dragon = new DragonModel();
    this.renderer.add(this.dragon.getGroup());

    this.scoreDisplay = new ScoreDisplay();
    this.dragonEvent = new DragonEvent();
    this.scoreDisplay.setDragonEvent(this.dragonEvent);

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
      // Invalid swap - animate shake and reset streak
      this.resetStreak();

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

    // At the start of a move (cascadeLevel 1), reset tracking
    if (cascadeLevel === 1) {
      this.pendingMoveHadBigMatch = false;
      this.pendingMoveMaxCascade = 0;
      this.pendingMoveWasSmallOnly = false;
    }

    if (matches.length === 0) {
      // End of cascade chain - finalize dragon threat and streak
      this.finalizeMoveTracking();
      return;
    }

    // Track cascade data for deferred calculation
    this.pendingMoveMaxCascade = Math.max(this.pendingMoveMaxCascade, cascadeLevel);
    const hasBigMatch = matches.some(m => m.length >= 4);
    if (hasBigMatch) {
      this.pendingMoveHadBigMatch = true;
    }
    // Check if this level had ONLY small matches
    if (cascadeLevel === 1 && !hasBigMatch && matches.length === 1 && matches[0].length === 3) {
      this.pendingMoveWasSmallOnly = true;
    }

    // Show cascade level if > 1
    if (cascadeLevel > 1) {
      this.showCascadeText(cascadeLevel);
    }

    // Collect gem IDs that will be removed
    const gemIdsToRemove: string[] = [];
    const matchedGemTypes: GemType[] = [];
    const rainbowTypesToClear: GemType[] = [];
    const starPositions: { row: number; col: number }[] = [];

    // First pass: collect matched gems and check for powerups
    for (const match of matches) {
      for (const gem of match.gems) {
        const boardGem = this.board.getGem(gem.position.row, gem.position.col);
        if (boardGem && !gemIdsToRemove.includes(boardGem.id)) {
          gemIdsToRemove.push(boardGem.id);
          matchedGemTypes.push(boardGem.type);

          // Check for Rainbow powerup - will clear ALL gems of this color!
          if (boardGem.powerup === PowerupType.Rainbow) {
            if (!rainbowTypesToClear.includes(boardGem.type)) {
              rainbowTypesToClear.push(boardGem.type);
            }
          }

          // Check for Star powerup - will clear gems in + pattern!
          if (boardGem.powerup === PowerupType.Star) {
            starPositions.push({ row: boardGem.position.row, col: boardGem.position.col });
          }
        }
      }
    }

    // If Star powerup was matched, add gems in + cross pattern (and 3x3 for Ember)
    if (starPositions.length > 0) {
      const hasStarExplode = this.princess.ability.type === 'star_explode';
      this.showPowerupCreated(hasStarExplode ? '🔥⭐ Inferno Star!' : '⭐ Star Burst!');

      for (const starPos of starPositions) {
        // Clear entire row
        for (let col = 0; col < 8; col++) {
          const gem = this.board.getGem(starPos.row, col);
          if (gem && !gemIdsToRemove.includes(gem.id)) {
            gemIdsToRemove.push(gem.id);
            matchedGemTypes.push(gem.type);
          }
        }
        // Clear entire column
        for (let row = 0; row < 8; row++) {
          const gem = this.board.getGem(row, starPos.col);
          if (gem && !gemIdsToRemove.includes(gem.id)) {
            gemIdsToRemove.push(gem.id);
            matchedGemTypes.push(gem.type);
          }
        }

        // Ember's Inferno Star ability: also clear 3x3 area around the star
        if (hasStarExplode) {
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              const r = starPos.row + dr;
              const c = starPos.col + dc;
              if (r >= 0 && r < 8 && c >= 0 && c < 8) {
                const gem = this.board.getGem(r, c);
                if (gem && !gemIdsToRemove.includes(gem.id)) {
                  gemIdsToRemove.push(gem.id);
                  matchedGemTypes.push(gem.type);
                }
              }
            }
          }
        }
      }
    }

    // If Rainbow powerup was matched, add ALL gems of that color from the board
    if (rainbowTypesToClear.length > 0) {
      this.showPowerupCreated('🌈 Rainbow Blast!');

      for (const colorToClear of rainbowTypesToClear) {
        // Find all gems of this color on the board
        for (let row = 0; row < 8; row++) {
          for (let col = 0; col < 8; col++) {
            const gem = this.board.getGem(row, col);
            if (gem && gem.type === colorToClear && !gemIdsToRemove.includes(gem.id)) {
              gemIdsToRemove.push(gem.id);
              matchedGemTypes.push(gem.type);
            }
          }
        }
      }
    }

    const hasPowerupEffect = starPositions.length > 0 || rainbowTypesToClear.length > 0;

    // Step 1: Highlight matched gems (player can see what's matching)
    this.gemMeshManager.highlightMatched(gemIdsToRemove);
    await this.delay(hasPowerupEffect ? 600 : 400); // Longer pause for powerup effects

    // Step 2: Emit particles, create flying gems, and animate removal
    for (const gemId of gemIdsToRemove) {
      const meshData = this.gemMeshManager.getMeshData(gemId);
      if (meshData) {
        const pos = meshData.mesh.position.clone();
        const colors = GEM_COLORS[meshData.gem.type];
        this.particleSystem.emitCollect(pos, new THREE.Color(colors.glow));

        // Create flying gem animation to purse
        const screenPos = this.worldToScreen(pos);
        this.scoreDisplay.createFlyingGem(screenPos.x, screenPos.y, meshData.gem.type);
      }
    }

    await this.gemMeshManager.animateRemoval(gemIdsToRemove);

    // Pulse purse with collected gem colors
    this.scoreDisplay.pulseWithColors(matchedGemTypes);

    // Step 3: Actually remove gems from board and mesh manager
    for (const gemId of gemIdsToRemove) {
      const meshData = this.gemMeshManager.getMeshData(gemId);
      if (meshData) {
        const gem = meshData.gem;
        this.dragonEvent.addToCollection(gem.type);

        // Ivy's Nature's Bounty ability: bonus gem for favorite type
        if (this.princess.ability.type === 'favorite_bonus' && gem.type === this.princess.favoriteGem) {
          this.dragonEvent.addToCollection(gem.type, this.princess.ability.value);
        }

        this.board.removeGem(gem.position.row, gem.position.col);
        this.gemMeshManager.removeGem(gem.id);
      }
    }

    // Update score to show total gems collected (not arbitrary points)
    let gemsCollected = gemIdsToRemove.length;
    // Add Ivy's bonus gems to display
    if (this.princess.ability.type === 'favorite_bonus') {
      const bonusCount = matchedGemTypes.filter(t => t === this.princess.favoriteGem).length;
      gemsCollected += bonusCount * this.princess.ability.value;
    }
    // Aurora's Radiant Cascade ability: +1 bonus gem per cascade level
    if (this.princess.ability.type === 'cascade_bonus' && cascadeLevel > 1) {
      const cascadeBonus = (cascadeLevel - 1) * this.princess.ability.value;
      gemsCollected += cascadeBonus;
      // Add actual gems to collection for the cascade bonus
      const randomTypes = Object.values(GemType);
      for (let i = 0; i < cascadeBonus; i++) {
        const bonusType = randomTypes[Math.floor(Math.random() * randomTypes.length)];
        this.dragonEvent.addToCollection(bonusType);
      }
    }
    this.scoreDisplay.addScore(gemsCollected);

    // Create powerup gems for big matches (4+ gems)
    for (const match of matches) {
      if (match.length >= 4) {
        this.createPowerupFromMatch(match);
      }
    }

    // Step 4: Apply gravity
    this.applyGravity();

    // Step 5: Fill empty spaces
    this.fillEmptySpaces();

    await this.waitForAnimation();
    await this.delay(150); // Small pause before checking for new matches

    // Step 6: Check for new cascades
    await this.processCascadeStep(cascadeLevel + 1);
  }

  // Finalize dragon threat and streak after entire cascade chain completes
  private finalizeMoveTracking(): void {
    const hadCascade = this.pendingMoveMaxCascade > 1;
    const hadBigMatch = this.pendingMoveHadBigMatch;
    const wasSmallOnly = this.pendingMoveWasSmallOnly;

    // Dragon threat: only increase for PURE small matches (no cascade, no big match)
    if (wasSmallOnly && !hadCascade) {
      // Single small match with no cascade - increases dragon threat
      const chains = this.controller.getConsecutiveSmallChains() + 1;
      this.controller.setConsecutiveSmallChains(chains);
      if (chains >= 3) {
        eventBus.emit('dragonEvent');
        this.controller.setConsecutiveSmallChains(0);
      }
    } else if (hadBigMatch || hadCascade) {
      // Big matches or cascades REDUCE dragon threat
      const reduction = hadCascade ? this.pendingMoveMaxCascade : 1;
      const current = this.controller.getConsecutiveSmallChains();
      this.controller.setConsecutiveSmallChains(Math.max(0, current - reduction));
    }

    // Streaks: only count for 4+ matches or cascades (not boring 3-matches)
    if (hadBigMatch || hadCascade) {
      // Princess streak boost ability (Luna)
      const streakIncrease = this.princess.ability.type === 'streak_boost' ? 2 : 1;
      this.moveStreak += streakIncrease;
      this.totalMoves++;
      if (this.moveStreak > this.bestStreak) {
        this.bestStreak = this.moveStreak;
      }
      this.updateStreakDisplay();

      // Streak milestone rewards with powerups!
      if (this.moveStreak === 5) {
        this.showStreakReward('5 Streak! +Star Gem!', '#ffdd44');
        this.spawnBonusPowerup(PowerupType.Star);
      } else if (this.moveStreak === 10) {
        this.showStreakReward('10 Streak! +Rainbow Gem!', '#ff69b4');
        this.spawnBonusPowerup(PowerupType.Rainbow);
      } else if (this.moveStreak === 15) {
        this.showStreakReward('15 Streak! +Star Gem!', '#44ffaa');
        this.spawnBonusPowerup(PowerupType.Star);
      } else if (this.moveStreak === 20) {
        this.showStreakReward('20 Streak! +Rainbow Gem!', '#ff44ff');
        this.spawnBonusPowerup(PowerupType.Rainbow);
      } else if (this.moveStreak === 25) {
        this.showStreakReward('AMAZING 25! Double Rainbow!', '#44ffff');
        this.spawnBonusPowerup(PowerupType.Rainbow);
        this.spawnBonusPowerup(PowerupType.Rainbow);
      } else if (this.moveStreak % 10 === 0) {
        // Every 10 after 25
        this.showStreakReward(`${this.moveStreak} STREAK! +Rainbow!`, '#ffffff');
        this.spawnBonusPowerup(PowerupType.Rainbow);
      }
    } else {
      // Regular 3-match doesn't count toward streak, but also doesn't reset it
      this.totalMoves++;
    }

    // Update dragon meter UI
    this.updateDragonMeter();
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
    // Track if we've spawned the powerup in the target column
    let powerupSpawned = false;

    for (let col = 0; col < 8; col++) {
      // For each column, find empty spaces from top to bottom
      for (let row = 0; row < 8; row++) {
        if (!this.board.getGem(row, col)) {
          let gem;

          // Spawn powerup at first empty space in the matching column
          if (this.pendingPowerup &&
              this.pendingPowerup.position.col === col &&
              !powerupSpawned) {
            gem = createGem(this.pendingPowerup.type, { row, col }, this.pendingPowerup.powerup);
            powerupSpawned = true;
          } else {
            gem = createGem(this.getRandomGemType(), { row, col });
          }

          this.board.setGem(row, col, gem);
          this.gemMeshManager.spawnGemFromTop(gem);
        }
      }
    }

    // Clear pending powerup
    this.pendingPowerup = null;
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

  // Create powerup gem from big matches
  private createPowerupFromMatch(match: { gems: { position: { row: number; col: number }; type: string }[]; length: number }): void {
    // Find a position in the match to place the powerup (center-ish)
    const centerIndex = Math.floor(match.gems.length / 2);
    const centerGem = match.gems[centerIndex];
    const pos = centerGem.position;

    // Determine powerup type based on match length
    let powerup = PowerupType.None;
    if (match.length === 4) {
      powerup = PowerupType.Star;
    } else if (match.length >= 5) {
      powerup = PowerupType.Rainbow;
    }

    if (powerup !== PowerupType.None) {
      // Create the powerup gem at this position after gravity settles
      // We'll mark this position to spawn a powerup instead of random gem
      this.pendingPowerup = {
        position: { row: pos.row, col: pos.col },
        type: centerGem.type as GemType,
        powerup
      };

      // Show powerup creation message
      const powerupName = powerup === PowerupType.Star ? '⭐ Star Gem!' : '🌈 Rainbow Gem!';
      this.showPowerupCreated(powerupName);
    }
  }

  private pendingPowerup: { position: { row: number; col: number }; type: GemType; powerup: PowerupType } | null = null;

  private showPowerupCreated(text: string): void {
    const msg = document.createElement('div');
    msg.className = 'powerup-message';
    msg.textContent = text;
    this.uiManager.getOverlay().appendChild(msg);

    setTimeout(() => {
      msg.classList.add('fade-out');
      setTimeout(() => msg.remove(), 500);
    }, 1500);
  }

  private updateStreakDisplay(): void {
    if (this.streakDisplay) {
      if (this.moveStreak >= 3) {
        this.streakDisplay.textContent = `🔥 ${this.moveStreak} Streak`;
        this.streakDisplay.classList.remove('hidden');
      } else {
        this.streakDisplay.classList.add('hidden');
      }
    }
  }

  private showCelebration(text: string, color: string): void {
    const celebration = document.createElement('div');
    celebration.className = 'celebration-message';
    celebration.textContent = text;
    celebration.style.color = color;
    this.uiManager.getOverlay().appendChild(celebration);

    // Big particle burst
    this.particleSystem.emitCombo(new THREE.Vector3(0, 0, 1), 5);

    setTimeout(() => {
      celebration.classList.add('fade-out');
      setTimeout(() => celebration.remove(), 500);
    }, 2000);
  }

  // Show streak reward with extra fanfare
  private showStreakReward(text: string, color: string): void {
    const reward = document.createElement('div');
    reward.className = 'streak-reward-message';
    reward.textContent = text;
    reward.style.color = color;
    this.uiManager.getOverlay().appendChild(reward);

    // Extra big particle burst for streak rewards
    this.particleSystem.emitCombo(new THREE.Vector3(0, 0, 1), 8);
    this.particleSystem.emitCombo(new THREE.Vector3(-2, 0, 1), 5);
    this.particleSystem.emitCombo(new THREE.Vector3(2, 0, 1), 5);

    setTimeout(() => {
      reward.classList.add('fade-out');
      setTimeout(() => reward.remove(), 500);
    }, 2500);
  }

  // Spawn a bonus powerup gem as streak reward
  private spawnBonusPowerup(powerupType: PowerupType): void {
    // Find a random non-powerup gem on the board and convert it
    const candidates: { row: number; col: number; gem: any }[] = [];

    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const gem = this.board.getGem(row, col);
        if (gem && gem.powerup === PowerupType.None) {
          candidates.push({ row, col, gem });
        }
      }
    }

    if (candidates.length > 0) {
      const chosen = candidates[Math.floor(Math.random() * candidates.length)];

      // Remove old gem and create new powerup gem
      this.gemMeshManager.removeGem(chosen.gem.id);
      this.board.removeGem(chosen.row, chosen.col);

      const newGem = createGem(chosen.gem.type, { row: chosen.row, col: chosen.col }, powerupType);
      this.board.setGem(chosen.row, chosen.col, newGem);
      this.gemMeshManager.addGem(newGem);

      // Flash effect at that position
      const pos = this.gemMeshManager.getFactory().boardToWorld(chosen.row, chosen.col);
      this.particleSystem.emitCollect(pos, new THREE.Color(0xffffff));
    }
  }

  // Reset streak on failed move
  private resetStreak(): void {
    this.moveStreak = 0;
    this.updateStreakDisplay();
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
      // Actually steal gems AFTER animation completes (so player sees count go down)
      // Marina's Ocean Shield ability: flat reduction in gems stolen
      const dragonResist = this.princess.ability.type === 'dragon_resist' ? this.princess.ability.value : 0;
      const stealResult = this.dragonEvent.stealFromCollection(dragonResist);
      if (stealResult.totalStolen > 0) {
        this.showStolenMessage(stealResult.totalStolen, dragonResist > 0);
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

  private showStolenMessage(totalStolen: number, wasResisted: boolean = false): void {
    const message = document.createElement('div');
    message.id = 'dragon-stolen-message';
    if (wasResisted) {
      message.innerHTML = `🐉 Dragon stole <strong>${totalStolen}</strong> gem${totalStolen !== 1 ? 's' : ''}!<br><span style="color: #87ceeb; font-size: 0.9rem;">🛡️ Ocean Shield reduced damage!</span>`;
    } else {
      message.innerHTML = `🐉 Dragon stole <strong>${totalStolen}</strong> gem${totalStolen !== 1 ? 's' : ''}!`;
    }
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

    // Calculate hint cost (increases with each use, max 10)
    let hintCost = Math.min(
      GameScene.HINT_BASE_COST + this.hintUseCount,
      GameScene.HINT_MAX_COST
    );

    // Crystal's cost discount ability
    if (this.princess.ability.type === 'cost_discount') {
      hintCost = Math.max(1, Math.floor(hintCost * (1 - this.princess.ability.value / 100)));
    }

    const total = this.dragonEvent.getCollectionTotal();
    if (total < hintCost) {
      this.showHintMessage(`Need ${hintCost} gems for hint! (Have ${total})`, false);
      return;
    }

    const hint = this.findValidMove();
    if (hint) {
      // Pay the cost
      this.dragonEvent.payFairyDustCost(hintCost);
      this.hintUseCount++;

      // Show cost message
      const discountText = this.princess.ability.type === 'cost_discount' ? ' (Frost Blessing!)' : '';
      this.showHintMessage(`Hint cost: ${hintCost} gems${discountText}`, true);

      // Highlight both gems in the swap pair
      this.gemMeshManager.highlightHint(hint.pos1.row, hint.pos1.col);
      this.gemMeshManager.highlightHint(hint.pos2.row, hint.pos2.col);

      // Show a visual hint indicator on screen
      this.showHintArrow(hint.pos1, hint.pos2);

      // Update hint button tooltip with new cost
      this.updateHintButtonTooltip();
    } else {
      this.showNoHintMessage();
    }
  }

  private showHintMessage(text: string, success: boolean): void {
    const msg = document.createElement('div');
    msg.className = 'hint-cost-message';
    msg.textContent = text;
    msg.style.cssText = `
      position: fixed;
      bottom: 80px;
      right: 20px;
      background: rgba(0,0,0,0.8);
      color: ${success ? '#ffd700' : '#ff6666'};
      padding: 8px 15px;
      border-radius: 8px;
      font-family: 'Quicksand', sans-serif;
      font-size: 0.9rem;
      z-index: 100;
      animation: fadeInOut 2s ease-in-out forwards;
    `;
    this.uiManager.getOverlay().appendChild(msg);
    setTimeout(() => msg.remove(), 2000);
  }

  private updateHintButtonTooltip(): void {
    if (this.hintButton) {
      let nextCost = Math.min(
        GameScene.HINT_BASE_COST + this.hintUseCount,
        GameScene.HINT_MAX_COST
      );
      if (this.princess.ability.type === 'cost_discount') {
        nextCost = Math.max(1, Math.floor(nextCost * (1 - this.princess.ability.value / 100)));
      }
      this.hintButton.setAttribute('data-tooltip', `Hint (costs ${nextCost} gems)`);
    }
  }

  private showHintArrow(pos1: { row: number; col: number }, pos2: { row: number; col: number }): void {
    const worldPos1 = this.gemMeshManager.getFactory().boardToWorld(pos1.row, pos1.col);
    const worldPos2 = this.gemMeshManager.getFactory().boardToWorld(pos2.row, pos2.col);
    const screenPos1 = this.worldToScreen(worldPos1);
    const screenPos2 = this.worldToScreen(worldPos2);

    // Create hint arrow element
    const hintEl = document.createElement('div');
    hintEl.className = 'hint-indicator';

    const midX = (screenPos1.x + screenPos2.x) / 2;
    const midY = (screenPos1.y + screenPos2.y) / 2;

    // Determine direction
    const isHorizontal = pos1.row === pos2.row;
    const arrow = isHorizontal ? '↔' : '↕';

    hintEl.innerHTML = arrow;
    hintEl.style.cssText = `
      position: fixed;
      left: ${midX}px;
      top: ${midY}px;
      transform: translate(-50%, -50%);
      font-size: 2.5rem;
      color: #ffd700;
      text-shadow: 0 0 20px #ffd700, 0 0 40px #ffaa00;
      pointer-events: none;
      z-index: 100;
      animation: hintPulse 1s ease-in-out 3;
    `;

    this.uiManager.getOverlay().appendChild(hintEl);

    // Remove after animation
    setTimeout(() => hintEl.remove(), 3000);
  }

  private showNoHintMessage(): void {
    const msg = document.createElement('div');
    msg.className = 'hint-message';
    msg.textContent = 'No moves! Shuffling...';
    this.uiManager.getOverlay().appendChild(msg);

    setTimeout(() => {
      msg.remove();
      this.controller.shuffle();
      this.syncMeshPositions();
    }, 1000);
  }

  private findValidMove(): { pos1: { row: number; col: number }; pos2: { row: number; col: number } } | null {
    const matchFinder = this.controller.getMatchFinder();

    // Check all horizontal swaps
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 7; col++) {
        const pos1 = { row, col };
        const pos2 = { row, col: col + 1 };
        if (matchFinder.wouldCreateMatch(this.board, pos1, pos2)) {
          return { pos1, pos2 };
        }
      }
    }

    // Check all vertical swaps
    for (let row = 0; row < 7; row++) {
      for (let col = 0; col < 8; col++) {
        const pos1 = { row, col };
        const pos2 = { row: row + 1, col };
        if (matchFinder.wouldCreateMatch(this.board, pos1, pos2)) {
          return { pos1, pos2 };
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
    this.createStreakDisplay();
    this.createHintButton();
    this.createShuffleButton();
    this.createDecorations();
  }

  private createStreakDisplay(): void {
    this.streakDisplay = document.createElement('div');
    this.streakDisplay.id = 'streak-display';
    this.streakDisplay.className = 'hidden';
    this.uiManager.getOverlay().appendChild(this.streakDisplay);
  }

  private createPrincessMini(): void {
    this.princessMini = document.createElement('div');
    this.princessMini.id = 'princess-mini';

    const primaryColor = this.princess.colors.primary.toString(16).padStart(6, '0');
    const secondaryColor = this.princess.colors.secondary.toString(16).padStart(6, '0');
    const accentColor = this.princess.colors.accent.toString(16).padStart(6, '0');

    this.princessMini.style.background = `linear-gradient(180deg, #${secondaryColor} 0%, #${primaryColor} 100%)`;

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 70 90');
    svg.setAttribute('width', '70');
    svg.setAttribute('height', '90');

    // Beautiful flowing hair with waves
    const hairBack = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    hairBack.setAttribute('d', 'M10 35 Q8 50 12 70 Q15 85 20 90 L50 90 Q55 85 58 70 Q62 50 60 35 Q58 20 35 18 Q12 20 10 35');
    hairBack.setAttribute('fill', `#${accentColor}`);
    svg.appendChild(hairBack);

    // Hair highlights for shine
    const hairShine = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    hairShine.setAttribute('d', 'M18 30 Q20 45 18 60');
    hairShine.setAttribute('stroke', 'rgba(255,255,255,0.3)');
    hairShine.setAttribute('stroke-width', '3');
    hairShine.setAttribute('fill', 'none');
    hairShine.setAttribute('stroke-linecap', 'round');
    svg.appendChild(hairShine);

    // Soft face shape
    const face = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
    face.setAttribute('cx', '35');
    face.setAttribute('cy', '45');
    face.setAttribute('rx', '16');
    face.setAttribute('ry', '20');
    face.setAttribute('fill', '#ffecd2');
    svg.appendChild(face);

    // Rosy cheeks
    const cheekL = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
    cheekL.setAttribute('cx', '24');
    cheekL.setAttribute('cy', '50');
    cheekL.setAttribute('rx', '5');
    cheekL.setAttribute('ry', '3');
    cheekL.setAttribute('fill', '#ffb6c1');
    cheekL.setAttribute('opacity', '0.5');
    svg.appendChild(cheekL);

    const cheekR = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
    cheekR.setAttribute('cx', '46');
    cheekR.setAttribute('cy', '50');
    cheekR.setAttribute('rx', '5');
    cheekR.setAttribute('ry', '3');
    cheekR.setAttribute('fill', '#ffb6c1');
    cheekR.setAttribute('opacity', '0.5');
    svg.appendChild(cheekR);

    // Big sparkling eyes - white base
    const eyeWhiteL = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
    eyeWhiteL.setAttribute('cx', '28');
    eyeWhiteL.setAttribute('cy', '42');
    eyeWhiteL.setAttribute('rx', '6');
    eyeWhiteL.setAttribute('ry', '7');
    eyeWhiteL.setAttribute('fill', 'white');
    svg.appendChild(eyeWhiteL);

    const eyeWhiteR = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
    eyeWhiteR.setAttribute('cx', '42');
    eyeWhiteR.setAttribute('cy', '42');
    eyeWhiteR.setAttribute('rx', '6');
    eyeWhiteR.setAttribute('ry', '7');
    eyeWhiteR.setAttribute('fill', 'white');
    svg.appendChild(eyeWhiteR);

    // Colored iris
    const eyeL = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
    eyeL.setAttribute('cx', '29');
    eyeL.setAttribute('cy', '43');
    eyeL.setAttribute('rx', '4');
    eyeL.setAttribute('ry', '5');
    eyeL.setAttribute('fill', `#${primaryColor}`);
    svg.appendChild(eyeL);

    const eyeR = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
    eyeR.setAttribute('cx', '43');
    eyeR.setAttribute('cy', '43');
    eyeR.setAttribute('rx', '4');
    eyeR.setAttribute('ry', '5');
    eyeR.setAttribute('fill', `#${primaryColor}`);
    svg.appendChild(eyeR);

    // Pupils
    const pupilL = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    pupilL.setAttribute('cx', '30');
    pupilL.setAttribute('cy', '43');
    pupilL.setAttribute('r', '2');
    pupilL.setAttribute('fill', '#222');
    svg.appendChild(pupilL);

    const pupilR = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    pupilR.setAttribute('cx', '44');
    pupilR.setAttribute('cy', '43');
    pupilR.setAttribute('r', '2');
    pupilR.setAttribute('fill', '#222');
    svg.appendChild(pupilR);

    // Eye sparkles
    const sparkleL = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    sparkleL.setAttribute('cx', '31');
    sparkleL.setAttribute('cy', '41');
    sparkleL.setAttribute('r', '1.5');
    sparkleL.setAttribute('fill', 'white');
    svg.appendChild(sparkleL);

    const sparkleR = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    sparkleR.setAttribute('cx', '45');
    sparkleR.setAttribute('cy', '41');
    sparkleR.setAttribute('r', '1.5');
    sparkleR.setAttribute('fill', 'white');
    svg.appendChild(sparkleR);

    // Cute eyelashes
    const lashL = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    lashL.setAttribute('d', 'M22 38 Q24 36 26 37 M24 36 Q26 33 28 35 M27 35 Q30 32 32 35');
    lashL.setAttribute('stroke', '#333');
    lashL.setAttribute('stroke-width', '1');
    lashL.setAttribute('fill', 'none');
    svg.appendChild(lashL);

    const lashR = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    lashR.setAttribute('d', 'M48 38 Q46 36 44 37 M46 36 Q44 33 42 35 M43 35 Q40 32 38 35');
    lashR.setAttribute('stroke', '#333');
    lashR.setAttribute('stroke-width', '1');
    lashR.setAttribute('fill', 'none');
    svg.appendChild(lashR);

    // Soft eyebrows
    const browL = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    browL.setAttribute('d', 'M23 33 Q28 30 33 33');
    browL.setAttribute('stroke', `#${accentColor}`);
    browL.setAttribute('stroke-width', '1.5');
    browL.setAttribute('fill', 'none');
    svg.appendChild(browL);

    const browR = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    browR.setAttribute('d', 'M37 33 Q42 30 47 33');
    browR.setAttribute('stroke', `#${accentColor}`);
    browR.setAttribute('stroke-width', '1.5');
    browR.setAttribute('fill', 'none');
    svg.appendChild(browR);

    // Small cute nose
    const nose = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    nose.setAttribute('d', 'M35 47 Q33 50 35 52');
    nose.setAttribute('stroke', '#ddb8a0');
    nose.setAttribute('stroke-width', '1.5');
    nose.setAttribute('fill', 'none');
    svg.appendChild(nose);

    // Cute smile with lips
    const smile = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    smile.setAttribute('d', 'M29 57 Q35 63 41 57');
    smile.setAttribute('stroke', '#e88a8a');
    smile.setAttribute('stroke-width', '2');
    smile.setAttribute('fill', '#ffb6c1');
    smile.setAttribute('stroke-linecap', 'round');
    svg.appendChild(smile);

    // Hair front framing face
    const hairFront = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    hairFront.setAttribute('d', 'M19 28 Q20 35 19 45 Q35 30 51 45 Q50 35 51 28 Q45 18 35 18 Q25 18 19 28');
    hairFront.setAttribute('fill', `#${accentColor}`);
    svg.appendChild(hairFront);

    // Beautiful crown with jewels
    const crown = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    crown.setAttribute('d', 'M22 20 L24 10 L28 16 L32 6 L35 14 L38 6 L42 16 L46 10 L48 20 Q35 22 22 20');
    crown.setAttribute('fill', '#ffd700');
    crown.setAttribute('stroke', '#daa520');
    crown.setAttribute('stroke-width', '0.5');
    svg.appendChild(crown);

    // Crown jewels
    const jewel1 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    jewel1.setAttribute('cx', '35');
    jewel1.setAttribute('cy', '12');
    jewel1.setAttribute('r', '2.5');
    jewel1.setAttribute('fill', `#${primaryColor}`);
    svg.appendChild(jewel1);

    const jewel2 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    jewel2.setAttribute('cx', '28');
    jewel2.setAttribute('cy', '14');
    jewel2.setAttribute('r', '1.5');
    jewel2.setAttribute('fill', `#${secondaryColor}`);
    svg.appendChild(jewel2);

    const jewel3 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    jewel3.setAttribute('cx', '42');
    jewel3.setAttribute('cy', '14');
    jewel3.setAttribute('r', '1.5');
    jewel3.setAttribute('fill', `#${secondaryColor}`);
    svg.appendChild(jewel3);

    // Dress collar
    const dress = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    dress.setAttribute('d', 'M25 65 Q35 62 45 65 L50 90 L20 90 Z');
    dress.setAttribute('fill', `#${primaryColor}`);
    svg.appendChild(dress);

    // Dress detail
    const dressDetail = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    dressDetail.setAttribute('d', 'M30 68 Q35 72 40 68');
    dressDetail.setAttribute('stroke', `#${secondaryColor}`);
    dressDetail.setAttribute('stroke-width', '2');
    dressDetail.setAttribute('fill', 'none');
    svg.appendChild(dressDetail);

    this.princessMini.appendChild(svg);
    this.uiManager.getOverlay().appendChild(this.princessMini);

    // Add princess ability indicator below portrait
    const abilityIndicator = document.createElement('div');
    abilityIndicator.id = 'princess-ability';
    abilityIndicator.innerHTML = `
      <span class="ability-name">${this.princess.ability.name}</span><br>
      <span>${this.princess.ability.description}</span>
    `;
    this.uiManager.getOverlay().appendChild(abilityIndicator);
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
    this.hintButton.className = 'game-tooltip game-action-btn';
    this.hintButton.innerHTML = '?';

    // Calculate initial hint cost
    let initialCost = GameScene.HINT_BASE_COST;
    if (this.princess.ability.type === 'cost_discount') {
      initialCost = Math.max(1, Math.floor(initialCost * (1 - this.princess.ability.value / 100)));
    }
    this.hintButton.setAttribute('data-tooltip', `Hint (costs ${initialCost} gems)`);

    this.hintButton.addEventListener('click', () => {
      this.showHint();
    });

    this.uiManager.getOverlay().appendChild(this.hintButton);
  }

  private createShuffleButton(): void {
    this.shuffleButton = document.createElement('button');
    this.shuffleButton.id = 'shuffle-button';
    this.shuffleButton.className = 'game-tooltip game-action-btn';
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
    // Crystal's Frost Blessing ability reduces cost
    let costPercent = 0.2;
    if (this.princess.ability.type === 'cost_discount') {
      costPercent *= (1 - this.princess.ability.value / 100);
    }
    const cost = Math.max(1, Math.floor(total * costPercent));

    // Deduct gems from collection
    this.dragonEvent.payFairyDustCost(cost);

    // Shuffle the board
    this.controller.shuffle();
    this.syncMeshPositions();
    this.controller.ensureValidMoves();

    const discountText = this.princess.ability.type === 'cost_discount' ? ' (Frost Blessing!)' : '';
    this.showFairyDustMessage(`✨ Fairy Dust used! (${cost} gems spent)${discountText}`, true);
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
      svg.setAttribute('viewBox', '0 0 80 80');
      svg.setAttribute('width', '80');
      svg.setAttribute('height', '80');

      // Outer flourish
      const flourish1 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      flourish1.setAttribute('d', 'M4 4 Q4 20 12 28 Q20 36 28 36 Q36 36 40 28');
      flourish1.setAttribute('fill', 'none');
      flourish1.setAttribute('stroke', 'rgba(255,215,0,0.6)');
      flourish1.setAttribute('stroke-width', '2');
      flourish1.setAttribute('stroke-linecap', 'round');
      svg.appendChild(flourish1);

      // Inner flourish
      const flourish2 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      flourish2.setAttribute('d', 'M4 4 Q20 4 28 12 Q36 20 36 28 Q36 36 28 40');
      flourish2.setAttribute('fill', 'none');
      flourish2.setAttribute('stroke', 'rgba(255,215,0,0.6)');
      flourish2.setAttribute('stroke-width', '2');
      flourish2.setAttribute('stroke-linecap', 'round');
      svg.appendChild(flourish2);

      // Spiral accent
      const spiral = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      spiral.setAttribute('d', 'M8 8 Q8 40 40 40 Q40 72 72 72');
      spiral.setAttribute('fill', 'none');
      spiral.setAttribute('stroke', 'rgba(255,215,0,0.35)');
      spiral.setAttribute('stroke-width', '1.5');
      spiral.setAttribute('stroke-linecap', 'round');
      svg.appendChild(spiral);

      // Corner diamond gem
      const gem = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      gem.setAttribute('d', 'M16 8 L22 16 L16 24 L10 16 Z');
      gem.setAttribute('fill', '#ff69b4');
      gem.setAttribute('opacity', '0.8');
      svg.appendChild(gem);

      // Small accent dot
      const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      dot.setAttribute('cx', '32');
      dot.setAttribute('cy', '32');
      dot.setAttribute('r', '2.5');
      dot.setAttribute('fill', 'rgba(255,215,0,0.5)');
      svg.appendChild(dot);

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
    if (this.streakDisplay) {
      this.streakDisplay.remove();
      this.streakDisplay = null;
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
