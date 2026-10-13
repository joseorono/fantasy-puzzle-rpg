import type { TutorialTopic, TutorialTopicId } from '~/types/tutorial';

/** Every tutorial topic. Read in the pause menu's hidden Tutorial tab and played as Apprentice Forge events. */
export const TUTORIAL_TOPICS: Record<TutorialTopicId, TutorialTopic> = {
  exploring: {
    id: 'exploring',
    title: 'Exploring',
    iconName: 'parchment',
    lines: [
      'Move with WASD or the arrow keys. Hold Shift to run.',
      'Step on a marker to fight, open a chest, or travel.',
      'Tab shows the map. Esc opens the menu. H or ? reopens these tutorials.',
    ],
  },
  matching: {
    id: 'matching',
    title: 'Matching',
    iconName: 'elixir',
    lines: [
      'Swap two neighboring orbs to line up 3 or more of a color.',
      'Blue, green and purple deal damage for Leon, Robin and Mira.',
      'Yellow heals your most wounded hero, and revives the fallen first.',
      'Longer lines hit harder. Falling orbs that match chain into combos.',
      'Match 5 to make a bomb: it matches any color and blasts a 3×3 area.',
    ],
  },
  guard: {
    id: 'guard',
    title: 'Guard',
    iconName: 'guardArmor',
    lines: [
      'Gray orbs deal light damage and charge the Guard meter.',
      'Guard blocks part of every enemy hit. A full meter blocks all of it.',
      'Blocking drains Guard, and it slowly fades on its own.',
    ],
  },
  skills: {
    id: 'skills',
    title: 'Skills',
    iconName: 'openBook',
    lines: [
      "Each hero's skill charges over time. Matching their color charges it faster.",
      'When a hero glows, click them to unleash it.',
    ],
  },
  enemies: {
    id: 'enemies',
    title: 'Enemies',
    iconName: 'skull',
    lines: [
      'Click an enemy to target it.',
      'The ring around an enemy counts down to its next attack.',
      'Hit enemies before they make their first move for a Preemptive Strike.',
      '"Weak!" means that color deals extra damage.',
      "Empty the bar under an enemy's HP to Stagger it: its attack is canceled and it takes extra damage.",
    ],
  },
  items: {
    id: 'items',
    title: 'Battle Items',
    iconName: 'smallPotion',
    lines: [
      'Items share one cooldown.',
      'Potions heal your most wounded hero. Energy Potions charge every skill.',
      'Row and Column Clears: click the item, then the board. Right-click to auto-aim.',
      'Every item used lowers your victory rating.',
    ],
  },
  foes: {
    id: 'foes',
    title: 'FOEs',
    iconName: 'batWing',
    lines: [
      'FOEs roam the map. A "!" means one has spotted you.',
      "Touch one and the battle begins. Defeated FOEs don't come back.",
      'Hold Shift to outrun them. Get far enough away and they give up.',
    ],
  },
  victory: {
    id: 'victory',
    title: 'Victory',
    iconName: 'chalice',
    lines: [
      'Win fast and keep your HP up to earn more stars. Skills and Staggers add a bonus.',
      'More stars mean more coins and materials.',
      'HP carries over between battles. If every hero falls, you return to the title screen.',
    ],
  },
  leveling: {
    id: 'leveling',
    title: 'Levels & Stats',
    iconName: 'silverArmor',
    lines: [
      'Every hero earns EXP from a win, even the fallen.',
      'Each level-up gives you 2 points to spend, and 2 more are placed for you.',
      'POW raises damage. VIT raises max HP. SPD charges skills and items faster.',
    ],
  },
  towns: {
    id: 'towns',
    title: 'Towns',
    iconName: 'coinPurse',
    lines: [
      'Rest at the Inn to heal; the more hurt you are, the more it costs.',
      'Buy potions at the Item Shop. Craft and upgrade gear at the Blacksmith.',
      'Retrain stats and manage skills at the Training Grounds.',
      'Entering a town saves your game.',
    ],
  },
};

/** The order the Tutorial tab lists topics in: the order the Apprentice Forge teaches them. */
export const TUTORIAL_TOPIC_ORDER: readonly TutorialTopicId[] = [
  'exploring',
  'matching',
  'guard',
  'skills',
  'enemies',
  'items',
  'foes',
  'victory',
  'leveling',
  'towns',
];
