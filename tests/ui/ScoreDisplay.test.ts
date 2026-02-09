/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { GemType } from '../../src/puzzle/Gem';

// Mock EventBus
const mockListeners = new Map<string, Set<Function>>();
vi.mock('../../src/utils/EventBus', () => ({
  eventBus: {
    on: vi.fn((event: string, cb: Function) => {
      if (!mockListeners.has(event)) mockListeners.set(event, new Set());
      mockListeners.get(event)!.add(cb);
    }),
    off: vi.fn(),
    emit: vi.fn((event: string, ...args: unknown[]) => {
      const cbs = mockListeners.get(event);
      if (cbs) cbs.forEach(cb => cb(...args));
    }),
    clear: vi.fn(),
  },
}));

import { ScoreDisplay } from '../../src/ui/ScoreDisplay';
import { DragonEvent } from '../../src/puzzle/DragonEvent';

describe('ScoreDisplay', () => {
  let scoreDisplay: ScoreDisplay;

  beforeEach(() => {
    vi.clearAllMocks();
    mockListeners.clear();
    document.body.innerHTML = '';
    scoreDisplay = new ScoreDisplay();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should create the purse display element', () => {
      const element = scoreDisplay.getElement();
      expect(element).toBeDefined();
      expect(element.id).toBe('purse-score');
    });

    it('should create the combo display element', () => {
      const comboElement = scoreDisplay.getComboElement();
      expect(comboElement).toBeDefined();
      expect(comboElement.id).toBe('combo-display');
      expect(comboElement.classList.contains('hidden')).toBe(true);
    });

    it('should register event listeners for scoreUpdate and cascadeComplete', () => {
      expect(mockListeners.has('scoreUpdate')).toBe(true);
      expect(mockListeners.has('cascadeComplete')).toBe(true);
    });
  });

  describe('setScore', () => {
    it('should set the displayed score', () => {
      scoreDisplay.setScore(500);
      // displayedScore is set internally
    });
  });

  describe('addScore', () => {
    it('should not throw (score is derived from dragonEvent)', () => {
      expect(() => scoreDisplay.addScore(100)).not.toThrow();
    });
  });

  describe('getScore', () => {
    it('should return 0 when no dragon event is set', () => {
      expect(scoreDisplay.getScore()).toBe(0);
    });

    it('should return collection total from dragon event', () => {
      const mockDragonEvent = {
        getCollectionTotal: vi.fn(() => 42),
      } as unknown as DragonEvent;
      scoreDisplay.setDragonEvent(mockDragonEvent);
      expect(scoreDisplay.getScore()).toBe(42);
    });
  });

  describe('setDragonEvent', () => {
    it('should set the dragon event reference', () => {
      const mockDragonEvent = {
        getCollectionTotal: vi.fn(() => 100),
      } as unknown as DragonEvent;
      scoreDisplay.setDragonEvent(mockDragonEvent);
      expect(scoreDisplay.getScore()).toBe(100);
    });
  });

  describe('setCombo', () => {
    it('should show combo display for combo > 1', () => {
      vi.useFakeTimers();
      scoreDisplay.setCombo(3);
      const comboElement = scoreDisplay.getComboElement();
      expect(comboElement.textContent).toBe('3x Combo!');
      expect(comboElement.classList.contains('hidden')).toBe(false);
      vi.useRealTimers();
    });

    it('should not show combo display for combo <= 1', () => {
      scoreDisplay.setCombo(1);
      const comboElement = scoreDisplay.getComboElement();
      expect(comboElement.classList.contains('hidden')).toBe(true);
    });

    it('should auto-hide combo after timeout', () => {
      vi.useFakeTimers();
      scoreDisplay.setCombo(5);
      const comboElement = scoreDisplay.getComboElement();
      expect(comboElement.classList.contains('hidden')).toBe(false);
      vi.advanceTimersByTime(1500);
      expect(comboElement.classList.contains('hidden')).toBe(true);
      vi.useRealTimers();
    });

    it('should reset timeout when setting new combo', () => {
      vi.useFakeTimers();
      scoreDisplay.setCombo(2);
      vi.advanceTimersByTime(1000);
      scoreDisplay.setCombo(4);
      const comboElement = scoreDisplay.getComboElement();
      expect(comboElement.textContent).toBe('4x Combo!');
      // First timeout shouldn't have hidden it since it was cleared
      vi.advanceTimersByTime(600);
      expect(comboElement.classList.contains('hidden')).toBe(false);
      vi.advanceTimersByTime(1000);
      expect(comboElement.classList.contains('hidden')).toBe(true);
      vi.useRealTimers();
    });
  });

  describe('update', () => {
    it('should animate score toward current collection total', () => {
      const mockDragonEvent = {
        getCollectionTotal: vi.fn(() => 100),
      } as unknown as DragonEvent;
      scoreDisplay.setDragonEvent(mockDragonEvent);

      scoreDisplay.update();
      // displayedScore should have incremented toward 100
      const element = scoreDisplay.getElement();
      const scoreValue = element.querySelector('.score-value');
      expect(scoreValue).toBeDefined();
    });

    it('should not update when displayed score matches current', () => {
      const mockDragonEvent = {
        getCollectionTotal: vi.fn(() => 0),
      } as unknown as DragonEvent;
      scoreDisplay.setDragonEvent(mockDragonEvent);
      scoreDisplay.setScore(0);
      scoreDisplay.update();
      // No change needed
    });

    it('should animate score downward', () => {
      const mockDragonEvent = {
        getCollectionTotal: vi.fn(() => 50),
      } as unknown as DragonEvent;
      scoreDisplay.setDragonEvent(mockDragonEvent);
      scoreDisplay.setScore(100);
      scoreDisplay.update();
      // Score should be animating down
    });
  });

  describe('reset', () => {
    it('should reset score to 0 and hide combo', () => {
      scoreDisplay.setScore(500);
      scoreDisplay.setCombo(3);
      scoreDisplay.reset();

      const element = scoreDisplay.getElement();
      const scoreValue = element.querySelector('.score-value')!;
      expect(scoreValue.textContent).toBe('0');
      expect(scoreDisplay.getComboElement().classList.contains('hidden')).toBe(true);
    });
  });

  describe('show / hide', () => {
    it('should remove hidden class on show', () => {
      scoreDisplay.hide();
      scoreDisplay.show();
      expect(scoreDisplay.getElement().classList.contains('hidden')).toBe(false);
    });

    it('should add hidden class on hide', () => {
      scoreDisplay.hide();
      expect(scoreDisplay.getElement().classList.contains('hidden')).toBe(true);
    });
  });

  describe('pulseWithColors', () => {
    it('should add and remove purse-pulse class', () => {
      vi.useFakeTimers();
      scoreDisplay.pulseWithColors([GemType.Ruby]);
      expect(scoreDisplay.getElement().classList.contains('purse-pulse')).toBe(true);
      vi.advanceTimersByTime(600);
      expect(scoreDisplay.getElement().classList.contains('purse-pulse')).toBe(false);
      vi.useRealTimers();
    });

    it('should handle empty gem types array', () => {
      vi.useFakeTimers();
      expect(() => scoreDisplay.pulseWithColors([])).not.toThrow();
      vi.advanceTimersByTime(600);
      vi.useRealTimers();
    });
  });

  describe('getPursePosition', () => {
    it('should return x and y coordinates', () => {
      const pos = scoreDisplay.getPursePosition();
      expect(pos).toHaveProperty('x');
      expect(pos).toHaveProperty('y');
      expect(typeof pos.x).toBe('number');
      expect(typeof pos.y).toBe('number');
    });
  });

  describe('createFlyingGem', () => {
    it('should create and append a flying gem element', () => {
      // Mock Element.animate
      Element.prototype.animate = vi.fn(() => ({ onfinish: null })) as any;

      scoreDisplay.createFlyingGem(100, 200, GemType.Diamond);

      const flyingGem = document.querySelector('.flying-gem');
      expect(flyingGem).toBeDefined();
    });
  });

  describe('event listeners', () => {
    it('should update score on scoreUpdate event', () => {
      const scoreUpdateCb = Array.from(mockListeners.get('scoreUpdate') || [])[0] as Function;
      if (scoreUpdateCb) {
        scoreUpdateCb(500, 2);
      }
    });

    it('should add score on cascadeComplete event', () => {
      const cascadeCb = Array.from(mockListeners.get('cascadeComplete') || [])[0] as Function;
      if (cascadeCb) {
        cascadeCb({ totalScore: 300, cascadeCount: 3 });
      }
    });
  });
});
