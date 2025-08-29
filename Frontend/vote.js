const API_URL = "https://ranked-voting-app.onrender.com"; 
const topRanksContainer = document.getElementById("top-ranks");
const candidateListContainer = document.getElementById("candidate-list");
const submitBtn = document.getElementById("submit-vote");

let candidates = [];
let topRanks = Array(14).fill(null);
let draggedName = null;

// Load candidates
async function loadCandidates() {
  const res = await fetch(`${API_URL}/api/candidates`);
  candidates = await res.json();
  renderCandidates();
  renderTopRanks();
}

// Render top ranks
function renderTopRanks() {
  topRanksContainer.innerHTML = "";
  topRanks.forEach((candidate, idx) => {
    const card = document.createElement("div");
    card.className = "rank-card" + (candidate ? " filled" : "");
    card.textContent = candidate ? candidate : `Rank ${idx + 1}`;

    // Desktop drag events
    card.draggable = !!candidate;
    card.addEventListener("dragstart", () => { draggedName = candidate; });
    card.addEventListener("dragover", e => e.preventDefault());
    card.addEventListener("drop", () => dropToRank(idx));

    // Mobile touch helpers
    card.addEventListener("touchstart", e => { draggedName = candidate; e.preventDefault(); });
    card.addEventListener("touchend", () => dropToRank(idx));

    card.onclick = () => removeFromRank(idx);
    topRanksContainer.appendChild(card);
  });
}

// Render candidate list
function renderCandidates() {
  candidateListContainer.innerHTML = "";
  candidates.forEach(name => {
    if (!topRanks.includes(name)) {
      const card = document.createElement("div");
      card.className = "candidate-card";
      card.textContent = name;

      card.draggable = true;
      card.addEventListener("dragstart", () => { draggedName = name; });
      card.addEventListener("dragover", e => e.preventDefault());

      // Mobile touch helper
      card.addEventListener("touchstart", e => { draggedName = name; e.preventDefault(); });
      card.addEventListener("touchend", () => assignToRank(name));

      card.onclick = () => assignToRank(name);
      candidateListContainer.appendChild(card);
    }
  });
}

// Drop dragged name into rank (with swap if necessary)
function dropToRank(idx) {
  if (!draggedName) return;

  const existing = topRanks[idx];
  const prevIdx = topRanks.indexOf(draggedName);

  // If dragged from a rank, remove from previous
  if (prevIdx !== -1) topRanks[prevIdx] = null;

  // If target rank has a different candidate, swap
  if (existing && existing !== draggedName) {
    if (prevIdx !== -1) {
      // Swap: put existing candidate into prevIdx
      topRanks[prevIdx] = existing;
    } else {
      // If dragged from candidate list, existing candidate goes back to list automatically
    }
  }

  topRanks[idx] = draggedName;
  draggedName = null;

  renderTopRanks();
  renderCandidates();
}

// Assign candidate to first empty rank
function assignToRank(name) {
  const firstEmpty = topRanks.findIndex(c => c === null);
  if (firstEmpty === -1) return alert("All 14 ranks filled!");
  topRanks[firstEmpty] = name;
  renderTopRanks();
  renderCandidates();
}

// Remove candidate from rank
function removeFromRank(idx) {
  if (!topRanks[idx]) return;
  topRanks[idx] = null;
  renderTopRanks();
  renderCandidates();
}

// Submit vote
submitBtn.onclick = async () => {
  if (topRanks.includes(null)) return alert("Please rank all 14 candidates!");
  console.log("Ballot:", topRanks);
  alert("Ballot submitted (demo). Check console for details.");
};

loadCandidates();
