import { describe, it, expect, beforeEach } from 'vitest';
import {
  GemType,
  GEM_TYPES,
  GEM_COUNT,
  PowerupType,
  createGem,
  getRandomGemType,
  resetGemIdCounter,
} from '../../src/puzzle/Gem';

describe('Gem', () => {
  beforeEach(() => {
    resetGemIdCounter();
  });

  describe('GemType enum', () => {
    it('should have 7 gem types', () => {
      expect(GEM_COUNT).toBe(7);
    });

    it('should include all expected gem types', () => {
      expect(GEM_TYPES).toContain(GemType.Ruby);
      expect(GEM_TYPES).toContain(GemType.Sapphire);
      expect(GEM_TYPES).toContain(GemType.Emerald);
      expect(GEM_TYPES).toContain(GemType.Diamond);
      expect(GEM_TYPES).toContain(GemType.Amethyst);
      expect(GEM_TYPES).toContain(GemType.GoldBracelet);
      expect(GEM_TYPES).toContain(GemType.PearlEarring);
    });
  });

  describe('PowerupType enum', () => {
    it('should have None, Star, and Rainbow powerups', () => {
      expect(PowerupType.None).toBe('none');
      expect(PowerupType.Star).toBe('star');
      expect(PowerupType.Rainbow).toBe('rainbow');
    });
  });

  describe('createGem', () => {
    it('should create a basic gem without powerup', () => {
      const gem = createGem(GemType.Ruby, { row: 0, col: 0 });

      expect(gem.type).toBe(GemType.Ruby);
      expect(gem.position.row).toBe(0);
      expect(gem.position.col).toBe(0);
      expect(gem.powerup).toBe(PowerupType.None);
      expect(gem.isSpecial).toBe(false);
      expect(gem.isSuper).toBe(false);
    });

    it('should create a gem with Star powerup', () => {
      const gem = createGem(GemType.Sapphire, { row: 2, col: 3 }, PowerupType.Star);

      expect(gem.type).toBe(GemType.Sapphire);
      expect(gem.powerup).toBe(PowerupType.Star);
      expect(gem.isSpecial).toBe(true);
      expect(gem.isSuper).toBe(false);
    });

    it('should create a gem with Rainbow powerup', () => {
      const gem = createGem(GemType.Emerald, { row: 4, col: 5 }, PowerupType.Rainbow);

      expect(gem.type).toBe(GemType.Emerald);
      expect(gem.powerup).toBe(PowerupType.Rainbow);
      expect(gem.isSpecial).toBe(false);
      expect(gem.isSuper).toBe(true);
    });

    it('should generate unique IDs for each gem', () => {
      const gem1 = createGem(GemType.Ruby, { row: 0, col: 0 });
      const gem2 = createGem(GemType.Ruby, { row: 0, col: 1 });
      const gem3 = createGem(GemType.Ruby, { row: 0, col: 2 });

      expect(gem1.id).not.toBe(gem2.id);
      expect(gem2.id).not.toBe(gem3.id);
      expect(gem1.id).not.toBe(gem3.id);
    });

    it('should copy position to avoid reference issues', () => {
      const position = { row: 1, col: 2 };
      const gem = createGem(GemType.Diamond, position);

      position.row = 999;

      expect(gem.position.row).toBe(1);
    });
  });

  describe('getRandomGemType', () => {
    it('should return a valid gem type', () => {
      const type = getRandomGemType();
      expect(GEM_TYPES).toContain(type);
    });

    it('should return various types over many calls', () => {
      const typesFound = new Set<GemType>();

      for (let i = 0; i < 1000; i++) {
        typesFound.add(getRandomGemType());
      }

      // Should have found most gem types after 1000 tries
      expect(typesFound.size).toBeGreaterThanOrEqual(5);
    });
  });

  describe('resetGemIdCounter', () => {
    it('should reset the gem ID counter', () => {
      const gem1 = createGem(GemType.Ruby, { row: 0, col: 0 });
      expect(gem1.id).toBe('gem_0');

      const gem2 = createGem(GemType.Ruby, { row: 0, col: 0 });
      expect(gem2.id).toBe('gem_1');

      resetGemIdCounter();

      const gem3 = createGem(GemType.Ruby, { row: 0, col: 0 });
      expect(gem3.id).toBe('gem_0');
    });
  });
});

describe('Powerup mechanics', () => {
  beforeEach(() => {
    resetGemIdCounter();
  });

  describe('Star powerup (4-match)', () => {
    it('should be created from 4-match', () => {
      // Star gems are created from 4+ matches
      const starGem = createGem(GemType.Ruby, { row: 3, col: 3 }, PowerupType.Star);
      expect(starGem.powerup).toBe(PowerupType.Star);
      expect(starGem.isSpecial).toBe(true);
    });

    it('should retain the original gem type', () => {
      const starGem = createGem(GemType.Emerald, { row: 0, col: 0 }, PowerupType.Star);
      expect(starGem.type).toBe(GemType.Emerald);
    });
  });

  describe('Rainbow powerup (5-match)', () => {
    it('should be created from 5-match', () => {
      // Rainbow gems are created from 5+ matches
      const rainbowGem = createGem(GemType.Sapphire, { row: 4, col: 4 }, PowerupType.Rainbow);
      expect(rainbowGem.powerup).toBe(PowerupType.Rainbow);
      expect(rainbowGem.isSuper).toBe(true);
    });

    it('should retain the original gem type', () => {
      const rainbowGem = createGem(GemType.Amethyst, { row: 0, col: 0 }, PowerupType.Rainbow);
      expect(rainbowGem.type).toBe(GemType.Amethyst);
    });
  });

  describe('powerup flags', () => {
    it('should not have both isSpecial and isSuper on same gem', () => {
      const starGem = createGem(GemType.Ruby, { row: 0, col: 0 }, PowerupType.Star);
      expect(starGem.isSpecial).toBe(true);
      expect(starGem.isSuper).toBe(false);

      const rainbowGem = createGem(GemType.Ruby, { row: 0, col: 0 }, PowerupType.Rainbow);
      expect(rainbowGem.isSpecial).toBe(false);
      expect(rainbowGem.isSuper).toBe(true);
    });

    it('should have neither flag for normal gems', () => {
      const normalGem = createGem(GemType.Ruby, { row: 0, col: 0 }, PowerupType.None);
      expect(normalGem.isSpecial).toBe(false);
      expect(normalGem.isSuper).toBe(false);
    });
  });
});
