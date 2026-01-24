export enum GemType {
  Ruby = 'ruby',
  Sapphire = 'sapphire',
  Emerald = 'emerald',
  Diamond = 'diamond',
  Amethyst = 'amethyst',
  GoldBracelet = 'gold_bracelet',
  PearlEarring = 'pearl_earring',
}

export const GEM_TYPES = Object.values(GemType);
export const GEM_COUNT = GEM_TYPES.length;

export interface GemColors {
  primary: number;
  secondary: number;
  glow: number;
}

export const GEM_COLORS: Record<GemType, GemColors> = {
  [GemType.Ruby]: { primary: 0xe31b23, secondary: 0xff6b6b, glow: 0xff0000 },
  [GemType.Sapphire]: { primary: 0x0f52ba, secondary: 0x6ba3ff, glow: 0x0066ff },
  [GemType.Emerald]: { primary: 0x50c878, secondary: 0x98fb98, glow: 0x00ff00 },
  [GemType.Diamond]: { primary: 0xffffff, secondary: 0xf0f8ff, glow: 0xffffff },
  [GemType.Amethyst]: { primary: 0x9966cc, secondary: 0xdda0dd, glow: 0x9900ff },
  [GemType.GoldBracelet]: { primary: 0xffd700, secondary: 0xffec8b, glow: 0xffaa00 },
  [GemType.PearlEarring]: { primary: 0xfdeef4, secondary: 0xfff5ee, glow: 0xffccdd },
};

export interface Position {
  row: number;
  col: number;
}

export interface Gem {
  id: string;
  type: GemType;
  position: Position;
  isSpecial: boolean;
  isSuper: boolean;
}

let gemIdCounter = 0;

export function createGem(type: GemType, position: Position): Gem {
  return {
    id: `gem_${gemIdCounter++}`,
    type,
    position: { ...position },
    isSpecial: false,
    isSuper: false,
  };
}

export function getRandomGemType(): GemType {
  const index = Math.floor(Math.random() * GEM_COUNT);
  return GEM_TYPES[index];
}

export function resetGemIdCounter(): void {
  gemIdCounter = 0;
}
