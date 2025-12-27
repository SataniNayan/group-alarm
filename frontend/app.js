const API = "http://localhost:3000/api";

/* LOGIN */
function login() {
  fetch(API + "/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: emailInput.value,
      password: passwordInput.value
    })
  }).then(() => {
    localStorage.setItem("email", emailInput.value.trim());
    location.href = "home.html";
  });
}



/* CREATE GROUP */
function createGroup() {
  const name = prompt("Group name");
  fetch(API + "/group", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name,
      admin: localStorage.getItem("email"),
      members: [localStorage.getItem("email")]
    })
  }).then(loadGroups);
}

/* LOAD GROUPS */
function loadGroups() {
  fetch(API + "/groups?email=" + localStorage.getItem("email"))
    .then(res => res.json())
    .then(groups => {
      const groupsDiv = document.getElementById("groupsDiv");
      groupsDiv.innerHTML = "";

      groups.forEach(g => {
        const div = document.createElement("div");
        div.className = "group-item"; // 🔥 THIS LINE IS CRITICAL

        div.innerHTML = `
          <div class="group-icon">
            ${g.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <strong>${g.name}</strong><br>
            <small>Tap to open</small>
          </div>
        `;

        div.onclick = () => {
          localStorage.setItem("groupId", g._id);
          localStorage.setItem("groupCode", g.groupCode);
          localStorage.setItem("groupName", g.name); 
          location.href = "group.html";
        };

        groupsDiv.appendChild(div);
      });
    });
}



/* SET ALARM */
function setAlarm() {
  fetch(API + "/alarm", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      groupId: localStorage.getItem("groupId"),
      time: alarmTime.value,
      message: alarmMessage.value,
      mode: alarmMode.value,
      triggered: false
    })
  }).then(() => alert("Alarm shared"));
}

function openGroup(group) {
  localStorage.setItem("groupId", group._id);
  localStorage.setItem("groupCode", group.groupCode);
  location.href = "group.html";
}









function joinGroup() {
  const code = prompt("Enter Group Code");
  if (!code) return;

  fetch(API + "/join-by-code", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      code: code.toUpperCase(),
      email: localStorage.getItem("email")
    })
  })
    .then(res => res.json())
    .then(data => {
      alert(data.message);
      loadGroups();
    });
}


function loadChat() {
  const myEmail = localStorage.getItem("email");


  document.getElementById("groupName").innerText =
    localStorage.getItem("groupName");

  document.getElementById("groupIcon").innerText =
    localStorage.getItem("groupName").charAt(0).toUpperCase();

  document.getElementById("groupCode").innerText =
    localStorage.getItem("groupCode");

  fetch(API + "/alarms?groupId=" + localStorage.getItem("groupId"))
    .then(res => res.json())
    .then(alarms => {
      const chatBox = document.getElementById("chatBox");
      chatBox.innerHTML = "";

      alarms.forEach(a => {
        const div = document.createElement("div");

        const isMe = a.sender === myEmail;
        div.className = "message " + (isMe ? "me" : "other");

        const sentTime = new Date(a.createdAt).toLocaleString();
        const alarmTime = new Date(a.time).toLocaleString(); 

        const modeIcon =
          a.mode === "ring" ? "🔔" :
          a.mode === "vibrate" ? "📳" : "🔕";

        div.innerHTML = `
          <div class="sender">${isMe ? "You" : a.sender}</div>
          <div class="msg-text">${a.message}</div>
          <div class="msg-time">⏰ Alarm: ${alarmTime}</div>
          <div class="msg-time">🕒 Sent: ${sentTime}</div>
          <div class="msg-mode">${modeIcon}</div>
        `;

        chatBox.appendChild(div);
      });

      chatBox.scrollTop = chatBox.scrollHeight;
    })
    .catch(err => console.error("Load chat error:", err));
}
let soundUnlocked = false;

function unlockSound() {
  const sound = document.getElementById("alarmSound");

  sound.muted = true;
  sound.play().then(() => {
    sound.pause();
    sound.currentTime = 0;
    sound.muted = false;
    soundUnlocked = true;
    alert("✅ Sound enabled");
  }).catch(() => {
    alert("❌ Click again");
  });
}


setInterval(() => {
  fetch(API + "/alarms?groupId=" + localStorage.getItem("groupId"))
    .then(res => res.json())
    .then(alarms => {
      const now = new Date();

      alarms.forEach(alarm => {
        if (alarm.triggered) return; // 🔥 STOP REPEAT

        const alarmTime = new Date(alarm.time);

        if (Math.abs(now - alarmTime) < 30000) {
          triggerAlarm(alarm);
        }
      });
    });
}, 15000);



function sendAlarm() {
  const time = document.getElementById("alarmTime").value;
  const message = document.getElementById("messageInput").value;
  const mode = document.getElementById("alarmMode").value;
  

  if (!time || !message) {
    alert("Please set time and message");
    return;
  }

  fetch(API + "/alarm", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
  groupId: localStorage.getItem("groupId"),
  sender: localStorage.getItem("email"),
  time,
  message,
  mode
})

  })
  .then(res => res.json())
  .then(() => {
    document.getElementById("messageInput").value = "";
    loadChat();   // 🔥 THIS IS THE KEY LINE
  })
  .catch(err => console.error(err));
}


function triggerAlarm(alarm) {
  const sound = document.getElementById("alarmSound");

  if (alarm.mode === "ring") {
  if (!soundUnlocked) {
    alert("Enable sound first 🔊");
    return;
  }

  sound.loop = true;
  sound.play();
}


  if (alarm.mode === "vibrate") {
    if (navigator.vibrate) {
      navigator.vibrate([500, 300, 500, 300, 500]);
      alert("📳 Alarm vibration");
    } else {
      alert("Vibration not supported on this device");
    }
  }

  if (alarm.mode === "silent") {
    alert("🔕 Silent alarm");
  }

  // Mark alarm as triggered
  fetch(API + "/alarm-triggered/" + alarm._id, { method: "PUT" });
}













