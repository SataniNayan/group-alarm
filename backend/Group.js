const mongoose = require("mongoose");

module.exports = mongoose.model("Group", {
  name: String,
  admin: String,
  members: [String],
  groupCode: String   // 🔥 THIS MUST EXIST
});
