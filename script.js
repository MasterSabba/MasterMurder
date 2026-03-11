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

// --- GENERAZIONE DETERMINISTICA E SICURA ---
function generateHardLevel(num) {
    // Usiamo il numero del livello come seed per renderlo sempre uguale
    let seed = num * 1234.5;
    const rng = () => {
        seed = Math.sin(seed) * 10000;
        return seed - Math.floor(seed);
    };

    blocks = [{ x: 0, y: 2, l: 2, o: 'h', k: true }];
    let targetCount = 7 + Math.min(Math.floor(num / 5), 8);
    let attempts = 0;

    while (blocks.length < targetCount && attempts < 1000) {
        attempts++;
        let l = rng() > 0.8 ? 3 : 2;
        let o = rng() > 0.5 ? 'h' : 'v';
        let x = Math.floor(rng() * (6 - (o === 'h' ? l : 1)));
        let y = Math.floor(rng() * (6 - (o === 'v' ? l : 1)));

        // REGOLE DI SOLVIBILITÀ
        if (o === 'h' && y === 2) continue; // Mai blocchi orizzontali sulla riga della chiave
        
        // Se è un blocco verticale da 3 sulla corsia d'uscita (x >= 2)
        if (o === 'v' && l === 3 && x >= 2) {
            // Deve poter scivolare tutto su (y=0) o tutto giù (y=3)
            // Per semplicità nei livelli deterministici, limitiamo la loro posizione
            y = rng() > 0.5 ? 0 : 3;
        }

        if (!checkCollision(x, y, l, o, -1)) {
            blocks.push({ x, y, l, o, k: false });
        }
    }
    initialPos = JSON.parse(JSON.stringify(blocks));
}

// --- LOGICA SKIN SHOP ---
function toggleSkinShop() {
    const s = document.getElementById('skin-shop');
    s.style.display = (s.style.display === 'flex') ? 'none' : 'flex';
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
        alert("Skin sbloccata!");
    } else {
        alert("💎 XP insufficienti!");
    }
}

function applySkin(id) {
    document.body.className = 'skin-' + id;
    currentSkin = id;
    localStorage.setItem('mk_currentSkin', id);
}

// --- GESTIONE GIOCO ---
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
        let msg = "GIÀ COMPLETATO";
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

function toggleMenu() { 
    const m = document.getElementById("level-menu"); 
    const isOpening = m.style.display !== "flex";
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
function goToLevelsFromVictory() { toggleMenu(); }
function nextLevel() { loadLevel(level + 1); }
