import { eventBus } from '../utils/EventBus';
import { Gem, GemType } from './Gem';

export interface DragonStealResult {
  stolenGems: Map<GemType, number>;
  totalStolen: number;
  percentageStolen: number;
}

export class DragonEvent {
  private collection: Map<GemType, number> = new Map();
  private totalStolenByDragon: number = 0;
  private static readonly STEAL_PERCENTAGE = 0.15; // 15% stolen
  private static readonly MIN_STEAL = 1;
  private static readonly MAX_STEAL = 5;

  constructor() {
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    eventBus.on('cascadeComplete', (result: { collectedGems: Gem[] }) => {
      for (const gem of result.collectedGems) {
        this.addToCollection(gem.type);
      }
    });
    // Note: Dragon stealing is now triggered by GameScene after animation completes
  }

  addToCollection(type: GemType, count: number = 1): void {
    const current = this.collection.get(type) || 0;
    this.collection.set(type, current + count);
  }

  getCollection(): Map<GemType, number> {
    return new Map(this.collection);
  }

  getCollectionTotal(): number {
    let total = 0;
    this.collection.forEach(count => {
      total += count;
    });
    return total;
  }

  stealFromCollection(resistanceFlat: number = 0): DragonStealResult {
    const stolenGems = new Map<GemType, number>();
    let totalStolen = 0;

    // Check if there's anything to steal
    const collectionTotal = this.getCollectionTotal();
    if (collectionTotal === 0) {
      return { stolenGems, totalStolen: 0, percentageStolen: 0 };
    }

    // Fixed random steal amount: 2-9 gems (not proportional to collection)
    let targetSteal = 2 + Math.floor(Math.random() * 8); // 2 to 9

    // Apply flat resistance (e.g., Marina's Ocean Shield: -3 gems stolen)
    if (resistanceFlat > 0) {
      targetSteal = Math.max(1, targetSteal - resistanceFlat);
    }

    // Can't steal more than player has
    targetSteal = Math.min(targetSteal, collectionTotal);

    // Steal from random gem types until we hit the target
    const types = Array.from(this.collection.keys()).filter(t => (this.collection.get(t) || 0) > 0);
    let remaining = targetSteal;

    while (remaining > 0 && types.length > 0) {
      const randomIndex = Math.floor(Math.random() * types.length);
      const type = types[randomIndex];
      const count = this.collection.get(type) || 0;

      if (count > 0) {
        const toSteal = Math.min(remaining, Math.ceil(count * 0.3), count);
        stolenGems.set(type, (stolenGems.get(type) || 0) + toSteal);
        this.collection.set(type, count - toSteal);
        totalStolen += toSteal;
        remaining -= toSteal;
      }

      // Remove type if empty
      if ((this.collection.get(type) || 0) === 0) {
        types.splice(randomIndex, 1);
      }
    }

    // Track total stolen over time
    this.totalStolenByDragon += totalStolen;

    const totalBefore = collectionTotal;
    const percentageStolen = totalBefore > 0 ? totalStolen / totalBefore : 0;

    return {
      stolenGems,
      totalStolen,
      percentageStolen,
    };
  }

  getTotalStolenByDragon(): number {
    return this.totalStolenByDragon;
  }

  payFairyDustCost(cost: number): void {
    // Deduct gems evenly from collection
    const types = Array.from(this.collection.keys()).filter(t => (this.collection.get(t) || 0) > 0);
    let remaining = cost;

    while (remaining > 0 && types.length > 0) {
      const perType = Math.ceil(remaining / types.length);
      for (let i = types.length - 1; i >= 0 && remaining > 0; i--) {
        const type = types[i];
        const count = this.collection.get(type) || 0;
        const toDeduct = Math.min(perType, count, remaining);
        this.collection.set(type, count - toDeduct);
        remaining -= toDeduct;
        if ((this.collection.get(type) || 0) === 0) {
          types.splice(i, 1);
        }
      }
    }
  }

  resetCollection(): void {
    this.collection.clear();
    this.totalStolenByDragon = 0; // Reset for new game
  }

  setCollection(collection: Map<GemType, number>): void {
    this.collection = new Map(collection);
  }

  toJSON(): Record<string, number> {
    const result: Record<string, number> = {};
    this.collection.forEach((count, type) => {
      result[type] = count;
    });
    return result;
  }

  fromJSON(data: Record<string, number>): void {
    this.collection.clear();
    for (const [type, count] of Object.entries(data)) {
      this.collection.set(type as GemType, count);
    }
  }
}
