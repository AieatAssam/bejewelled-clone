import { describe, it, expect } from 'vitest';
import { createPrincess, PrincessAbility } from '../../src/characters/Princess';
import { PRINCESSES, getPrincessById, getDefaultPrincess } from '../../src/characters/princessData';

describe('Princess', () => {
  describe('createPrincess', () => {
    it('should create a princess with all properties', () => {
      const princess = createPrincess(
        'test',
        'Test Princess',
        'Testing',
        { primary: 0xff0000, secondary: 0x00ff00, accent: 0x0000ff },
        'A test princess.',
        { name: 'Test Ability', description: 'A test ability', type: 'cascade_bonus', value: 1 },
        'ruby'
      );

      expect(princess.id).toBe('test');
      expect(princess.name).toBe('Test Princess');
      expect(princess.theme).toBe('Testing');
      expect(princess.colors.primary).toBe(0xff0000);
      expect(princess.description).toBe('A test princess.');
      expect(princess.ability.name).toBe('Test Ability');
      expect(princess.favoriteGem).toBe('ruby');
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

    it('should have unique ability types for each princess', () => {
      const abilityTypes = PRINCESSES.map(p => p.ability.type);
      const uniqueTypes = new Set(abilityTypes);
      expect(uniqueTypes.size).toBe(6);
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

describe('Princess Abilities', () => {
  describe('Aurora - Radiant Cascade', () => {
    it('should have cascade_bonus ability type', () => {
      const aurora = getPrincessById('aurora');
      expect(aurora?.ability.type).toBe('cascade_bonus');
    });

    it('should give +1 bonus gem per cascade level', () => {
      const aurora = getPrincessById('aurora');
      expect(aurora?.ability.value).toBe(1);
      expect(aurora?.ability.name).toBe('Radiant Cascade');
    });

    it('should have diamond as favorite gem', () => {
      const aurora = getPrincessById('aurora');
      expect(aurora?.favoriteGem).toBe('diamond');
    });
  });

  describe('Marina - Ocean Shield', () => {
    it('should have dragon_resist ability type', () => {
      const marina = getPrincessById('marina');
      expect(marina?.ability.type).toBe('dragon_resist');
    });

    it('should reduce dragon stealing by 3 gems', () => {
      const marina = getPrincessById('marina');
      expect(marina?.ability.value).toBe(3);
      expect(marina?.ability.name).toBe('Ocean Shield');
    });

    it('should have sapphire as favorite gem', () => {
      const marina = getPrincessById('marina');
      expect(marina?.favoriteGem).toBe('sapphire');
    });
  });

  describe('Ivy - Nature\'s Bounty', () => {
    it('should have favorite_bonus ability type', () => {
      const ivy = getPrincessById('ivy');
      expect(ivy?.ability.type).toBe('favorite_bonus');
    });

    it('should give +1 bonus emerald per emerald match', () => {
      const ivy = getPrincessById('ivy');
      expect(ivy?.ability.value).toBe(1);
      expect(ivy?.ability.name).toBe("Nature's Bounty");
    });

    it('should have emerald as favorite gem', () => {
      const ivy = getPrincessById('ivy');
      expect(ivy?.favoriteGem).toBe('emerald');
    });
  });

  describe('Ember - Inferno Star', () => {
    it('should have star_explode ability type', () => {
      const ember = getPrincessById('ember');
      expect(ember?.ability.type).toBe('star_explode');
    });

    it('should make star gems explode in 3x3 area', () => {
      const ember = getPrincessById('ember');
      expect(ember?.ability.value).toBe(1);
      expect(ember?.ability.name).toBe('Inferno Star');
    });

    it('should have ruby as favorite gem', () => {
      const ember = getPrincessById('ember');
      expect(ember?.favoriteGem).toBe('ruby');
    });
  });

  describe('Luna - Starlight Streak', () => {
    it('should have streak_boost ability type', () => {
      const luna = getPrincessById('luna');
      expect(luna?.ability.type).toBe('streak_boost');
    });

    it('should make streaks count double', () => {
      const luna = getPrincessById('luna');
      expect(luna?.ability.value).toBe(2);
      expect(luna?.ability.name).toBe('Starlight Streak');
    });

    it('should have amethyst as favorite gem', () => {
      const luna = getPrincessById('luna');
      expect(luna?.favoriteGem).toBe('amethyst');
    });
  });

  describe('Crystal - Frost Blessing', () => {
    it('should have cost_discount ability type', () => {
      const crystal = getPrincessById('crystal');
      expect(crystal?.ability.type).toBe('cost_discount');
    });

    it('should give 50% discount on hints and fairy dust', () => {
      const crystal = getPrincessById('crystal');
      expect(crystal?.ability.value).toBe(50);
      expect(crystal?.ability.name).toBe('Frost Blessing');
    });

    it('should have pearl_earring as favorite gem', () => {
      const crystal = getPrincessById('crystal');
      expect(crystal?.favoriteGem).toBe('pearl_earring');
    });
  });

  describe('Ability types validation', () => {
    const validAbilityTypes = [
      'cascade_bonus',
      'dragon_resist',
      'favorite_bonus',
      'star_explode',
      'streak_boost',
      'cost_discount',
    ];

    it('all princesses should have valid ability types', () => {
      for (const princess of PRINCESSES) {
        expect(validAbilityTypes).toContain(princess.ability.type);
      }
    });

    it('all princesses should have positive ability values', () => {
      for (const princess of PRINCESSES) {
        expect(princess.ability.value).toBeGreaterThan(0);
      }
    });

    it('all princesses should have ability descriptions', () => {
      for (const princess of PRINCESSES) {
        expect(princess.ability.description.length).toBeGreaterThan(0);
      }
    });
  });
});
