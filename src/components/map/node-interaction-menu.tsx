import { Sword, Home, BookOpen, X, Crown, Skull } from 'lucide-react';
import type { InteractiveMapNode } from '~/types/map-node';
import type { MapNodeType } from '~/stores/slices/map-progress.types';

interface NodeInteractionMenuProps {
  node: InteractiveMapNode;
  isCompleted: boolean;
  onFight?: () => void;
  onEnter?: () => void;
  onViewDialogue?: () => void;
  onClose: () => void;
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
  onClose,
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
    }
  };

  const canFight = node.type === 'Battle' || node.type === 'Boss';
  const canEnter = node.type === 'Town' || node.type === 'Dungeon';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-md rounded-lg border-4 border-amber-900 bg-amber-50 p-6 shadow-2xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 rounded-full p-1 transition-colors hover:bg-amber-200"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Node header */}
        <div className="mb-4 flex items-center gap-3">
          <div className={`rounded-full bg-white p-3 shadow-md ${getNodeColor(node.type)}`}>
            {getNodeIcon(node.type)}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-amber-900">{node.name}</h2>
            <p className="text-sm text-amber-700">{node.type}</p>
          </div>
        </div>

        {/* Completion status */}
        <div className="mb-4 rounded-md bg-white p-3 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-amber-900">Status:</span>
            <span
              className={`rounded-full px-3 py-1 text-sm font-bold ${
                isCompleted ? 'bg-green-200 text-green-800' : 'bg-yellow-200 text-yellow-800'
              }`}
            >
              {isCompleted ? 'Completed' : 'Not Completed'}
            </span>
          </div>
        </div>

        {/* Description */}
        {node.description && (
          <div className="mb-4 rounded-md bg-white p-3 shadow-sm">
            <p className="text-sm text-gray-700">{node.description}</p>
          </div>
        )}

        {/* Action buttons */}
        <div className="space-y-2">
          {canFight && onFight && (
            <button
              onClick={onFight}
              className="w-full rounded-md bg-red-600 px-4 py-3 font-bold text-white shadow-md transition-all hover:bg-red-700 hover:shadow-lg active:scale-95"
            >
              <div className="flex items-center justify-center gap-2">
                <Sword className="h-5 w-5" />
                <span>{isCompleted ? 'Fight Again' : 'Fight'}</span>
              </div>
            </button>
          )}

          {canEnter && onEnter && (
            <button
              onClick={onEnter}
              className="w-full rounded-md bg-blue-600 px-4 py-3 font-bold text-white shadow-md transition-all hover:bg-blue-700 hover:shadow-lg active:scale-95"
            >
              <div className="flex items-center justify-center gap-2">
                <Home className="h-5 w-5" />
                <span>Enter {node.type}</span>
              </div>
            </button>
          )}

          {node.dialogueScene && onViewDialogue && (
            <button
              onClick={onViewDialogue}
              className="w-full rounded-md bg-amber-600 px-4 py-3 font-bold text-white shadow-md transition-all hover:bg-amber-700 hover:shadow-lg active:scale-95"
            >
              <div className="flex items-center justify-center gap-2">
                <BookOpen className="h-5 w-5" />
                <span>View Dialogue</span>
              </div>
            </button>
          )}

          <button
            onClick={onClose}
            className="w-full rounded-md bg-gray-400 px-4 py-3 font-bold text-white shadow-md transition-all hover:bg-gray-500 hover:shadow-lg active:scale-95"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

