import Phaser from "phaser";
import {
  PLAYER_SPEED,
  PLAYER_SPRITE_WIDTH,
  PLAYER_SPRITE_HEIGHT,
  COLLISION_LAYER_VISIBLE,
  CAMERA_ZOOM,
} from "../constants";

export class GameScene extends Phaser.Scene {
  private player!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;

  constructor() {
    super("GameScene");
  }

  preload() {
    this.load.tilemapTiledJSON("map", "assets/my-map.json");
    this.load.image("tiles", "assets/pokemon-12.png");
    this.load.image("collision", "assets/collision.png");

    this.load.spritesheet("player", "assets/my-sprite.png", {
      frameWidth: PLAYER_SPRITE_WIDTH,
      frameHeight: PLAYER_SPRITE_HEIGHT,
    });
  }

  create() {
    const map = this.make.tilemap({ key: "map" });

    if (!map) {
      console.error("Tilemap not found!");
      return;
    }

    const tileset = map.addTilesetImage("pokemon-12", "tiles");
    const collisionTileset = map.addTilesetImage("collision", "collision");

    if (!tileset || !collisionTileset) {
      console.error("Tileset not found!");
      return;
    }

    map.layers.forEach((layerData: any) => {
      if (layerData.name !== "collision" && layerData.name !== "foreground") {
        const layer = map.createLayer(layerData.name, tileset, 0, 0);
        if (!layer) console.error("Ground layer not found!");
      }
    });

    const collisionLayer = map.createLayer("collision", collisionTileset, 0, 0);

    if (!collisionLayer) {
      console.error("Collision layer not found!");
      return;
    }

    collisionLayer.setVisible(COLLISION_LAYER_VISIBLE);
    collisionLayer.setCollisionByProperty({ collides: true });

    const spawnPoint = map.findObject("spawns", (obj) => obj.name === "playerSpawn");
    const playerX = spawnPoint ? spawnPoint.x || 516 : 516;
    const playerY = spawnPoint ? spawnPoint.y || 230 : 230;

    this.player = this.physics.add.sprite(playerX, playerY, "player", 0);
    this.player.setScale(0.17);

    if (this.input.keyboard)
      this.cursors = this.input.keyboard.createCursorKeys();

    this.physics.add.collider(this.player, collisionLayer);

    const foregroundLayer = map.createLayer("foreground", tileset, 0, 0);
    if (!foregroundLayer) {
      console.error("Foreground layer not found!");
      return;
    }
    foregroundLayer.setDepth(10);

    // Player Animations
    this.anims.create({
      key: "down",
      frames: this.anims.generateFrameNumbers("player", { start: 0, end: 3 }),
      frameRate: 10,
      repeat: -1,
    });

    this.anims.create({
      key: "up",
      frames: this.anims.generateFrameNumbers("player", { start: 4, end: 7 }),
      frameRate: 10,
      repeat: -1,
    });

    this.anims.create({
      key: "right",
      frames: this.anims.generateFrameNumbers("player", { start: 8, end: 11 }),
      frameRate: 10,
      repeat: -1,
    });

    this.anims.create({
      key: "left",
      frames: this.anims.generateFrameNumbers("player", { start: 12, end: 15 }),
      frameRate: 10,
      repeat: -1,
    });

    // Camera setup
    this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    this.player.setCollideWorldBounds(true);
    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    this.cameras.main.startFollow(this.player, true);
    this.cameras.main.setZoom(CAMERA_ZOOM);
  }

  update() {
    this.player.setVelocity(0);

    if (this.cursors.left.isDown) {
      this.player.setVelocityX(-PLAYER_SPEED);
      this.player.anims.play("left", true);
    } else if (this.cursors.right.isDown) {
      this.player.setVelocityX(PLAYER_SPEED);
      this.player.anims.play("right", true);
    } else if (this.cursors.up.isDown) {
      this.player.setVelocityY(-PLAYER_SPEED);
      this.player.anims.play("up", true);
    } else if (this.cursors.down.isDown) {
      this.player.setVelocityY(PLAYER_SPEED);
      this.player.anims.play("down", true);
    } else {
      this.player.anims.stop();
    }
  }
}
