const cellSize = 50;
let grid, levelDisp, movesDisp, xpDisp, timerDisp;

let level = parseInt(localStorage.getItem('mk_level')) || 1;
let xp = parseInt(localStorage.getItem('mk_xp')) || 0;
let moves = 0;
let seconds = 0;
let timerInterval;
let blocks = [];
let initialPos = [];
let isDragging = false; // Impedisce di muovere due pezzi insieme

window.addEventListener('DOMContentLoaded', () => {
    grid = document.getElementById("grid");
    levelDisp = document.getElementById("level");
    xpDisp = document.getElementById("xp");
    movesDisp = document.getElementById("moves");
    timerDisp = document.getElementById("timer");
    generateLevel();
});

function generateLevel() {
    blocks = [{ x: 0, y: 2, l: 2, o: 'h', k: true }];
    let count = 4 + Math.min(level, 6);
    for (let i = 0; i < count; i++) {
        let attempts = 0;
        while (attempts < 50) {
            attempts++;
            let l = Math.random() > 0.7 ? 3 : 2;
            let o = Math.random() > 0.5 ? 'h' : 'v';
            let x = Math.floor(Math.random() * (6 - (o === 'h' ? l : 1)));
            let y = Math.floor(Math.random() * (6 - (o === 'v' ? l : 1)));
            if (o === 'h' && y === 2) continue;
            if (!checkCollision(x, y, l, o, -1)) {
                blocks.push({ x, y, l, o, k: false });
                break;
            }
        }
    }
    initialPos = JSON.parse(JSON.stringify(blocks)); 
    moves = 0;
    updateUI();
    startTimer();
    render();
}

function checkCollision(x, y, l, o, ignoreIdx) {
    const w = o === 'h' ? l : 1;
    const h = o === 'v' ? l : 1;
    if (x < 0 || x + w > 6 || y < 0 || y + h > 6) return true;
    return blocks.some((b, i) => {
        if (i === ignoreIdx) return false;
        const bw = b.o === 'h' ? b.l : 1;
        const bh = b.o === 'v' ? b.l : 1;
        return x < b.x + bw && x + w > b.x && y < b.y + bh && y + h > b.y;
    });
}

function render() {
    if (!grid) return;
    grid.innerHTML = '';
    blocks.forEach((b, i) => {
        const div = document.createElement("div");
        div.className = `block ${b.k ? 'block-key' : ''}`;
        div.style.width = (b.o === 'h' ? b.l * cellSize : cellSize) - 6 + "px";
        div.style.height = (b.o === 'v' ? b.l * cellSize : cellSize) - 6 + "px";
        div.style.left = (b.x * cellSize + 3) + "px";
        div.style.top = (b.y * cellSize + 3) + "px";

        div.onpointerdown = (e) => {
            if (isDragging) return; // Se sto già trascinando, ignora altri tocchi
            isDragging = true;
            
            div.setPointerCapture(e.pointerId);
            let startX = e.clientX;
            let startY = e.clientY;
            let origX = b.x;
            let origY = b.y;

            div.onpointermove = (em) => {
                let dx = Math.round((em.clientX - startX) / cellSize);
                let dy = Math.round((em.clientY - startY) / cellSize);
                
                let targetPos = (b.o === 'h' ? origX + dx : origY + dy);
                let currentPos = (b.o === 'h' ? b.x : b.y);
                
                // Muovi il blocco un passo alla volta per controllare le collisioni nel mezzo
                while (currentPos !== targetPos) {
                    let step = targetPos > currentPos ? 1 : -1;
                    let nextX = b.x + (b.o === 'h' ? step : 0);
                    let nextY = b.y + (b.o === 'v' ? step : 0);
                    
                    if (!checkCollision(nextX, nextY, b.l, b.o, i)) {
                        b.x = nextX;
                        b.y = nextY;
                        currentPos += step;
                        moves++;
                        updateUI();
                    } else {
                        break; // Stop se c'è un ostacolo
                    }
                }
                
                div.style.left = (b.x * cellSize + 3) + "px";
                div.style.top = (b.y * cellSize + 3) + "px";
            };
            
            div.onpointerup = () => {
                div.onpointermove = null;
                isDragging = false;
                if (b.k && b.x >= 4) {
                    alert("Ottimo! Livello superato.");
                    level++; xp += 100;
                    saveData();
                    generateLevel();
                }
            };
        };
        grid.appendChild(div);
    });
}

function updateUI() {
    if(levelDisp) levelDisp.innerText = level;
    if(xpDisp) xpDisp.innerText = xp;
    if(movesDisp) movesDisp.innerText = moves;
}

function startTimer() {
    clearInterval(timerInterval);
    seconds = 0;
    timerInterval = setInterval(() => {
        seconds++;
        let m = Math.floor(seconds / 60).toString().padStart(2, '0');
        let s = (seconds % 60).toString().padStart(2, '0');
        if(timerDisp) timerDisp.innerText = `${m}:${s}`;
    }, 1000);
}

function saveData() {
    localStorage.setItem('mk_level', level);
    localStorage.setItem('mk_xp', xp);
}

function resetLevel() {
    blocks = JSON.parse(JSON.stringify(initialPos));
    moves = 0;
    isDragging = false;
    updateUI();
    render();
}

function useHint() {
    const key = document.querySelector('.block-key');
    if(key) {
        key.style.filter = "brightness(1.5)";
        setTimeout(() => key.style.filter = "none", 500);
    }
}
