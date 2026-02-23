const grid = document.getElementById('grid');
const cellSize = 52;
let currentBlocks = [];
let initialLayout = []; // Per il reset dello stesso livello
let moves = 0;
let xp = parseInt(localStorage.getItem('mkey_xp_v2')) || 0;
let lvl = parseInt(localStorage.getItem('mkey_lvl_v2')) || 1;

// --- LOGICA GENERAZIONE ---
function generateLevel() {
    moves = 0;
    updateUI();
    
    // 1. Chiave obbligatoria
    let layout = [{ x: 0, y: 2, l: 2, o: 'h', k: true }];
    
    // 2. Aggiunta ostacoli con controllo collisioni
    const maxObstacles = 5 + Math.min(Math.floor(lvl/2), 8);
    let attempts = 0;
    
    while (layout.length < maxObstacles && attempts < 100) {
        attempts++;
        let l = Math.random() > 0.7 ? 3 : 2;
        let o = Math.random() > 0.5 ? 'h' : 'v';
        let x = Math.floor(Math.random() * (6 - (o === 'h' ? l : 0)));
        let y = Math.floor(Math.random() * (6 - (o === 'v' ? l : 0)));

        // Non sovrapporre la traiettoria immediata della chiave per i primi livelli
        if (lvl < 3 && o === 'v' && x > 1 && y <= 2 && y + l > 2) continue;

        if (!layout.some(b => isColliding(x, y, l, o, b))) {
            layout.push({ x, y, l, o, k: false });
        }
    }
    
    initialLayout = JSON.parse(JSON.stringify(layout)); // Salva lo stato iniziale
    currentBlocks = layout;
    render();
}

function render() {
    grid.innerHTML = '';
    currentBlocks.forEach((b, i) => {
        const el = document.createElement('div');
        el.className = `block ${b.k ? 'block-key' : (b.o === 'h' ? 'block-h' : 'block-v')}`;
        el.style.width = (b.o === 'h' ? b.l * cellSize : cellSize) - 8 + 'px';
        el.style.height = (b.o === 'v' ? b.l * cellSize : cellSize) - 8 + 'px';
        el.style.left = b.x * cellSize + 4 + 'px';
        el.style.top = b.y * cellSize + 4 + 'px';
        if(b.k) el.innerHTML = '🔑';

        // GESTIONE MOVIMENTO (DRAG)
        el.onpointerdown = (e) => {
            el.setPointerCapture(e.pointerId);
            let startCoord = b.o === 'h' ? e.clientX : e.clientY;
            let startIdx = b.o === 'h' ? b.x : b.y;

            el.onpointermove = (em) => {
                let currentCoord = b.o === 'h' ? em.clientX : em.clientY;
                let diff = Math.round((currentCoord - startCoord) / cellSize);
                let target = startIdx + diff;

                if (tryMove(i, target)) {
                    if (b.o === 'h') b.x = target; else b.y = target;
                    el.style.left = b.x * cellSize + 4 + 'px';
                    el.style.top = b.y * cellSize + 4 + 'px';
                }
            };

            el.onpointerup = () => {
                el.onpointermove = null;
                moves++;
                document.getElementById('move-num').innerText = moves;
                if (b.k && b.x === 4) handleWin();
            };
        };
        grid.appendChild(el);
    });
}

function tryMove(idx, newVal) {
    const b = currentBlocks[idx];
    if (newVal < 0 || newVal + b.l > 6) return false;
    
    // Controlla collisioni con altri blocchi
    for (let i = 0; i < currentBlocks.length; i++) {
        if (i === idx) continue;
        const other = currentBlocks[i];
        let nextX = b.o === 'h' ? newVal : b.x;
        let nextY = b.o === 'v' ? newVal : b.y;
        if (isColliding(nextX, nextY, b.l, b.o, other)) return false;
    }
    return true;
}

function isColliding(x, y, l, o, b2) {
    let w1 = o === 'h' ? l : 1, h1 = o === 'v' ? l : 1;
    let w2 = b2.o === 'h' ? b2.l : 1, h2 = b2.o === 'v' ? b2.l : 1;
    return x < b2.x + w2 && x + w1 > b2.x && y < b2.y + h2 && y + h1 > b2.y;
}

// --- GESTIONE STATI ---
function handleWin() {
    xp += 20;
    lvl++;
    localStorage.setItem('mkey_xp_v2', xp);
    localStorage.setItem('mkey_lvl_v2', lvl);
    setTimeout(() => {
        alert("SBLOCCATO!");
        generateLevel();
    }, 200);
}

function resetCurrentLevel() {
    currentBlocks = JSON.parse(JSON.stringify(initialLayout));
    moves = 0;
    document.getElementById('move-num').innerText = moves;
    render();
}

function startNewLevel() {
    generateLevel();
}

function updateUI() {
    document.getElementById('lvl-num').innerText = lvl;
    document.getElementById('move-num').innerText = moves;
    const progress = xp % 100;
    document.getElementById('rank-bar').style.width = progress + "%";
    
    const titles = ["WOOD NOVICE", "CARPENTER", "LOCKSMITH", "KEY MASTER", "LEGEND"];
    document.getElementById('rank-text').innerText = titles[Math.min(Math.floor(xp/100), 4)];
}

// Inizializzazione
generateLevel();
