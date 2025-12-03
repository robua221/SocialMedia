const express = require("express");
const Post = require("../models/Post");
const auth = require("../middleware/auth");

const router = express.Router();

// GET feed posts (optionally filter by authorId)
router.get("/", auth, async (req, res) => {
  try {
    const { authorId } = req.query;
    const query = authorId ? { author: authorId } : {};
    const posts = await Post.find(query)
      .populate("author", "username avatarUrl")
      .populate("comments.author", "username")
      .sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// CREATE post
router.post("/", auth, async (req, res) => {
  try {
    const { imageUrl, caption } = req.body;
    if (!imageUrl)
      return res.status(400).json({ message: "Image URL required" });

    const post = await Post.create({
      author: req.user._id,
      imageUrl,
      caption: caption || "",
    });

    const populated =
      (await post.populate("author", "username avatarUrl").execPopulate?.()) || // older versions
      (await post.populate("author", "username avatarUrl"));

    res.status(201).json(populated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// LIKE / UNLIKE
router.post("/:id/like", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate("author", "username avatarUrl")
      .populate("comments.author", "username");

    if (!post) return res.status(404).json({ message: "Post not found" });

    const userId = req.user._id.toString();
    const hasLiked = post.likes.some((id) => id.toString() === userId);

    if (hasLiked) {
      post.likes = post.likes.filter((id) => id.toString() !== userId);
    } else {
      post.likes.push(req.user._id);
    }

    await post.save();
    res.json(post);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ADD COMMENT
router.post("/:id/comments", auth, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ message: "Text required" });

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    post.comments.push({ author: req.user._id, text });
    await post.save();

    const populated = await Post.findById(post._id)
      .populate("author", "username avatarUrl")
      .populate("comments.author", "username");

    res.status(201).json(populated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});
// GET feed posts
router.get("/", auth, async (req, res) => {
  try {
    const { authorId, followingOnly } = req.query;
    let query = {};

    if (authorId) {
      query.author = authorId;
    } else if (followingOnly === "true") {
      const me = await User.findById(req.user._id).select("following");
      const ids = [...me.following, req.user._id];
      query.author = { $in: ids };
    }

    const posts = await Post.find(query)
      .populate("author", "username avatarUrl")
      .populate("comments.author", "username")
      .sort({ createdAt: -1 });

    res.json(posts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
