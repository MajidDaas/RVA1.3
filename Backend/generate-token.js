const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");

const tokensFile = path.join(__dirname, "tokens.json");
const FRONTEND_BASE_URL = process.env.FRONTEND_BASE_URL || "https://rankedvotingapp.netlify.app";

const readJSON = (f, fb=[]) => (fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, "utf8")) : fb);
const writeJSON = (f, d) => fs.writeFileSync(f, JSON.stringify(d, null, 2));

const tokens = readJSON(tokensFile, []);
const id = uuidv4();
tokens.push({ id, used: false, createdAt: Date.now() });
writeJSON(tokensFile, tokens);

const link = `${FRONTEND_BASE_URL}/?token=${id}`;
console.log("New token:", id);
console.log("Voting link:", link);

