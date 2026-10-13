import { useGlobalAnimation, type GlobalAnimationType } from '~/components/global-animations-system';
import { ANIMATION_CONFIG, BATTLE_TRANSITION_ANIMATIONS, TOWN_ENTRY_ANIMATION } from '~/constants/animation-system';

const BUTTON_CLASS = 'rounded px-3 py-2 text-white transition-colors capitalize';

/** Cover transitions that precede a route change but are not part of the battle pool. */
const VIEW_TRANSITIONS: readonly GlobalAnimationType[] = ['stairs-ascent', TOWN_ENTRY_ANIMATION];

interface AnimationCategory {
  title: string;
  hint: string;
  animations: readonly GlobalAnimationType[];
  colorClass: string;
}

/** Everything not claimed by a named category is a plain in-place effect. */
const EFFECTS = (Object.keys(ANIMATION_CONFIG) as GlobalAnimationType[]).filter(
  (type) => !VIEW_TRANSITIONS.includes(type) && !BATTLE_TRANSITION_ANIMATIONS.includes(type),
);

const CATEGORIES: readonly AnimationCategory[] = [
  {
    title: 'Effects',
    hint: 'In-place flourishes: the screen is visible again when they end.',
    animations: EFFECTS,
    colorClass: 'bg-green-500 hover:bg-green-600',
  },
  {
    title: 'View Transitions',
    hint: 'End fully covered; the caller navigates underneath.',
    animations: VIEW_TRANSITIONS,
    colorClass: 'bg-blue-500 hover:bg-blue-600',
  },
  {
    title: 'Battle Transitions',
    hint: 'The random pool drawn before every combat encounter.',
    animations: BATTLE_TRANSITION_ANIMATIONS,
    colorClass: 'bg-red-500 hover:bg-red-600',
  },
];

export default function GlobalAnimationTest() {
  const { trigger, triggerSequence, triggerFromPool } = useGlobalAnimation();

  const allAnimations = Object.keys(ANIMATION_CONFIG) as GlobalAnimationType[];

  function play(type: GlobalAnimationType) {
    trigger(type).then(() => console.log(`Anim ${type} done!`));
  }

  return (
    <div className="flex flex-col items-center gap-2.5 p-5">
      <h3 className="mb-2 text-xl font-bold">Global Animation Test</h3>

      {CATEGORIES.map((category) => (
        <div key={category.title} className="mt-4 flex flex-col items-center gap-2">
          <h4 className="text-lg font-bold">{category.title}</h4>
          <p className="text-sm text-gray-500">{category.hint}</p>
          <div className="flex flex-wrap justify-center gap-2">
            {category.animations.map((type) => (
              <button
                key={type}
                className={`${BUTTON_CLASS} ${category.colorClass}`}
                onClick={() => play(type)}
                title={`${ANIMATION_CONFIG[type].duration}ms · ${ANIMATION_CONFIG[type].strategy}`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      ))}

      <div className="mt-4 flex flex-col items-center gap-2">
        <h4 className="text-lg font-bold">Combos</h4>
        <div className="flex flex-wrap justify-center gap-2">
          <button
            className={`${BUTTON_CLASS} bg-red-700 hover:bg-red-800`}
            onClick={() => triggerFromPool(BATTLE_TRANSITION_ANIMATIONS, () => console.log('Pool pick done!'))}
            title="Same draw the game makes before a fight: random, never the same one twice in a row."
          >
            Random battle transition
          </button>
          <button
            className={`${BUTTON_CLASS} bg-gray-500 hover:bg-gray-600`}
            onClick={() => triggerSequence(allAnimations, () => console.log('All animations done!'))}
          >
            Combo all animations
          </button>
        </div>
      </div>
    </div>
  );
}
