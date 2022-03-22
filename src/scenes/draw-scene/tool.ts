import * as Phaser from 'phaser';
import config from '../../common/config';
import { getGameHeight } from '../../helpers';

const TOOL_WIDTH = 84;
const TOOL_HEIGHT = 83;

export class Tool extends Phaser.GameObjects.Sprite {
  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    texture: string,
    onClick?: (ptr?: Phaser.Input.Pointer) => void,
    clickEvent = 'pointerup',
    bgTexture = 'draw-tool-bg',
  ) {
    super(scene, x, y, texture);
    this.setDepth(config.layers.footer).setOrigin(0, 1).setScrollFactor(0, 0);
    scene.add.existing(this);

    scene.add
      .image(x, y, bgTexture)
      .setDepth(config.layers.footer - 1)
      .setOrigin(0, 1)
      .setScrollFactor(0, 0);

    this.setInteractive({ useHandCursor: true })
      .on('pointerover', this.enterMenuButtonHoverState)
      .on('pointerout', this.enterMenuButtonRestState)
      .on('pointerdown', this.enterMenuButtonActiveState)
      .on('pointerup', this.enterMenuButtonHoverState);

    if (onClick) {
      this.on(clickEvent, onClick);
    }

    this.enterMenuButtonRestState();
  }

  private enterMenuButtonHoverState() {
    this.setAlpha(0.6);
  }

  private enterMenuButtonRestState() {
    this.setAlpha(1);
  }

  private enterMenuButtonActiveState() {
    this.setAlpha(0.6);
  }
}
