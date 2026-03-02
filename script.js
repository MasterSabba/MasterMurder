/* VARIABILI GLOBALI */
const cellSize = 50; // Ogni cella della griglia è 50x50 pixel
let grid, levelDisp, movesDisp, xpDisp, timerDisp;

// Carichiamo i dati salvati (Livello e XP) dal browser, o partiamo da 1 e 0
let level = parseInt(localStorage.getItem('mk_level')) || 1;
let xp = parseInt(localStorage.getItem('mk_xp')) || 0;
let moves = 0;
let seconds = 0;
let timerInterval;
let blocks = []; // Qui salviamo i dati dei blocchi (posizione e dimensione)
let initialPos = []; // Qui salviamo lo stato iniziale del livello per il Reset

/* AVVIO DEL GIOCO */
// Aspetta che tutta la pagina HTML sia caricata prima di eseguire il codice
window.addEventListener('DOMContentLoaded', () => {
    // Colleghiamo le variabili agli elementi dell'HTML tramite ID
    grid = document.getElementById("grid");
    levelDisp = document.getElementById("level");
    xpDisp = document.getElementById("xp");
    movesDisp = document.getElementById("moves");
    timerDisp = document.getElementById("timer");

    // Avviamo la generazione del primo livello
    generateLevel();
});

/* GENERATORE DI LIVELLI */
function generateLevel() {
    // 1. Definiamo la chiave d'oro (x:0, y:2, lunghezza:2, orizzontale:h, chiave:true)
    blocks = [{ x: 0, y: 2, l: 2, o: 'h', k: true }];
    
    // 2. Aggiungiamo blocchi casuali (il numero aumenta col livello)
    let count = 4 + Math.min(level, 6);
    for (let i = 0; i < count; i++) {
        let attempts = 0;
        while (attempts < 100) { // Prova a posizionare il blocco 100 volte
            attempts++;
            let l = Math.random() > 0.8 ? 3 : 2; // Lunghezza 2 o 3 celle
            let o = Math.random() > 0.5 ? 'h' : 'v'; // h = orizzontale, v = verticale
            let x = Math.floor(Math.random() * (6 - (o === 'h' ? l : 0)));
            let y = Math.floor(Math.random() * (6 - (o === 'v' ? l : 0)));

            // Controlla che il nuovo blocco non si sovrapponga a quelli esistenti
            if (!checkCollision(x, y, l, o, -1)) {
                blocks.push({ x, y, l, o, k: false });
                break; // Blocco posizionato con successo
            }
        }
    }
    
    // Salviamo la posizione di partenza e resettiamo le statistiche
    initialPos = JSON.parse(JSON.stringify(blocks)); 
    moves = 0;
    updateUI();
    startTimer();
    render(); // <--- Questa funzione crea fisicamente i blocchi a video
}

/* LOGICA DELLE COLLISIONI */
function checkCollision(x, y, l, o, ignoreIdx) {
    const w = o === 'h' ? l : 1;
    const h = o === 'v' ? l : 1;
    
    // Controlla se il blocco esce dalla griglia 6x6
    if (x < 0 || x + w > 6 || y < 0 || y + h > 6) return true;

    // Controlla se il blocco sbatte contro un altro blocco
    return blocks.some((b, i) => {
        if (i === ignoreIdx) return false;
        const bw = b.o === 'h' ? b.l : 1;
        const bh = b.o === 'v' ? b.l : 1;
        // Matematica dei rettangoli: si stanno toccando?
        return x < b.x + bw && x + w > b.x && y < b.y + bh && y + h > b.y;
    });
}

/* DISEGNO DEI BLOCCHI (Il pezzo mancante!) */
function render() {
    if (!grid) return; // Se la griglia non esiste, fermati per evitare errori
    
    grid.innerHTML = ''; // Svuota la griglia da vecchi blocchi
    
    blocks.forEach((b, i) => {
        // Creiamo un nuovo elemento "div" per il blocco
        const div = document.createElement("div");
        div.className = `block ${b.k ? 'block-key' : ''}`;
        
        // Calcoliamo la dimensione in pixel
        const w = (b.o === 'h' ? b.l * cellSize : cellSize) - 6;
        const h = (b.o === 'v' ? b.l * cellSize : cellSize) - 6;
        
        // Applichiamo lo stile (Posizione e Grandezza)
        div.style.width = w + "px";
        div.style.height = h + "px";
        div.style.left = b.x * cellSize + 3 + "px";
        div.style.top = b.y * cellSize + 3 + "px";

        /* MOVIMENTO TRASCINABILE (Mouse e Touch) */
        div.onpointerdown = (e) => {
            div.setPointerCapture(e.pointerId); // Blocca il mouse sul pezzo
            let lastX = e.clientX, lastY = e.clientY;

            div.onpointermove = (em) => {
                let dx = em.clientX - lastX;
                let dy = em.clientY - lastY;
                let move = b.o === 'h' ? dx : dy;

                // Se trasciniamo il pezzo per più di mezza cella...
                if (Math.abs(move) >= cellSize / 2) {
                    let dir = Math.sign(move); // 1 per avanti, -1 per indietro
                    let nx = b.x + (b.o === 'h' ? dir : 0);
                    let ny = b.y + (b.o === 'v' ? dir : 0);

                    // Muovi il pezzo solo se la strada è libera
                    if (!checkCollision(nx, ny, b.l, b.o, i)) {
                        b.x = nx; b.y = ny;
                        lastX = em.clientX; lastY = em.clientY;
                        moves++;
                        updateUI();
                        // Aggiorna la posizione visiva istantaneamente
                        div.style.left = b.x * cellSize + 3 + "px";
                        div.style.top = b.y * cellSize + 3 + "px";
                    }
                }
            };
            
            div.onpointerup = () => {
                div.onpointermove = null; // Rilascia il pezzo
                // Se la chiave d'oro arriva all'uscita (x=4)
                if (b.k && b.x === 4) {
                    alert("LIVELLO COMPLETATO!");
                    level++; xp += 100;
                    saveData(); // Salva i progressi
                    generateLevel();
                }
            };
        };
        
        // INFINE: Aggiungiamo il pezzo creato dentro la griglia HTML
        grid.appendChild(div);
    });
}

/* FUNZIONI DI SERVIZIO */
function startTimer() {
    clearInterval(timerInterval);
    seconds = 0;
    timerInterval = setInterval(() => {
        seconds++;
        let m = Math.floor(seconds / 60).toString().padStart(2, '0');
        let s = (seconds % 60).toString().padStart(2, '0');
        timerDisp.innerText = `${m}:${s}`;
    }, 1000);
}

function updateUI() {
    levelDisp.innerText = level;
    xpDisp.innerText = xp;
    movesDisp.innerText = moves;
}

function resetLevel() {
    blocks = JSON.parse(JSON.stringify(initialPos));
    moves = 0;
    updateUI();
    render();
}

function saveData() {
    localStorage.setItem('mk_level', level);
    localStorage.setItem('mk_xp', xp);
}

function useHint() {
    const key = document.querySelector('.block-key');
    if(key) {
        key.style.filter = "brightness(2)";
        setTimeout(() => key.style.filter = "none", 800);
    }
}
