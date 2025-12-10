const express = require("express");
const Message = require("../models/Message");
const User = require("../models/User");
const auth = require("../middleware/auth");

const router = express.Router();

/* ----------------------------------------------------------
   GET ALL USERS EXCEPT CURRENT USER
---------------------------------------------------------- */
router.get("/all", auth, async (req, res) => {
  try {
    const users = await User.find({
      _id: { $ne: req.user._id },
    }).select("_id username avatarUrl");

    res.json({ users });
  } catch (err) {
    console.error("User list error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ----------------------------------------------------------
   GET CHAT HISTORY WITH A SPECIFIC USER
---------------------------------------------------------- */
router.get("/:id", auth, async (req, res) => {
  try {
    const otherUserId = req.params.id;
    const myId = req.user._id;

    const messages = await Message.find({
      $or: [
        { sender: myId, receiver: otherUserId },
        { sender: otherUserId, receiver: myId },
      ],
    })
      .populate("sender", "_id username avatarUrl")
      .populate("receiver", "_id username avatarUrl")
      .sort({ createdAt: 1 });

    res.json({ messages });
  } catch (err) {
    console.error("Chat fetch error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ----------------------------------------------------------
   MARK MESSAGES AS SEEN
---------------------------------------------------------- */
router.post("/mark-seen/:id", auth, async (req, res) => {
  try {
    await Message.updateMany(
      {
        sender: req.params.id,
        receiver: req.user._id,
        seen: false,
      },
      { seen: true }
    );

    res.json({ success: true });
  } catch (err) {
    console.error("Seen update error:", err);
    res.status(500).json({ message: "Server error" });
  }
});
router.post("/send", auth, async (req, res) => {
  try {
    const { receiverId, text } = req.body;

    const msg = await Message.create({
      sender: req.user._id,
      receiver: receiverId,
      text,
    });

    const populated = await msg.populate(
      "sender receiver",
      "_id username avatarUrl"
    );

    res.json({ message: populated });
  } catch (err) {
    console.error("Send message error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
