const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
require("dotenv").config();
const PORT = process.env.PORT || 5000;



const User = require("./User");
const Group = require("./Group");
const Alarm = require("./Alarm");

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("MongoDB Atlas Connected"))
.catch(err => console.error("MongoDB error:", err));

/* LOGIN */
app.post("/api/login", async (req, res) => {
  let user = await User.findOne({ email: req.body.email });
  if (!user) user = await User.create(req.body);
  res.json(user);
});




/* GET GROUPS */
app.get("/api/groups", async (req, res) => {
  const groups = await Group.find({ members: req.query.email });
  res.json(groups); // ✅ sends groupCode also
});

/* CREATE ALARM */
app.post("/api/alarm", async (req, res) => {
  const alarm = await Alarm.create(req.body);
  res.json(alarm);
});

// Serve frontend files
app.use(express.static(path.join(__dirname, "../frontend")));

// Default route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/index.html"));
});


app.listen(3000, () =>
  console.log("Backend running on http://localhost:3000")
);

function generateCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

app.post("/api/group", async (req, res) => {
  const code = generateCode();

  const group = await Group.create({
    name: req.body.name,
    admin: req.body.admin,
    members: [req.body.admin],
    groupCode: code   // 🔥 SAVE CODE
  });

  res.json(group); // 🔥 SEND CODE TO FRONTEND
});

app.post("/api/join-by-code", async (req, res) => {
  const { code, email } = req.body;

  const group = await Group.findOne({ groupCode: code });
  if (!group) {
    return res.status(404).json({ message: "Invalid group code" });
  }

  if (!group.members.includes(email)) {
    group.members.push(email);
    await group.save();
  }

  res.json({ message: "Joined successfully", group });
});

/* GET ALARMS FOR GROUP (CHAT STYLE) */
app.get("/api/alarms", async (req, res) => {
  const alarms = await Alarm.find({ groupId: req.query.groupId })
    .sort({ createdAt: 1 });
  res.json(alarms);
});

app.put("/api/alarm-triggered/:id", async (req, res) => {
  await Alarm.findByIdAndUpdate(req.params.id, { triggered: true });
  res.json({ success: true });
});






