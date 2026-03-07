import { useState, useEffect } from 'react';
import NumberFlow from '@number-flow/react';
import {
  SNAPPY_SPIN_TIMING,
  SNAPPY_TRANSFORM_TIMING,
  SNAPPY_OPACITY_TIMING,
  INTEGER_FORMAT,
} from '~/constants/number-flow';
import {
  useParty,
  usePartyActions,
  useRouterActions,
  useViewData,
  useResources,
  useResourcesActions,
  useInventoryActions,
} from '~/stores/game-store';
import { calculateLevelUpsForParty } from '~/lib/battle-rewards';
import { LevelUpView } from './level-up-view';
import { levelUp, getRandomPotentialStats } from '~/lib/leveling-system';
import type { PendingLevelUp } from '~/lib/battle-rewards';
import type { CharacterData, CoreRPGStats } from '~/types/rpg-elements';
import type { LootTable } from '~/types/loot';
import type { Resources } from '~/types/resources';
import { FrostyRpgIcon } from '~/components/sprite-icons/frost-icons';
import { NarikWoodBitFont } from '~/components/bitmap-fonts/narik-wood';
import { ToffecButton } from '~/components/ui-custom/toffec-button';

/**
 * Battle Rewards Screen View
 * Shows loot, then exp bar, then level ups for all party members
 */
export function BattleRewardsScreen() {
  const [step, setStep] = useState(1);
  const battleRewardsData = useViewData('battle-rewards');
  const partyActions = usePartyActions();
  const routerActions = useRouterActions();
  const [pendingLevelUps, setPendingLevelUps] = useState<PendingLevelUp[]>([]);
  const [currentLevelUpIndex, setCurrentLevelUpIndex] = useState(0);
  const [randomPotentialStats, setRandomPotentialStats] = useState<CoreRPGStats | null>(null);

  // Handle completion of all level-ups in step 3
  useEffect(() => {
    if (step !== 3) return;

    // No level-ups or all level-ups complete - navigate back
    if (pendingLevelUps.length === 0 || currentLevelUpIndex >= pendingLevelUps.length) {
      setStep(1);
      routerActions.goBack();
      return;
    }

    // Skip characters with 0 pending level-ups
    const currentPending = pendingLevelUps[currentLevelUpIndex];
    if (currentPending && currentPending.pendingLevelUps === 0) {
      setCurrentLevelUpIndex((prev) => prev + 1);
      return;
    }

    // Generate random potential stats for current character if needed
    if (currentPending && currentPending.pendingLevelUps > 0 && !randomPotentialStats) {
      const totalPoints = currentPending.pendingLevelUps * 2;
      const random = getRandomPotentialStats({ ...currentPending.character.potentialStats }, totalPoints);
      setRandomPotentialStats(random);
    }
  }, [step, currentLevelUpIndex, pendingLevelUps, randomPotentialStats, setStep, routerActions]);

  if (!battleRewardsData) {
    return <div className="level-up-screen">Error: No battle rewards data</div>;
  }

  const { lootTable, expReward } = battleRewardsData;

  const earnedResources: Resources = {
    coins: lootTable.resources?.item?.coins || 0,
    gold: lootTable.resources?.item?.gold || 0,
    silver: lootTable.resources?.item?.silver || 0,
    iron: lootTable.resources?.item?.iron || 0,
    copper: lootTable.resources?.item?.copper || 0,
  };
  const hasAnyResources = Object.values(earnedResources).some((v) => v > 0);
  const hasNoItems =
    lootTable.equipableItems.length === 0 && lootTable.consumableItems.length === 0 && !hasAnyResources;

  return (
    <div className="level-up-screen">
      {/* Step 1: Show item rewards (skip to step 2 if no items) */}
      {step === 1 &&
        (hasNoItems ? (
          <SkipToStep2 setStep={setStep} />
        ) : (
          <ItemRewardsScreen lootTable={lootTable} onFinish={() => setStep(2)} />
        ))}

      {/* Step 2: Show exp bar filling up */}
      {step === 2 && (
        <ExpBarFillingUp
          expReward={expReward}
          earnedResources={earnedResources}
          onFinish={(updatedPartyMembers) => {
            // Calculate pending level ups for all party members based on updated EXP
            const pending = calculateLevelUpsForParty(updatedPartyMembers, expReward).filter(
              (pendingLevelUp) => pendingLevelUp.pendingLevelUps > 0,
            );
            setPendingLevelUps(pending);
            setCurrentLevelUpIndex(0);
            setStep(3);
          }}
        />
      )}

      {/* Step 3: Show level ups for each party member */}
      {step === 3 &&
        (() => {
          // Wait for useEffect to handle edge cases
          if (currentLevelUpIndex >= pendingLevelUps.length) {
            return null;
          }

          const currentPending = pendingLevelUps[currentLevelUpIndex];
          if (!currentPending || currentPending.pendingLevelUps === 0 || !randomPotentialStats) {
            // useEffect will handle skipping or generating stats
            return null;
          }

          const totalLevelUps = currentPending.pendingLevelUps;
          const totalPoints = totalLevelUps * 2;

          const charCopy: CharacterData = {
            ...currentPending.character,
            stats: { ...currentPending.character.stats },
            potentialStats: { ...currentPending.character.potentialStats },
          };

          const displayCharacter: CharacterData = {
            ...charCopy,
            level: charCopy.level + totalLevelUps,
            expToNextLevel: currentPending.remainingExp,
          };

          function handleConfirm(allocatedStats: CoreRPGStats) {
            if (!randomPotentialStats) return;
            // Apply the stat changes using the leveling system
            const updatedCharacter = levelUp(charCopy, allocatedStats, randomPotentialStats, totalLevelUps);
            updatedCharacter.expToNextLevel = currentPending.remainingExp;
            partyActions.updateCharacter(currentPending.charId, updatedCharacter);
            // Move to next character
            setCurrentLevelUpIndex((prev) => prev + 1);
            setRandomPotentialStats(null);
          }

          function handleBack() {
            if (!randomPotentialStats) return;
            // Apply level-up with only random stats (no player allocation)
            const updatedCharacter = levelUp(charCopy, { pow: 0, vit: 0, spd: 0 }, randomPotentialStats, totalLevelUps);
            updatedCharacter.expToNextLevel = currentPending.remainingExp;
            partyActions.updateCharacter(currentPending.charId, updatedCharacter);
            setCurrentLevelUpIndex((prev) => prev + 1);
            setRandomPotentialStats(null);
          }

          return (
            <LevelUpView
              character={displayCharacter}
              availablePoints={totalPoints}
              potentialStatPoints={randomPotentialStats || { pow: 0, vit: 0, spd: 0 }}
              onConfirm={handleConfirm}
              onBack={handleBack}
            />
          );
        })()}
    </div>
  );
}

/**
 * Helper component to skip item rewards and advance to EXP step
 */
function SkipToStep2({ setStep }: { setStep: (step: number) => void }) {
  useEffect(() => {
    setStep(2);
  }, [setStep]);
  return null;
}

/**
 * Component to display item rewards
 */
interface ItemRewardsScreenProps {
  lootTable: LootTable;
  onFinish: () => void;
}

const RESOURCE_CONFIG = [
  {
    key: 'coins' as keyof Resources,
    label: 'Coins',
    iconName: 'coinPurse' as const,
    colorClass: 'rewards-resource-row--coins',
  },
  {
    key: 'gold' as keyof Resources,
    label: 'Gold',
    iconName: 'goldBar' as const,
    colorClass: 'rewards-resource-row--gold',
  },
  {
    key: 'silver' as keyof Resources,
    label: 'Silver',
    iconName: 'silverBar' as const,
    colorClass: 'rewards-resource-row--silver',
  },
  {
    key: 'iron' as keyof Resources,
    label: 'Iron',
    iconName: 'ironBar' as const,
    colorClass: 'rewards-resource-row--iron',
  },
  {
    key: 'copper' as keyof Resources,
    label: 'Copper',
    iconName: 'copperBar' as const,
    colorClass: 'rewards-resource-row--copper',
  },
];

interface RewardsResourcesPanelProps {
  earnedResources: Resources;
  currentResources?: Resources;
}

function RewardsResourcesPanel({ earnedResources, currentResources }: RewardsResourcesPanelProps) {
  const activeResources = RESOURCE_CONFIG.filter((r) => earnedResources[r.key] > 0);

  if (activeResources.length === 0) return null;

  return (
    <div className="rewards-resources-panel">
      {activeResources.map((r) => (
        <div key={r.key} className={`rewards-resource-card rewards-resource-card--${r.key}`}>
          <FrostyRpgIcon name={r.iconName} size={24} className="rewards-resource-card__icon" />
          <div className="rewards-resource-card__content">
            <span className="rewards-resource-card__label">{r.label}</span>
            <div className="rewards-resource-card__values">
              <span className="rewards-resource-card__earned number-flow-container">
                <NumberFlow
                  value={earnedResources[r.key]}
                  format={INTEGER_FORMAT}
                  prefix="+"
                  trend={1}
                  spinTiming={SNAPPY_SPIN_TIMING}
                  transformTiming={SNAPPY_TRANSFORM_TIMING}
                  opacityTiming={SNAPPY_OPACITY_TIMING}
                />
              </span>
              {currentResources && (
                <>
                  <span className="rewards-resource-card__arrow">{'\u2192'}</span>
                  <span className="rewards-resource-card__balance number-flow-container">
                    <NumberFlow
                      value={currentResources[r.key] + earnedResources[r.key]}
                      format={INTEGER_FORMAT}
                      trend={1}
                      spinTiming={SNAPPY_SPIN_TIMING}
                      transformTiming={SNAPPY_TRANSFORM_TIMING}
                      opacityTiming={SNAPPY_OPACITY_TIMING}
                    />
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ItemRewardsScreen({ lootTable, onFinish }: ItemRewardsScreenProps) {
  const resources = useResources();
  const resourcesActions = useResourcesActions();
  const inventoryActions = useInventoryActions();

  const earnedResources: Resources = {
    coins: lootTable.resources?.item?.coins || 0,
    gold: lootTable.resources?.item?.gold || 0,
    silver: lootTable.resources?.item?.silver || 0,
    iron: lootTable.resources?.item?.iron || 0,
    copper: lootTable.resources?.item?.copper || 0,
  };

  function handleContinue() {
    // Add resources to store
    if (Object.values(earnedResources).some((v) => v > 0)) {
      resourcesActions.addResources(earnedResources);
    }

    // Add equipment items to inventory
    for (const entry of lootTable.equipableItems) {
      inventoryActions.addItem(entry.item.id, 1);
    }

    // Add consumable items to inventory
    for (const entry of lootTable.consumableItems) {
      inventoryActions.addItem(entry.item.id, 1);
    }

    onFinish();
  }

  return (
    <div className="victory-container">
      <header className="victory-header">
        <p className="rewards-section-eyebrow">Victory</p>
        <h1 className="victory-title rewards-section-title">
          <NarikWoodBitFont text="Loot Summary" size={2} />
        </h1>
      </header>

      <RewardsResourcesPanel earnedResources={earnedResources} currentResources={resources} />

      <div className="items-found-container">
        <h2 className="items-found-header rewards-section-subtitle">
          <NarikWoodBitFont text="Items Found" size={1.2} />
        </h2>
        <ul className="item-list">
          {lootTable.equipableItems?.map((item, index) => (
            <li key={`equip-${index}`} className="item-entry">
              <div className="item-entry-icon">
                {item.item.iconName ? <FrostyRpgIcon name={item.item.iconName} size={32} /> : null}
              </div>
              <span className="item-name">
                1x {item.item?.name || 'Equipment'}
                <span className="item-type">EQUIPMENT</span>
              </span>
            </li>
          ))}
          {lootTable.consumableItems?.map((item, index) => (
            <li key={`consumable-${index}`} className="item-entry">
              <div className="item-entry-icon">
                {item.item.iconName ? <FrostyRpgIcon name={item.item.iconName} size={32} /> : null}
              </div>
              <span className="item-name">
                1x {item.item?.name || 'Consumable'}
                <span className="item-type">CONSUMABLE</span>
              </span>
            </li>
          ))}
        </ul>
      </div>

      <ToffecButton variant="cream" onClick={handleContinue} className="self-end">
        Continue
      </ToffecButton>
    </div>
  );
}

/**
 * Component to show exp bar filling up
 */
interface ExpBarFillingUpProps {
  expReward: number;
  earnedResources: Resources;
  onFinish: (updatedPartyMembers: CharacterData[]) => void;
}

function ExpBarFillingUp({ expReward, earnedResources, onFinish }: ExpBarFillingUpProps) {
  const partyMembers = useParty();
  const partyActions = usePartyActions();
  const [progress, setProgress] = useState(0);

  // Pre-calculate which characters will level up
  const [levelUpSet] = useState(() => {
    const preview = partyMembers.map((member) => ({
      ...member,
      expToNextLevel: member.expToNextLevel + expReward,
    }));
    const pending = calculateLevelUpsForParty(preview, expReward);
    return new Set(pending.filter((p) => p.pendingLevelUps > 0).map((p) => p.charId));
  });

  function handleContinue() {
    // Apply exp to all party members and compute the updated party snapshot
    const updatedPartyMembers: CharacterData[] = partyMembers.map((member) => {
      const updatedMember: CharacterData = {
        ...member,
        expToNextLevel: member.expToNextLevel + expReward,
      };
      partyActions.updateCharacter(member.id, updatedMember);
      return updatedMember;
    });

    onFinish(updatedPartyMembers);
  }

  // Animate the exp bar
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        const next = prev + 2;
        if (next >= 100) {
          clearInterval(interval);
          return 100;
        }
        return next;
      });
    }, 30);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="exp-gained-container">
      <header className="exp-gained-header">
        <p className="rewards-section-eyebrow">Battle Report</p>
        <h1 className="exp-gained-title rewards-section-title">
          <NarikWoodBitFont text="Exp Gained" size={2} />
        </h1>
        <div className="exp-gained-amount number-flow-container">
          <NumberFlow
            value={expReward}
            format={INTEGER_FORMAT}
            prefix="+"
            trend={1}
            spinTiming={SNAPPY_SPIN_TIMING}
            transformTiming={SNAPPY_TRANSFORM_TIMING}
            opacityTiming={SNAPPY_OPACITY_TIMING}
          />
        </div>
      </header>

      <div className="character-cards-grid">
        {partyMembers.slice(0, 4).map((member) => (
          <div key={member.id} className="character-card">
            <img src="/assets/portraits/Innkeeper_02.png" alt={member.name} className="character-portrait pixel-art" />
            <div className="character-info">
              <h3 className="character-name">{member.name}</h3>
              <div className="character-level">Lv {member.level}</div>
              <div className="exp-gained-text">EXP +{expReward}</div>
              <div className="exp-progress-bar">
                <div className="exp-progress-fill" style={{ width: `${progress}%` }} />
              </div>
            </div>
            {levelUpSet.has(member.id) && <div className="level-up-badge">LEVEL UP!</div>}
          </div>
        ))}
      </div>

      <RewardsResourcesPanel earnedResources={earnedResources} />

      <ToffecButton variant="cream" onClick={handleContinue} className="self-center">
        Finish
      </ToffecButton>
    </div>
  );
}
