  // async checkScroll(): Promise<void> {
  //   const camera = this.cameras.main;
  //   if (camera.scrollY < getGameHeight(this)) {
  //     const addToHeight = getGameHeight(this) - camera.scrollY;
  /* this.mapData.height = this.mapData.height + addToHeight;
      this.mapData.windmills.map((o) => (o.y += addToHeight));
      this.mapData.portals.map((o) => {
        if (o.a) o.a.y += addToHeight;
        if (o.b) o.b.y += addToHeight;
      });
      this.map.addToHeight(addToHeight);
      camera.scrollY = getGameHeight(this); */
  /* 
      const [grassImage, sandImage] = await Promise.all([
        new Promise<HTMLImageElement>((resolve) => {
          this.rtGrass.snapshot((image: HTMLImageElement) => resolve(image));
        }),
        new Promise<HTMLImageElement>((resolve) => {
          this.rtSand.snapshot((image: HTMLImageElement) => resolve(image));
        }),
      ]);
      this.rtGrass = this.add.renderTexture(0, 0, this.mapData.width, this.mapData.height).setVisible(false);
      this.rtSand = this.add.renderTexture(0, 0, this.mapData.width, this.mapData.height).setVisible(false);
      this.rtGrass.draw(grassImage, 0, addToHeight);
      this.rtSand.draw(sandImage, 0, addToHeight);
      this.textures.get(this.mapData.grassMask).destroy();
      this.textures.get(this.mapData.sandMask).destroy();
      this.rtGrass.saveTexture(this.mapData.grassMask);
      this.rtSand.saveTexture(this.mapData.sandMask); */
  //this.rtGrass.setScale(1, this.rtGrass.scaleY + 1);
  //this.rtSand.setScale(1, this.rtGrass.scaleY + 1);
  //   }
  // }