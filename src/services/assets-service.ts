// No sé si sea lo más optimo, pero se me ocurre que se podrían pre-cargar los assets de la siguiente manera:
// const preloadin = await preloadEveryImage(['img1.jpg', 'img2.jpg'])

export const assetList: string[] = [
  // Portraits
  '/assets/portraits/Innkeeper_02.png',
  '/assets/portraits/Witch_03.png',

  // Backgrounds
  '/assets/bg/battle/simple_battle_background-2.jpg',
  '/assets/bg/battle/simple_battle_background.jpg',
  '/assets/bg/bg-blacksmith-1-2.jpg',
  '/assets/bg/bg-blacksmith-1.jpg',
  '/assets/bg/bg-town-1.jpg',
  '/assets/bg/bg-town-2.jpg',
  '/assets/bg/bgnoise-10-60-scroll.png',
  '/assets/bg/bgnoise-bg-10-40-gray.webp',
  '/assets/bg/desk-inn-1.jpg',
  '/assets/bg/desk-inn-2.jpg',
  '/assets/bg/desk-inn.jpg',
  '/assets/bg/item-shop-bg1.jpg',
  '/assets/bg/item-shop-bg2.jpg',
  '/assets/bg/reception-desk.jpg',

  // Looping Backgrounds
  '/assets/bg/looping/bg-board-2.png',
  '/assets/bg/looping/bg-board.png',
  '/assets/bg/looping/pc-castle-floor-tile.png',
  '/assets/bg/looping/pc-desert-floor-tile1.png',
  '/assets/bg/looping/pc-desert-floor-tile2.png',
  '/assets/bg/looping/pc-garden_1.png',
  '/assets/bg/looping/pc-garden-tile-loop.png',
  '/assets/bg/looping/tc-bg-wood-1.png',
  '/assets/bg/looping/tc-bg-wood-2.png',
  '/assets/bg/looping/tc-bg-wood-3.png',
  '/assets/bg/looping/tc-bg-wood-4.png',

  // Start Menu
  '/assets/bg/start-menu/main-menu-bg-2.jpg',
  '/assets/bg/start-menu/main-menu-bg.png',

  // UI Backgrounds
  '/assets/bg/tc-bg-item-darker.png',
  '/assets/bg/tc-bg-item-lighter.png',

  // Cursors
  '/assets/cursors/corners/toffeec-beige/toffeec-beige-cursor-bottomleft.png',
  '/assets/cursors/corners/toffeec-beige/toffeec-beige-cursor-bottomright.png',
  '/assets/cursors/corners/toffeec-beige/toffeec-beige-cursor-topleft.png',
  '/assets/cursors/corners/toffeec-beige/toffeec-beige-cursor-topright.png',
  '/assets/cursors/mouse/dwarven-gauntlet-cursor.png',

  // Enemies
  '/assets/enemy-sprites/frogger_idle.png',
  '/assets/enemy-sprites/gollux_idle.png',

  // Fonts
  '/assets/fonts/RedWood-5x-narik.png',
  '/assets/fonts/RedWood-narik.png',
  '/assets/fonts/Wood-5x-narik.png',
  '/assets/fonts/Wood-narik.png',

  // Frames
  '/assets/frame/frame1-bottom-loop.png',
  '/assets/frame/frame1-left.png',
  '/assets/frame/frame1-lower-left-corner.png',
  '/assets/frame/frame1-lower-right-corner.png',
  '/assets/frame/frame1-right.png',
  '/assets/frame/frame1-top-loop.png',
  '/assets/frame/frame1-upper-left-corner.png',
  '/assets/frame/frame1-upper-right-corner.png',
  '/assets/frame/franuka-05a/frame-bottom-left-corner.png',
  '/assets/frame/franuka-05a/frame-bottom-right-corner.png',
  '/assets/frame/franuka-05a/frame-loop-bottom.png',
  '/assets/frame/franuka-05a/frame-loop-left.png',
  '/assets/frame/franuka-05a/frame-loop-right.png',
  '/assets/frame/franuka-05a/frame-loop-top.png',
  '/assets/frame/franuka-05a/frame-top-left-corner.png',
  '/assets/frame/franuka-05a/frame-top-right-corner.png',

  // Icons
  '/assets/icons/rpg-icons-sprite-frostyrabbid-24x24.png',
  '/assets/icons/skull-frostyrabbid.png',

  // Menu assets
  '/assets/menu/back-button-hover.png',
  '/assets/menu/back-button.png',
  '/assets/menu/plank-option-beta.png',
  '/assets/menu/plank-option.png',
  '/assets/menu/settings-icon-hover.png',
  '/assets/menu/settings-icon.png',
  '/assets/menu/start/settings-icon-hover.png',
  '/assets/menu/start/settings-icon.png',
  '/assets/menu/start/start.menu.png',
  '/assets/menu/stick.png',

  // Orbs
  '/assets/orbs/orb_blue.png',
  '/assets/orbs/orb_green.png',
  '/assets/orbs/orb_purple.png',
  '/assets/orbs/orb_red.png',
  '/assets/orbs/orb_yellow.png',

  // Sprites
  '/assets/sprite/character-placeholder.png',

  // Tilesets
  '/assets/tileset/demo-map-2.png',
  '/assets/tileset/demo-map.png',
  '/assets/tileset/pc-forge-tileset.png',

  // Transitions
  '/assets/transitions/circle.svg',

  // UI System
  '/assets/ui-system/golden_ui_big_pieces.png',
];

class AssetsService {
  private static instance: AssetsService;
  public isPreloading: boolean = false;
  public assetsLoaded: boolean = false;

  constructor() {
    if (!AssetsService.instance) {
      console.log('created new instance of AssetsService');
      this.isPreloading = false;
      this.assetsLoaded = false;
      AssetsService.instance = this;
    }
    return AssetsService.instance;
  }

  shouldPreload(): boolean {
    return !this.assetsLoaded && !this.isPreloading;
  }

  preloadImage = (src: string) =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = resolve;
      img.onerror = reject;
      img.src = src;
    });

  preloadEveryImage = async (srcs: string[]) => {
    if (!this.shouldPreload()) {
      console.log('assets service is already loaded');
      return;
    }
    this.isPreloading = true;
    await Promise.all(srcs.map(this.preloadImage))
      .then(() => {
        console.log('all assets loaded successfully');
        this.assetsLoaded = true;
      })
      .catch((error) => console.error('error loading image service ==> ', error))
      .finally(() => (this.isPreloading = false));
  };
}

export const assetsService = new AssetsService();
