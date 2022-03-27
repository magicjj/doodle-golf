import * as Phaser from 'phaser';
import Scenes from './scenes';
import config from './common/config';

let ratio = window.innerHeight / window.innerWidth;
const minRatio = 1.5;
if (ratio < minRatio) {
  ratio = minRatio;
}

const gameConfig: Phaser.Types.Core.GameConfig = {
  title: 'Sample',
  type: Phaser.AUTO,
  width: 750,
  height: Math.ceil(750 * ratio),

  scale: {
    mode: Phaser.Scale.FIT,
  },

  scene: Scenes,

  physics: {
    default: 'arcade',
    arcade: {
      debug: true,
    },
  },

  parent: 'game',
  backgroundColor: config.colors.WATER,
};

export const game = new Phaser.Game(gameConfig);

window.addEventListener('resize', () => {
  game.scale.refresh();
});

window.addEventListener('load', () => {
  registerSW();
});

async function registerSW() {
  // TODO
  // if ('serviceWorker' in navigator) {
  //   try {
  //     await navigator.serviceWorker.register('./sw.js');
  //   } catch (e) {
  //     alert('ServiceWorker registration failed. Sorry about that.');
  //   }
  // } else {
  //   document.querySelector('.alert').removeAttribute('hidden');
  // }
}
