const express = require("express");
const User = require("../models/User");
const Post = require("../models/Post");
const auth = require("../middleware/auth");

const router = express.Router();

// Search users + captions + hashtags
router.get("/", auth, async (req, res) => {
  try {
    const q = req.query.q?.trim();

    if (!q) return res.json({ users: [], posts: [] });

    const regex = new RegExp(q, "i"); // case-insensitive

    // 1) Search users by username
    const users = await User.find({
      username: { $regex: regex },
    })
      .select("username avatarUrl followers following")
      .limit(10);

    // 2) Search posts by caption
    const posts = await Post.find({
      caption: { $regex: regex },
    })
      .populate("author", "username avatarUrl")
      .limit(20);

    res.json({ users, posts });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Search failed" });
  }
});

module.exports = router;
