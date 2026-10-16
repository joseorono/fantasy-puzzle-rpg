import type { ChestLootIcon } from '~/types/chest';
import type { LootTable } from '~/types/loot';
import { ItemIcon } from '~/components/sprite-icons/item-icon';
import { FrostyRpgIcon } from '~/components/sprite-icons/frost-icons';
import { RESOURCE_DISPLAY_ORDER, RESOURCE_ICON_NAMES } from '~/constants/resources';
import { getRarityColor } from '~/lib/rarity';

/**
 * Every piece of a chest's loot as a renderable icon, in launch order: equipment, then
 * consumables, then one icon per earned resource.
 *
 * @param loot What the chest granted.
 * @param size Icon edge length in pixels.
 */
export function buildChestLootIcons(loot: LootTable, size: number): ChestLootIcon[] {
  const equipment = loot.equipableItems.map(
    (lootItem, index): ChestLootIcon => ({
      key: `equipment-${index}`,
      kind: 'equipment',
      icon: <ItemIcon item={lootItem.item} size={size} />,
      color: getRarityColor(lootItem.rarity),
    }),
  );
  const consumables = loot.consumableItems.map(
    (lootItem, index): ChestLootIcon => ({
      key: `consumable-${index}`,
      kind: 'consumable',
      icon: <ItemIcon item={lootItem.item} size={size} />,
    }),
  );
  const resources = RESOURCE_DISPLAY_ORDER.filter((key) => loot.resources.item[key] > 0).map(
    (key): ChestLootIcon => ({
      key: `resource-${key}`,
      kind: 'resource',
      icon: <FrostyRpgIcon name={RESOURCE_ICON_NAMES[key]} size={size} />,
    }),
  );

  return [...equipment, ...consumables, ...resources];
}
