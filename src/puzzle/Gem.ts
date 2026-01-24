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

// Vibrant, candy-like colors that appeal to children
export const GEM_COLORS: Record<GemType, GemColors> = {
  [GemType.Ruby]: { primary: 0xff3366, secondary: 0xff6b9d, glow: 0xff1144 },
  [GemType.Sapphire]: { primary: 0x4488ff, secondary: 0x77aaff, glow: 0x2266ff },
  [GemType.Emerald]: { primary: 0x44dd88, secondary: 0x77ffaa, glow: 0x22cc66 },
  [GemType.Diamond]: { primary: 0xeeffff, secondary: 0xffffff, glow: 0xaaddff },
  [GemType.Amethyst]: { primary: 0xbb66ff, secondary: 0xdd99ff, glow: 0x9933ff },
  [GemType.GoldBracelet]: { primary: 0xffcc33, secondary: 0xffdd66, glow: 0xffaa00 },
  [GemType.PearlEarring]: { primary: 0xffeeff, secondary: 0xfff5ff, glow: 0xffbbdd },
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
