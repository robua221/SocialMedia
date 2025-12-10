const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema(
  {
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    text: { type: String, required: true },
    seen: { type: Boolean, default: false },
    delivered: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Message", MessageSchema);
