import config from '../../common/config';

const FAN_STEP = 2;
const HITBOX_STEP = 5;
const FAN_RADIUS = 325;
const SHOW_HBs = false;
const HITBOX_WIDTH = 20;

export class Windmill {
  hitboxes: { [key: number]: Phaser.Geom.Rectangle[] }; // TODO type this
  hitboxGraphics: Phaser.GameObjects.Graphics;
  fan: Phaser.GameObjects.Sprite;
  tower: Phaser.GameObjects.Image;
  activeAngleIndex = 0;

  constructor(private scene: Phaser.Scene, x: number, y: number) {
    this.fan = scene.add.sprite(x, y, 'windmill-fan').setDepth(config.layers.cloudCover + 1);
    this.tower = scene.add.image(x, y + 10, 'windmill-tower').setDepth(config.layers.items);

    this.hitboxes = {};

    // boy oh boy... tried dropping rectangles here and rotating them w the fan
    // but no collision detection works w rotated rectangles.
    // Matter Physics may do some angled collision detection, but would be way overkill for this game
    // instead, I create hitboxes for every 5 degree step of the animation.
    // in collidesWith() I check the fan rotation to see which set of HBs to validate against
    this.fan.angle = 0;
    for (let angle = 0; angle < 90; angle += HITBOX_STEP) {
      this.hitboxes[angle] = [];

      const fromHoriz = {
        x: (FAN_RADIUS / 2) * Math.cos(this.toRad(angle)) + this.fan.x,
        y: (FAN_RADIUS / 2) * Math.sin(this.toRad(angle)) + this.fan.y,
      };
      const toHoriz = {
        x: (FAN_RADIUS / 2) * Math.cos(this.toRad(angle + 180)) + this.fan.x,
        y: (FAN_RADIUS / 2) * Math.sin(this.toRad(angle + 180)) + this.fan.y,
      };
      const fromVert = {
        x: (FAN_RADIUS / 2) * Math.cos(this.toRad(angle + 90)) + this.fan.x,
        y: (FAN_RADIUS / 2) * Math.sin(this.toRad(angle + 90)) + this.fan.y,
      };
      const toVert = {
        x: (FAN_RADIUS / 2) * Math.cos(this.toRad(angle + 180 + 90)) + this.fan.x,
        y: (FAN_RADIUS / 2) * Math.sin(this.toRad(angle + 180 + 90)) + this.fan.y,
      };

      const addHitboxes = (from, to) => {
        const numBoxes = 20;
        const cX = (from.x - to.x) / numBoxes;
        const cY = (from.y - to.y) / numBoxes;
        let x = from.x;
        let y = from.y;
        for (let i = 0; i <= numBoxes; i++) {
          x = to.x + cX * i - HITBOX_WIDTH / 2;
          y = to.y + cY * i - HITBOX_WIDTH / 2;
          const hb = new Phaser.Geom.Rectangle(x, y, HITBOX_WIDTH, HITBOX_WIDTH);
          this.hitboxes[angle].push(hb);
        }
      };

      addHitboxes(fromHoriz, toHoriz);
      addHitboxes(fromVert, toVert);
    }
  }

  toRad(deg: number): number {
    return (deg * Math.PI) / 180;
  }

  update(time: number, delta: number): void {
    const FAN_MILLIS_PER_ROTATION = 400;

    this.fan.angle = Math.floor((90 / FAN_MILLIS_PER_ROTATION) * (time % FAN_MILLIS_PER_ROTATION));
    let angle90 = (this.fan.angle + 5) % 90;
    if (angle90 < 0) {
      angle90 += 90;
    }
    this.activeAngleIndex = Math.floor(angle90 / HITBOX_STEP) * HITBOX_STEP;
    if (SHOW_HBs) {
      console.log('fan angle: ' + this.fan.angle);
      console.log('fan angle mod 90: ' + angle90);
      console.log('calc index: ' + this.activeAngleIndex);

      if (this.hitboxGraphics) {
        this.hitboxGraphics.destroy();
      }
      this.hitboxGraphics = this.scene.add.graphics().setDepth(config.layers.cloudCover).fillStyle(0x000000, 1);

      for (let i = 0; i < this.hitboxes[this.activeAngleIndex].length; i++) {
        this.hitboxGraphics.fillRectShape(this.hitboxes[this.activeAngleIndex][i]);
      }
    }
  }

  collidesWith(x: number, y: number): boolean {
    for (const hb of this.hitboxes[this.activeAngleIndex]) {
      if (hb.contains(x, y)) {
        return true;
      }
    }
    if (this.tower.getBounds().contains(x, y)) {
      return true;
    }
    return false;
  }

  getTower(): Phaser.GameObjects.Image {
    return this.tower;
  }

  destroy(): void {
    this.fan.destroy();
    this.tower.destroy();
  }
}
