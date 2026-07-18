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
  'Enemies ahead!',
  'A fight is brewing.',
  'Prepare for battle.',
];

/** Shown for a boss-floor combat event. */
export const DUNGEON_BOSS_FLAVOR: ReadonlyArray<string> = [
  'A mighty presence blocks the way.',
  'The ground trembles. Something vast stirs.',
  'A monstrous silhouette rises to meet you.',
  'A powerful foe awaits.',
  "The area's guardian appears.",
  'A great challenge lies before you.',
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
  'The air grows still.',
  'You sense a shift in the atmosphere.',
  'You exchange a look with your companions. Seems like we should keep going.',
  'The path ahead seems quiet, but it feels... expectant.',
  'The path ahead seems quiet.',
  'You pause for a moment.',
  'A brief respite from the darkness.',
  'The silence here is different.',
  'You take a moment to look around.',
];

/** Shown when no specific event is queued (between steps). */
export const DUNGEON_CONTINUE_FLAVOR: ReadonlyArray<string> = [
  'The way onward lies ahead.',
  'Deeper still the passage beckons.',
  'You steady yourself and press on.',
  'The only way is forward.',
  'Onward into the depths.',
  'Another floor, another challenge.',
  'You continue your descent.',
];

/** Shown on the completion screen. */
export const DUNGEON_CLEARED_FLAVOR: ReadonlyArray<string> = [
  'The hollow falls silent. Your work here is done.',
  'The last echo fades. This dungeon is conquered.',
  'Stillness settles over the depths. You have prevailed.',
  'Nothing stirs now but the dust. Victory is yours.',
];
