import config from '../../common/config';

export class WaterSprite extends Phaser.GameObjects.Sprite {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x - 100, y, 'water-splish');
    this.setDepth(config.layers.water + 1).setOrigin(0, 0);
    scene.add.existing(this);

    scene.add
      .image(x, y, 'water-splish-cover')
      .setOrigin(0, 0)
      .setDepth(config.layers.water + 1);

    const maskShape = scene.add.graphics().setVisible(false);
    this.mask = new Phaser.Display.Masks.GeometryMask(scene, maskShape);

    scene.tweens.add({
      targets: this,
      x: 0,
      duration: 3000,
      repeat: -1,
    });

    const yTimeline = scene.tweens.createTimeline();
    yTimeline.loop = -1;
    yTimeline
      .add({
        targets: this,
        y: y + 20,
        duration: 1000,
        delay: 1000,
      })
      .add({
        targets: this,
        y,
        duration: 1000,
        delay: 3000,
      })
      .play();

    const alphaTimeline = scene.tweens.createTimeline();
    alphaTimeline.loop = -1;
    alphaTimeline
      .add({
        targets: this,
        alpha: 0,
        duration: 1000,
        delay: 1000,
      })
      .add({
        targets: this,
        alpha: 0.8,
        duration: 1000,
        delay: 3000,
      })
      .play();
  }
}
