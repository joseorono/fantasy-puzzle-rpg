import { useState } from 'react';
import { LevelUpView } from './level-up-view';
import type { CharacterData, CoreRPGStats } from '~/types/rpg-elements';
import { levelUp, getRandomPotentialStats } from '~/lib/leveling-system';
import { useParty, usePartyActions } from '~/stores/game-store';

/**
 * Demo component to test the Level Up Screen
 * This creates a mock character and allows testing the level up functionality
 */
interface LevelUpDemoProps {
  id: string;
}
export function LevelUpDemo({ id }: LevelUpDemoProps) {
  const partyMembers = useParty();
  const character = partyMembers.find((member) => member.id === id);
  const partyActions = usePartyActions();
  const [availablePoints, setAvailablePoints] = useState(5);
  const [showDemo, setShowDemo] = useState(true);

  if (!character) {
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
        <h1 style={{ fontSize: '2rem', color: '#ffc107' }}>Character Not Found</h1>
        <p>Could not find character with ID: {id}</p>
      </div>
    );
  }

  const charCopy: CharacterData = {
    ...character,
    stats: { ...character.stats },
    potentialStats: { ...character.potentialStats },
  };
  const randomPotentialStats = getRandomPotentialStats(charCopy.potentialStats, 2);
  console.log(randomPotentialStats);
  function handleConfirm(allocatedStats: CoreRPGStats) {
    // Apply the stat changes using the leveling system
    const updatedCharacter = levelUp(charCopy, allocatedStats, randomPotentialStats, 1);

    partyActions.updateCharacter(id, updatedCharacter);

    // Deduct the points
    const pointsUsed = allocatedStats.pow + allocatedStats.vit + allocatedStats.spd;
    setAvailablePoints((prev) => prev - pointsUsed);
  }

  function handleBack() {
    setShowDemo(false);
  }

  function handleResetDemo() {
    if (!character) return;
    partyActions.updateCharacter(id, character);
    setAvailablePoints(5);
    setShowDemo(true);
  }
  if (!showDemo) {
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
        <h1 style={{ fontSize: '2rem', color: '#ffc107' }}>Level Up Demo Closed</h1>
        <p>
          Current Stats: POW {character.stats.pow} | VIT {character.stats.vit} | SPD {character.stats.spd}
        </p>
        <p>Points Remaining: {availablePoints}</p>
        <button
          onClick={handleResetDemo}
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
          Restart Demo
        </button>
      </div>
    );
  }

  return (
    <LevelUpView
      character={charCopy}
      availablePoints={availablePoints}
      potentialStatPoints={randomPotentialStats}
      onConfirm={handleConfirm}
      onBack={handleBack}
    />
  );
}
