import type { Resources } from '~/types/resources';
import { usePartyActions, useParty } from '~/stores/game-store';
import { useResources, useResourcesActions } from '~/stores/game-store';
import { canAfford } from '~/lib/resources';
import { isPartyFullyHealed as checkPartyFullyHealed } from '~/lib/party-system';
import { Button } from '../ui/8bit/button';

export default function Inn({ price, onLeaveCallback }: { price: Resources; onLeaveCallback: () => void }) {
  const partyActions = usePartyActions();
  const party = useParty();
  const resourcesActions = useResourcesActions();
  const resources = useResources();

  const isPartyFullyHealed = checkPartyFullyHealed(party);
  const canAffordHealing = canAfford(resources, price);

  const handleFullyHealParty = () => {
    if (canAffordHealing) {
      partyActions.fullyHealParty();
      resourcesActions.reduceResources(price);
    }
  };

  return (
    <div className="blacksmith-container">
      <div className="blacksmith-header">
        <Button onClick={onLeaveCallback}>Leave</Button>
        <h1>Inn</h1>
      </div>

      {/* Resources Display */}
      <div className="resources-display">
        <div>Coins: {resources.coins}</div>
        <div>Gold: {resources.gold}</div>
        <div>Copper: {resources.copper}</div>
        <div>Silver: {resources.silver}</div>
        <div>Bronze: {resources.bronze}</div>
      </div>

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
  );
}
