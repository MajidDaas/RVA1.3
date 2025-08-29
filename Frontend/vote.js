const API_URL = "https://ranked-voting-app.onrender.com"; // backend URL
const form = document.getElementById("votingForm");
const candidateContainer = document.getElementById("candidate-list");
const rankingContainer = document.getElementById("rankingContainer");
const NUM_RANKS = 14;

let candidates = [];
let ranked = Array(NUM_RANKS).fill(null);

// --- Load candidates from backend ---
async function loadCandidates() {
  try {
    const res = await fetch(`${API_URL}/api/candidates`);
    if (!res.ok) throw new Error("Failed to load candidates");
    candidates = await res.json();
    renderCandidatePool();
    renderRankingCards();
  } catch (err) {
    console.error(err);
    alert("Could not load candidates from server");
  }
}

// --- Render candidate cards in the pool ---
function renderCandidatePool() {
  candidateContainer.innerHTML = "";
  candidates.forEach(name => {
    const card = document.createElement("div");
    card.className = "candidate-card";
    card.textContent = name;
    card.setAttribute("draggable", "true");

    // Drag start
    card.addEventListener("dragstart", e => {
      e.dataTransfer.setData("text/plain", name);
      card.classList.add("dragging");
    });

    card.addEventListener("dragend", e => {
      card.classList.remove("dragging");
    });

    // Tap to add to first empty rank (mobile)
    card.addEventListener("click", () => {
      const idx = ranked.findIndex(r => !r);
      if (idx !== -1) {
        ranked[idx] = name;
        renderRankingCards();
        renderCandidatePool();
      }
    });

    candidateContainer.appendChild(card);
  });
}

// --- Render the 14 ranking slots ---
function renderRankingCards() {
  rankingContainer.innerHTML = "";
  for (let i = 0; i < NUM_RANKS; i++) {
    const slot = document.createElement("div");
    slot.className = "rank-card";
    slot.textContent = ranked[i] || `Rank ${i + 1}`;
    slot.dataset.index = i;

    // Drag over / drop
    slot.addEventListener("dragover", e => e.preventDefault());
    slot.addEventListener("drop", e => {
      e.preventDefault();
      const draggedName = e.dataTransfer.getData("text/plain");
      if (!draggedName) return;

      // Swap if slot already filled
      const prev = ranked[i];
      ranked[i] = draggedName;
      if (prev) {
        // Return previous card to pool
        renderCandidatePool();
      }
      renderRankingCards();
      renderCandidatePool();
    });

    // Tap to remove
    slot.addEventListener("click", () => {
      if (ranked[i]) {
        ranked[i] = null;
        renderRankingCards();
        renderCandidatePool();
      }
    });

    rankingContainer.appendChild(slot);
  }
}

// --- Submit ballot ---
form.addEventListener("submit", async e => {
  e.preventDefault();
  if (ranked.includes(null)) {
    return alert("Please fill all 14 ranks before submitting!");
  }

  try {
    const res = await fetch(`${API_URL}/api/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ballot: ranked })
    });
    const data = await res.json();
    alert(data.message || data.error);
  } catch (err) {
    console.error(err);
    alert("Failed to submit vote");
  }
});

// --- Initialize ---
loadCandidates();
