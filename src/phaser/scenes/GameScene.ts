import Phaser from "phaser";
import {
  PLAYER_SPEED,
  PLAYER_SPRITE_WIDTH,
  PLAYER_SPRITE_HEIGHT,
} from "../constants";

export class GameScene extends Phaser.Scene {
  private player!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;

  constructor() {
    super("GameScene");
  }

  preload() {
    this.load.image("map", "assets/my-map.png");
    this.load.spritesheet("player", "assets/my-sprite.png", {
      frameWidth: PLAYER_SPRITE_WIDTH,
      frameHeight: PLAYER_SPRITE_HEIGHT,
    });
  }

  create() {
    const map = this.add.image(0, 0, "map").setOrigin(0, 0);

    this.player = this.physics.add.sprite(516, 230, "player", 0);
    this.player.setScale(0.25);

    if (this.input.keyboard)
      this.cursors = this.input.keyboard.createCursorKeys();

    this.physics.world.setBounds(0, 0, map.width, map.height);
    this.player.setCollideWorldBounds(true);
    
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
    this.cameras.main.startFollow(this.player, true);
    this.cameras.main.setBounds(0, 0, map.width, map.height);
    this.cameras.main.setZoom(3);
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
