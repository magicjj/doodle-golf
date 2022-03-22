import config from '../../common/config';
import { xy } from '../../common/types';

const HB_RADIUS = 20;

export class Portal extends Phaser.GameObjects.Image {
  src: xy;
  dest: xy;
  hitbox: Phaser.Geom.Circle;
  x: number;
  y: number;

  constructor(scene: Phaser.Scene, src: xy, dest: xy) {
    super(scene, src.x, src.y, 'hole');
    this.setDepth(config.layers.items);
    scene.add.existing(this);
    this.src = src;
    this.dest = dest;
    this.hitbox = new Phaser.Geom.Circle(src.x, src.y, HB_RADIUS);
    this.x = src.x;
    this.y = src.y;
  }

  collidesWith(x: number, y: number): boolean {
    if (this.hitbox.contains(x, y)) {
      return true;
    }
    return false;
  }
}
