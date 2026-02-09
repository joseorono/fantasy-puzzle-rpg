import { useState, useEffect } from 'react';
import { useAtom } from 'jotai';
import { atom } from 'jotai';
import { useParty, usePartyActions, useRouterActions, useViewData } from '~/stores/game-store';
import { calculateLevelUpsForParty } from '~/lib/battle-rewards';
import { LevelUpView } from './level-up-view';
import { levelUp, getRandomPotentialStats } from '~/lib/leveling-system';
import type { PendingLevelUp } from '~/lib/battle-rewards';
import type { CharacterData, CoreRPGStats } from '~/types/rpg-elements';

/**
 * Atom to track the current step in the battle rewards flow
 */
export const rewardsStepAtom = atom(1);

/**
 * Battle Rewards Screen View
 * Shows loot, then exp bar, then level ups for all party members
 */
export function BattleRewardsScreen() {
  const [step, setStep] = useAtom(rewardsStepAtom);
  const battleRewardsData = useViewData('battle-rewards');
  const partyActions = usePartyActions();
  const routerActions = useRouterActions();
  const [pendingLevelUps, setPendingLevelUps] = useState<PendingLevelUp[]>([]);
  const [currentLevelUpIndex, setCurrentLevelUpIndex] = useState(0);
  const [randomPotentialStats, setRandomPotentialStats] = useState<CoreRPGStats | null>(null);

  if (!battleRewardsData) {
    return <div className="level-up-screen">Error: No battle rewards data</div>;
  }

  const { lootTable, expReward } = battleRewardsData;

  const coinsReceived = lootTable.resources?.item?.coins || 0;
  const hasNoItems =
    lootTable.equipableItems.length === 0 && lootTable.consumableItems.length === 0 && coinsReceived === 0;

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
          if (currentLevelUpIndex >= pendingLevelUps.length) {
            // All level ups complete, go back or to next screen
            return (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100vh',
                  background: 'linear-gradient(135deg, #1a1d29 0%, #2d3142 100%)',
                  color: '#e0e0e0',
                  fontFamily: 'Cinzel, serif',
                  gap: '2rem',
                }}
              >
                <h1 style={{ fontSize: '2rem', color: '#ffc107' }}>All Level Ups Complete!</h1>
                <button
                  onClick={() => {
                    setStep(1);
                    routerActions.goBack();
                  }}
                  style={{
                    padding: '1rem 2rem',
                    background: '#ffc107',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#1a1d29',
                    fontWeight: 700,
                    fontSize: '1rem',
                    cursor: 'pointer',
                  }}
                >
                  Continue
                </button>
              </div>
            );
          }

          const currentPending = pendingLevelUps[currentLevelUpIndex];
          const totalLevelUps = currentPending.pendingLevelUps;
          const totalPoints = totalLevelUps * 2;

          if (totalLevelUps === 0) {
            // No level ups for this character, skip to next
            setCurrentLevelUpIndex((prev) => prev + 1);
            return null;
          }

          // Generate random potential stats for this character if not already done
          if (!randomPotentialStats) {
            const charCopy: CharacterData = {
              ...currentPending.character,
              stats: { ...currentPending.character.stats },
              potentialStats: { ...currentPending.character.potentialStats },
            };
            const random = getRandomPotentialStats({ ...charCopy.potentialStats }, totalPoints);
            setRandomPotentialStats(random);
          }

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
            // Move to next character
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
  lootTable: any;
  onFinish: () => void;
}

function ItemRewardsScreen({ lootTable, onFinish }: ItemRewardsScreenProps) {
  const coinsReceived = lootTable.resources?.item?.coins || 0;
  const totalCoins = 42850; // This should come from game state, hardcoded for now

  return (
    <div className="victory-container">
      <header className="victory-header">
        <h1 className="victory-title">Victory! Loot Summary</h1>
      </header>

      <div className="gold-summary">
        <div className="gold-box">
          <div className="gold-box-title">Gold Earned</div>
          <div className="gold-box-amount">+{coinsReceived.toLocaleString()}</div>
        </div>
        <div className="gold-box">
          <div className="gold-box-title">Total Gold Balance</div>
          <div className="gold-box-amount">{totalCoins.toLocaleString()}</div>
        </div>
      </div>

      <div className="items-found-container">
        <h2 className="items-found-header">Items Found</h2>
        <ul className="item-list">
          {lootTable.equipableItems?.map((item: any, index: number) => (
            <li key={`equip-${index}`} className="item-entry">
              <span className="item-name">
                {item.probability || 1}x {item.item?.name || 'Equipment'}
                <span className="item-type">EQUIPMENT</span>
              </span>
            </li>
          ))}
          {lootTable.consumableItems?.map((item: any, index: number) => (
            <li key={`consumable-${index}`} className="item-entry">
              <span className="item-name">
                {item.probability || 1}x {item.item?.name || 'Consumable'}
                <span className="item-type">CONSUMABLE</span>
              </span>
            </li>
          ))}
        </ul>
      </div>

      <button onClick={onFinish} className="continue-button">
        Continue
        <span className="arrow-icon">→</span>
      </button>
    </div>
  );
}

/**
 * Component to show exp bar filling up
 */
interface ExpBarFillingUpProps {
  expReward: number;
  onFinish: (updatedPartyMembers: CharacterData[]) => void;
}

function ExpBarFillingUp({ expReward, onFinish }: ExpBarFillingUpProps) {
  const partyMembers = useParty();
  const partyActions = usePartyActions();
  const [progress, setProgress] = useState(0);

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
        <h1 className="exp-gained-title">EXP GAINED</h1>
        <div className="exp-gained-amount">{expReward}</div>
      </header>

      <div className="character-cards-grid">
        {partyMembers.slice(0, 4).map((member) => {
          const shouldLevelUp = Math.random() > 0.5; // Random level up for demo
          return (
            <div key={member.id} className="character-card">
              <img
                src="/assets/portraits/Innkeeper_02.png"
                alt={member.name}
                className="character-portrait pixel-art"
              />
              <div className="character-info">
                <h3 className="character-name">{member.name}</h3>
                <div className="character-level">Lv {member.level}</div>
                <div className="exp-gained-text">EXP +{expReward}</div>
                <div className="exp-progress-bar">
                  <div className="exp-progress-fill" style={{ width: `${progress}%` }} />
                </div>
              </div>
              {shouldLevelUp && <div className="level-up-badge">LEVEL UP!</div>}
            </div>
          );
        })}
      </div>

      <div className="gold-section">
        <div className="gold-icon">₵</div>
        <div className="gold-amount">GOLD OBTAINED {Math.floor(expReward * 0.8)}</div>
      </div>

      <button onClick={handleContinue} className="finish-button">
        FINISH
      </button>
    </div>
  );
}
