
// Require
import fs from 'fs';
import express from 'express';
import cors from 'cors';
import http from 'node:http';

import { Server } from 'socket.io';
import { callConnection } from "./backend/script/api/script/serverCall.js";
import { setupApi } from "./backend/script/api/handler.js";

// Main setup
const app = express();
app.use(express.json());
app.use(cors());

// Setup
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
  socket.on("chat message", ({ sentMessage, serverName, username }) => {
    io.emit("chat message", {sentMessage: sentMessage, username: username});

    /*
    try {
      const data = JSON.parse(fs.readFileSync('./db.json', 'utf8'));
      const serverData = data.servers.find(n => n.name === serverName);
  
      const textData = {
        from: username,
        text: sentMessage
      }

      serverData.sentText.push(textData);
      fs.writeFileSync('./db.json', JSON.stringify(data, null, 2));

      console.log(serverData)
    } catch (error) {
      console.error("Error reading database:", error);
    }
    */
  });
});

// Make sure "server.js" can run
server.listen(3000, () => {
    console.log("Server running on http://10.29.71.203:3000");
});