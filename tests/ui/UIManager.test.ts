/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock EventBus
vi.mock('../../src/utils/EventBus', () => ({
  eventBus: {
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
    clear: vi.fn(),
  },
}));

import { UIManager } from '../../src/ui/UIManager';

describe('UIManager', () => {
  let uiManager: UIManager;

  beforeEach(() => {
    // Create the ui-overlay element that UIManager expects
    document.body.innerHTML = '<div id="ui-overlay"></div>';
    uiManager = new UIManager();
  });

  describe('createButton', () => {
    it('should create a button with text and click handler', () => {
      const onClick = vi.fn();
      const button = uiManager.createButton('Click Me', onClick);

      expect(button.textContent).toBe('Click Me');
      expect(button.className).toBe('menu-button');

      button.click();
      expect(onClick).toHaveBeenCalled();
    });

    it('should accept custom className', () => {
      const button = uiManager.createButton('Test', vi.fn(), 'custom-class');
      expect(button.className).toBe('custom-class');
    });
  });

  describe('createTitle', () => {
    it('should create an h1 with text', () => {
      const title = uiManager.createTitle('My Title');
      expect(title.textContent).toBe('My Title');
      expect(title.className).toBe('menu-title');
      expect(title.tagName).toBe('H1');
    });

    it('should accept custom className', () => {
      const title = uiManager.createTitle('Test', 'custom');
      expect(title.className).toBe('custom');
    });
  });

  describe('createContainer', () => {
    it('should create a div with default class', () => {
      const container = uiManager.createContainer();
      expect(container.className).toBe('menu-container');
      expect(container.tagName).toBe('DIV');
    });

    it('should accept custom className', () => {
      const container = uiManager.createContainer('custom');
      expect(container.className).toBe('custom');
    });
  });

  describe('showElement / hideCurrentUI', () => {
    it('should append element to overlay', () => {
      const element = document.createElement('div');
      element.textContent = 'test';
      uiManager.showElement(element);

      const overlay = document.getElementById('ui-overlay')!;
      expect(overlay.contains(element)).toBe(true);
    });

    it('should remove previous UI when showing new element', () => {
      const el1 = document.createElement('div');
      const el2 = document.createElement('div');
      uiManager.showElement(el1);
      uiManager.showElement(el2);

      const overlay = document.getElementById('ui-overlay')!;
      expect(overlay.contains(el1)).toBe(false);
      expect(overlay.contains(el2)).toBe(true);
    });

    it('should remove current UI', () => {
      const element = document.createElement('div');
      uiManager.showElement(element);
      uiManager.hideCurrentUI();

      const overlay = document.getElementById('ui-overlay')!;
      expect(overlay.contains(element)).toBe(false);
    });

    it('should handle hideCurrentUI when nothing is shown', () => {
      expect(() => uiManager.hideCurrentUI()).not.toThrow();
    });
  });

  describe('clearOverlay', () => {
    it('should remove all children from overlay', () => {
      const overlay = document.getElementById('ui-overlay')!;
      overlay.appendChild(document.createElement('div'));
      overlay.appendChild(document.createElement('div'));
      uiManager.clearOverlay();
      expect(overlay.children.length).toBe(0);
    });
  });

  describe('getOverlay', () => {
    it('should return the overlay element', () => {
      const overlay = uiManager.getOverlay();
      expect(overlay.id).toBe('ui-overlay');
    });
  });

  describe('fadeIn', () => {
    it('should set opacity to 0 then transition to 1', () => {
      const element = document.createElement('div');
      uiManager.fadeIn(element);
      expect(element.style.opacity).toBe('0');
      expect(element.style.transition).toContain('opacity');
    });
  });

  describe('fadeOut', () => {
    it('should return a promise and set opacity to 0', async () => {
      vi.useFakeTimers();
      const element = document.createElement('div');
      const promise = uiManager.fadeOut(element, 100);
      expect(element.style.opacity).toBe('0');
      vi.advanceTimersByTime(100);
      await promise;
      vi.useRealTimers();
    });
  });
});
