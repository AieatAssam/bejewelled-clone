import { Gem, GemType, Position, createGem, getRandomGemType } from './Gem';

export const BOARD_SIZE = 8;

export class Board {
  private grid: (Gem | null)[][];

  constructor() {
    this.grid = this.createEmptyGrid();
  }

  private createEmptyGrid(): (Gem | null)[][] {
    return Array(BOARD_SIZE)
      .fill(null)
      .map(() => Array(BOARD_SIZE).fill(null));
  }

  initialize(): void {
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        this.grid[row][col] = this.createNonMatchingGem(row, col);
      }
    }
  }

  private createNonMatchingGem(row: number, col: number): Gem {
    const excludeTypes: Set<GemType> = new Set();

    // Check horizontal matches (left 2)
    if (col >= 2) {
      const left1 = this.grid[row][col - 1];
      const left2 = this.grid[row][col - 2];
      if (left1 && left2 && left1.type === left2.type) {
        excludeTypes.add(left1.type);
      }
    }

    // Check vertical matches (up 2)
    if (row >= 2) {
      const up1 = this.grid[row - 1][col];
      const up2 = this.grid[row - 2][col];
      if (up1 && up2 && up1.type === up2.type) {
        excludeTypes.add(up1.type);
      }
    }

    let gemType: GemType;
    do {
      gemType = getRandomGemType();
    } while (excludeTypes.has(gemType));

    return createGem(gemType, { row, col });
  }

  getGem(row: number, col: number): Gem | null {
    if (!this.isValidPosition(row, col)) {
      return null;
    }
    return this.grid[row][col];
  }

  setGem(row: number, col: number, gem: Gem | null): void {
    if (!this.isValidPosition(row, col)) {
      return;
    }
    this.grid[row][col] = gem;
    if (gem) {
      gem.position = { row, col };
    }
  }

  removeGem(row: number, col: number): Gem | null {
    const gem = this.getGem(row, col);
    if (gem) {
      this.grid[row][col] = null;
    }
    return gem;
  }

  isValidPosition(row: number, col: number): boolean {
    return row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE;
  }

  areAdjacent(pos1: Position, pos2: Position): boolean {
    const rowDiff = Math.abs(pos1.row - pos2.row);
    const colDiff = Math.abs(pos1.col - pos2.col);
    return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
  }

  swap(pos1: Position, pos2: Position): void {
    const gem1 = this.getGem(pos1.row, pos1.col);
    const gem2 = this.getGem(pos2.row, pos2.col);

    if (gem1) {
      gem1.position = { ...pos2 };
    }
    if (gem2) {
      gem2.position = { ...pos1 };
    }

    this.grid[pos1.row][pos1.col] = gem2;
    this.grid[pos2.row][pos2.col] = gem1;
  }

  getAllGems(): Gem[] {
    const gems: Gem[] = [];
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        const gem = this.grid[row][col];
        if (gem) {
          gems.push(gem);
        }
      }
    }
    return gems;
  }

  getColumn(col: number): (Gem | null)[] {
    return this.grid.map(row => row[col]);
  }

  getRow(row: number): (Gem | null)[] {
    return [...this.grid[row]];
  }

  clone(): Board {
    const newBoard = new Board();
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        const gem = this.grid[row][col];
        if (gem) {
          newBoard.grid[row][col] = {
            ...gem,
            position: { ...gem.position },
          };
        }
      }
    }
    return newBoard;
  }

  toArray(): (GemType | null)[][] {
    return this.grid.map(row =>
      row.map(gem => (gem ? gem.type : null))
    );
  }

  fromArray(types: (GemType | null)[][]): void {
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        const type = types[row]?.[col];
        if (type) {
          this.grid[row][col] = createGem(type, { row, col });
        } else {
          this.grid[row][col] = null;
        }
      }
    }
  }

  isEmpty(): boolean {
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        if (this.grid[row][col] !== null) {
          return false;
        }
      }
    }
    return true;
  }

  clear(): void {
    this.grid = this.createEmptyGrid();
  }
}
