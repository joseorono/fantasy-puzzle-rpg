import type { townLocations } from '~/types/map-node';
import { getRandomElement } from '~/lib/utils';

export const TOWN_HUB_BG_IMAGES = ['/assets/bg/bg-town-1.jpg', '/assets/bg/bg-town-2.jpg'] as const;

export const BLACKSMITH_BG_IMAGES = ['/assets/bg/bg-blacksmith-1.jpg', '/assets/bg/bg-blacksmith-1-2.jpg'] as const;

export const INN_BG_IMAGES = ['/assets/bg/desk-inn-1.jpg', '/assets/bg/desk-inn-2.jpg', '/assets/bg/desk-inn.jpg'] as const;

export const ITEM_STORE_BG_IMAGES = ['/assets/bg/item-shop-bg1.jpg', '/assets/bg/item-shop-bg2.jpg'] as const;

const SUB_LOCATION_BG_IMAGES: Record<Exclude<townLocations, 'town-hub'>, readonly string[]> = {
  blacksmith: BLACKSMITH_BG_IMAGES,
  inn: INN_BG_IMAGES,
  'item-store': ITEM_STORE_BG_IMAGES,
};

export function pickSubLocationBackground(place: Exclude<townLocations, 'town-hub'>): string {
  return getRandomElement(SUB_LOCATION_BG_IMAGES[place]);
}

export function pickTownHubBackground(): string {
  return getRandomElement(TOWN_HUB_BG_IMAGES);
}
