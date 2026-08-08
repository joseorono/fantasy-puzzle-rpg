import * as z from 'zod'; // This leads to a smaller bundle size somehow
import { GAME_STORE_VERSION } from '~/constants/game';
import { getMapById } from '~/constants/maps';
import type { SaveSlotId } from '~/constants/storage-keys';
import { SAVE_SLOT_IDS } from '~/constants/storage-keys';
import type { MapId } from '~/types/map';
import type { CharacterClass, CharacterData } from '~/types/rpg-elements';
import type { SaveGame, SaveGameState, SavedCharacter } from '~/types/save-game';
import { saveGameSchema } from '~/types/save-game';
import { calculateMaxHp } from '~/lib/rpg-calculations';

/** Version stamped into every save envelope; bump alongside `migrateSave`. */
export const CURRENT_SAVE_VERSION = GAME_STORE_VERSION;

export interface BuildSaveInput {
  state: SaveGameState;
  currentMapId: MapId;
  playtimeMs: number;
  /** Epoch ms; defaults to now. Injectable for tests. */
  savedAt?: number;
}

/**
 * Builds the versioned save envelope from the persistent store slices.
 * Runs the full schema so unknown keys are stripped before hitting localStorage.
 * Throws on invalid input — a failure here is a programmer error on the write
 * path, unlike reads, which fall back to an empty slot.
 */
export function buildSaveData({ state, currentMapId, playtimeMs, savedAt = Date.now() }: BuildSaveInput): SaveGame {
  return saveGameSchema.parse({
    version: CURRENT_SAVE_VERSION,
    savedAt,
    playtimeMs,
    currentMapId,
    state,
  });
}

/**
 * Migration hook run on every raw slot value before schema validation.
 * At version 1 there is nothing to migrate: current-version envelopes pass
 * through, and anything unrecognizable becomes `null` so the slot reads as
 * empty instead of crashing. Future versions transform older envelopes here.
 */
export function migrateSave(raw: unknown): unknown {
  if (raw === null) return null;
  if (typeof raw !== 'object' || !('version' in raw)) return null;

  const version = (raw as { version: unknown }).version;
  if (typeof version !== 'number' || version > CURRENT_SAVE_VERSION) return null;

  return raw;
}

/**
 * Storage-facing schema for one slot: migration first, then the nullable envelope.
 * Anything the migration or validation rejects reads back as an empty slot.
 */
export const saveSlotSchema = z.preprocess(migrateSave, saveGameSchema.nullable());

/** What a save-slot card displays. Derived from the envelope on render, never stored. */
export interface SaveSummary {
  savedAt: number;
  playtimeMs: number;
  coins: number;
  gold: number;
  mapName: string;
  party: Array<{ id: string; name: string; class: CharacterClass; level: number }>;
}

/**
 * Derives the slot-card metadata from a save envelope.
 */
export function deriveSaveSummary(save: SaveGame): SaveSummary {
  return {
    savedAt: save.savedAt,
    playtimeMs: save.playtimeMs,
    coins: save.state.resources.coins,
    gold: save.state.resources.gold,
    mapName: getMapById(save.currentMapId).displayMapName,
    party: save.state.party.members.map((member) => ({
      id: member.id,
      name: member.name,
      class: member.class,
      level: member.level,
    })),
  };
}

/**
 * Total playtime at a point in time: what previous sessions banked plus the
 * elapsed portion of the current one.
 */
export function computePlaytimeMs(basePlaytimeMs: number, sessionStartedAt: number, now: number): number {
  return basePlaytimeMs + Math.max(0, now - sessionStartedAt);
}

/**
 * Formats a playtime as `H:MM:SS`. Hours are unpadded and unbounded — a 30-hour
 * file shows `30:00:00`, never wraps.
 */
export function formatPlaytime(ms: number): string {
  const totalSeconds = Math.floor(Math.max(0, ms) / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

/**
 * Picks the most recently written non-empty slot — what the title screen's
 * Continue button loads. Ties resolve to the earlier slot in `SAVE_SLOT_IDS`
 * order; returns null when every slot is empty.
 */
export function pickMostRecentSlot(
  slots: ReadonlyArray<{ slotId: SaveSlotId; save: SaveGame | null }>,
): SaveSlotId | null {
  let best: { slotId: SaveSlotId; savedAt: number } | null = null;
  for (const id of SAVE_SLOT_IDS) {
    const entry = slots.find((slot) => slot.slotId === id);
    if (!entry?.save) continue;
    if (best === null || entry.save.savedAt > best.savedAt) {
      best = { slotId: id, savedAt: entry.save.savedAt };
    }
  }
  return best?.slotId ?? null;
}

/**
 * Rebuilds derived party fields instead of trusting the file: `maxHp` is always
 * recomputed from the VIT formula, and `currentHp` is clamped into `[0, maxHp]`.
 * Keeps hand-edited or stale saves from smuggling in impossible HP values.
 */
export function sanitizeLoadedParty(members: SavedCharacter[]): CharacterData[] {
  return members.map((member) => {
    const maxHp = calculateMaxHp(member.baseHp, member.stats.vit, member.vitHpMultiplier);
    return {
      ...member,
      maxHp,
      currentHp: Math.min(Math.max(0, member.currentHp), maxHp),
    };
  });
}
