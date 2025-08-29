const API_URL = "https://ranked-voting-app.onrender.com"; // your backend URL

const topRanksContainer = document.getElementById("top-ranks");
const candidateListContainer = document.getElementById("candidate-list");
const submitBtn = document.getElementById("submitVote");

const numRanks = 14;
let candidates = [];
let topRanks = new Array(numRanks).fill(null);

let draggedName = null;
let draggedFrom = null;
let draggedFromIdx = null;
let draggingElem = null;
let touchOffsetX = 0;
let touchOffsetY = 0;

// -------------------- RENDER --------------------
function renderUI() {
  topRanksContainer.innerHTML = "";
  topRanks.forEach((name, idx) => {
    const card = document.createElement("div");
    card.className = "rank-card" + (name ? " filled" : "");
    card.textContent = name || `Rank ${idx + 1}`;
    card.dataset.idx = idx;

    card.setAttribute("draggable", true);
    card.addEventListener("dragstart", e => handleDragStart(e, idx, null));
    card.addEventListener("dragover", e => e.preventDefault());
    card.addEventListener("drop", e => handleDrop(e, idx, null));

    card.addEventListener("touchstart", e => handleTouchStart(e, card, idx, null));

    topRanksContainer.appendChild(card);
  });

  candidateListContainer.innerHTML = "";
  candidates.forEach((name, idx) => {
    const card = document.createElement("div");
    card.className = "candidate-card";
    card.textContent = name;

    card.setAttribute("draggable", true);
    card.addEventListener("dragstart", e => handleDragStart(e, null, idx));
    card.addEventListener("dragover", e => e.preventDefault());
    card.addEventListener("drop", e => handleDrop(e, null, idx));

    card.addEventListener("touchstart", e => handleTouchStart(e, card, null, name));

    candidateListContainer.appendChild(card);
  });
}

// -------------------- DESKTOP DRAG --------------------
function handleDragStart(e, rankIdx, candidateIdx) {
  if (rankIdx !== null) {
    draggedName = topRanks[rankIdx];
    draggedFrom = "rank";
    draggedFromIdx = rankIdx;
  } else {
    draggedName = candidates[candidateIdx];
    draggedFrom = "list";
    draggedFromIdx = candidateIdx;
  }
}

function handleDrop(e, rankIdx, candidateIdx) {
  e.preventDefault();
  if (draggedFrom === "list" && rankIdx !== null) {
    const temp = topRanks[rankIdx];
    topRanks[rankIdx] = draggedName;
    if (temp) candidates.push(temp);
    candidates.splice(draggedFromIdx, 1);
  } else if (draggedFrom === "rank" && rankIdx !== null) {
    const temp = topRanks[rankIdx];
    topRanks[rankIdx] = draggedName;
    topRanks[draggedFromIdx] = temp;
  } else if (draggedFrom === "rank" && candidateIdx !== null) {
    candidates.push(draggedName);
    topRanks[draggedFromIdx] = null;
  }
  draggedName = null;
  draggedFrom = null;
  draggedFromIdx = null;
  renderUI();
}

// -------------------- MOBILE TOUCH --------------------
function handleTouchStart(e, card, rankIdx, candidateName) {
  const touch = e.touches[0];
  draggedName = candidateName || topRanks[rankIdx];
  draggedFrom = candidateName ? "list" : "rank";
  draggedFromIdx = candidateName ? candidates.indexOf(candidateName) : rankIdx;

  draggingElem = card.cloneNode(true);
  draggingElem.style.position = "absolute";
  draggingElem.style.pointerEvents = "none";
  draggingElem.style.zIndex = "1000";
  document.body.appendChild(draggingElem);

  const rect = card.getBoundingClientRect();
  touchOffsetX = touch.clientX - rect.left;
  touchOffsetY = touch.clientY - rect.top + window.scrollY;

  moveDraggingElem(touch);

  document.addEventListener("touchmove", handleTouchMove);
  document.addEventListener("touchend", handleTouchEnd);

  e.preventDefault();
}

function handleTouchMove(e) {
  if (!draggingElem) return;
  moveDraggingElem(e.touches[0]);
  e.preventDefault();
}

function moveDraggingElem(touch) {
  draggingElem.style.left = touch.clientX - touchOffsetX + "px";
  draggingElem.style.top = touch.clientY - touchOffsetY + window.scrollY + "px";
}

function handleTouchEnd(e) {
  if (!draggingElem) return;

  const touch = e.changedTouches[0];
  const targetElem = document.elementFromPoint(touch.clientX, touch.clientY);

  if (targetElem) {
    if (targetElem.classList.contains("rank-card")) {
      const idx = parseInt(targetElem.dataset.idx);
      const temp = topRanks[idx];
      topRanks[idx] = draggedName;
      if (draggedFrom === "rank") topRanks[draggedFromIdx] = temp;
      else candidates.splice(draggedFromIdx, 1);
      if (temp && draggedFrom === "list") candidates.push(temp);
    } else if (draggedFrom === "rank") {
      // tap-to-remove
      candidates.push(draggedName);
      topRanks[draggedFromIdx] = null;
    }
  }

  document.body.removeChild(draggingElem);
  draggingElem = null;
  draggedName = null;
  draggedFrom = null;
  draggedFromIdx = null;

  document.removeEventListener("touchmove", handleTouchMove);
  document.removeEventListener("touchend", handleTouchEnd);

  renderUI();
}

// -------------------- SUBMIT VOTE --------------------
submitBtn.addEventListener("click", async () => {
  if (topRanks.includes(null)) return alert("Please rank all 14 candidates!");
  const ballot = topRanks.slice();
  const linkID = new URLSearchParams(window.location.search).get("link");
  if (!linkID) return alert("Missing voting link");

  const res = await fetch(`${API_URL}/api/vote`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ballot, linkID })
  });
  const data = await res.json();
  alert(data.message || data.error);
});

// -------------------- LOAD CANDIDATES --------------------
async function loadCandidates() {
  try {
    const res = await fetch(`${API_URL}/api/candidates`);
    if (!res.ok) throw new Error("Failed to load candidates");
    candidates = await res.json();
    renderUI();
  } catch (err) {
    console.error(err);
    alert("Could not load candidates from server");
  }
}

loadCandidates();
