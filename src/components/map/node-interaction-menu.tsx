import { Sword, Home, BookOpen, Crown, Skull, HelpCircle, ShoppingCart } from 'lucide-react';
import type { InteractiveMapNode } from '~/types/map-node';
import type { MapNodeType } from '~/stores/slices/map-progress.types';

interface NodeInteractionMenuProps {
  node: InteractiveMapNode;
  isCompleted: boolean;
  onFight?: () => void;
  onEnter?: () => void;
  onViewDialogue?: () => void;
  characterPosition: { x: number; y: number }; // Pixel position on screen
}

/**
 * Floating menu for interacting with map nodes
 */
export function NodeInteractionMenu({
  node,
  isCompleted,
  onFight,
  onEnter,
  onViewDialogue,
  characterPosition,
}: NodeInteractionMenuProps) {
  const getNodeIcon = (type: MapNodeType) => {
    switch (type) {
      case 'Battle':
        return <Sword className="h-5 w-5" />;
      case 'Boss':
        return <Crown className="h-5 w-5" />;
      case 'Town':
        return <Home className="h-5 w-5" />;
      case 'Dungeon':
        return <Skull className="h-5 w-5" />;
      case 'Mystery':
        return <HelpCircle className="h-5 w-5" />;
      case 'Shop':
        return <ShoppingCart className="h-5 w-5" />;
    }
  };

  const getNodeColor = (type: MapNodeType) => {
    switch (type) {
      case 'Battle':
        return 'text-red-600';
      case 'Boss':
        return 'text-purple-600';
      case 'Town':
        return 'text-blue-600';
      case 'Dungeon':
        return 'text-gray-600';
      case 'Treasure':
        return 'text-yellow-600';
      case 'Mystery':
        return 'text-purple-700';
      case 'Shop':
        return 'text-green-600';
    }
  };

  const canFight = node.type === 'Battle' || node.type === 'Boss';
  const canEnter = node.type === 'Town' || node.type === 'Dungeon' || node.type === 'Shop';
  const canInteract = node.type === 'Treasure' || node.type === 'Mystery';

  // Position tooltip to the right of character, or left if too close to edge
  const tooltipWidth = 280;
  const offset = 50;
  const tooltipLeft = characterPosition.x + offset;
  const shouldFlipLeft = tooltipLeft + tooltipWidth > window.innerWidth - 20;
  const finalLeft = shouldFlipLeft ? characterPosition.x - tooltipWidth - offset : tooltipLeft;
  const finalTop = Math.max(20, Math.min(characterPosition.y - 80, window.innerHeight - 350));

  return (
    <div
      className="fixed z-50 rounded-md border-2 border-amber-800 bg-amber-50 p-3 shadow-xl"
      style={{
        left: `${finalLeft}px`,
        top: `${finalTop}px`,
        width: `${tooltipWidth}px`,
        pointerEvents: 'auto',
      }}
    >
      {/* Arrow pointer pseudo-element */}
      <div
        className="absolute h-0 w-0 border-8"
        style={{
          [shouldFlipLeft ? 'right' : 'left']: '-16px',
          top: '80px',
          borderTopColor: 'transparent',
          borderBottomColor: 'transparent',
          [shouldFlipLeft ? 'borderLeftColor' : 'borderRightColor']: 'transparent',
          [shouldFlipLeft ? 'borderRightColor' : 'borderLeftColor']: '#92400e',
        }}
      />
      <div
        className="absolute h-0 w-0 border-[7px]"
        style={{
          [shouldFlipLeft ? 'right' : 'left']: '-13px',
          top: '81px',
          borderTopColor: 'transparent',
          borderBottomColor: 'transparent',
          [shouldFlipLeft ? 'borderLeftColor' : 'borderRightColor']: 'transparent',
          [shouldFlipLeft ? 'borderRightColor' : 'borderLeftColor']: '#fef3c7',
        }}
      />

      {/* Node header */}
      <div className="mb-2 flex items-center gap-2">
        <div
          className={`rounded-full bg-white p-1.5 shadow-sm ${isCompleted ? 'text-green-600' : getNodeColor(node.type)}`}
        >
          {getNodeIcon(node.type)}
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-sm font-bold text-amber-900">{node.name}</h2>
          <p className="text-[10px] text-amber-700">{node.type}</p>
        </div>
      </div>

      {/* Completion status */}
      <div className="mb-2 rounded bg-white/60 px-2 py-1">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold text-amber-900">Completed:</span>
          <span className={`text-[10px] font-bold ${isCompleted ? 'text-green-600' : 'text-red-600'}`}>
            {isCompleted ? 'True' : 'False'}
          </span>
        </div>
      </div>

      {/* Description */}
      {node.description && (
        <div className="mb-2 rounded bg-white/60 px-2 py-1.5">
          <p className="text-[11px] leading-tight text-gray-700">{node.description}</p>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-1.5">
        {canFight && onFight && (
          <button
            onClick={onFight}
            className="flex-1 rounded bg-red-600 px-2 py-1.5 text-[11px] font-bold text-white shadow-sm transition-all hover:bg-red-700 active:scale-95"
          >
            <div className="flex items-center justify-center gap-1">
              <Sword className="h-3 w-3" />
              <span>Fight</span>
            </div>
          </button>
        )}

        {canEnter && onEnter && (
          <button
            onClick={onEnter}
            className="flex-1 rounded bg-blue-600 px-2 py-1.5 text-[11px] font-bold text-white shadow-sm transition-all hover:bg-blue-700 active:scale-95"
          >
            <div className="flex items-center justify-center gap-1">
              <Home className="h-3 w-3" />
              <span>Enter</span>
            </div>
          </button>
        )}

        {canInteract && onEnter && (
          <button
            onClick={onEnter}
            className="flex-1 rounded bg-purple-600 px-2 py-1.5 text-[11px] font-bold text-white shadow-sm transition-all hover:bg-purple-700 active:scale-95"
          >
            <div className="flex items-center justify-center gap-1">
              <BookOpen className="h-3 w-3" />
              <span>Interact</span>
            </div>
          </button>
        )}

        {node.dialogueScene && onViewDialogue && (
          <button
            onClick={onViewDialogue}
            className="flex-1 rounded bg-amber-600 px-2 py-1.5 text-[11px] font-bold text-white shadow-sm transition-all hover:bg-amber-700 active:scale-95"
          >
            <div className="flex items-center justify-center gap-1">
              <BookOpen className="h-3 w-3" />
              <span>Talk</span>
            </div>
          </button>
        )}
      </div>
    </div>
  );
}

