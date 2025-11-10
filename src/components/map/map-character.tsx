import { useEffect, useState } from 'react';
import type { CharacterPosition, Direction, MapData } from '~/types/map';
import { WALKABLE_TILES } from '~/constants/maps';

interface MapCharacterProps {
  charLocation: CharacterPosition;
  mapData: MapData;
  onMove?: (newPosition: CharacterPosition) => void;
}

export function MapCharacter({ charLocation, mapData, onMove }: MapCharacterProps) {
  const [position, setPosition] = useState<CharacterPosition>(charLocation);

  // Sync with external charLocation prop changes
  useEffect(() => {
    setPosition(charLocation);
  }, [charLocation]);

  const isValidMove = (row: number, col: number): boolean => {
    // Check bounds
    if (row < 0 || row >= mapData.length) return false;
    if (col < 0 || col >= mapData[0].length) return false;

    // Check if tile is walkable
    const tile = mapData[row][col];
    return WALKABLE_TILES.has(tile);
  };

  const moveCharacter = (direction: Direction) => {
    let newRow = position.row;
    let newCol = position.col;

    switch (direction) {
      case 'up':
        newRow -= 1;
        break;
      case 'down':
        newRow += 1;
        break;
      case 'left':
        newCol -= 1;
        break;
      case 'right':
        newCol += 1;
        break;
    }

    if (isValidMove(newRow, newCol)) {
      const newPosition = { row: newRow, col: newCol };
      setPosition(newPosition);
      onMove?.(newPosition);
    }
  };

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      // Prevent default scrolling behavior
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
        event.preventDefault();
      }

      switch (event.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          moveCharacter('up');
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          moveCharacter('down');
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          moveCharacter('left');
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          moveCharacter('right');
          break;
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  });

  // Calculate pixel position based on grid position
  const topPosition = position.row * 48 + 8; // 48px tile + 8px padding
  const leftPosition = position.col * 48 + 8;

  return (
    <div
      className="pointer-events-none absolute z-10 flex flex-1 items-center justify-center transition-all duration-150 ease-out"
      style={{
        top: `${topPosition}px`,
        left: `${leftPosition}px`,
      }}
    >
      <div className="animate-bounce text-3xl drop-shadow-lg">🧙</div>
    </div>
  );
}

