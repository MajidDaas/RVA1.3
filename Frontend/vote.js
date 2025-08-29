const API_URL = "https://ranked-voting-app.onrender.com";
const topRanksContainer = document.getElementById("top-ranks");
const candidateListContainer = document.getElementById("candidate-list");
const submitBtn = document.getElementById("submit-vote");

let candidates = [];
let topRanks = Array(14).fill(null);
let draggedName = null;
let draggedFrom = null;
let touchStartX = 0, touchStartY = 0;
const TAP_THRESHOLD = 10; // pixels

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
    card.draggable = !!candidate;

    // Desktop drag
    card.addEventListener("dragstart", () => {
      draggedName = candidate;
      draggedFrom = "rank";
    });
    card.addEventListener("dragover", e => e.preventDefault());
    card.addEventListener("drop", () => dropToRank(idx));

    // Mobile touch
    card.addEventListener("touchstart", e => {
      if (!candidate) return;
      const touch = e.touches[0];
      touchStartX = touch.clientX;
      touchStartY = touch.clientY;
      draggedName = candidate;
      draggedFrom = "rank";
    });

    card.addEventListener("touchmove", e => {
      // Prevent scrolling during drag
      e.preventDefault();
    }, { passive: false });

    card.addEventListener("touchend", e => {
      const touch = e.changedTouches[0];
      const dx = Math.abs(touch.clientX - touchStartX);
      const dy = Math.abs(touch.clientY - touchStartY);
      if (dx < TAP_THRESHOLD && dy < TAP_THRESHOLD) {
        // Tap = remove
        removeFromRank(idx);
      } else {
        // Drag ended on this card = swap
        dropToRank(idx);
      }
      draggedName = null;
      draggedFrom = null;
    });

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
      card.addEventListener("dragstart", () => {
        draggedName = name;
        draggedFrom = "list";
      });

      // Mobile touch
      card.addEventListener("touchstart", e => {
        const touch = e.touches[0];
        touchStartX = touch.clientX;
        touchStartY = touch.clientY;
        draggedName = name;
        draggedFrom = "list";
      });

      card.addEventListener("touchmove", e => e.preventDefault(), { passive: false });

      card.addEventListener("touchend", e => {
        const touch = e.changedTouches[0];
        const dx = Math.abs(touch.clientX - touchStartX);
        const dy = Math.abs(touch.clientY - touchStartY);
        if (dx < TAP_THRESHOLD && dy < TAP_THRESHOLD) {
          assignToFirstEmpty(name);
        } else {
          assignToFirstEmpty(name); // drop gesture
        }
        draggedName = null;
        draggedFrom = null;
      });

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

  if (draggedFrom === "rank" && prevIdx !== -1) {
    topRanks[prevIdx] = null;
  }

  if (existing && existing !== draggedName) {
    if (draggedFrom === "rank") {
      topRanks[prevIdx] = existing;
    }
  }

  topRanks[idx] = draggedName;
  renderTopRanks();
  renderCandidates();
}

// Assign to first empty rank
function assignToFirstEmpty(name = draggedName) {
  if (!name) return;
  const firstEmpty = topRanks.findIndex(c => c === null);
  if (firstEmpty === -1) return alert("All 14 ranks filled!");
  topRanks[firstEmpty] = name;
  renderTopRanks();
  renderCandidates();
}

// Remove from rank
function removeFromRank(idx) {
  if (!topRanks[idx]) return;
  topRanks[idx] = null;
  renderTopRanks();
  renderCandidates();
}

// Submit vote
submitBtn.onclick = async () => {
  if (topRanks.includes(null)) return alert("Please rank all 14 candidates!");
  try {
    const res = await fetch(`${API_URL}/api/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ballot: topRanks, linkID: null }) // insert your link logic
    });
    const data = await res.json();
    alert(data.message || data.error);
  } catch (err) {
    alert("Failed to submit vote: " + err.message);
  }
};

loadCandidates();
