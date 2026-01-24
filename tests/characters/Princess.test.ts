import { describe, it, expect } from 'vitest';
import { createPrincess } from '../../src/characters/Princess';
import { PRINCESSES, getPrincessById, getDefaultPrincess } from '../../src/characters/princessData';

describe('Princess', () => {
  describe('createPrincess', () => {
    it('should create a princess with all properties', () => {
      const princess = createPrincess(
        'test',
        'Test Princess',
        'Testing',
        { primary: 0xff0000, secondary: 0x00ff00, accent: 0x0000ff },
        'A test princess.'
      );

      expect(princess.id).toBe('test');
      expect(princess.name).toBe('Test Princess');
      expect(princess.theme).toBe('Testing');
      expect(princess.colors.primary).toBe(0xff0000);
      expect(princess.description).toBe('A test princess.');
    });
  });

  describe('PRINCESSES', () => {
    it('should have 6 princesses', () => {
      expect(PRINCESSES.length).toBe(6);
    });

    it('should have unique IDs', () => {
      const ids = PRINCESSES.map(p => p.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(PRINCESSES.length);
    });

    it('should have Aurora as first princess', () => {
      expect(PRINCESSES[0].name).toBe('Aurora');
    });

    it('should include all expected princesses', () => {
      const names = PRINCESSES.map(p => p.name);
      expect(names).toContain('Aurora');
      expect(names).toContain('Marina');
      expect(names).toContain('Ivy');
      expect(names).toContain('Ember');
      expect(names).toContain('Luna');
      expect(names).toContain('Crystal');
    });
  });

  describe('getPrincessById', () => {
    it('should find princess by id', () => {
      const princess = getPrincessById('marina');
      expect(princess).toBeDefined();
      expect(princess?.name).toBe('Marina');
    });

    it('should return undefined for unknown id', () => {
      const princess = getPrincessById('unknown');
      expect(princess).toBeUndefined();
    });
  });

  describe('getDefaultPrincess', () => {
    it('should return Aurora as default', () => {
      const princess = getDefaultPrincess();
      expect(princess.name).toBe('Aurora');
    });
  });
});
