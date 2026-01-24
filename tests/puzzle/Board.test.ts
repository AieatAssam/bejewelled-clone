import { describe, it, expect, beforeEach } from 'vitest';
import { Board, BOARD_SIZE } from '../../src/puzzle/Board';
import { GemType, createGem, resetGemIdCounter } from '../../src/puzzle/Gem';

describe('Board', () => {
  let board: Board;

  beforeEach(() => {
    board = new Board();
    resetGemIdCounter();
  });

  describe('initialization', () => {
    it('should create an 8x8 grid', () => {
      expect(BOARD_SIZE).toBe(8);
    });

    it('should start with empty grid', () => {
      expect(board.isEmpty()).toBe(true);
    });

    it('should initialize with gems when initialize() is called', () => {
      board.initialize();
      expect(board.isEmpty()).toBe(false);
      expect(board.getAllGems().length).toBe(64);
    });

    it('should initialize without any matches', () => {
      board.initialize();
      // Check no horizontal 3-in-a-row
      for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE - 2; col++) {
          const gem1 = board.getGem(row, col);
          const gem2 = board.getGem(row, col + 1);
          const gem3 = board.getGem(row, col + 2);
          if (gem1 && gem2 && gem3) {
            const allSame = gem1.type === gem2.type && gem2.type === gem3.type;
            expect(allSame).toBe(false);
          }
        }
      }
      // Check no vertical 3-in-a-row
      for (let col = 0; col < BOARD_SIZE; col++) {
        for (let row = 0; row < BOARD_SIZE - 2; row++) {
          const gem1 = board.getGem(row, col);
          const gem2 = board.getGem(row + 1, col);
          const gem3 = board.getGem(row + 2, col);
          if (gem1 && gem2 && gem3) {
            const allSame = gem1.type === gem2.type && gem2.type === gem3.type;
            expect(allSame).toBe(false);
          }
        }
      }
    });
  });

  describe('getGem and setGem', () => {
    it('should set and get a gem at valid position', () => {
      const gem = createGem(GemType.Ruby, { row: 3, col: 4 });
      board.setGem(3, 4, gem);
      expect(board.getGem(3, 4)).toBe(gem);
    });

    it('should return null for empty position', () => {
      expect(board.getGem(0, 0)).toBeNull();
    });

    it('should return null for invalid positions', () => {
      expect(board.getGem(-1, 0)).toBeNull();
      expect(board.getGem(0, -1)).toBeNull();
      expect(board.getGem(8, 0)).toBeNull();
      expect(board.getGem(0, 8)).toBeNull();
    });

    it('should update gem position when set', () => {
      const gem = createGem(GemType.Ruby, { row: 0, col: 0 });
      board.setGem(5, 6, gem);
      expect(gem.position.row).toBe(5);
      expect(gem.position.col).toBe(6);
    });
  });

  describe('removeGem', () => {
    it('should remove gem and return it', () => {
      const gem = createGem(GemType.Sapphire, { row: 2, col: 3 });
      board.setGem(2, 3, gem);
      const removed = board.removeGem(2, 3);
      expect(removed).toBe(gem);
      expect(board.getGem(2, 3)).toBeNull();
    });

    it('should return null when removing from empty position', () => {
      expect(board.removeGem(0, 0)).toBeNull();
    });
  });

  describe('isValidPosition', () => {
    it('should return true for valid positions', () => {
      expect(board.isValidPosition(0, 0)).toBe(true);
      expect(board.isValidPosition(7, 7)).toBe(true);
      expect(board.isValidPosition(3, 4)).toBe(true);
    });

    it('should return false for invalid positions', () => {
      expect(board.isValidPosition(-1, 0)).toBe(false);
      expect(board.isValidPosition(0, -1)).toBe(false);
      expect(board.isValidPosition(8, 0)).toBe(false);
      expect(board.isValidPosition(0, 8)).toBe(false);
    });
  });

  describe('areAdjacent', () => {
    it('should return true for horizontally adjacent positions', () => {
      expect(board.areAdjacent({ row: 3, col: 3 }, { row: 3, col: 4 })).toBe(true);
      expect(board.areAdjacent({ row: 3, col: 4 }, { row: 3, col: 3 })).toBe(true);
    });

    it('should return true for vertically adjacent positions', () => {
      expect(board.areAdjacent({ row: 3, col: 3 }, { row: 4, col: 3 })).toBe(true);
      expect(board.areAdjacent({ row: 4, col: 3 }, { row: 3, col: 3 })).toBe(true);
    });

    it('should return false for non-adjacent positions', () => {
      expect(board.areAdjacent({ row: 0, col: 0 }, { row: 0, col: 2 })).toBe(false);
      expect(board.areAdjacent({ row: 0, col: 0 }, { row: 2, col: 0 })).toBe(false);
      expect(board.areAdjacent({ row: 0, col: 0 }, { row: 1, col: 1 })).toBe(false);
    });
  });

  describe('swap', () => {
    it('should swap two gems', () => {
      const gem1 = createGem(GemType.Ruby, { row: 0, col: 0 });
      const gem2 = createGem(GemType.Sapphire, { row: 0, col: 1 });
      board.setGem(0, 0, gem1);
      board.setGem(0, 1, gem2);

      board.swap({ row: 0, col: 0 }, { row: 0, col: 1 });

      expect(board.getGem(0, 0)).toBe(gem2);
      expect(board.getGem(0, 1)).toBe(gem1);
      expect(gem1.position).toEqual({ row: 0, col: 1 });
      expect(gem2.position).toEqual({ row: 0, col: 0 });
    });

    it('should handle swapping with null position', () => {
      const gem = createGem(GemType.Ruby, { row: 0, col: 0 });
      board.setGem(0, 0, gem);

      board.swap({ row: 0, col: 0 }, { row: 0, col: 1 });

      expect(board.getGem(0, 0)).toBeNull();
      expect(board.getGem(0, 1)).toBe(gem);
    });
  });

  describe('clone', () => {
    it('should create an independent copy of the board', () => {
      board.initialize();
      const clone = board.clone();

      // Modify original
      board.removeGem(0, 0);

      // Clone should be unaffected
      expect(clone.getGem(0, 0)).not.toBeNull();
    });

    it('should copy gem properties correctly', () => {
      const gem = createGem(GemType.Diamond, { row: 3, col: 3 });
      gem.isSpecial = true;
      board.setGem(3, 3, gem);

      const clone = board.clone();
      const clonedGem = clone.getGem(3, 3);

      expect(clonedGem?.type).toBe(GemType.Diamond);
      expect(clonedGem?.isSpecial).toBe(true);
      expect(clonedGem).not.toBe(gem);
    });
  });

  describe('toArray and fromArray', () => {
    it('should convert board to array of types', () => {
      const gem = createGem(GemType.Emerald, { row: 2, col: 3 });
      board.setGem(2, 3, gem);

      const arr = board.toArray();
      expect(arr[2][3]).toBe(GemType.Emerald);
      expect(arr[0][0]).toBeNull();
    });

    it('should restore board from array', () => {
      const types: (GemType | null)[][] = Array(8).fill(null).map(() => Array(8).fill(null));
      types[1][2] = GemType.Amethyst;
      types[5][5] = GemType.GoldBracelet;

      board.fromArray(types);

      expect(board.getGem(1, 2)?.type).toBe(GemType.Amethyst);
      expect(board.getGem(5, 5)?.type).toBe(GemType.GoldBracelet);
      expect(board.getGem(0, 0)).toBeNull();
    });
  });

  describe('getRow and getColumn', () => {
    it('should get all gems in a row', () => {
      board.initialize();
      const row = board.getRow(3);
      expect(row.length).toBe(8);
      expect(row.every(g => g !== null)).toBe(true);
    });

    it('should get all gems in a column', () => {
      board.initialize();
      const col = board.getColumn(5);
      expect(col.length).toBe(8);
      expect(col.every(g => g !== null)).toBe(true);
    });
  });

  describe('clear', () => {
    it('should remove all gems', () => {
      board.initialize();
      expect(board.isEmpty()).toBe(false);

      board.clear();
      expect(board.isEmpty()).toBe(true);
    });
  });
});
