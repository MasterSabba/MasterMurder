const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const size = 8;
const tileSize = canvas.width / size;

let level = 1;
let moves = 0;

let player;
let exit;
let walls = [];
let animating = false;

function generateLevel() {
  player = { x: 0, y: 0 };
  exit = { x: size - 1, y: size - 1 };
  walls = [];

  let wallCount = 8 + level * 2;

  for (let i = 0; i < wallCount; i++) {
    let wx = Math.floor(Math.random() * size);
    let wy = Math.floor(Math.random() * size);

    if ((wx !== 0 || wy !== 0) && (wx !== exit.x || wy !== exit.y)) {
      walls.push({ x: wx, y: wy });
    }
  }

  moves = 0;
  updateUI();
}

function updateUI() {
  document.getElementById("level").innerText = level;
  document.getElementById("moves").innerText = moves;
}

function drawGrid() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      ctx.strokeStyle = "#333";
      ctx.strokeRect(x * tileSize, y * tileSize, tileSize, tileSize);
    }
  }

  walls.forEach(w => {
    ctx.fillStyle = "#555";
    ctx.fillRect(w.x * tileSize, w.y * tileSize, tileSize, tileSize);
  });

  ctx.fillStyle = "lime";
  ctx.fillRect(exit.x * tileSize, exit.y * tileSize, tileSize, tileSize);

  ctx.fillStyle = "orange";
  ctx.fillRect(player.x * tileSize, player.y * tileSize, tileSize, tileSize);
}

function slide(dx, dy) {
  if (animating) return;

  let targetX = player.x;
  let targetY = player.y;

  while (true) {
    let nx = targetX + dx;
    let ny = targetY + dy;

    if (
      nx < 0 || nx >= size ||
      ny < 0 || ny >= size ||
      walls.some(w => w.x === nx && w.y === ny)
    ) break;

    targetX = nx;
    targetY = ny;
  }

  if (targetX === player.x && targetY === player.y) return;

  moves++;
  updateUI();
  animateMove(targetX, targetY);
}

function animateMove(tx, ty) {
  animating = true;

  const speed = 6;
  let px = player.x * tileSize;
  let py = player.y * tileSize;
  const targetPx = tx * tileSize;
  const targetPy = ty * tileSize;

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawGrid();

    if (Math.abs(px - targetPx) > speed)
      px += Math.sign(targetPx - px) * speed;
    else
      px = targetPx;

    if (Math.abs(py - targetPy) > speed)
      py += Math.sign(targetPy - py) * speed;
    else
      py = targetPy;

    ctx.fillStyle = "orange";
    ctx.fillRect(px, py, tileSize, tileSize);

    if (px === targetPx && py === targetPy) {
      player.x = tx;
      player.y = ty;
      animating = false;

      if (player.x === exit.x && player.y === exit.y) {
        level++;
        generateLevel();
      }

      drawGrid();
      return;
    }

    requestAnimationFrame(animate);
  }

  animate();
}

function resetLevel() {
  generateLevel();
}

document.addEventListener("keydown", e => {
  if (e.key === "ArrowUp") slide(0, -1);
  if (e.key === "ArrowDown") slide(0, 1);
  if (e.key === "ArrowLeft") slide(-1, 0);
  if (e.key === "ArrowRight") slide(1, 0);
});

generateLevel();
drawGrid();
