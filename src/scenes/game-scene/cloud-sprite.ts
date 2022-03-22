import { getGameWidth } from '../../helpers';
import config from '../../common/config';

export class CloudSprite extends Phaser.GameObjects.Sprite {
  constructor(scene: Phaser.Scene, y: number, dir: number, texture: string) {
    super(scene, dir === 1 ? 0 : getGameWidth(scene), y, texture);
    this.setDepth(config.layers.sky).setOrigin(dir === 1 ? 1 : 0, dir === 1 ? 0 : 1);
    scene.add.existing(this);

    scene.tweens.add({
      targets: this,
      x: dir === 1 ? getGameWidth(scene) + this.displayWidth : -this.displayWidth,
      duration: 3000 + Math.floor(Math.random() * 4001), // duration from 3-7 secs
      repeat: -1,
      delay: Math.floor(Math.random() * 4001), // random int from 0 to 4000, delay start up to 4 seconds
      repeatDelay: 4000 + Math.floor(Math.random() * 4001), // repeat animation every 4 to 8 seconds
    });
  }
}
