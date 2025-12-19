const express = require("express");
const User = require("../models/User");
const Post = require("../models/Post");
const auth = require("../middleware/auth");
const Notification = require("../models/Notification");

const router = express.Router();

/* ---------------------------------------------------------
   GET ALL USERS (FOR DM LIST)
--------------------------------------------------------- */
router.get("/all", auth, async (req, res) => {
  try {
    const users = await User.find({
      _id: { $ne: req.user._id },
    }).select("_id username avatarUrl");

    res.json({ users });
  } catch (err) {
    console.error("Error fetching all users:", err);
    res.status(500).json({ message: "Server error fetching users" });
  }
});

/* ---------------------------------------------------------
   CURRENT USER PROFILE
--------------------------------------------------------- */
router.get("/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    const postCount = await Post.countDocuments({ author: req.user._id });

    res.json({
      user,
      postCount,
      followersCount: user.followers.length,
      followingCount: user.following.length,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ---------------------------------------------------------
   USER PROFILE BY USERNAME
--------------------------------------------------------- */
router.get("/:username", auth, async (req, res) => {
  try {
    const profileUser = await User.findOne({
      username: req.params.username,
    }).select("-password");

    if (!profileUser)
      return res.status(404).json({ message: "User not found" });

    const postCount = await Post.countDocuments({ author: profileUser._id });

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
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ---------------------------------------------------------
   FOLLOW / UNFOLLOW USER + NOTIFICATION
--------------------------------------------------------- */
router.post("/:id/follow", auth, async (req, res) => {
  try {
    const targetId = req.params.id;

    if (targetId === req.user._id.toString()) {
      return res.status(400).json({ message: "Cannot follow yourself" });
    }

    const me = await User.findById(req.user._id);
    const target = await User.findById(targetId);

    if (!target) return res.status(404).json({ message: "User not found" });

    const alreadyFollowing = me.following.some((id) => id.equals(targetId));

    if (alreadyFollowing) {
      // UNFOLLOW
      me.following.pull(targetId);
      target.followers.pull(req.user._id);
    } else {
      // FOLLOW
      me.following.push(targetId);
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
      const receiverSocketId = onlineUsers?.get(target._id.toString());

      if (io && receiverSocketId) {
        const populatedNotif = await notif.populate(
          "sender",
          "username avatarUrl"
        );
        io.to(receiverSocketId).emit("notify", populatedNotif);
      }
    }

    await me.save();
    await target.save();

    res.json({ success: true, following: !alreadyFollowing });
  } catch (err) {
    console.error("Follow error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
