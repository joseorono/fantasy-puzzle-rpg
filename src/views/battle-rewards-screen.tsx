import { useState, useEffect, type CSSProperties } from 'react';
import NumberFlow from '@number-flow/react';
import {
  SNAPPY_SPIN_TIMING,
  SNAPPY_TRANSFORM_TIMING,
  SNAPPY_OPACITY_TIMING,
  EXP_COUNTER_TIMING,
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
import {
  levelUp,
  getRandomPotentialStats,
  buildExpGainTimeline,
  getExpThresholdForLevel,
} from '~/lib/leveling-system';
import { getNewlyUnlockableSkills } from '~/lib/skill-system';
import { useUnlockSkill } from '~/hooks/use-unlock-skill';
import { useExpGainAnimation } from '~/hooks/use-exp-gain-animation';
import { LevelTag } from '~/components/ui-custom/level-tag';
import type { PendingLevelUp } from '~/lib/battle-rewards';
import type { CharacterData, CoreRPGStats } from '~/types/rpg-elements';
import type { LootTable } from '~/types/loot';
import type { Resources } from '~/types/resources';
import { FrostyRpgIcon } from '~/components/sprite-icons/frost-icons';
import { getRarityColor, getRarityLabel } from '~/lib/rarity';
import { RESOURCE_DISPLAY_ORDER, RESOURCE_ICON_NAMES, RESOURCE_LABELS } from '~/constants/resources';
import { NarikWoodBitFont } from '~/components/bitmap-fonts/narik-wood';
import { ToffecButton } from '~/components/ui-custom/toffec-button';
import { RetroDivider } from '~/components/ui-custom/retro-divider';
import { ExperienceBar } from '~/components/ui/experience-bar';
import { soundService } from '~/services/sound-service';
import { SoundNames } from '~/constants/audio';

/**
 * Play the level-up jingle, throttled so the up-to-four party cards crossing a level on
 * the same frame collapse into a single play instead of stacking into a loud blare.
 * Sequential level-ups (≥ a segment apart) still each get their own play.
 */
let lastLevelUpSoundAt = -Infinity;
function playLevelUpSound() {
  const now = performance.now();
  if (now - lastLevelUpSoundAt < 120) return;
  lastLevelUpSoundAt = now;
  soundService.playSound(SoundNames.levelUp, 0.8);
}

/**
 * Battle Rewards Screen View
 * Shows loot, then exp bar, then level ups for all party members
 */
export function BattleRewardsScreen() {
  const [step, setStep] = useState(1);
  const battleRewardsData = useViewData('battle-rewards');
  const partyActions = usePartyActions();
  const { unlock } = useUnlockSkill();
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

          // Auto-unlock any skills the character now qualifies for by level.
          function unlockLevelSkills(leveledCharacter: CharacterData) {
            for (const skill of getNewlyUnlockableSkills(leveledCharacter, leveledCharacter.level)) {
              unlock(leveledCharacter.id, skill.id);
            }
          }

          function handleConfirm(allocatedStats: CoreRPGStats) {
            if (!randomPotentialStats) return;
            // Apply the stat changes using the leveling system
            const updatedCharacter = levelUp(charCopy, allocatedStats, randomPotentialStats, totalLevelUps);
            updatedCharacter.expToNextLevel = currentPending.remainingExp;
            partyActions.updateCharacter(currentPending.charId, updatedCharacter);
            unlockLevelSkills(updatedCharacter);
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
            unlockLevelSkills(updatedCharacter);
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

const RESOURCE_CONFIG = RESOURCE_DISPLAY_ORDER.map((key) => ({
  key,
  label: RESOURCE_LABELS[key],
  iconName: RESOURCE_ICON_NAMES[key],
}));

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

    // Add equipment items to inventory, carrying each drop's rolled rarity
    for (const entry of lootTable.equipableItems) {
      inventoryActions.addItem(entry.item.id, 1, entry.rarity);
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
              <span className="item-name" style={{ color: getRarityColor(item.rarity) }}>
                1x {item.item?.name || 'Equipment'}
                <span className="item-type" style={{ color: getRarityColor(item.rarity), borderColor: getRarityColor(item.rarity) }}>
                  {getRarityLabel(item.rarity)}
                </span>
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

  return (
    <div className="exp-gained-container">
      <header className="exp-gained-header">
        <p className="rewards-section-eyebrow">Battle Report</p>
        <h1 className="exp-gained-title rewards-section-title">
          <NarikWoodBitFont text="Exp Gained" size={2} />
        </h1>
        {/* EXP total on a tan ribbon banner (reuses the title-sign artwork) so it reads
            as a labelled reward rather than a bare number. */}
        <div
          className="exp-gained-ribbon title-sign title-sign--tan title-sign--text-dark"
          style={{ '--ts-scale': 0.42 } as CSSProperties}
        >
          <span className="title-sign__text pixel-font number-flow-container">
            <NumberFlow
              value={expReward}
              format={INTEGER_FORMAT}
              prefix="+"
              suffix=" EXP"
              trend={1}
              spinTiming={SNAPPY_SPIN_TIMING}
              transformTiming={SNAPPY_TRANSFORM_TIMING}
              opacityTiming={SNAPPY_OPACITY_TIMING}
            />
          </span>
        </div>
      </header>

      <div className="character-cards-grid">
        {partyMembers.slice(0, 4).map((member) => (
          <CharacterExpCard key={member.id} member={member} expReward={expReward} />
        ))}
      </div>

      <RetroDivider variant="gold" className="rewards-divider" />

      <RewardsResourcesPanel earnedResources={earnedResources} />

      <ToffecButton variant="cream" onClick={handleContinue} className="self-end">
        Finish
      </ToffecButton>
    </div>
  );
}

/**
 * A single party member's reward card: drives its EXP bar through the character's real
 * gain timeline, popping the "Level Up" badge each time the bar actually crosses a level.
 */
interface CharacterExpCardProps {
  member: CharacterData;
  expReward: number;
}

function CharacterExpCard({ member, expReward }: CharacterExpCardProps) {
  // Build the timeline once so the rAF animation has a stable input.
  const [timeline] = useState(() => buildExpGainTimeline(member, expReward));
  const { percentage, level, badgeKey, hasLeveledUp } = useExpGainAnimation(timeline, {
    onLevelUp: playLevelUpSound,
  });

  // Derived straight from `percentage` (the same value driving the bar's width), so these
  // numbers are mathematically locked to the bar's fill — same easing, same duration, every frame.
  const expThreshold = getExpThresholdForLevel(level);
  const currentExp = Math.round((percentage / 100) * expThreshold);
  const missingExp = Math.max(0, expThreshold - currentExp);

  return (
    <div className="character-card">
      {/* Portrait carries the level on a hanging pennant tag in the top-left corner. */}
      <div className="reward-portrait">
        <img src="/assets/portraits/Innkeeper_02.png" alt={member.name} className="character-portrait pixel-art" />
        <LevelTag level={level} />
      </div>
      <div className="character-info">
        <h3 className="character-name">{member.name}</h3>
        <div className="reward-sub pixel-font">
          <span className="reward-level">Lv {level}</span>
          <span className="reward-class">{member.class}</span>
        </div>
        <ExperienceBar percentage={percentage} variant="compact" />
        <div className="reward-exp-numbers pixel-font">
          <span className="reward-exp-numbers__have number-flow-container">
            <NumberFlow
              value={currentExp}
              format={INTEGER_FORMAT}
              trend={1}
              spinTiming={EXP_COUNTER_TIMING}
              transformTiming={EXP_COUNTER_TIMING}
              opacityTiming={EXP_COUNTER_TIMING}
            />
            <span className="reward-exp-numbers__unit">EXP</span>
          </span>
          <span className="reward-exp-numbers__missing number-flow-container">
            <NumberFlow
              value={missingExp}
              format={INTEGER_FORMAT}
              trend={-1}
              spinTiming={EXP_COUNTER_TIMING}
              transformTiming={EXP_COUNTER_TIMING}
              opacityTiming={EXP_COUNTER_TIMING}
            />
            <span className="reward-exp-numbers__unit">Next Lv</span>
          </span>
        </div>
      </div>
      {hasLeveledUp && (
        // The bookmark animates once when it first appears (no key on the container),
        // while the inner text re-keys on every level-up so it pops again — a live
        // signal that you're still leveling.
        <div className="level-up-badge level-up-badge--pop">
          <span key={badgeKey} className="level-up-badge__text">
            Level Up
          </span>
        </div>
      )}
    </div>
  );
}
