import { useEffect } from 'react';
import { useAtom } from 'jotai';
import { pendingSkillUnlockAtom } from '~/stores/skill-unlock-atoms';
import { useParty } from '~/stores/game-store';
import { getSkillById } from '~/lib/skill-system';
import { CHARACTER_ICONS } from '~/constants/party';
import { NarikWoodBitFont } from '~/components/bitmap-fonts/narik-wood';
import { RetroDivider } from '~/components/ui-custom/retro-divider';

const AUTO_DISMISS_MS = 3200;

/**
 * Global celebration overlay shown on top of any screen when a skill is unlocked.
 * Auto-dismisses after a few seconds (or on click). Driven by `pendingSkillUnlockAtom`,
 * which `useUnlockSkill` sets. Mounted once in `game-loader`.
 */
export function SkillUnlockOverlay() {
  const [pending, setPending] = useAtom(pendingSkillUnlockAtom);
  const party = useParty();

  useEffect(() => {
    if (!pending) return;
    const timer = setTimeout(() => setPending(null), AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [pending, setPending]);

  if (!pending) return null;

  const skill = getSkillById(pending.skillId);
  if (!skill) return null;

  const Icon = CHARACTER_ICONS[skill.class];
  const character = party.find((m) => m.id === pending.characterId);

  return (
    <div className="gom-backdrop" onClick={() => setPending(null)}>
      <div className="gom-modal gom-modal--victory" onClick={(e) => e.stopPropagation()}>
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

          <RetroDivider variant="victory" />

          <div className="gom-message gom-message--victory">
            <p
              style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
            >
              <Icon size={16} /> {skill.name}
            </p>
            <p>{skill.description}</p>
          </div>
        </div>

        <div className="gom-sparkles">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="gom-sparkle"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
