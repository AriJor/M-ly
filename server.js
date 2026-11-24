
// Require
import fs from 'fs';
import express from 'express';
import cors from 'cors';
import http from 'node:http';

// Functions
import { Server } from 'socket.io';
import { callConnection } from "./backend/script/api/script/serverCall.js";
import { setupApi } from "./backend/script/api/handler.js";

// Server setup
const app = express();
app.use(express.json());
app.use(cors());

// Data setup
setupApi(app);
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});
callConnection(io);

io.on("connection", (socket) => {
  socket.on("join-server", (serverName) => {
    socket.join(serverName);
    console.log(`Socket ${socket.id} joined room: ${serverName}`);
  });

  socket.on("chat message", ({ sentMessage, serverName, username }) => {
    io.to(serverName).emit("chat message", {
      sentMessage: sentMessage,
      username: username
    });

    try {
      const data = JSON.parse(fs.readFileSync('./db.json', 'utf8'));
      const serverData = data.servers.find(n => n.name === serverName);
      if (serverData) {
        serverData.sentText.push({ from: username, text: sentMessage });
        fs.writeFileSync('./db.json', JSON.stringify(data, null, 2));
      }
    } catch (error) {
      console.error("Error writing to database:", error);
    }
  });
});

// Make sure server can run
server.listen(3000, () => {
    console.log("Server running on http://10.29.71.203:3000");
});