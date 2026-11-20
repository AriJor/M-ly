export function callConnection(io) {
  io.on("connection", (socket) => {
    
    // Join call
    socket.on("join-call", async ({ roomId, username }) => {  
      const socketsInRoom = await io.in(roomId).fetchSockets();
      const isAlreadyInRoom = socketsInRoom.some(
        (user) => user.data.username === username || user.id === socket.id
      );
      
      if (!isAlreadyInRoom) {
        socket.data.username = username;
        
        const existingUsers = socketsInRoom.map(s => ({
          userId: s.id,
          username: s.data.username
        }));

        socket.join(roomId);
        socket.emit("room-users", existingUsers);
        
        socket.to(roomId).emit("user-joined", {
          userId: socket.id,
          username: username
        });
      } else {
        console.error("Already on the call");
      }
    });

    // Leave call
    socket.on("leave-call", async ({ roomId, username }) => {
      const currentUsername = socket.data.username || username;
      
      socket.to(roomId).emit("user-left", {
        username: currentUsername,
        userId: socket.id
      });

      socket.leave(roomId);
      delete socket.data.username;
    });
    socket.on("disconnect", () => {
      if (socket.data.username) {
        socket.rooms.forEach((roomId) => {
          if (roomId !== socket.id) {
            socket.to(roomId).emit("user-left", {
              username: socket.data.username,
              userId: socket.id
            });
          }
        });
      }
    });

    socket.on("signal", ({ to, signal }) => {
      io.to(to).emit("signal", {
        from: socket.id,
        signal
      });
    });
    
  });
}