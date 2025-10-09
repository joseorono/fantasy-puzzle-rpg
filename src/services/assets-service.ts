// No sé si sea lo más optimo, pero se me ocurre que se podrían pre-cargar los assets de la siguiente manera:
// const preloadin = await preloadEveryImage(['img1.jpg', 'img2.jpg'])

export const assetList: string[] = [
  '/assets/bg/bgnoise-10-60-scroll.png',
  '/assets/bg/bgnoise-bg-10-40-gray.webp',
  '/assets/bg/dirt_tile.png',
  '/assets/bg/modal_bg_pixel.webp',
  '/assets/bg/navbarbg.png',
  '/assets/resources/coin.png',
  '/assets/resources/stone.png',
  '/assets/resources/wheat.png',
  '/assets/biggest-coin.png',
  '/assets/logo_aurelian.png',
  '/assets/splashscreen.webp',
  '/assets/town-view-tiles/background/parchmentAncient.png',
  '/assets/town-view-tiles/buildings/bakery.png',
  '/assets/town-view-tiles/buildings/castra.png',
  '/assets/town-view-tiles/buildings/fields.png',
  '/assets/town-view-tiles/buildings/forum.png',
  '/assets/town-view-tiles/buildings/quarry.png',
  '/assets/town-view-tiles/buildings/smithy.png',
  '/assets/town-view-tiles/buildings/temple.png',
  '/assets/town-view-tiles/decor/citizen.png',
  '/assets/town-view-tiles/decor/tree.png',
  '/assets/town-view-tiles/workers/agricola.png',
  '/assets/town-view-tiles/workers/baker.png',
  '/assets/town-view-tiles/workers/blacksmith.png',
  '/assets/town-view-tiles/workers/legionary.png',
  '/assets/town-view-tiles/workers/mercator.png',
  '/assets/town-view-tiles/workers/miner.png',
  '/assets/town-view-tiles/workers/priest.png',
  '/assets/town-view-tiles/workers/slave.png',
  // '/favicon.png',
];

class AssetsService {
  private static instance: AssetsService;
  public isPreloading: boolean;
  public assetsLoaded: boolean;

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
      let img = new Image();
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
      .then((_) => {
        console.log('all assets loaded successfully');
        this.assetsLoaded = true;
      })
      .catch((error) => console.error('error loading image service ==> ', error))
      .finally(() => (this.isPreloading = false));
  };
}

export const assetsService = new AssetsService();
