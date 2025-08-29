const ADMIN_USER = "admin";
const ADMIN_PASS = "password"; // replace with strong password
const backendURL = "https://ranked-voting-app.onrender.com";

const loginBtn = document.getElementById("loginBtn");
const loginContainer = document.getElementById("login-container");
const adminPanel = document.getElementById("admin-panel");
const output = document.getElementById("output");

loginBtn.addEventListener("click", () => {
  const user = document.getElementById("adminUser").value;
  const pass = document.getElementById("adminPass").value;

  if (user === ADMIN_USER && pass === ADMIN_PASS) {
    loginContainer.style.display = "none";
    adminPanel.style.display = "block";
  } else {
    alert("Invalid credentials");
  }
});

document.getElementById("loadTokens").addEventListener("click", async () => {
  const res = await fetch(`${backendURL}/api/tokens?admin=${ADMIN_PASS}`);
  const data = await res.json();
  output.textContent = JSON.stringify(data, null, 2);
});

document.getElementById("loadVotes").addEventListener("click", async () => {
  const res = await fetch(`${backendURL}/api/raw-votes?admin=${ADMIN_PASS}`);
  const data = await res.json();
  output.textContent = JSON.stringify(data, null, 2);
});

document.getElementById("loadResults").addEventListener("click", async () => {
  const res = await fetch(`${backendURL}/api/results?admin=${ADMIN_PASS}`);
  const data = await res.json();
  output.textContent = JSON.stringify(data, null, 2);
});

