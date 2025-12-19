const express = require("express");
const Notification = require("../models/Notification");
const auth = require("../middleware/auth");

const router = express.Router();

/* ---------------------------------------------------------
   GET NOTIFICATIONS FOR LOGGED-IN USER
--------------------------------------------------------- */
router.get("/", auth, async (req, res) => {
  try {
    const notifications = await Notification.find({
      receiver: req.user._id,
    })
      .populate("sender", "username avatarUrl")
      .populate("post", "imageUrl")
      .sort({ createdAt: -1 })
      .limit(50);

    // IMPORTANT: wrap in object
    res.json({ notifications });
  } catch (err) {
    console.error("Fetch notifications error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ---------------------------------------------------------
   MARK ALL NOTIFICATIONS AS READ
--------------------------------------------------------- */
router.post("/mark-all-read", auth, async (req, res) => {
  try {
    await Notification.updateMany(
      { receiver: req.user._id, isRead: false },
      { isRead: true }
    );

    res.json({ success: true });
  } catch (err) {
    console.error("Mark notifications read error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
