export interface xy {
  x: number;
  y: number;
}

export interface DrawData {
  color: string;
  size: number;
  strokes: { from: xy; to: xy }[];
}

export interface MapData {
  title: string;
  subtitle: string;
  drawData?: DrawData[];
  grassMask?: string;
  sandMask?: string;
  flag: xy;
  windmills: xy[];
  portals: { a: xy; b: xy; id?: number }[];
  width: number;
  height: number;
  grassMaskImage?: HTMLImageElement;
  sandMaskImage?: HTMLImageElement;
}

export interface MapMasks {
  grass?: Phaser.Display.Masks.BitmapMask;
  grassBase?: Phaser.Display.Masks.BitmapMask;
  sand?: Phaser.Display.Masks.BitmapMask;
}

export interface BrushLayers {
  drawLayers: Phaser.GameObjects.RenderTexture[];
  eraseLayers: Phaser.GameObjects.RenderTexture[];
}
