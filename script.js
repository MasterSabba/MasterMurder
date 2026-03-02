const cellSize = 50;
let blocks = [], initialPos = [], isDragging = false, timerInterval, seconds = 0;

let level = parseInt(localStorage.getItem('mk_level')) || 1;
let unlockedLevel = parseInt(localStorage.getItem('mk_unlocked')) || 1;
let xp = parseInt(localStorage.getItem('mk_xp')) || 0;
let rewardedLevels = JSON.parse(localStorage.getItem('mk_rewarded')) || [];

window.onload = () => { updateUI(); loadLevel(level); };

// --- GENERAZIONE LIVELLI GARANTITI ---
function generateHardLevel(num) {
    // La Chiave
    blocks = [{ x: 0, y: 2, l: 2, o: 'h', k: true }];
    
    // Numero blocchi: aumentano con il livello ma con un limite di densità
    let targetCount = 9 + Math.min(Math.floor(num / 4), 6); 
    let attempts = 0;

    while (blocks.length < targetCount && attempts < 1000) {
        attempts++;
        let l = Math.random() > 0.7 ? 3 : 2;
        let o = Math.random() > 0.5 ? 'h' : 'v';
        let x = Math.floor(Math.random() * (6 - (o === 'h' ? l : 1)));
        let y = Math.floor(Math.random() * (6 - (o === 'v' ? l : 1)));

        // EVITA LIVELLI IMPOSSIBILI:
        if (o === 'h' && y === 2) continue; // Mai bloccare orizzontalmente la riga 2
        if (o === 'v' && x >= 4 && y <= 2 && y+l > 2) {
            // Se metti un pezzo verticale davanti all'uscita, assicurati che abbia spazio per salire o scendere
            if (y === 0 && l === 3) continue; // Troppo lungo, tasperebbe tutto
        }

        if (!checkCollision(x, y, l, o, -1)) {
            blocks.push({ x, y, l, o, k: false });
        }
    }
    // Salva lo stato per il RESET
    initialPos = JSON.parse(JSON.stringify(blocks));
}

// --- LOGICA INDIZIO (HINT) MIRATA ---
function useHint() {
    if (xp < 500) return;
    
    // 1. Trova il blocco critico
    let targetIdx = -1;
    const key = blocks[0];

    // Cerca il primo blocco verticale che blocca la chiave a destra
    for (let i = 1; i < blocks.length; i++) {
        let b = blocks[i];
        if (b.o === 'v' && b.x > key.x && b.y <= 2 && (b.y + b.l) > 2) {
            targetIdx = i;
            break;
        }
    }

    // Se non c'è un blocco davanti alla chiave, aiuta con l'ultimo ostacolo all'uscita
    if (targetIdx === -1) {
        targetIdx = blocks.findIndex((b, i) => i > 0 && b.x >= 4);
    }

    // Se proprio non trova nulla, prende il pezzo più vicino alla chiave
    if (targetIdx === -1) targetIdx = 1;

    // Sottrai XP e anima
    xp -= 500;
    localStorage.setItem('mk_xp', xp);
    updateUI();

    animateHint(targetIdx);
}

function animateHint(idx) {
    const b = blocks[idx];
    const el = document.getElementById(`block-${idx}`);
    if (!el) return;

    el.style.transition = "all 0.4s ease-in-out";
    const oldX = b.x, oldY = b.y;

    // Calcola mossa logica: se è verticale, prova a spostarlo su o giù
    let moveX = b.x, moveY = b.y;
    if (b.o === 'v') {
        moveY = (b.y > 0 && !checkCollision(b.x, b.y-1, b.l, b.o, idx)) ? b.y - 1 : b.y + 1;
    } else {
        moveX = (b.x > 0 && !checkCollision(b.x-1, b.y, b.l, b.o, idx)) ? b.x - 1 : b.x + 1;
    }

    el.style.left = (moveX * cellSize + 2) + "px";
    el.style.top = (moveY * cellSize + 2) + "px";
    el.classList.add('ghost-hint');

    setTimeout(() => {
        el.style.left = (oldX * cellSize + 2) + "px";
        el.style.top = (oldY * cellSize + 2) + "px";
        setTimeout(() => {
            el.style.transition = "";
            el.classList.remove('ghost-hint');
        }, 400);
    }, 800);
}

// --- RESTO DEL CODICE (MOVIMENTO E UI) ---
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
        div.id = `block-${i}`;
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
        let msg = "GIÀ FATTO (0 XP)";
        if (!rewardedLevels.includes(level)) {
            xp += 100; rewardedLevels.push(level);
            localStorage.setItem('mk_rewarded', JSON.stringify(rewardedLevels));
            localStorage.setItem('mk_xp', xp);
            msg = "+100 XP!";
        }
        if (level === unlockedLevel) { unlockedLevel++; localStorage.setItem('mk_unlocked', unlockedLevel); }
        document.getElementById("victory-xp-msg").innerText = msg;
        document.getElementById("victory-screen").style.display = "flex";
        updateUI();
    }, 500);
}

function startTimer() {
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
    document.getElementById("hint-btn").disabled = xp < 500; 
}
function resetLevel() { blocks = JSON.parse(JSON.stringify(initialPos)); render(); resetTimer(); startTimer(); }
function toggleMenu() { 
    const m = document.getElementById("level-menu"); 
    const isOpening = m.style.display !== "flex";
    if (isOpening) document.getElementById("victory-screen").style.display = "none";
    m.style.display = isOpening ? "flex" : "none";
    if (isOpening) {
        const g = document.getElementById("level-grid"); g.innerHTML = '';
        for(let i=1; i<=100; i++) {
            const btn = document.createElement("div");
            btn.className = `lvl-btn ${i > unlockedLevel ? 'locked' : (rewardedLevels.includes(i) ? 'completed' : '')}`;
            btn.innerHTML = i > unlockedLevel ? '🔒' : i;
            if (i <= unlockedLevel) btn.onclick = () => loadLevel(i);
            g.appendChild(btn);
        }
    }
}
function goToLevelsFromVictory() { document.getElementById("victory-screen").style.display = "none"; toggleMenu(); }
function nextLevel() { loadLevel(level + 1); }
