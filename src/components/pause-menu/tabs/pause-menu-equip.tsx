import { useEffect, useRef, useState } from 'react';
import NumberFlow from '@number-flow/react';
import { useParty, usePartyActions, useInventory } from '~/stores/game-store';
import { CHARACTER_COLORS, CHARACTER_ICONS } from '~/constants/party';
import { cn } from '~/lib/utils';
import { soundService } from '~/services/sound-service';
import { SoundNames } from '~/constants/audio';
import { getNavDirection, isConfirmKey } from '~/constants/keyboard';
import { useWindowKeyDown } from '~/hooks/use-window-keydown';
import { useKeyboardSelection, type KeyboardSelectableItem } from '~/hooks/use-keyboard-selection';
import { PartyMemberCard } from '~/components/pause-menu/party-member-card';
import { PauseMenuCharacterHeader } from '~/components/pause-menu/pause-menu-character-header';
import { NarikHeading } from '~/components/typography/narik-heading';
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
  getScaledEquipmentStats,
  getAvailableEquipmentForSlot,
} from '~/lib/equipment-system';
import { getRarityColor, getRarityLabel } from '~/lib/rarity';
import type { EquipmentItemData } from '~/types/inventory';
import type { RarityTier } from '~/constants/rarity';
import { FrostyRpgIcon } from '~/components/sprite-icons/frost-icons';
import { ToffecBeigeCornersWrapper } from '~/components/cursor/toffec-beige-corners-wrapper';
import { Tooltip, TooltipTrigger, TooltipContent } from '~/components/ui-custom/tooltip';
import { ToffecSquareButton } from '~/components/ui-custom/toffec-square-button';

// Warm parchment/gold stat palette — matches level-up-screen.css `.stat-name.*`
const STAT_COLORS = {
  pow: '#d48c46',
  vit: '#e3bb92',
  spd: '#d4a574',
} as const;

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

  const colors = CHARACTER_COLORS[selected.class];
  const Icon = CHARACTER_ICONS[selected.class];
  const bonuses = getEquipmentBonuses(selected);
  const effective = getEffectiveStats(selected);

  return (
    <div className="pause-menu-equip-tab">
      <NarikHeading as="h2" text="Equip" />
      <div className="pause-menu-equip-layout">
        <div className="pause-menu-equip-top-section">
          <div className="pause-menu-party-roster">
            <div className="pause-menu-party-roster-list">
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
            <PauseMenuCharacterHeader
              name={selected.name}
              classNameText={selected.class}
              level={selected.level}
              Icon={Icon}
              colors={colors}
            />

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
                <div className="pause-menu-equip-available-header">
                  <h3>Available {selectedSlot === 'weapon' ? 'Weapons' : 'Armor'}</h3>
                  <ToffecSquareButton
                    variant="medieval2"
                    size="sm"
                    hasBg={true}
                    aria-label="Close"
                    onClick={() => setSelectedSlot(null)}
                  />
                </div>
                {availableItems.length === 0 ? (
                  <div className="pause-menu-equip-empty">
                    No {selectedSlot === 'weapon' ? 'weapons' : 'armor'} available
                  </div>
                ) : (
                  availableItems.map((instance) => (
                    <EquipAvailableItem
                      key={availId(instance)}
                      instance={instance}
                      isEquipped={instance.item.id === equippedIdForSlot && instance.rarity === equippedRarityForSlot}
                      isKeyboardSelected={selection.isSelected(availId(instance))}
                      onEquip={() => handleEquip(instance.item.id, instance.rarity)}
                      rowRef={(el) => {
                        if (el) rowRefs.current.set(availId(instance), el);
                        else rowRefs.current.delete(availId(instance));
                      }}
                    />
                  ))
                )}
              </div>
            )}

            <EquipStatPreview bonuses={bonuses} effective={effective} />
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
      className={cn('pause-menu-equip-slot-row', isActive && 'active', isKeyboardSelected && 'kb-cursor')}
      onClick={onToggle}
    >
      <span className="slot-label">{label}</span>
      <span className="pause-menu-item-icon-slot">
        {item?.iconName && <FrostyRpgIcon name={item.iconName} size={24} />}
      </span>
      <span
        className={cn('pause-menu-equip-slot-value', !item && 'empty')}
        style={item ? { color: getRarityColor(rarity) } : undefined}
      >
        {item ? item.name : '— Empty —'}
        {item && (
          <span className="ml-1 text-[0.55rem] tracking-wider uppercase opacity-80">{getRarityLabel(rarity)}</span>
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

interface EquipStatPreviewProps {
  bonuses: { pow: number; vit: number; spd: number };
  effective: { pow: number; vit: number; spd: number };
}

function EquipStatPreview({ bonuses, effective }: EquipStatPreviewProps) {
  const stats = ['pow', 'vit', 'spd'] as const;

  return (
    <div className="pause-menu-equip-preview">
      <span className="pause-menu-equip-preview-title">Stats</span>
      <div className="pause-menu-equip-preview-grid">
        {stats.map((stat) => {
          const diff = bonuses[stat];
          return (
            <div key={stat} className="pause-menu-equip-preview-stat-group">
              <span className="pause-menu-equip-preview-label" style={{ color: STAT_COLORS[stat] }}>
                {stat}
              </span>
              <span className="pause-menu-equip-preview-total number-flow-container">
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
                  className={cn('pause-menu-equip-stat-diff number-flow-container', diff > 0 ? 'positive' : 'negative')}
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
  isEquipped: boolean;
  /** Keyboard cursor rests on this item. */
  isKeyboardSelected: boolean;
  onEquip: () => void;
  /** Registers the clickable row for scroll-into-view. */
  rowRef: (el: HTMLDivElement | null) => void;
}

function EquipAvailableItem({ instance, isEquipped, isKeyboardSelected, onEquip, rowRef }: EquipAvailableItemProps) {
  const { item, rarity } = instance;
  const stats = getScaledEquipmentStats(item, rarity);
  return (
    <ToffecBeigeCornersWrapper
      forceDisplay={isKeyboardSelected}
      className={cn('pause-menu-equip-available-item', isEquipped && 'is-equipped')}
    >
      <div className="pause-menu-equip-available-clickable" onClick={onEquip} ref={rowRef}>
        <span className="pause-menu-item-icon-slot">
          {item.iconName && <FrostyRpgIcon name={item.iconName} size={24} />}
        </span>
        <div className="pause-menu-equip-available-info">
          <div className="pause-menu-equip-available-name-row">
            <div className="pause-menu-equip-available-name" style={{ color: getRarityColor(rarity) }}>
              {item.name}
              <span className="ml-1 text-[0.55rem] tracking-wider uppercase opacity-80">{getRarityLabel(rarity)}</span>
            </div>
            {isEquipped && <span className="pause-menu-equip-available-badge">Equipped</span>}
          </div>
          <div className="pause-menu-equip-available-stats">
            {stats.pow !== 0 && (
              <span className="pause-menu-item-stat-badge">
                POW {stats.pow > 0 ? '+' : ''}
                {stats.pow}
              </span>
            )}
            {stats.vit !== 0 && (
              <span className="pause-menu-item-stat-badge">
                VIT {stats.vit > 0 ? '+' : ''}
                {stats.vit}
              </span>
            )}
            {stats.spd !== 0 && (
              <span className="pause-menu-item-stat-badge">
                SPD {stats.spd > 0 ? '+' : ''}
                {stats.spd}
              </span>
            )}
          </div>
        </div>
      </div>
    </ToffecBeigeCornersWrapper>
  );
}
