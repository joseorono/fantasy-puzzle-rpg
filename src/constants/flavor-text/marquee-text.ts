export type MarqueeTextTypes = 'blacksmith' | 'inn' | 'item-shop' | 'level-up' | 'world-map' | 'general';

const clickLeaveToTownHub = 'Click Leave to return to Town Hub.';

// Type: Object of String Arrays
export const MARQUEE_HELP_TEXT: Readonly<{ [K in MarqueeTextTypes]: readonly string[] }> = {
  blacksmith: [
    'You can craft items at any blacksmith.',
    'The Blacksmith can melt your coins into gold bars.',
    'Farm resources by repeating story battles or heading to the Dungeon.',
    clickLeaveToTownHub,
  ],
  inn: [
    'Pay coins to fully heal your party.',
    'The Inn in later stages may increase in price.',
    "You may not need to heal if you're near full HP.",
    clickLeaveToTownHub,
  ],
  'item-shop': [
    'Buy items using coins.',
    'Click Buy to add the item to your inventory.',
    "Check each item's description and cost.",
    clickLeaveToTownHub,
  ],
  'level-up': [
    'Allocate Points to increase stats.',
    "Preview your character's stats on the right before applying changes.",
    'Use Confirm to apply changes or Reset to undo.',
  ],
  'world-map': ['Use Arrow Keys or WASD to move the character.', "You can't walk past Battles you haven't beaten."],
  general: ['You can see past messages by scrolling up.'],
} as const;
