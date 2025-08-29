const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const helmet = require("helmet");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");

const app = express();
const PORT = process.env.PORT || 3000;

// ======== ENV ========
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "https://rankedvotingapp.netlify.app";
const ADMIN_USER = process.env.ADMIN_USER || "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "supersecret";
const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || "dev_jwt_secret";
const FRONTEND_BASE_URL = process.env.FRONTEND_BASE_URL || "https://rankedvotingapp.netlify.app";

// ======== MIDDLEWARE ========
app.use(helmet());
app.use(cors({ origin: FRONTEND_ORIGIN }));
app.use(bodyParser.json({ limit: "1mb" }));

// ======== FILES ========
const dataDir = __dirname;
const votesFile = path.join(dataDir, "votes.json");
const tokensFile = path.join(dataDir, "tokens.json");
const candidatesFile = path.join(dataDir, "candidates.json");

const readJSON = (file, fallback = []) => (fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : fallback);
const writeJSON = (file, data) => fs.writeFileSync(file, JSON.stringify(data, null, 2));

// ======== ADMIN AUTH ========
function makeToken(payload) {
  return jwt.sign(payload, ADMIN_JWT_SECRET, { expiresIn: "12h" });
}
function requireAdmin(req, res, next) {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Missing Authorization token" });
  try {
    jwt.verify(token, ADMIN_JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: "Invalid/expired token" });
  }
}

// ======== HEALTH ========
app.get("/api/health", (_req, res) => res.json({ ok: true }));

// ======== PUBLIC ========
app.get("/api/candidates", (_req, res) => {
  res.json(readJSON(candidatesFile, []));
});

app.post("/api/vote", (req, res) => {
  const { ballot, token } = req.body;

  if (!token) return res.status(400).json({ error: "Missing voting token" });

  const tokens = readJSON(tokensFile, []);
  const tok = tokens.find(t => t.id === token);
  if (!tok) return res.status(403).json({ error: "Invalid token" });
  if (tok.used) return res.status(403).json({ error: "Token already used" });

  // Validate ballot
  const candidates = readJSON(candidatesFile, []);
  if (!Array.isArray(ballot) || ballot.length !== 14) {
    return res.status(400).json({ error: "Ballot must contain exactly 14 rankings" });
  }
  const unique = new Set(ballot);
  if (unique.size !== ballot.length) return res.status(400).json({ error: "No duplicate candidates allowed" });
  for (const name of ballot) {
    if (!candidates.includes(name)) return res.status(400).json({ error: `Unknown candidate: ${name}` });
  }

  // Save vote
  const votes = readJSON(votesFile, []);
  votes.push({ ballot, timestamp: Date.now(), token });
  writeJSON(votesFile, votes);

  // Mark token used
  tok.used = true;
  tok.usedAt = Date.now();
  writeJSON(tokensFile, tokens);

  res.json({ message: "Vote recorded successfully" });
});

// ======== ADMIN: LOGIN ========
app.post("/api/admin/login", (req, res) => {
  const { username, password } = req.body || {};
  if (username === ADMIN_USER && password === ADMIN_PASSWORD) {
    return res.json({ token: makeToken({ u: ADMIN_USER }) });
  }
  return res.status(403).json({ error: "Invalid credentials" });
});

// ======== ADMIN: TOKENS ========
app.get("/api/admin/tokens", requireAdmin, (_req, res) => {
  res.json(readJSON(tokensFile, []));
});

app.post("/api/admin/generate-link", requireAdmin, (req, res) => {
  const tokens = readJSON(tokensFile, []);
  const id = uuidv4();
  const entry = { id, used: false, createdAt: Date.now() };
  tokens.push(entry);
  writeJSON(tokensFile, tokens);
  const link = `${FRONTEND_BASE_URL}/?token=${id}`;
  res.json({ id, link });
});

app.get("/api/admin/tokens.csv", requireAdmin, (_req, res) => {
  const tokens = readJSON(tokensFile, []);
  const rows = ["id,used,createdAt,usedAt,link"];
  for (const t of tokens) {
    const link = `${FRONTEND_BASE_URL}/?token=${t.id}`;
    rows.push([t.id, t.used, t.createdAt || "", t.usedAt || "", link].join(","));
  }
  res.setHeader("Content-Type", "text/csv");
  res.send(rows.join("\n"));
});

// ======== ADMIN: VOTES / RESULTS ========
app.get("/api/admin/raw-votes", requireAdmin, (_req, res) => {
  res.json(readJSON(votesFile, []));
});

// Simple iterative selection: elect top and eliminate bottom until 14 winners
app.get("/api/admin/results", requireAdmin, (_req, res) => {
  const candidates = readJSON(candidatesFile, []);
  const votes = readJSON(votesFile, []);
  let elected = [];
  let eliminated = [];

  const countFirstChoices = () => {
    const tally = {};
    candidates.forEach(c => {
      if (!elected.includes(c) && !eliminated.includes(c)) tally[c] = 0;
    });
    votes.forEach(v => {
      for (const choice of v.ballot) {
        if (!elected.includes(choice) && !eliminated.includes(choice)) {
          tally[choice] = (tally[choice] || 0) + 1;
          break;
        }
      }
    });
    return tally;
  };

  while (elected.length < 14 && elected.length + eliminated.length < candidates.length) {
    const tally = countFirstChoices();
    const entries = Object.entries(tally);
    if (!entries.length) break;
    const top = entries.reduce((a, b) => (a[1] >= b[1] ? a : b));
    const bottom = entries.reduce((a, b) => (a[1] <= b[1] ? a : b));
    if (!elected.includes(top[0])) elected.push(top[0]);
    if (!eliminated.includes(bottom[0]) && bottom[0] !== top[0]) eliminated.push(bottom[0]);
  }

  res.json({ winners: elected.slice(0, 14) });
});

app.listen(PORT, () => console.log(`✅ Backend listening on ${PORT}`));

