const mongoose = require("mongoose");

module.exports = mongoose.model("Alarm", {
  groupId: String,
  sender: String,
  time: String,
  message: String,
  mode: String,
  triggered: { type: Boolean, default: false }, // 🔥 ADD THIS
  createdAt: { type: Date, default: Date.now }
});

