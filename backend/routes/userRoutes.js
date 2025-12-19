const express = require("express");
const multer = require("multer");
const cloudinary = require("../config/cloudinary");
const User = require("../models/User");
const Post = require("../models/Post");
const Notification = require("../models/Notification");
const auth = require("../middleware/auth");

const router = express.Router();

/* ================= MULTER (MEMORY) ================= */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

/* ===================================================
   GET CURRENT USER PROFILE
=================================================== */
router.get("/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    const postCount = await Post.countDocuments({ author: user._id });

    res.json({
      user,
      postCount,
      followersCount: user.followers.length,
      followingCount: user.following.length,
    });
  } catch (err) {
    console.error("Get me error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ===================================================
   UPDATE PROFILE (BIO + AVATAR)
=================================================== */
router.patch("/me", auth, upload.single("avatar"), async (req, res) => {
  try {
    const updates = {};
    if (req.body.bio !== undefined) updates.bio = req.body.bio;

    if (req.file) {
      const uploadResult = await cloudinary.uploader.upload(
        `data:${req.file.mimetype};base64,${req.file.buffer.toString(
          "base64"
        )}`,
        {
          folder: "instaclone/avatars",
          transformation: [{ width: 400, height: 400, crop: "fill" }],
        }
      );
      updates.avatarUrl = uploadResult.secure_url;
    }

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
    }).select("bio avatarUrl");

    res.json(user);
  } catch (err) {
    console.error("Profile update error:", err);
    res.status(500).json({ message: "Profile update failed" });
  }
});

/* ===================================================
   GET ALL USERS (DM LIST)
=================================================== */
router.get("/all", auth, async (req, res) => {
  try {
    const users = await User.find({
      _id: { $ne: req.user._id },
    }).select("_id username avatarUrl");

    res.json({ users });
  } catch (err) {
    console.error("Get users error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ===================================================
   GET USER PROFILE BY USERNAME
=================================================== */
router.get("/:username", auth, async (req, res) => {
  try {
    const profileUser = await User.findOne({
      username: req.params.username,
    }).select("-password");

    if (!profileUser)
      return res.status(404).json({ message: "User not found" });

    const postCount = await Post.countDocuments({
      author: profileUser._id,
    });

    const isMe = profileUser._id.equals(req.user._id);
    const isFollowing = profileUser.followers.some((id) =>
      id.equals(req.user._id)
    );

    res.json({
      user: profileUser,
      postCount,
      followersCount: profileUser.followers.length,
      followingCount: profileUser.following.length,
      isMe,
      isFollowing,
    });
  } catch (err) {
    console.error("Profile fetch error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ===================================================
   FOLLOW / UNFOLLOW USER + NOTIFICATION
=================================================== */
router.post("/:id/follow", auth, async (req, res) => {
  try {
    const targetId = req.params.id;

    if (targetId === req.user._id.toString()) {
      return res.status(400).json({ message: "Cannot follow yourself" });
    }

    const me = await User.findById(req.user._id);
    const target = await User.findById(targetId);

    if (!target) return res.status(404).json({ message: "User not found" });

    const alreadyFollowing = me.following.some((id) => id.equals(target._id));

    if (alreadyFollowing) {
      // UNFOLLOW
      me.following.pull(target._id);
      target.followers.pull(req.user._id);
    } else {
      // FOLLOW
      me.following.push(target._id);
      target.followers.push(req.user._id);

      // CREATE NOTIFICATION
      const notif = await Notification.create({
        receiver: target._id,
        sender: req.user._id,
        type: "follow",
      });

      // REAL-TIME EMIT
      const io = req.app.get("io");
      const onlineUsers = req.app.get("onlineUsers");
      const socketId = onlineUsers?.get(target._id.toString());

      if (io && socketId) {
        const populatedNotif = await notif.populate(
          "sender",
          "username avatarUrl"
        );
        io.to(socketId).emit("notify", populatedNotif);
      }
    }

    await me.save();
    await target.save();

    res.json({ following: !alreadyFollowing });
  } catch (err) {
    console.error("Follow error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
