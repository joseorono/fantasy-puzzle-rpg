// types/tilemap.ts
export interface TilemapLayer {
  data: number[];
  height: number;
  id: number;
  name: string;
  opacity: number;
  type: string;
  visible: boolean;
  width: number;
  x: number;
  y: number;
}

export interface TilemapTileset {
  columns: number;
  firstgid: number;
  image: string;
  imageheight: number;
  imagewidth: number;
  margin: number;
  name: string;
  spacing: number;
  tilecount: number;
  tileheight: number;
  tilewidth: number;
}

export interface TilemapData {
  compressionlevel: number;
  height: number;
  infinite: boolean;
  layers: TilemapLayer[];
  width: number;
  nextlayerid?: number;
  nextobjectid?: number;
  orientation?: string;
  renderorder?: string;
  tiledversion?: string;
  tileheight?: number;
  tilesets?: TilemapTileset[];
  tilewidth?: number;
  type?: string;
  version?: string;
}

export interface TilemapProps {
  tilesetImage: string;
  visibleLayers?: string[];
}
