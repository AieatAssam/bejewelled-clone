/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// Mock EventBus
const emittedEvents: Array<{ event: string; args: unknown[] }> = [];
const mockListeners = new Map<string, Set<Function>>();
vi.mock('../../src/utils/EventBus', () => ({
  eventBus: {
    on: vi.fn((event: string, cb: Function) => {
      if (!mockListeners.has(event)) mockListeners.set(event, new Set());
      mockListeners.get(event)!.add(cb);
    }),
    off: vi.fn(),
    emit: vi.fn((event: string, ...args: unknown[]) => {
      emittedEvents.push({ event, args });
    }),
    clear: vi.fn(),
  },
}));

import { IntroScene } from '../../src/scenes/IntroScene';
import { UIManager } from '../../src/ui/UIManager';

function createMockRenderer() {
  return {
    render: vi.fn(),
    getScene: vi.fn(),
    getCamera: vi.fn(),
    dispose: vi.fn(),
  } as any;
}

describe('IntroScene', () => {
  let introScene: IntroScene;
  let uiManager: UIManager;
  let mockRenderer: any;

  beforeEach(() => {
    document.body.innerHTML = '<div id="ui-overlay"></div>';
    emittedEvents.length = 0;
    mockListeners.clear();
    vi.clearAllMocks();

    uiManager = new UIManager();
    mockRenderer = createMockRenderer();
    introScene = new IntroScene(uiManager, mockRenderer);
  });

  afterEach(() => {
    introScene.exit();
  });

  describe('enter', () => {
    it('should create the intro UI', () => {
      introScene.enter();
      const overlay = document.getElementById('ui-overlay')!;
      expect(overlay.querySelector('.intro-container')).not.toBeNull();
    });

    it('should show the first story text', () => {
      introScene.enter();
      const overlay = document.getElementById('ui-overlay')!;
      const introText = overlay.querySelector('.intro-text');
      expect(introText).not.toBeNull();
      expect(introText!.textContent).toContain('kingdom of sparkling jewels');
    });

    it('should show the continue prompt', () => {
      introScene.enter();
      const overlay = document.getElementById('ui-overlay')!;
      expect(overlay.textContent).toContain('Click to continue');
    });

    it('should show a skip button', () => {
      introScene.enter();
      const overlay = document.getElementById('ui-overlay')!;
      const skipButton = overlay.querySelector('.skip-button');
      expect(skipButton).not.toBeNull();
      expect(skipButton!.textContent).toBe('Skip');
    });
  });

  describe('story advancement', () => {
    it('should advance story on click', () => {
      introScene.enter();
      const overlay = document.getElementById('ui-overlay')!;
      const container = overlay.querySelector('.intro-container') as HTMLElement;
      container.click();

      const introText = overlay.querySelector('.intro-text');
      // Should show second story text (about the princess)
      expect(introText!.textContent).toContain('guarded the royal treasure');
    });

    it('should emit changeState play after all story texts', () => {
      introScene.enter();
      const overlay = document.getElementById('ui-overlay')!;
      const container = overlay.querySelector('.intro-container') as HTMLElement;

      // Click through all 6 story phases
      for (let i = 0; i < 6; i++) {
        container.click();
      }

      expect(emittedEvents.some(e => e.event === 'changeState' && e.args[0] === 'play')).toBe(true);
    });
  });

  describe('skip button', () => {
    it('should emit changeState play when skip is clicked', () => {
      introScene.enter();
      const overlay = document.getElementById('ui-overlay')!;
      const skipButton = overlay.querySelector('.skip-button') as HTMLElement;
      skipButton.click();

      expect(emittedEvents.some(e => e.event === 'changeState' && e.args[0] === 'play')).toBe(true);
    });
  });

  describe('keyboard controls', () => {
    it('should advance story on Enter key', () => {
      introScene.enter();
      const overlay = document.getElementById('ui-overlay')!;

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));

      const introText = overlay.querySelector('.intro-text');
      expect(introText!.textContent).toContain('guarded the royal treasure');
    });

    it('should advance story on Space key', () => {
      introScene.enter();
      const overlay = document.getElementById('ui-overlay')!;

      document.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }));

      const introText = overlay.querySelector('.intro-text');
      expect(introText!.textContent).toContain('guarded the royal treasure');
    });

    it('should emit changeState play on Escape key', () => {
      introScene.enter();
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

      expect(emittedEvents.some(e => e.event === 'changeState' && e.args[0] === 'play')).toBe(true);
    });
  });

  describe('princessSelected event', () => {
    it('should update princess name in story texts', () => {
      // Trigger princessSelected listener
      const cbs = mockListeners.get('princessSelected');
      if (cbs) {
        cbs.forEach(cb => cb({ name: 'Rosalind', id: 'rosalind', theme: 'Rose', colors: { primary: 0, secondary: 0, accent: 0 }, description: '', ability: { name: '', description: '', type: 'cascade_bonus', value: 0 }, favoriteGem: 'ruby' }));
      }

      introScene.enter();
      const overlay = document.getElementById('ui-overlay')!;
      const container = overlay.querySelector('.intro-container') as HTMLElement;
      container.click(); // Advance to second text which has {name}

      const introText = overlay.querySelector('.intro-text');
      expect(introText!.textContent).toContain('Rosalind');
    });
  });

  describe('exit', () => {
    it('should clean up the intro container', () => {
      introScene.enter();
      introScene.exit();
      const overlay = document.getElementById('ui-overlay')!;
      expect(overlay.querySelector('.intro-container')).toBeNull();
    });

    it('should handle exit when not entered', () => {
      expect(() => introScene.exit()).not.toThrow();
    });
  });

  describe('update', () => {
    it('should not throw', () => {
      expect(() => introScene.update(0.016)).not.toThrow();
    });
  });

  describe('render', () => {
    it('should call renderer.render', () => {
      introScene.render();
      expect(mockRenderer.render).toHaveBeenCalled();
    });
  });
});
