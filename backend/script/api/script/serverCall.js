export function callConnection(io) {
  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("join-call", async ({ roomId, userName }) => {  
      // Check duplicate
      const socketsInRoom = await io.in(roomId).fetchSockets();
      const isAlreadyInRoom = socketsInRoom.some(
        (x) => x.data.userName === userName || x.id === socket.id
      );

      console.log(`User ${userName} (${socket.id}) joined room ${roomId}`);

      if (!isAlreadyInRoom) {
        socket.data.userName = userName;
        
        const existingUsers = socketsInRoom.map(s => ({
          userId: s.id,
          userName: s.data.userName
        }));

        socket.join(roomId);
        socket.emit("room-users", existingUsers);
        
        socket.to(roomId).emit("user-joined", {
          userId: socket.id,
          userName: userName,
          timestamp: new Date().toISOString()
        });
      } else {
        console.error("Already on the call");
      }
    });

    socket.on("signal", ({ to, signal }) => {
      io.to(to).emit("signal", {
        from: socket.id,
        signal
      });
    });
  
    socket.on("disconnecting", () => {
      for (const roomId of socket.rooms) {
        if (roomId !== socket.id) {
          console.log(roomId, socket.id)
          socket.to(roomId).emit("user-left", {
            userId: socket.id
          });
        }
      }
    });

    socket.on("user-left", async ({ userId }) => {
      
    })
  });
}