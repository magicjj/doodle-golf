import { getGameWidth, getGameHeight } from '../../helpers';
import { CloudCover } from './cloud-cover';
import { Map } from './map';
import { Footer } from './footer';
import { ScrollMapSprite } from './scroll-map-sprite';
import { StartCircle } from './start-circle';
import { Windmill } from './windmill';
import config from '../../common/config';
import { Portal } from './portal';
import { MapData, xy } from '../../common/types';

// default course details
const MAP_DATA = {
  title: 'Hole 1',
  subtitle: 'The Basics',
  width: 750,
  height: 3000,
  grassMask: 'map-grass',
  sandMask: 'map-sand',
  flag: {
    x: 200,
    y: 200,
  },
  windmills: [
    { x: 450, y: 2500 },
    { x: 280, y: 300 },
  ],
  portals: [{ a: { x: 200, y: 450 }, b: { x: 500, y: 1500 } }],
};

const PAN_DURATION = 3000;
const TOP_BOTTOM_BUMPER_HEIGHT = 20;
const SAND_PENALTY_COOLDOWN = 500;
const LAND_TYPES = ['grass', 'sand'];
const POSITION_CHECK_COOLDOWN = 100;

const sceneConfig: Phaser.Types.Scenes.SettingsConfig = {
  active: false,
  visible: false,
  key: 'Game',
};

export class GameScene extends Phaser.Scene {
  startCircle: StartCircle;
  map: Map;
  cloudCover: CloudCover;
  footer: Footer;
  scrollMapSprite: ScrollMapSprite;
  moving = false;
  mapHidden = false;
  reachedGoal = false;
  stroke = 1;
  startTime: number;
  finalTime: number;
  startSplashComplete = false;
  lastSandPenaltyTime: number;
  sandPenaltyCount = 0;
  windmills: Windmill[];
  portals: Portal[];
  lastPositionCheck = Date.now() - POSITION_CHECK_COOLDOWN;
  xImage: Phaser.GameObjects.Image;
  mapData: MapData;
  prevPointerCoords: xy;

  constructor() {
    super(sceneConfig);
  }

  init(data: any): void {
    if (Object.keys(data).length > 0) {
      this.mapData = data;
    }
  }

  public create(): void {
    if (!this.mapData) {
      this.mapData = MAP_DATA;
    }

    this.map = new Map(this, this.mapData);

    this.startCircle = new StartCircle(this);

    this.cloudCover = new CloudCover(this);

    this.footer = new Footer(this, this.mapData.title, this.mapData.subtitle);

    const startSprite = this.add
      .sprite(-700, getGameHeight(this) / 2, 'start')
      .setDepth(config.layers.startCircle)
      .setScrollFactor(0, 0);
    const startTimeline = this.tweens.createTimeline();
    startTimeline
      .add({
        targets: startSprite,
        x: getGameWidth(this) / 2,
        duration: 500,
      })
      .add({
        targets: startSprite,
        x: getGameWidth(this) + 700,
        duration: 500,
        delay: 1000,
      })
      .play();

    this.time.addEvent({
      delay: 1500,
      callback: () => {
        this.cameras.main.pan(
          Math.floor(getGameWidth(this) / 2),
          this.map.displayHeight - (getGameHeight(this) - this.footer.displayHeight * 2) / 2,
          PAN_DURATION,
        );
        // I guess camera pan callback gets called a lot - not just after animation is complete.
        // instead just time out another event to match the pan animation duration
        this.time.addEvent({
          delay: PAN_DURATION,
          callback: () => {
            this.startSplashComplete = true;
          },
        });
      },
    });

    this.addListeners();

    this.cameras.main.setBounds(0, 0, 0, this.map.displayHeight + this.footer.displayHeight);

    this.scrollMapSprite = new ScrollMapSprite(this);

    this.windmills = [];
    this.mapData.windmills.forEach((coord) => {
      this.windmills.push(new Windmill(this, coord.x, coord.y));
    });

    this.portals = [];
    this.mapData.portals.forEach((portalCoords) => {
      if (portalCoords.a === undefined || portalCoords.b === undefined) {
        return;
      }
      this.portals.push(new Portal(this, portalCoords.a, portalCoords.b));
      this.portals.push(new Portal(this, portalCoords.b, portalCoords.a));
    });
  }

  addListeners() {
    this.input.addPointer(2);

    let positionCheckInterval;

    this.input.on('pointerdown', (evt) => {
      if (!this.startSplashComplete) {
        return;
      }

      const coords = this.cameras.main.getWorldPoint(evt.x, evt.y);
      const isOnStartCircle = this.startCircle.contains(coords.x, coords.y);

      if (isOnStartCircle) {
        this.moving = true;
        this.mapHidden = false;
        if (!this.startTime) {
          this.startTime = Date.now();
        }

        if (this.xImage) {
          this.xImage.destroy();
          this.xImage = undefined;
        }

        // start this interval in addition to triggering position check on move.
        // otherwise position only gets checked while the finger is moving
        positionCheckInterval = setInterval(() => this.onMove(this.input.activePointer), POSITION_CHECK_COOLDOWN);
      }
    });

    this.input.on('pointermove', (evt) => {
      if (!this.startSplashComplete) {
        // disable input until start animation is over
        return;
      }
      const coords = this.cameras.main.getWorldPoint(evt.x, evt.y);
      this.processScrollEvent(evt);
      this.onMove(evt);
    });

    this.input.on('pointerup', (evt) => {
      if (!this.startSplashComplete) {
        return;
      }

      const coords = this.cameras.main.getWorldPoint(evt.x, evt.y);
      this.prevPointerCoords = undefined;

      if (this.moving) {
        clearInterval(positionCheckInterval);
        this.issueStrokePenalty();
        this.startCircle.place(coords.x, coords.y);
      }
    });

    this.input.on('wheel', (_pointer, _gameObjects, _deltaX, deltaY: number) => this.processWheelEvent(deltaY));
  }

  processWheelEvent(deltaY: number): void {
    this.cameras.main.scrollY += deltaY * 0.5;
  }

  processScrollEvent(evt: Phaser.Input.Pointer): void {
    // SCROLL EVENT
    // NOTE - must use the actual mouse coords, not the camera-translated RealWorldPoint!!!
    // if you use the translated point, after  the map moves the event Y is being changed bc its new relative map position!

    if (evt.id !== 1) {
      // we allow scrolling w 2 fingers. this makes sure we only fire the listener for one finger, not once for each
      // without doing this, both fingers were firing scroll listeners and fighting eachother
      return;
    }
    if (!this.prevPointerCoords) {
      this.prevPointerCoords = { x: evt.x, y: evt.y };
      return;
    }

    if (this.input.pointer2.isDown) {
      if (this.moving) {
        // TODO, do I have to stop their move if they scroll?
        this.issueStrokePenalty();
      }
      const deltaY = this.prevPointerCoords.y - evt.y;
      if (Math.abs(deltaY) > 5) {
        console.log(`${this.prevPointerCoords.y} - ${evt.y} = ${deltaY}`);
        this.cameras.main.scrollY += deltaY;
        this.prevPointerCoords = { x: evt.x, y: evt.y };
      }
    }
  }

  endSplash(): void {
    // TODO
    this.add
      .sprite(Math.floor(getGameWidth(this) / 2), Math.floor(getGameHeight(this) / 2), 'goal')
      .setScrollFactor(0, 0)
      .setDepth(config.layers.cloudCover + 1); // adding 1 so it goes over windmills
  }

  public update(): void {
    if (this.finalTime) {
      this.footer.setTime(this.finalTime);
    } else if (this.startTime) {
      this.footer.setTime(Date.now() - this.startTime);
    }

    this.footer.setStroke(this.stroke);

    if (this.mapHidden) {
      this.cloudCover.show();
    } else {
      this.cloudCover.hide();
    }

    Object.keys(this).forEach((key) => {
      if (typeof this[key] === 'object' && 'updateMe' in this[key]) {
        this[key].updateMe();
      }
    });

    this.windmills.forEach((windmill) => windmill.update());
  }

  onMove(evt: Phaser.Input.Pointer): void {
    const coords = this.cameras.main.getWorldPoint(evt.x, evt.y);
    if (this.startSplashComplete && this.moving) {
      const isOnStartCircle = this.startCircle.contains(coords.x, coords.y);
      const type = this.map.getLocationType(coords.x, coords.y);

      this.handleSandPenalty(type);

      if (!this.mapHidden && !isOnStartCircle && !this.isLandType(type)) {
        // edge case where they touch on the starting circle then drag their finger toward the water
        // just cancel this move and don't give them a stroke
        this.moving = false;
        return;
      }

      if (this.isWindmillCollision(coords)) {
        this.xImage = this.add.image(coords.x, coords.y, 'x').setDepth(config.layers.cloudCover + 5);
        this.issueStrokePenalty();
        return;
      }

      const portalCollision = this.isPortalCollision(coords);
      if (portalCollision !== null) {
        const panToY = portalCollision.dest.y;
        this.cameras.main.pan(getGameWidth(this) / 2, panToY, 1000);
        this.moving = false;
        this.mapHidden = false;
        this.startCircle.placeAnimated(portalCollision.dest.x, portalCollision.dest.y, 1000);
        this.scrollMapSprite.toast('portal');
        return;
      }

      if (!this.mapHidden) {
        if (!isOnStartCircle) {
          this.mapHidden = true;
        }
      }
      if (type === 'hole') {
        this.moving = false;
        this.mapHidden = false;
        this.reachedGoal = true;
        this.finalTime = Date.now() - this.startTime;
        this.startCircle.place(-500, -500); // just moving it out of view
        this.endSplash();

        // TODO print out their results
      } else if (!this.isLandType(type) && !isOnStartCircle) {
        this.issueStrokePenalty();
        this.startCircle.place(coords.x, coords.y);
      } else if (this.cameras.main.scrollY > 0 && evt.y < TOP_BOTTOM_BUMPER_HEIGHT) {
        // if the map has room to scroll up, and we have hit the top, reset start circle, scroll level up, give no stroke
        const panToY = this.cameras.main.scrollY - this.cameras.main.displayHeight * 0.5 + this.footer.displayHeight;
        this.cameras.main.pan(getGameWidth(this) / 2, panToY, 1000);
        this.moving = false;
        this.mapHidden = false;
        this.startCircle.place(coords.x, coords.y - this.footer.displayHeight * 0.5); // scooch it up a bit for them
        this.scrollMapSprite.toast();
      } else if (evt.y > this.cameras.main.displayHeight - TOP_BOTTOM_BUMPER_HEIGHT) {
        // if the map has room to scroll down, and we have hit the bottom, reset start circle, scroll level down, give no stroke
        const panToY = this.cameras.main.scrollY + this.cameras.main.displayHeight * 1.5 - this.footer.displayHeight;
        this.cameras.main.pan(getGameWidth(this) / 2, panToY, 1000);
        this.moving = false;
        this.mapHidden = false;
        this.startCircle.place(coords.x, coords.y + this.footer.displayHeight * 0.5); // scooch it down a bit for them
        this.scrollMapSprite.toast();
      }
    }
    this.lastPositionCheck = Date.now();
  }

  isLandType(type: string): boolean {
    return LAND_TYPES.indexOf(type) > -1;
  }

  handleSandPenalty(type: string): void {
    if (type === 'sand') {
      if (!this.lastSandPenaltyTime) {
        this.issueSandPenalty();
        return;
      }
      if (Date.now() - this.lastSandPenaltyTime >= SAND_PENALTY_COOLDOWN) {
        this.issueSandPenalty();
      }
    } else {
      this.lastSandPenaltyTime = undefined;
    }
  }

  issueSandPenalty(): void {
    this.lastSandPenaltyTime = Date.now();
    this.startTime -= 3000;
    this.sandPenaltyCount++;
    this.footer.bunkerPenaltyToast();
  }

  issueStrokePenalty(): void {
    this.moving = false;
    this.mapHidden = false;
    this.stroke++;
    this.footer.strokePenaltyToast();
  }

  isWindmillCollision(coords: Phaser.Math.Vector2): boolean {
    for (const windmill of this.windmills) {
      if (windmill.collidesWith(coords.x, coords.y)) {
        return true;
      }
    }
    return false;
  }

  isPortalCollision(coords: Phaser.Math.Vector2): Portal {
    for (const portal of this.portals) {
      if (this.startCircle.contains(portal.x, portal.y)) {
        // if the tee is covering up a portal, disable it
        continue;
      }
      if (portal.collidesWith(coords.x, coords.y)) {
        return portal;
      }
    }
    return null;
  }
}
