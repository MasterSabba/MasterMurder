const grid = document.getElementById('grid');
const cellSize = 52;

let state = {
    xp: parseInt(localStorage.getItem('mk_xp')) || 0,
    lvl: parseInt(localStorage.getItem('mk_lvl')) || 1,
    blocks: [], initial: []
};

function init() {
    updateUI();
    generateLevel();
}

function generateLevel() {
    let layout = [{x: 0, y: 2, l: 2, o: 'h', k: true}];
    
    // DIFFICOLTÀ: 
    // Inizio soft (5 pezzi), poi aumenta ogni 2 livelli fino a un max di 13 pezzi.
    let pieceCount = Math.min(5 + Math.floor(state.lvl / 2), 13);

    for(let i=0; i < pieceCount; i++) {
        let attempts = 0;
        while(attempts < 300) {
            attempts++;
            let l = Math.random() > 0.8 ? 3 : 2;
            let o = Math.random() > 0.5 ? 'h' : 'v';
            let x = Math.floor(Math.random() * (6 - (o === 'h' ? l : 0)));
            let y = Math.floor(Math.random() * (6 - (o === 'v' ? l : 0)));

            // Lascia sempre un "buco" libero (almeno 4 celle vuote totali)
            if(!layout.some(b => checkCollision(x, y, l, o, b))) {
                layout.push({x, y, l, o, k: false});
                break;
            }
        }
    }
    state.blocks = layout;
    state.initial = JSON.parse(JSON.stringify(layout));
    render();
}

function render() {
    grid.innerHTML = '';
    state.blocks.forEach((b, i) => {
        const div = document.createElement('div');
        div.className = `block ${b.k ? 'block-key' : (b.o === 'h' ? 'block-h' : 'block-v')}`;
        div.style.width = (b.o === 'h' ? b.l * cellSize : cellSize) - 8 + 'px';
        div.style.height = (b.o === 'v' ? b.l * cellSize : cellSize) - 8 + 'px';
        div.style.left = b.x * cellSize + 4 + 'px';
        div.style.top = b.y * cellSize + 4 + 'px';

        div.onpointerdown = (e) => {
            div.setPointerCapture(e.pointerId);
            let start = b.o === 'h' ? e.clientX : e.clientY;
            let pos = b.o === 'h' ? b.x : b.y;

            div.onpointermove = (em) => {
                let delta = Math.round(((b.o === 'h' ? em.clientX : em.clientY) - start) / cellSize);
                let target = pos + delta;
                if(canMove(i, target)) {
                    if(b.o === 'h') b.x = target; else b.y = target;
                    div.style.left = b.x * cellSize + 4 + 'px';
                    div.style.top = b.y * cellSize + 4 + 'px';
                }
            };
            div.onpointerup = () => {
                if(b.k && b.x === 4) win();
            };
        };
        grid.appendChild(div);
    });
}

function canMove(idx, val) {
    const b = state.blocks[idx];
    if(val < 0 || val + b.l > 6) return false;
    return !state.blocks.some((other, i) => {
        if(i === idx) return false;
        let nx = b.o === 'h' ? val : b.x;
        let ny = b.o === 'v' ? val : b.y;
        return nx < other.x + (other.o === 'h' ? other.l : 1) &&
               nx + (b.o === 'h' ? b.l : 1) > other.x &&
               ny < other.y + (other.o === 'v' ? other.l : 1) &&
               ny + (b.o === 'v' ? b.l : 1) > other.y;
    });
}

function checkCollision(x, y, l, o, other) {
    let w = o === 'h' ? l : 1, h = o === 'v' ? l : 1;
    let ow = other.o === 'h' ? other.l : 1, oh = other.o === 'v' ? other.l : 1;
    return x < other.x + ow && x + w > other.x && y < other.y + oh && y + h > other.y;
}

function win() {
    state.xp += 100 * state.lvl;
    state.lvl += 1;
    localStorage.setItem('mk_xp', state.xp);
    localStorage.setItem('mk_lvl', state.lvl);
    alert("RISOLTO! +XP");
    generateLevel();
    updateUI();
}

function updateUI() {
    document.getElementById('lvl-val').innerText = state.lvl;
    document.getElementById('xp-val').innerText = state.xp.toLocaleString();
}

function resetLevel() {
    state.blocks = JSON.parse(JSON.stringify(state.initial));
    render();
}

function useHint() {
    const key = document.querySelector('.block-key');
    key.style.filter = "brightness(1.5)";
    setTimeout(() => key.style.filter = "", 1000);
}

init();
