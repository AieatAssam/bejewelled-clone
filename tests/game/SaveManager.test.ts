import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SaveManager, SaveData } from '../../src/game/SaveManager';
import { GemType } from '../../src/puzzle/Gem';
import { Princess } from '../../src/characters/Princess';

// Mock js-cookie
vi.mock('js-cookie', () => ({
  default: {
    set: vi.fn(),
    get: vi.fn() as ReturnType<typeof vi.fn>,
    remove: vi.fn(),
  },
}));

import Cookies from 'js-cookie';

// Type helper for mocking
const mockCookiesGet = Cookies.get as ReturnType<typeof vi.fn>;

describe('SaveManager', () => {
  let saveManager: SaveManager;

  beforeEach(() => {
    saveManager = new SaveManager();
    vi.clearAllMocks();
  });

  describe('save', () => {
    it('should save data to cookie', () => {
      const saveData: SaveData = {
        princessId: 'aurora',
        score: 1000,
        boardState: [],
        collection: {},
        dragonCounter: 0,
        savedAt: new Date().toISOString(),
      };

      const result = saveManager.save(saveData);

      expect(result).toBe(true);
      expect(Cookies.set).toHaveBeenCalled();
    });
  });

  describe('load', () => {
    it('should load data from cookie', () => {
      const saveData: SaveData = {
        princessId: 'marina',
        score: 2000,
        boardState: [],
        collection: { ruby: 5 },
        dragonCounter: 1,
        savedAt: new Date().toISOString(),
      };

      mockCookiesGet.mockReturnValue(JSON.stringify(saveData));

      const result = saveManager.load();

      expect(result).toEqual(saveData);
    });

    it('should return null when no save exists', () => {
      mockCookiesGet.mockReturnValue(undefined);

      const result = saveManager.load();

      expect(result).toBeNull();
    });
  });

  describe('hasSave', () => {
    it('should return true when save exists', () => {
      mockCookiesGet.mockReturnValue('{}');
      expect(saveManager.hasSave()).toBe(true);
    });

    it('should return false when no save exists', () => {
      mockCookiesGet.mockReturnValue(undefined);
      expect(saveManager.hasSave()).toBe(false);
    });
  });

  describe('deleteSave', () => {
    it('should remove save cookie', () => {
      saveManager.deleteSave();
      expect(Cookies.remove).toHaveBeenCalled();
    });
  });

  describe('createSaveData', () => {
    it('should create save data object', () => {
      const princess: Princess = {
        id: 'aurora',
        name: 'Aurora',
        theme: 'Dawn',
        colors: { primary: 0xff69b4, secondary: 0xffc0cb, accent: 0xffd700 },
        description: 'Test princess',
        ability: { name: 'Radiant Cascade', description: '+1 bonus gem per cascade level', type: 'cascade_bonus', value: 1 },
        favoriteGem: 'diamond',
      };

      const collection = new Map<GemType, number>();
      collection.set(GemType.Ruby, 10);
      collection.set(GemType.Sapphire, 5);

      const boardState: (GemType | null)[][] = [[GemType.Ruby, null]];

      const result = saveManager.createSaveData(
        princess,
        1500,
        boardState,
        collection,
        2
      );

      expect(result.princessId).toBe('aurora');
      expect(result.score).toBe(1500);
      expect(result.boardState).toEqual(boardState);
      expect(result.collection).toEqual({ ruby: 10, sapphire: 5 });
      expect(result.dragonCounter).toBe(2);
      expect(result.savedAt).toBeDefined();
    });
  });

  describe('restoreCollection', () => {
    it('should restore collection map from save data', () => {
      const saveData: SaveData = {
        princessId: 'aurora',
        score: 1000,
        boardState: [],
        collection: { ruby: 10, emerald: 3 },
        dragonCounter: 0,
        savedAt: new Date().toISOString(),
      };

      const collection = saveManager.restoreCollection(saveData);

      expect(collection.get(GemType.Ruby)).toBe(10);
      expect(collection.get(GemType.Emerald)).toBe(3);
    });
  });
});
