import { useEffect, useRef, useState } from 'react';
import NumberFlow from '@number-flow/react';
import { useParty, usePartyActions, useInventory } from '~/stores/game-store';
import { cn } from '~/lib/utils';
import { soundService } from '~/services/sound-service';
import { SoundNames } from '~/constants/audio';
import { getNavDirection, isConfirmKey } from '~/constants/keyboard';
import { useWindowKeyDown } from '~/hooks/use-window-keydown';
import { useKeyboardSelection, type KeyboardSelectableItem } from '~/hooks/use-keyboard-selection';
import { PartyMemberCard } from '~/components/party/party-member-card';
import { PauseMenuCharacterHeader } from '~/components/pause-menu/pause-menu-character-header';
import { PauseMenuTabHeader } from '~/components/pause-menu/pause-menu-tab-header';
import {
  SNAPPY_SPIN_TIMING,
  SNAPPY_TRANSFORM_TIMING,
  SNAPPY_OPACITY_TIMING,
  INTEGER_FORMAT,
} from '~/constants/number-flow';
import {
  type EquipmentSlot,
  type EquipmentInstance,
  findEquipmentItem,
  getEquipmentBonuses,
  getEffectiveStats,
  getEquipmentSwapDelta,
  getScaledEquipmentStats,
  getAvailableEquipmentForSlot,
} from '~/lib/equipment-system';
import { getRarityColor, getRarityLabel } from '~/lib/rarity';
import type { EquipmentItemData } from '~/types/inventory';
import type { CoreRPGStats } from '~/types/rpg-elements';
import type { RarityTier } from '~/constants/rarity';
import { ItemIcon } from '~/components/sprite-icons/item-icon';
import { Tooltip, TooltipTrigger, TooltipContent } from '~/components/ui-custom/tooltip';
import { ToffecSquareButton } from '~/components/ui-custom/toffec-square-button';

const STAT_KEYS = ['pow', 'vit', 'spd'] as const;

/** Stable keyboard id for an available-equipment instance. */
function availId(instance: EquipmentInstance): string {
  return `avail:${instance.item.id}::${instance.rarity}`;
}

interface PauseMenuEquipProps {
  /** The content zone owns the keyboard — arrows/Enter act on this pane. */
  keyboardActive?: boolean;
  /** Fired when ← from the roster hands the keyboard back to the sidebar. */
  onExitToSidebar?: () => void;
}

export function PauseMenuEquip({ keyboardActive = false, onExitToSidebar }: PauseMenuEquipProps) {
  const party = useParty();
  const partyActions = usePartyActions();
  const inventory = useInventory();
  const [selectedId, setSelectedId] = useState(party[0]?.id ?? '');
  const [selectedSlot, setSelectedSlot] = useState<EquipmentSlot | null>(null);
  // Which column the keyboard cursor lives in: the party roster or the slots/list pane.
  const [column, setColumn] = useState<'roster' | 'main'>('roster');
  const rowRefs = useRef(new Map<string, HTMLDivElement>());

  const selected = party.find((m) => m.id === selectedId) ?? party[0];

  const equippedWeapon = selected?.equippedWeaponId ? findEquipmentItem(selected.equippedWeaponId) : undefined;
  const equippedArmor = selected?.equippedArmorId ? findEquipmentItem(selected.equippedArmorId) : undefined;

  const availableItems =
    selectedSlot && selected ? getAvailableEquipmentForSlot(selectedSlot, selected, party, inventory) : [];
  const equippedIdForSlot = selectedSlot === 'weapon' ? selected?.equippedWeaponId : selected?.equippedArmorId;
  const equippedRarityForSlot =
    selectedSlot === 'weapon' ? selected?.equippedWeaponRarity : selected?.equippedArmorRarity;

  function handleSelectCharacter(id: string) {
    setSelectedId(id);
    setSelectedSlot(null);
  }

  function handleToggleSlot(slot: EquipmentSlot) {
    setSelectedSlot((prev) => (prev === slot ? null : slot));
  }

  function handleEquip(itemId: string, rarity: RarityTier) {
    if (!selectedSlot || !selected) return;
    partyActions.equipItem(selected.id, itemId, selectedSlot, rarity);
    setSelectedSlot(null);
  }

  function handleUnequip(slot: EquipmentSlot) {
    if (!selected) return;
    partyActions.unequipItem(selected.id, slot);
    if (selectedSlot === slot) setSelectedSlot(null);
  }

  // ─── Keyboard: main-column grid (slot rows + conditional available list) ──
  const gridRows: KeyboardSelectableItem[][] = [
    [{ id: 'slot:weapon' }, { id: 'unequip:weapon', disabled: !equippedWeapon }],
    [{ id: 'slot:armor' }, { id: 'unequip:armor', disabled: !equippedArmor }],
    ...availableItems.map((instance) => [{ id: availId(instance) }]),
  ];

  const selection = useKeyboardSelection(gridRows, {
    onMove: () => soundService.playSound(SoundNames.clickChangeTab, 0.35, 0.1, 0.05),
  });

  // Leaving the pane (← or Escape back to the sidebar) re-arms the roster column and
  // drops the cursor, so a later return can't show a stale one.
  const selectionRef = useRef(selection);
  selectionRef.current = selection;
  useEffect(() => {
    if (keyboardActive) return;
    setColumn('roster');
    selectionRef.current.clear();
  }, [keyboardActive]);

  // Keep the keyboard-selected available item visible in its scrolling list.
  useEffect(() => {
    if (!selection.selectedId) return;
    rowRefs.current.get(selection.selectedId)?.scrollIntoView({ block: 'nearest' });
  }, [selection.selectedId]);

  useWindowKeyDown((event) => {
    if (event.defaultPrevented) return;
    const direction = getNavDirection(event.key);

    if (column === 'roster') {
      if (direction === 'up' || direction === 'down') {
        event.preventDefault();
        const currentIndex = party.findIndex((m) => m.id === selectedId);
        const step = direction === 'down' ? 1 : -1;
        const next = party[(currentIndex + step + party.length) % party.length];
        if (next && next.id !== selectedId) {
          soundService.playSound(SoundNames.clickChangeTab, 0.35, 0.1, 0.05);
          handleSelectCharacter(next.id);
        }
        return;
      }
      if (direction === 'left') {
        event.preventDefault();
        onExitToSidebar?.();
        return;
      }
      if (direction === 'right' || isConfirmKey(event.key)) {
        event.preventDefault();
        if (isConfirmKey(event.key) && event.repeat) return;
        setColumn('main');
        selection.select('slot:weapon');
      }
      return;
    }

    // Main column
    if (direction) {
      event.preventDefault();
      // ← at the left edge steps back to the roster (available rows and slot rows both sit at col 0).
      if (direction === 'left' && (selection.position === null || selection.position.colIndex === 0)) {
        selection.clear();
        setColumn('roster');
        return;
      }
      selection.move(direction);
      return;
    }

    if (isConfirmKey(event.key)) {
      event.preventDefault();
      if (event.repeat) return;
      const entry = gridRows.flat().find((item) => item.id === selection.selectedId);
      if (!entry || entry.disabled) return;
      if (entry.id === 'slot:weapon' || entry.id === 'slot:armor') {
        soundService.playSound(SoundNames.mechanicalClick, 0.5);
        handleToggleSlot(entry.id === 'slot:weapon' ? 'weapon' : 'armor');
        return;
      }
      if (entry.id.startsWith('unequip:')) {
        handleUnequip(entry.id.slice('unequip:'.length) as EquipmentSlot);
        return;
      }
      const instance = availableItems.find((candidate) => availId(candidate) === entry.id);
      if (instance && selectedSlot) {
        const slot = selectedSlot;
        handleEquip(instance.item.id, instance.rarity);
        // The list closes on equip; put the cursor back on the slot it belonged to.
        selection.select(`slot:${slot}`);
      }
    }
  }, keyboardActive);

  if (!selected) return null;

  const bonuses = getEquipmentBonuses(selected);
  const effective = getEffectiveStats(selected);

  return (
    <div className="pause-menu-equip-tab">
      <PauseMenuTabHeader text="Equip" hint="Choose a hero, then swap their weapon and armor." />
      <div className="pause-menu-equip-layout">
        <div className="pause-menu-equip-top-section">
          <div className="party-roster">
            <div className="party-roster-list">
              {party.map((member) => (
                <PartyMemberCard
                  key={member.id}
                  member={member}
                  variant="roster"
                  isActive={member.id === selectedId}
                  isKeyboardCursor={keyboardActive && column === 'roster' && member.id === selectedId}
                  onClick={() => handleSelectCharacter(member.id)}
                />
              ))}
            </div>
          </div>

          <div className="pause-menu-equip-main">
            <PauseMenuCharacterHeader member={selected} />

            <div className="pause-menu-equip-slots">
              <EquipSlotRow
                label="Weapon"
                item={equippedWeapon}
                rarity={selected.equippedWeaponRarity}
                isActive={selectedSlot === 'weapon'}
                isKeyboardSelected={selection.isSelected('slot:weapon')}
                isUnequipKeyboardSelected={selection.isSelected('unequip:weapon')}
                onToggle={() => handleToggleSlot('weapon')}
                onUnequip={() => handleUnequip('weapon')}
              />
              <EquipSlotRow
                label="Armor"
                item={equippedArmor}
                rarity={selected.equippedArmorRarity}
                isActive={selectedSlot === 'armor'}
                isKeyboardSelected={selection.isSelected('slot:armor')}
                isUnequipKeyboardSelected={selection.isSelected('unequip:armor')}
                onToggle={() => handleToggleSlot('armor')}
                onUnequip={() => handleUnequip('armor')}
              />
            </div>

            {selectedSlot && (
              <div className="pause-menu-equip-available">
                <div className="pause-menu-equip-available__header">
                  <h3 className="pause-menu-equip-available__title">
                    Available {selectedSlot === 'weapon' ? 'Weapons' : 'Armor'}
                  </h3>
                  <ToffecSquareButton
                    variant="medieval2"
                    size="sm"
                    hasBg={true}
                    aria-label="Close"
                    onClick={() => setSelectedSlot(null)}
                  />
                </div>
                {availableItems.length === 0 ? (
                  <div className="pause-menu-empty pause-menu-empty--items">
                    No {selectedSlot === 'weapon' ? 'weapons' : 'armor'} available
                  </div>
                ) : (
                  <div className="pause-menu-equip-available__list">
                    {availableItems.map((instance) => (
                      <EquipAvailableItem
                        key={availId(instance)}
                        instance={instance}
                        delta={getEquipmentSwapDelta(selected, selectedSlot, instance)}
                        isEquipped={instance.item.id === equippedIdForSlot && instance.rarity === equippedRarityForSlot}
                        isKeyboardSelected={selection.isSelected(availId(instance))}
                        onEquip={() => handleEquip(instance.item.id, instance.rarity)}
                        rowRef={(el) => {
                          if (el) rowRefs.current.set(availId(instance), el);
                          else rowRefs.current.delete(availId(instance));
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            <GearStatSummary bonuses={bonuses} effective={effective} />
          </div>
        </div>
      </div>
    </div>
  );
}

interface EquipSlotRowProps {
  label: string;
  item: EquipmentItemData | undefined;
  rarity: RarityTier | undefined;
  isActive: boolean;
  /** Keyboard cursor rests on the row itself. */
  isKeyboardSelected: boolean;
  /** Keyboard cursor rests on the row's Unequip button. */
  isUnequipKeyboardSelected: boolean;
  onToggle: () => void;
  onUnequip: () => void;
}

/** A gear socket (Indigolay slot frame, gold while its list is open), the slot label over name and rarity, and Unequip. */
function EquipSlotRow({
  label,
  item,
  rarity,
  isActive,
  isKeyboardSelected,
  isUnequipKeyboardSelected,
  onToggle,
  onUnequip,
}: EquipSlotRowProps) {
  return (
    <div
      className={cn(
        'pause-menu-equip-slot-row',
        isActive && 'active',
        !item && 'is-empty',
        isKeyboardSelected && 'kb-cursor',
      )}
      onClick={onToggle}
    >
      <span className="pause-menu-equip-socket">{item && <ItemIcon item={item} size={32} />}</span>
      <span className="pause-menu-equip-slot-row__text">
        <span className="pause-menu-equip-slot-row__label">{label}</span>
        {item ? (
          <>
            <span className="pause-menu-item-row__name" style={{ color: getRarityColor(rarity) }}>
              {item.name}
            </span>
            <RarityStatLine item={item} rarity={rarity} />
          </>
        ) : (
          <span className="pause-menu-item-row__name pause-menu-equip-slot-row__empty">Empty</span>
        )}
      </span>
      {item && (
        <Tooltip>
          <TooltipTrigger>
            <ToffecSquareButton
              variant="medieval2"
              size="sm"
              hasBg={true}
              aria-label="Unequip"
              className={cn(isUnequipKeyboardSelected && 'kb-cursor')}
              onClick={(e) => {
                e.stopPropagation();
                onUnequip();
              }}
            />
          </TooltipTrigger>
          <TooltipContent>Unequip</TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}

interface RarityStatLineProps {
  item: EquipmentItemData;
  rarity: RarityTier | undefined;
}

/** Rarity label, then the piece's own rarity-scaled POW/VIT/SPD (zeros left out). */
function RarityStatLine({ item, rarity }: RarityStatLineProps) {
  const stats = getScaledEquipmentStats(item, rarity);

  return (
    <span className="pause-menu-equip-subline">
      <span className="pause-menu-item-row__rarity" style={{ color: getRarityColor(rarity) }}>
        {getRarityLabel(rarity)}
      </span>
      {STAT_KEYS.filter((stat) => stats[stat] !== 0).map((stat) => (
        <span key={stat} className="pause-menu-equip-raw">
          <span className={`gear-stats__label gear-stats__label--${stat}`}>{stat}</span>
          {stats[stat]}
        </span>
      ))}
    </span>
  );
}

interface GearStatSummaryProps {
  bonuses: { pow: number; vit: number; spd: number };
  effective: { pow: number; vit: number; spd: number };
}

/** The hero's effective stats with their current gear, plus what that gear adds. */
function GearStatSummary({ bonuses, effective }: GearStatSummaryProps) {
  return (
    <div className="gear-stats">
      <span className="gear-stats__title">Stats</span>
      <div className="gear-stats__grid">
        {STAT_KEYS.map((stat) => {
          const diff = bonuses[stat];
          return (
            <div key={stat} className="gear-stats__chip">
              <span className={`gear-stats__label gear-stats__label--${stat}`}>{stat}</span>
              <span className="gear-stats__value number-flow-container">
                <NumberFlow
                  value={effective[stat]}
                  format={INTEGER_FORMAT}
                  spinTiming={SNAPPY_SPIN_TIMING}
                  transformTiming={SNAPPY_TRANSFORM_TIMING}
                  opacityTiming={SNAPPY_OPACITY_TIMING}
                />
              </span>
              {diff !== 0 && (
                <span
                  className={cn(
                    'gear-stats__bonus number-flow-container',
                    diff > 0 ? 'gear-stats__bonus--up' : 'gear-stats__bonus--down',
                  )}
                >
                  <NumberFlow
                    value={diff}
                    format={INTEGER_FORMAT}
                    prefix={diff > 0 ? '+' : ''}
                    spinTiming={SNAPPY_SPIN_TIMING}
                    transformTiming={SNAPPY_TRANSFORM_TIMING}
                    opacityTiming={SNAPPY_OPACITY_TIMING}
                  />
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface EquipAvailableItemProps {
  instance: EquipmentInstance;
  /** Stat change if this piece replaced the one in the slot. */
  delta: CoreRPGStats;
  isEquipped: boolean;
  /** Keyboard cursor rests on this item. */
  isKeyboardSelected: boolean;
  onEquip: () => void;
  /** Registers the row for scroll-into-view. */
  rowRef: (el: HTMLDivElement | null) => void;
}

/** An Items-list row for a candidate piece: icon, name and rarity, then Equipped or the swap's stat change. */
function EquipAvailableItem({
  instance,
  delta,
  isEquipped,
  isKeyboardSelected,
  onEquip,
  rowRef,
}: EquipAvailableItemProps) {
  const { item, rarity } = instance;
  const changedStats = STAT_KEYS.filter((stat) => delta[stat] !== 0);

  return (
    <div
      ref={rowRef}
      className={cn('pause-menu-item-row', isEquipped && 'selected', isKeyboardSelected && 'kb-cursor')}
      onClick={onEquip}
    >
      <span className="pause-menu-item-row__icon">
        <ItemIcon item={item} size={24} />
      </span>
      <span className="pause-menu-item-row__text">
        <span className="pause-menu-item-row__name" style={{ color: getRarityColor(rarity) }}>
          {item.name}
        </span>
        <RarityStatLine item={item} rarity={rarity} />
      </span>
      <span className="pause-menu-item-row__meta">
        {isEquipped ? (
          <span className="pause-menu-item-row__equipped">Equipped</span>
        ) : changedStats.length === 0 ? (
          <span className="pause-menu-equip-delta pause-menu-equip-delta--none">—</span>
        ) : (
          changedStats.map((stat) => (
            <span
              key={stat}
              className={cn(
                'pause-menu-equip-delta',
                delta[stat] > 0 ? 'pause-menu-equip-delta--up' : 'pause-menu-equip-delta--down',
              )}
            >
              <span className={`gear-stats__label gear-stats__label--${stat}`}>{stat}</span>
              {delta[stat] > 0 ? `+${delta[stat]}` : delta[stat]}
            </span>
          ))
        )}
      </span>
    </div>
  );
}
