const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

app.use(express.static(path.join(__dirname)));
app.get("*", (req, res) => res.sendFile(path.join(__dirname, "index.html")));

// ── CELLS DATA ────────────────────────────────────────────────────────
const ALL_CELLS = [
  {id:"planning",type:"ceremony",icon:"📋",name:"PLANNING",effect:{stab:5,qa:1},q:"¿Qué tan bien planeamos este sprint?"},
  {id:"us-ok",type:"positive",icon:"✅",name:"US APROBADA",effect:{stab:4,qa:2},q:"¿Qué hizo exitosa esta historia?"},
  {id:"scope",type:"negative",icon:"🤡",name:"SCOPE CREEP",effect:{stab:-8,stress:10},q:"¿Cómo manejamos cambios inesperados?"},
  {id:"coffee",type:"neutral",icon:"☕",name:"COFFEE BREAK",effect:{stab:2,stress:-5},q:null},
  {id:"bug",type:"negative",icon:"🐛",name:"BUG CRÍTICO",effect:{stab:-10,bugs:2,qa:-1},q:"¿Qué pudo detectarse antes?"},
  {id:"daily-long",type:"negative",icon:"💬",name:"DAILY x1HR",effect:{stab:-3,stress:8},q:"¿Cómo mejoramos las dailies?"},
  {id:"code-rev",type:"positive",icon:"🔍",name:"CODE REVIEW",effect:{stab:5,qa:1,bugs:-1},q:"¿Con qué frecuencia hacemos code review?"},
  {id:"tech-debt",type:"blocker",icon:"🧠",name:"TECH DEBT",effect:{stab:-6,stress:5},q:"¿Qué deuda técnica arrastramos?"},
  {id:"po-change",type:"negative",icon:"📞",name:"PO CAMBIÓ REQ.",effect:{stab:-12,stress:20,bugs:1},q:"¿Cómo manejamos cambios de requisitos?"},
  {id:"sprint-rev",type:"ceremony",icon:"🎯",name:"SPRINT REVIEW",effect:{stab:7,qa:2},q:"¿Qué mostramos en el review?"},
  {id:"prod-inc",type:"negative",icon:"🚒",name:"PROD INCIDENT",effect:{stab:-15,stress:25,bugs:3},q:"¿Qué causó el incidente?"},
  {id:"qa-pass",type:"positive",icon:"🧪",name:"QA APROBÓ",effect:{stab:6,qa:3},q:"¿Cómo puede QA detectar más antes?"},
  {id:"dep-fri",type:"negative",icon:"🔥",name:"DEPLOY FRIDAY",effect:{stab:-10,stress:15,bugs:2},q:"¿Necesitamos reglas de deployment?"},
  {id:"retro-c",type:"ceremony",icon:"🗣️",name:"RETRO CERT.",effect:{stab:5,stress:-15},q:"¿Qué 1 cosa mejoraríamos ahora mismo?"},
  {id:"pair-prog",type:"positive",icon:"🤝",name:"PAIR PROGRAM",effect:{stab:6,qa:1,bugs:-1},q:"¿Cuándo usamos pair programming?"},
  {id:"dep-hell",type:"blocker",icon:"⛓️",name:"DEP. HELL",effect:{stab:-8,stress:12},q:"¿Cómo manejamos dependencias externas?"},
  {id:"velocity",type:"positive",icon:"📈",name:"VELOCITY UP!",effect:{stab:8,qa:2},q:"¿Qué contribuyó a la velocidad?"},
  {id:"pr-stale",type:"negative",icon:"🧟",name:"PR SIN REVIEW",effect:{stab:-5,bugs:1,stress:8},q:"¿Cómo mejoramos el proceso de PR?"},
  {id:"grooming",type:"ceremony",icon:"🛠️",name:"GROOMING",effect:{stab:4,qa:1},q:"¿Nuestras historias están bien definidas?"},
  {id:"mtg-email",type:"negative",icon:"📧",name:"MEETING=EMAIL",effect:{stab:-2,stress:10},q:"¿Cuántas reuniones podríamos eliminar?"},
];

const COLORS = ['#22c55e','#3b82f6','#ef4444','#eab308','#a855f7','#f97316','#06b6d4','#ec4899','#84cc16'];
const EMOJIS = ['🧑‍💻','👩‍💻','🧑‍🔬','👨‍🎨','🧑‍💼','👩‍🔬','🤖','👩‍💼','🧑‍🎨'];

function shuffle(a) {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
}

function freshState(maxRounds = 2) {
  return {
    phase: "lobby",       // lobby | game | event | retro | final
    players: [],
    currentPlayer: 0,
    positions: [],
    stability: 100,
    stress: 0,
    qa: 5,
    bugs: 0,
    round: 1,
    maxRounds,
    roundCells: [],
    usedIds: [],
    logs: [],
    insights: [],
    eventHist: [],
    lappedThis: [],
    activeEvent: null,    // current event overlay data
    activeVotes: {},      // { socketId: 'good'|'neutral'|'bad' }
    activeComments: {},   // { socketId: 'text' }
    lastCell: null,
    rolling: false,
  };
}

let G = freshState();

function pickRoundCells() {
  let avail = ALL_CELLS.filter(c => !G.usedIds.includes(c.id));
  if (avail.length < 20) { G.usedIds = []; avail = [...ALL_CELLS]; }
  const chosen = shuffle(avail).slice(0, 20);
  chosen.forEach(c => G.usedIds.push(c.id));
  G.roundCells = chosen;
}

function getCell(pos) {
  if (pos === 0)  return { id:"start-c",  type:"corner-type", icon:"🚀", name:"SPRINT START", effect:null, q:null };
  if (pos === 6)  return { id:"blocked-c",type:"blocker",     icon:"🔒", name:"BLOCKED!",     effect:{stab:-5,stress:15}, q:"¿Qué nos bloqueó más este sprint?" };
  if (pos === 12) return { id:"retro-gate",type:"ceremony",   icon:"🎯", name:"RETRO GATE",   effect:{stab:10,qa:2,stress:-10}, q:null };
  if (pos === 18) return { id:"free-c",   type:"positive",    icon:"☕", name:"FREE PARKING",  effect:{stab:5,stress:-10}, q:null };
  const edgePos = [1,2,3,4,5, 7,8,9,10,11, 13,14,15,16,17, 19,20,21,22,23];
  const idx = edgePos.indexOf(pos);
  return idx >= 0 ? G.roundCells[idx] : null;
}

function applyEffect(eff) {
  if (!eff) return;
  if (eff.stab)   G.stability = Math.max(0, Math.min(100, G.stability + eff.stab));
  if (eff.stress) G.stress    = Math.max(0, Math.min(100, G.stress + eff.stress));
  if (eff.qa)     G.qa        = Math.max(0, G.qa + eff.qa);
  if (eff.bugs)   G.bugs      = Math.max(0, G.bugs + eff.bugs);
}

function addLog(msg, cls = "") {
  G.logs.unshift({ msg, cls });
  if (G.logs.length > 30) G.logs.pop();
}

function broadcast() {
  io.emit("state", G);
}

function nextTurn() {
  G.rolling = false;
  G.activeEvent = null;
  G.activeVotes = {};
  G.activeComments = {};
  G.currentPlayer = (G.currentPlayer + 1) % G.players.length;
  const p = G.players[G.currentPlayer];
  addLog(`Turno de ${p.emoji} ${p.name}`);
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
  console.log("Conectado:", socket.id);
  socket.emit("state", G);

  // JOIN
  socket.on("join", ({ name }) => {
    if (G.phase !== "lobby") return;
    if (G.players.find(p => p.id === socket.id)) return;
    const idx = G.players.length;
    G.players.push({
      id: socket.id,
      name,
      color: COLORS[idx % COLORS.length],
      emoji: EMOJIS[idx % EMOJIS.length],
      qa: 1,
    });
    G.positions.push(0);
    addLog(`${EMOJIS[idx % EMOJIS.length]} ${name} se unió.`, "g");
    broadcast();
  });

  // START GAME (any player can trigger)
  socket.on("startGame", ({ maxRounds }) => {
    if (G.phase !== "lobby" || G.players.length < 2) return;
    G.maxRounds = maxRounds || 2;
    G.phase = "game";
    G.round = 1;
    G.stability = 100; G.stress = 0; G.qa = 5; G.bugs = 0;
    G.currentPlayer = 0;
    G.lappedThis = [];
    G.insights = []; G.eventHist = []; G.logs = [];
    G.usedIds = [];
    pickRoundCells();
    addLog("🚀 ¡Sprint iniciado!", "g");
    broadcast();
  });

  // ROLL DICE (only active player)
  socket.on("roll", () => {
    if (G.phase !== "game") return;
    const p = G.players[G.currentPlayer];
    if (!p || p.id !== socket.id) return;
    if (G.rolling) return;
    G.rolling = true;
    broadcast();

    // Animate roll server-side: pick result, send intermediate ticks via event
    const roll = Math.floor(Math.random() * 6) + 1;
    let ticks = 0;
    const iv = setInterval(() => {
      io.emit("diceTick", Math.floor(Math.random() * 6) + 1);
      if (++ticks >= 8) {
        clearInterval(iv);
        io.emit("diceResult", roll);
        movePlayer(roll, socket);
      }
    }, 80);
  });

  // VOTE (active player or team)
  socket.on("vote", ({ val }) => {
    if (G.phase !== "event") return;
    G.activeVotes[socket.id] = val;
    broadcast();
  });

  // COMMENT (active player only)
  socket.on("comment", ({ text }) => {
    if (G.phase !== "event") return;
    G.activeComments[socket.id] = text;
    broadcast();
  });

  // CONTINUE (only active player closes event)
  socket.on("continueEvent", () => {
    if (G.phase !== "event") return;
    const p = G.players[G.currentPlayer];
    if (!p || p.id !== socket.id) return;

    // Save insight
    const ae = G.activeEvent;
    if (ae && ae.q) {
      const activeVote = G.activeVotes[p.id];
      const comment = G.activeComments[p.id] || "";
      const teamVotes = {};
      G.players.forEach((pl, i) => {
        if (pl.id !== p.id && G.activeVotes[pl.id]) {
          teamVotes[i] = G.activeVotes[pl.id];
        }
      });
      if (activeVote || comment || Object.keys(teamVotes).length > 0) {
        G.insights.push({ q: ae.q, active: activeVote, team: teamVotes, comment, player: p.name, round: G.round });
      }
    }

    // Check end conditions
    if (G._endAfter) {
      G._endAfter = false;
      G.phase = "retro";
      broadcast();
      return;
    }
    if (G._nextRoundAfter) {
      G._nextRoundAfter = false;
      G.phase = "game";
      startNextRound();
      return;
    }
    if (G.stability <= 0) {
      G.phase = "retro";
      broadcast();
      return;
    }
    G.phase = "game";
    nextTurn();
  });

  // SHOW FINAL
  socket.on("showFinal", () => {
    G.phase = "final";
    broadcast();
  });

  // RESET
  socket.on("reset", () => {
    const oldPlayers = G.players.map(p => ({ ...p, qa: 1 }));
    G = freshState();
    G.players = oldPlayers;
    G.positions = new Array(oldPlayers.length).fill(0);
    addLog("🔄 Juego reiniciado.");
    broadcast();
  });

  // DISCONNECT
  socket.on("disconnect", () => {
    const idx = G.players.findIndex(p => p.id === socket.id);
    if (idx !== -1) {
      const name = G.players[idx].name;
      G.players.splice(idx, 1);
      G.positions.splice(idx, 1);
      if (G.currentPlayer >= G.players.length) G.currentPlayer = 0;
      addLog(`${name} salió.`, "r");
      broadcast();
    }
  });
});

function movePlayer(roll, socket) {
  const pi = G.currentPlayer;
  const p = G.players[pi];
  const oldPos = G.positions[pi];
  const newPos = (oldPos + roll) % 24;
  const lapped = (oldPos + roll) >= 24;
  G.positions[pi] = newPos;
  addLog(`${p.emoji} ${p.name} avanzó ${roll} → pos ${newPos + 1}`, "");

  if (lapped) {
    if (!G.lappedThis.includes(pi)) G.lappedThis.push(pi);
    G.qa += 2;
    addLog(`🔄 ${p.name} completó vuelta ${G.round}!`, "g");
    if (G.lappedThis.length >= G.players.length) {
      if (G.round >= G.maxRounds) G._endAfter = true;
      else G._nextRoundAfter = true;
    }
  }

  // Trigger event
  const cell = getCell(newPos);
  if (!cell || newPos === 0) {
    G.rolling = false;
    broadcast();
    nextTurn();
    return;
  }

  applyEffect(cell.effect);
  G.eventHist.push({ cell: cell.name, player: p.name, effect: cell.effect || {}, round: G.round });
  G.lastCell = { icon: cell.icon, name: cell.name, id: cell.id };

  const hasQ = cell.q && Math.random() < 0.65;
  G.activeEvent = {
    icon: cell.icon,
    title: cell.name,
    id: cell.id,
    effect: cell.effect || {},
    q: hasQ ? cell.q : null,
    playerName: p.name,
    playerColor: p.color,
  };
  G.activeVotes = {};
  G.activeComments = {};
  G.phase = "event";
  broadcast();
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Aprobado por QA™ corriendo en puerto ${PORT}`));