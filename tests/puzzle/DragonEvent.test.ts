import { describe, it, expect, beforeEach } from 'vitest';
import { DragonEvent } from '../../src/puzzle/DragonEvent';
import { GemType } from '../../src/puzzle/Gem';

describe('DragonEvent', () => {
  let dragonEvent: DragonEvent;

  beforeEach(() => {
    dragonEvent = new DragonEvent();
  });

  describe('collection management', () => {
    it('should start with empty collection', () => {
      expect(dragonEvent.getCollectionTotal()).toBe(0);
    });

    it('should add gems to collection', () => {
      dragonEvent.addToCollection(GemType.Ruby);
      dragonEvent.addToCollection(GemType.Ruby);
      dragonEvent.addToCollection(GemType.Sapphire);

      const collection = dragonEvent.getCollection();
      expect(collection.get(GemType.Ruby)).toBe(2);
      expect(collection.get(GemType.Sapphire)).toBe(1);
      expect(dragonEvent.getCollectionTotal()).toBe(3);
    });

    it('should add multiple gems at once', () => {
      dragonEvent.addToCollection(GemType.Emerald, 5);
      expect(dragonEvent.getCollection().get(GemType.Emerald)).toBe(5);
    });

    it('should reset collection', () => {
      dragonEvent.addToCollection(GemType.Ruby, 10);
      dragonEvent.resetCollection();
      expect(dragonEvent.getCollectionTotal()).toBe(0);
    });

    it('should set collection from map', () => {
      const newCollection = new Map<GemType, number>();
      newCollection.set(GemType.Diamond, 15);
      newCollection.set(GemType.Amethyst, 8);

      dragonEvent.setCollection(newCollection);

      expect(dragonEvent.getCollection().get(GemType.Diamond)).toBe(15);
      expect(dragonEvent.getCollection().get(GemType.Amethyst)).toBe(8);
      expect(dragonEvent.getCollectionTotal()).toBe(23);
    });
  });

  describe('stealFromCollection', () => {
    it('should return empty result when collection is empty', () => {
      const result = dragonEvent.stealFromCollection();
      expect(result.totalStolen).toBe(0);
      expect(result.stolenGems.size).toBe(0);
    });

    it('should steal between 2 and 9 gems (fixed range)', () => {
      // Add plenty of gems
      dragonEvent.addToCollection(GemType.Ruby, 50);
      dragonEvent.addToCollection(GemType.Sapphire, 50);

      // Run multiple times to test the range
      for (let i = 0; i < 20; i++) {
        dragonEvent.setCollection(new Map([[GemType.Ruby, 50], [GemType.Sapphire, 50]]));
        const result = dragonEvent.stealFromCollection();
        expect(result.totalStolen).toBeGreaterThanOrEqual(2);
        expect(result.totalStolen).toBeLessThanOrEqual(9);
      }
    });

    it('should not steal more than player has', () => {
      dragonEvent.addToCollection(GemType.Ruby, 1);
      const result = dragonEvent.stealFromCollection();
      expect(result.totalStolen).toBeLessThanOrEqual(1);
    });

    it('should apply flat resistance (Marina Ocean Shield)', () => {
      dragonEvent.addToCollection(GemType.Ruby, 50);

      // With 3 resistance, should steal at least 1 (2-3 = -1, clamped to 1 minimum)
      // Run multiple times
      for (let i = 0; i < 10; i++) {
        dragonEvent.setCollection(new Map([[GemType.Ruby, 50]]));
        const result = dragonEvent.stealFromCollection(3);
        // With resistance of 3, steal range becomes max(1, 2-3) to max(1, 9-3) = 1 to 6
        expect(result.totalStolen).toBeGreaterThanOrEqual(1);
        expect(result.totalStolen).toBeLessThanOrEqual(6);
      }
    });

    it('should always steal at least 1 gem even with high resistance', () => {
      dragonEvent.addToCollection(GemType.Ruby, 50);
      const result = dragonEvent.stealFromCollection(100); // Very high resistance
      expect(result.totalStolen).toBeGreaterThanOrEqual(1);
    });

    it('should track total stolen by dragon', () => {
      dragonEvent.addToCollection(GemType.Ruby, 50);
      const result1 = dragonEvent.stealFromCollection();

      dragonEvent.addToCollection(GemType.Sapphire, 50);
      const result2 = dragonEvent.stealFromCollection();

      expect(dragonEvent.getTotalStolenByDragon()).toBe(result1.totalStolen + result2.totalStolen);
    });

    it('should reset total stolen on resetCollection', () => {
      dragonEvent.addToCollection(GemType.Ruby, 50);
      dragonEvent.stealFromCollection();
      expect(dragonEvent.getTotalStolenByDragon()).toBeGreaterThan(0);

      dragonEvent.resetCollection();
      expect(dragonEvent.getTotalStolenByDragon()).toBe(0);
    });

    it('should actually reduce collection when stealing', () => {
      dragonEvent.addToCollection(GemType.Ruby, 20);
      const before = dragonEvent.getCollectionTotal();
      const result = dragonEvent.stealFromCollection();
      const after = dragonEvent.getCollectionTotal();

      expect(after).toBe(before - result.totalStolen);
    });
  });

  describe('payFairyDustCost', () => {
    it('should deduct gems from collection', () => {
      dragonEvent.addToCollection(GemType.Ruby, 10);
      dragonEvent.addToCollection(GemType.Sapphire, 10);

      dragonEvent.payFairyDustCost(5);

      expect(dragonEvent.getCollectionTotal()).toBe(15);
    });

    it('should distribute deduction across gem types', () => {
      dragonEvent.addToCollection(GemType.Ruby, 10);
      dragonEvent.addToCollection(GemType.Sapphire, 10);

      dragonEvent.payFairyDustCost(10);

      // Should have deducted from both types
      const collection = dragonEvent.getCollection();
      const ruby = collection.get(GemType.Ruby) || 0;
      const sapphire = collection.get(GemType.Sapphire) || 0;
      expect(ruby + sapphire).toBe(10);
    });

    it('should not go below zero', () => {
      dragonEvent.addToCollection(GemType.Ruby, 5);
      dragonEvent.payFairyDustCost(100);

      expect(dragonEvent.getCollectionTotal()).toBe(0);
    });
  });

  describe('serialization', () => {
    it('should serialize to JSON', () => {
      dragonEvent.addToCollection(GemType.Ruby, 5);
      dragonEvent.addToCollection(GemType.Emerald, 3);

      const json = dragonEvent.toJSON();

      expect(json[GemType.Ruby]).toBe(5);
      expect(json[GemType.Emerald]).toBe(3);
    });

    it('should deserialize from JSON', () => {
      const data = {
        [GemType.Diamond]: 10,
        [GemType.Amethyst]: 7,
      };

      dragonEvent.fromJSON(data);

      expect(dragonEvent.getCollection().get(GemType.Diamond)).toBe(10);
      expect(dragonEvent.getCollection().get(GemType.Amethyst)).toBe(7);
      expect(dragonEvent.getCollectionTotal()).toBe(17);
    });
  });
});
