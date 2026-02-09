/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GemType } from '../../src/puzzle/Gem';

// Mock DragonEvent
const mockCollection = new Map<GemType, number>();
const mockDragonEvent = {
  getCollection: vi.fn(() => mockCollection),
  getCollectionTotal: vi.fn(() => 0),
  getTotalStolenByDragon: vi.fn(() => 0),
  checkDragonEvent: vi.fn(),
  addToCollection: vi.fn(),
};

import { PurseUI } from '../../src/ui/PurseUI';

describe('PurseUI', () => {
  let purseUI: PurseUI;

  beforeEach(() => {
    vi.clearAllMocks();
    mockCollection.clear();
    mockDragonEvent.getCollectionTotal.mockReturnValue(0);
    mockDragonEvent.getTotalStolenByDragon.mockReturnValue(0);
    purseUI = new PurseUI(mockDragonEvent as any);
  });

  describe('constructor', () => {
    it('should create a purse container element', () => {
      const element = purseUI.getElement();
      expect(element).toBeDefined();
      expect(element.className).toBe('purse-container');
    });
  });

  describe('getElement', () => {
    it('should return the container element', () => {
      const element = purseUI.getElement();
      expect(element.tagName).toBe('DIV');
    });

    it('should contain the title', () => {
      const element = purseUI.getElement();
      expect(element.textContent).toContain('Treasure Purse');
    });

    it('should contain special gems section', () => {
      const element = purseUI.getElement();
      expect(element.textContent).toContain('Special Gems');
      expect(element.textContent).toContain('Star Gem');
      expect(element.textContent).toContain('Rainbow Gem');
    });

    it('should contain streak explanation section', () => {
      const element = purseUI.getElement();
      expect(element.textContent).toContain('How Streaks Work');
      expect(element.textContent).toContain('Dragon Threat');
      expect(element.textContent).toContain('Calming the Dragon');
      expect(element.textContent).toContain('Streaks');
    });

    it('should contain dragon stolen display', () => {
      const element = purseUI.getElement();
      expect(element.textContent).toContain('Stolen by Dragon');
    });

    it('should contain total gems display', () => {
      const element = purseUI.getElement();
      expect(element.textContent).toContain('Total Gems');
    });

    it('should create item slots for each gem type', () => {
      const element = purseUI.getElement();
      const countElements = element.querySelectorAll('.purse-count');
      expect(countElements.length).toBe(Object.values(GemType).length);
    });
  });

  describe('update', () => {
    it('should update gem counts from collection', () => {
      mockCollection.set(GemType.Ruby, 15);
      mockCollection.set(GemType.Sapphire, 7);
      mockDragonEvent.getTotalStolenByDragon.mockReturnValue(3);

      purseUI.update();

      const element = purseUI.getElement();
      const rubyCount = element.querySelector('[data-gem-type="ruby"] ~ .purse-count, .purse-count[data-gem-type="ruby"]');
      // Check via the total
      expect(element.textContent).toContain('15');
      expect(element.textContent).toContain('3');
    });

    it('should update total gems element', () => {
      mockCollection.set(GemType.Ruby, 10);
      mockCollection.set(GemType.Diamond, 5);

      purseUI.update();

      const element = purseUI.getElement();
      // Total should be 15
      expect(element.textContent).toContain('15');
    });

    it('should update stolen count', () => {
      mockDragonEvent.getTotalStolenByDragon.mockReturnValue(42);

      purseUI.update();

      const element = purseUI.getElement();
      expect(element.textContent).toContain('42');
    });
  });

  describe('getTotal', () => {
    it('should return collection total from dragon event', () => {
      mockDragonEvent.getCollectionTotal.mockReturnValue(99);
      expect(purseUI.getTotal()).toBe(99);
    });
  });

  describe('show / hide', () => {
    it('should remove hidden class on show', () => {
      const element = purseUI.getElement();
      element.classList.add('hidden');
      purseUI.show();
      expect(element.classList.contains('hidden')).toBe(false);
    });

    it('should also call update on show', () => {
      mockDragonEvent.getTotalStolenByDragon.mockReturnValue(5);
      purseUI.show();
      expect(mockDragonEvent.getCollection).toHaveBeenCalled();
    });

    it('should add hidden class on hide', () => {
      purseUI.hide();
      expect(purseUI.getElement().classList.contains('hidden')).toBe(true);
    });
  });
});
