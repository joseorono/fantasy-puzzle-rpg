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
    return <div>Error: No battle rewards data</div>;
  }

  const { lootTable, expReward } = battleRewardsData;

  // Step 1: Show item rewards
  if (step === 1) {
    return <ItemRewardsScreen lootTable={lootTable} onFinish={() => setStep(2)} />;
  }

  // Step 2: Show exp bar filling up
  if (step === 2) {
    return (
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
    );
  }

  // Step 3: Show level ups for each party member
  if (step === 3) {
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
  }

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

  return (
    <div className="level-up-screen" style={{ backgroundColor: '#1a1410' }}>
      <header className="level-up-header">
        <h1 className="level-up-title pixel-font text-base sm:text-lg">REWARDS</h1>
      </header>

      <div
        className="level-up-content"
        style={{ flexDirection: 'column', gap: '1.5rem', padding: '2rem', position: 'relative' }}
      >
        <div style={{ display: 'flex', gap: '1rem' }}>
          <div
            className="character-info-panel"
            style={{ flex: 1, padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <span className="pixel-font text-sm">Received Coins</span>
            <span className="pixel-font text-sm" style={{ fontWeight: 'bold', color: '#ffd700' }}>
              {coinsReceived}
            </span>
          </div>
          <div
            className="character-info-panel"
            style={{ flex: 1, padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <span className="pixel-font text-sm">Current Coins</span>
            <span className="pixel-font text-sm" style={{ fontWeight: 'bold', color: '#ffd700' }}>
              0
            </span>
          </div>
        </div>

        <div className="character-info-panel" style={{ padding: '1rem', flex: 1 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              borderBottom: '1px solid #4a4a4a',
              paddingBottom: '0.5rem',
              marginBottom: '0.5rem',
            }}
          >
            <span className="pixel-font text-xs" style={{ color: '#aaa' }}>
              ITEM
            </span>
            <span className="pixel-font text-xs" style={{ color: '#aaa' }}>
              NUM
            </span>
          </div>
          {lootTable.equipableItems?.map((item: any, index: number) => (
            <div
              key={`equip-${index}`}
              style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', alignItems: 'center' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.2rem' }}>⚔️</span>
                <span className="pixel-font text-sm">{item.item?.name || 'Equipment'}</span>
              </div>
              <span className="pixel-font text-sm">{item.probability || 1}</span>
            </div>
          ))}
          {lootTable.consumableItems?.map((item: any, index: number) => (
            <div
              key={`consumable-${index}`}
              style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', alignItems: 'center' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.2rem' }}>💎</span>
                <span className="pixel-font text-sm">{item.item?.name || 'Consumable'}</span>
              </div>
              <span className="pixel-font text-sm">{item.probability || 1}</span>
            </div>
          ))}
        </div>

        <button
          onClick={onFinish}
          className="pixel-font text-xs"
          style={{
            position: 'absolute',
            bottom: '1rem',
            right: '1rem',
            padding: '0.5rem 1rem',
            background: 'rgba(74, 158, 255, 0.8)',
            border: '2px solid #4a9eff',
            borderRadius: '4px',
            color: '#fff',
            cursor: 'pointer',
            fontWeight: 'bold',
          }}
        >
          Continue
        </button>
      </div>
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
    <div className="level-up-screen" style={{ backgroundColor: '#1a1410' }}>
      <header className="level-up-header">
        <h1 className="level-up-title pixel-font text-base sm:text-lg">REWARDS</h1>
      </header>

      <div
        className="level-up-content"
        style={{ flexDirection: 'column', gap: '1.5rem', padding: '2rem', position: 'relative' }}
      >
        <div style={{ display: 'flex', gap: '1rem' }}>
          <div
            className="character-info-panel"
            style={{ flex: 1, padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <span className="pixel-font text-sm">EXP</span>
            <span className="pixel-font text-sm" style={{ fontWeight: 'bold', color: '#ffd700' }}>
              {expReward}
            </span>
          </div>
          <div
            className="character-info-panel"
            style={{ flex: 1, padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <span className="pixel-font text-sm">AP</span>
            <span className="pixel-font text-sm" style={{ fontWeight: 'bold', color: '#ffd700' }}>
              100
            </span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', flex: 1 }}>
          {partyMembers.slice(0, 4).map((member) => (
            <div
              key={member.id}
              className="character-info-panel"
              style={{ padding: '1rem', display: 'flex', gap: '1rem' }}
            >
              <div style={{ width: '80px', height: '80px', borderRadius: '4px', overflow: 'hidden' }}>
                <img
                  src="/assets/portraits/Innkeeper_02.png"
                  alt={member.name}
                  className="pixel-art"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span className="pixel-font text-sm" style={{ fontWeight: 'bold' }}>
                    {member.name}
                  </span>
                  <span className="pixel-font text-xs" style={{ color: '#aaa' }}>
                    Lv {member.level}
                  </span>
                </div>
                <div className="progress-section">
                  <div className="stat-label pixel-font text-xs">EXP</div>
                  <div className="exp-bar-container">
                    <div className="exp-bar" style={{ width: `${progress}%` }} />
                    <div className="bar-text pixel-font text-xs">
                      {member.expToNextLevel} / {Math.floor(Math.exp(member.level))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={handleContinue}
          className="pixel-font text-xs"
          style={{
            position: 'absolute',
            bottom: '1rem',
            right: '1rem',
            padding: '0.5rem 1rem',
            background: 'rgba(74, 158, 255, 0.8)',
            border: '2px solid #4a9eff',
            borderRadius: '4px',
            color: '#fff',
            cursor: 'pointer',
            fontWeight: 'bold',
          }}
        >
          Continue
        </button>
      </div>
    </div>
  );
}
