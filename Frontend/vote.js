const API_URL = "https://ranked-voting-app.onrender.com";
const topRanksContainer = document.getElementById("top-ranks");
const candidateListContainer = document.getElementById("candidate-list");
const submitBtn = document.getElementById("submit-vote");

let candidates = [];
let topRanks = Array(14).fill(null);
let draggedName = null;
let draggedFrom = null;
let draggingElem = null;
let touchOffsetX = 0, touchOffsetY = 0;

// Get token from URL query parameter
function getVotingToken() {
  const params = new URLSearchParams(window.location.search);
  return params.get("token"); 
}

async function loadCandidates() {
  const res = await fetch(`${API_URL}/api/candidates`);
  candidates = await res.json();
  renderCandidates();
  renderTopRanks();
}

function renderTopRanks() {
  topRanksContainer.innerHTML = "";
  topRanks.forEach((candidate, idx) => {
    const card = document.createElement("div");
    card.className = "rank-card" + (candidate ? " filled" : "");
    card.textContent = candidate || `Rank ${idx + 1}`;

    // Desktop drag
    card.draggable = !!candidate;
    card.addEventListener("dragstart", e => {
      draggedName = candidate;
      draggedFrom = "rank";
    });
    card.addEventListener("dragover", e => e.preventDefault());
    card.addEventListener("drop", () => dropToRank(idx));

    // Mobile touch
    card.addEventListener("touchstart", e => {
      if (!candidate) return;
      draggedName = candidate;
      draggedFrom = "rank";
      draggingElem = card.cloneNode(true);
      draggingElem.style.position = "absolute";
      draggingElem.style.pointerEvents = "none";
      draggingElem.style.zIndex = "1000";
      document.body.appendChild(draggingElem);

      const touch = e.touches[0];
      touchOffsetX = touch.clientX - card.getBoundingClientRect().left;
      touchOffsetY = touch.clientY - card.getBoundingClientRect().top;
      moveDraggingElem(touch);
    });

    card.addEventListener("touchmove", e => {
      if (!draggingElem) return;
      e.preventDefault();
      moveDraggingElem(e.touches[0]);
    }, { passive: false });

    card.addEventListener("touchend", e => {
      if (!draggingElem) return;
      const touch = e.changedTouches[0];
      const dropTarget = document.elementFromPoint(touch.clientX, touch.clientY);
      const rankCards = Array.from(topRanksContainer.children);
      const rankIdx = rankCards.indexOf(dropTarget.closest(".rank-card"));

      if (rankIdx !== -1) {
        dropToRank(rankIdx);
      }
      draggingElem.remove();
      draggedName = null;
      draggedFrom = null;
      draggingElem = null;
    });

    topRanksContainer.appendChild(card);
  });
}

function renderCandidates() {
  candidateListContainer.innerHTML = "";
  candidates.forEach(name => {
    if (!topRanks.includes(name)) {
      const card = document.createElement("div");
      card.className = "candidate-card";
      card.textContent = name;

      // Desktop drag
      card.draggable = true;
      card.addEventListener("dragstart", e => {
        draggedName = name;
        draggedFrom = "list";
      });

      // Mobile touch
      card.addEventListener("touchstart", e => {
        draggedName = name;
        draggedFrom = "list";
        draggingElem = card.cloneNode(true);
        draggingElem.style.position = "absolute";
        draggingElem.style.pointerEvents = "none";
        draggingElem.style.zIndex = "1000";
        document.body.appendChild(draggingElem);

        const touch = e.touches[0];
        touchOffsetX = touch.clientX - card.getBoundingClientRect().left;
        touchOffsetY = touch.clientY - card.getBoundingClientRect().top;
        moveDraggingElem(touch);
      });

      card.addEventListener("touchmove", e => {
        if (!draggingElem) return;
        e.preventDefault();
        moveDraggingElem(e.touches[0]);
      }, { passive: false });

      card.addEventListener("touchend", e => {
        if (!draggingElem) return;
        const touch = e.changedTouches[0];
        const dropTarget = document.elementFromPoint(touch.clientX, touch.clientY);
        const rankCards = Array.from(topRanksContainer.children);
        const rankIdx = rankCards.indexOf(dropTarget.closest(".rank-card"));

        if (rankIdx !== -1) {
          dropToRank(rankIdx);
        }
        draggingElem.remove();
        draggedName = null;
        draggedFrom = null;
        draggingElem = null;
      });

      card.onclick = () => assignToFirstEmpty(name);
      candidateListContainer.appendChild(card);
    }
  });
}

// Move dragging element
function moveDraggingElem(touch) {
  draggingElem.style.left = touch.clientX - touchOffsetX + "px";
  draggingElem.style.top = touch.clientY - touchOffsetY + "px";
}

// Drop logic with swap
function dropToRank(idx) {
  if (!draggedName) return;
  const existing = topRanks[idx];
  const prevIdx = topRanks.indexOf(draggedName);

  if (draggedFrom === "rank" && prevIdx !== -1) topRanks[prevIdx] = null;

  if (existing && existing !== draggedName && draggedFrom === "rank") {
    topRanks[prevIdx] = existing;
  }

  topRanks[idx] = draggedName;
  renderTopRanks();
  renderCandidates();
}

function assignToFirstEmpty(name = draggedName) {
  if (!name) return;
  const firstEmpty = topRanks.findIndex(c => c === null);
  if (firstEmpty === -1) return alert("All 14 ranks filled!");
  topRanks[firstEmpty] = name;
  renderTopRanks();
  renderCandidates();
}

submitBtn.onclick = async () => {
  if (topRanks.includes(null)) return alert("Please rank all 14 candidates!");
  try {
    const token = getVotingToken();
    if (!token) return alert("Missing voting token!");

    const res = await fetch(`${API_URL}/api/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ballot: topRanks, linkID: token })
    });

    const data = await res.json();
    alert(data.message || data.error);
  } catch (err) {
    alert("Failed to submit vote: " + err.message);
  }
};

loadCandidates();
