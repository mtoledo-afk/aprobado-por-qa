const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*", methods: ["GET", "POST"] } });

app.use(express.static(path.join(__dirname)));
app.get("*", (req, res) => res.sendFile(path.join(__dirname, "index.html")));

// ── TOKENS ───────────────────────────────────────────────────────────
const TOKENS = [
  { id:"laptop",  emoji:"💻", name:"El Developer" },
  { id:"bug",     emoji:"🐛", name:"El Blocker" },
  { id:"coffee",  emoji:"☕", name:"El Daily" },
  { id:"postit",  emoji:"📝", name:"El Backlog" },
  { id:"rocket",  emoji:"🚀", name:"El Deploy" },
  { id:"fire",    emoji:"🔥", name:"El Incident" },
  { id:"search",  emoji:"🔍", name:"El QA" },
  { id:"robot",   emoji:"🤖", name:"El Automation" },
  { id:"dice",    emoji:"🎲", name:"El Estimador" },
  { id:"spider",  emoji:"🕷️", name:"El Tech Debt" },
  { id:"brain",   emoji:"🧠", name:"El Architect" },
  { id:"mega",    emoji:"📣", name:"El Scrum Master" },
  { id:"clock",   emoji:"⏰", name:"El Sprint" },
  { id:"medal",   emoji:"🏅", name:"El MVP" },
  { id:"ghost",   emoji:"👻", name:"El Legacy Code" },
];

const COLORS = ['#22c55e','#3b82f6','#ef4444','#eab308','#a855f7','#f97316','#06b6d4','#ec4899','#84cc16','#f43f5e'];

// ── DEFAULT CELLS ────────────────────────────────────────────────────
const DEFAULT_CELLS = [
  { id:"planning",  type:"ceremony", icon:"📋", name:"PLANNING",               questions:["¿Qué tan bien planeamos este sprint?","¿Las historias estaban bien definidas al planear?","¿El equipo tuvo claridad del objetivo del sprint?"] },
  { id:"us-ok",     type:"positive", icon:"✅", name:"US COMPLETADA",           questions:["¿Qué hizo exitosa esta historia?","¿Qué práctica del equipo ayudó a cerrarla?","¿Qué podemos repetir del proceso de esta historia?"] },
  { id:"scope",     type:"negative", icon:"🤡", name:"SCOPE CREEP",             questions:["¿Cómo manejamos cambios inesperados?","¿Qué impacto tuvo el cambio en el equipo?","¿Cómo podemos proteger mejor el alcance del sprint?"] },
  { id:"coffee",    type:"neutral",  icon:"☕", name:"COFFEE BREAK",            questions:["¿Qué momento de descanso o celebración tuvo el equipo este sprint?","¿Cómo mantenemos la energía del equipo durante el sprint?"] },
  { id:"bug",       type:"negative", icon:"🐛", name:"BUG CRÍTICO",             questions:["¿En qué momento del proceso pudimos haber encontrado este problema?","¿Qué nos faltó para detectarlo antes?","¿Cómo mejoramos nuestra red de seguridad?"] },
  { id:"daily-long",type:"negative", icon:"💬", name:"DAILY EXTENDIDA",         questions:["¿Cómo mejoramos nuestras dailies?","¿Qué tema se repite en las dailies que merece su propio espacio?","¿Qué haría nuestros standups más útiles?"] },
  { id:"code-rev",  type:"positive", icon:"🔍", name:"REVISIÓN DE ENTREGABLE", questions:["¿Cómo nos aseguramos de que el trabajo pasa por revisión antes de cerrarse?","¿Qué tan efectivo fue nuestro proceso de revisión?","¿Qué mejoraríamos en cómo validamos entregables?"] },
  { id:"tech-debt", type:"blocker",  icon:"🧠", name:"DEUDA DEL EQUIPO",        questions:["¿Qué deuda técnica o de proceso arrastramos?","¿Qué atajos tomamos este sprint que nos costarán después?","¿Cómo priorizamos reducir la deuda del equipo?"] },
  { id:"po-change", type:"negative", icon:"📞", name:"CAMBIO DE REQUISITOS",    questions:["¿Cómo manejamos cambios de requisitos?","¿Qué impacto tuvo el cambio en la planificación?","¿Cómo podemos anticipar mejor estos cambios?"] },
  { id:"sprint-rev",type:"ceremony", icon:"🎯", name:"SPRINT REVIEW",           questions:["¿Qué mostramos en el review?","¿Cómo reaccionaron los stakeholders?","¿Qué mejoraríamos de nuestra demo?"] },
  { id:"prod-inc",  type:"negative", icon:"🚒", name:"INCIDENTE EN PRODUCCIÓN", questions:["¿Qué causó el incidente?","¿Qué haríamos diferente para prevenirlo?","¿Cómo respondió el equipo ante la crisis?"] },
  { id:"qa-pass",   type:"positive", icon:"🧪", name:"VALIDACIÓN APROBADA",     questions:["¿Cómo puede el equipo detectar más problemas antes?","¿Qué hizo que esta validación fuera exitosa?","¿Qué proceso de validación deberíamos estandarizar?"] },
  { id:"dep-fri",   type:"negative", icon:"🔥", name:"ENTREGA DE ÚLTIMO MOMENTO",questions:["¿Tenemos claro cuándo y cómo llevamos algo a producción?","¿Qué nos llevó a entregar bajo presión?","¿Qué reglas de entrega necesitamos definir?"] },
  { id:"retro-c",   type:"ceremony", icon:"🗣️", name:"RETROSPECTIVA",           questions:["¿Qué 1 cosa mejoraríamos ahora mismo?","¿Qué acción del sprint anterior cumplimos?","¿Qué compromiso nos llevamos hoy?"] },
  { id:"collab",    type:"positive", icon:"🤝", name:"TRABAJO EN COLABORACIÓN", questions:["¿Cuándo trabajamos en pares o colaboración directa? ¿Funcionó?","¿Qué momentos de colaboración destacaron?","¿Cómo podemos colaborar más efectivamente?"] },
  { id:"dep-hell",  type:"blocker",  icon:"⛓️", name:"BLOQUEADOS POR OTROS",    questions:["¿Qué dependencias entre nosotros o con otros equipos nos bloquearon?","¿Cómo podemos resolver bloqueos más rápido?","¿Qué dependencia debemos resolver antes del próximo sprint?"] },
  { id:"velocity",  type:"positive", icon:"📈", name:"VELOCITY UP!",            questions:["¿Qué contribuyó a la velocidad del equipo?","¿Qué práctica nueva funcionó mejor de lo esperado?","¿Cómo mantenemos este nivel de rendimiento?"] },
  { id:"pr-stale",  type:"negative", icon:"🧟", name:"TAREA SIN VALIDAR",       questions:["¿Qué nos frenó a la hora de validar y cerrar historias?","¿Cómo mejoramos nuestro proceso de revisión y cierre?","¿Qué tarea lleva más tiempo sin cerrarse y por qué?"] },
  { id:"grooming",  type:"ceremony", icon:"🛠️", name:"GROOMING",                questions:["¿Nuestras historias están bien definidas?","¿Los criterios de aceptación son claros para todos?","¿Qué historia necesita más refinamiento antes del próximo sprint?"] },
  { id:"mtg-email", type:"negative", icon:"📧", name:"REUNIÓN INNECESARIA",      questions:["¿Cuántas reuniones podríamos eliminar?","¿Qué reunión podría ser un mensaje?","¿Cómo protegemos mejor el tiempo de enfoque del equipo?"] },
];

function shuffle(a) {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
}

function genRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return 'RETRO-' + Array.from({length:4}, () => chars[Math.floor(Math.random()*chars.length)]).join('');
}

function freshState() {
  return {
    phase: "config",      // config | lobby | game | event | retro | final
    hostId: null,
    roomCode: genRoomCode(),
    sprintTitle: "",
    players: [],
    currentPlayer: 0,
    positions: [],
    stability: 100, stress: 0, qa: 5, bugs: 0,
    round: 1, maxRounds: 2,
    cells: JSON.parse(JSON.stringify(DEFAULT_CELLS)), // deep copy, editable
    roundCells: [],
    usedIds: [],
    usedQuestions: {},    // { cellId: [usedQ1, usedQ2] } per round
    logs: [],
    insights: [],
    eventHist: [],
    lappedThis: [],
    activeEvent: null,
    activeVotes: {},
    activeComments: {},
    lastCell: null,
    rolling: false,
    takenTokens: {},      // { tokenId: playerName }
    hostConclusion: "",
    _endAfter: false,
    _nextRoundAfter: false,
  };
}

let G = freshState();

// ── CELL/QUESTION HELPERS ────────────────────────────────────────────
function pickRoundCells() {
  let avail = G.cells.filter(c => !G.usedIds.includes(c.id));
  if (avail.length < 20) { G.usedIds = []; avail = [...G.cells]; }
  const chosen = shuffle(avail).slice(0, 20);
  chosen.forEach(c => G.usedIds.push(c.id));
  G.roundCells = chosen;
  G.usedQuestions = {}; // reset per round
}

function getCell(pos) {
  if (pos === 0)  return { id:"start-c",   type:"corner-type", icon:"🚀", name:"SPRINT START",    questions:[] };
  if (pos === 6)  return { id:"blocked-c", type:"blocker",     icon:"🔒", name:"BLOQUEADOS!",     questions:["¿Qué nos bloqueó más este sprint?","¿Cómo podemos desbloquear situaciones más rápido?"] };
  if (pos === 12) return { id:"retro-gate",type:"ceremony",    icon:"🎯", name:"RETRO GATE",      questions:[] };
  if (pos === 18) return { id:"free-c",    type:"positive",    icon:"☕", name:"DÍA TRANQUILO",   questions:[] };
  const edgePos = [1,2,3,4,5,7,8,9,10,11,13,14,15,16,17,19,20,21,22,23];
  const idx = edgePos.indexOf(pos);
  return idx >= 0 ? G.roundCells[idx] : null;
}

function pickQuestion(cell) {
  if (!cell.questions || cell.questions.length === 0) return null;
  const used = G.usedQuestions[cell.id] || [];
  let avail = cell.questions.filter(q => !used.includes(q));
  if (avail.length === 0) { G.usedQuestions[cell.id] = []; avail = [...cell.questions]; }
  const q = avail[Math.floor(Math.random() * avail.length)];
  if (!G.usedQuestions[cell.id]) G.usedQuestions[cell.id] = [];
  G.usedQuestions[cell.id].push(q);
  return q;
}

function applyEffect(eff) {
  if (!eff) return;
  if (eff.stab)   G.stability = Math.max(0, Math.min(100, G.stability + eff.stab));
  if (eff.stress) G.stress    = Math.max(0, Math.min(100, G.stress + eff.stress));
  if (eff.qa)     G.qa        = Math.max(0, G.qa + eff.qa);
  if (eff.bugs)   G.bugs      = Math.max(0, G.bugs + eff.bugs);
}

// Effects per cell type (derived, not stored)
function getEffect(cellId) {
  const map = {
    "planning":{stab:5,qa:1}, "us-ok":{stab:4,qa:2}, "scope":{stab:-8,stress:10},
    "coffee":{stab:2,stress:-5}, "bug":{stab:-10,bugs:2,qa:-1}, "daily-long":{stab:-3,stress:8},
    "code-rev":{stab:5,qa:1,bugs:-1}, "tech-debt":{stab:-6,stress:5}, "po-change":{stab:-12,stress:20,bugs:1},
    "sprint-rev":{stab:7,qa:2}, "prod-inc":{stab:-15,stress:25,bugs:3}, "qa-pass":{stab:6,qa:3},
    "dep-fri":{stab:-10,stress:15,bugs:2}, "retro-c":{stab:5,stress:-15}, "collab":{stab:6,qa:1,bugs:-1},
    "dep-hell":{stab:-8,stress:12}, "velocity":{stab:8,qa:2}, "pr-stale":{stab:-5,bugs:1,stress:8},
    "grooming":{stab:4,qa:1}, "mtg-email":{stab:-2,stress:10},
    "blocked-c":{stab:-5,stress:15}, "retro-gate":{stab:10,qa:2,stress:-10}, "free-c":{stab:5,stress:-10},
  };
  return map[cellId] || null;
}

function addLog(msg, cls = "") {
  G.logs.unshift({ msg, cls });
  if (G.logs.length > 30) G.logs.pop();
}

function broadcast() { io.emit("state", G); }

function nextTurn() {
  G.rolling = false;
  G.activeEvent = null;
  G.activeVotes = {};
  G.activeComments = {};
  G.currentPlayer = (G.currentPlayer + 1) % G.players.length;
  addLog(`Turno de ${G.players[G.currentPlayer].token.emoji} ${G.players[G.currentPlayer].name}`);
  broadcast();
}

function startNextRound() {
  G.round++;
  G.lappedThis = [];
  pickRoundCells();
  addLog(`🔄 Vuelta ${G.round} iniciada — nuevas cartas!`, "p");
  nextTurn();
}

// ── SOCKET ───────────────────────────────────────────────────────────
io.on("connection", (socket) => {
  socket.emit("state", G);
  socket.emit("tokens", TOKENS);

  // HOST ACTIONS (config phase)
  socket.on("setSprintTitle", ({ title }) => {
    if (socket.id !== G.hostId) return;
    G.sprintTitle = title;
    broadcast();
  });

  socket.on("updateQuestion", ({ cellId, oldQ, newQ }) => {
    if (socket.id !== G.hostId) return;
    const cell = G.cells.find(c => c.id === cellId);
    if (!cell) return;
    const idx = cell.questions.indexOf(oldQ);
    if (idx !== -1) cell.questions[idx] = newQ;
    broadcast();
  });

  socket.on("addQuestion", ({ cellId, q }) => {
    if (socket.id !== G.hostId) return;
    const cell = G.cells.find(c => c.id === cellId);
    if (cell && q.trim()) cell.questions.push(q.trim());
    broadcast();
  });

  socket.on("deleteQuestion", ({ cellId, q }) => {
    if (socket.id !== G.hostId) return;
    const cell = G.cells.find(c => c.id === cellId);
    if (cell) cell.questions = cell.questions.filter(x => x !== q);
    broadcast();
  });

  socket.on("setMaxRounds", ({ n }) => {
    if (socket.id !== G.hostId) return;
    G.maxRounds = n;
    broadcast();
  });

  socket.on("hostReady", () => {
    if (socket.id !== G.hostId) return;
    G.phase = "lobby";
    broadcast();
  });

  // PICK TOKEN
  socket.on("pickToken", ({ tokenId, name }) => {
    if (G.phase !== "lobby") return;
    if (G.takenTokens[tokenId]) return; // already taken
    // Remove any previous token this socket had
    Object.keys(G.takenTokens).forEach(tid => {
      if (G.takenTokens[tid] === socket.id) delete G.takenTokens[tid];
    });
    // Remove player if already joined
    const existingIdx = G.players.findIndex(p => p.id === socket.id);
    if (existingIdx !== -1) { G.players.splice(existingIdx, 1); G.positions.splice(existingIdx, 1); }

    G.takenTokens[tokenId] = socket.id;
    const token = TOKENS.find(t => t.id === tokenId);
    const idx = G.players.length;
    G.players.push({
      id: socket.id,
      name: name || token.name,
      token,
      color: COLORS[idx % COLORS.length],
      qa: 1,
    });
    G.positions.push(0);
    addLog(`${token.emoji} ${name || token.name} se unió.`, "g");
    broadcast();
  });

  // START GAME
  socket.on("startGame", () => {
    if (socket.id !== G.hostId || G.players.length < 1) return;
    G.phase = "game";
    G.round = 1;
    G.stability = 100; G.stress = 0; G.qa = 5; G.bugs = 0;
    G.currentPlayer = 0;
    G.lappedThis = []; G.insights = []; G.eventHist = [];
    G.logs = []; G.usedIds = [];
    pickRoundCells();
    addLog(`🚀 ¡Sprint iniciado! ${G.sprintTitle ? "— "+G.sprintTitle : ""}`, "g");
    broadcast();
  });

  // ROLL
  socket.on("roll", () => {
    if (G.phase !== "game") return;
    const p = G.players[G.currentPlayer];
    if (!p || p.id !== socket.id || G.rolling) return;
    G.rolling = true;
    broadcast();
    const roll = Math.floor(Math.random() * 6) + 1;
    let ticks = 0;
    const iv = setInterval(() => {
      io.emit("diceTick", Math.floor(Math.random() * 6) + 1);
      if (++ticks >= 8) {
        clearInterval(iv);
        io.emit("diceResult", roll);
        movePlayer(roll);
      }
    }, 80);
  });

  // VOTE
  socket.on("vote", ({ val }) => {
    if (G.phase !== "event") return;
    G.activeVotes[socket.id] = val;
    broadcast();
  });

  // COMMENT
  socket.on("comment", ({ text }) => {
    if (G.phase !== "event") return;
    G.activeComments[socket.id] = text;
    broadcast();
  });

  // CONTINUE EVENT
  socket.on("continueEvent", () => {
    if (G.phase !== "event") return;
    const p = G.players[G.currentPlayer];
    if (!p || p.id !== socket.id) return;
    const ae = G.activeEvent;
    if (ae && ae.q) {
      const activeVote = G.activeVotes[p.id];
      const comment = G.activeComments[p.id] || "";
      const teamVotes = {};
      G.players.forEach((pl, i) => {
        if (pl.id !== p.id && G.activeVotes[pl.id]) teamVotes[i] = G.activeVotes[pl.id];
      });
      if (activeVote || comment || Object.keys(teamVotes).length > 0) {
        G.insights.push({ q: ae.q, cellName: ae.title, active: activeVote, team: teamVotes, comment, player: p.name, token: p.token, round: G.round });
      }
    }
    if (G._endAfter)        { G._endAfter = false; G.phase = "retro"; broadcast(); return; }
    if (G._nextRoundAfter)  { G._nextRoundAfter = false; G.phase = "game"; startNextRound(); return; }
    if (G.stability <= 0)   { G.phase = "retro"; broadcast(); return; }
    G.phase = "game";
    nextTurn();
  });

  // HOST CONCLUSION
  socket.on("setConclusion", ({ text }) => {
    if (socket.id !== G.hostId) return;
    G.hostConclusion = text;
    broadcast();
  });

  socket.on("showFinal", () => { G.phase = "final"; broadcast(); });

  socket.on("reset", () => {
    const wasHost = G.hostId;
    G = freshState();
    G.hostId = wasHost;
    addLog("🔄 Juego reiniciado.");
    broadcast();
  });

  socket.on("disconnect", () => {
    const idx = G.players.findIndex(p => p.id === socket.id);
    if (idx !== -1) {
      const p = G.players[idx];
      // Free token
      Object.keys(G.takenTokens).forEach(tid => { if (G.takenTokens[tid] === socket.id) delete G.takenTokens[tid]; });
      G.players.splice(idx, 1);
      G.positions.splice(idx, 1);
      if (G.currentPlayer >= G.players.length) G.currentPlayer = 0;
      addLog(`${p.token?.emoji || ""} ${p.name} salió.`, "r");
      broadcast();
    }
    // If host disconnects while in config, assign to next
    if (socket.id === G.hostId && G.phase === "config") {
      G.hostId = null; // will be reassigned on next connection if needed
    }
  });

  // Assign host to first connection
  if (!G.hostId) {
    G.hostId = socket.id;
    socket.emit("youAreHost", { roomCode: G.roomCode });
    broadcast();
  }
});

function movePlayer(roll) {
  const pi = G.currentPlayer;
  const p = G.players[pi];
  const oldPos = G.positions[pi];
  const newPos = (oldPos + roll) % 24;
  const lapped = (oldPos + roll) >= 24;
  G.positions[pi] = newPos;
  addLog(`${p.token.emoji} ${p.name} avanzó ${roll} → pos ${newPos + 1}`);
  if (lapped) {
    if (!G.lappedThis.includes(pi)) G.lappedThis.push(pi);
    G.qa += 2;
    addLog(`🔄 ${p.name} completó vuelta ${G.round}!`, "g");
    if (G.lappedThis.length >= G.players.length) {
      if (G.round >= G.maxRounds) G._endAfter = true;
      else G._nextRoundAfter = true;
    }
  }
  const cell = getCell(newPos);
  if (!cell || newPos === 0) { G.rolling = false; broadcast(); nextTurn(); return; }
  const eff = getEffect(cell.id);
  applyEffect(eff);
  G.eventHist.push({ cell: cell.name, cellId: cell.id, player: p.name, token: p.token, effect: eff || {}, round: G.round });
  G.lastCell = { icon: cell.icon, name: cell.name, id: cell.id };
  const q = Math.random() < 0.65 ? pickQuestion(cell) : null;
  G.activeEvent = { icon: cell.icon, title: cell.name, id: cell.id, effect: eff || {}, q, playerName: p.name, playerColor: p.color };
  G.activeVotes = {};
  G.activeComments = {};
  G.phase = "event";
  broadcast();
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Aprobado por QA™ en puerto ${PORT}`));