import { getGameWidth, getGameHeight } from '../helpers';
import config from '../common/config';

const sceneConfig: Phaser.Types.Scenes.SettingsConfig = {
  active: false,
  visible: false,
  key: 'Boot',
};

/**
 * The initial scene that loads all necessary assets to the game and displays a loading bar.
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super(sceneConfig);
  }

  public preload(): void {
    const halfWidth = getGameWidth(this) * 0.5;
    const halfHeight = getGameHeight(this) * 0.5;

    const progressBarHeight = 100;
    const progressBarWidth = 400;

    const progressBarContainer = this.add.rectangle(
      halfWidth,
      halfHeight,
      progressBarWidth,
      progressBarHeight,
      config.colors.PROGRESS_BAR_BG,
    );
    const progressBar = this.add.rectangle(
      halfWidth + 20 - progressBarContainer.width * 0.5,
      halfHeight,
      10,
      progressBarHeight - 20,
      config.colors.PROGRESS_BAR_FILL,
    );

    const loadingText = this.add.text(halfWidth - 75, halfHeight - 100, 'Loading...').setFontSize(24);
    const percentText = this.add.text(halfWidth - 25, halfHeight, '0%').setFontSize(24);
    const assetText = this.add.text(halfWidth - 25, halfHeight + 100, '').setFontSize(24);

    this.load.on('progress', (value) => {
      progressBar.width = (progressBarWidth - 30) * value;

      const percent = Math.floor(value * 100);
      percentText.setText(`${percent}%`);
    });

    this.load.on('fileprogress', (file) => {
      assetText.setText(file.key);
    });

    this.load.on('complete', () => {
      loadingText.destroy();
      percentText.destroy();
      assetText.destroy();
      progressBar.destroy();
      progressBarContainer.destroy();

      // TODO change default scene!!
      this.scene.start('MainMenu');
    });

    this.loadAssets();
  }

  /**
   * All assets that need to be loaded by the game (sprites, images, animations, tiles, music, etc)
   * should be added to this method. Once loaded in, the loader will keep track of them, indepedent of which scene
   * is currently active, so they can be accessed anywhere.
   */
  private loadAssets() {
    // title screen
    this.load.image('menu-title', 'assets/menu/title.png');
    this.load.image('golf-btn', 'assets/menu/golf-btn.png');
    this.load.image('doodle-btn', 'assets/menu/doodle-btn.png');
    this.load.image('btn', 'assets/menu/btn.png');

    // Game Scene Assets
    this.load.image('tee', 'assets/tee-160.png');
    this.load.image('game-footer', 'assets/game-footer.png');
    this.load.image('grass-tile', 'assets/grass-tile.png');
    this.load.image('grass-base', 'assets/grass-base.png');
    this.load.image('sand-tile', 'assets/sand-tile.png');
    this.load.image('map-sand', 'assets/map/sand.png');
    this.load.image('map-grass', 'assets/map/grass.png');
    this.load.image('flag', 'assets/flag.png');
    this.load.image('water-splish', 'assets/water-splish.png');
    this.load.image('water-splish-cover', 'assets/water-splish-cover-small.png');
    this.load.image('cloud-1', 'assets/clouds/c1.png');
    this.load.image('cloud-2', 'assets/clouds/c2.png');
    this.load.image('cloud-cover', 'assets/clouds/cover.png');
    this.load.image('windmill-fan', 'assets/windmill/fan.png');
    this.load.image('windmill-tower', 'assets/windmill/tower.png');
    this.load.image('windmill-hitbox', 'assets/windmill/hitbox.png');
    this.load.image('hole', 'assets/hole.png');
    this.load.image('portal', 'assets/portal.png');
    this.load.image('start', 'assets/start.png');
    this.load.image('scroll-map', 'assets/scroll-map.png');
    this.load.image('scroll-map-no-stroke-penalty', 'assets/scroll-map-no-stroke-penalty.png');
    this.load.image('stroke-penalty', 'assets/stroke-penalty.png');
    this.load.image('bunker-penalty', 'assets/bunker-penalty.png');
    this.load.image('x', 'assets/x.png');
    this.load.image('goal', 'assets/goal.png');

    // draw screen
    this.load.image('draw-footer-bg', 'assets/draw/footer-bg.png');
    this.load.image('draw-portal', 'assets/draw/portal.png');
    this.load.image('draw-size-lg', 'assets/draw/size-lg.png');
    this.load.image('draw-size-sm', 'assets/draw/size-sm.png');
    this.load.image('draw-windmill', 'assets/draw/windmill.png');
    this.load.image('draw-grass', 'assets/draw/grass.png');
    this.load.image('draw-sand', 'assets/draw/sand.png');
    this.load.image('draw-size-md', 'assets/draw/size-md.png');
    this.load.image('draw-water', 'assets/draw/water.png');
    this.load.image('draw-hole', 'assets/draw/hole.png');
    this.load.image('draw-play', 'assets/draw/play.png');
    this.load.image('draw-play-bg', 'assets/draw/play-bg.png');
    this.load.image('draw-tool-bg', 'assets/draw/tool-bg.png');
    this.load.image('draw-trash', 'assets/draw/trash.png');
  }
}
