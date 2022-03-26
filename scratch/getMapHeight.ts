
    // TODO at some point, may want to scan to get a more accurate map height... for instance what if they draw something at top then erase it...
    // for (let y = 0; y < this.invertY(mapHeight); y += 15) {
    //   const snapshotPromises = [];
    //   for (let x = 0; x < this.mapData.width; x++) {
    //     snapshotPromises.push(new Promise<any>((resolve) =>
    //       this.rtGrass.snapshotPixel(x, y, (px: Phaser.Display.Color) => resolve(px.alpha))
    //     ));
    //     snapshotPromises.push(new Promise<any>((resolve) =>
    //       this.rtSand.snapshotPixel(x, y, (px: Phaser.Display.Color) => resolve(px.alpha))
    //     ));
    //   }
    //   const snapshotsForRow = await Promise.all(snapshotPromises);
    //   if (snapshotsForRow.some(x => x === 1)) {
    //     mapHeight = this.invertY(y);
    //     break;
    //   }
    // }

    