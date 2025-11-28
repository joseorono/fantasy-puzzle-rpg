import { useMemo } from 'react';
import type { Resources } from '~/types/resources';
import { usePartyActions, useParty } from '~/stores/game-store';
import { useResources, useResourcesActions } from '~/stores/game-store';
import { canAfford } from '~/lib/resources';
import { isPartyFullyHealed as checkPartyFullyHealed } from '~/lib/party-system';
import { soundService } from '~/services/sound-service';
import { SoundNames } from '~/constants/audio';
import { Button } from '../ui/8bit/button';
import { getRandomElement } from '~/lib/utils';
import { TopBarResources } from './top-bar-resources';
import { MarqueeText } from '../marquee/marquee-text';

const INN_BG_IMAGES = ['/assets/bg/desk-inn-1.jpg', '/assets/bg/desk-inn-2.jpg', '/assets/bg/desk-inn.jpg'];

export default function Inn({ price, onLeaveCallback }: { price: Resources; onLeaveCallback: () => void }) {
  const partyActions = usePartyActions();
  const party = useParty();
  const resourcesActions = useResourcesActions();
  const resources = useResources();

  // Select random background image on component mount
  const backgroundImage = useMemo(() => getRandomElement(INN_BG_IMAGES), []);

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
    <div className="inn">
      <div className="bg-inn" style={{ backgroundImage: `url('${backgroundImage}')` }}></div>
      <button className="leave-btn" onClick={onLeaveCallback}></button>
      <div className="shop-container">
        <h1>Inn</h1>

        {/* Resources Display */}
        <TopBarResources resources={resources} />

        {/* Inn Content */}
        <div className="inn-content">
          <div className="inn-info">
            <h2>Rest & Recover</h2>
            <p>Restore your party to full health for {price.coins} coins</p>
            <div className="party-status">
              <span className="status-label">Party Status:</span>
              <span className={`status-value ${isPartyFullyHealed ? 'healthy' : 'injured'}`}>
                {isPartyFullyHealed ? '✓ Fully Healed' : '⚠ Needs Healing'}
              </span>
            </div>
          </div>

          {/* Party Members Display */}
          <div className="party-members-list">
            <h3>Party Members</h3>
            <div className="party-members-grid">
              {party.map((member) => {
                const hpPercentage = (member.currentHp / member.maxHp) * 100;
                const isFullHealth = member.currentHp === member.maxHp;

                return (
                  <div key={member.id} className="party-member-card">
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
                          className={`hp-bar ${isFullHealth ? 'full' : hpPercentage > 50 ? 'medium' : 'low'}`}
                          style={{ width: `${hpPercentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Heal Button */}
          <div className="inn-actions">
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
          </div>
        </div>
      </div>

      {/* Marquee Footer - Outside shop container */}
      <MarqueeText type="inn" variant="marquee--golden" />
    </div>
  );
}
