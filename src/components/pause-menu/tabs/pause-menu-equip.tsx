import { useState } from 'react';
import NumberFlow from '@number-flow/react';
import { useParty, usePartyActions, useInventory, useCurrentView } from '~/stores/game-store';
import { SkillSelector } from '~/components/pause-menu/skill-selector';
import { CHARACTER_COLORS, CHARACTER_ICONS } from '~/constants/party';
import { cn } from '~/lib/utils';
import { PartyMemberCard } from '~/components/pause-menu/party-member-card';
import { PauseMenuCharacterHeader } from '~/components/pause-menu/pause-menu-character-header';
import { NarikRedwoodBitFont } from '~/components/bitmap-fonts/narik-redwood';
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

export function PauseMenuEquip() {
  const party = useParty();
  const partyActions = usePartyActions();
  const inventory = useInventory();
  const [selectedId, setSelectedId] = useState(party[0]?.id ?? '');
  const [selectedSlot, setSelectedSlot] = useState<EquipmentSlot | null>(null);

  const isInBattle = useCurrentView() === 'battle-demo';

  const selected = party.find((m) => m.id === selectedId) ?? party[0];
  if (!selected) return null;

  const colors = CHARACTER_COLORS[selected.class];
  const Icon = CHARACTER_ICONS[selected.class];
  const bonuses = getEquipmentBonuses(selected);
  const effective = getEffectiveStats(selected);

  const equippedWeapon = selected.equippedWeaponId ? findEquipmentItem(selected.equippedWeaponId) : undefined;
  const equippedArmor = selected.equippedArmorId ? findEquipmentItem(selected.equippedArmorId) : undefined;

  const availableItems = selectedSlot ? getAvailableEquipmentForSlot(selectedSlot, selected, party, inventory) : [];
  const equippedIdForSlot = selectedSlot === 'weapon' ? selected.equippedWeaponId : selected.equippedArmorId;
  const equippedRarityForSlot = selectedSlot === 'weapon' ? selected.equippedWeaponRarity : selected.equippedArmorRarity;

  function handleSelectCharacter(id: string) {
    setSelectedId(id);
    setSelectedSlot(null);
  }

  function handleToggleSlot(slot: EquipmentSlot) {
    setSelectedSlot((prev) => (prev === slot ? null : slot));
  }

  function handleEquip(itemId: string, rarity: RarityTier) {
    if (!selectedSlot) return;
    partyActions.equipItem(selected.id, itemId, selectedSlot, rarity);
    setSelectedSlot(null);
  }

  function handleUnequip(slot: EquipmentSlot) {
    partyActions.unequipItem(selected.id, slot);
    if (selectedSlot === slot) setSelectedSlot(null);
  }

  return (
    <div className="pause-menu-equip-tab">
      <h2>
        <NarikRedwoodBitFont text="EQUIP" size={1.2} />
      </h2>
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
                onToggle={() => handleToggleSlot('weapon')}
                onUnequip={() => handleUnequip('weapon')}
              />
              <EquipSlotRow
                label="Armor"
                item={equippedArmor}
                rarity={selected.equippedArmorRarity}
                isActive={selectedSlot === 'armor'}
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
                      key={`${instance.item.id}::${instance.rarity}`}
                      instance={instance}
                      isEquipped={instance.item.id === equippedIdForSlot && instance.rarity === equippedRarityForSlot}
                      onEquip={() => handleEquip(instance.item.id, instance.rarity)}
                    />
                  ))
                )}
              </div>
            )}

            <SkillSelector character={selected} disabled={isInBattle} />

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
  onToggle: () => void;
  onUnequip: () => void;
}

function EquipSlotRow({ label, item, rarity, isActive, onToggle, onUnequip }: EquipSlotRowProps) {
  return (
    <div className={cn('pause-menu-equip-slot-row', isActive && 'active')} onClick={onToggle}>
      <span className="slot-label">{label}</span>
      <span className="pause-menu-item-icon-slot">
        {item?.iconName && <FrostyRpgIcon name={item.iconName} size={24} />}
      </span>
      <span
        className={cn('pause-menu-equip-slot-value', !item && 'empty')}
        style={item ? { color: getRarityColor(rarity) } : undefined}
      >
        {item ? item.name : '— Empty —'}
        {item && <span className="ml-1 text-[0.55rem] tracking-wider uppercase opacity-80">{getRarityLabel(rarity)}</span>}
      </span>
      {item && (
        <Tooltip>
          <TooltipTrigger>
            <ToffecSquareButton
              variant="medieval2"
              size="sm"
              hasBg={true}
              aria-label="Unequip"
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
                  className={cn(
                    'pause-menu-equip-stat-diff number-flow-container',
                    diff > 0 ? 'positive' : 'negative',
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
  isEquipped: boolean;
  onEquip: () => void;
}

function EquipAvailableItem({ instance, isEquipped, onEquip }: EquipAvailableItemProps) {
  const { item, rarity } = instance;
  const stats = getScaledEquipmentStats(item, rarity);
  return (
    <ToffecBeigeCornersWrapper className={cn('pause-menu-equip-available-item', isEquipped && 'is-equipped')}>
      <div className="pause-menu-equip-available-clickable" onClick={onEquip}>
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
