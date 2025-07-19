import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { GameScene } from '../phaser/scenes/GameScene';
import { io, Socket } from 'socket.io-client';

export const PhaserGame: React.FC = () => {
  const gameRef = useRef<Phaser.Game | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    socketRef.current = io('http://localhost:3000');

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent: 'phaser-container',
      width: '100%',
      height: '100%',
      pixelArt: true,
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { x: 0, y: 0 },
          debug: false,
        },
      },
      scene: [GameScene],
    };

    gameRef.current = new Phaser.Game(config);

    return () => {
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, []);

  return <div id="phaser-container" />;
};
