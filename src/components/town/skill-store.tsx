import { useParty, useResources, useResourcesActions } from '~/stores/game-store';
import type { Resources } from '~/types/resources';
import type { CharacterData } from '~/types/rpg-elements';
import type { SkillDefinition } from '~/types/skills';
import { getSkillsForClass, isSkillUnlocked } from '~/lib/skill-system';
import { CHARACTER_ICONS } from '~/constants/party';
import { canAfford } from '~/lib/resources';
import { useUnlockSkill } from '~/hooks/use-unlock-skill';
import { soundService } from '~/services/sound-service';
import { SoundNames } from '~/constants/audio';
import { ITEM_SHOP_WELCOME_TEXT } from '~/constants/flavor-text/welcome-text';
import { SHOPKEEPER_CHAR } from '~/constants/dialogue/characters';
import { TownLocationLayout } from './town-location-layout';
import { CostBadge } from './cost-badge';
import { ToffecBeigeCornersWrapper } from '~/components/cursor/toffec-beige-corners-wrapper';
import { ToffecButton } from '~/components/ui-custom/toffec-button';
import { NarikWoodBitFont } from '~/components/bitmap-fonts/narik-wood';

const RESOURCE_KEYS: (keyof Resources)[] = ['coins', 'gold', 'silver', 'copper', 'iron'];

function isPurchasable(skill: SkillDefinition): boolean {
  return RESOURCE_KEYS.some((key) => skill.cost[key] > 0);
}

interface PurchasableSkill {
  member: CharacterData;
  skill: SkillDefinition;
}

export default function SkillStore({
  backgroundImage,
  onLeaveCallback,
}: {
  backgroundImage: string;
  onLeaveCallback: () => void;
}) {
  const party = useParty();
  const resources = useResources();
  const resourcesActions = useResourcesActions();
  const { unlock } = useUnlockSkill();

  // Every purchasable skill a party member has not yet unlocked.
  const offerings: PurchasableSkill[] = party.flatMap((member) =>
    getSkillsForClass(member.class)
      .filter((skill) => isPurchasable(skill) && !isSkillUnlocked(member, skill.id))
      .map((skill) => ({ member, skill })),
  );

  function handleBuy({ member, skill }: PurchasableSkill) {
    if (!canAfford(resources, skill.cost)) return;
    soundService.playSound(SoundNames.clickCoin);
    resourcesActions.reduceResources(skill.cost);
    unlock(member.id, skill.id);
  }

  return (
    <TownLocationLayout
      locationClass="item-store"
      bgClass="bg-item-store"
      backgroundImage={backgroundImage}
      character={SHOPKEEPER_CHAR}
      welcomeTexts={ITEM_SHOP_WELCOME_TEXT}
      marqueeType="item-shop"
      onLeave={onLeaveCallback}
    >
      <div className="shop-content">
        <div className="store-info">
          <div className="town-section-header town-section-header--skills">
            <h2>
              <NarikWoodBitFont text="SKILLS TRAINER" size={1.5} />
            </h2>
          </div>
          <p className="town-section-subtitle">Train your heroes in new battle skills</p>
        </div>

        <div className="equipment-list">
          {offerings.length === 0 ? (
            <div className="pause-menu-empty">No skills available to train right now</div>
          ) : (
            offerings.map(({ member, skill }) => {
              const canAffordSkill = canAfford(resources, skill.cost);
              const Icon = CHARACTER_ICONS[skill.class];
              return (
                <div key={`${member.id}-${skill.id}`} className="equipment-list-item">
                  <div className="equipment-item-icon">
                    <Icon size={24} />
                  </div>
                  <div className="equipment-item-content">
                    <div className="equipment-item-header">
                      <div className="equipment-item-name">
                        {skill.name} <span className="item-count">({member.name})</span>
                      </div>
                      <div className="equipment-item-cost">
                        {RESOURCE_KEYS.map((key) =>
                          skill.cost[key] > 0 ? (
                            <CostBadge key={key} resource={key} amount={skill.cost[key]} />
                          ) : null,
                        )}
                      </div>
                    </div>
                    <div className="equipment-item-description">{skill.description}</div>
                    <div className="item-actions">
                      <ToffecBeigeCornersWrapper>
                        <ToffecButton
                          variant="orange"
                          size="xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleBuy({ member, skill });
                          }}
                          disabled={!canAffordSkill}
                        >
                          {canAffordSkill ? 'Train' : 'Cannot Afford'}
                        </ToffecButton>
                      </ToffecBeigeCornersWrapper>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </TownLocationLayout>
  );
}
