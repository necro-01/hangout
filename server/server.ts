import express from "express";
import { createServer } from "http";
import { Server, Socket } from "socket.io";

const app = express();
const server = createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket: Socket) => {
  console.log(`A user connected: `, socket.id);
});

server.listen(3000, () => {
  console.log("Server is running on http://localhost:3000");
});
