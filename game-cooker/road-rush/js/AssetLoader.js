/**
 * AssetLoader.js
 * Centralized asset management and image preloading for Road Rush Infinite.
 */
class AssetLoader {
  constructor() {
    this.assets = {
      road: 'images/assets/background/infinite_road_tile.png',
      brakeBtn: 'images/assets/ui/break_button.png',
      attackBtn: 'images/assets/UserInterface/ActionBtn.png',
      bikeBody: 'images/assets/Motorcycle Body/1.png',
      rider: 'images/assets/Riders/01/Riders01.png',
      enemyBikes: [
        'images/assets/Motorcycle Body/2.png',
        'images/assets/Motorcycle Body/3.png',
        'images/assets/Motorcycle Body/4.png'
      ],
      enemyRiders: [
        'images/assets/Riders/02/Riders02.png',
        'images/assets/Riders/03/Riders03.png',
        'images/assets/Riders/04/Riders04.png'
      ],
      attackLeft: [
        'images/assets/Riders/01/Hit01/Left/1.png',
        'images/assets/Riders/01/Hit01/Left/2.png',
        'images/assets/Riders/01/Hit01/Left/3.png',
        'images/assets/Riders/01/Hit01/Left/4.png'
      ],
      attackRight: [
        'images/assets/Riders/01/Hit01/Right/1.png',
        'images/assets/Riders/01/Hit01/Right/2.png',
        'images/assets/Riders/01/Hit01/Right/3.png',
        'images/assets/Riders/01/Hit01/Right/4.png'
      ],
      traffic: [
        'images/assets/vehicles/traffic_cars/1.png',
        'images/assets/vehicles/traffic_cars/2.png',
        'images/assets/vehicles/traffic_cars/3.png',
        'images/assets/vehicles/traffic_cars/4.png'
      ],
      coins: [
        'images/assets/Items/01/1.png',
        'images/assets/Items/01/2.png',
        'images/assets/Items/01/3.png',
        'images/assets/Items/01/4.png'
      ],
      explosions: [
        'images/assets/CollisionFx/01/1.png',
        'images/assets/CollisionFx/01/2.png',
        'images/assets/CollisionFx/01/3.png',
        'images/assets/CollisionFx/01/4.png',
        'images/assets/CollisionFx/01/5.png',
        'images/assets/CollisionFx/01/6.png'
      ]
    };

    this.images = {};
    this.loadedCount = 0;
    this.totalCount = 0;
    this.isReady = false;
  }

  preload(onComplete) {
    const list = [
      { key: 'road', src: this.assets.road },
      { key: 'bike', src: this.assets.bikeBody },
      { key: 'rider', src: this.assets.rider }
    ];

    this.assets.enemyBikes.forEach((src, i) => list.push({ key: 'ebike_' + i, src }));
    this.assets.enemyRiders.forEach((src, i) => list.push({ key: 'erider_' + i, src }));
    this.assets.attackLeft.forEach((src, i) => list.push({ key: 'att_l_' + i, src }));
    this.assets.attackRight.forEach((src, i) => list.push({ key: 'att_r_' + i, src }));
    this.assets.traffic.forEach((src, i) => list.push({ key: 'car_' + i, src }));
    this.assets.coins.forEach((src, i) => list.push({ key: 'coin_' + i, src }));
    this.assets.explosions.forEach((src, i) => list.push({ key: 'fx_' + i, src }));

    this.totalCount = list.length;

    list.forEach(item => {
      const img = new Image();
      img.src = encodeURI(item.src);
      img.onload = () => {
        this.images[item.key] = img;
        this.loadedCount++;
        if (this.loadedCount >= this.totalCount) {
          this.isReady = true;
          if (onComplete) onComplete();
        }
      };
      img.onerror = () => {
        console.warn('[AssetLoader] Fallback for asset:', item.src);
        this.loadedCount++;
        if (this.loadedCount >= this.totalCount) {
          this.isReady = true;
          if (onComplete) onComplete();
        }
      };
    });
  }

  get(key) {
    return this.images[key];
  }
}

// Global instance
window.assets = new AssetLoader();
