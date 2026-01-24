import { eventBus } from '../utils/EventBus';
import { Gem, GemType } from './Gem';

export interface DragonStealResult {
  stolenGems: Map<GemType, number>;
  totalStolen: number;
  percentageStolen: number;
}

export class DragonEvent {
  private collection: Map<GemType, number> = new Map();
  private static readonly STEAL_PERCENTAGE = 0.1;

  constructor() {
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    eventBus.on('cascadeComplete', (result: { collectedGems: Gem[] }) => {
      for (const gem of result.collectedGems) {
        this.addToCollection(gem.type);
      }
    });

    eventBus.on('dragonEvent', () => {
      const stealResult = this.stealFromCollection();
      eventBus.emit('dragonStole', stealResult);
    });
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

  stealFromCollection(): DragonStealResult {
    const stolenGems = new Map<GemType, number>();
    let totalStolen = 0;

    this.collection.forEach((count, type) => {
      const toSteal = Math.floor(count * DragonEvent.STEAL_PERCENTAGE);
      if (toSteal > 0) {
        stolenGems.set(type, toSteal);
        this.collection.set(type, count - toSteal);
        totalStolen += toSteal;
      }
    });

    const totalBefore = this.getCollectionTotal() + totalStolen;
    const percentageStolen = totalBefore > 0 ? totalStolen / totalBefore : 0;

    return {
      stolenGems,
      totalStolen,
      percentageStolen,
    };
  }

  resetCollection(): void {
    this.collection.clear();
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
