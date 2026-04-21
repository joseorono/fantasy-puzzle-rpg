import type { Resources } from '~/types/resources';
import { usePartyActions, useParty } from '~/stores/game-store';
import { useResources, useResourcesActions } from '~/stores/game-store';
import { canAfford } from '~/lib/resources';
import { isPartyFullyHealed as checkPartyFullyHealed } from '~/lib/party-system';
import { soundService } from '~/services/sound-service';
import { SoundNames } from '~/constants/audio';
import { ToffecButton } from '~/components/ui-custom/toffec-button';
import { INN_WELCOME_TEXT } from '~/constants/flavor-text/welcome-text';
import { INNKEEPER_CHAR } from '~/constants/dialogue/characters';
import { TownLocationLayout } from './town-location-layout';
import { ToffecBeigeCornersWrapper } from '~/components/cursor/toffec-beige-corners-wrapper';
import { NarikWoodBitFont } from '~/components/bitmap-fonts/narik-wood';
import { PartyMemberCard } from '~/components/pause-menu/party-member-card';

const INN_BG_IMAGES = ['/assets/bg/desk-inn-1.jpg', '/assets/bg/desk-inn-2.jpg', '/assets/bg/desk-inn.jpg'];

export default function Inn({ price, onLeaveCallback }: { price: Resources; onLeaveCallback: () => void }) {
  const partyActions = usePartyActions();
  const party = useParty();
  const resourcesActions = useResourcesActions();
  const resources = useResources();

  const isPartyFullyHealed = checkPartyFullyHealed(party);
  const canAffordHealing = canAfford(resources, price);

  const handleFullyHealParty = () => {
    if (canAffordHealing) {
      soundService.playSound(SoundNames.clickCoin);
      partyActions.fullyHealParty();
      resourcesActions.reduceResources(price);
    }
  };

  return (
    <TownLocationLayout
      locationClass="inn"
      bgClass="bg-inn"
      bgImages={INN_BG_IMAGES}
      character={INNKEEPER_CHAR}
      welcomeTexts={INN_WELCOME_TEXT}
      marqueeType="inn"
      onLeave={onLeaveCallback}
    >
      <div className="inn-content">
        <div className="inn-info">
          <div className="inn-info-header">
            <h2>
              <NarikWoodBitFont text="REST AND RECOVER" size={1.5} />
            </h2>
            <div className={`status-value ${isPartyFullyHealed ? 'healthy' : 'injured'}`}>
              {isPartyFullyHealed ? 'Fully Healed' : 'Needs Healing'}
            </div>
          </div>
          <p>Restore party to full health for {price.coins} coins</p>
          <div className="party-members-list">
            <h2 className="">
              <NarikWoodBitFont text="PARTY MEMBERS" size={1.3} />
            </h2>
            <div className="party-members-grid inn-party-members-grid mt-4">
              {party.map((member) => (
                <PartyMemberCard key={member.id} member={member} variant="bar" />
              ))}
            </div>
          </div>
        </div>

        {/* Party Members Display */}

        {/* Heal Button */}
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
