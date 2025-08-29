const backendURL = "https://ranked-voting-app.onrender.com";
const numRanks = 14;
let candidates = [];

// Read link from URL
const urlParams = new URLSearchParams(window.location.search);
const linkID = urlParams.get("link");
if (!linkID) {
  alert("No voting link provided.");
  document.body.innerHTML = "<h2>Invalid voting link</h2>";
}

// Load candidates
async function loadCandidates() {
  const res = await fetch(`${backendURL}/api/candidates`);
  candidates = await res.json();

  const list = document.getElementById("candidate-list");
  list.innerHTML = "";
  candidates.forEach(c => {
    const li = document.createElement("li");
    li.textContent = c;
    li.draggable = true;
    li.tabIndex = 0;
    list.appendChild(li);
  });

  enableDragAndDrop(list);
}

// Drag + touch + keyboard
function enableDragAndDrop(list) {
  let dragged;

  // Desktop drag
  list.addEventListener("dragstart", e => dragged = e.target);
  list.addEventListener("dragover", e => e.preventDefault());
  list.addEventListener("drop", e => {
    e.preventDefault();
    if (e.target.tagName === "LI" && e.target !== dragged) {
      list.insertBefore(dragged, e.target.nextSibling);
    }
  });

  // Mobile touch
  list.addEventListener("touchstart", e => dragged = e.target);
  list.addEventListener("touchmove", e => e.preventDefault());
  list.addEventListener("touchend", e => {
    const touch = e.changedTouches[0];
    const target = document.elementFromPoint(touch.clientX, touch.clientY);
    if (target && target.tagName === "LI" && target !== dragged) {
      list.insertBefore(dragged, target.nextSibling);
    }
  });

  // Keyboard
  list.addEventListener("keydown", e => {
    const li = e.target;
    if (li.tagName !== "LI") return;
    if (e.key === "ArrowUp" && li.previousElementSibling) {
      li.parentNode.insertBefore(li, li.previousElementSibling);
    }
    if (e.key === "ArrowDown" && li.nextElementSibling) {
      li.parentNode.insertBefore(li.nextElementSibling, li);
    }
  });
}

// Submit vote
document.getElementById("submitVote").addEventListener("click", async () => {
  const listItems = [...document.querySelectorAll("#candidate-list li")];
  const ballot = listItems.slice(0, numRanks).map(li => li.textContent);

  if (ballot.includes("") || new Set(ballot).size !== numRanks) {
    return alert(`Please rank all ${numRanks} candidates with no duplicates.`);
  }

  const res = await fetch(`${backendURL}/api/vote`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ballot, linkID })
  });

  const data = await res.json();
  alert(data.message || data.error);
});

loadCandidates();

