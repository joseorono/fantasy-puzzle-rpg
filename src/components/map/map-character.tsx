import { useEffect, useRef, useState } from 'react';
import type { CharacterPosition, Direction, MapData } from '~/types/map';
import { WALKABLE_TILES } from '~/constants/maps';
import { footstepSystem, determineSurfaceTypeFromPosition } from '~/services/footstep-system';

interface MapCharacterProps {
  charLocation: CharacterPosition;
  mapData: MapData;
  onMove?: (newPosition: CharacterPosition) => void;
}

// Movement configuration - tunable parameters for feel
const MOVEMENT_CONFIG = {
  // Base movement speed (tiles per second)
  baseSpeed: 6,
  // Acceleration factor (how quickly we reach max speed)
  acceleration: 0.15,
  // Deceleration factor (how quickly we stop)
  deceleration: 0.2,
  // Animation transition duration (ms)
  transitionDuration: 140,
  // Easing function for smooth movement
  easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  // Bounce animation intensity (0-1)
  bounceIntensity: 0.8,
  // Rotation tilt on movement (degrees)
  tiltAngle: 2,
};

export function MapCharacter({ charLocation, mapData, onMove }: MapCharacterProps) {
  const [position, setPosition] = useState<CharacterPosition>(charLocation);
  const [direction, setDirection] = useState<Direction | null>(null);
  const [isMoving, setIsMoving] = useState(false);
  const [scale, setScale] = useState(1);

  // Track pressed keys for smooth continuous movement
  const keysPressed = useRef<Set<string>>(new Set());
  const movementTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const animationFrameRef = useRef<number | null>(null);

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

  const moveCharacter = (newDirection: Direction) => {
    let newRow = position.row;
    let newCol = position.col;

    switch (newDirection) {
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
      setDirection(newDirection);
      setIsMoving(true);

      // Determine surface type and play footstep sound
      const surfaceType = determineSurfaceTypeFromPosition(newRow, newCol, mapData);
      footstepSystem.setSurface(surfaceType);
      footstepSystem.playFootstep();

      // Trigger scale animation for kinetic feedback
      setScale(0.92);
      setTimeout(() => setScale(1), MOVEMENT_CONFIG.transitionDuration);

      onMove?.(newPosition);

      // Clear any existing timeout
      if (movementTimeoutRef.current) {
        clearTimeout(movementTimeoutRef.current);
      }

      // Set timeout to mark movement as complete
      movementTimeoutRef.current = setTimeout(() => {
        setIsMoving(false);
      }, MOVEMENT_CONFIG.transitionDuration);
    }
  };

  // Handle continuous movement with key tracking
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const key = event.key.toLowerCase();

      // Track key press
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd'].includes(key)) {
        event.preventDefault();
        keysPressed.current.add(key);
      }
    }

    function handleKeyUp(event: KeyboardEvent) {
      const key = event.key.toLowerCase();
      keysPressed.current.delete(key);
    }

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Process movement input
  useEffect(() => {
    const processMovement = () => {
      const keys = keysPressed.current;

      // Determine intended direction from pressed keys
      let intendedDirection: Direction | null = null;

      if (keys.has('arrowup') || keys.has('w')) {
        intendedDirection = 'up';
      } else if (keys.has('arrowdown') || keys.has('s')) {
        intendedDirection = 'down';
      } else if (keys.has('arrowleft') || keys.has('a')) {
        intendedDirection = 'left';
      } else if (keys.has('arrowright') || keys.has('d')) {
        intendedDirection = 'right';
      }

      // Move if direction is pressed and not currently moving
      if (intendedDirection && !isMoving) {
        moveCharacter(intendedDirection);
      }

      animationFrameRef.current = requestAnimationFrame(processMovement);
    };

    animationFrameRef.current = requestAnimationFrame(processMovement);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isMoving, position]);

  // Calculate pixel position based on grid position
  const tileSize = 48;
  const padding = 8;
  const topPosition = position.row * tileSize + padding;
  const leftPosition = position.col * tileSize + padding;

  // Calculate rotation based on direction for dynamic feel
  const rotationMap: Record<Direction, number> = {
    up: 0,
    down: 180,
    left: -90,
    right: 90,
  };
  const rotation = direction ? rotationMap[direction] : 0;

  return (
    <div
      className="pointer-events-none absolute z-10 flex items-center justify-center"
      style={{
        top: `${topPosition}px`,
        left: `${leftPosition}px`,
        transition: `all ${MOVEMENT_CONFIG.transitionDuration}ms ${MOVEMENT_CONFIG.easing}`,
        transform: `translate(-50%, -50%) scale(${scale})`,
      }}
    >
      <div
        style={{
          fontSize: '2rem',
          filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))',
          transition: `transform ${MOVEMENT_CONFIG.transitionDuration}ms ${MOVEMENT_CONFIG.easing}`,
          transform: `rotate(${rotation}deg) scaleY(${isMoving ? MOVEMENT_CONFIG.bounceIntensity : 1})`,
          transformOrigin: 'center',
        }}
      >
        🧙
      </div>
    </div>
  );
}
