import { describe, it, expect } from 'vitest';
import {
  CURRENT_SAVE_VERSION,
  buildSaveData,
  migrateSave,
  saveSlotSchema,
  deriveSaveSummary,
  computePlaytimeMs,
  formatPlaytime,
  pickMostRecentSlot,
  sanitizeLoadedParty,
} from './save-game';
import { calculateMaxHp } from './rpg-calculations';
import { getMapById } from '~/constants/maps';
import type { SaveGame, SaveGameState, SavedCharacter } from '~/types/save-game';

const SAVED_AT = 1_700_000_000_000;

function makeCharacter(overrides: Partial<SavedCharacter> = {}): SavedCharacter {
  return {
    id: 'warrior',
    name: 'Roland',
    class: 'warrior',
    color: 'yellow',
    maxHp: 75,
    currentHp: 60,
    baseHp: 50,
    stats: { pow: 5, vit: 5, spd: 3 },
    potentialStats: { pow: 2, vit: 1, spd: 1 },
    vitHpMultiplier: 5,
    skillCooldown: 0,
    maxCooldown: 10,
    level: 3,
    currentLevelExp: 40,
    unlockedSkillIds: ['warrior-smash'],
    selectedSkillId: 'warrior-smash',
    unlockedPassiveIds: [],
    skillLevels: {},
    ...overrides,
  };
}

function makeGameState(): SaveGameState {
  return {
    resources: { coins: 42, gold: 7, copper: 3, silver: 1, iron: 0 },
    party: { members: [makeCharacter()] },
    inventory: { items: [{ itemId: 'potion', quantity: 3 }, { itemId: 'iron-sword', quantity: 1, rarity: 'rare' }] },
    mapProgress: {
      battlesCompleted: { battle_1: true },
      bossesCompleted: {},
      dungeonsCompleted: {},
      townsVisited: { town_1: true },
      treasuresFound: {},
      mysteriesSolved: {},
      characterPositions: { 'map-00': { row: 4, col: 7 } },
    },
    floorLootProgress: { 'map-00': { floor_loot_1: true } },
    crafting: { pity: 5 },
    dungeonProgress: { completedDungeons: { 'easy-dungeon': true } },
  };
}

function makeSave(overrides: Partial<SaveGame> = {}): SaveGame {
  return buildSaveData({ state: makeGameState(), currentMapId: 'map-00', playtimeMs: 90_000, savedAt: SAVED_AT, ...overrides });
}

describe('buildSaveData', () => {
  it('stamps version, savedAt, playtime and map into the envelope', () => {
    const save = makeSave();
    expect(save.version).toBe(CURRENT_SAVE_VERSION);
    expect(save.savedAt).toBe(SAVED_AT);
    expect(save.playtimeMs).toBe(90_000);
    expect(save.currentMapId).toBe('map-00');
    expect(save.state.resources.coins).toBe(42);
  });

  it('strips unknown keys such as the legacy shopsVisited', () => {
    const state = makeGameState();
    const dirty = {
      ...state,
      mapProgress: { ...state.mapProgress, shopsVisited: { shop_1: true } },
    } as unknown as SaveGameState;

    const save = buildSaveData({ state: dirty, currentMapId: 'map-00', playtimeMs: 0, savedAt: SAVED_AT });
    expect('shopsVisited' in save.state.mapProgress).toBe(false);
  });

  it('survives a localStorage round-trip unchanged', () => {
    const save = makeSave();
    const revived = saveSlotSchema.safeParse(JSON.parse(JSON.stringify(save)));
    expect(revived.success).toBe(true);
    expect(revived.data).toEqual(save);
  });

  it('drops undefined equipment fields on round-trip without failing validation', () => {
    const save = makeSave();
    save.state.party.members[0].equippedWeaponId = undefined;
    const revived = saveSlotSchema.safeParse(JSON.parse(JSON.stringify(save)));
    expect(revived.success).toBe(true);
  });
});

describe('saveSlotSchema', () => {
  it('accepts null as an empty slot', () => {
    const parsed = saveSlotSchema.safeParse(null);
    expect(parsed.success).toBe(true);
    expect(parsed.data).toBeNull();
  });

  it('rejects an envelope missing a slice', () => {
    const save = makeSave() as unknown as { state: Record<string, unknown> };
    delete save.state.party;
    expect(saveSlotSchema.safeParse(save).success).toBe(false);
  });

  it('rejects wrong field types', () => {
    const save = JSON.parse(JSON.stringify(makeSave())) as { state: { crafting: { pity: unknown } } };
    save.state.crafting.pity = 'twenty';
    expect(saveSlotSchema.safeParse(save).success).toBe(false);
  });

  it('rejects an unknown map id', () => {
    const save = JSON.parse(JSON.stringify(makeSave())) as { currentMapId: string };
    save.currentMapId = 'map-99';
    expect(saveSlotSchema.safeParse(save).success).toBe(false);
  });
});

describe('migrateSave', () => {
  it('passes current-version envelopes through untouched', () => {
    const save = makeSave();
    expect(migrateSave(save)).toBe(save);
  });

  it('nulls out envelopes from a future version', () => {
    expect(migrateSave({ ...makeSave(), version: CURRENT_SAVE_VERSION + 1 })).toBeNull();
  });

  it('nulls out garbage without throwing', () => {
    expect(migrateSave('not a save')).toBeNull();
    expect(migrateSave(42)).toBeNull();
    expect(migrateSave({})).toBeNull();
    expect(migrateSave({ version: 'one' })).toBeNull();
    expect(migrateSave(null)).toBeNull();
  });
});

describe('deriveSaveSummary', () => {
  it('derives card metadata from the envelope', () => {
    const summary = deriveSaveSummary(makeSave());
    expect(summary).toEqual({
      savedAt: SAVED_AT,
      playtimeMs: 90_000,
      coins: 42,
      gold: 7,
      mapName: getMapById('map-00').displayMapName,
      party: [{ id: 'warrior', name: 'Roland', class: 'warrior', level: 3 }],
    });
  });
});

describe('computePlaytimeMs', () => {
  it('adds banked time to the current session', () => {
    expect(computePlaytimeMs(60_000, 1_000, 31_000)).toBe(90_000);
  });

  it('ignores a session start in the future', () => {
    expect(computePlaytimeMs(60_000, 50_000, 40_000)).toBe(60_000);
  });
});

describe('formatPlaytime', () => {
  it('formats zero as 0:00:00', () => {
    expect(formatPlaytime(0)).toBe('0:00:00');
  });

  it('pads minutes and seconds', () => {
    expect(formatPlaytime(42_000)).toBe('0:00:42');
    expect(formatPlaytime(12 * 3600_000 + 34 * 60_000 + 56_000)).toBe('12:34:56');
  });

  it('does not wrap past 24 hours', () => {
    expect(formatPlaytime(123 * 3600_000 + 1000)).toBe('123:00:01');
  });

  it('clamps negative input to zero', () => {
    expect(formatPlaytime(-5000)).toBe('0:00:00');
  });
});

describe('pickMostRecentSlot', () => {
  it('returns null when every slot is empty', () => {
    const slots = [
      { slotId: 'slot-1' as const, save: null },
      { slotId: 'autosave' as const, save: null },
    ];
    expect(pickMostRecentSlot(slots)).toBeNull();
  });

  it('picks the highest savedAt across manual and autosave slots', () => {
    const slots = [
      { slotId: 'slot-1' as const, save: makeSave({ savedAt: SAVED_AT + 1000 }) },
      { slotId: 'slot-2' as const, save: makeSave({ savedAt: SAVED_AT }) },
      { slotId: 'autosave' as const, save: makeSave({ savedAt: SAVED_AT + 5000 }) },
    ];
    expect(pickMostRecentSlot(slots)).toBe('autosave');
  });

  it('breaks ties toward the earlier slot in SAVE_SLOT_IDS order', () => {
    const slots = [
      { slotId: 'slot-3' as const, save: makeSave() },
      { slotId: 'slot-1' as const, save: makeSave() },
    ];
    expect(pickMostRecentSlot(slots)).toBe('slot-1');
  });
});

describe('sanitizeLoadedParty', () => {
  it('recomputes tampered maxHp from the VIT formula', () => {
    const member = makeCharacter({ maxHp: 9999 });
    const [sanitized] = sanitizeLoadedParty([member]);
    expect(sanitized.maxHp).toBe(calculateMaxHp(member.baseHp, member.stats.vit, member.vitHpMultiplier));
  });

  it('clamps currentHp into [0, maxHp]', () => {
    const overhealed = sanitizeLoadedParty([makeCharacter({ currentHp: 9999 })])[0];
    expect(overhealed.currentHp).toBe(overhealed.maxHp);

    const dead = sanitizeLoadedParty([makeCharacter({ currentHp: -10 })])[0];
    expect(dead.currentHp).toBe(0);
  });
});
