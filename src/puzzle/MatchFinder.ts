import { Board, BOARD_SIZE } from './Board';
import { Gem, Position, GemType } from './Gem';

export interface Match {
  gems: Gem[];
  type: GemType;
  length: number;
  isHorizontal: boolean;
  isVertical: boolean;
}

export class MatchFinder {
  findAllMatches(board: Board): Match[] {
    const horizontalMatches = this.findHorizontalMatches(board);
    const verticalMatches = this.findVerticalMatches(board);
    return this.mergeOverlappingMatches([...horizontalMatches, ...verticalMatches]);
  }

  private findHorizontalMatches(board: Board): Match[] {
    const matches: Match[] = [];

    for (let row = 0; row < BOARD_SIZE; row++) {
      let matchStart = 0;
      let currentType: GemType | null = null;
      const gemsInMatch: Gem[] = [];

      for (let col = 0; col <= BOARD_SIZE; col++) {
        const gem = board.getGem(row, col);
        const gemType = gem?.type ?? null;

        if (gemType === currentType && gemType !== null) {
          gemsInMatch.push(gem!);
        } else {
          if (gemsInMatch.length >= 3 && currentType !== null) {
            matches.push({
              gems: [...gemsInMatch],
              type: currentType,
              length: gemsInMatch.length,
              isHorizontal: true,
              isVertical: false,
            });
          }
          gemsInMatch.length = 0;
          if (gem) {
            gemsInMatch.push(gem);
            currentType = gemType;
            matchStart = col;
          } else {
            currentType = null;
          }
        }
      }
    }

    return matches;
  }

  private findVerticalMatches(board: Board): Match[] {
    const matches: Match[] = [];

    for (let col = 0; col < BOARD_SIZE; col++) {
      let currentType: GemType | null = null;
      const gemsInMatch: Gem[] = [];

      for (let row = 0; row <= BOARD_SIZE; row++) {
        const gem = board.getGem(row, col);
        const gemType = gem?.type ?? null;

        if (gemType === currentType && gemType !== null) {
          gemsInMatch.push(gem!);
        } else {
          if (gemsInMatch.length >= 3 && currentType !== null) {
            matches.push({
              gems: [...gemsInMatch],
              type: currentType,
              length: gemsInMatch.length,
              isHorizontal: false,
              isVertical: true,
            });
          }
          gemsInMatch.length = 0;
          if (gem) {
            gemsInMatch.push(gem);
            currentType = gemType;
          } else {
            currentType = null;
          }
        }
      }
    }

    return matches;
  }

  private mergeOverlappingMatches(matches: Match[]): Match[] {
    if (matches.length === 0) return [];

    const gemToMatches = new Map<string, Match[]>();

    for (const match of matches) {
      for (const gem of match.gems) {
        const key = `${gem.position.row},${gem.position.col}`;
        if (!gemToMatches.has(key)) {
          gemToMatches.set(key, []);
        }
        gemToMatches.get(key)!.push(match);
      }
    }

    // Find overlapping matches and merge them
    const processed = new Set<Match>();
    const result: Match[] = [];

    for (const match of matches) {
      if (processed.has(match)) continue;

      const overlapping: Match[] = [match];
      const queue: Match[] = [match];
      processed.add(match);

      while (queue.length > 0) {
        const current = queue.shift()!;
        for (const gem of current.gems) {
          const key = `${gem.position.row},${gem.position.col}`;
          const relatedMatches = gemToMatches.get(key) || [];
          for (const related of relatedMatches) {
            if (!processed.has(related)) {
              processed.add(related);
              overlapping.push(related);
              queue.push(related);
            }
          }
        }
      }

      // Merge overlapping matches into one
      if (overlapping.length === 1) {
        result.push(match);
      } else {
        const allGems = new Map<string, Gem>();
        let isHorizontal = false;
        let isVertical = false;

        for (const m of overlapping) {
          isHorizontal = isHorizontal || m.isHorizontal;
          isVertical = isVertical || m.isVertical;
          for (const gem of m.gems) {
            const key = `${gem.position.row},${gem.position.col}`;
            allGems.set(key, gem);
          }
        }

        const mergedGems = Array.from(allGems.values());
        result.push({
          gems: mergedGems,
          type: match.type,
          length: mergedGems.length,
          isHorizontal,
          isVertical,
        });
      }
    }

    return result;
  }

  hasValidMoves(board: Board): boolean {
    // Check all horizontal swaps
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE - 1; col++) {
        if (this.wouldCreateMatch(board, { row, col }, { row, col: col + 1 })) {
          return true;
        }
      }
    }

    // Check all vertical swaps
    for (let row = 0; row < BOARD_SIZE - 1; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        if (this.wouldCreateMatch(board, { row, col }, { row: row + 1, col })) {
          return true;
        }
      }
    }

    return false;
  }

  wouldCreateMatch(board: Board, pos1: Position, pos2: Position): boolean {
    const clonedBoard = board.clone();
    clonedBoard.swap(pos1, pos2);
    const matches = this.findAllMatches(clonedBoard);
    return matches.length > 0;
  }

  findMatchAt(board: Board, position: Position): Match | null {
    const matches = this.findAllMatches(board);
    for (const match of matches) {
      for (const gem of match.gems) {
        if (gem.position.row === position.row && gem.position.col === position.col) {
          return match;
        }
      }
    }
    return null;
  }
}
