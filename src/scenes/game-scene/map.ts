import { Updateable } from '../../common/updateable';
import { CloudSprite } from './cloud-sprite';
import { WaterSprite } from './water-sprite';
import config from '../../common/config';
import { MapData } from '../../common/types';

const FLAG_HITBOX_RADIUS = 30;
const FLAG_X_OFFSET = 10;
const FLAG_Y_OFFSET = 50;

export class Map extends Phaser.GameObjects.TileSprite implements Updateable {
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

  constructor(scene: Phaser.Scene, private mapData: MapData, private forEdit = false) {
    super(scene, 0, 0, mapData.width, mapData.height, 'grass-tile');

    // check for image!
    if (mapData.grassMaskImage) {
      if (!scene.textures.checkKey(mapData.grassMask)) {
        scene.textures.get(mapData.grassMask).destroy();
      }
      scene.textures.addImage(mapData.grassMask, mapData.grassMaskImage);
    }
    if (mapData.sandMaskImage) {
      if (!scene.textures.checkKey(mapData.sandMask)) {
        scene.textures.get(mapData.sandMask).destroy();
      }
      scene.textures.addImage(mapData.sandMask, mapData.sandMaskImage);
    }

    this.setOrigin(0, 0);
    this.setDepth(config.layers.grass);
    scene.add.existing(this);

    // add map mask to grass
    const grassMaskImage = scene.add.image(0, 0, mapData.grassMask).setOrigin(0, 0).setVisible(false);
    const grassMask = new Phaser.Display.Masks.BitmapMask(scene, grassMaskImage);
    this.setMask(grassMask);
    this.destroyables.push(grassMaskImage);
    this.destroyables.push(grassMask);

    // add mask for sand
    const sandMaskImage = scene.add.image(0, 0, mapData.sandMask).setOrigin(0, 0).setVisible(false);
    const sandMask = new Phaser.Display.Masks.BitmapMask(scene, sandMaskImage);
    this.sand = scene.add
      .tileSprite(0, 0, mapData.width, mapData.height, 'sand-tile')
      .setMask(sandMask)
      .setOrigin(0, 0)
      .setDepth(config.layers.sand);
    this.destroyables.push(sandMaskImage);
    this.destroyables.push(sandMask);
    this.destroyables.push(this.sand);

    this.createGrassOutline();

    const grassBaseMaskImage = scene.add.image(0, 20, this.mapData.grassMask).setOrigin(0, 0).setVisible(false);
    const grassBaseMask = new Phaser.Display.Masks.BitmapMask(scene, grassBaseMaskImage);
    this.grassBase = scene.add
      .tileSprite(0, 0, mapData.width, mapData.height, 'grass-base')
      .setOrigin(0, 0)
      .setDepth(config.layers.grass - 2)
      .setMask(grassBaseMask);
    this.destroyables.push(grassBaseMaskImage);
    this.destroyables.push(grassBaseMask);
    this.destroyables.push(this.grassBase);

    this.waterBg = scene.add
      .graphics()
      .fillStyle(config.colors.WATER, 1.0)
      .fillRect(0, 0, mapData.width, mapData.height)
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
        scene.add.image(this.mapData.flag.x, this.mapData.flag.y, 'flag').setDepth(config.layers.items),
      );
      // we adjust the this.mapData.flag.x and FLAG_Y on the hitbox below a bit, so we position it closer to the hole, not the middle of the flag
      this.flagCircle = new Phaser.Geom.Circle(
        this.mapData.flag.x + FLAG_X_OFFSET,
        this.mapData.flag.y + FLAG_Y_OFFSET,
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
      .image(xOffset, yOffset, this.mapData.grassMask)
      .setOrigin(0, 0)
      .setVisible(false);
    const brownMask = new Phaser.Display.Masks.BitmapMask(this.scene, brownMaskImage);
    const ret = this.scene.add
      .graphics()
      .fillStyle(config.colors.LAND, 1.0)
      .fillRect(0, 0, this.mapData.width, this.mapData.height)
      .setDepth(config.layers.grass - 1)
      .setMask(brownMask);
    this.destroyables.push(brownMaskImage);
    this.destroyables.push(brownMask);
    this.destroyables.push(ret);
    return ret;
  }

  updateMe(): void {}

  getLocationType(x: number, y: number): string {
    const sandMapPx = this.scene.textures.getPixel(x, y, this.mapData.sandMask);
    const grassMapPx = this.scene.textures.getPixel(x, y, this.mapData.grassMask);

    //console.log(this.flagCircle.contains(x, y), sandMapPx.alpha, grassMapPx.alpha);

    if (this.flagCircle.contains(x, y)) {
      return 'hole';
    }

    if (sandMapPx.alpha === 255) {
      return 'sand';
    }

    if (grassMapPx.alpha === 255) {
      return 'grass';
    }

    return 'water';
  }

  destroyAll(): void {
    this.destroyables.forEach((o) => o.destroy());
    this.destroy();
  }

  addToHeight(px: number) {
    this.positionables.forEach((o) => {
      if (o.y) {
        o.y += px;
      }
    });
  }
}
