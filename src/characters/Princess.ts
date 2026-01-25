export interface PrincessColors {
  primary: number;
  secondary: number;
  accent: number;
}

export interface PrincessAbility {
  name: string;
  description: string;
  type: 'cascade_bonus' | 'dragon_resist' | 'favorite_bonus' | 'star_explode' | 'streak_boost' | 'cost_discount';
  value: number; // Percentage or multiplier
}

export interface Princess {
  id: string;
  name: string;
  theme: string;
  colors: PrincessColors;
  description: string;
  ability: PrincessAbility;
  favoriteGem: string; // Bonus points for this gem type
}

export function createPrincess(
  id: string,
  name: string,
  theme: string,
  colors: PrincessColors,
  description: string,
  ability: PrincessAbility,
  favoriteGem: string
): Princess {
  return {
    id,
    name,
    theme,
    colors,
    description,
    ability,
    favoriteGem,
  };
}
