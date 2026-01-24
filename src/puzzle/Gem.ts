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

// Deep, rich jewel colors
export const GEM_COLORS: Record<GemType, GemColors> = {
  [GemType.Ruby]: { primary: 0xcc0022, secondary: 0xff2244, glow: 0x880011 },
  [GemType.Sapphire]: { primary: 0x1133aa, secondary: 0x2255dd, glow: 0x0a1a66 },
  [GemType.Emerald]: { primary: 0x118844, secondary: 0x22bb66, glow: 0x084422 },
  [GemType.Diamond]: { primary: 0xaaeeff, secondary: 0xffffff, glow: 0x6699cc },
  [GemType.Amethyst]: { primary: 0x7722aa, secondary: 0x9944cc, glow: 0x441166 },
  [GemType.GoldBracelet]: { primary: 0xffaa00, secondary: 0xffcc44, glow: 0xcc8800 },
  [GemType.PearlEarring]: { primary: 0xfff0e8, secondary: 0xffffff, glow: 0xeeddcc },
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
