import express from "express";
import { createServer as createViteServer } from "vite";
import { createServer } from "http";
import { Server } from "socket.io";
import path from "path";
import crypto from "crypto";

async function startServer() {
  const app = express();
  const PORT = 3000;
  const httpServer = createServer(app);

  app.use(express.json({ limit: '2mb' }));

  // Security Headers Middleware
  app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-XSS-Protection", "1; mode=block");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    // Restrict origin if needed
    const origin = req.headers.origin;
    if (!origin || origin.includes('localhost') || origin.includes('run.app') || origin.includes('meuplace')) {
      res.setHeader("Access-Control-Allow-Origin", origin || "*");
      res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    }
    if (req.method === 'OPTIONS') {
      return res.sendStatus(204);
    }
    next();
  });
  
  // Setup Socket.IO with origin check and sanitized payloads
  const io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        // Accept localhost, preview containers, and production domain
        if (!origin || origin.includes('localhost') || origin.includes('run.app') || origin.includes('meuplace')) {
          callback(null, true);
        } else {
          callback(new Error('Origem não permitida pelo CORS'));
        }
      },
      methods: ["GET", "POST"]
    }
  });

  // Active chat rooms in memory (isolated per room)
  const messages: any[] = [];

  io.on("connection", (socket) => {
    // Room joining with validation
    socket.on("join_room", (roomId) => {
      if (typeof roomId !== 'string' || roomId.length > 100) return;
      socket.join(roomId);
      const roomMessages = messages.filter(m => m.roomId === roomId).slice(-50);
      socket.emit("previous_messages", roomMessages);
    });

    socket.on("send_message", (data) => {
      if (!data || typeof data.roomId !== 'string' || typeof data.text !== 'string') return;
      const sanitizedText = data.text.trim().substring(0, 2000);
      if (!sanitizedText) return;

      const messageData = {
        roomId: data.roomId,
        text: sanitizedText,
        senderId: String(data.senderId || 'anon').substring(0, 100),
        senderName: String(data.senderName || 'Usuário').substring(0, 100),
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString()
      };
      
      messages.push(messageData);
      // Keep in-memory buffer manageable
      if (messages.length > 1000) {
        messages.splice(0, 200);
      }
      
      // Broadcast strictly to everyone in that specific room
      io.to(data.roomId).emit("receive_message", messageData);
    });

    socket.on("disconnect", () => {
      // Clean disconnect
    });
  });

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  app.get("/sitemap.xml", async (req, res) => {
    try {
      const projectId = "meuplace-2fa32";
      const baseUrl = "https://www.meuplace.com";
      
      // Fetch properties from Firestore REST API
      const response = await fetch(`https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/properties?pageSize=1000`);
      const data = await response.json();
      
      const properties = data.documents || [];
      
      let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/properties</loc>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${baseUrl}/agencies</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${baseUrl}/resorts</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${baseUrl}/about</loc>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>${baseUrl}/contact</loc>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>${baseUrl}/help</loc>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>${baseUrl}/terms</loc>
    <changefreq>monthly</changefreq>
    <priority>0.3</priority>
  </url>
  <url>
    <loc>${baseUrl}/privacy</loc>
    <changefreq>monthly</changefreq>
    <priority>0.3</priority>
  </url>`;

      // Add dynamic property URLs - ONLY properties that are approved!
      properties.forEach((doc: any) => {
        const nameParts = doc.name.split('/');
        const id = nameParts[nameParts.length - 1];
        
        // Strict security: do not index unapproved properties
        const isApproved = doc.fields?.isApproved?.booleanValue;
        if (isApproved !== true) return;

        xml += `
  <url>
    <loc>${baseUrl}/property/${id}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
      });

      xml += `\n</urlset>`;
      
      res.header('Content-Type', 'application/xml');
      res.send(xml);
    } catch (error) {
      console.error("Error generating sitemap:", error);
      res.status(500).send("Error generating sitemap");
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
