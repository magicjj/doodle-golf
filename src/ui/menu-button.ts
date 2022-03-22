import * as Phaser from 'phaser';

export class MenuButton extends Phaser.GameObjects.Sprite {
  constructor(scene: Phaser.Scene, x: number, y: number, texture: string, onClick?: () => void, bgTexture = 'btn') {
    super(scene, x, y, texture);
    this.setDepth(2);
    scene.add.existing(this);

    scene.add.image(x, y, bgTexture).setDepth(1);

    this.setInteractive({ useHandCursor: true })
      .on('pointerover', this.enterMenuButtonHoverState)
      .on('pointerout', this.enterMenuButtonRestState)
      .on('pointerdown', this.enterMenuButtonActiveState)
      .on('pointerup', this.enterMenuButtonHoverState);

    if (onClick) {
      this.on('pointerup', onClick);
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
