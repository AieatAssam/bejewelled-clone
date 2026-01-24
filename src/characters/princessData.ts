import { Princess, createPrincess } from './Princess';

export const PRINCESSES: Princess[] = [
  createPrincess(
    'aurora',
    'Aurora',
    'Dawn',
    { primary: 0xff69b4, secondary: 0xffc0cb, accent: 0xffd700 },
    'The Princess of Dawn, she brings light and hope to the kingdom with her radiant smile.'
  ),
  createPrincess(
    'marina',
    'Marina',
    'Sea',
    { primary: 0x0077be, secondary: 0x87ceeb, accent: 0xc0c0c0 },
    'From the depths of the crystal ocean, Marina commands the tides and treasures of the sea.'
  ),
  createPrincess(
    'ivy',
    'Ivy',
    'Nature',
    { primary: 0x228b22, secondary: 0x90ee90, accent: 0x8b4513 },
    'Guardian of the enchanted forest, Ivy speaks the ancient language of trees and flowers.'
  ),
  createPrincess(
    'ember',
    'Ember',
    'Fire',
    { primary: 0xff4500, secondary: 0xffa500, accent: 0x8b0000 },
    'Born from volcanic flames, Ember\'s spirit burns bright with courage and determination.'
  ),
  createPrincess(
    'luna',
    'Luna',
    'Night',
    { primary: 0x9370db, secondary: 0xe6e6fa, accent: 0x191970 },
    'Mistress of the stars and moonlight, Luna weaves dreams from the fabric of night.'
  ),
  createPrincess(
    'crystal',
    'Crystal',
    'Ice',
    { primary: 0xb0e0e6, secondary: 0xf0ffff, accent: 0x00ced1 },
    'From the frozen north, Crystal\'s heart is warm despite her icy powers.'
  ),
];

export function getPrincessById(id: string): Princess | undefined {
  return PRINCESSES.find(p => p.id === id);
}

export function getDefaultPrincess(): Princess {
  return PRINCESSES[0];
}
