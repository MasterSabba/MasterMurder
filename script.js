const grid = document.getElementById('grid');
const cellSize = 52;
let blocks = [];
let initialLayout = [];
let moves = 0;
let xp = parseInt(localStorage.getItem('mk_xp_wood')) || 0;
let currentLvl = parseInt(localStorage.getItem('mk_lvl_wood')) || 1;
let timerInterval;
let seconds = 0;

function updateUI() {
    document.getElementById('lvl').innerText = currentLvl;
    document.getElementById('moves').innerText = moves;
    document.getElementById('xp-counter').innerText = xp + " XP";
    
    // La barra si riempie ogni 100 XP
    let progress = xp % 100;
    document.getElementById('progress-fill').style.width = progress + "%";
    
    const ranks = ["WOOD NOVICE", "CARPENTER", "LOCKSMITH", "KEY MASTER", "LEGEND"];
    document.getElementById('rank-label').innerText = ranks[Math.min(Math.floor(xp/100), 4)];
}

function generateLevel() {
    moves = 0;
    seconds = 0;
    grid.innerHTML = '';
    clearInterval(timerInterval);
    
    // Difficoltà dinamica
    let obstacleCount = 4 + Math.min(Math.floor(currentLvl / 2), 10);
    let layout = [{ x: 0, y: 2, l: 2, o: 'h', k: true }];
    
    let attempts = 0;
    while (layout.length < obstacleCount && attempts < 500) {
        attempts++;
        let l = (currentLvl > 3 && Math.random() > 0.7) ? 3 : 2;
        let o = Math.random() > 0.5 ? 'h' : 'v';
        let x = Math.floor(Math.random() * (6 - (o === 'h' ? l : 0)));
        let y = Math.floor(Math.random() * (6 - (o === 'v' ? l : 0)));

        if (!layout.some(b => checkCollision(x, y, l, o, b))) {
            // Evita di bloccare l'uscita nei primissimi livelli
            if (currentLvl < 3 && x > 3 && o === 'v') continue;
            layout.push({ x, y, l, o, k: false });
        }
    }

    initialLayout = JSON.parse(JSON.stringify(layout));
    blocks = layout;
    render();
    updateUI();
    startTimer();
}

function render() {
    grid.innerHTML = '';
    blocks.forEach((b, i) => {
        const div = document.createElement('div');
        div.className = `block ${b.k ? 'block-key' : (b.o === 'h' ? 'block-h' : 'block-v')}`;
        div.style.width = (b.o === 'h' ? b.l * cellSize : cellSize) - 8 + 'px';
        div.style.height = (b.o === 'v' ? b.l * cellSize : cellSize) - 8 + 'px';
        div.style.left = b.x * cellSize + 4 + 'px';
        div.style.top = b.y * cellSize + 4 + 'px';
        if(b.k) div.innerHTML = '🔑';

        div.onpointerdown = (e) => {
            div.setPointerCapture(e.pointerId);
            let startCoord = b.o === 'h' ? e.clientX : e.clientY;
            let startPos = b.o === 'h' ? b.x : b.y;

            div.onpointermove = (em) => {
                let currentCoord = b.o === 'h' ? em.clientX : em.clientY;
                let diff = Math.round((currentCoord - startCoord) / cellSize);
                let target = startPos + diff;

                if (canMoveTo(i, target)) {
                    if (b.o === 'h') b.x = target; else b.y = target;
                    div.style.left = b.x * cellSize + 4 + 'px';
                    div.style.top = b.y * cellSize + 4 + 'px';
                }
            };

            div.onpointerup = () => {
                div.onpointermove = null;
                moves++;
                document.getElementById('moves').innerText = moves;
                if (b.k && b.x === 4) handleWin();
            };
        };
        grid.appendChild(div);
    });
}

function canMoveTo(idx, val) {
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

function useHint() {
    if (xp < 20) {
        alert("Non hai abbastanza XP!");
        return;
    }
    
    // Trova un blocco che può muoversi
    for (let i = 0; i < blocks.length; i++) {
        let b = blocks[i];
        let originalPos = b.o === 'h' ? b.x : b.y;
        if (canMoveTo(i, originalPos + 1) || canMoveTo(i, originalPos - 1)) {
            xp -= 20;
            localStorage.setItem('mk_xp_wood', xp);
            updateUI();
            
            // Evidenzia il blocco
            const el = grid.children[i];
            el.classList.add('block-hint');
            setTimeout(() => el.classList.remove('block-hint'), 1000);
            return;
        }
    }
}

function handleWin() {
    clearInterval(timerInterval);
    xp += 25;
    currentLvl++;
    localStorage.setItem('mk_xp_wood', xp);
    localStorage.setItem('mk_lvl_wood', currentLvl);
    
    setTimeout(() => {
        alert("LIVELLO COMPLETATO! +25 XP");
        generateLevel();
    }, 200);
}

function startTimer() {
    timerInterval = setInterval(() => {
        seconds++;
        let m = Math.floor(seconds / 60);
        let s = seconds % 60;
        document.getElementById('timer').innerText = `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
    }, 1000);
}

function resetCurrentLevel() {
    blocks = JSON.parse(JSON.stringify(initialLayout));
    moves = 0;
    render();
    updateUI();
}

generateLevel();
