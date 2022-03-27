import { CloudSprite } from './cloud-sprite';
import { WaterSprite } from './water-sprite';
import config from '../../common/config';
import { BrushLayers, DrawData, MapData, MapMasks, xy } from '../../common/types';
import { getGameHeight } from '../../helpers';

const FLAG_HITBOX_RADIUS = 30;
const FLAG_X_OFFSET = 10;
const FLAG_Y_OFFSET = 50;

// TODO this stuff and COLORS and other draw logic should be centralized, currently stuff duplicated here and in draw-scene
const BRUSH_RADIUS_SM = 30;
const BRUSH_RADIUS_MD = 60;
const BRUSH_RADIUS_LG = 90;
const BRUSH_RADIUS_ARR = [BRUSH_RADIUS_SM, BRUSH_RADIUS_MD, BRUSH_RADIUS_LG];
const BRUSH_CIRCLES = [
  new Phaser.Geom.Circle(BRUSH_RADIUS_SM / 2, BRUSH_RADIUS_SM / 2, BRUSH_RADIUS_SM),
  new Phaser.Geom.Circle(BRUSH_RADIUS_MD / 2, BRUSH_RADIUS_MD / 2, BRUSH_RADIUS_MD),
  new Phaser.Geom.Circle(BRUSH_RADIUS_LG / 2, BRUSH_RADIUS_LG / 2, BRUSH_RADIUS_LG),
];

export class Map extends Phaser.GameObjects.TileSprite {
  private brushes: Phaser.GameObjects.Graphics[];
  brushLayers: {
    [color: string]: BrushLayers;
  };
  renderTextures: { grass: Phaser.GameObjects.RenderTexture; sand: Phaser.GameObjects.RenderTexture };

  waterBg: Phaser.GameObjects.Graphics;
  brownT: Phaser.GameObjects.Graphics;
  brownR: Phaser.GameObjects.Graphics;
  brownB: Phaser.GameObjects.Graphics;
  brownL: Phaser.GameObjects.Graphics;
  grassBase: Phaser.GameObjects.TileSprite;
  sand: Phaser.GameObjects.TileSprite;
  flagCircle: Phaser.Geom.Circle;
  destroyables: any[] = [];
  positionables: any[] = [];

  constructor(scene: Phaser.Scene, private mapData: MapData, private footerHeight: number, private forEdit = false) {
    super(scene, 0, 0, mapData.width, mapData.height, 'grass-tile');

    const gameHeight = getGameHeight(scene);
    this.setY(Math.max(0, gameHeight - mapData.height - footerHeight));
    this.setOrigin(0, 0);
    this.setDepth(config.layers.grass);
    scene.add.existing(this);

    if (mapData.drawData) {
      // rebuild maps from draw data
      this.buildMasksFromDrawData();
    }
    if (!mapData.grassMask || !mapData.sandMask) {
      alert('invalid map');
    }

    // scene.add.image(0, this.y, mapData.grassMask).setOrigin(0, 0).setDepth(3500).setVisible(true);

    const masks: MapMasks = {};
    const grassMaskImage = scene.add.image(0, this.y, mapData.grassMask).setOrigin(0, 0).setVisible(false);
    const grassBaseMaskImage = scene.add
      .image(0, this.y + 20, mapData.grassMask)
      .setOrigin(0, 0)
      .setVisible(false);
    const sandMaskImage = scene.add.image(0, this.y, mapData.sandMask).setOrigin(0, 0).setVisible(false);
    masks.grass = new Phaser.Display.Masks.BitmapMask(scene, grassMaskImage);
    masks.grassBase = new Phaser.Display.Masks.BitmapMask(scene, grassBaseMaskImage);
    masks.sand = new Phaser.Display.Masks.BitmapMask(scene, sandMaskImage);

    // add map mask to grass
    this.setMask(masks.grass);
    this.destroyables.push(masks.grass.mainTexture);
    this.destroyables.push(masks.grass);

    // add mask for sand
    this.sand = scene.add
      .tileSprite(0, this.y, mapData.width, mapData.height, 'sand-tile')
      .setMask(masks.sand)
      .setOrigin(0, 0)
      .setDepth(config.layers.sand);
    this.destroyables.push(masks.sand.mainTexture);
    this.destroyables.push(masks.sand);
    this.destroyables.push(this.sand);

    this.createGrassOutline();

    this.grassBase = scene.add
      .tileSprite(0, this.y, mapData.width, mapData.height, 'grass-base')
      .setOrigin(0, 0)
      .setDepth(config.layers.grass - 2)
      .setMask(masks.grassBase);
    this.destroyables.push(masks.grassBase.mainTexture);
    this.destroyables.push(masks.grassBase);

    this.waterBg = scene.add
      .graphics()
      .fillStyle(config.colors.WATER, 1.0)
      .fillRect(0, this.y, mapData.width, mapData.height)
      .setScrollFactor(0, 0)
      .setDepth(config.layers.water);
    this.destroyables.push(this.waterBg);

    // loop through the height of the map, add a water animation every 400 pixels, alternating which side it goes on.
    let left = true;
    // water spaced out randomly b/t 400 and 700 px apart
    // first is b/t 150 and 300 from the top
    for (
      let y = 150 + Math.floor(Math.random() * 150);
      y < mapData.height;
      y += 400 + Math.floor(Math.random() * 301)
    ) {
      const o = new WaterSprite(scene, left ? 20 : 400, y);
      this.destroyables.push(o);
      this.positionables.push(o);
      left = !left;
    }

    // clouds spaced out randomly b/t 700 and 1200 px apart
    // first cloud is b/t 100 an 400 px from the top
    for (
      let y = 100 + Math.floor(Math.random() * 301);
      y < mapData.height;
      y += 700 + Math.floor(Math.random() * 401)
    ) {
      const o = new CloudSprite(scene, y, left ? 1 : -1, left ? 'cloud-1' : 'cloud-2');
      this.destroyables.push(o);
      this.positionables.push(o);
      left = !left;
    }

    if (!forEdit) {
      // add the flag and create a circle object that will be used as its hitbox
      this.destroyables.push(
        scene.add
          .image(this.mapData.flag.x, this.y + this.invertY(this.mapData.flag.y), 'flag')
          .setDepth(config.layers.items),
      );
      // we adjust the this.mapData.flag.x and FLAG_Y on the hitbox below a bit, so we position it closer to the hole, not the middle of the flag
      this.flagCircle = new Phaser.Geom.Circle(
        this.mapData.flag.x + FLAG_X_OFFSET,
        this.y + this.invertY(this.mapData.flag.y) + FLAG_Y_OFFSET,
        FLAG_HITBOX_RADIUS,
      );
    }
  }

  createGrassOutline(): void {
    this.brownT = this.createBrownGraphics(0, -5);
    this.brownR = this.createBrownGraphics(5, 0);
    this.brownB = this.createBrownGraphics(0, 5);
    this.brownL = this.createBrownGraphics(-5, 0);
  }

  createBrownGraphics(xOffset: number, yOffset: number): Phaser.GameObjects.Graphics {
    const brownMaskImage = this.scene.add
      .image(xOffset, this.y + yOffset, this.mapData.grassMask)
      .setOrigin(0, 0)
      .setVisible(false);
    const brownMask = new Phaser.Display.Masks.BitmapMask(this.scene, brownMaskImage);
    const ret = this.scene.add
      .graphics()
      .fillStyle(config.colors.LAND, 1.0)
      .fillRect(0, this.y, this.mapData.width, this.mapData.height)
      .setDepth(config.layers.grass - 1)
      .setMask(brownMask);
    this.destroyables.push(brownMaskImage);
    this.destroyables.push(brownMask);
    this.destroyables.push(ret);
    return ret;
  }

  async getLocationType(x: number, y: number): Promise<string> {
    if (this.flagCircle.contains(x, y)) {
      return 'hole';
    }

    let grassMapPxAlpha;
    let sandMapPxAlpha;

    if (!this.renderTextures) {
      grassMapPxAlpha = this.scene.textures.getPixel(x, y, this.mapData.grassMask).alpha === 0 ? 0 : 1;
      sandMapPxAlpha = this.scene.textures.getPixel(x, y, this.mapData.sandMask).alpha === 0 ? 0 : 1;
    } else {
      const localpoint = this.renderTextures.sand.getLocalPoint(x, y);
      if (localpoint.y < 0) {
        grassMapPxAlpha = 0;
        sandMapPxAlpha = 0;
      } else {
        grassMapPxAlpha = (
          await new Promise<any>((resolve) =>
            this.renderTextures.grass.snapshotPixel(localpoint.x, this.invertY(localpoint.y), (color) =>
              resolve(color),
            ),
          )
        ).a;
        sandMapPxAlpha = (
          await new Promise<any>((resolve) =>
            this.renderTextures.sand.snapshotPixel(localpoint.x, this.invertY(localpoint.y), (color) => resolve(color)),
          )
        ).a;
      }
    }

    if (sandMapPxAlpha === 1) {
      return 'sand';
    }

    if (grassMapPxAlpha === 1) {
      // this.scene.add.rectangle(x, y, 5, 5, 0x000000).setDepth(3900);
      return 'grass';
    }

    return 'water';
  }

  destroyAll(): void {
    this.destroyables.forEach((o) => o.destroy());
    this.destroy();
  }

  // TODO not used atm...
  addToHeight(px: number): void {
    this.positionables.forEach((o) => {
      if (o.y) {
        o.y += px;
      }
    });
  }

  getInterpolatedPosition(from: xy, to: xy, steps?: number, out?: xy[]): xy[] {
    if (steps === undefined) {
      steps = 10;
    }
    if (out === undefined) {
      out = [];
    }

    const prevX = from.x;
    const prevY = from.y;

    const curX = to.x;
    const curY = to.y;

    for (let i = 0; i < steps; i++) {
      const t = (1 / steps) * i;

      out[i] = {
        x: Phaser.Math.Interpolation.SmoothStep(t, prevX, curX),
        y: Phaser.Math.Interpolation.SmoothStep(t, prevY, curY),
      };
    }

    return out;
  }

  getBrushes(): Phaser.GameObjects.Graphics[] {
    if (!this.brushes) {
      this.brushes = BRUSH_CIRCLES.map((circleForBrushSize) =>
        this.scene.add
          .graphics()
          .fillStyle(config.colors.BLACK, 1)
          .fillCircleShape(circleForBrushSize)
          .setVisible(false),
      );
    }
    return this.brushes;
  }

  buildMasksFromDrawData(): void {
    this.renderTextures = {
      grass: this.scene.add.renderTexture(0, this.y, this.mapData.width, this.mapData.height).setOrigin(0, 0),
      sand: this.scene.add.renderTexture(0, this.y, this.mapData.width, this.mapData.height).setOrigin(0, 0),
    };
    this.mapData.drawData.forEach((drawData) => this.processDrawData(drawData));

    this.mapData.grassMask = 'grass-render-texture';
    this.mapData.sandMask = 'sand-render-texture';

    this.renderTextures.grass.saveTexture(this.mapData.grassMask);
    this.renderTextures.sand.saveTexture(this.mapData.sandMask);
  }

  getBrushLayersByColor(color: string): BrushLayers {
    if (!this.brushLayers) {
      this.brushLayers = {
        [config.brushColorKeys.GRASS]: {
          drawLayers: [this.renderTextures.grass],
          eraseLayers: [this.renderTextures.sand],
        },
        [config.brushColorKeys.SAND]: {
          drawLayers: [this.renderTextures.sand],
          eraseLayers: [this.renderTextures.grass],
        },
        [config.brushColorKeys.WATER]: {
          drawLayers: [],
          eraseLayers: [this.renderTextures.grass, this.renderTextures.sand],
        },
      };
    }
    return this.brushLayers[color];
  }

  getBrushRadiusBySize(size: number): number {
    return BRUSH_RADIUS_ARR[size];
  }

  processDrawData(drawData: DrawData): void {
    const brush = this.getBrushes()[drawData.size];
    const brushLayers = this.getBrushLayersByColor(drawData.color);

    drawData.strokes.forEach((stroke) => {
      const invertedStroke = {
        from: { x: stroke.from.x, y: this.invertY(stroke.from.y + this.y) },
        to: { x: stroke.to.x, y: this.invertY(stroke.to.y + this.y) },
      };
      const points = this.getInterpolatedPosition(invertedStroke.from, invertedStroke.to, 30);
      points.forEach((p) => {
        brushLayers.drawLayers.forEach((texture) => {
          texture.draw(
            brush,
            p.x - BRUSH_RADIUS_ARR[drawData.size] / 2,
            p.y - BRUSH_RADIUS_ARR[drawData.size] / 2,
            1,
            config.colors.BLACK,
          );
        });
        brushLayers.eraseLayers.forEach((texture) =>
          texture.erase(brush, p.x - BRUSH_RADIUS_ARR[drawData.size] / 2, p.y - BRUSH_RADIUS_ARR[drawData.size] / 2),
        );
      });
    });
  }

  invertY(y: number): number {
    return this.height - y;
  }
}
