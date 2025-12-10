const express = require("express");
const User = require("../models/User");
const Post = require("../models/Post");
const auth = require("../middleware/auth");
const Notification = require("../models/Notification");

const router = express.Router();

/* ---------------------------------------------------------
   NEW ROUTE — Return all users for DM list
--------------------------------------------------------- */
router.get("/all", auth, async (req, res) => {
  try {
    const users = await User.find().select("_id username avatarUrl");
    res.json({ users });
  } catch (err) {
    console.error("Error fetching all users:", err);
    res.status(500).json({ message: "Server error fetching users" });
  }
});

/* ---------------------------------------------------------
   GET CURRENT USER PROFILE
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

router.get("/:username", auth, async (req, res) => {
  try {
    const profileUser = await User.findOne({
      username: req.params.username,
    }).select("-password");

    if (!profileUser)
      return res.status(404).json({ message: "User not found" });

    const postCount = await Post.countDocuments({ author: profileUser._id });

    const isMe = profileUser._id.toString() === req.user._id.toString();
    const isFollowing = profileUser.followers.some(
      (id) => id.toString() === req.user._id.toString()
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
   FOLLOW / UNFOLLOW USER
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

    const alreadyFollowing = me.following.some(
      (id) => id.toString() === targetId
    );

    if (alreadyFollowing) {
      // UNFOLLOW
      me.following = me.following.filter((id) => id.toString() !== targetId);
      target.followers = target.followers.filter(
        (id) => id.toString() !== req.user._id.toString()
      );
    } else {
      // FOLLOW
      me.following.push(targetId);
      target.followers.push(req.user._id);

      // Create notification
      const notif = await Notification.create({
        receiver: target._id,
        sender: req.user._id,
        type: "follow",
      });

      // Emit to online user
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
