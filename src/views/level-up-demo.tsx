import { useState } from 'react';
import { LevelUpView } from './level-up-view';
import type { CharacterData, CoreRPGStats } from '~/types/rpg-elements';

/**
 * Demo component to test the Level Up Screen
 * This creates a mock character and allows testing the level up functionality
 */
export function LevelUpDemo() {
  const [character, setCharacter] = useState<CharacterData>({
    id: 'demo-character',
    name: 'Alistair the Brave',
    class: 'warrior',
    color: 'blue',
    level: 5,
    baseHp: 100,
    maxHp: 200,
    currentHp: 200,
    stats: {
      pow: 25,
      vit: 20,
      spd: 15,
    },
    potentialStats: {
      pow: 50,
      vit: 50,
      spd: 50,
    },
    vitHpMultiplier: 5,
    skillCooldown: 0,
    maxCooldown: 8,
    expToNextLevel: 1500,
  });

  const [availablePoints, setAvailablePoints] = useState(5);
  const [showDemo, setShowDemo] = useState(true);

  function handleConfirm(allocatedStats: CoreRPGStats) {
    // Apply the stat changes
    setCharacter((prev) => ({
      ...prev,
      stats: {
        pow: prev.stats.pow + allocatedStats.pow,
        vit: prev.stats.vit + allocatedStats.vit,
        spd: prev.stats.spd + allocatedStats.spd,
      },
      // Recalculate max HP if vitality changed
      maxHp: allocatedStats.vit > 0 
        ? prev.maxHp + (allocatedStats.vit * prev.vitHpMultiplier)
        : prev.maxHp,
      currentHp: allocatedStats.vit > 0
        ? prev.currentHp + (allocatedStats.vit * prev.vitHpMultiplier)
        : prev.currentHp,
    }));

    // Deduct the points
    const pointsUsed = allocatedStats.pow + allocatedStats.vit + allocatedStats.spd;
    setAvailablePoints((prev) => prev - pointsUsed);

    alert(`Stats updated! POW +${allocatedStats.pow}, VIT +${allocatedStats.vit}, SPD +${allocatedStats.spd}`);
  }

  function handleBack() {
    setShowDemo(false);
  }

  function handleResetDemo() {
    setCharacter({
      id: 'demo-character',
      name: 'Alistair the Brave',
      class: 'warrior',
      color: 'blue',
      level: 5,
      baseHp: 100,
      maxHp: 200,
      currentHp: 200,
      stats: {
        pow: 25,
        vit: 20,
        spd: 15,
      },
      potentialStats: {
        pow: 50,
        vit: 50,
        spd: 50,
      },
      vitHpMultiplier: 5,
      skillCooldown: 0,
      maxCooldown: 8,
      expToNextLevel: 1500,
    });
    setAvailablePoints(5);
    setShowDemo(true);
  }

  if (!showDemo) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100vh',
        background: 'linear-gradient(135deg, #1a1d29 0%, #2d3142 100%)',
        color: '#e0e0e0',
        fontFamily: 'Cinzel, serif',
        gap: '2rem'
      }}>
        <h1 style={{ fontSize: '2rem', color: '#ffc107' }}>Level Up Demo Closed</h1>
        <p>Current Stats: POW {character.stats.pow} | VIT {character.stats.vit} | SPD {character.stats.spd}</p>
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
      character={character}
      availablePoints={availablePoints}
      onConfirm={handleConfirm}
      onBack={handleBack}
    />
  );
}
