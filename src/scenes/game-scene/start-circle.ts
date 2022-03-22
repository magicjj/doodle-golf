import { Updateable } from '../../common/updateable';
import config from '../../common/config';
import { getGameWidth } from '../../helpers';
import { GameScene } from './game-scene';
import { DrawScene } from '../draw-scene/draw-scene';

const START_CIRCLE_RADIUS = 80;

export class StartCircle extends Phaser.GameObjects.Sprite implements Updateable {
  hilightCircle: Phaser.Geom.Circle;
  graphics: Phaser.GameObjects.Graphics;
  hilightRadius = START_CIRCLE_RADIUS;
  hilightRadiusStep = 1;
  hilightRadiusMax = START_CIRCLE_RADIUS * 1.5;
  hilight = true;

  constructor(public scene: GameScene | DrawScene) {
    super(scene, getGameWidth(scene) / 2, scene.map.height - START_CIRCLE_RADIUS, 'tee');
    scene.add.existing(this);
    this.setDepth(config.layers.startCircle);
  }

  place(x: number, y: number): void {
    this.setX(x).setY(y);
    this.hilightRadius = START_CIRCLE_RADIUS;
    this.hilight = true;
  }

  placeAnimated(x: number, y: number, duration: number): void {
    const quarterDur = duration / 4;
    this.hilight = false;
    this.scene.tweens.timeline({
      targets: this,
      tweens: [
        {
          alpha: 0,
          duration: quarterDur,
        },
        {
          alpha: 1,
          duration: quarterDur,
        },
        {
          alpha: 0,
          duration: quarterDur,
        },
        {
          alpha: 1,
          duration: quarterDur,
        },
        {
          x,
          y,
          duration,
          offset: '-=' + duration,
          onComplete: () => {
            this.hilight = true;
          },
        },
      ],
    });
  }

  contains(x: number, y: number): boolean {
    return this.getBounds().contains(x, y);
  }

  setHilight(val: boolean): void {
    this.hilight = val;
  }

  updateMe(): void {
    if (this.graphics) {
      this.graphics.destroy();
    }

    if (this.hilight) {
      this.graphics = this.scene.add.graphics().setDepth(config.layers.startCircle);

      const color = config.colors.TEE_HILIGHT_COLOR;
      const thickness = 10;
      const alpha = this.hilightRadiusMax / this.hilightRadius - 1;
      this.graphics.lineStyle(thickness, color, alpha);

      this.graphics.strokeCircleShape(new Phaser.Geom.Circle(this.x, this.y, this.hilightRadius));

      this.hilightRadius += this.hilightRadiusStep;
      if (this.hilightRadius > this.hilightRadiusMax) {
        this.hilightRadius = START_CIRCLE_RADIUS;
      }
    }
  }
}
