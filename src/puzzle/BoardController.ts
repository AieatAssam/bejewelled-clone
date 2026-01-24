import { Board, BOARD_SIZE } from './Board';
import { Gem, Position, GemType, createGem, getRandomGemType } from './Gem';
import { MatchFinder, Match } from './MatchFinder';
import { eventBus } from '../utils/EventBus';

export interface SwapResult {
  success: boolean;
  matches: Match[];
}

export interface CascadeResult {
  matches: Match[];
  collectedGems: Gem[];
  totalScore: number;
  cascadeCount: number;
}

export interface ScoreResult {
  baseScore: number;
  multiplier: number;
  totalScore: number;
}

export class BoardController {
  private board: Board;
  private matchFinder: MatchFinder;
  private consecutiveSmallChains: number = 0;

  constructor(board: Board) {
    this.board = board;
    this.matchFinder = new MatchFinder();
  }

  getBoard(): Board {
    return this.board;
  }

  initializeBoard(): void {
    this.board.initialize();
    this.consecutiveSmallChains = 0;
  }

  trySwap(pos1: Position, pos2: Position): SwapResult {
    if (!this.board.areAdjacent(pos1, pos2)) {
      return { success: false, matches: [] };
    }

    const gem1 = this.board.getGem(pos1.row, pos1.col);
    const gem2 = this.board.getGem(pos2.row, pos2.col);

    if (!gem1 || !gem2) {
      return { success: false, matches: [] };
    }

    // Perform swap
    this.board.swap(pos1, pos2);

    // Check for matches
    const matches = this.matchFinder.findAllMatches(this.board);

    if (matches.length === 0) {
      // Swap back - invalid move
      this.board.swap(pos1, pos2);
      return { success: false, matches: [] };
    }

    eventBus.emit('validSwap', pos1, pos2);
    return { success: true, matches };
  }

  processCascade(): CascadeResult {
    const collectedGems: Gem[] = [];
    let totalScore = 0;
    let cascadeCount = 0;
    const allMatches: Match[] = [];

    let matches = this.matchFinder.findAllMatches(this.board);

    while (matches.length > 0) {
      cascadeCount++;
      allMatches.push(...matches);

      // Calculate score for this cascade level
      const cascadeScore = this.calculateCascadeScore(matches, cascadeCount);
      totalScore += cascadeScore.totalScore;

      // Track small chains for dragon event
      this.trackSmallChains(matches);

      // Collect matched gems
      for (const match of matches) {
        for (const gem of match.gems) {
          if (this.board.getGem(gem.position.row, gem.position.col)) {
            collectedGems.push(gem);
            this.board.removeGem(gem.position.row, gem.position.col);
          }
        }
      }

      eventBus.emit('gemsRemoved', matches, cascadeCount);

      // Apply gravity
      this.applyGravity();

      // Fill empty spaces
      this.fillEmptySpaces();

      // Check for new matches
      matches = this.matchFinder.findAllMatches(this.board);
    }

    eventBus.emit('cascadeComplete', {
      matches: allMatches,
      collectedGems,
      totalScore,
      cascadeCount,
    });

    return {
      matches: allMatches,
      collectedGems,
      totalScore,
      cascadeCount,
    };
  }

  private calculateCascadeScore(matches: Match[], cascadeLevel: number): ScoreResult {
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

    const multiplier = cascadeLevel;
    const totalScore = baseScore * multiplier;

    return { baseScore, multiplier, totalScore };
  }

  private trackSmallChains(matches: Match[]): void {
    const hasOnlySmallMatches = matches.every(m => m.length === 3);

    if (hasOnlySmallMatches && matches.length === 1) {
      this.consecutiveSmallChains++;
      if (this.consecutiveSmallChains >= 3) {
        eventBus.emit('dragonEvent');
        this.consecutiveSmallChains = 0;
      }
    } else {
      // Larger match or multiple matches break the chain
      this.consecutiveSmallChains = 0;
    }
  }

  getConsecutiveSmallChains(): number {
    return this.consecutiveSmallChains;
  }

  setConsecutiveSmallChains(count: number): void {
    this.consecutiveSmallChains = count;
  }

  resetSmallChainCounter(): void {
    this.consecutiveSmallChains = 0;
  }

  private applyGravity(): void {
    for (let col = 0; col < BOARD_SIZE; col++) {
      let writeRow = BOARD_SIZE - 1;

      for (let row = BOARD_SIZE - 1; row >= 0; row--) {
        const gem = this.board.getGem(row, col);
        if (gem) {
          if (row !== writeRow) {
            this.board.setGem(writeRow, col, gem);
            this.board.setGem(row, col, null);
            eventBus.emit('gemFell', gem, { row, col }, { row: writeRow, col });
          }
          writeRow--;
        }
      }
    }
  }

  private fillEmptySpaces(): void {
    for (let col = 0; col < BOARD_SIZE; col++) {
      for (let row = 0; row < BOARD_SIZE; row++) {
        if (!this.board.getGem(row, col)) {
          const newGem = createGem(getRandomGemType(), { row, col });
          this.board.setGem(row, col, newGem);
          eventBus.emit('gemSpawned', newGem);
        }
      }
    }
  }

  hasValidMoves(): boolean {
    return this.matchFinder.hasValidMoves(this.board);
  }

  shuffle(): void {
    const gems = this.board.getAllGems();

    // Fisher-Yates shuffle
    for (let i = gems.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [gems[i], gems[j]] = [gems[j], gems[i]];
    }

    // Place shuffled gems back
    let index = 0;
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        const gem = gems[index++];
        gem.position = { row, col };
        this.board.setGem(row, col, gem);
      }
    }

    // Clear any initial matches
    let matches = this.matchFinder.findAllMatches(this.board);
    while (matches.length > 0) {
      for (const match of matches) {
        for (const gem of match.gems) {
          const currentGem = this.board.getGem(gem.position.row, gem.position.col);
          if (currentGem) {
            currentGem.type = getRandomGemType();
          }
        }
      }
      matches = this.matchFinder.findAllMatches(this.board);
    }

    eventBus.emit('boardShuffled');
  }

  ensureValidMoves(): void {
    let attempts = 0;
    while (!this.hasValidMoves() && attempts < 100) {
      this.shuffle();
      attempts++;
    }
  }

  createSpecialGem(position: Position, matchLength: number): void {
    const gem = this.board.getGem(position.row, position.col);
    if (gem) {
      if (matchLength === 4) {
        gem.isSpecial = true;
        eventBus.emit('specialGemCreated', gem);
      } else if (matchLength >= 5) {
        gem.isSuper = true;
        eventBus.emit('superGemCreated', gem);
      }
    }
  }

  getMatchFinder(): MatchFinder {
    return this.matchFinder;
  }
}
