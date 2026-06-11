import type { Resources } from '~/types/resources';
import type { CharacterData } from '~/types/rpg-elements';
import { usePartyActions, useParty } from '~/stores/game-store';
import { useResources, useResourcesActions } from '~/stores/game-store';
import { canAfford, createResources } from '~/lib/resources';
import { isPartyFullyHealed as checkPartyFullyHealed } from '~/lib/party-system';
import { cn } from '~/lib/utils';
import { soundService } from '~/services/sound-service';
import { SoundNames } from '~/constants/audio';
import { ToffecButton } from '~/components/ui-custom/toffec-button';
import { INN_WELCOME_TEXT } from '~/constants/flavor-text/welcome-text';
import { INNKEEPER_CHAR } from '~/constants/dialogue/characters';
import { TownLocationLayout } from './town-location-layout';
import { ToffecBeigeCornersWrapper } from '~/components/cursor/toffec-beige-corners-wrapper';
import { NarikWoodBitFont } from '~/components/bitmap-fonts/narik-wood';
import { PartyMemberCard } from '~/components/pause-menu/party-member-card';
import { Tooltip, TooltipTrigger, TooltipContent } from '~/components/ui-custom/tooltip';

export default function Inn({
  backgroundImage,
  price,
  onLeaveCallback,
}: {
  backgroundImage: string;
  price: Resources;
  onLeaveCallback: () => void;
}) {
  const partyActions = usePartyActions();
  const party = useParty();
  const resourcesActions = useResourcesActions();
  const resources = useResources();

  const isPartyFullyHealed = checkPartyFullyHealed(party);
  const canAffordHealing = canAfford(resources, price);

  // Healing a single member scales with how hurt they are: a full-price heal
  // restores a member from 0 HP; a lightly-wounded member costs proportionally less.
  const getHealCost = (member: CharacterData) =>
    Math.ceil((price.coins * (member.maxHp - member.currentHp)) / member.maxHp);

  const handleFullyHealParty = () => {
    if (canAffordHealing) {
      soundService.playSound(SoundNames.clickCoin);
      partyActions.fullyHealParty();
      resourcesActions.reduceResources(price);
    }
  };

  const handleHealMember = (member: CharacterData) => {
    const cost = getHealCost(member);
    if (cost <= 0) return;
    const costResources = createResources({ coins: cost });
    if (!canAfford(resources, costResources)) return;
    soundService.playSound(SoundNames.clickCoin);
    partyActions.fullyHealMember(member.id);
    resourcesActions.reduceResources(costResources);
  };

  return (
    <TownLocationLayout
      locationClass="inn"
      bgClass="bg-inn"
      backgroundImage={backgroundImage}
      character={INNKEEPER_CHAR}
      welcomeTexts={INN_WELCOME_TEXT}
      marqueeType="inn"
      onLeave={onLeaveCallback}
    >
      <div className="inn-content">
        <div className="inn-info">
          <div className="town-section-header town-section-header--inn">
            <h2>
              <NarikWoodBitFont text="REST AND RECOVER" size={1.2} />
            </h2>
            <div className="town-header-badge">
              <span className="town-header-badge__label">Party</span>
              <span
                className={cn(
                  'town-header-badge__value',
                  isPartyFullyHealed ? 'town-header-badge__value--healthy' : 'town-header-badge__value--injured',
                )}
              >
                {isPartyFullyHealed ? 'Healed' : 'Injured'}
              </span>
            </div>
          </div>
          <p className="town-section-subtitle">
            Click a hero to heal them, or rest the whole party for {price.coins} coins
          </p>
          <div className="party-members-list">
            <div className="party-members-grid inn-party-members-grid">
              {party.map((member) => {
                const isFull = member.currentHp >= member.maxHp;
                const cost = getHealCost(member);
                const canAffordHeal = resources.coins >= cost;

                if (isFull) {
                  return (
                    <Tooltip key={member.id}>
                      <TooltipTrigger asChild>
                        <div>
                          <PartyMemberCard member={member} variant="bar" />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>Fully healed</TooltipContent>
                    </Tooltip>
                  );
                }

                return (
                  <Tooltip key={member.id}>
                    <TooltipTrigger asChild>
                      <div>
                        <ToffecBeigeCornersWrapper className={cn(!canAffordHeal && 'cannot-afford')}>
                          <PartyMemberCard
                            member={member}
                            variant="bar"
                            onClick={() => handleHealMember(member)}
                          />
                        </ToffecBeigeCornersWrapper>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      {canAffordHeal ? `Heal for ${cost} coins` : `Not enough coins (need ${cost})`}
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          </div>
        </div>

        {/* Heal whole party */}
        <div className="inn-actions">
          <ToffecBeigeCornersWrapper>
            <ToffecButton
              variant="cream"
              size="xs"
              onClick={handleFullyHealParty}
              disabled={isPartyFullyHealed || !canAffordHealing}
              className="heal-button"
            >
              {isPartyFullyHealed
                ? 'Fully Healed'
                : !canAffordHealing
                  ? 'Not Enough Coins'
                  : `Heal Party (${price.coins} coins)`}
            </ToffecButton>
          </ToffecBeigeCornersWrapper>
        </div>
      </div>
    </TownLocationLayout>
  );
}
