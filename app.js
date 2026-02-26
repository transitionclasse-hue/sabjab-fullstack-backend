import 'dotenv/config';
import Fastify from 'fastify';
import fastifySocketIO from 'fastify-socket.io';
import fastifyCookie from '@fastify/cookie';
import fastifySession from '@fastify/session';
import fastifyStatic from '@fastify/static';
import fastifyCors from '@fastify/cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { v2 as cloudinary } from 'cloudinary';

import { connectDB } from "./src/config/connect.js";
import { registerRoutes } from './src/routes/index.js';
import { buildAdminRouter } from './src/config/setup.js';
import { sendPushNotification } from './src/utils/notification.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

/* =====================================================
   🔥 CLOUDINARY CONFIGURATION
===================================================== */

console.log("Cloudinary Cloud:", process.env.CLOUDINARY_CLOUD_NAME);
console.log("Cloudinary Key:", process.env.CLOUDINARY_API_KEY);
console.log("Cloudinary Secret:", process.env.CLOUDINARY_API_SECRET ? "Loaded ✅" : "Missing ❌");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/* =====================================================
   🚀 START SERVER
===================================================== */

const start = async () => {
  try {

    // ---------------- CONNECT DB ----------------
    await connectDB(MONGO_URI);

    const app = Fastify({
      logger: true
    });

    // ---------------- COOKIE + SESSION ----------------
    await app.register(fastifyCookie);

    await app.register(fastifyCors, {
      origin: true, // For production, you might want to specify allowed origins
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    });

    await app.register(fastifySession, {
      secret: process.env.COOKIE_PASSWORD,
      cookie: {
        secure: false,
        httpOnly: true
      },
      saveUninitialized: false
    });

    // ---------------- SOCKET.IO ----------------
    await app.register(fastifySocketIO, {
      cors: { origin: "*" },
      pingInterval: 10000,
      pingTimeout: 5000,
      transports: ['websocket']
    });

    // ---------------- STATIC FILES ----------------
    await app.register(fastifyStatic, {
      root: path.join(__dirname, 'public'),
      prefix: '/public/',
    });

    // ---------------- ROUTES ----------------
    await registerRoutes(app);

    // ---------------- ADMIN PANEL ----------------
    await buildAdminRouter(app);

    // ---------------- GLOBAL ERROR HANDLER ----------------
    app.setErrorHandler((error, request, reply) => {
      console.error("❌ GLOBAL ERROR:", error);
      reply.status(error.statusCode || 500).send({
        error: error.name,
        message: error.message,
        statusCode: error.statusCode || 500
      });
    });

    // ---------------- START SERVER ----------------
    await app.listen({ port: PORT, host: "0.0.0.0" });

    console.log(`✅ SabJab Backend running on http://localhost:${PORT}`);

    /* =====================================================
       🔌 SOCKET LOGIC
    ===================================================== */

    app.ready().then(() => {
      app.io.on("connection", (socket) => {

        console.log("🟢 User Connected:", socket.id);

        socket.on("join", (userId) => {
          if (userId) {
            socket.join(String(userId));
            console.log(`👥 User ${userId} joined room`);
          }
        });

        socket.on("joinRoom", (roomId) => {
          if (roomId) {
            socket.join(String(roomId));
            console.log(`📦 Socket ${socket.id} joined tracking room ${roomId}`);
          }
        });

        socket.on("disconnect", () => {
          console.log("🔴 User disconnected");
        });

      });
    });

  } catch (error) {
    console.error("❌ SERVER START ERROR:", error);
    process.exit(1);
  }
};

start();
