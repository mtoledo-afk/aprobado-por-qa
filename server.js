const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

// --- CONFIGURACIÓN DEL JUEGO ---
const boardData = [
  { n: "PLANNING", type: "start", q: "¡Inicio de Sprint! ¿Cuál es el objetivo principal?" },
  { n: "REFACTOR", type: "history", q: "¿Qué código 'sucio' nos está frenando hoy?" },
  { n: "DUDAS", type: "event", q: "¿Qué requerimiento sigue siendo un misterio?" },
  { n: "CSS", type: "history", q: "¿Qué batalla visual perdimos este sprint?" },
  { n: "IDEA PO", type: "event", q: "¿Cómo manejamos la llegada de nuevas tareas?" },
  { n: "BLOCK", type: "jail", q: "¿Quién nos tiene esperando una respuesta?" },
  { n: "DAILY", type: "danger", q: "¿Qué distracción mató nuestra productividad?" },
  { n: "API FAIL", type: "danger", q: "¿Qué dependencia técnica es nuestro punto débil?" },
  { n: "LEGACY", type: "history", q: "¿Qué parte del código nadie quiere tocar?" },
  { n: "RE-TEST", type: "history", q: "¿Por qué esta tarea siempre rebota?" },
  { n: "COFFEE", type: "event", q: "Reconocimiento: ¿Quién fue el MVP silencioso?" },
  { n: "REVIEW", type: "event", q: "¿Qué feedback nos dolió pero fue necesario?" },
  { n: "DEPLOY", type: "danger", q: "Viernes de Deploy. ¿Qué podría salir mal?" },
  { n: "CHANGE", type: "history", q: "¿Qué cambio 'mínimo' rompió todo?" },
  { n: "QA SAVES", type: "start", q: "¿Qué error crítico evitamos a última hora?" },
  { n: "FIRE!", type: "danger", q: "¡Incendio en producción! ¿Quién tiene el extintor?" },
  { n: "MEETING", type: "event", q: "¿Qué reunión nos robó el foco hoy?" },
  { n: "DB FULL", type: "danger", q: "¿Dónde nos falta escalabilidad?" },
  { n: "HOTFIX", type: "history", q: "¿Qué parchamos hoy que mañana fallará?" },
  { n: "DEMO", type: "start", q: "¿Qué funcionalidad sorprendió al cliente?" },
  { n: "GROOMING", type: "event", q: "¿Qué historia no está lista para empezar?" },
  { n: "NO TESTS", type: "danger", q: "¿Qué parte del sistema estamos probando a ciegas?" },
  { n: "LOCAL OK", type: "history", q: "¿Por qué el entorno de QA es diferente al nuestro?" },
  { n: "APPROVAL", type: "start", q: "¿Qué tan orgullosos estamos del código final?" }
];

let gameState = {
  players: [],
  currentIdx: 0,
  stability: 100,
  qaApprovals: 0,
  insights: [],
  gameStarted: false,
  waitingForVote: false,
  lastAction: "Esperando inicio..."
};

io.on("connection", (socket) => {
  socket.emit("update", gameState);

  socket.on("join_game", (name) => {
    if (gameState.players.length < 9) {
      gameState.players.push({ id: socket.id, name, pos: 0, laps: 1, color: getNextColor() });
      io.emit("update", gameState);
    }
  });

  socket.on("start_sprint", () => {
    gameState.gameStarted = true;
    gameState.lastAction = "¡Sprint Iniciado!";
    io.emit("update", gameState);
  });

  socket.on("roll_dice", () => {
    const p = gameState.players[gameState.currentIdx];
    if (p.id !== socket.id || gameState.waitingForVote) return;

    const roll = Math.floor(Math.random() * 6) + 1;
    p.pos += roll;
    if (p.pos >= 24) {
      p.pos %= 24;
      p.laps++;
    }
    gameState.waitingForVote = true;
    gameState.lastAction = `${p.name} sacó un ${roll} y cayó en ${boardData[p.pos].n}`;
    io.emit("update", gameState);
    io.emit("dice_rolled", roll);
  });

  socket.on("submit_vote", ({ isPositive, answer }) => {
    const p = gameState.players[gameState.currentIdx];
    if (isPositive) {
      gameState.stability = Math.min(100, gameState.stability + 5);
      gameState.qaApprovals += 1;
    } else {
      gameState.stability = Math.max(0, gameState.stability - 10);
    }
    
    gameState.insights.push({ dev: p.name, resp: answer, result: isPositive ? "POS" : "NEG" });
    gameState.waitingForVote = false;
    gameState.currentIdx = (gameState.currentIdx + 1) % gameState.players.length;
    io.emit("update", gameState);
  });
});

function getNextColor() {
  const colors = ["#e74c3c", "#3498db", "#2ecc71", "#f1c40f", "#9b59b6", "#1abc9c", "#e67e22", "#bdc3c7", "#ff9ff3"];
  return colors[gameState.players.length % colors.length];
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Servidor en puerto ${PORT}`));