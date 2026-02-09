import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EventBus } from '../../src/utils/EventBus';

describe('EventBus', () => {
  let bus: EventBus;

  beforeEach(() => {
    bus = new EventBus();
  });

  describe('on / emit', () => {
    it('should call registered listener when event is emitted', () => {
      const callback = vi.fn();
      bus.on('test', callback);
      bus.emit('test', 'arg1', 42);
      expect(callback).toHaveBeenCalledWith('arg1', 42);
    });

    it('should support multiple listeners on the same event', () => {
      const cb1 = vi.fn();
      const cb2 = vi.fn();
      bus.on('test', cb1);
      bus.on('test', cb2);
      bus.emit('test');
      expect(cb1).toHaveBeenCalled();
      expect(cb2).toHaveBeenCalled();
    });

    it('should not call listeners for different events', () => {
      const callback = vi.fn();
      bus.on('other', callback);
      bus.emit('test');
      expect(callback).not.toHaveBeenCalled();
    });

    it('should not throw when emitting event with no listeners', () => {
      expect(() => bus.emit('nonexistent')).not.toThrow();
    });
  });

  describe('off', () => {
    it('should remove a specific listener', () => {
      const callback = vi.fn();
      bus.on('test', callback);
      bus.off('test', callback);
      bus.emit('test');
      expect(callback).not.toHaveBeenCalled();
    });

    it('should not throw when removing listener from nonexistent event', () => {
      const callback = vi.fn();
      expect(() => bus.off('nonexistent', callback)).not.toThrow();
    });
  });

  describe('once', () => {
    it('should call listener only once', () => {
      const callback = vi.fn();
      bus.once('test', callback);
      bus.emit('test', 'first');
      bus.emit('test', 'second');
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith('first');
    });
  });

  describe('clear', () => {
    it('should remove all listeners', () => {
      const cb1 = vi.fn();
      const cb2 = vi.fn();
      bus.on('a', cb1);
      bus.on('b', cb2);
      bus.clear();
      bus.emit('a');
      bus.emit('b');
      expect(cb1).not.toHaveBeenCalled();
      expect(cb2).not.toHaveBeenCalled();
    });
  });
});
