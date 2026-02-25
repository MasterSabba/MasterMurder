const grid = document.getElementById("grid");
const cellSize = 50; // Dimensione di una cella singola

let level = 1;
let moves = 0;
let seconds = 0;
let timerInterval;
let blocks = [];
let initialPos = [];

// Funzione che fa partire il tempo
function startTimer() {
    clearInterval(timerInterval); // Azzera timer precedenti
    seconds = 0;
    timerInterval = setInterval(() => {
        seconds++;
        let min = Math.floor(seconds / 60).toString().padStart(2, '0');
        let sec = (seconds % 60).toString().padStart(2, '0');
        document.getElementById("timer").innerText = `${min}:${sec}`;
    }, 1000);
}

// Genera un nuovo livello garantendo che i pezzi non si sovrappongano
function generateLevel() {
    // La chiave d'oro è sempre in posizione (0, 2)
    blocks = [{ x: 0, y: 2, l: 2, o: 'h', k: true }];
    
    let pieceCount = 4 + Math.min(level, 8); // Aumenta la difficoltà con i livelli

    for (let i = 0; i < pieceCount; i++) {
        let attempts = 0;
        while (attempts < 100) {
            attempts++;
            let l = Math.random() > 0.8 ? 3 : 2; // Lunghezza del pezzo
            let o = Math.random() > 0.5 ? 'h' : 'v'; // Orientamento
            let x = Math.floor(Math.random() * (6 - (o === 'h' ? l : 0)));
            let y = Math.floor(Math.random() * (6 - (o === 'v' ? l : 0)));

            // Controlla che non ci siano collisioni prima di piazzare
            if (!checkCollision(x, y, l, o, -1)) {
                blocks.push({ x, y, l, o, k: false });
                break;
            }
        }
    }
    initialPos = JSON.parse(JSON.stringify(blocks)); // Salva per il reset
    moves = 0;
    updateUI();
    startTimer();
    render();
}

// Funzione che blocca i pezzi se vanno a sbattere
function checkCollision(x, y, l, o, ignoreIdx) {
    const w = o === 'h' ? l : 1;
    const h = o === 'v' ? l : 1;

    // Confini della griglia 6x6
    if (x < 0 || x + w > 6 || y < 0 || y + h > 6) return true;

    // Collisione con altri pezzi
    return blocks.some((b, i) => {
        if (i === ignoreIdx) return false;
        const bw = b.o === 'h' ? b.l : 1;
        const bh = b.o === 'v' ? b.l : 1;
        return x < b.x + bw && x + w > b.x && y < b.y + bh && y + h > b.y;
    });
}

// Disegna i blocchi nel HTML
function render() {
    grid.innerHTML = '';
    blocks.forEach((b, i) => {
        const div = document.createElement("div");
        div.className = `block ${b.k ? 'block-key' : ''}`;
        div.style.width = (b.o === 'h' ? b.l * cellSize : cellSize) - 6 + "px";
        div.style.height = (b.o === 'v' ? b.l * cellSize : cellSize) - 6 + "px";
        div.style.left = b.x * cellSize + 3 + "px";
        div.style.top = b.y * cellSize + 3 + "px";

        // Gestione movimento
        div.onpointerdown = (e) => {
            div.setPointerCapture(e.pointerId);
            let lastX = e.clientX, lastY = e.clientY;

            div.onpointermove = (em) => {
                let dx = em.clientX - lastX;
                let dy = em.clientY - lastY;
                let step = b.o === 'h' ? dx : dy;

                // Muovi solo se trascini per almeno metà cella
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
                // Vittoria!
                if (b.k && b.x === 4) {
                    clearInterval(timerInterval);
                    alert(`Vinto in ${seconds} secondi e ${moves} mosse!`);
                    level++;
                    generateLevel();
                }
            };
        };
        grid.appendChild(div);
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
        key.style.filter = "brightness(2)"; // Fa brillare la chiave
        setTimeout(() => key.style.filter = "none", 800);
    }
}

// Inizio gioco
generateLevel();
