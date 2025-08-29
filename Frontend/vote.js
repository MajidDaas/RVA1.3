const API_URL = "https://ranked-voting-app.onrender.com";
const topRanksContainer = document.getElementById("top-ranks");
const candidateListContainer = document.getElementById("candidate-list");
const submitBtn = document.getElementById("submit-vote");

let candidates = [];
let topRanks = Array(14).fill(null);
let draggedName = null;
let draggedFrom = null; // 'rank' or 'list'

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
    card.addEventListener("dragstart", () => {
      draggedName = candidate;
      draggedFrom = "rank";
    });
    card.addEventListener("dragover", e => e.preventDefault());
    card.addEventListener("drop", () => dropToRank(idx));

    // Mobile touch events
    card.addEventListener("touchstart", e => {
      draggedName = candidate;
      draggedFrom = "rank";
      e.preventDefault();
    });
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

      // Desktop drag
      card.draggable = true;
      card.addEventListener("dragstart", () => {
        draggedName = name;
        draggedFrom = "list";
      });

      card.addEventListener("dragover", e => e.preventDefault());

      // Mobile touch
      card.addEventListener("touchstart", e => {
        draggedName = name;
        draggedFrom = "list";
        e.preventDefault();
      });
      card.addEventListener("touchend", () => assignToFirstEmpty());

      card.onclick = () => assignToFirstEmpty(name);
      candidateListContainer.appendChild(card);
    }
  });
}

// Drop logic with swap
function dropToRank(idx) {
  if (!draggedName) return;

  const existing = topRanks[idx];
  const prevIdx = topRanks.indexOf(draggedName);

  // Remove dragged candidate from previous rank if any
  if (draggedFrom === "rank" && prevIdx !== -1) {
    topRanks[prevIdx] = null;
  }

  // Swap if target rank has a different candidate
  if (existing && existing !== draggedName) {
    if (draggedFrom === "rank") {
      topRanks[prevIdx] = existing;
    }
  }

  topRanks[idx] = draggedName;
  draggedName = null;
  draggedFrom = null;

  renderTopRanks();
  renderCandidates();
}

// Assign to first empty rank
function assignToFirstEmpty(name = draggedName) {
  if (!name) return;
  const firstEmpty = topRanks.findIndex(c => c === null);
  if (firstEmpty === -1) return alert("All 14 ranks filled!");
  topRanks[firstEmpty] = name;
  draggedName = null;
  draggedFrom = null;
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
