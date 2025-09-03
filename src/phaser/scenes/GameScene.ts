import Phaser from "phaser";
import {
  PLAYER_SPEED,
  PLAYER_SPRITE_WIDTH,
  PLAYER_SPRITE_HEIGHT,
  COLLISION_LAYER_VISIBLE,
  CAMERA_ZOOM,
} from "../constants";
import type { Socket } from "socket.io-client";

type PlayerSprite = Phaser.Types.Physics.Arcade.SpriteWithDynamicBody & {
  playerId?: string,
  targetX?: number,
  targetY?: number,
};

export class GameScene extends Phaser.Scene {
  private socket: Socket;
  private player: PlayerSprite | null = null;
  private otherPlayers!: Phaser.GameObjects.Group;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private lastMovedTime: number = 0;
  private isMoving: boolean = false;

  constructor(socket: Socket) {
    super("GameScene");
    this.socket = socket;
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
    this.otherPlayers = this.add.group();
    if (this.input.keyboard)
      this.cursors = this.input.keyboard.createCursorKeys();

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

    const foregroundLayer = map.createLayer("foreground", tileset, 0, 0);
    if (!foregroundLayer) {
      console.error("Foreground layer not found!");
      return;
    }
    foregroundLayer.setDepth(10);

    collisionLayer.setVisible(COLLISION_LAYER_VISIBLE);
    collisionLayer.setCollisionByProperty({ collides: true });

    // Camera setup
    this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    this.cameras.main.setZoom(CAMERA_ZOOM);

    this.listenToSocketEvents(collisionLayer);
    this.createAnimations();

    this.socket.emit('clientReady');
  }

  listenToSocketEvents(collisionLayer: Phaser.Tilemaps.TilemapLayer) {
    this.socket.on("currentPlayers", (players: Record<string, any>) => {
      console.log("Current players:", players);
      Object.values(players).forEach(playerInfo => {
        if (playerInfo.playerId === this.socket.id) {
          this.addPlayer(playerInfo, collisionLayer);
        } else {
          this.addOtherPlayer(playerInfo);
        }
      });
    });
    
    this.socket.on("newPlayer", (playerInfo: any) => {
      console.log("New player joined:", playerInfo);
      this.addOtherPlayer(playerInfo);
    });

    this.socket.on("playerDisconnected", (playerId: string) => {
      console.log("Player disconnected:", playerId);
      this.otherPlayers.getChildren().forEach((item) => {
        const p = item as PlayerSprite;
        if (p.playerId === playerId) {
          p.destroy();
        }
      });
    });

    this.socket.on("playerMoved", (playerInfo: any) => {
      this.otherPlayers.getChildren().forEach((item) => {
        const p = item as PlayerSprite;
        if (p.playerId === playerInfo.playerId) {
          p.targetX = playerInfo.x;
          p.targetY = playerInfo.y;
          p.anims.play(playerInfo.animation, true);
        }
      });
    });

    this.socket.on("playerStopped", (playerInfo: any) => {
      this.otherPlayers.getChildren().forEach((item) => {
        const p = item as PlayerSprite;
        if (p.playerId === playerInfo.playerId) {
          p.anims.stop();
          p.setPosition(playerInfo.x, playerInfo.y);
        }
      });
    });
  };

  addPlayer(playerInfo: any, collisionLayer?: Phaser.Tilemaps.TilemapLayer) {
    this.player = this.physics.add.sprite(playerInfo.x, playerInfo.y, "player", 0);
    this.player.setScale(0.17);
    this.player.setCollideWorldBounds(true);
    this.cameras.main.startFollow(this.player, true);
    this.cameras.main.setZoom(CAMERA_ZOOM);

    if (collisionLayer) {
      this.physics.add.collider(this.player, collisionLayer);
    }

    this.physics.add.collider(this.player, this.otherPlayers);
  };

  addOtherPlayer(playerInfo: any) {
    const otherPlayer: PlayerSprite = this.physics.add.sprite(playerInfo.x, playerInfo.y, "player", 0);
    otherPlayer.setScale(0.17);
    otherPlayer.playerId = playerInfo.playerId;
    otherPlayer.setTint(0xaaaaaa);
    otherPlayer.setCollideWorldBounds(true);
    otherPlayer.body.setImmovable(true);

    this.otherPlayers.add(otherPlayer);
  };

  createAnimations() {
    ['left', 'right', 'up', 'down'].forEach((dir) => {
      if (!this.anims.exists(dir)) {
        let animConfig = { frameRate: 10, repeat: -1, frames: [] as any[] };
        if (dir === 'down') animConfig.frames = this.anims.generateFrameNumbers('player', { start: 0, end: 3 });
        if (dir === 'up') animConfig.frames = this.anims.generateFrameNumbers('player', { start: 4, end: 7 });
        if (dir === 'right') animConfig.frames = this.anims.generateFrameNumbers('player', { start: 8, end: 11 });
        if (dir === 'left') animConfig.frames = this.anims.generateFrameNumbers('player', { start: 12, end: 15 });

        this.anims.create({
          key: dir,
          ...animConfig,
        })
      }
    });
  }

  update(time: number, delta: number) {
    if (!this.player || !this.cursors) return;

    let currentAnimation = this.player.anims.currentAnim?.key || "down";
    this.player.setVelocity(0);

    if (this.cursors.left.isDown) {
      this.player.setVelocityX(-PLAYER_SPEED);
      currentAnimation = "left";
    } else if (this.cursors.right.isDown) {
      this.player.setVelocityX(PLAYER_SPEED);
      currentAnimation = "right";
    } else if (this.cursors.up.isDown) {
      this.player.setVelocityY(-PLAYER_SPEED);
      currentAnimation = "up";
    } else if (this.cursors.down.isDown) {
      this.player.setVelocityY(PLAYER_SPEED);
      currentAnimation = "down";
    } else {
      currentAnimation = this.player.anims.currentAnim?.key || "down";
      this.player.anims.stop();
    }

    this.player.anims.play(currentAnimation, true);

    const isCurrentlyMoving = !Phaser.Math.Vector2.ZERO.equals(this.player.body.velocity);

    if (isCurrentlyMoving) {
      this.isMoving = true;
      if (time > this.lastMovedTime + 50) {
        this.socket.emit("playerMovement", {
          x: this.player.x,
          y: this.player.y,
          animation: currentAnimation,
        });
        this.lastMovedTime = time;
      }
    } else {
      if (this.isMoving) {
        this.isMoving = false;
        this.socket.emit("playerStopped", {
          x: this.player.x,
          y: this.player.y,
          animation: currentAnimation,
        });
      }
    }

    this.otherPlayers.getChildren().forEach(p => {
      const otherPlayer = p as PlayerSprite;
      if (otherPlayer.targetX !== undefined && otherPlayer.targetY !== undefined) {
        otherPlayer.setPosition(otherPlayer.targetX, otherPlayer.targetY);
        otherPlayer.body.reset(otherPlayer.targetX, otherPlayer.targetY);
        otherPlayer.targetX = undefined;
        otherPlayer.targetY = undefined;
      }
    });
  }
}
