export interface PrincessColors {
  primary: number;
  secondary: number;
  accent: number;
}

export interface Princess {
  id: string;
  name: string;
  theme: string;
  colors: PrincessColors;
  description: string;
}

export function createPrincess(
  id: string,
  name: string,
  theme: string,
  colors: PrincessColors,
  description: string
): Princess {
  return {
    id,
    name,
    theme,
    colors,
    description,
  };
}
