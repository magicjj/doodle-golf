import { getGameHeight } from '../../helpers';
import config from '../../common/config';
import { xy } from '../../common/types';

export class Footer extends Phaser.GameObjects.Image {
  title: Phaser.GameObjects.Text;
  time: Phaser.GameObjects.Text;
  stroke: Phaser.GameObjects.Text;
  subtitle: Phaser.GameObjects.Text;
  bunkerPenalty: Phaser.GameObjects.Sprite;
  strokePenalty: Phaser.GameObjects.Sprite;
  timePenaltyCoords: xy;
  strokePenaltyCoords: xy;

  constructor(scene: Phaser.Scene, title: string, subtitle: string) {
    super(scene, 0, getGameHeight(scene), 'game-footer');
    this.setOrigin(0, 1);
    this.setScrollFactor(0, 0);
    this.setDepth(config.layers.footer);
    scene.add.existing(this);

    const titleX = 45;
    const titleY = getGameHeight(scene) - 50;
    const subtitleY = titleY + 30;
    this.title = this.scene.add
      .text(titleX, titleY, title, {
        fill: '#000000',
        fontFamily: 'Calibri, Arial, sans',
      })
      .setOrigin(0, 1)
      .setScrollFactor(0, 0)
      .setFontSize(50)
      .setDepth(config.layers.footer);

    this.subtitle = this.scene.add
      .text(titleX, subtitleY, subtitle, {
        fill: '#000000',
        fontFamily: 'Calibri, Arial, sans',
      })
      .setOrigin(0, 1)
      .setScrollFactor(0, 0)
      .setFontSize(28)
      .setDepth(config.layers.footer);

    const timeX = 470;
    const timeY = getGameHeight(scene) - 50;
    const strokeX = timeX + 180;
    this.time = this.scene.add
      .text(timeX, timeY, '00.0', {
        fill: '#000000',
        fontFamily: 'Calibri, Arial, sans',
      })
      .setOrigin(0.5, 1)
      .setScrollFactor(0, 0)
      .setFontSize(45)
      .setDepth(config.layers.footer);

    this.stroke = this.scene.add
      .text(strokeX, timeY, '1', {
        fill: '#000000',
        fontFamily: 'Calibri, Arial, sans',
      })
      .setOrigin(0.5, 1)
      .setScrollFactor(0, 0)
      .setFontSize(45)
      .setDepth(config.layers.footer);

    const targets = [this.stroke, this.time, this.subtitle, this.title, this];
    targets.forEach((target) => target.setAlpha(0));
    scene.tweens.add({
      targets,
      alpha: 1,
      duration: 1000,
      delay: 2000,
    });

    this.timePenaltyCoords = { x: timeX, y: timeY - 45 };
    this.strokePenaltyCoords = { x: strokeX, y: timeY - 45 };
  }

  setStroke(stroke: number): void {
    this.stroke.setText(stroke.toString());
  }

  setTime(timeInMillis: number): void {
    let timeString;
    if (!timeInMillis) {
      timeString = '00.0';
    } else {
      const mins = Math.floor(timeInMillis / 60000);
      const secs = Math.floor((timeInMillis - mins * 60000) / 1000);
      const millis = (timeInMillis - mins * 60000 - secs * 1000).toString().substring(0, 2);
      timeString = '';
      if (mins) {
        timeString += mins + ':';
      }
      timeString += (secs.toString().length === 1 ? '0' : '') + secs + '.' + millis;
    }
    this.time.setText(timeString);
  }

  bunkerPenaltyToast(): void {
    this.penaltyToast('bunker-penalty', this.timePenaltyCoords);
  }

  strokePenaltyToast(): void {
    this.penaltyToast('stroke-penalty', this.strokePenaltyCoords);
  }

  penaltyToast(texture: string, coords: xy): void {
    const timeline = this.scene.tweens.createTimeline();
    const sprite = this.scene.add
      .sprite(coords.x, coords.y, texture)
      .setAlpha(0)
      .setOrigin(0.5, 1)
      .setScrollFactor(0, 0)
      .setDepth(config.layers.footer);
    const startingY = coords.y;
    timeline
      .add({
        targets: sprite,
        alpha: 1,
        duration: 100,
      })
      .add({
        targets: sprite,
        y: startingY - 100,
        alpha: 0,
        duration: 100,
        delay: 500,
        onComplete: () => {
          sprite.destroy();
        },
      });
    timeline.play();
  }
}
