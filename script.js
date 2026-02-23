const grid = document.getElementById('grid');
const cellSize = 50;
let blocks = [];
let currentLvl = parseInt(localStorage.getItem('mkey_lvl')) || 1;
let totalXP = parseInt(localStorage.getItem('mkey_xp')) || 0;
let moves = 0;

function initLevel() {
    grid.innerHTML = '';
    moves = 0;
    document.getElementById('move-display').innerText = moves;
    document.getElementById('lvl-display').innerText = currentLvl;
    updateRank();

    // Generazione livello (La chiave è sempre in riga 2)
    blocks = [{ x: 0, y: 2, l: 2, o: 'h', k: true }];
    
    // Aggiungi ostacoli in base al livello
    let obstacleCount = 4 + Math.min(currentLvl, 8);
    for (let i = 0; i < 20; i++) {
        if (blocks.length > obstacleCount) break;
        let l = Math.random() > 0.7 ? 3 : 2;
        let o = Math.random() > 0.5 ? 'h' : 'v';
        let x = Math.floor(Math.random() * (6 - (o === 'h' ? l : 0)));
        let y = Math.floor(Math.random() * (6 - (o === 'v' ? l : 0)));

        if (!blocks.some(b => checkCollision(x, y, l, o, b))) {
            blocks.push({ x, y, l, o, k: false });
        }
    }
    render();
}

function render() {
    grid.innerHTML = '';
    blocks.forEach((b, i) => {
        const div = document.createElement('div');
        div.className = `block ${b.k ? 'key-block' : (b.o === 'h' ? 'wood-h' : 'wood-v')}`;
        div.style.width = (b.o === 'h' ? b.l * cellSize : cellSize) - 6 + 'px';
        div.style.height = (b.o === 'v' ? b.l * cellSize : cellSize) - 6 + 'px';
        div.style.left = b.x * cellSize + 3 + 'px';
        div.style.top = b.y * cellSize + 3 + 'px';
        if(b.k) div.innerText = '🔑';

        // Eventi Drag corretti
        div.onpointerdown = (e) => {
            let startX = e.clientX;
            let startY = e.clientY;
            let origX = b.x;
            let origY = b.y;
            div.setPointerCapture(e.pointerId);

            div.onpointermove = (em) => {
                let dx = Math.round((em.clientX - startX) / cellSize);
                let dy = Math.round((em.clientY - startY) / cellSize);
                let target = b.o === 'h' ? origX + dx : origY + dy;
                
                if (canMove(i, target)) {
                    if (b.o === 'h') b.x = target; else b.y = target;
                    div.style.left = b.x * cellSize + 3 + 'px';
                    div.style.top = b.y * cellSize + 3 + 'px';
                }
            };

            div.onpointerup = () => {
                div.onpointermove = null;
                moves++;
                document.getElementById('move-display').innerText = moves;
                if (b.k && b.x === 4) win();
            };
        };
        grid.appendChild(div);
    });
}

function canMove(idx, val) {
    const b = blocks[idx];
    if (val < 0 || val + b.l > 6) return false;
    return !blocks.some((other, i) => {
        if (i === idx) return false;
        let nx = b.o === 'h' ? val : b.x;
        let ny = b.o === 'v' ? val : b.y;
        return checkCollision(nx, ny, b.l, b.o, other);
    });
}

function checkCollision(x, y, l, o, other) {
    let w = o === 'h' ? l : 1, h = o === 'v' ? l : 1;
    let ow = other.o === 'h' ? other.l : 1, oh = other.o === 'v' ? other.l : 1;
    return x < other.x + ow && x + w > other.x && y < other.y + oh && y + h > other.y;
}

function win() {
    totalXP += 20;
    currentLvl++;
    localStorage.setItem('mkey_lvl', currentLvl);
    localStorage.setItem('mkey_xp', totalXP);
    alert("LIVELLO COMPLETATO!");
    initLevel();
}

function updateRank() {
    const titles = ["NOVICE", "APPRENTICE", "WOOD-CUTTER", "CHAMPION", "MASTER"];
    let rankIdx = Math.floor(totalXP / 100);
    document.getElementById('rank-name').innerText = titles[Math.min(rankIdx, 4)];
    document.getElementById('rank-fill').style.width = (totalXP % 100) + "%";
}

function resetLevel() { initLevel(); }
function nextLevel() { initLevel(); }

initLevel()
