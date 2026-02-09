/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// Mock EventBus
const emittedEvents: Array<{ event: string; args: unknown[] }> = [];
vi.mock('../../src/utils/EventBus', () => ({
  eventBus: {
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn((event: string, ...args: unknown[]) => {
      emittedEvents.push({ event, args });
    }),
    clear: vi.fn(),
  },
}));

import { PauseScene } from '../../src/scenes/PauseScene';
import { UIManager } from '../../src/ui/UIManager';
import { DragonEvent } from '../../src/puzzle/DragonEvent';

// Create a mock Renderer3D
function createMockRenderer() {
  return {
    render: vi.fn(),
    getScene: vi.fn(),
    getCamera: vi.fn(),
    dispose: vi.fn(),
  } as any;
}

describe('PauseScene', () => {
  let pauseScene: PauseScene;
  let uiManager: UIManager;
  let dragonEvent: DragonEvent;
  let mockRenderer: any;

  beforeEach(() => {
    document.body.innerHTML = '<div id="ui-overlay"></div>';
    emittedEvents.length = 0;
    vi.clearAllMocks();

    uiManager = new UIManager();
    dragonEvent = new DragonEvent();
    mockRenderer = createMockRenderer();
    pauseScene = new PauseScene(uiManager, mockRenderer, dragonEvent);
  });

  afterEach(() => {
    pauseScene.exit();
  });

  describe('enter', () => {
    it('should create the pause menu UI', () => {
      pauseScene.enter();
      const overlay = document.getElementById('ui-overlay')!;
      expect(overlay.children.length).toBeGreaterThan(0);
    });

    it('should display the Paused title', () => {
      pauseScene.enter();
      const overlay = document.getElementById('ui-overlay')!;
      expect(overlay.textContent).toContain('Paused');
    });

    it('should show Resume, Save, and Menu buttons', () => {
      pauseScene.enter();
      const overlay = document.getElementById('ui-overlay')!;
      const buttons = overlay.querySelectorAll('button');
      const buttonTexts = Array.from(buttons).map(b => b.textContent);
      expect(buttonTexts).toContain('Resume');
      expect(buttonTexts).toContain('Save');
      expect(buttonTexts).toContain('Menu');
    });

    it('should include the purse UI', () => {
      pauseScene.enter();
      const overlay = document.getElementById('ui-overlay')!;
      expect(overlay.textContent).toContain('Treasure Purse');
    });
  });

  describe('Resume button', () => {
    it('should emit changeState play when clicked', () => {
      pauseScene.enter();
      const overlay = document.getElementById('ui-overlay')!;
      const buttons = overlay.querySelectorAll('button');
      const resumeButton = Array.from(buttons).find(b => b.textContent === 'Resume')!;
      resumeButton.click();
      expect(emittedEvents.some(e => e.event === 'changeState' && e.args[0] === 'play')).toBe(true);
    });
  });

  describe('Save button', () => {
    it('should emit saveGame when clicked', () => {
      pauseScene.enter();
      const overlay = document.getElementById('ui-overlay')!;
      const buttons = overlay.querySelectorAll('button');
      const saveButton = Array.from(buttons).find(b => b.textContent === 'Save')!;
      saveButton.click();
      expect(emittedEvents.some(e => e.event === 'saveGame')).toBe(true);
    });

    it('should show save confirmation as fixed overlay on document.body', () => {
      pauseScene.enter();
      const overlay = document.getElementById('ui-overlay')!;
      const buttons = overlay.querySelectorAll('button');
      const saveButton = Array.from(buttons).find(b => b.textContent === 'Save')!;
      saveButton.click();

      // Confirmation should be a direct child of document.body, not inside the pause container
      const bodyChildren = Array.from(document.body.children);
      const savedMsg = bodyChildren.find(el => el.textContent === 'Game Saved!');
      expect(savedMsg).toBeDefined();
      // Verify it's NOT inside the overlay/pause container
      expect(overlay.contains(savedMsg!)).toBe(false);
    });

    it('should remove save confirmation after timeout', () => {
      vi.useFakeTimers();
      pauseScene.enter();
      const overlay = document.getElementById('ui-overlay')!;
      const buttons = overlay.querySelectorAll('button');
      const saveButton = Array.from(buttons).find(b => b.textContent === 'Save')!;
      saveButton.click();

      // After 1200ms, opacity should start fading
      vi.advanceTimersByTime(1200);
      const savedMsg = Array.from(document.body.querySelectorAll('div')).find(d => d.textContent === 'Game Saved!');
      if (savedMsg) {
        expect(savedMsg.style.opacity).toBe('0');
      }

      // After 1800ms, element should be removed
      vi.advanceTimersByTime(600);
      const remaining = Array.from(document.body.querySelectorAll('div')).find(d => d.textContent === 'Game Saved!');
      expect(remaining).toBeUndefined();
      vi.useRealTimers();
    });
  });

  describe('Menu button - exit confirmation', () => {
    it('should show confirmation dialog instead of immediately exiting', () => {
      pauseScene.enter();
      const overlay = document.getElementById('ui-overlay')!;
      const buttons = overlay.querySelectorAll('button');
      const menuButton = Array.from(buttons).find(b => b.textContent === 'Menu')!;
      menuButton.click();

      // Should NOT have emitted changeState to menu
      expect(emittedEvents.some(e => e.event === 'changeState' && e.args[0] === 'menu')).toBe(false);

      // Should show confirmation text
      expect(overlay.textContent).toContain('Return to Main Menu?');
      expect(overlay.textContent).toContain('Unsaved progress will be lost.');
    });

    it('should show Yes, Exit and Cancel buttons in confirmation', () => {
      pauseScene.enter();
      const overlay = document.getElementById('ui-overlay')!;
      const menuButton = Array.from(overlay.querySelectorAll('button')).find(b => b.textContent === 'Menu')!;
      menuButton.click();

      const confirmButtons = overlay.querySelectorAll('button');
      const buttonTexts = Array.from(confirmButtons).map(b => b.textContent);
      expect(buttonTexts).toContain('Yes, Exit');
      expect(buttonTexts).toContain('Cancel');
    });

    it('should emit changeState menu when Yes, Exit is clicked', () => {
      pauseScene.enter();
      const overlay = document.getElementById('ui-overlay')!;
      const menuButton = Array.from(overlay.querySelectorAll('button')).find(b => b.textContent === 'Menu')!;
      menuButton.click();

      const exitButton = Array.from(overlay.querySelectorAll('button')).find(b => b.textContent === 'Yes, Exit')!;
      exitButton.click();

      expect(emittedEvents.some(e => e.event === 'changeState' && e.args[0] === 'menu')).toBe(true);
    });

    it('should restore pause menu when Cancel is clicked', () => {
      pauseScene.enter();
      const overlay = document.getElementById('ui-overlay')!;
      const menuButton = Array.from(overlay.querySelectorAll('button')).find(b => b.textContent === 'Menu')!;
      menuButton.click();

      const cancelButton = Array.from(overlay.querySelectorAll('button')).find(b => b.textContent === 'Cancel')!;
      cancelButton.click();

      // Should be back to the normal pause menu
      expect(overlay.textContent).toContain('Paused');
      expect(overlay.textContent).toContain('Resume');
      expect(overlay.textContent).toContain('Save');
      expect(overlay.textContent).toContain('Menu');
    });
  });

  describe('exit', () => {
    it('should clean up UI', () => {
      pauseScene.enter();
      pauseScene.exit();
      const overlay = document.getElementById('ui-overlay')!;
      expect(overlay.children.length).toBe(0);
    });

    it('should handle exit when not entered', () => {
      expect(() => pauseScene.exit()).not.toThrow();
    });
  });

  describe('update', () => {
    it('should not throw', () => {
      expect(() => pauseScene.update(0.016)).not.toThrow();
    });
  });

  describe('render', () => {
    it('should call renderer.render', () => {
      pauseScene.render();
      expect(mockRenderer.render).toHaveBeenCalled();
    });
  });

  describe('updateDragonEvent', () => {
    it('should update dragon event and recreate purse UI', () => {
      const newDragonEvent = new DragonEvent();
      pauseScene.updateDragonEvent(newDragonEvent);
      // Enter to verify new purse UI is used
      pauseScene.enter();
      const overlay = document.getElementById('ui-overlay')!;
      expect(overlay.textContent).toContain('Treasure Purse');
    });
  });
});
