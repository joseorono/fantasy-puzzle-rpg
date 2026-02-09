import type { OrbType } from '~/types/rpg-elements';

// Orb type classes for styling
export const ORB_TYPE_CLASSES: Record<OrbType, string> = {
  blue: 'bg-blue-500 shadow-blue-600 border-blue-400',
  green: 'bg-green-500 shadow-green-600 border-green-400',
  purple: 'bg-purple-500 shadow-purple-600 border-purple-400',
  yellow: 'bg-yellow-500 shadow-yellow-600 border-yellow-400',
  gray: 'bg-gray-400 shadow-gray-500 border-gray-300',
};

// Orb glow effects
export const ORB_GLOW_CLASSES: Record<OrbType, string> = {
  blue: 'shadow-[0_0_20px_rgba(59,130,246,0.8)]',
  green: 'shadow-[0_0_20px_rgba(34,197,94,0.8)]',
  purple: 'shadow-[0_0_20px_rgba(168,85,247,0.8)]',
  yellow: 'shadow-[0_0_20px_rgba(234,179,8,0.8)]',
  gray: 'shadow-[0_0_20px_rgba(156,163,175,0.5)]',
};
