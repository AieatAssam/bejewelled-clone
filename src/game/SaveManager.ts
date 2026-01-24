import Cookies from 'js-cookie';
import { GemType } from '../puzzle/Gem';
import { Princess } from '../characters/Princess';

export interface SaveData {
  princessId: string;
  score: number;
  boardState: (GemType | null)[][];
  collection: Record<string, number>;
  dragonCounter: number;
  savedAt: string;
}

const SAVE_COOKIE_NAME = 'princess_puzzle_save';
const COOKIE_EXPIRY_DAYS = 30;

export class SaveManager {
  save(data: SaveData): boolean {
    try {
      const jsonData = JSON.stringify(data);
      Cookies.set(SAVE_COOKIE_NAME, jsonData, { expires: COOKIE_EXPIRY_DAYS });
      return true;
    } catch (error) {
      console.error('Failed to save game:', error);
      return false;
    }
  }

  load(): SaveData | null {
    try {
      const jsonData = Cookies.get(SAVE_COOKIE_NAME);
      if (!jsonData) {
        return null;
      }
      return JSON.parse(jsonData) as SaveData;
    } catch (error) {
      console.error('Failed to load game:', error);
      return null;
    }
  }

  hasSave(): boolean {
    return Cookies.get(SAVE_COOKIE_NAME) !== undefined;
  }

  deleteSave(): void {
    Cookies.remove(SAVE_COOKIE_NAME);
  }

  createSaveData(
    princess: Princess,
    score: number,
    boardState: (GemType | null)[][],
    collection: Map<GemType, number>,
    dragonCounter: number
  ): SaveData {
    const collectionObj: Record<string, number> = {};
    collection.forEach((count, type) => {
      collectionObj[type] = count;
    });

    return {
      princessId: princess.id,
      score,
      boardState,
      collection: collectionObj,
      dragonCounter,
      savedAt: new Date().toISOString(),
    };
  }

  restoreCollection(data: SaveData): Map<GemType, number> {
    const collection = new Map<GemType, number>();
    for (const [type, count] of Object.entries(data.collection)) {
      collection.set(type as GemType, count);
    }
    return collection;
  }
}
