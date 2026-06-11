import type { Resources } from '~/types/resources';
import type { CharacterData } from '~/types/rpg-elements';
import { usePartyActions, useParty } from '~/stores/game-store';
import { useResources, useResourcesActions } from '~/stores/game-store';
import { createResources } from '~/lib/resources';
import { cn } from '~/lib/utils';
import { soundService } from '~/services/sound-service';
import { SoundNames } from '~/constants/audio';
import { ToffecButton } from '~/components/ui-custom/toffec-button';
import { FrostyRpgIcon } from '~/components/sprite-icons/frost-icons';
import { INN_WELCOME_TEXT } from '~/constants/flavor-text/welcome-text';
import { INNKEEPER_CHAR } from '~/constants/dialogue/characters';
import { TownLocationLayout } from './town-location-layout';
import { ToffecBeigeCornersWrapper } from '~/components/cursor/toffec-beige-corners-wrapper';
import { NarikWoodBitFont } from '~/components/bitmap-fonts/narik-wood';
import { PartyMemberCard } from '~/components/pause-menu/party-member-card';

/** A single member to heal plus the coin cost to fully restore them. */
interface HealEntry {
  member: CharacterData;
  cost: number;
}

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

  // Healing a single member scales with how hurt they are: a full-price heal
  // restores a member from 0 HP; a lightly-wounded member costs proportionally less.
  const getHealCost = (member: CharacterData) =>
    Math.ceil((price.coins * (member.maxHp - member.currentHp)) / member.maxHp);

  const injured: HealEntry[] = party
    .filter((member) => member.currentHp < member.maxHp)
    .map((member) => ({ member, cost: getHealCost(member) }));

  const isPartyFullyHealed = injured.length === 0;
  const totalHealCost = injured.reduce((sum, entry) => sum + entry.cost, 0);

  // Greedy "heal all" plan: heal the most-wounded heroes first, spending coins
  // until the next hero is unaffordable. Lets the player heal partially instead
  // of being blocked when they can't afford the whole party at once.
  const healPlan = injured
    .slice()
    .sort((a, b) => b.cost - a.cost)
    .reduce<{ entries: HealEntry[]; cost: number; remaining: number }>(
      (plan, entry) =>
        entry.cost <= plan.remaining
          ? { entries: [...plan.entries, entry], cost: plan.cost + entry.cost, remaining: plan.remaining - entry.cost }
          : plan,
      { entries: [], cost: 0, remaining: resources.coins },
    );

  const handleHealMember = (member: CharacterData) => {
    const cost = getHealCost(member);
    if (cost <= 0 || resources.coins < cost) return;
    soundService.playSound(SoundNames.clickCoin);
    partyActions.fullyHealMember(member.id);
    resourcesActions.reduceResources(createResources({ coins: cost }));
  };

  const handleHealAll = () => {
    if (healPlan.entries.length === 0) return;
    soundService.playSound(SoundNames.clickCoin);
    healPlan.entries.forEach((entry) => partyActions.fullyHealMember(entry.member.id));
    resourcesActions.reduceResources(createResources({ coins: healPlan.cost }));
  };

  const healAllLabel = isPartyFullyHealed
    ? 'Fully Healed'
    : healPlan.entries.length === 0
      ? 'Not Enough Coins'
      : healPlan.entries.length === injured.length
        ? `Heal All · ${totalHealCost} coins`
        : `Heal ${healPlan.entries.length} ${healPlan.entries.length === 1 ? 'Hero' : 'Heroes'} · ${healPlan.cost} coins`;

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
          <p className="town-section-subtitle">Click a wounded hero to heal them, or heal everyone at once below</p>
          <div className="party-members-list">
            <div className="party-members-grid inn-party-members-grid">
              {party.map((member) => {
                const isFull = member.currentHp >= member.maxHp;
                const cost = getHealCost(member);
                const canAffordHeal = resources.coins >= cost;

                return (
                  <div key={member.id} className="inn-hero-cell">
                    {isFull ? (
                      <>
                        <PartyMemberCard member={member} variant="bar" />
                        <div className="inn-hero-heal inn-hero-heal--full">Fully Healed</div>
                      </>
                    ) : (
                      <>
                        <ToffecBeigeCornersWrapper className={cn(!canAffordHeal && 'cannot-afford')}>
                          <PartyMemberCard member={member} variant="bar" onClick={() => handleHealMember(member)} />
                        </ToffecBeigeCornersWrapper>
                        <div className={cn('inn-hero-heal', !canAffordHeal && 'inn-hero-heal--locked')}>
                          {canAffordHeal ? 'Heal' : 'Need'} · {cost}
                          <FrostyRpgIcon name="coinPurse" size={14} />
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Heal everyone affordable in one tap */}
        <div className="inn-actions">
          <ToffecBeigeCornersWrapper>
            <ToffecButton
              variant="cream"
              size="xs"
              onClick={handleHealAll}
              disabled={isPartyFullyHealed || healPlan.entries.length === 0}
              className="heal-button"
            >
              {healAllLabel}
            </ToffecButton>
          </ToffecBeigeCornersWrapper>
        </div>
      </div>
    </TownLocationLayout>
  );
}
