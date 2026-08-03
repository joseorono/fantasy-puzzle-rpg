import type { Resources } from '~/types/resources';
import type { CharacterData } from '~/types/rpg-elements';
import { usePartyActions, useParty } from '~/stores/game-store';
import { useResources, useResourcesActions } from '~/stores/game-store';
import { createResources } from '~/lib/resources';
import { cn } from '~/lib/utils';
import { soundService } from '~/services/sound-service';
import { SoundNames, TOWN_SFX_VOLUME } from '~/constants/audio';
import { ToffecButton } from '~/components/ui-custom/toffec-button';
import { FrostyRpgIcon } from '~/components/sprite-icons/frost-icons';
import { INN_WELCOME_TEXT } from '~/constants/flavor-text/welcome-text';
import { INNKEEPER_CHAR } from '~/constants/dialogue/characters';
import { TownLocationLayout } from './town-location-layout';
import { ToffecBeigeCornersWrapper } from '~/components/cursor/toffec-beige-corners-wrapper';
import { NarikWoodBitFont } from '~/components/bitmap-fonts/narik-wood';
import { PartyMemberCard } from '~/components/pause-menu/party-member-card';
import { getNavDirection, isConfirmKey } from '~/constants/keyboard';
import { useWindowKeyDown } from '~/hooks/use-window-keydown';
import { useKeyboardSelection, type KeyboardSelectableItem } from '~/hooks/use-keyboard-selection';
import { INN_HERO_COLUMNS } from '~/constants/game';

/** Splits the party into the rows the hero grid actually renders, so ←/→ stay spatially truthful. */
function chunk<T>(items: readonly T[], size: number): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += size) rows.push(items.slice(i, i + size));
  return rows;
}

const HEAL_ALL_ID = 'heal-all';

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
    soundService.playSound(SoundNames.clickCoin, TOWN_SFX_VOLUME.transaction);
    partyActions.fullyHealMember(member.id);
    resourcesActions.reduceResources(createResources({ coins: cost }));
  };

  const handleHealAll = () => {
    if (healPlan.entries.length === 0) return;
    soundService.playSound(SoundNames.clickCoin, TOWN_SFX_VOLUME.transaction);
    healPlan.entries.forEach((entry) => partyActions.fullyHealMember(entry.member.id));
    resourcesActions.reduceResources(createResources({ coins: healPlan.cost }));
  };

  // A hero is unselectable when either of the component's two "can't" paths applies: the card
  // drops its onClick once full, and handleHealMember early-returns when the coins fall short.
  const isHealDisabled = (member: CharacterData) =>
    member.currentHp >= member.maxHp || resources.coins < getHealCost(member);
  const isHealAllDisabled = isPartyFullyHealed || healPlan.entries.length === 0;

  const rows: KeyboardSelectableItem[][] = [
    ...chunk(party, INN_HERO_COLUMNS).map((row) => row.map((m) => ({ id: m.id, disabled: isHealDisabled(m) }))),
    [{ id: HEAL_ALL_ID, disabled: isHealAllDisabled }],
  ];

  const selection = useKeyboardSelection(rows, {
    onMove: () => soundService.playSound(SoundNames.clickChangeTab, TOWN_SFX_VOLUME.navTick, 0.1, 0.05),
  });

  useWindowKeyDown((event) => {
    if (event.defaultPrevented) return;

    const direction = getNavDirection(event.key);
    if (direction) {
      event.preventDefault();
      selection.move(direction);
      return;
    }

    if (!isConfirmKey(event.key)) return;
    event.preventDefault();
    if (event.repeat) return;
    const selectedId = selection.selectedId;
    if (selectedId === null) return;

    if (selectedId === HEAL_ALL_ID) {
      if (!isHealAllDisabled) handleHealAll();
      return;
    }
    const member = party.find((m) => m.id === selectedId);
    if (!member || isHealDisabled(member)) return;
    handleHealMember(member);
    // The healed hero is disabled now, so hop the cursor onward instead of stranding it
    // (a no-op when nothing else in the row is healable).
    selection.move('right');
  });

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
          <p className="town-section-subtitle">
            Click a wounded hero to heal them, or heal everyone at once below
          </p>
          <div className="party-members-list">
            <div className="party-members-grid inn-party-members-grid">
              {party.map((member) => {
                const isFull = member.currentHp >= member.maxHp;
                const cost = getHealCost(member);
                const canAffordHeal = resources.coins >= cost;

                return (
                  // Keep the card wrapped in the same element whether full or injured so React
                  // reuses the HP-fill node across a heal — that's what lets its width transition
                  // (pause-menu.css) animate the bar filling up instead of snapping to 100%.
                  <div key={member.id} className="inn-hero-cell">
                    <ToffecBeigeCornersWrapper
                      className={cn(isFull && 'inn-hero-card--healed', !isFull && !canAffordHeal && 'cannot-afford')}
                      forceDisplay={selection.isSelected(member.id)}
                    >
                      <PartyMemberCard
                        member={member}
                        variant="bar"
                        onClick={isFull ? undefined : () => handleHealMember(member)}
                      />
                    </ToffecBeigeCornersWrapper>
                    {isFull ? (
                      <div className="inn-hero-heal inn-hero-heal--full">Fully Healed</div>
                    ) : (
                      <div className={cn('inn-hero-heal', !canAffordHeal && 'inn-hero-heal--locked')}>
                        {canAffordHeal ? 'Heal' : 'Need'} · {cost}
                        <FrostyRpgIcon name="coinPurse" size={14} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Heal everyone affordable in one tap */}
        <div className="inn-actions">
          <span className="town-key-hint pixel-font">← → pick a hero · ↑ ↓ reach Heal All · Enter to heal</span>
          <ToffecBeigeCornersWrapper forceDisplay={selection.isSelected(HEAL_ALL_ID)}>
            <ToffecButton
              variant="cream"
              size="xs"
              onClick={handleHealAll}
              disabled={isHealAllDisabled}
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
