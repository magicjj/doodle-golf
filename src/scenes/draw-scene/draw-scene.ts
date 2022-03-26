import { getGameHeight, getGameWidth } from '../../helpers';
import { MenuButton } from '../../ui/menu-button';
import { Map } from '../game-scene/map';
import config from '../../common/config';
import { DrawData, MapData, xy } from '../../common/types';
import { Tool } from './tool';
import { StartCircle } from '../game-scene/start-circle';
import { Windmill } from '../game-scene/windmill';
import { Portal } from '../game-scene/portal';

const TOP_OF_MAP_BUFFER = 50;

const sceneConfig: Phaser.Types.Scenes.SettingsConfig = {
  active: false,
  visible: false,
  key: 'Draw',
};

const BLACK_COLOR = 0x000000;
const BRUSH_RADIUS_SM = 30;
const BRUSH_RADIUS_MD = 60;
const BRUSH_RADIUS_LG = 90;
const BRUSH_RADIUS_ARR = [BRUSH_RADIUS_SM, BRUSH_RADIUS_MD, BRUSH_RADIUS_LG];
const PLAY_BUTTON_FROM_RIGHT = 183 + 20; //play btn is 183 px high, 20px padding from right
const PORTAL_COLOR_INDICATORS = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xcc00ff, 0xff6600];

/**
 * The initial scene that starts, shows the splash screens, and loads the necessary assets.
 */
export class DrawScene extends Phaser.Scene {
  mapData: MapData;
  drawData: DrawData[];
  rtGrass: Phaser.GameObjects.RenderTexture;
  rtSand: Phaser.GameObjects.RenderTexture;
  brush: Phaser.GameObjects.Graphics;
  brushCircle = [
    new Phaser.Geom.Circle(BRUSH_RADIUS_SM / 2, BRUSH_RADIUS_SM / 2, BRUSH_RADIUS_SM),
    new Phaser.Geom.Circle(BRUSH_RADIUS_MD / 2, BRUSH_RADIUS_MD / 2, BRUSH_RADIUS_MD),
    new Phaser.Geom.Circle(BRUSH_RADIUS_LG / 2, BRUSH_RADIUS_LG / 2, BRUSH_RADIUS_LG),
  ];
  map: Map;
  startCircle: StartCircle;
  size = 1; // 0 small, 1 med, 2 lg
  sizeTool: Tool;
  colorTool: Tool;
  color = 0;
  colors = ['draw-grass', 'draw-sand', 'draw-water'];
  footerBg: Phaser.GameObjects.Image;
  draggingObject: Phaser.GameObjects.Image;
  windmills: Windmill[] = [];
  portals: Portal[] = [];
  draggableMapObjects: {
    pointerdown: () => void;
    pointerup?: (isInTrash: boolean) => void;
    object: Phaser.GameObjects.Image;
  }[] = [];
  trash: Phaser.GameObjects.Sprite;
  flag: Phaser.GameObjects.Image;
  draggableObjectPointerUp: (isInTrash: boolean) => void;
  portalId = 0;
  portalColors: Phaser.GameObjects.Graphics;
  portalColorIndex = 0;
  prevPointerCoords: xy;

  constructor() {
    super(sceneConfig);
  }

  public create(): void {
    this.input.addPointer(2);

    this.mapData = {
      title: 'Play Test',
      subtitle: 'Make the goal to publish.',
      width: 750,
      height: 10000,
      grassMask: 'editor-grass-mask',
      sandMask: 'editor-sand-mask',
      flag: undefined,
      windmills: [],
      portals: [],
    };

    this.drawData = [];
    this.rtGrass = this.add.renderTexture(0, 0, this.mapData.width, this.mapData.height).setVisible(false);
    this.rtSand = this.add.renderTexture(0, 0, this.mapData.width, this.mapData.height).setVisible(false);

    this.brush = this.add
      .graphics()
      .fillStyle(BLACK_COLOR, 1)
      .fillCircleShape(this.brushCircle[this.size])
      .setVisible(false);

    // The pointer delay is to help with the scrolling. Before this, every time you scrolled
    // a circle would get drawn under one of your fingers. To remedy, we give a short delay
    // before activating the draw event, so we have some time to listen for the second finger.
    const POINTER_DOWN_DELAY = 50;
    let pointerDownTime;

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      const coords = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
      this.draggableMapObjects.forEach((draggableObject) => {
        const { object, pointerdown, pointerup } = draggableObject;
        this.draggableObjectPointerUp = pointerup;
        if (object.getBounds().contains(coords.x, coords.y)) {
          pointerdown();
          this.trash.setVisible(true);
        }
      });
      //for some reason since I made the map bigger these are both false now???
      //console.log(this.input.pointer1.isDown, this.input.pointer2.isDown);
      //if (this.input.pointer1.isDown && !this.input.pointer2.isDown) {
      pointerDownTime = Date.now();
      //}
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.input.pointer1.isDown && this.input.pointer2.isDown) {
        this.processScrollEvent(pointer);
        return;
      }

      if (pointer.isDown && Date.now() - pointerDownTime > POINTER_DOWN_DELAY) {
        const coords = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
        if (this.draggingObject) {
          this.draggingObject.x = coords.x;
          this.draggingObject.y = coords.y;
        } else if (this.isInDrawBounds(pointer)) {
          this.draw(pointer);
        }
      }
    });

    this.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (this.draggingObject) {
        const isInTrash = this.trash.getBounds().contains(pointer.x, pointer.y);
        if (!isInTrash && this.isInDrawBounds(pointer)) {
          this.processDropEvent(this.draggingObject.texture.key, pointer);
        }
        if (this.draggableObjectPointerUp) {
          this.draggableObjectPointerUp(isInTrash);
        }
        this.draggingObject.destroy();
        this.draggingObject = undefined;
        this.trash.setVisible(false);
      }
      this.draggingPortal = undefined;
      this.prevPointerCoords = undefined;
      pointerDownTime = undefined;
    });

    this.input.on('wheel', (_pointer, _gameObjects, _deltaX, deltaY: number) => this.processWheelEvent(deltaY));

    this.footerBg = this.add
      .image(0, getGameHeight(this), 'draw-footer-bg')
      .setOrigin(0, 1)
      .setScrollFactor(0, 0)
      .setDepth(config.layers.footer - 100);

    this.rtGrass.saveTexture(this.mapData.grassMask);
    this.rtSand.saveTexture(this.mapData.sandMask);
    this.map = new Map(this, this.mapData, this.footerBg.height, true);
    this.startCircle = new StartCircle(this);
    this.startCircle.setActive(false);

    this.cameras.main.setBounds(0, 0, 0, this.mapData.height + this.footerBg.height);
    this.cameras.main.setScroll(0, this.mapData.height - getGameHeight(this) + this.footerBg.height);

    let toolX = 20;
    const TOOL_PADDING = 20;
    const TOOL_Y = getGameHeight(this) - 18;
    this.sizeTool = new Tool(this, toolX, TOOL_Y, 'draw-size-md', () => this.sizeToolTouchEvent());
    toolX += TOOL_PADDING + this.sizeTool.displayWidth;
    this.colorTool = new Tool(this, toolX, TOOL_Y, 'draw-grass', () => this.colorToolTouchEvent());
    toolX += TOOL_PADDING + this.sizeTool.displayWidth;
    new Tool(this, toolX, TOOL_Y, 'draw-windmill', (ptr) => this.windmillToolTouchEvent(ptr), 'pointerdown');
    toolX += TOOL_PADDING + this.sizeTool.displayWidth;
    new Tool(this, toolX, TOOL_Y, 'draw-portal', (ptr) => this.portalToolTouchEvent(ptr), 'pointerdown');
    toolX += TOOL_PADDING + this.sizeTool.displayWidth;
    new Tool(this, toolX, TOOL_Y, 'draw-hole', (ptr) => this.flagToolTouchEvent(ptr), 'pointerdown');

    new Tool(
      this,
      getGameWidth(this) - PLAY_BUTTON_FROM_RIGHT,
      TOOL_Y,
      'draw-play',
      () => this.playTest(),
      'pointerup',
      'draw-play-bg',
    );

    this.trash = this.add
      .sprite(getGameWidth(this) / 2, getGameHeight(this) - this.footerBg.height, 'draw-trash')
      .setOrigin(0.5, 1)
      .setDepth(config.layers.startCircle + 1)
      .setScrollFactor(0, 0)
      .setVisible(false);
  }

  highestDrawnY = 0;
  draw(pointer: Phaser.Input.Pointer): void {
    const points = pointer.getInterpolatedPosition(30);
    const prevPositionCamera = this.cameras.main.getWorldPoint(pointer.prevPosition.x, pointer.prevPosition.y);
    const positionCamera = this.cameras.main.getWorldPoint(pointer.x, pointer.y);

    const drawDataPoint: DrawData = {
      color: this.colors[this.color],
      size: this.size,
      strokes: [
        {
          from: { x: Math.floor(prevPositionCamera.x), y: this.invertY(Math.floor(prevPositionCamera.y)) },
          to: { x: Math.floor(positionCamera.x), y: this.invertY(Math.floor(positionCamera.y)) },
        },
      ],
    };
    const prevDrawData = this.drawData.length > 0 ? this.drawData[this.drawData.length - 1] : null;
    if (prevDrawData?.color === this.colors[this.color] && prevDrawData?.size === this.size) {
      prevDrawData.strokes.push(drawDataPoint.strokes[0]);
    } else {
      this.drawData.push(drawDataPoint);
    }

    const drawLayers = [];
    const eraseLayers = [];
    switch (this.colors[this.color]) {
      case 'draw-grass':
        drawLayers.push(this.rtGrass);
        eraseLayers.push(this.rtSand);
        break;
      case 'draw-sand':
        drawLayers.push(this.rtGrass);
        drawLayers.push(this.rtSand);
        break;
      case 'draw-water':
        eraseLayers.push(this.rtGrass);
        eraseLayers.push(this.rtSand);
        break;
    }

    if (drawLayers.length > 0) {
      this.highestDrawnY = Math.max(
        this.highestDrawnY,
        this.invertY(Math.floor(positionCamera.y)) + BRUSH_RADIUS_ARR[this.size],
      );
    }

    points
      .map((p) => this.cameras.main.getWorldPoint(p.x, p.y))
      .forEach((p) => {
        drawLayers.forEach((texture) =>
          texture.draw(
            this.brush,
            p.x - BRUSH_RADIUS_ARR[this.size] / 2,
            p.y - BRUSH_RADIUS_ARR[this.size] / 2,
            1,
            BLACK_COLOR,
          ),
        );
        eraseLayers.forEach((texture) =>
          texture.erase(
            this.brush,
            p.x - BRUSH_RADIUS_ARR[this.size] / 2,
            p.y - BRUSH_RADIUS_ARR[this.size] / 2,
            1,
            BLACK_COLOR,
          ),
        );
      });
  }

  isInDrawBounds(coords: xy): boolean {
    return coords.y < getGameHeight(this) - this.footerBg.height;
  }

  sizeToolTouchEvent(): void {
    this.size = (this.size + 1) % 3;
    let texture;
    switch (this.size) {
      case 0:
        texture = 'draw-size-sm';
        break;
      case 1:
        texture = 'draw-size-md';
        break;
      case 2:
        texture = 'draw-size-lg';
        break;
    }
    this.sizeTool.setTexture(texture);
    this.brush.destroy();
    this.brush = this.add
      .graphics()
      .fillStyle(BLACK_COLOR, 1)
      .fillCircleShape(this.brushCircle[this.size])
      .setVisible(false);
  }

  colorToolTouchEvent(): void {
    this.color = (this.color + 1) % 3;
    let texture;
    switch (this.color) {
      case 0:
        texture = 'draw-grass';
        break;
      case 1:
        texture = 'draw-sand';
        break;
      case 2:
        texture = 'draw-water';
        break;
    }
    this.colorTool.setTexture(texture);
  }

  setDraggingObject(pointer: xy, texture: string, isRealWorldPoint = false): void {
    const coords = isRealWorldPoint ? pointer : this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    this.draggingObject = this.add.image(coords.x, coords.y, texture).setDepth(config.layers.cloudCover);
  }

  removeDraggableObjectsByTexture(texture: string): void {
    this.draggableMapObjects = this.draggableMapObjects.filter((x) => x.object.texture.key !== texture);
  }

  windmillToolTouchEvent(pointer: xy): void {
    if (this.draggingObject) {
      this.draggingObject.destroy();
    }
    this.setDraggingObject(pointer, 'draw-windmill');
  }

  portalToolTouchEvent(pointer: xy, isRealWorldPoint = false): void {
    if (this.draggingObject) {
      this.draggingObject.destroy();
    }
    this.setDraggingObject(pointer, 'hole', isRealWorldPoint);
  }

  flagToolTouchEvent(pointer: xy): void {
    if (this.draggingObject) {
      this.draggingObject.destroy();
    }
    this.setDraggingObject(pointer, 'flag');
  }

  processDropEvent(texture: string, pointer: Phaser.Input.Pointer): void {
    const coords = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    switch (texture) {
      case 'draw-windmill':
        this.mapData.windmills.push({
          x: coords.x,
          y: this.invertY(coords.y),
        });
        this.setWindmills();
        break;
      case 'flag':
        this.setFlagCoords(pointer, coords);
        break;
      case 'hole':
        this.addPortal(pointer, coords);
        break;
    }
  }

  invertY(y: number) {
    return this.mapData.height - y;
  }

  setWindmills(): void {
    this.windmills.forEach((windmill) => {
      windmill.destroy();
    });
    this.windmills = [];
    this.removeDraggableObjectsByTexture('windmill-tower');
    let i = 0;
    this.mapData.windmills.forEach((coord) => {
      const o = new Windmill(this, coord.x, this.invertY(coord.y));
      this.windmills.push(o);
      this.draggableMapObjects.push({
        object: this.windmills[i].getTower(),
        pointerdown: () => {
          o.destroy();
          this.mapData.windmills = this.mapData.windmills.filter((x) => x !== coord);
          this.setWindmills();
          this.windmillToolTouchEvent(coord);
        },
      });
      i++;
    });
  }

  setFlagCoords(pointer: Phaser.Input.Pointer, realWorldPoint: xy): void {
    this.mapData.flag = {
      ...realWorldPoint,
      y: this.invertY(realWorldPoint.y),
    };
    if (this.flag) {
      this.flag.destroy();
    }
    this.flag = this.add.image(realWorldPoint.x, realWorldPoint.y, 'flag').setDepth(config.layers.items);
    this.removeDraggableObjectsByTexture('flag');
    this.draggableMapObjects.push({
      object: this.flag,
      pointerdown: () => {
        this.flag.destroy();
        this.mapData.flag = undefined;
        this.flagToolTouchEvent(pointer);
      },
    });
  }

  draggingPortal: Portal;
  draggingPortalCoords: { a?: xy; b?: xy; id?: number };
  draggingPortalKey: string;
  addPortal(pointer: Phaser.Input.Pointer, realWorldPoint: xy): void {
    let portal, portalKey;

    if (this.draggingPortal) {
      portal = this.draggingPortalCoords;
      portalKey = this.draggingPortalKey;
    } else {
      const portalsLen = this.mapData.portals.length;
      if (portalsLen > 0) {
        // if portals exist we need to check the last portal to see if we are currently adding a B portal, or starting a new A portal
        const lastPortal = this.mapData.portals[portalsLen - 1];

        if (lastPortal.b === undefined) {
          portal = lastPortal;
          portalKey = 'b';
        }
      }
      if (!portal) {
        portal = { a: undefined, b: undefined, id: this.portalId++ };
        portalKey = 'a';
        this.mapData.portals.push(portal);
      }
    }

    portal[portalKey] = {
      ...realWorldPoint,
      y: this.invertY(realWorldPoint.y),
    };

    this.setPortals();
  }

  setPortals(): void {
    if (this.portalColors) {
      this.portalColors.destroy();
      this.portalColorIndex = 0;
    }
    this.portalColors = this.add.graphics().setDepth(config.layers.items + 1);

    this.portals.forEach((o) => o.destroy());
    this.removeDraggableObjectsByTexture('hole');
    this.portals = [];
    this.mapData.portals.forEach((portalCoords) => {
      const invertedPortalCoords = {
        a: portalCoords.a ? { x: portalCoords.a.x, y: this.invertY(portalCoords.a.y) } : undefined,
        b: portalCoords.b ? { x: portalCoords.b.x, y: this.invertY(portalCoords.b.y) } : undefined,
      };
      const portals: { a?: Portal; b?: Portal } = {};
      if (invertedPortalCoords.a) {
        portals.a = new Portal(this, invertedPortalCoords.a, invertedPortalCoords.b);
      }
      if (invertedPortalCoords.b) {
        portals.b = new Portal(this, invertedPortalCoords.b, invertedPortalCoords.a);
      }

      this.decoratePortals(portals);

      Object.keys(portals).forEach((portalKey) => {
        const portal = portals[portalKey];
        this.portals.push(portal);
        this.draggableMapObjects.push({
          object: portal,
          pointerdown: () => {
            this.draggingPortal = portal;
            this.draggingPortalCoords = invertedPortalCoords;
            this.draggingPortalKey = portalKey;
            this.portalToolTouchEvent({ x: portal.x, y: portal.y }, true);
            portalCoords[portalKey] = undefined;
            this.setPortals();
          },
          pointerup: (isInTrash: boolean) => {
            if (isInTrash) {
              // the portal being dragged was deleted. check if this portal had a mate. if so, delete it too.
              const matePortalKey = this.draggingPortalKey === 'a' ? 'b' : 'a';
              if (this.draggingPortalCoords[matePortalKey]) {
                this.mapData.portals = this.mapData.portals.filter(
                  (portalConfig) => portalConfig.id !== this.draggingPortalCoords.id,
                );
                console.log('deleting', this.mapData.portals);
                this.setPortals();
              }
            }
          },
        });
      });
    });
    console.log(this.mapData.portals);
  }

  decoratePortals(portals: { a?: Portal; b?: Portal }): void {
    this.portalColors.fillStyle(PORTAL_COLOR_INDICATORS[this.portalColorIndex], 1);
    Object.keys(portals).forEach((key) => {
      this.portalColors.fillCircle(portals[key].x + 15, portals[key].y + 8, 7);
    });
    this.portalColorIndex = (this.portalColorIndex + 1) % PORTAL_COLOR_INDICATORS.length;
  }

  playTest(): Promise<void> {
    if (this.mapData.flag === undefined) {
      alert('no hole');
      return;
    }

    const newMapData: MapData = { ...this.mapData, height: this.getMapHeight(), drawData: this.drawData };
    this.scene.start('Game', newMapData);
  }

  getMapHeight() {
    let mapHeight = this.highestDrawnY;

    this.mapData.portals.forEach((portalPair) => {
      if (portalPair.a) {
        mapHeight = Math.max(mapHeight, portalPair.a.y);
      }
      if (portalPair.b) {
        mapHeight = Math.max(mapHeight, portalPair.b.y);
      }
    });
    if (this.mapData.flag) {
      mapHeight = Math.max(mapHeight, this.mapData.flag.y + this.flag.height / 2);
    }
    this.mapData.windmills.forEach(
      (coords, i) => (mapHeight = Math.max(mapHeight, coords.y + this.windmills[i].fan.height / 2)),
    );

    // TODO at some point, may want to scan to get a more accurate map height... see scratch/getMapHeight.ts

    return mapHeight + TOP_OF_MAP_BUFFER;
  }

  update(time: number, delta: number): void {
    this.windmills.forEach((windmill) => windmill.update(time, delta));
  }

  processScrollEvent(evt: Phaser.Input.Pointer): void {
    // SCROLL EVENT
    // NOTE - must use the actual mouse coords, not the camera-translated RealWorldPoint!!!
    // if you use the translated point, after the map moves the event Y is being changed bc its new relative map position!
    const camera = this.cameras.main;

    if (evt.id !== 1) {
      // we allow scrolling w 2 fingers. this makes sure we only fire the listener for one finger, not once for each
      // without doing this, both fingers were firing scroll listeners and fighting eachother
      return;
    }
    if (!this.prevPointerCoords) {
      this.prevPointerCoords = { x: evt.x, y: evt.y };
      return;
    }

    if (this.input.pointer2.active) {
      const deltaY = this.prevPointerCoords.y - evt.y;
      if (Math.abs(deltaY) > 5) {
        console.log(`${this.prevPointerCoords.y} - ${evt.y} = ${deltaY}`);
        camera.scrollY += deltaY;
        console.log(camera.scrollY);
        this.prevPointerCoords = { x: evt.x, y: evt.y };
      }
    }
  }

  processWheelEvent(deltaY: number): void {
    this.cameras.main.scrollY += deltaY * 0.5;
    console.log(this.cameras.main.scrollY);
  }

  // TODO was looking into resizing map on scroll... for now, just using static height 10,000 px map. see scratch/resizeMapOnScroll.ts
}
