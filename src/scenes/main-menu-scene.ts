import { getGameHeight, getGameWidth } from '../helpers';
import { MenuButton } from '../ui/menu-button';

const sceneConfig: Phaser.Types.Scenes.SettingsConfig = {
  active: false,
  visible: false,
  key: 'MainMenu',
};

/**
 * The initial scene that starts, shows the splash screens, and loads the necessary assets.
 */
export class MainMenuScene extends Phaser.Scene {
  constructor() {
    super(sceneConfig);
  }

  public create(): void {
    this.add.image(0, 0, 'menu-title').setOrigin(0, 0);

    const btnX = getGameWidth(this) / 2;
    const btnY = getGameHeight(this) - 290;

    const golfBtn = new MenuButton(this, btnX, btnY, 'golf-btn', () => {
      this.scene.start('Game');
    });

    const doodleBtn = new MenuButton(this, btnX, btnY + golfBtn.displayHeight + 20, 'doodle-btn', () => {
      this.scene.start('Draw');
    });
  }
}
