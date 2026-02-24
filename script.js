const grid = document.getElementById('grid');
const cellSize = 50;
let state = {
    lvl: parseInt(localStorage.getItem('mk_lvl')) || 1,
    xp: parseInt(localStorage.getItem('mk_xp')) || 0,
    blocks: [], initial: []
};

function checkCollision(x, y, l, o, ignoreIdx) {
    const w = o === 'h' ? l : 1;
    const h = o === 'v' ? l : 1;
    if (x < 0 || x + w > 6 || y < 0 || y + h > 6) return true;
    return state.blocks.some((b, i) => {
        if (i === ignoreIdx) return false;
        const bw = b.o === 'h' ? b.l : 1;
        const bh = b.o === 'v' ? b.l : 1;
        return x < b.x + bw && x + w > b.x && y < b.y + bh && y + h > b.y;
    });
}

function generateLevel() {
    let layout = [{x: 0, y: 2, l: 2, o: 'h', k: true}];
    let count = Math.min(4 + Math.floor(state.lvl / 2), 11);
    for (let i = 0; i < count; i++) {
        let attempts = 0;
        while (attempts < 150) {
            attempts++;
            let l = Math.random() > 0.8 ? 3 : 2;
            let o = Math.random() > 0.5 ? 'h' : 'v';
            let x = Math.floor(Math.random() * (6 - (o === 'h' ? l : 0)));
            let y = Math.floor(Math.random() * (6 - (o === 'v' ? l : 0)));
            if (!checkCollision(x, y, l, o, -1)) {
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
        div.className = `block ${b.k ? 'block-key' : ''}`;
        div.style.width = (b.o === 'h' ? b.l * cellSize : cellSize) + 'px';
        div.style.height = (b.o === 'v' ? b.l * cellSize : cellSize) + 'px';
        div.style.left = b.x * cellSize + 'px';
        div.style.top = b.y * cellSize + 'px';

        div.onpointerdown = (e) => {
            div.setPointerCapture(e.pointerId);
            let lastX = e.clientX;
            let lastY = e.clientY;

            div.onpointermove = (em) => {
                let dx = em.clientX - lastX;
                let dy = em.clientY - lastY;
                
                // Se lo spostamento supera metà cella, proviamo a muoverci
                if (Math.abs(b.o === 'h' ? dx : dy) >= cellSize / 2) {
                    let dir = (b.o === 'h' ? dx : dy) > 0 ? 1 : -1;
                    let nextX = b.x + (b.o === 'h' ? dir : 0);
                    let nextY = b.y + (b.o === 'v' ? dir : 0);

                    if (!checkCollision(nextX, nextY, b.l, b.o, i)) {
                        b.x = nextX;
                        b.y = nextY;
                        div.style.left = b.x * cellSize + 'px';
                        div.style.top = b.y * cellSize + 'px';
                        lastX = em.clientX;
                        lastY = em.clientY;
                    }
                }
            };
            div.onpointerup = () => {
                div.onpointermove = null;
                if (b.k && b.x === 4) {
                    win();
                }
            };
        };
        grid.appendChild(div);
    });
}

function win() {
    state.lvl++; state.xp += 100;
    localStorage.setItem('mk_lvl', state.lvl);
    localStorage.setItem('mk_xp', state.xp);
    document.getElementById('lvl').innerText = state.lvl;
    document.getElementById('xp').innerText = state.xp;
    alert("VINTO!");
    generateLevel();
}

function resetLevel() {
    state.blocks = JSON.parse(JSON.stringify(state.initial));
    render();
}

generateLevel();
