const grid = document.getElementById('grid');
const cellSize = 50;
let state = {
    lvl: parseInt(localStorage.getItem('mk_lvl')) || 1,
    xp: parseInt(localStorage.getItem('mk_xp')) || 0,
    blocks: [],
    initial: []
};

// Carica dati iniziali
document.getElementById('lvl').innerText = state.lvl;
document.getElementById('xp').innerText = state.xp;

// 1. Logica Collisioni Rigida
function isColliding(x, y, l, o, ignoreIdx) {
    const w = o === 'h' ? l : 1;
    const h = o === 'v' ? l : 1;

    // Confini griglia
    if (x < 0 || x + w > 6 || y < 0 || y + h > 6) return true;

    // Controllo contro altri blocchi
    return state.blocks.some((b, i) => {
        if (i === ignoreIdx) return false;
        const bw = b.o === 'h' ? b.l : 1;
        const bh = b.o === 'v' ? b.l : 1;
        return x < b.x + bw && x + w > b.x && y < b.y + bh && y + h > b.y;
    });
}

// 2. Generatore di livelli (Cresce con il livello)
function generateLevel() {
    let layout = [{x: 0, y: 2, l: 2, o: 'h', k: true}]; // La Chiave
    let pieces = Math.min(4 + Math.floor(state.lvl / 2), 11);

    for (let i = 0; i < pieces; i++) {
        let attempts = 0;
        while (attempts < 150) {
            attempts++;
            let l = Math.random() > 0.8 ? 3 : 2;
            let o = Math.random() > 0.5 ? 'h' : 'v';
            let x = Math.floor(Math.random() * (6 - (o === 'h' ? l : 0)));
            let y = Math.floor(Math.random() * (6 - (o === 'v' ? l : 0)));

            // Evita di bloccare l'uscita in modo permanente a destra
            if (o === 'v' && x === 5) continue;

            if (!isColliding(x, y, l, o, -1)) {
                layout.push({x, y, l, o, k: false});
                break;
            }
        }
    }
    state.blocks = layout;
    state.initial = JSON.parse(JSON.stringify(layout));
    render();
}

// 3. Renderizzazione e Input
function render() {
    grid.innerHTML = '';
    state.blocks.forEach((b, i) => {
        const div = document.createElement('div');
        div.className = `block ${b.k ? 'block-key' : ''}`;
        div.style.width = (b.o === 'h' ? b.l * cellSize : cellSize) + 'px';
        div.style.height = (b.o === 'v' ? b.l * cellSize : cellSize) + 'px';
        div.style.left = b.x * cellSize + 'px';
        div.style.top = b.y * cellSize + 'px';

        div.onpointerdown = (e) => {
            div.setPointerCapture(e.pointerId);
            let startX = e.clientX;
            let startY = e.clientY;
            let origX = b.x;
            let origY = b.y;

            div.onpointermove = (em) => {
                let dx = Math.round((em.clientX - startX) / cellSize);
                let dy = Math.round((em.clientY - startY) / cellSize);
                
                let targetX = b.o === 'h' ? origX + dx : b.x;
                let targetY = b.o === 'v' ? origY + dy : b.y;

                // Controllo collisione prima di muovere
                if (!isColliding(targetX, targetY, b.l, b.o, i)) {
                    b.x = targetX;
                    b.y = targetY;
                    div.style.left = b.x * cellSize + 'px';
                    div.style.top = b.y * cellSize + 'px';
                }
            };

            div.onpointerup = () => {
                div.onpointermove = null;
                // Vittoria!
                if (b.k && b.x === 4) {
                    win();
                }
            };
        };
        grid.appendChild(div);
    });
}

function win() {
    state.xp += 100;
    state.lvl++;
    localStorage.setItem('mk_lvl', state.lvl);
    localStorage.setItem('mk_xp', state.xp);
    document.getElementById('lvl').innerText = state.lvl;
    document.getElementById('xp').innerText = state.xp;
    alert("NODO SBLOCCATO!");
    generateLevel();
}

function resetLevel() {
    state.blocks = JSON.parse(JSON.stringify(state.initial));
    render();
}

generateLevel();
