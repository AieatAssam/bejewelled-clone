import { describe, it, expect, beforeEach } from 'vitest';
import { Board } from '../../src/puzzle/Board';
import { MatchFinder } from '../../src/puzzle/MatchFinder';
import { GemType, createGem, resetGemIdCounter } from '../../src/puzzle/Gem';

describe('MatchFinder', () => {
  let board: Board;
  let matchFinder: MatchFinder;

  beforeEach(() => {
    board = new Board();
    matchFinder = new MatchFinder();
    resetGemIdCounter();
  });

  function setRow(row: number, types: GemType[]): void {
    types.forEach((type, col) => {
      board.setGem(row, col, createGem(type, { row, col }));
    });
  }

  function fillBoardNoMatches(): void {
    // Use a 3-type rotation pattern that never creates 3 in a row
    const types = [GemType.Ruby, GemType.Sapphire, GemType.Emerald];
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        // Offset by row to prevent vertical matches too
        const typeIndex = (col + row) % 3;
        board.setGem(row, col, createGem(types[typeIndex], { row, col }));
      }
    }
  }

  describe('findAllMatches', () => {
    it('should find horizontal match of 3', () => {
      fillBoardNoMatches();
      // Create horizontal match at row 0
      board.setGem(0, 0, createGem(GemType.Emerald, { row: 0, col: 0 }));
      board.setGem(0, 1, createGem(GemType.Emerald, { row: 0, col: 1 }));
      board.setGem(0, 2, createGem(GemType.Emerald, { row: 0, col: 2 }));

      const matches = matchFinder.findAllMatches(board);

      expect(matches.length).toBe(1);
      expect(matches[0].length).toBe(3);
      expect(matches[0].type).toBe(GemType.Emerald);
      expect(matches[0].isHorizontal).toBe(true);
      expect(matches[0].isVertical).toBe(false);
    });

    it('should find horizontal match of 4', () => {
      fillBoardNoMatches();
      board.setGem(2, 2, createGem(GemType.Diamond, { row: 2, col: 2 }));
      board.setGem(2, 3, createGem(GemType.Diamond, { row: 2, col: 3 }));
      board.setGem(2, 4, createGem(GemType.Diamond, { row: 2, col: 4 }));
      board.setGem(2, 5, createGem(GemType.Diamond, { row: 2, col: 5 }));

      const matches = matchFinder.findAllMatches(board);

      expect(matches.length).toBe(1);
      expect(matches[0].length).toBe(4);
    });

    it('should find horizontal match of 5', () => {
      fillBoardNoMatches();
      for (let col = 1; col <= 5; col++) {
        board.setGem(3, col, createGem(GemType.Amethyst, { row: 3, col }));
      }

      const matches = matchFinder.findAllMatches(board);

      expect(matches.length).toBe(1);
      expect(matches[0].length).toBe(5);
    });

    it('should find vertical match of 3', () => {
      fillBoardNoMatches();
      // Use Diamond which is not in the base pattern
      board.setGem(0, 3, createGem(GemType.Diamond, { row: 0, col: 3 }));
      board.setGem(1, 3, createGem(GemType.Diamond, { row: 1, col: 3 }));
      board.setGem(2, 3, createGem(GemType.Diamond, { row: 2, col: 3 }));

      const matches = matchFinder.findAllMatches(board);

      expect(matches.length).toBe(1);
      expect(matches[0].length).toBe(3);
      expect(matches[0].isHorizontal).toBe(false);
      expect(matches[0].isVertical).toBe(true);
    });

    it('should find vertical match of 4', () => {
      fillBoardNoMatches();
      // Use Amethyst which is not in the base pattern
      for (let row = 2; row <= 5; row++) {
        board.setGem(row, 4, createGem(GemType.Amethyst, { row, col: 4 }));
      }

      const matches = matchFinder.findAllMatches(board);

      expect(matches.length).toBe(1);
      expect(matches[0].length).toBe(4);
    });

    it('should find multiple separate matches', () => {
      fillBoardNoMatches();
      // Horizontal match at row 0 - use Diamond (not in pattern)
      board.setGem(0, 0, createGem(GemType.Diamond, { row: 0, col: 0 }));
      board.setGem(0, 1, createGem(GemType.Diamond, { row: 0, col: 1 }));
      board.setGem(0, 2, createGem(GemType.Diamond, { row: 0, col: 2 }));

      // Vertical match at column 7 (separate) - use Amethyst (not in pattern)
      board.setGem(5, 7, createGem(GemType.Amethyst, { row: 5, col: 7 }));
      board.setGem(6, 7, createGem(GemType.Amethyst, { row: 6, col: 7 }));
      board.setGem(7, 7, createGem(GemType.Amethyst, { row: 7, col: 7 }));

      const matches = matchFinder.findAllMatches(board);

      expect(matches.length).toBe(2);
    });

    it('should merge L-shaped matches', () => {
      fillBoardNoMatches();
      // Create L-shape using Diamond (not in pattern)
      // Horizontal: (2,0), (2,1), (2,2)
      // Vertical: (2,2), (3,2), (4,2)
      board.setGem(2, 0, createGem(GemType.Diamond, { row: 2, col: 0 }));
      board.setGem(2, 1, createGem(GemType.Diamond, { row: 2, col: 1 }));
      board.setGem(2, 2, createGem(GemType.Diamond, { row: 2, col: 2 }));
      board.setGem(3, 2, createGem(GemType.Diamond, { row: 3, col: 2 }));
      board.setGem(4, 2, createGem(GemType.Diamond, { row: 4, col: 2 }));

      const matches = matchFinder.findAllMatches(board);

      expect(matches.length).toBe(1);
      expect(matches[0].gems.length).toBe(5);
      expect(matches[0].isHorizontal).toBe(true);
      expect(matches[0].isVertical).toBe(true);
    });

    it('should merge T-shaped matches', () => {
      fillBoardNoMatches();
      // T-shape centered at (3,3)
      board.setGem(3, 2, createGem(GemType.Diamond, { row: 3, col: 2 }));
      board.setGem(3, 3, createGem(GemType.Diamond, { row: 3, col: 3 }));
      board.setGem(3, 4, createGem(GemType.Diamond, { row: 3, col: 4 }));
      board.setGem(2, 3, createGem(GemType.Diamond, { row: 2, col: 3 }));
      board.setGem(4, 3, createGem(GemType.Diamond, { row: 4, col: 3 }));

      const matches = matchFinder.findAllMatches(board);

      expect(matches.length).toBe(1);
      expect(matches[0].gems.length).toBe(5);
    });

    it('should return empty array when no matches', () => {
      fillBoardNoMatches();
      const matches = matchFinder.findAllMatches(board);
      expect(matches.length).toBe(0);
    });

    it('should not find matches of 2', () => {
      fillBoardNoMatches();
      // Use Diamond which is not in the pattern
      board.setGem(0, 0, createGem(GemType.Diamond, { row: 0, col: 0 }));
      board.setGem(0, 1, createGem(GemType.Diamond, { row: 0, col: 1 }));

      const matches = matchFinder.findAllMatches(board);
      expect(matches.length).toBe(0);
    });
  });

  describe('hasValidMoves', () => {
    it('should return true when valid horizontal swap exists', () => {
      fillBoardNoMatches();
      // Setup: swapping (0,1) and (0,2) will create match
      board.setGem(0, 0, createGem(GemType.Ruby, { row: 0, col: 0 }));
      board.setGem(0, 1, createGem(GemType.Sapphire, { row: 0, col: 1 }));
      board.setGem(0, 2, createGem(GemType.Ruby, { row: 0, col: 2 }));
      board.setGem(0, 3, createGem(GemType.Ruby, { row: 0, col: 3 }));

      expect(matchFinder.hasValidMoves(board)).toBe(true);
    });

    it('should return true when valid vertical swap exists', () => {
      fillBoardNoMatches();
      // Setup: swapping (1,0) and (2,0) will create vertical match
      board.setGem(0, 0, createGem(GemType.Emerald, { row: 0, col: 0 }));
      board.setGem(1, 0, createGem(GemType.Sapphire, { row: 1, col: 0 }));
      board.setGem(2, 0, createGem(GemType.Emerald, { row: 2, col: 0 }));
      board.setGem(3, 0, createGem(GemType.Emerald, { row: 3, col: 0 }));

      expect(matchFinder.hasValidMoves(board)).toBe(true);
    });

    it('should return false when no valid moves exist', () => {
      // Create a board with strictly alternating pattern
      for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
          const typeIndex = (row + col) % 7;
          const types = [
            GemType.Ruby,
            GemType.Sapphire,
            GemType.Emerald,
            GemType.Diamond,
            GemType.Amethyst,
            GemType.GoldBracelet,
            GemType.PearlEarring,
          ];
          board.setGem(row, col, createGem(types[typeIndex], { row, col }));
        }
      }

      expect(matchFinder.hasValidMoves(board)).toBe(false);
    });
  });

  describe('wouldCreateMatch', () => {
    it('should return true if swap creates match', () => {
      fillBoardNoMatches();
      // Use Diamond (not in pattern) - swapping col 2 and col 3 creates 3 Diamonds at 0,1,2
      board.setGem(0, 0, createGem(GemType.Diamond, { row: 0, col: 0 }));
      board.setGem(0, 1, createGem(GemType.Diamond, { row: 0, col: 1 }));
      board.setGem(0, 2, createGem(GemType.Amethyst, { row: 0, col: 2 }));
      board.setGem(0, 3, createGem(GemType.Diamond, { row: 0, col: 3 }));

      const result = matchFinder.wouldCreateMatch(
        board,
        { row: 0, col: 2 },
        { row: 0, col: 3 }
      );

      expect(result).toBe(true);
    });

    it('should return false if swap does not create match', () => {
      fillBoardNoMatches();

      const result = matchFinder.wouldCreateMatch(
        board,
        { row: 0, col: 0 },
        { row: 0, col: 1 }
      );

      expect(result).toBe(false);
    });

    it('should not modify original board', () => {
      fillBoardNoMatches();
      const gem00 = board.getGem(0, 0);
      const gem01 = board.getGem(0, 1);

      matchFinder.wouldCreateMatch(board, { row: 0, col: 0 }, { row: 0, col: 1 });

      expect(board.getGem(0, 0)).toBe(gem00);
      expect(board.getGem(0, 1)).toBe(gem01);
    });
  });

  describe('findMatchAt', () => {
    it('should find match containing specific position', () => {
      fillBoardNoMatches();
      // Use Diamond which is not in the pattern
      board.setGem(2, 3, createGem(GemType.Diamond, { row: 2, col: 3 }));
      board.setGem(2, 4, createGem(GemType.Diamond, { row: 2, col: 4 }));
      board.setGem(2, 5, createGem(GemType.Diamond, { row: 2, col: 5 }));

      const match = matchFinder.findMatchAt(board, { row: 2, col: 4 });

      expect(match).not.toBeNull();
      expect(match?.length).toBe(3);
    });

    it('should return null when no match at position', () => {
      fillBoardNoMatches();

      const match = matchFinder.findMatchAt(board, { row: 0, col: 0 });

      expect(match).toBeNull();
    });
  });
});
