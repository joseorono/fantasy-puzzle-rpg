import { useParty } from '~/stores/game-store';
import { getSkillById } from '~/lib/skill-system';
import { CHARACTER_ICONS } from '~/constants/party';
import { NarikWoodBitFont } from '~/components/bitmap-fonts/narik-wood';
import { IndigolayDivider } from '~/components/dividers/indigolay-divider';
import { OverlayContainer } from './overlay-container';
import type { OverlayRequest } from '~/stores/overlay-atoms';

interface SkillUnlockOverlayProps {
  request: Extract<OverlayRequest, { kind: 'skill-unlock' }>;
  onDismiss: () => void;
}

/**
 * Celebration content for a skill unlock. Presentation only — the backdrop,
 * dismissal, and sparkles are handled by `OverlayContainer`.
 */
export function SkillUnlockOverlay({ request, onDismiss }: SkillUnlockOverlayProps) {
  const party = useParty();

  const skill = getSkillById(request.skillId);
  if (!skill) return null;

  const Icon = CHARACTER_ICONS[skill.class];
  const character = party.find((m) => m.id === request.characterId);

  return (
    <OverlayContainer
      onDismiss={onDismiss}
      dismissOnBackdropClick={request.dismissOnBackdropClick ?? true}
      autoDismissMs={request.autoDismissMs ?? 3200}
      sparkleCount={20}
    >
      <div className="gom-modal gom-modal--victory">
        <div className="gom-content">
          <div className="gom-icon gom-icon--victory">
            <Icon size={32} color="#fff" />
          </div>

          <div className="gom-title-group">
            <div className="gom-title">
              <NarikWoodBitFont text="SKILL UNLOCKED" size={1} />
            </div>
            <p className="gom-subtitle pixel-font">
              {character ? `${character.name} learned a new skill!` : 'A new skill was learned!'}
            </p>
          </div>

          <IndigolayDivider variant="victory" />

          <div className="gom-message gom-message--victory">
            {/* Skill name on a red ribbon banner (reuses the title-sign artwork). */}
            <div className="title-sign title-sign--red title-sign--text-gold" style={{ margin: '0 auto 0.75rem' }}>
              <span className="title-sign__text pixel-font" style={{ fontSize: '13px' }}>
                {skill.name}
              </span>
            </div>
            <p>{skill.description}</p>
          </div>
        </div>
      </div>
    </OverlayContainer>
  );
}
