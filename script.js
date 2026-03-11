const cellSize = 50;
let blocks = [], initialPos = [], isDragging = false, timerInterval, seconds = 0;

let level = parseInt(localStorage.getItem('mk_level')) || 1;
let unlockedLevel = parseInt(localStorage.getItem('mk_unlocked')) || 1;
let xp = parseInt(localStorage.getItem('mk_xp')) || 0;
let rewardedLevels = JSON.parse(localStorage.getItem('mk_rewarded')) || [];
let ownedSkins = JSON.parse(localStorage.getItem('mk_skins')) || ['default'];
let currentSkin = localStorage.getItem('mk_currentSkin') || 'default';

window.onload = () => {
    applySkin(currentSkin);
    updateUI();
    loadLevel(level);
};

// --- MOTORE DI GENERAZIONE CON VERIFICA RISOLVIBILITÀ ---
function generateHardLevel(num) {
    let solved = false;
    let attempts = 0;
    let seed = num * 1234.5;
    
    const rng = () => {
        seed = Math.sin(seed) * 10000;
        return seed - Math.floor(seed);
    };

    while (!solved && attempts < 50) {
        attempts++;
        blocks = [{ x: 0, y: 2, l: 2, o: 'h', k: true }];
        // Difficoltà: aumenta il numero di blocchi man mano che sali
        let targetCount = 8 + Math.min(Math.floor(num / 4), 7);
        
        for (let i = 0; i < 200 && blocks.length < targetCount; i++) {
            let l = rng() > 0.8 ? 3 : 2;
            let o = rng() > 0.5 ? 'h' : 'v';
            let x = Math.floor(rng() * (6 - (o === 'h' ? l : 1)));
            let y = Math.floor(rng() * (6 - (o === 'v' ? l : 1)));

            if (o === 'h' && y === 2) continue; // Mai sulla riga della chiave
            if (!checkCollision(x, y, l, o, -1)) {
                blocks.push({ x, y, l, o, k: false });
            }
        }

        // Verifica se lo schema è risolvibile (BFS)
        if (isSolvable(JSON.parse(JSON.stringify(blocks)))) {
            solved = true;
        } else {
            seed += 1; // Cambia leggermente il seed se il livello è impossibile
        }
    }
    initialPos = JSON.parse(JSON.stringify(blocks));
}

// --- ALGORITMO DI RISOLUZIONE (BFS) ---
function isSolvable(startBlocks) {
    let queue = [JSON.stringify(startBlocks)];
    let visited = new Set();
    visited.add(queue[0]);
    let steps = 0;

    while (queue.length > 0 && steps < 1200) {
        steps++;
        let currentBlocks = JSON.parse(queue.shift());
        if (currentBlocks[0].x === 4) return true;

        for (let i = 0; i < currentBlocks.length; i++) {
            let b = currentBlocks[i];
            let directions = b.o === 'h' ? [[1,0], [-1,0]] : [[0,1], [0,-1]];
            for (let d of directions) {
                let nextBlocks = JSON.parse(JSON.stringify(currentBlocks));
                let nb = nextBlocks[i];
                while (true) {
                    let nx = nb.x + d[0], ny = nb.y + d[1];
                    if (canMoveTo(nx, ny, nb.l, nb.o, i, nextBlocks)) {
                        nb.x = nx; nb.y = ny;
                        let state = JSON.stringify(nextBlocks);
                        if (!visited.has(state)) {
                            visited.add(state);
                            queue.push(state);
                        }
                    } else break;
                }
            }
        }
    }
    return false;
}

function canMoveTo(x, y, l, o, idx, currentBlocks) {
    const w = o === 'h' ? l : 1, h = o === 'v' ? l : 1;
    if (x < 0 || x + w > 6 || y < 0 || y + h > 6) return false;
    for (let i = 0; i < currentBlocks.length; i++) {
        if (i === idx) continue;
        let b = currentBlocks[i];
        const bw = b.o === 'h' ? b.l : 1, bh = b.o === 'v' ? b.l : 1;
        if (x < b.x + bw && x + w > b.x && y < b.y + bh && y + h > b.y) return false;
    }
    return true;
}

// --- GESTIONE MENU E SKIN ---
function toggleMenu() { 
    const m = document.getElementById("level-menu"); 
    const s = document.getElementById('skin-shop');
    if (s) s.style.display = 'none';
    
    const isOpening = m.style.display !== "flex";
    m.style.display = isOpening ? "flex" : "none";
    
    if (isOpening) {
        const g = document.getElementById("level-grid"); 
        g.innerHTML = '';
        for(let i=1; i<=100; i++) {
            const btn = document.createElement("div");
            let isLocked = i > unlockedLevel;
            btn.className = `lvl-btn ${isLocked ? 'locked' : (rewardedLevels.includes(i) ? 'completed' : '')}`;
            btn.innerHTML = isLocked ? '🔒' : i;
            if (!isLocked) btn.onclick = () => loadLevel(i);
            g.appendChild(btn);
        }
    }
}

function toggleSkinShop() {
    const s = document.getElementById('skin-shop');
    const m = document.getElementById('level-menu');
    if (m) m.style.display = 'none';
    const isOpening = s.style.display !== 'flex';
    s.style.display = isOpening ? 'flex' : 'none';
}

function buySkin(id, cost) {
    if (ownedSkins.includes(id)) {
        applySkin(id);
        toggleSkinShop();
        return;
    }
    if (xp >= cost) {
        xp -= cost;
        ownedSkins.push(id);
        localStorage.setItem('mk_xp', xp);
        localStorage.setItem('mk_skins', JSON.stringify(ownedSkins));
        applySkin(id);
        updateUI();
        toggleSkinShop();
    } else {
        alert("💎 XP insufficienti!");
    }
}

function applySkin(id) {
    document.body.className = 'skin-' + id;
    currentSkin = id;
    localStorage.setItem('mk_currentSkin', id);
}

// --- CORE GAMEPLAY ---
function loadLevel(num) {
    level = num;
    localStorage.setItem('mk_level', level);
    document.getElementById("victory-screen").style.display = "none";
    document.getElementById("level-menu").style.display = "none";
    generateHardLevel(num);
    resetTimer(); startTimer(); render(); updateUI();
}

function render() {
    const grid = document.getElementById("grid");
    grid.innerHTML = '';
    blocks.forEach((b, i) => {
        const div = document.createElement("div");
        div.className = `block ${b.k ? 'block-key' : ''}`;
        div.style.width = (b.o === 'h' ? b.l * cellSize : cellSize) - 4 + "px";
        div.style.height = (b.o === 'v' ? b.l * cellSize : cellSize) - 4 + "px";
        div.style.left = (b.x * cellSize + 2) + "px";
        div.style.top = (b.y * cellSize + 2) + "px";

        div.onpointerdown = (e) => {
            if (isDragging) return;
            isDragging = true;
            div.setPointerCapture(e.pointerId);
            let startX = e.clientX, startY = e.clientY, ox = b.x, oy = b.y;

            div.onpointermove = (em) => {
                let dx = Math.round((em.clientX - startX) / cellSize);
                let dy = Math.round((em.clientY - startY) / cellSize);
                let target = (b.o === 'h' ? ox + dx : oy + dy);
                let current = (b.o === 'h' ? b.x : b.y);

                while (current !== target) {
                    let step = target > current ? 1 : -1;
                    let nx = b.x + (b.o === 'h' ? step : 0), ny = b.y + (b.o === 'v' ? step : 0);
                    if (!checkCollision(nx, ny, b.l, b.o, i)) {
                        b.x = nx; b.y = ny; current += step;
                    } else break;
                }
                div.style.left = (b.x * cellSize + 2) + "px";
                div.style.top = (b.y * cellSize + 2) + "px";
            };
            div.onpointerup = () => {
                isDragging = false; div.onpointermove = null;
                if (b.k && b.x === 4) handleWin();
            };
        };
        grid.appendChild(div);
    });
}

function checkCollision(x, y, l, o, idx) {
    const w = o === 'h' ? l : 1, h = o === 'v' ? l : 1;
    if (x < 0 || x + w > 6 || y < 0 || y + h > 6) return true;
    return blocks.some((b, i) => {
        if (i === idx) return false;
        const bw = b.o === 'h' ? b.l : 1, bh = b.o === 'v' ? b.l : 1;
        return x < b.x + bw && x + w > b.x && y < b.y + bh && y + h > b.y;
    });
}

function handleWin() {
    clearInterval(timerInterval);
    const key = document.querySelector('.block-key');
    key.style.transition = "left 0.5s ease-in"; key.style.left = "350px";
    setTimeout(() => {
        let msg = "GIÀ FATTO";
        if (!rewardedLevels.includes(level)) {
            xp += 100; rewardedLevels.push(level);
            localStorage.setItem('mk_rewarded', JSON.stringify(rewardedLevels));
            localStorage.setItem('mk_xp', xp);
            msg = "+100 💎";
        }
        if (level === unlockedLevel) { unlockedLevel++; localStorage.setItem('mk_unlocked', unlockedLevel); }
        document.getElementById("victory-xp-msg").innerText = msg;
        document.getElementById("victory-screen").style.display = "flex";
        updateUI();
    }, 500);
}

function startTimer() {
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        seconds++;
        let m = Math.floor(seconds/60).toString().padStart(2,'0'), s = (seconds%60).toString().padStart(2,'0');
        document.getElementById("timer").innerText = `${m}:${s}`;
    }, 1000);
}

function resetTimer() { clearInterval(timerInterval); seconds = 0; document.getElementById("timer").innerText = "00:00"; }
function updateUI() { 
    document.getElementById("xp").innerText = xp; 
    document.getElementById("level").innerText = level; 
}
function resetLevel() { blocks = JSON.parse(JSON.stringify(initialPos)); render(); resetTimer(); startTimer(); }
function goToLevelsFromVictory() { toggleMenu(); }
function nextLevel() { loadLevel(level + 1); }
