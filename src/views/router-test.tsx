import { useSetAtom } from 'jotai';
import { useRouterActions, useRouterState, useParty } from '~/stores/game-store';
import { setupBattleAtom } from '~/stores/battle-atoms';
import { ConsumableItems, EquipmentItems, ConsumableItemIds } from '~/constants/inventory';
import { INITIAL_ENEMIES } from '~/constants/party';
import { EXP_PINATA_FROGS, EXP_PINATA_TARGET_LEVEL, EXP_PINATA_TOTAL_EXP } from '~/constants/enemies/debug';
import { BADGER, SWAMP_FROG } from '~/constants/enemies/world-00';
import { ALL_MAPS } from '~/constants/maps';
import { createLootTable } from '~/types/loot';
import { cn } from '~/lib/utils';
import type { EnemyData } from '~/types/rpg-elements';

/**
 * Battle scenarios surfaced in the Battles section, the same way `ALL_MAPS` drives the Maps
 * section: add an entry and a button shows up. `setupBattle` clones them into battle state.
 */
const BATTLE_DEMOS: {
  id: string;
  label: string;
  className: string;
  location: string;
  title?: string;
  enemies: EnemyData[];
}[] = [
  {
    id: 'initial',
    label: 'Battle Demo',
    className: 'bg-blue-500 hover:bg-blue-600',
    location: 'Forest',
    enemies: INITIAL_ENEMIES,
  },
  {
    id: 'exp-pinata',
    label: `EXP Piñata Frogs (→ Lv ${EXP_PINATA_TARGET_LEVEL})`,
    className: 'bg-amber-500 hover:bg-amber-600',
    location: 'Swamp',
    title: `Three harmless frogs worth ${EXP_PINATA_TOTAL_EXP} EXP between them — clears a level-1 party to level ${EXP_PINATA_TARGET_LEVEL}.`,
    enemies: EXP_PINATA_FROGS,
  },
  {
    id: 'badger',
    label: 'Badger (Admurin)',
    className: 'bg-rose-600 hover:bg-rose-700',
    location: 'Forest',
    title: 'Admurin Badger: animated sheet enemy (idle, hurt, attack A/B) whose second attack is a heavy hit.',
    enemies: [{ ...BADGER, id: 'badger-1' }],
  },
  {
    id: 'swamp-frog',
    label: 'Swamp Frog (Admurin)',
    className: 'bg-emerald-600 hover:bg-emerald-700',
    location: 'Swamp',
    title: 'Admurin Frogger: animated sheet enemy (idle, hurt, tongue/spit) with a fast second attack.',
    enemies: [{ ...SWAMP_FROG, id: 'swamp-frog-1' }],
  },
];

/**
 * Router test view - demonstrates navigation
 */
export default function RouterTestView() {
  const router = useRouterState();
  const party = useParty();
  const setupBattle = useSetAtom(setupBattleAtom);
  const { goToTownHub, goToBattleDemo, goToMap, goToDialogueDemo, goToBattleRewards, goToDebug, goBack } =
    useRouterActions();

  return (
    <div id="router-test" className="flex flex-col items-center justify-center gap-2.5 p-5">
      <h3 className="mb-2 text-xl font-bold">Router Test</h3>

      <div className="mb-2">
        <strong>Current View:</strong> {router.currentView}
      </div>

      <div className="mb-4">
        <strong>History:</strong> {router.history.map((entry) => entry.view).join(' → ') || 'None'}
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        <button
          className="rounded bg-blue-500 px-3 py-2 text-white transition-colors hover:bg-blue-600"
          onClick={() =>
            goToTownHub({
              townName: 'Test Town',
              innCost: { coins: 20, gold: 0, silver: 0, iron: 0, copper: 0 },
              itemsForSell: [...ConsumableItemIds],
              onLeaveCallback: () => goBack(),
            })
          }
        >
          Town Hub
        </button>

        <button
          className="rounded bg-blue-500 px-3 py-2 text-white transition-colors hover:bg-blue-600"
          onClick={() => goToDialogueDemo({})}
        >
          Dialogue Demo
        </button>

        <button
          className="rounded bg-blue-500 px-3 py-2 text-white transition-colors hover:bg-blue-600"
          onClick={() =>
            goToBattleRewards({
              lootTable: createLootTable(
                [
                  { item: EquipmentItems.find((e) => e.id === 'iron-sword')! },
                  { item: EquipmentItems.find((e) => e.id === 'iron-armor')! },
                ],
                [
                  { item: ConsumableItems.find((c) => c.id === 'potion')! },
                  { item: ConsumableItems.find((c) => c.id === 'energy-potion')! },
                ],
                { item: { coins: 100, gold: 3, silver: 12, iron: 5, copper: 8 } },
              ),
              expReward: 250,
            })
          }
        >
          Battle Rewards
        </button>

        <button
          className="rounded bg-blue-500 px-3 py-2 text-white transition-colors hover:bg-blue-600"
          onClick={() => goToDebug()}
        >
          Debug
        </button>

        <button
          className="rounded bg-emerald-500 px-3 py-2 text-white transition-colors hover:bg-emerald-600"
          onClick={() => goToMap({ mapId: 'map-00-apprentice-forge' })}
        >
          Apprentice Forge
        </button>

        <button
          className="rounded bg-emerald-500 px-3 py-2 text-white transition-colors hover:bg-emerald-600"
          onClick={() => goToMap({ mapId: 'map-01-fairy-forest' })}
        >
          Fairy Forest
        </button>

        <button
          className="rounded bg-emerald-500 px-3 py-2 text-white transition-colors hover:bg-emerald-600"
          onClick={() => goToMap({ mapId: 'map-02-castle-garden' })}
        >
          Castle Garden
        </button>

        <button
          className="rounded bg-emerald-500 px-3 py-2 text-white transition-colors hover:bg-emerald-600"
          onClick={() => goToMap({ mapId: 'map-03-desert' })}
        >
          Desert
        </button>

        <button
          className={`rounded px-3 py-2 transition-colors ${
            router.history.length > 0
              ? 'bg-gray-500 text-white hover:bg-gray-600'
              : 'cursor-not-allowed bg-gray-300 text-gray-500'
          }`}
          onClick={() => goBack()}
          disabled={router.history.length === 0}
        >
          Go Back
        </button>
      </div>

      <div className="mt-4 flex flex-col items-center gap-2">
        <h4 className="text-lg font-bold">Maps</h4>

        {/* Generated from the registry, so a new map shows up here on its own. */}
        <div className="flex flex-wrap justify-center gap-2">
          {ALL_MAPS.map((map) => (
            <button
              key={map.id}
              className="rounded bg-blue-500 px-3 py-2 text-white transition-colors hover:bg-blue-600"
              onClick={() => goToMap({ mapId: map.id })}
            >
              {map.displayMapName}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 flex flex-col items-center gap-2">
        <h4 className="text-lg font-bold">Battles</h4>

        {/* Driven by BATTLE_DEMOS above, so a new scenario shows up here on its own. */}
        <div className="flex flex-wrap justify-center gap-2">
          {BATTLE_DEMOS.map((demo) => (
            <button
              key={demo.id}
              className={cn('rounded px-3 py-2 text-white transition-colors', demo.className)}
              title={demo.title}
              onClick={() => {
                // Fresh encounter before navigating, mirroring the map's startBattle so the demo is deterministic.
                setupBattle({ enemies: demo.enemies, party });
                goToBattleDemo({ enemyId: demo.enemies[0].id, location: demo.location, canFlee: true });
              }}
            >
              {demo.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
