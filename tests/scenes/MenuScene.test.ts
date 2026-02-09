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

// Mock Three.js
vi.mock('three', () => {
  const mockMaterial = { dispose: vi.fn() };
  const mockGeometry = { dispose: vi.fn() };
  const mockMesh = {
    position: { set: vi.fn(), y: 0 },
    rotation: { x: 0, y: 0 },
    userData: {},
    geometry: mockGeometry,
    material: mockMaterial,
  };

  return {
    OctahedronGeometry: vi.fn(() => mockGeometry),
    MeshStandardMaterial: vi.fn(() => mockMaterial),
    Mesh: vi.fn(() => ({ ...mockMesh })),
  };
});

import { MenuScene } from '../../src/scenes/MenuScene';
import { UIManager } from '../../src/ui/UIManager';

function createMockRenderer() {
  const mockScene = {
    add: vi.fn(),
    remove: vi.fn(),
  };
  return {
    render: vi.fn(),
    getScene: vi.fn(() => mockScene),
    getCamera: vi.fn(),
    dispose: vi.fn(),
    _scene: mockScene,
  } as any;
}

describe('MenuScene', () => {
  let menuScene: MenuScene;
  let uiManager: UIManager;
  let mockRenderer: any;

  beforeEach(() => {
    document.body.innerHTML = '<div id="ui-overlay"></div>';
    emittedEvents.length = 0;
    vi.clearAllMocks();

    uiManager = new UIManager();
    mockRenderer = createMockRenderer();
    menuScene = new MenuScene(uiManager, mockRenderer);
  });

  afterEach(() => {
    menuScene.exit();
  });

  describe('enter', () => {
    it('should create the menu UI', () => {
      menuScene.enter();
      const overlay = document.getElementById('ui-overlay')!;
      expect(overlay.children.length).toBeGreaterThan(0);
    });

    it('should display the game title', () => {
      menuScene.enter();
      const overlay = document.getElementById('ui-overlay')!;
      expect(overlay.textContent).toContain('Princess Puzzle');
    });

    it('should display the subtitle', () => {
      menuScene.enter();
      const overlay = document.getElementById('ui-overlay')!;
      expect(overlay.textContent).toContain('A Jewel Matching Adventure');
    });

    it('should show Play and Continue buttons', () => {
      menuScene.enter();
      const overlay = document.getElementById('ui-overlay')!;
      const buttons = overlay.querySelectorAll('button');
      const buttonTexts = Array.from(buttons).map(b => b.textContent);
      expect(buttonTexts).toContain('Play');
      expect(buttonTexts).toContain('Continue');
    });

    it('should create decorative gems in the scene', () => {
      menuScene.enter();
      const scene = mockRenderer.getScene();
      expect(scene.add).toHaveBeenCalled();
    });
  });

  describe('Play button', () => {
    it('should emit changeState select when clicked', () => {
      menuScene.enter();
      const overlay = document.getElementById('ui-overlay')!;
      const playButton = Array.from(overlay.querySelectorAll('button')).find(b => b.textContent === 'Play')!;
      playButton.click();
      expect(emittedEvents.some(e => e.event === 'changeState' && e.args[0] === 'select')).toBe(true);
    });
  });

  describe('Continue button', () => {
    it('should emit loadGame and changeState play when clicked', () => {
      menuScene.enter();
      const overlay = document.getElementById('ui-overlay')!;
      const continueButton = Array.from(overlay.querySelectorAll('button')).find(b => b.textContent === 'Continue')!;
      continueButton.click();
      expect(emittedEvents.some(e => e.event === 'loadGame')).toBe(true);
      expect(emittedEvents.some(e => e.event === 'changeState' && e.args[0] === 'play')).toBe(true);
    });
  });

  describe('exit', () => {
    it('should clean up UI and decorative gems', () => {
      menuScene.enter();
      menuScene.exit();
      const overlay = document.getElementById('ui-overlay')!;
      expect(overlay.children.length).toBe(0);
    });

    it('should handle exit when not entered', () => {
      expect(() => menuScene.exit()).not.toThrow();
    });
  });

  describe('update', () => {
    it('should not throw', () => {
      menuScene.enter();
      expect(() => menuScene.update(0.016)).not.toThrow();
    });
  });

  describe('render', () => {
    it('should call renderer.render', () => {
      menuScene.render();
      expect(mockRenderer.render).toHaveBeenCalled();
    });
  });
});
