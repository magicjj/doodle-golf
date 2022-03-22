import { getGameHeight } from '../../helpers';
import config from '../../common/config';

const PX_BT_CLOUDS = 390;
const CLOUDS_WIDTH = 1255;
const MIDDLE_X = -180;
const LEFT_X = MIDDLE_X - CLOUDS_WIDTH;
const RIGHT_X = MIDDLE_X + CLOUDS_WIDTH;
const ANIM_DURATION = 100;

export class CloudCover {
  leftClouds: Phaser.GameObjects.Sprite[];
  rightClouds: Phaser.GameObjects.Sprite[];
  showing: boolean;

  constructor(private scene: Phaser.Scene) {
    this.leftClouds = [];
    this.rightClouds = [];
    this.showing = false;

    let y = -100;
    let left = true;
    while (y < getGameHeight(scene)) {
      const newCloud = scene.add
        .sprite(left ? LEFT_X : RIGHT_X, y, 'cloud-cover')
        .setDepth(config.layers.cloudCover)
        .setOrigin(0, 0)
        .setScrollFactor(0, 0);
      y += PX_BT_CLOUDS;
      if (left) {
        this.leftClouds.push(newCloud);
      } else {
        this.rightClouds.push(newCloud);
      }
      left = !left;
    }
  }

  show() {
    if (this.showing) {
      return;
    }
    console.log('showing clouds');
    this.showing = true;
    this.scene.tweens.add({
      targets: [...this.leftClouds, ...this.rightClouds],
      x: MIDDLE_X,
      duration: ANIM_DURATION,
    });
  }

  hide() {
    if (!this.showing) {
      return;
    }
    console.log('hiding clouds');
    this.showing = false;
    this.scene.tweens.add({
      targets: this.leftClouds,
      x: LEFT_X,
      duration: ANIM_DURATION,
    });
    this.scene.tweens.add({
      targets: this.rightClouds,
      x: RIGHT_X,
      duration: ANIM_DURATION,
    });
  }
}
