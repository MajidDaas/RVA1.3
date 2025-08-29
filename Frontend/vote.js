const API_URL = "https://ranked-voting-app.onrender.com";
const topRanksContainer = document.getElementById("top-ranks");
const candidateListContainer = document.getElementById("candidate-list");
const numRanks = 14;

let candidates = []; // populate from backend
let topRanks = new Array(numRanks).fill(null);

let draggedName = null;
let draggedFrom = null;
let draggedFromIdx = null;
let draggingElem = null;
let touchOffsetX = 0;
let touchOffsetY = 0;

// -------------------- RENDER UI --------------------
function renderUI() {
  // Render top ranks
  topRanksContainer.innerHTML = "";
  topRanks.forEach((name, idx) => {
    const card = document.createElement("div");
    card.className = "rank-card" + (name ? " filled" : "");
    card.textContent = name || `Rank ${idx + 1}`;
    card.dataset.idx = idx;

    // Desktop drag
    card.setAttribute("draggable", true);
    card.addEventListener("dragstart", e => handleDragStart(e, idx, null));
    card.addEventListener("dragover", e => e.preventDefault());
    card.addEventListener("drop", e => handleDrop(e, idx, null));

    // Mobile drag
    card.addEventListener("touchstart", e => handleTouchStart(e, card, idx, null));

    topRanksContainer.appendChild(card);
  });

  // Render candidates
  candidateListContainer.innerHTML = "";
  candidates.forEach((name, idx) => {
    const card = document.createElement("div");
    card.className = "candidate-card";
    card.textContent = name;

    // Desktop drag
    card.setAttribute("draggable", true);
    card.addEventListener("dragstart", e => handleDragStart(e, null, idx));
    card.addEventListener("dragover", e => e.preventDefault());
    card.addEventListener("drop", e => handleDrop(e, null, idx));

    // Mobile drag
    card.addEventListener("touchstart", e => handleTouchStart(e, card, null, name));

    candidateListContainer.appendChild(card);
  });
}

// -------------------- DESKTOP DRAG & DROP --------------------
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
    // Place candidate in rank
    const temp = topRanks[rankIdx];
    topRanks[rankIdx] = draggedName;
    if (temp) candidates.push(temp);
    candidates.splice(draggedFromIdx, 1);
  } else if (draggedFrom === "rank" && rankIdx !== null) {
    // Swap ranks
    const temp = topRanks[rankIdx];
    topRanks[rankIdx] = draggedName;
    topRanks[draggedFromIdx] = temp;
  } else if (draggedFrom === "rank" && candidateIdx !== null) {
    // Move back to candidate list
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
      if (draggedFrom === "rank") {
        topRanks[draggedFromIdx] = temp;
      } else {
        // from candidate list
        candidates.splice(draggedFromIdx, 1);
        if (temp) candidates.push(temp);
      }
    } else if (draggedFrom === "rank") {
      // tap-to-remove: return to candidate list
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

// -------------------- INITIAL LOAD --------------------
async function loadCandidates() {
  const res = await fetch("/api/candidates"); // adjust to your backend
  candidates = await res.json();
  renderUI();
}

loadCandidates();
