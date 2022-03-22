import { getGameHeight, getGameWidth } from "../../helpers";
import config from '../../common/config';

const LEFT_X = -750;
const RIGHT_X = 1500;
const DEFAULT_TEXTURE = 'scroll-map';

export class ScrollMapSprite extends Phaser.GameObjects.Sprite {
  noStrokePenaltySprite: Phaser.GameObjects.Sprite;
  timeline: Phaser.Tweens.Timeline;
  timeline2: Phaser.Tweens.Timeline;

  constructor(public scene: Phaser.Scene) {
    super(scene, LEFT_X, getGameHeight(scene) / 2 - 60, DEFAULT_TEXTURE);
    this.setDepth(config.layers.cloudCover).setScrollFactor(0, 0);
    scene.add.existing(this);
    this.noStrokePenaltySprite = scene.add
      .sprite(RIGHT_X, getGameHeight(scene) / 2 + 30, 'scroll-map-no-stroke-penalty')
      .setDepth(config.layers.cloudCover + 2)
      .setScrollFactor(0, 0);
  }

  toast(texture?: string): void {
    this.setTexture(texture ? texture : DEFAULT_TEXTURE);
    this.timeline = this.scene.tweens.createTimeline();
    this.timeline
      .add({
        targets: this,
        x: getGameWidth(this.scene) / 2,
        duration: 500,
      })
      .add({
        targets: this,
        x: RIGHT_X,
        duration: 500,
        delay: 1000,
        onComplete: () => {
          this.setX(LEFT_X);
        },
      });
    this.timeline2 = this.scene.tweens.createTimeline();
    this.timeline2
      .add({
        targets: this.noStrokePenaltySprite,
        x: getGameWidth(this.scene) / 2,
        duration: 500,
      })
      .add({
        targets: this.noStrokePenaltySprite,
        x: LEFT_X,
        duration: 500,
        delay: 1000,
        onComplete: () => {
          this.setX(RIGHT_X);
        },
      });

    this.timeline.play();
    this.timeline2.play();
  }
}
