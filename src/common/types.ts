export interface xy {
  x: number;
  y: number;
}

export interface MapData {
  title: string;
  subtitle: string;
  grassMask: string;
  sandMask: string;
  flag: xy;
  windmills: xy[];
  portals: { a: xy; b: xy; id?: number }[];
  width: number;
  height: number;
  grassMaskImage?: HTMLImageElement;
  sandMaskImage?: HTMLImageElement;
}
