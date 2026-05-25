const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

// Preguntas integradas para evitar repetición
const boardData = [
  { n: "PLANNING", type: "start", q: "¡Inicio de Sprint! ¿Cuál es el objetivo principal?" },
  { n: "REFACTOR", type: "history", q: "¿Qué código nos está frenando hoy?" },
  { n: "DUDAS", type: "event", q: "¿Qué requerimiento sigue siendo ambiguo?" },
  { n: "CSS CURSED", type: "history", q: "¿Qué ajuste visual nos tomó demasiado tiempo?" },
  { n: "PO IDEA", type: "event", q: "¿Hubo cambios de alcance inesperados?" },
  { n: "BLOCKED", type: "jail", q: "¿Qué dependencia externa nos detuvo el flujo?" },
  { n: "DAILY 45M", type: "danger", q: "¿Cómo podemos acortar la Daily?" },
  { n: "API FAIL", type: "danger", q: "¿Qué herramienta técnica nos falló?" },
  { n: "LEGACY", type: "history", q: "¿Con qué deuda técnica tropezamos?" },
  { n: "RE-TEST", type: "history", q: "¿Qué historia regresó a QA más de 3 veces?" },
  { n: "COFFEE", type: "event", q: "Reconocimiento: Dale las gracias a alguien hoy." },
  { n: "REVIEW", type: "event", q: "¿En qué Review aprendiste algo nuevo?" },
  { n: "DEPLOY FRY", type: "danger", q: "Peligro: ¿Qué riesgo tomamos este viernes?" },
  { n: "S. CHANGE", type: "history", q: "¿Qué cambio 'pequeño' fue un caos?" },
  { n: "QA SAVES", type: "start", q: "¿Qué error crítico detectamos a tiempo?" },
  { n: "FIRE!", type: "danger", q: "¿Qué causó el mayor incendio en producción?" },
  { n: "MEETING", type: "event", q: "¿Qué reunión pudo ser un mensaje?" },
  { n: "DB FULL", type: "danger", q: "¿Dónde nos falta infraestructura?" },
  { n: "HOTFIX", type: "history", q: "¿Qué arreglamos 'en caliente'?" },
  { n: "DEMO", type: "start", q: "¿Qué funcionalidad gustó más al cliente?" },
  { n: "GROOMING", type: "event", q: "¿Qué historia necesita más detalle?" },
  { n: "NO TESTS", type: "danger", q: "¿Dónde nos faltó cobertura de pruebas?" },
  { n: "LOCAL OK", type: "history", q: "¿Por qué falló en QA si en local servía?" },
  { n: "APPROVAL", type: "start", q: "¿Cómo calificarías la calidad final?" }
];

let gameState = {
  players: [],
  currentIdx: 0,
  stability: 100,
  qaApprovals: 0,
  insights: [],
  waitingForVote: false,
  activeCell: null
};

io.on("connection", (socket) => {
  socket.emit("state", gameState);

  socket.on("join", ({ name }) => {
    const colors = ["#e74c3c", "#3498db", "#2ecc71", "#f1c40f", "#9b59b6", "#1abc9c", "#e67e22"];
    gameState.players.push({ id: socket.id, name, pos: 0, color: colors[gameState.players.length % colors.length], laps: 1 });
    io.emit("state", gameState);
  });

  socket.on("roll", () => {
    const p = gameState.players[gameState.currentIdx];
    if (p.id !== socket.id || gameState.waitingForVote) return;

    const roll = Math.floor(Math.random() * 6) + 1;
    p.pos += roll;
    if (p.pos >= 24) { p.pos %= 24; p.laps++; }
    
    gameState.activeCell = boardData[p.pos];
    gameState.waitingForVote = true;
    io.emit("state", gameState);
    io.emit("dice_anim", roll);
  });

  socket.on("vote", ({ isPositive, answer }) => {
    if (isPositive) {
      gameState.stability = Math.min(100, gameState.stability + 5);
      gameState.qaApprovals++;
    } else {
      gameState.stability = Math.max(0, gameState.stability - 10);
    }
    gameState.insights.push({ player: gameState.players[gameState.currentIdx].name, resp: answer, vote: isPositive });
    gameState.waitingForVote = false;
    gameState.currentIdx = (gameState.currentIdx + 1) % gameState.players.length;
    io.emit("state", gameState);
  });

  socket.on("disconnect", () => {
    gameState.players = gameState.players.filter(p => p.id !== socket.id);
    io.emit("state", gameState);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Servidor en puerto ${PORT}`));