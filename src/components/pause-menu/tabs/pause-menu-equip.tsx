import { useState } from 'react';
import { useParty, usePartyActions, useInventory } from '~/stores/game-store';
import { CHARACTER_COLORS, CHARACTER_ICONS } from '~/constants/party';
import { cn } from '~/lib/utils';
import { RosterCard } from '~/components/pause-menu/roster-card';
import {
  type EquipmentSlot,
  findEquipmentItem,
  canEquip,
  getEquipmentBonuses,
  getEffectiveStats,
  getAvailableEquipmentForSlot,
} from '~/lib/equipment-system';
import type { EquipmentItemData } from '~/types/inventory';

const STAT_COLORS = {
  pow: '#e53935',
  vit: '#43a047',
  spd: '#1e88e5',
} as const;

export function PauseMenuEquip() {
  const party = useParty();
  const partyActions = usePartyActions();
  const inventory = useInventory();
  const [selectedId, setSelectedId] = useState(party[0]?.id ?? '');
  const [selectedSlot, setSelectedSlot] = useState<EquipmentSlot | null>(null);

  const selected = party.find((m) => m.id === selectedId) ?? party[0];
  if (!selected) return null;

  const colors = CHARACTER_COLORS[selected.class];
  const Icon = CHARACTER_ICONS[selected.class];
  const bonuses = getEquipmentBonuses(selected);
  const effective = getEffectiveStats(selected);

  const equippedWeapon = selected.equippedWeaponId
    ? findEquipmentItem(selected.equippedWeaponId)
    : undefined;
  const equippedArmor = selected.equippedArmorId
    ? findEquipmentItem(selected.equippedArmorId)
    : undefined;

  const availableItems = selectedSlot
    ? getAvailableEquipmentForSlot(selectedSlot, selected, party, inventory)
    : [];

  function handleSelectCharacter(id: string) {
    setSelectedId(id);
    setSelectedSlot(null);
  }

  function handleToggleSlot(slot: EquipmentSlot) {
    setSelectedSlot((prev) => (prev === slot ? null : slot));
  }

  function handleEquip(itemId: string) {
    if (!selectedSlot) return;
    partyActions.equipItem(selected.id, itemId, selectedSlot);
    setSelectedSlot(null);
  }

  function handleUnequip(slot: EquipmentSlot) {
    partyActions.unequipItem(selected.id, slot);
    if (selectedSlot === slot) setSelectedSlot(null);
  }

  return (
    <>
      <h2>Equip</h2>
      <div className="pause-menu-equip-layout">
        <div className="pause-menu-party-roster">
          {party.map((member) => (
            <RosterCard
              key={member.id}
              member={member}
              isActive={member.id === selectedId}
              onClick={() => handleSelectCharacter(member.id)}
            />
          ))}
        </div>

        <div className="pause-menu-equip-main">
          <div className="pause-menu-equip-header">
            <div className={cn('pause-menu-stats-icon', colors.bg)}>
              <Icon size={24} className={colors.icon} />
            </div>
            <div>
              <div className="pause-menu-stats-name">{selected.name}</div>
              <div className="pause-menu-stats-class">
                {selected.class} · Lv. {selected.level}
              </div>
            </div>
          </div>

          <div className="pause-menu-equip-slots">
            <EquipSlotRow
              label="Weapon"
              item={equippedWeapon}
              isActive={selectedSlot === 'weapon'}
              onToggle={() => handleToggleSlot('weapon')}
              onUnequip={() => handleUnequip('weapon')}
            />
            <EquipSlotRow
              label="Armor"
              item={equippedArmor}
              isActive={selectedSlot === 'armor'}
              onToggle={() => handleToggleSlot('armor')}
              onUnequip={() => handleUnequip('armor')}
            />
          </div>

          <EquipStatPreview baseStats={selected.stats} bonuses={bonuses} effective={effective} />

          {selectedSlot && (
            <div className="pause-menu-equip-available">
              <h3>
                Available {selectedSlot === 'weapon' ? 'Weapons' : 'Armor'}
              </h3>
              {availableItems.length === 0 ? (
                <div className="pause-menu-equip-empty">
                  No {selectedSlot === 'weapon' ? 'weapons' : 'armor'} available
                </div>
              ) : (
                availableItems.map((item) => (
                  <EquipAvailableItem
                    key={item.id}
                    item={item}
                    onEquip={() => handleEquip(item.id)}
                  />
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

interface EquipSlotRowProps {
  label: string;
  item: EquipmentItemData | undefined;
  isActive: boolean;
  onToggle: () => void;
  onUnequip: () => void;
}

function EquipSlotRow({ label, item, isActive, onToggle, onUnequip }: EquipSlotRowProps) {
  return (
    <div
      className={cn('pause-menu-equip-slot-row', isActive && 'active')}
      onClick={onToggle}
    >
      <span className="slot-label">{label}</span>
      <span className={cn('pause-menu-equip-slot-value', !item && 'empty')}>
        {item ? item.name : '— Empty —'}
      </span>
      {item && (
        <button
          className="pause-menu-equip-slot-remove"
          onClick={(e) => {
            e.stopPropagation();
            onUnequip();
          }}
        >
          ✕
        </button>
      )}
    </div>
  );
}

interface EquipStatPreviewProps {
  baseStats: { pow: number; vit: number; spd: number };
  bonuses: { pow: number; vit: number; spd: number };
  effective: { pow: number; vit: number; spd: number };
}

function EquipStatPreview({ baseStats, bonuses, effective }: EquipStatPreviewProps) {
  return (
    <div className="pause-menu-equip-preview">
      <h3>Stats</h3>
      {(['pow', 'vit', 'spd'] as const).map((stat) => (
        <div key={stat} className="pause-menu-equip-preview-row">
          <span className="pause-menu-equip-preview-label" style={{ color: STAT_COLORS[stat] }}>
            {stat.toUpperCase()}
          </span>
          <span className="pause-menu-equip-preview-base">{baseStats[stat]}</span>
          {bonuses[stat] !== 0 && (
            <span
              className={cn(
                'pause-menu-equip-stat-diff',
                bonuses[stat] > 0 ? 'positive' : 'negative',
              )}
            >
              {bonuses[stat] > 0 ? '+' : ''}{bonuses[stat]}
            </span>
          )}
          <span className="pause-menu-equip-preview-total">{effective[stat]}</span>
        </div>
      ))}
    </div>
  );
}

interface EquipAvailableItemProps {
  item: EquipmentItemData;
  onEquip: () => void;
}

function EquipAvailableItem({ item, onEquip }: EquipAvailableItemProps) {
  return (
    <div className="pause-menu-equip-available-item">
      <div className="pause-menu-equip-available-info">
        <div className="pause-menu-equip-available-name">{item.name}</div>
        <div className="pause-menu-equip-available-stats">
          {item.pow !== 0 && (
            <span className="pause-menu-item-stat-badge">
              POW {item.pow > 0 ? '+' : ''}{item.pow}
            </span>
          )}
          {item.vit !== 0 && (
            <span className="pause-menu-item-stat-badge">
              VIT {item.vit > 0 ? '+' : ''}{item.vit}
            </span>
          )}
          {item.spd !== 0 && (
            <span className="pause-menu-item-stat-badge">
              SPD {item.spd > 0 ? '+' : ''}{item.spd}
            </span>
          )}
        </div>
      </div>
      <button className="pause-menu-equip-btn" onClick={onEquip}>
        Equip
      </button>
    </div>
  );
}
