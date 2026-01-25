import { Princess, createPrincess } from './Princess';

export const PRINCESSES: Princess[] = [
  createPrincess(
    'aurora',
    'Aurora',
    'Dawn',
    { primary: 0xff69b4, secondary: 0xffc0cb, accent: 0xffd700 },
    'The Princess of Dawn brings light and hope with her radiant smile.',
    { name: 'Radiant Cascade', description: '+1 bonus gem per cascade level', type: 'cascade_bonus', value: 1 },
    'diamond'
  ),
  createPrincess(
    'marina',
    'Marina',
    'Sea',
    { primary: 0x0077be, secondary: 0x87ceeb, accent: 0xc0c0c0 },
    'From the crystal ocean, Marina commands the tides and sea treasures.',
    { name: 'Ocean Shield', description: 'Dragon steals 3 fewer gems', type: 'dragon_resist', value: 3 },
    'sapphire'
  ),
  createPrincess(
    'ivy',
    'Ivy',
    'Nature',
    { primary: 0x228b22, secondary: 0x90ee90, accent: 0x8b4513 },
    'Guardian of the enchanted forest who speaks to trees and flowers.',
    { name: 'Nature\'s Bounty', description: '+1 bonus Emerald per Emerald match', type: 'favorite_bonus', value: 1 },
    'emerald'
  ),
  createPrincess(
    'ember',
    'Ember',
    'Fire',
    { primary: 0xff4500, secondary: 0xffa500, accent: 0x8b0000 },
    'Born from volcanic flames, her spirit burns with courage.',
    { name: 'Inferno Star', description: 'Star gems explode in 3x3 area too', type: 'star_explode', value: 1 },
    'ruby'
  ),
  createPrincess(
    'luna',
    'Luna',
    'Night',
    { primary: 0x9370db, secondary: 0xe6e6fa, accent: 0x191970 },
    'Mistress of stars and moonlight who weaves dreams from night.',
    { name: 'Starlight Streak', description: 'Streaks count double', type: 'streak_boost', value: 2 },
    'amethyst'
  ),
  createPrincess(
    'crystal',
    'Crystal',
    'Ice',
    { primary: 0xb0e0e6, secondary: 0xf0ffff, accent: 0x00ced1 },
    'From the frozen north, her heart is warm despite icy powers.',
    { name: 'Frost Blessing', description: 'Hints & Fairy Dust cost 50% less', type: 'cost_discount', value: 50 },
    'pearl_earring'
  ),
];

export function getPrincessById(id: string): Princess | undefined {
  return PRINCESSES.find(p => p.id === id);
}

export function getDefaultPrincess(): Princess {
  return PRINCESSES[0];
}
