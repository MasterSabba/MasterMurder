let peer, conn;
let myRole = "";
let myWord = "";
let players = []; // {id, name, score, isBot}

const WORDS_DATABASE = [
    { secret: "Pizza", impostor: "Focaccia" },
    { secret: "Gatto", impostor: "Tigre" },
    { secret: "Computer", impostor: "Calcolatrice" }
];

// --- LOGICA SALVATAGGIO PUNTI (Local Storage) ---
function updateScore(playerName, points) {
    let scores = JSON.parse(localStorage.getItem('masterMurder_scores')) || {};
    scores[playerName] = (scores[playerName] || 0) + points;
    localStorage.setItem('masterMurder_scores', JSON.stringify(scores));
    renderScoreboard();
}

function renderScoreboard() {
    const list = document.getElementById('score-list');
    const scores = JSON.parse(localStorage.getItem('masterMurder_scores')) || {};
    list.innerHTML = Object.entries(scores)
        .map(([name, pts]) => `<li>${name}: ${pts} pt</li>`)
        .join('');
}

// --- MODALITÀ BOT ---
function startBotMode() {
    document.getElementById('setup-menu').classList.add('hidden');
    document.getElementById('game-screen').classList.remove('hidden');
    
    const game = WORDS_DATABASE[Math.floor(Math.random() * WORDS_DATABASE.length)];
    const isImpostor = Math.random() < 0.25;
    
    myRole = isImpostor ? "Impostore" : "Innocente";
    myWord = isImpostor ? game.impostor : game.secret;
    
    document.getElementById('role-display').innerHTML = `
        <h2>Sei: ${myRole}</h2>
        <p>La tua parola è: <strong>${myWord}</strong></p>
    `;

    // Simuliamo 3 bot
    for(let i=1; i<=3; i++) {
        players.push({ name: "Bot " + i, isBot: true });
    }
    renderScoreboard();
}

// --- MODALITÀ MULTIPLAYER (PEERJS) ---
function startMultiplayer() {
    document.getElementById('peer-info').classList.remove('hidden');
    peer = new Peer();

    peer.on('open', (id) => {
        document.getElementById('my-id').innerText = id;
    });

    peer.on('connection', (c) => {
        conn = c;
        setupChat();
        alert("Giocatore connesso!");
    });
}

function connectToHost() {
    const hostId = document.getElementById('join-id').value;
    conn = peer.connect(hostId);
    setupChat();
}

function setupChat() {
    conn.on('data', (data) => {
        addMessage("Compagno", data);
    });
}

function sendClue() {
    const input = document.getElementById('clue-input');
    const msg = input.value;
    if(!msg) return;

    addMessage("Tu", msg);
    if(conn) conn.send(msg);
    
    // Esempio: Se indovini o vinci round, salva punti
    updateScore("Giocatore1", 10); 
    input.value = "";
}

function addMessage(sender, text) {
    const chat = document.getElementById('chat-area');
    chat.innerHTML += `<p><strong>${sender}:</strong> ${text}</p>`;
    chat.scrollTop = chat.scrollHeight;
}

// Inizializza la classifica all'avvio
window.onload = renderScoreboard;
