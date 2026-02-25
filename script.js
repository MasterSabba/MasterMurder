const grid = document.getElementById("grid");
const cellSize = 50; // Dimensione fissa per ogni cella

let level = 1;
let moves = 0;
let seconds = 0;
let timerInterval;
let blocks = [];
let initialPos = [];

// Funzione che gestisce il tempo
function updateTimer() {
    seconds++;
    let min = Math.floor(seconds / 60).toString().padStart(2, '0');
    let sec = (seconds % 60).toString().padStart(2, '0');
    document.getElementById("timer").innerText = `${min}:${sec}`;
}

// Genera i blocchi del livello
function generateLevel() {
    // Svuota tutto e resetta variabili
    clearInterval(timerInterval);
    seconds = 0;
    moves = 0;
    document.getElementById("timer").innerText = "00:00";
    
    // La chiave d'oro è il primo blocco (sempre orizzontale)
    blocks = [{ x: 0, y: 2, l: 2, o: 'h', k: true }];
    
    // Aggiunge altri blocchi in base al livello
    let count = 4 + Math.min(level, 8);
    for (let i = 0; i < count; i++) {
        let attempts = 0;
        while (attempts < 100) {
            attempts++;
            let l = Math.random() > 0.8 ? 3 : 2; // Lunghezza 2 o 3
            let o = Math.random() > 0.5 ? 'h' : 'v'; // h=orizzontale, v=verticale
            let x = Math.floor(Math.random() * (6 - (o === 'h' ? l : 0)));
            let y = Math.floor(Math.random() * (6 - (o === 'v' ? l : 0)));

            if (!checkCollision(x, y, l, o, -1)) {
                blocks.push({ x, y, l, o, k: false });
                break;
            }
        }
    }
    
    initialPos = JSON.parse(JSON.stringify(blocks)); // Salva per il reset
    updateUI();
    timerInterval = setInterval(updateTimer, 1000); // Fa partire il timer
    render(); // Disegna i blocchi
}

// Controlla se un movimento è possibile o se sbatte contro altri
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

// Questa funzione crea fisicamente i blocchi nel div "grid"
function render() {
    grid.innerHTML = ''; // Svuota la griglia precedente
    blocks.forEach((b, i) => {
        const div = document.createElement("div");
        div.className = `block ${b.k ? 'block-key' : ''}`;
        
        // Calcola dimensioni e posizione (togliendo 4px per il margine interno)
        div.style.width = (b.o === 'h' ? b.l * cellSize : cellSize) - 6 + "px";
        div.style.height = (b.o === 'v' ? b.l * cellSize : cellSize) - 6 + "px";
        div.style.left = b.x * cellSize + 3 + "px";
        div.style.top = b.y * cellSize + 3 + "px";

        // Gestione del trascinamento (Mouse e Touch)
        div.onpointerdown = (e) => {
            div.setPointerCapture(e.pointerId);
            let lastX = e.clientX, lastY = e.clientY;

            div.onpointermove = (em) => {
                let dx = em.clientX - lastX;
                let dy = em.clientY - lastY;
                let step = b.o === 'h' ? dx : dy;

                if (Math.abs(step) >= cellSize / 2) {
                    let dir = Math.sign(step);
                    let nx = b.x + (b.o === 'h' ? dir : 0);
                    let ny = b.y + (b.o === 'v' ? dir : 0);

                    if (!checkCollision(nx, ny, b.l, b.o, i)) {
                        b.x = nx; b.y = ny;
                        lastX = em.clientX; lastY = em.clientY;
                        moves++;
                        updateUI();
                        div.style.left = b.x * cellSize + 3 + "px";
                        div.style.top = b.y * cellSize + 3 + "px";
                    }
                }
            };
            div.onpointerup = () => {
                div.onpointermove = null;
                // Vittoria se la chiave tocca il bordo destro
                if (b.k && b.x === 4) {
                    clearInterval(timerInterval);
                    alert("Ottimo! Hai liberato la chiave!");
                    level++;
                    generateLevel();
                }
            };
        };
        grid.appendChild(div); // AGGIUNGE IL PEZZO ALLA GRIGLIA
    });
}

function updateUI() {
    document.getElementById("level").innerText = level;
    document.getElementById("moves").innerText = moves;
}

function resetLevel() {
    blocks = JSON.parse(JSON.stringify(initialPos));
    moves = 0;
    updateUI();
    render();
}

function useHint() {
    const key = document.querySelector('.block-key');
    if(key) {
        key.style.filter = "brightness(2)";
        setTimeout(() => key.style.filter = "none", 800);
    }
}

generateLevel(); // Avvia il gioco
