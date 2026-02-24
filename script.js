const grid = document.getElementById('grid');
const cellSize = 50;
let state = {
    lvl: parseInt(localStorage.getItem('mk_lvl')) || 1,
    xp: parseInt(localStorage.getItem('mk_xp')) || 0,
    blocks: []
};

// 1. Verifica collisioni REALE (impedisce sovrapposizione)
function canMove(idx, newPos) {
    const b = state.blocks[idx];
    const isH = b.o === 'h';
    
    // Confini della griglia (6x6)
    if (newPos < 0 || newPos + b.l > 6) return false;

    // Controllo contro TUTTI gli altri blocchi
    for (let i = 0; i < state.blocks.length; i++) {
        if (i === idx) continue;
        const other = state.blocks[i];
        
        // Calcolo coordinate ipotetiche del pezzo che si muove
        const bX = isH ? newPos : b.x;
        const bY = isH ? b.y : newPos;
        const bW = isH ? b.l : 1;
        const bH = isH ? 1 : b.l;

        // Coordinate dell'altro pezzo
        const oX = other.x;
        const oY = other.y;
        const oW = other.o === 'h' ? other.l : 1;
        const oH = other.o === 'v' ? other.l : 1;

        // Algoritmo di collisione AABB (Standard per i giochi)
        if (bX < oX + oW && bX + bW > oX && bY < oY + oH && bY + bH > oY) {
            return false; // C'è un blocco sulla strada!
        }
    }
    return true;
}

// 2. Generatore di livelli bilanciato
function generateLevel() {
    grid.innerHTML = '';
    // La Chiave Gold (sempre riga 2)
    let layout = [{x: 0, y: 2, l: 2, o: 'h', k: true}];
    
    // Numero di pezzi cresce col livello: da 5 a 12
    let pieceCount = Math.min(5 + Math.floor(state.lvl / 2), 12);

    for (let i = 0; i < pieceCount; i++) {
        let attempts = 0;
        while (attempts < 100) {
            attempts++;
            let l = Math.random() > 0.8 ? 3 : 2;
            let o = Math.random() > 0.5 ? 'h' : 'v';
            let x = Math.floor(Math.random() * (6 - (o === 'h' ? l : 0)));
            let y = Math.floor(Math.random() * (6 - (o === 'v' ? l : 0)));

            // REGOLE DI ACCESSIBILITÀ:
            // Non permettiamo pezzi verticali che bloccano l'uscita a destra (x=5)
            if (o === 'v' && x === 5) continue;
            // Non permettiamo pezzi che si sovrappongono alla nascita
            if (!checkOverlap(x, y, l, o, layout)) {
                layout.push({x, y, l, o, k: false});
                break;
            }
        }
    }
    state.blocks = layout;
    render();
}

function checkOverlap(x, y, l, o, currentBlocks) {
    const w = o === 'h' ? l : 1;
    const h = o === 'v' ? l : 1;
    return currentBlocks.some(b => {
        const oW = b.o === 'h' ? b.l : 1;
        const oH = b.o === 'v' ? b.l : 1;
        return x < b.x + oW && x + w > b.x && y < b.y + oH && y + h > b.y;
    });
}

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
            let startClient = b.o === 'h' ? e.clientX : e.clientY;
            let startCoord = b.o === 'h' ? b.x : b.y;

            div.onpointermove = (em) => {
                let delta = Math.round(((b.o === 'h' ? em.clientX : em.clientY) - startClient) / cellSize);
                let target = startCoord + delta;
                
                // Muove il pezzo solo se la strada è libera da ALTRI blocchi
                if (canMove(i, target)) {
                    if (b.o === 'h') b.x = target; else b.y = target;
                    div.style.left = b.x * cellSize + 'px';
                    div.style.top = b.y * cellSize + 'px';
                }
            };
            div.onpointerup = () => {
                div.onpointermove = null;
                // Vittoria se la chiave tocca il bordo destro
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
    localStorage.setItem('mk_xp', state.xp);
    localStorage.setItem('mk_lvl', state.lvl);
    alert("LIVELLO COMPLETATO!");
    generateLevel();
}

generateLevel();
