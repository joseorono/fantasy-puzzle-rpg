import { useParty } from '~/stores/game-store';
import { getSkillById, getPassiveById } from '~/lib/skill-system';
import type { CharacterClass } from '~/types/rpg-elements';
import type { SkillIconPosition } from '~/types/skills';
import { NarikWoodBitFont } from '~/components/bitmap-fonts/narik-wood';
import { IndigolayDivider } from '~/components/dividers/indigolay-divider';
import { SkillDecoIcon } from '~/components/skill-sprite-icons/skill-deco-icon';
import { OverlayContainer } from './overlay-container';
import type { OverlayOptions, OverlayRequest } from '~/stores/overlay-atoms';

/**
 * Celebration content for skill unlocks — both kinds. The featured icon is the
 * skill's real Indigolay art seated on the gold deco frame. Presentation only:
 * backdrop, dismissal, and sparkles are handled by `OverlayContainer`.
 */

interface SkillCelebrationProps extends OverlayOptions {
  onDismiss: () => void;
  title: string;
  subtitle: string;
  skillName: string;
  description: string;
  characterClass: CharacterClass;
  icon: SkillIconPosition;
}

function SkillCelebration({
  onDismiss,
  title,
  subtitle,
  skillName,
  description,
  characterClass,
  icon,
  dismissOnBackdropClick,
  autoDismissMs,
}: SkillCelebrationProps) {
  return (
    <OverlayContainer
      onDismiss={onDismiss}
      dismissOnBackdropClick={dismissOnBackdropClick ?? true}
      autoDismissMs={autoDismissMs ?? 3200}
      sparkleCount={20}
      backdropClassName="skill-celebration-backdrop"
    >
      <div className="gom-modal gom-modal--victory">
        <div className="gom-content">
          <SkillDecoIcon
            characterClass={characterClass}
            position={icon}
            size={96}
            className="skill-deco-icon--celebrate"
          />

          <div className="gom-title-group">
            <div className="gom-title">
              <NarikWoodBitFont text={title} size={1} />
            </div>
            <p className="gom-subtitle pixel-font">{subtitle}</p>
          </div>

          <IndigolayDivider variant="victory" />

          <div className="gom-message gom-message--victory">
            {/* Skill name on a red ribbon banner (reuses the title-sign artwork). */}
            <div className="title-sign title-sign--red title-sign--text-gold" style={{ margin: '0 auto 0.75rem' }}>
              <span className="title-sign__text pixel-font" style={{ fontSize: '13px' }}>
                {skillName}
              </span>
            </div>
            <p>{description}</p>
          </div>
        </div>
      </div>
    </OverlayContainer>
  );
}

interface SkillUnlockOverlayProps {
  request: Extract<OverlayRequest, { kind: 'skill-unlock' }>;
  onDismiss: () => void;
}

export function SkillUnlockOverlay({ request, onDismiss }: SkillUnlockOverlayProps) {
  const party = useParty();
  const skill = getSkillById(request.skillId);
  if (!skill) return null;
  const character = party.find((m) => m.id === request.characterId);

  return (
    <SkillCelebration
      onDismiss={onDismiss}
      dismissOnBackdropClick={request.dismissOnBackdropClick}
      autoDismissMs={request.autoDismissMs}
      title="SKILL UNLOCKED"
      subtitle={character ? `${character.name} learned a new skill!` : 'A new skill was learned!'}
      skillName={skill.name}
      description={skill.description}
      characterClass={skill.class}
      icon={skill.icon}
    />
  );
}

interface PassiveUnlockOverlayProps {
  request: Extract<OverlayRequest, { kind: 'passive-unlock' }>;
  onDismiss: () => void;
}

export function PassiveUnlockOverlay({ request, onDismiss }: PassiveUnlockOverlayProps) {
  const party = useParty();
  const passive = getPassiveById(request.passiveId);
  if (!passive) return null;
  const character = party.find((m) => m.id === request.characterId);

  return (
    <SkillCelebration
      onDismiss={onDismiss}
      dismissOnBackdropClick={request.dismissOnBackdropClick}
      autoDismissMs={request.autoDismissMs}
      title="PASSIVE LEARNED"
      subtitle={character ? `${character.name} grows stronger!` : 'The party grows stronger!'}
      skillName={passive.name}
      description={passive.description}
      characterClass={passive.class}
      icon={passive.icon}
    />
  );
}
