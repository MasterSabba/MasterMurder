const grid = document.getElementById('grid');
const cellSize = 52;
let blocks = [];
let initialLayout = [];
let moves = 0;
let xp = parseInt(localStorage.getItem('mk_xp_full')) || 0;
let currentLvl = parseInt(localStorage.getItem('mk_lvl_full')) || 1;
let timerInterval;
let seconds = 0;

// Funzione per formattare il tempo
function formatTime(s) {
    let min = Math.floor(s / 60);
    let sec = s % 60;
    return `${min < 10 ? '0' : ''}${min}:${sec < 10 ? '0' : ''}${sec}`;
}

// Carica suono (usiamo frequenze sintetiche se non hai file audio)
const playSound = (freq, type = 'sine', duration = 0.1) => {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration);
};

function updateUI() {
    document.getElementById('lvl').innerText = currentLvl;
    document.getElementById('moves').innerText = moves;
    document.getElementById('progress-fill').style.width = (xp % 100) + "%";
    
    const ranks = ["WOOD NOVICE", "CARPENTER", "LOCKSMITH", "KEY MASTER", "LEGEND"];
    document.getElementById('rank-label').innerText = ranks[Math.min(Math.floor(xp/100), 4)];
}

function generateLevel() {
    moves = 0;
    seconds = 0;
    grid.innerHTML = '';
    
    // Difficoltà: aumenta ostacoli ogni 2 livelli
    let obstacleCount = 4 + Math.min(Math.floor(currentLvl / 2), 8);
    
    // Layout iniziale: La Chiave d'Oro
    let layout = [{ x: 0, y: 2, l: 2, o: 'h', k: true }];
    
    let attempts = 0;
    while (layout.length < obstacleCount && attempts < 500) {
        attempts++;
        let l = (currentLvl > 3 && Math.random() > 0.7) ? 3 : 2;
        let o = Math.random() > 0.5 ? 'h' : 'v';
        let x = Math.floor(Math.random() * (6 - (o === 'h' ? l : 0)));
        let y = Math.floor(Math.random() * (6 - (o === 'v' ? l : 0)));

        // Verifica che non si sovrapponga e non blocchi l'uscita immediata nei primi livelli
        if (!layout.some(b => checkCollision(x, y, l, o, b))) {
            if (o === 'v' && x > 1 && y <= 2 && y + l > 2 && currentLvl < 3) continue;
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
        const el = document.createElement('div');
        el.className = `block ${b.k ? 'block-key' : (b.o === 'h' ? 'block-h' : 'block-v')}`;
        el.style.width = (b.o === 'h' ? b.l * cellSize : cellSize) - 8 + 'px';
        el.style.height = (b.o === 'v' ? b.l * cellSize : cellSize) - 8 + 'px';
        el.style.left = b.x * cellSize + 4 + 'px';
        el.style.top = b.y * cellSize + 4 + 'px';
        if(b.k) el.innerHTML = '🔑';

        el.onpointerdown = (e) => {
            el.setPointerCapture(e.pointerId);
            let startCoord = b.o === 'h' ? e.clientX : e.clientY;
            let startPos = b.o === 'h' ? b.x : b.y;

            el.onpointermove = (em) => {
                let currentCoord = b.o === 'h' ? em.clientX : em.clientY;
                let diff = Math.round((currentCoord - startCoord) / cellSize);
                let target = startPos + diff;

                if (canMoveTo(i, target)) {
                    if (b.o === 'h') b.x = target; else b.y = target;
                    el.style.left = b.x * cellSize + 4 + 'px';
                    el.style.top = b.y * cellSize + 4 + 'px';
                }
            };

            el.onpointerup = () => {
                el.onpointermove = null;
                moves++;
                document.getElementById('moves').innerText = moves;
                playSound(200 + (moves * 10), 'triangle', 0.05);
                if (b.k && b.x === 4) handleWin();
            };
        };
        grid.appendChild(el);
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

function startTimer() {
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        seconds++;
        document.getElementById('timer').innerText = formatTime(seconds);
    }, 1000);
}

function handleWin() {
    clearInterval(timerInterval);
    playSound(600, 'sine', 0.3);
    xp += 20;
    currentLvl++;
    localStorage.setItem('mk_xp_full', xp);
    localStorage.setItem('mk_lvl_full', currentLvl);
    
    setTimeout(() => {
        alert(`VITTORIA! Tempo: ${formatTime(seconds)}`);
        generateLevel();
    }, 300);
}

function resetCurrentLevel() {
    blocks = JSON.parse(JSON.stringify(initialLayout));
    moves = 0;
    render();
    updateUI();
}

function toggleTheme() {
    document.body.classList.toggle('theme-light');
}

// Inizializzazione
generateLevel();
