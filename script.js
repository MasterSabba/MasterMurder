let peer, connections = [];
let myName = "";
let isHost = false;
let gameState = { players: [], secretWord: "", impostorWord: "", impostorIndex: -1 };

// Database parole: Segreta vs Impostore
const WORD_PAIRS = [
    { s: "Pizza", i: "Focaccia" },
    { s: "Gatto", i: "Cane" },
    { s: "Smartphone", i: "Tablet" },
    { s: "Mare", i: "Piscina" }
];

function initPeer(asHost) {
    myName = document.getElementById('username').value || "Giocatore_" + Math.floor(Math.random()*100);
    isHost = asHost;
    peer = new Peer();

    peer.on('open', (id) => {
        if(isHost) {
            document.getElementById('my-id').innerText = id;
            document.getElementById('host-controls').classList.remove('hidden');
            addPlayerToLobby(myName, peer.id);
        } else {
            const hostId = document.getElementById('join-id').value;
            const conn = peer.connect(hostId);
            setupConnection(conn);
        }
    });

    peer.on('connection', (conn) => {
        setupConnection(conn);
    });
}

function setupConnection(conn) {
    connections.push(conn);
    conn.on('data', (data) => {
        if (data.type === "LOBBY_UPDATE") updateLobbyUI(data.players);
        if (data.type === "START_GAME") renderGame(data);
        if (data.type === "CLUE") addMessage(data.sender, data.text);
        if (data.type === "JOIN") {
            addPlayerToLobby(data.name, conn.peer);
            broadcast({ type: "LOBBY_UPDATE", players: gameState.players });
        }
    });

    conn.on('open', () => {
        if (!isHost) conn.send({ type: "JOIN", name: myName });
    });
}

function addPlayerToLobby(name, id) {
    gameState.players.push({ name, id });
    updateLobbyUI(gameState.players);
}

function updateLobbyUI(players) {
    const list = document.getElementById('lobby-list');
    list.innerHTML = players.map(p => `<li>${p.name} ✅</li>`).join('');
}

function startGame() {
    if (gameState.players.length < 2) return alert("Servono almeno 2 persone (o bot)!");
    
    const pair = WORD_PAIRS[Math.floor(Math.random() * WORD_PAIRS.length)];
    const impIndex = Math.floor(Math.random() * gameState.players.length);

    gameState.players.forEach((p, index) => {
        const payload = {
            type: "START_GAME",
            role: (index === impIndex) ? "IMPOSTORE" : "INNOCENTE",
            word: (index === impIndex) ? pair.i : pair.s
        };
        
        if (p.id === peer.id) renderGame(payload);
        else {
            const c = connections.find(conn => conn.peer === p.id);
            if(c) c.send(payload);
        }
    });
}

function renderGame(data) {
    document.getElementById('setup-menu').classList.add('hidden');
    document.getElementById('game-screen').classList.remove('hidden');
    document.getElementById('display-role').innerText = "Ruolo: " + data.role;
    document.getElementById('display-word').innerText = "Parola: " + data.word;
    
    // Salvataggio automatico partecipazione (Local Storage)
    let scores = JSON.parse(localStorage.getItem('masterMurder_scores')) || {};
    scores[myName] = (scores[myName] || 0) + 1; // 1 punto solo per aver iniziato
    localStorage.setItem('masterMurder_scores', JSON.stringify(scores));
    renderScoreboard();
}

function sendClue() {
    const val = document.getElementById('clue-input').value;
    if(!val) return;
    
    const msg = { type: "CLUE", sender: myName, text: val };
    addMessage("Tu", val);
    broadcast(msg);
    document.getElementById('clue-input').value = "";
}

function broadcast(data) {
    connections.forEach(c => c.send(data));
}

function addMessage(sender, text) {
    const chat = document.getElementById('chat-area');
    chat.innerHTML += `<p><strong>${sender}:</strong> ${text}</p>`;
    chat.scrollTop = chat.scrollHeight;
}

function renderScoreboard() {
    const list = document.getElementById('score-list');
    const scores = JSON.parse(localStorage.getItem('masterMurder_scores')) || {};
    list.innerHTML = Object.entries(scores)
        .sort((a,b) => b[1] - a[1])
        .map(([n, p]) => `<li>${n}: ${p} pt</li>`).join('');
}

window.onload = renderScoreboard;
