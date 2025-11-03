import type { DialogueCharacter } from "~/types/dialogue";

interface DialoguePortraitProps {
  character: DialogueCharacter;
  isActive: boolean;
  emotion?: string;
  showPortrait?: boolean;
  rotate90deg?: boolean;
}

export function DialoguePortrait({
  character,
  isActive,
  showPortrait = true,
  rotate90deg = false,
}: DialoguePortraitProps) {
  if (!character.portrait || !showPortrait) return null;

  const sideClass = `dialogue-portrait--${character.side}`;
  const activeClass = isActive
    ? "dialogue-portrait--active"
    : "dialogue-portrait--inactive";
  const rotateClass = rotate90deg ? "dialogue-portrait__image--rotated" : "";

  // If emotion is provided and different from default, try to use emotion variant
  // For now, we'll just use the base portrait, but this allows for future expansion
  const portraitSrc = character.portrait;

  return (
    <div className={`dialogue-portrait ${sideClass} ${activeClass}`}>
      <img
        src={portraitSrc}
        alt={character.name || "Character"}
        className={`dialogue-portrait__image ${rotateClass}`}
      />
      {character.name && (
        <div className="dialogue-portrait__name">{character.name}</div>
      )}
    </div>
  );
}
