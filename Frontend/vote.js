const API_URL = "https://ranked-voting-app.onrender.com"; // backend URL
const form = document.getElementById("votingForm");
const container = document.getElementById("rankingContainer");
const numRanks = 14;

let candidates = [];

// Read single-use link from URL (optional, can skip if not needed)
// const urlParams = new URLSearchParams(window.location.search);
// const linkID = urlParams.get("link");

// Load candidates and create dropdowns/cards
async function loadCandidates() {
  try {
    const res = await fetch(`${API_URL}/api/candidates`);
    candidates = await res.json();
    renderCards();
  } catch (err) {
    console.error("Failed to load candidates:", err);
  }
}

function renderCards() {
  container.innerHTML = "";
  const candidateContainer = document.getElementById("candidate-list");
  candidateContainer.innerHTML = "";

  // Initialize ranked array
  const ranked = Array(numRanks).fill(null);

  // Create ranked slots
  for (let i = 0; i < numRanks; i++) {
    const slot = document.createElement("div");
    slot.className = "rank-card";
    slot.textContent = `Rank ${i + 1}`;
    slot.dataset.index = i;

    // Click to remove
    slot.addEventListener("click", () => {
      if (ranked[i]) {
        ranked[i] = null;
        slot.textContent = `Rank ${i + 1}`;
        renderCandidatePool();
      }
    });

    // Drag-over/drop
    slot.addEventListener("dragover", e => e.preventDefault());
    slot.addEventListener("drop", e => {
      e.preventDefault();
      const draggedName = e.dataTransfer.getData("text/plain");
      if (!draggedName) return;

      const prev = ranked[i];
      ranked[i] = draggedName;
      slot.textContent = draggedName;
      renderCandidatePool();

      if (prev) {
        // Return previous to candidate pool
        renderCandidatePool();
      }
    });

    container.appendChild(slot);
  }

  // Candidate pool
  function renderCandidatePool() {
    candidateContainer.innerHTML = "";
    candidates.forEach(name => {
      if (!ranked.includes(name)) {
        const card = document.createElement("div");
        card.className = "candidate-card";
        card.textContent = name;
        card.setAttribute("draggable", "true");

        card.addEventListener("dragstart", e => {
          e.dataTransfer.setData("text/plain", name);
          card.classList.add("dragging");
        });

        card.addEventListener("dragend", () => {
          card.classList.remove("dragging");
        });

        candidateContainer.appendChild(card);
      }
    });
  }

  renderCandidatePool();

  // Submit
  form.addEventListener("submit", async e => {
    e.preventDefault();
    if (ranked.includes(null)) return alert("Fill all 14 ranks!");

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
}

loadCandidates();
