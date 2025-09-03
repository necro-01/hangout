import express from "express";
import { createServer } from "http";
import { Server, Socket } from "socket.io";
import { instrument } from '@socket.io/admin-ui';

const app = express();
const server = createServer(app);

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "https://admin.socket.io"],
    credentials: true,
    methods: ["GET", "POST"]
  }
});

interface Player {
  x: number;
  y: number;
  playerId: string;
  animation: string;
}

const players: Record<string, Player> = {};

io.on("connection", (socket: Socket) => {
  console.log(`A user connected: `, socket.id);

  socket.on('clientReady', () => {
    console.log(`Client is ready: `, socket.id);

    players[socket.id] = {
      x: 516,
      y: 230,
      playerId: socket.id,
      animation: "down",
    };

    socket.emit("currentPlayers", players);
    socket.broadcast.emit("newPlayer", players[socket.id]);
  });

  socket.on("disconnect", () => {
    console.log(`A user disconnected: `, socket.id);
    delete players[socket.id];
    io.emit("playerDisconnected", socket.id);
  });

  socket.on("playerMovement", (movementData: { x: number; y: number; animation: string }) => {
    console.log('Player moved: ', socket.id, movementData)
    const player = players[socket.id];
    if (player) {
      player.x = movementData.x;
      player.y = movementData.y;
      player.animation = movementData.animation;

      socket.broadcast.emit("playerMoved", player);
    }
  });

  socket.on("playerStopped", (stopData: { x: number; y: number; animation: string }) => {
    const player = players[socket.id];
    if (player) {
      player.x = stopData.x;
      player.y = stopData.y;
      player.animation = stopData.animation;

      socket.broadcast.emit("playerStopped", player);
    }
  });
});

instrument(io, {
  auth: false,
  mode: "development",
});

server.listen(3000, () => {
  console.log("Server is running on http://localhost:3000");
});
