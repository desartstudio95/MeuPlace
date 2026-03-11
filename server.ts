import express from "express";
import { createServer as createViteServer } from "vite";
import { createServer } from "http";
import { Server } from "socket.io";

async function startServer() {
  const app = express();
  const PORT = 3000;
  const httpServer = createServer(app);
  
  // Setup Socket.IO
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  // Store active chats in memory (for demo purposes)
  const messages: any[] = [];

  io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    // Send previous messages when a user joins a room
    socket.on("join_room", (roomId) => {
      socket.join(roomId);
      const roomMessages = messages.filter(m => m.roomId === roomId);
      socket.emit("previous_messages", roomMessages);
    });

    socket.on("send_message", (data) => {
      const messageData = {
        ...data,
        id: Math.random().toString(36).substring(7),
        timestamp: new Date().toISOString()
      };
      messages.push(messageData);
      
      // Broadcast to everyone in the room
      io.to(data.roomId).emit("receive_message", messageData);
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
