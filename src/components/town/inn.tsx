import type { Resources } from '~/types/resources';
import { usePartyActions, useParty } from '~/stores/game-store';
import { useResources, useResourcesActions } from '~/stores/game-store';
import { canAfford } from '~/lib/resources';
import { isPartyFullyHealed as checkPartyFullyHealed } from '~/lib/party-system';
import { calculatePercentage } from '~/lib/math';
import { getHpThreshold } from '~/lib/rpg-calculations';
import { HP_THRESHOLD_CLASS } from '~/constants/ui';
import { soundService } from '~/services/sound-service';
import { SoundNames } from '~/constants/audio';
import { Button } from '../ui/8bit/button';
import { INN_WELCOME_TEXT } from '~/constants/flavor-text/welcome-text';
import { INNKEEPER_CHAR } from '~/constants/dialogue/characters';
import { TownLocationLayout } from './town-location-layout';
import { ToffecBeigeCornersWrapper } from '~/components/cursor/toffec-beige-corners-wrapper';
import { NarikWoodBitFont } from '~/components/bitmap-fonts/narik-wood';

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
          <h2>
            <NarikWoodBitFont text="REST AND RECOVER" size={2} />
          </h2>
          <p>Restore your party to full health for {price.coins} coins</p>
          <div className="party-status">
            <span className="status-label">Party Status:</span>
            <span className={`status-value ${isPartyFullyHealed ? 'healthy' : 'injured'}`}>
              {isPartyFullyHealed ? 'Fully Healed' : 'Needs Healing'}
            </span>
          </div>
        </div>

        {/* Party Members Display */}
        <div className="party-members-list">
          <h3>
            <NarikWoodBitFont text="PARTY MEMBERS" size={1} />
          </h3>
          <div className="party-members-grid">
            {party.map((member) => {
              const hpPercentage = calculatePercentage(member.currentHp, member.maxHp);

              return (
                <ToffecBeigeCornersWrapper key={member.id}>
                  <div className="party-member-card">
                    <div className="member-header">
                      <div className="member-info">
                        <div className="member-name">{member.name}</div>
                        <div className="member-class">{member.class}</div>
                      </div>
                      <div className="member-level">Lv. {member.level}</div>
                    </div>
                    <div className="member-hp">
                      <div className="hp-label">
                        <span>HP</span>
                        <span>
                          {member.currentHp} / {member.maxHp}
                        </span>
                      </div>
                      <div className="hp-bar-container">
                        <div
                          className={`hp-bar ${HP_THRESHOLD_CLASS[getHpThreshold(hpPercentage)]}`}
                          style={{ width: `${hpPercentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </ToffecBeigeCornersWrapper>
              );
            })}
          </div>
        </div>

        {/* Heal Button */}
        <div className="inn-actions">
          <ToffecBeigeCornersWrapper>
            <Button
              onClick={handleFullyHealParty}
              disabled={isPartyFullyHealed || !canAffordHealing}
              className="heal-button"
            >
              {isPartyFullyHealed
                ? 'Party is Fully Healed'
                : !canAffordHealing
                  ? 'Not Enough Coins'
                  : `Heal Party (${price.coins} coins)`}
            </Button>
          </ToffecBeigeCornersWrapper>
        </div>
      </div>
    </TownLocationLayout>
  );
}
