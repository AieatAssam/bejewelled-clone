/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock EventBus before importing AudioManager
vi.mock('../../src/utils/EventBus', () => {
  const listeners = new Map<string, Set<Function>>();
  return {
    eventBus: {
      on: vi.fn((event: string, cb: Function) => {
        if (!listeners.has(event)) listeners.set(event, new Set());
        listeners.get(event)!.add(cb);
      }),
      emit: vi.fn((event: string, ...args: unknown[]) => {
        const cbs = listeners.get(event);
        if (cbs) cbs.forEach(cb => cb(...args));
      }),
      off: vi.fn(),
      clear: vi.fn(),
    },
  };
});

import { AudioManager } from '../../src/utils/AudioManager';

describe('AudioManager', () => {
  let audioManager: AudioManager;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock AudioContext
    const mockOscillator = {
      connect: vi.fn(),
      type: 'sine',
      frequency: { value: 0 },
      start: vi.fn(),
      stop: vi.fn(),
    };
    const mockGainNode = {
      connect: vi.fn(),
      gain: {
        setValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
      },
    };
    (globalThis as any).AudioContext = vi.fn(() => ({
      createOscillator: vi.fn(() => mockOscillator),
      createGain: vi.fn(() => mockGainNode),
      destination: {},
      currentTime: 0,
    }));

    audioManager = new AudioManager();
  });

  describe('volume control', () => {
    it('should have default volume of 0.5', () => {
      expect(audioManager.getVolume()).toBe(0.5);
    });

    it('should set and get volume', () => {
      audioManager.setVolume(0.8);
      expect(audioManager.getVolume()).toBe(0.8);
    });

    it('should clamp volume to 0 minimum', () => {
      audioManager.setVolume(-0.5);
      expect(audioManager.getVolume()).toBe(0);
    });

    it('should clamp volume to 1 maximum', () => {
      audioManager.setVolume(1.5);
      expect(audioManager.getVolume()).toBe(1);
    });
  });

  describe('mute control', () => {
    it('should not be muted by default', () => {
      expect(audioManager.isMuted()).toBe(false);
    });

    it('should mute', () => {
      audioManager.mute();
      expect(audioManager.isMuted()).toBe(true);
    });

    it('should unmute', () => {
      audioManager.mute();
      audioManager.unmute();
      expect(audioManager.isMuted()).toBe(false);
    });

    it('should toggle mute on', () => {
      const result = audioManager.toggleMute();
      expect(result).toBe(true);
      expect(audioManager.isMuted()).toBe(true);
    });

    it('should toggle mute off', () => {
      audioManager.mute();
      const result = audioManager.toggleMute();
      expect(result).toBe(false);
      expect(audioManager.isMuted()).toBe(false);
    });
  });

  describe('play', () => {
    it('should not throw when muted', () => {
      audioManager.mute();
      expect(() => audioManager.play('match3')).not.toThrow();
    });

    it('should not throw when not initialized (no user interaction)', () => {
      expect(() => audioManager.play('match3')).not.toThrow();
    });

    it('should not throw for unknown sound name', () => {
      expect(() => audioManager.play('nonexistent')).not.toThrow();
    });
  });
});
