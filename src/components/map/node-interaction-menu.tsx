import type { InteractiveMapNode } from '~/types/map-node';
import type { MapNodeType } from '~/stores/slices/map-progress.types';
import type { Position } from '~/types/geometry';
import { FrostyRpgIcon, type FrostyRpgIconName } from '~/components/sprite-icons/frost-icons';

interface NodeInteractionMenuProps {
  node: InteractiveMapNode;
  isCompleted: boolean;
  onFight?: () => void;
  onEnter?: () => void;
  onOpenChest?: () => void;
  onViewDialogue?: () => void;
  characterPosition: Position;
}

const NODE_ICONS: Record<MapNodeType, FrostyRpgIconName> = {
  Battle: 'broadsword',
  Boss: 'crown',
  Town: 'lantern',
  Dungeon: 'skull',
  Treasure: 'chest',
  Mystery: 'orbPurple',
};

/**
 * Floating menu for interacting with map nodes
 */
export function NodeInteractionMenu({
  node,
  isCompleted,
  onFight,
  onEnter,
  onOpenChest,
  onViewDialogue,
  characterPosition,
}: NodeInteractionMenuProps) {
  const canFight = node.type === 'Battle' || node.type === 'Boss';
  const canEnter = node.type === 'Town' || node.type === 'Dungeon';
  const canOpenChest = node.type === 'Treasure' && !isCompleted;
  const canInteract = node.type === 'Mystery';

  // Position tooltip to the right of character, or left if too close to edge
  const tooltipWidth = 280;
  const offset = 50;
  const tooltipLeft = characterPosition.x + offset;
  const shouldFlipLeft = tooltipLeft + tooltipWidth > window.innerWidth - 20;
  const finalLeft = shouldFlipLeft ? characterPosition.x - tooltipWidth - offset : tooltipLeft;
  const finalTop = Math.max(20, Math.min(characterPosition.y - 80, window.innerHeight - 350));

  return (
    <div
      className="nim fixed z-50"
      style={{
        left: `${finalLeft}px`,
        top: `${finalTop}px`,
        width: `${tooltipWidth}px`,
      }}
    >
      {/* Arrow pointer */}
      <div
        className={`nim-arrow ${shouldFlipLeft ? 'nim-arrow--right' : 'nim-arrow--left'}`}
        style={{
          [shouldFlipLeft ? 'right' : 'left']: '-16px',
          top: '80px',
        }}
      />

      {/* Node header */}
      <div className="nim-header">
        <div className="nim-icon-wrapper">
          <FrostyRpgIcon name={NODE_ICONS[node.type]} size={28} />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="nim-title pixel-font">{node.name}</h2>
          <p className="nim-type pixel-font">{node.type}</p>
        </div>
      </div>

      {/* Completion status */}
      <div className="nim-status">
        <span className="nim-status-label pixel-font">Completed:</span>
        <span
          className={`nim-status-value pixel-font ${isCompleted ? 'nim-status-value--true' : 'nim-status-value--false'}`}
        >
          {isCompleted ? 'Yes' : 'No'}
        </span>
      </div>

      {/* Description */}
      {node.description && (
        <div className="nim-description">
          <p>{node.description}</p>
        </div>
      )}

      {/* Action buttons */}
      <div className="nim-actions">
        {canFight && onFight && (
          <button onClick={onFight} className="nim-btn nim-btn--fight pixel-font">
            <FrostyRpgIcon name="broadsword" size={16} />
            Fight
          </button>
        )}

        {canEnter && onEnter && (
          <button onClick={onEnter} className="nim-btn nim-btn--enter pixel-font">
            <FrostyRpgIcon name="lantern" size={16} />
            Enter
          </button>
        )}

        {canOpenChest && onOpenChest && (
          <button onClick={onOpenChest} className="nim-btn nim-btn--chest pixel-font">
            <FrostyRpgIcon name="openChest" size={16} />
            Open
          </button>
        )}

        {canInteract && onEnter && (
          <button onClick={onEnter} className="nim-btn nim-btn--interact pixel-font">
            <FrostyRpgIcon name="orbPurple" size={16} />
            Interact
          </button>
        )}

        {node.dialogueScene && onViewDialogue && (
          <button onClick={onViewDialogue} className="nim-btn nim-btn--talk pixel-font">
            <FrostyRpgIcon name="openBook" size={16} />
            Talk
          </button>
        )}
      </div>
    </div>
  );
}
