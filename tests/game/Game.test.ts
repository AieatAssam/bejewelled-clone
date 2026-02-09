/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// Mock EventBus
const registeredListeners = new Map<string, Function[]>();
vi.mock('../../src/utils/EventBus', () => ({
  eventBus: {
    on: vi.fn((event: string, cb: Function) => {
      if (!registeredListeners.has(event)) registeredListeners.set(event, []);
      registeredListeners.get(event)!.push(cb);
    }),
    off: vi.fn(),
    emit: vi.fn((event: string, ...args: unknown[]) => {
      const cbs = registeredListeners.get(event);
      if (cbs) cbs.forEach(cb => cb(...args));
    }),
    clear: vi.fn(),
  },
}));

// Mock js-cookie
vi.mock('js-cookie', () => ({
  default: {
    set: vi.fn(),
    get: vi.fn(() => undefined),
    remove: vi.fn(),
  },
}));

// Create mock scene factories
const createMockScene = () => ({
  enter: vi.fn(),
  exit: vi.fn(),
  update: vi.fn(),
  render: vi.fn(),
});

const mockGameScene = {
  ...createMockScene(),
  resetGame: vi.fn(),
  getDragonEvent: vi.fn(() => ({ getCollection: vi.fn(() => new Map()), getCollectionTotal: vi.fn(() => 0), getTotalStolenByDragon: vi.fn(() => 0) })),
  getBoard: vi.fn(() => ({ toArray: vi.fn(() => []) })),
  getScore: vi.fn(() => 0),
  getController: vi.fn(() => ({ getConsecutiveSmallChains: vi.fn(() => 0) })),
  restoreState: vi.fn(),
};

const mockSelectScene = {
  ...createMockScene(),
  getSelectedPrincess: vi.fn(() => null),
};

const mockPauseScene = {
  ...createMockScene(),
  updateDragonEvent: vi.fn(),
};

// Mock all scene modules
vi.mock('../../src/scenes/MenuScene', () => ({
  MenuScene: vi.fn(() => createMockScene()),
}));

vi.mock('../../src/scenes/SelectScene', () => ({
  SelectScene: vi.fn(() => mockSelectScene),
}));

vi.mock('../../src/scenes/IntroScene', () => ({
  IntroScene: vi.fn(() => createMockScene()),
}));

vi.mock('../../src/scenes/GameScene', () => ({
  GameScene: vi.fn(() => mockGameScene),
}));

vi.mock('../../src/scenes/PauseScene', () => ({
  PauseScene: vi.fn(() => mockPauseScene),
}));

// Mock Renderer3D
vi.mock('../../src/renderer/Renderer3D', () => ({
  Renderer3D: vi.fn(() => ({
    render: vi.fn(),
    getScene: vi.fn(() => ({ add: vi.fn(), remove: vi.fn() })),
    getCamera: vi.fn(),
    dispose: vi.fn(),
    add: vi.fn(),
  })),
}));

import { Game } from '../../src/game/Game';
import { eventBus } from '../../src/utils/EventBus';

describe('Game', () => {
  let game: Game;

  beforeEach(() => {
    document.body.innerHTML = `
      <canvas id="game-canvas"></canvas>
      <div id="ui-overlay"></div>
    `;
    registeredListeners.clear();
    vi.clearAllMocks();

    vi.spyOn(globalThis, 'requestAnimationFrame').mockImplementation(() => 1);
    vi.spyOn(globalThis, 'cancelAnimationFrame').mockImplementation(() => {});
    vi.spyOn(performance, 'now').mockReturnValue(1000);

    game = new Game();
  });

  afterEach(() => {
    game.stop();
    vi.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should create a game instance', () => {
      expect(game).toBeDefined();
    });

    it('should register event listeners for changeState, saveGame, loadGame', () => {
      expect(eventBus.on).toHaveBeenCalledWith('changeState', expect.any(Function));
      expect(eventBus.on).toHaveBeenCalledWith('saveGame', expect.any(Function));
      expect(eventBus.on).toHaveBeenCalledWith('loadGame', expect.any(Function));
    });
  });

  describe('start', () => {
    it('should start the game loop', () => {
      game.start();
      expect(requestAnimationFrame).toHaveBeenCalled();
    });
  });

  describe('stop', () => {
    it('should stop the game loop', () => {
      game.start();
      game.stop();
      expect(cancelAnimationFrame).toHaveBeenCalled();
    });

    it('should handle stop when not started', () => {
      expect(() => game.stop()).not.toThrow();
    });
  });

  describe('changeState event', () => {
    it('should reset game when changing to menu', () => {
      game.start();
      // Trigger changeState to menu
      const changeStateCbs = registeredListeners.get('changeState') || [];
      for (const cb of changeStateCbs) {
        try { cb('menu'); } catch { /* scene mocks may not have full setup */ }
      }
      expect(mockGameScene.resetGame).toHaveBeenCalled();
    });

    it('should update pause scene dragon event when pausing', () => {
      game.start();
      const changeStateCbs = registeredListeners.get('changeState') || [];
      for (const cb of changeStateCbs) {
        try { cb('pause'); } catch {}
      }
      expect(mockPauseScene.updateDragonEvent).toHaveBeenCalled();
    });
  });

  describe('saveGame event', () => {
    it('should not throw when no princess is selected', () => {
      mockSelectScene.getSelectedPrincess.mockReturnValue(null);
      const saveCbs = registeredListeners.get('saveGame') || [];
      for (const cb of saveCbs) {
        expect(() => cb()).not.toThrow();
      }
    });
  });

  describe('loadGame event', () => {
    it('should not throw when no save exists', () => {
      const loadCbs = registeredListeners.get('loadGame') || [];
      for (const cb of loadCbs) {
        expect(() => cb()).not.toThrow();
      }
    });
  });

  describe('Escape key handler', () => {
    it('should register a keydown listener on window', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
      const newGame = new Game();
      expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
      newGame.stop();
    });
  });
});
