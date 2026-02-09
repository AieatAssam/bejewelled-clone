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

import { SelectScene } from '../../src/scenes/SelectScene';
import { UIManager } from '../../src/ui/UIManager';
import { PRINCESSES } from '../../src/characters/princessData';

function createMockRenderer() {
  return {
    render: vi.fn(),
    getScene: vi.fn(),
    getCamera: vi.fn(),
    dispose: vi.fn(),
  } as any;
}

describe('SelectScene', () => {
  let selectScene: SelectScene;
  let uiManager: UIManager;
  let mockRenderer: any;

  beforeEach(() => {
    document.body.innerHTML = '<div id="ui-overlay"></div>';
    emittedEvents.length = 0;
    vi.clearAllMocks();

    uiManager = new UIManager();
    mockRenderer = createMockRenderer();
    selectScene = new SelectScene(uiManager, mockRenderer);
  });

  afterEach(() => {
    selectScene.exit();
  });

  describe('enter', () => {
    it('should create the selection UI', () => {
      selectScene.enter();
      const overlay = document.getElementById('ui-overlay')!;
      expect(overlay.children.length).toBeGreaterThan(0);
    });

    it('should display the title', () => {
      selectScene.enter();
      const overlay = document.getElementById('ui-overlay')!;
      expect(overlay.textContent).toContain('Choose Your Princess');
    });

    it('should create a card for each princess', () => {
      selectScene.enter();
      const overlay = document.getElementById('ui-overlay')!;
      const cards = overlay.querySelectorAll('.princess-card');
      expect(cards.length).toBe(PRINCESSES.length);
    });

    it('should show princess names on cards', () => {
      selectScene.enter();
      const overlay = document.getElementById('ui-overlay')!;
      for (const princess of PRINCESSES) {
        expect(overlay.textContent).toContain(princess.name);
      }
    });

    it('should show princess themes', () => {
      selectScene.enter();
      const overlay = document.getElementById('ui-overlay')!;
      for (const princess of PRINCESSES) {
        expect(overlay.textContent).toContain(princess.theme);
      }
    });

    it('should show princess abilities', () => {
      selectScene.enter();
      const overlay = document.getElementById('ui-overlay')!;
      for (const princess of PRINCESSES) {
        expect(overlay.textContent).toContain(princess.ability.name);
      }
    });

    it('should show a Back button', () => {
      selectScene.enter();
      const overlay = document.getElementById('ui-overlay')!;
      const buttons = overlay.querySelectorAll('button');
      const backButton = Array.from(buttons).find(b => b.textContent === 'Back');
      expect(backButton).toBeDefined();
    });

    it('should include princess portraits with SVG', () => {
      selectScene.enter();
      const overlay = document.getElementById('ui-overlay')!;
      const svgs = overlay.querySelectorAll('svg');
      expect(svgs.length).toBe(PRINCESSES.length);
    });
  });

  describe('princess selection', () => {
    it('should emit princessSelected and changeState intro when card is clicked', () => {
      selectScene.enter();
      const overlay = document.getElementById('ui-overlay')!;
      const card = overlay.querySelector('.princess-card') as HTMLElement;
      card.click();

      expect(emittedEvents.some(e => e.event === 'princessSelected')).toBe(true);
      expect(emittedEvents.some(e => e.event === 'changeState' && e.args[0] === 'intro')).toBe(true);
    });

    it('should store the selected princess', () => {
      expect(selectScene.getSelectedPrincess()).toBeNull();

      selectScene.enter();
      const overlay = document.getElementById('ui-overlay')!;
      const card = overlay.querySelector('.princess-card') as HTMLElement;
      card.click();

      expect(selectScene.getSelectedPrincess()).not.toBeNull();
      expect(selectScene.getSelectedPrincess()!.name).toBe(PRINCESSES[0].name);
    });
  });

  describe('Back button', () => {
    it('should emit changeState menu when clicked', () => {
      selectScene.enter();
      const overlay = document.getElementById('ui-overlay')!;
      const backButton = Array.from(overlay.querySelectorAll('button')).find(b => b.textContent === 'Back')!;
      backButton.click();

      expect(emittedEvents.some(e => e.event === 'changeState' && e.args[0] === 'menu')).toBe(true);
    });
  });

  describe('card hover effects', () => {
    it('should apply transform on mouseenter', () => {
      selectScene.enter();
      const overlay = document.getElementById('ui-overlay')!;
      const card = overlay.querySelector('.princess-card') as HTMLElement;

      card.dispatchEvent(new MouseEvent('mouseenter'));
      expect(card.style.transform).toContain('scale(1.08)');
    });

    it('should reset transform on mouseleave', () => {
      selectScene.enter();
      const overlay = document.getElementById('ui-overlay')!;
      const card = overlay.querySelector('.princess-card') as HTMLElement;

      card.dispatchEvent(new MouseEvent('mouseenter'));
      card.dispatchEvent(new MouseEvent('mouseleave'));
      expect(card.style.transform).toBe('scale(1)');
    });
  });

  describe('getSelectedPrincess', () => {
    it('should return null when no princess is selected', () => {
      expect(selectScene.getSelectedPrincess()).toBeNull();
    });
  });

  describe('exit', () => {
    it('should clean up UI', () => {
      selectScene.enter();
      selectScene.exit();
      const overlay = document.getElementById('ui-overlay')!;
      expect(overlay.children.length).toBe(0);
    });

    it('should handle exit when not entered', () => {
      expect(() => selectScene.exit()).not.toThrow();
    });
  });

  describe('update', () => {
    it('should not throw', () => {
      expect(() => selectScene.update(0.016)).not.toThrow();
    });
  });

  describe('render', () => {
    it('should call renderer.render', () => {
      selectScene.render();
      expect(mockRenderer.render).toHaveBeenCalled();
    });
  });
});
