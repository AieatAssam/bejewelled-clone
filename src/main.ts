import { Game } from './game/Game';
import { audioManager } from './utils/AudioManager';

// Initialize audio manager (registers event listeners)
console.log('Audio manager initialized:', audioManager.isMuted() ? 'muted' : 'active');

const game = new Game();
game.start();
