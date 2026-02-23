const grid = document.getElementById('grid');
const cellSize = 52;
let state = {
    xp: 245300, lvl: 188, moves: 0,
    blocks: [], initial: []
};

function generateLevel() {
    // Generiamo 12 pezzi per avere la densità dell'immagine
    let layout = [{x: 0, y: 2, l: 2, o: 'h', k: true}];
    let count = 12;

    for(let i=0; i<count; i++) {
        let attempts = 0;
        while(attempts < 150) {
            attempts++;
            let l = Math.random() > 0.8 ? 3 : 2;
            let o = Math.random() > 0.5 ? 'h' : 'v';
            let x = Math.floor(Math.random() * (6 - (o === 'h' ? l : 0)));
            let y = Math.floor(Math.random() * (6 - (o === 'v' ? l : 0)));

            // Evitiamo blocchi impossibili davanti all'uscita
            if (o === 'v' && x > 3 && y === 2) continue;

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
        div.style.width = (b.o === 'h' ? b.l * cellSize : cellSize) - 4 + 'px';
        div.style.height = (b.o === 'v' ? b.l * cellSize : cellSize) - 4 + 'px';
        div.style.left = b.x * cellSize + 2 + 'px';
        div.style.top = b.y * cellSize + 2 + 'px';

        div.onpointerdown = (e) => {
            div.setPointerCapture(e.pointerId);
            let start = b.o === 'h' ? e.clientX : e.clientY;
            let origin = b.o === 'h' ? b.x : b.y;

            div.onpointermove = (em) => {
                let target = origin + Math.round(((b.o === 'h' ? em.clientX : em.clientY) - start) / cellSize);
                if(canMove(i, target)) {
                    if(b.o === 'h') b.x = target; else b.y = target;
                    div.style.left = b.x * cellSize + 2 + 'px';
                    div.style.top = b.y * cellSize + 2 + 'px';
                }
            };
            div.onpointerup = () => {
                state.moves++;
                document.getElementById('moves').innerText = state.moves;
                if(b.k && b.x === 4) alert("ACCESS GRANTED");
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

function resetLevel() { state.blocks = JSON.parse(JSON.stringify(state.initial)); render(); }
generateLevel();
