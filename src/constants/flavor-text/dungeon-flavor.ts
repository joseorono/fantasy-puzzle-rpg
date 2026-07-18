/**
 * Atmospheric one-liners shown under the current floor name in the dungeon view.
 * Picked at random per event with `getRandomElement` (see `~/lib/utils`).
 */

/** Shown for a normal combat event. */
export const DUNGEON_COMBAT_FLAVOR: ReadonlyArray<string> = [
  'Hostile shapes bar your path.',
  'Something snarls from the dark ahead.',
  'Claws scrape against stone — you are not alone.',
  'The air turns foul. Enemies close in.',
  'Shadows peel from the walls, hungry and waking.',
];

/** Shown for a boss-floor combat event. */
export const DUNGEON_BOSS_FLAVOR: ReadonlyArray<string> = [
  'A mighty presence blocks the way.',
  'The ground trembles. Something vast stirs.',
  'This is the heart of the hollow — and it has a guardian.',
  'A monstrous silhouette rises to meet you.',
];

/** Shown for a treasure-chest event. */
export const DUNGEON_CHEST_FLAVOR: ReadonlyArray<string> = [
  'Something glints in the dark — a chest awaits.',
  'A forgotten cache rests undisturbed before you.',
  'Dust-caked iron bindings hint at treasure within.',
  'Fortune favors the bold. Open it?',
];

/** Shown for a dialogue/scene event. */
export const DUNGEON_DIALOGUE_FLAVOR: ReadonlyArray<string> = [
  'The air grows still. Something is about to happen.',
  'You sense a shift in the atmosphere.',
  'A strange feeling washes over the party.',
  'For a moment, the dungeon seems to hold its breath.',
  'You exchange a look with your companions. Something is different here.',
  'The path ahead seems quiet, but it feels... expectant.',
  'A memory of this place seems to surface, unbidden.',
  "There's a story clinging to the very stones here.",
];

/** Shown when no specific event is queued (between steps). */
export const DUNGEON_CONTINUE_FLAVOR: ReadonlyArray<string> = [
  'The way onward lies ahead.',
  'Deeper still the passage beckons.',
  'You steady yourself and press on.',
];

/** Shown on the completion screen. */
export const DUNGEON_CLEARED_FLAVOR: ReadonlyArray<string> = [
  'The hollow falls silent. Your work here is done.',
  'The last echo fades. This dungeon is conquered.',
  'Stillness settles over the depths. You have prevailed.',
  'Nothing stirs now but the dust. Victory is yours.',
];
