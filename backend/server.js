  require("dotenv").config();
  const express = require("express");
  const http = require("http");
  const { Server } = require("socket.io");
  const cors = require("cors");
  const connectDB = require("./db");
  const authRoutes = require("./routes/authRoutes");
  const postRoutes = require("./routes/postRoutes");
  const userRoutes = require("./routes/userRoutes");
  const Message = require("./models/Message");
  const notificationRoutes = require("./routes/notificationRoutes");
  const Notification = require("./models/Notification");
  const searchRoutes = require("./routes/searchRoutes");
  const messageRoutes = require("./routes/messageRoutes");
  const app = express();
  const server = http.createServer(app);

  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL,
      methods: ["GET", "POST"],
    },
  });

  connectDB();

  app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
  app.use(express.json());

  // REST routes
  app.use("/api/auth", authRoutes);
  app.use("/api/posts", postRoutes);
  app.use("/api/users", userRoutes);
  app.use("/api/notifications", notificationRoutes);
  app.use("/api/search", searchRoutes);
  app.use("/api/messages", messageRoutes);
  const onlineUsers = new Map();

  app.set("io", io);
  app.set("onlineUsers", onlineUsers);

  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);
    socket.on("join", (userId) => {
      onlineUsers.set(userId, socket.id);

      // Notify everyone user is online
      io.emit("user-online", userId);

      console.log("User joined:", userId);
    });

    socket.on("new-post", (post) => {
      socket.broadcast.emit("new-post", post);
    });
    socket.on("post-liked", (post) => {
      socket.broadcast.emit("post-liked", post);
    });

    socket.on("post-commented", (post) => {
      socket.broadcast.emit("post-commented", post);
    });
    socket.on("send-message", async ({ senderId, receiverId, text }) => {
      try {
        const msg = await Message.create({
          sender: senderId,
          receiver: receiverId,
          text,
        });
        const populated = await msg.populate("sender receiver", "username");
        const receiverSocketId = onlineUsers.get(receiverId);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit("receive-message", populated);
        }
        // socket.emit("receive-message", populated);
      } catch (err) {
        console.error("Message error:", err);
      }
    });

    socket.on("disconnect", () => {
      let offlineUser = null;

      for (const [userId, sId] of onlineUsers.entries()) {
        if (sId === socket.id) {
          onlineUsers.delete(userId);
          offlineUser = userId;
          break;
        }
      }

      if (offlineUser) {
        io.emit("user-offline", offlineUser);
      }

      console.log("Socket disconnected:", socket.id);
    });

    socket.on("typing", ({ senderId, receiverId }) => {
      const receiverSocketId = onlineUsers.get(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("typing", { senderId });
      }
    });

    socket.on("stop-typing", ({ senderId, receiverId }) => {
      const receiverSocketId = onlineUsers.get(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("stop-typing", { senderId });
      }
    });
    socket.on("mark-seen", async ({ senderId, receiverId }) => {
      const messages = await Message.updateMany(
        { sender: senderId, receiver: receiverId, seen: false },
        { seen: true }
      );

      io.to(onlineUsers.get(senderId)).emit("messages-seen", receiverId);
    });

    socket.on("send-message", async ({ senderId, receiverId, text }) => {
      try {
        const msg = await Message.create({
          sender: senderId,
          receiver: receiverId,
          text,
        });
        const populated = await msg.populate("sender receiver", "username");
        const receiverSocketId = onlineUsers.get(receiverId);

        if (receiverSocketId) {
          msg.delivered = true;
          await msg.save();
          io.to(receiverSocketId).emit("receive-message", populated);
        }
        socket.emit("receive-message", populated);

        // Create "message" notification
        const notif = await Notification.create({
          receiver: receiverId,
          sender: senderId,
          type: "message",
          message: msg._id,
        });

        if (receiverSocketId) {
          const populatedNotif = await notif.populate(
            "sender",
            "username avatarUrl"
          );
          io.to(receiverSocketId).emit("notify", populatedNotif);
        }
      } catch (err) {
        console.error("Message error:", err);
      }
    });
  });

  const PORT = process.env.PORT || 5001;
  server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
