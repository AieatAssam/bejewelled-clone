import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GameState, Scene } from '../../src/game/GameState';

describe('GameState', () => {
  let gameState: GameState;
  let mockScene: Scene;

  beforeEach(() => {
    gameState = new GameState();
    mockScene = {
      enter: vi.fn(),
      exit: vi.fn(),
      update: vi.fn(),
      render: vi.fn(),
    };
  });

  describe('registerScene', () => {
    it('should register a scene', () => {
      // Use 'play' since initial state is 'menu'
      gameState.registerScene('play', mockScene);
      gameState.setState('play');
      expect(mockScene.enter).toHaveBeenCalled();
    });
  });

  describe('setState', () => {
    it('should change state and call enter on new scene', () => {
      // Use 'select' since initial state is 'menu'
      gameState.registerScene('select', mockScene);
      gameState.setState('select');
      expect(mockScene.enter).toHaveBeenCalled();
    });

    it('should call exit on previous scene', () => {
      const oldScene: Scene = {
        enter: vi.fn(),
        exit: vi.fn(),
        update: vi.fn(),
        render: vi.fn(),
      };
      gameState.registerScene('menu', oldScene);
      gameState.registerScene('play', mockScene);

      gameState.setState('menu');
      gameState.setState('play');

      expect(oldScene.exit).toHaveBeenCalled();
      expect(mockScene.enter).toHaveBeenCalled();
    });

    it('should not change state if setting same state', () => {
      gameState.registerScene('menu', mockScene);
      gameState.setState('menu');

      mockScene.enter = vi.fn();
      mockScene.exit = vi.fn();

      gameState.setState('menu');

      expect(mockScene.enter).not.toHaveBeenCalled();
      expect(mockScene.exit).not.toHaveBeenCalled();
    });
  });

  describe('getState', () => {
    it('should return current state', () => {
      expect(gameState.getState()).toBe('menu');
      gameState.registerScene('play', mockScene);
      gameState.setState('play');
      expect(gameState.getState()).toBe('play');
    });
  });

  describe('update', () => {
    it('should call update on current scene', () => {
      gameState.registerScene('menu', mockScene);
      gameState.setState('menu');

      gameState.update(0.016);

      expect(mockScene.update).toHaveBeenCalledWith(0.016);
    });
  });

  describe('render', () => {
    it('should call render on current scene', () => {
      gameState.registerScene('menu', mockScene);
      gameState.setState('menu');

      gameState.render();

      expect(mockScene.render).toHaveBeenCalled();
    });
  });
});
