const board = document.querySelector('.board');
const squares = Array.from(board.querySelectorAll('.square'));
const tooltip = document.getElementById('tooltip');
const passButton = document.getElementById('passTurn');
const attackButton = document.getElementById('attack');
const turnInfo = document.getElementById('turnInfo');
const movementInfo = document.getElementById('movementInfo');
const allyCards = document.getElementById('allyCards');
const enemyCards = document.getElementById('enemyCards');
const powerButtons = document.getElementById('powerButtons');
const combatInfo = document.getElementById('combatInfo');

// --- CONFIGURACIÓN GLOBAL ---
const pieceStats = personajes; // Referencia a personajes.js
const HERO_TEAM = 'aliado';
const VILLAIN_TEAM = 'enemigo';
const BARRIER_DURATION = 3; // Turnos que dura una barrera

// Mapa de coordenadas para acceso rápido
const squareByCoord = new Map();
squares.forEach((square, index) => {
  const row = Math.floor(index / 16) + 1;
  const col = (index % 16) + 1;
  square.dataset.row = row;
  square.dataset.col = col;
  squareByCoord.set(`${row}-${col}`, square);
});

// Estado del juego
const pieceMap = new Map(); // Guarda stats dinámicos (vida, buffs)
let turnOrder = [];
let turnIndex = 0;
let selectedTarget = null;
let currentAction = 'Ataque'; // Acción seleccionada
let activeBarriers = []; // Lista de barreras activas
let barrierPreviewSquares = [];
let pendingBarrierPlacement = null;

// --- SISTEMA DE SONIDOS (Placeholders) ---
const sounds = {
  attack: new Audio('sonido/Punch.mp3'),
  fail: new Audio('sonido/Failure.mp3'),
  click: new Audio('sonido/click.wav'),
  pass: new Audio('sonido/pasar.wav'),
  explode: new Audio('sonido/explosion.mp3'),
  barrier: new Audio('sonidos/efectos/barrera.wav')
};
function playSound(name) {
  if (sounds[name]) {
    sounds[name].currentTime = 0;
    sounds[name].play().catch(() => {});
  }
}

// --- UTILIDADES ---
function getPieceSquare(piece) { return piece.closest('.square'); }
function getSquareAt(row, col) { return squareByCoord.get(`${row}-${col}`) ?? null; }

function getDistance(sq1, sq2) {
  if (!sq1 || !sq2) return 999;
  return Math.abs(Number(sq1.dataset.row) - Number(sq2.dataset.row)) + 
         Math.abs(Number(sq1.dataset.col) - Number(sq2.dataset.col));
}

function hasLineOfSight(attackerSquare, targetSquare) {
  const startRow = Number(attackerSquare.dataset.row);
  const startCol = Number(attackerSquare.dataset.col);
  const endRow = Number(targetSquare.dataset.row);
  const endCol = Number(targetSquare.dataset.col);
  const dx = endCol - startCol;
  const dy = endRow - startRow;
  const steps = Math.max(Math.abs(dx), Math.abs(dy));
  if (steps <= 1) return true;

  const epsilon = 1e-9;
  const coordCells = (value) => {
    const rounded = Math.round(value);
    if (Math.abs(value - rounded) < epsilon) {
      return [rounded];
    }
    return [Math.floor(value), Math.ceil(value)];
  };

  for (let step = 1; step < steps; step += 1) {
    const t = step / steps;
    const x = startCol + t * dx;
    const y = startRow + t * dy;
    const cols = coordCells(x);
    const rows = coordCells(y);

    for (const row of rows) {
      for (const col of cols) {
        const square = getSquareAt(row, col);
        if (square && square.classList.contains('square--barrier')) return false;
      }
    }
  }
  return true;
}

function computeRangeDistances(originSquare, maxRange) {
  const distances = new Map();
  if (!originSquare) return distances;
  const queue = [{ square: originSquare, distance: 0 }];
  distances.set(originSquare, 0);
  const deltas = [[1, 0], [-1, 0], [0, 1], [0, -1]];

  while (queue.length) {
    const { square, distance } = queue.shift();
    if (distance >= maxRange) continue;
    deltas.forEach(([dr, dc]) => {
      const nr = Number(square.dataset.row) + dr;
      const nc = Number(square.dataset.col) + dc;
      const neighbor = getSquareAt(nr, nc);
      if (!neighbor || distances.has(neighbor)) return;
      if (neighbor.classList.contains('square--barrier')) return;
      const nextDistance = distance + 1;
      distances.set(neighbor, nextDistance);
      queue.push({ square: neighbor, distance: nextDistance });
    });
  }
  return distances;
}

function areAdjacentSquares(fromSq, toSq) {
  if (!fromSq || !toSq) return false;
  const rowDiff = Math.abs(Number(toSq.dataset.row) - Number(fromSq.dataset.row));
  const colDiff = Math.abs(Number(toSq.dataset.col) - Number(fromSq.dataset.col));
  return rowDiff + colDiff === 1;
}

function clearBarrierPreview() {
  barrierPreviewSquares.forEach(sq => sq.classList.remove('square--barrier-preview'));
  barrierPreviewSquares = [];
}

function updateBarrierPreview(originSq) {
  clearBarrierPreview();
  if (!originSq) return;
  const neighbors = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  neighbors.forEach(([dr, dc]) => {
    const sq = getSquareAt(Number(originSq.dataset.row) + dr, Number(originSq.dataset.col) + dc);
    if (!sq || sq.querySelector('.piece') || sq.classList.contains('square--barrier')) return;
    sq.classList.add('square--barrier-preview');
    barrierPreviewSquares.push(sq);
  });
}

function hasPassive(stats, partialName) {
  const rawEntries = [
    ...(stats?.pasivos || []),
    ...(stats?.habilidades?.pasivas || []),
  ];
  return rawEntries.some(p => (p?.nombre ?? p)?.toString().includes(partialName));
}

// --- GESTIÓN DE STATS Y BUFFS ---
function getEffectiveStats(piece) {
  const base = pieceMap.get(piece);
  // Clonamos para calcular modificadores temporales sin dañar el base
  const stats = { ...base, defensa: base.defensa, ataque: base.ataque, agilidad: base.agilidad };
  
  // Aplicar Buffs
  if (base.buffs) {
    base.buffs.forEach(buff => {
      if (buff.type === 'agilidad') stats.agilidad = Math.min(stats.agilidad + buff.value, base.originalAgilidad + 10);
      if (buff.type === 'defensa') stats.defensa = Math.min(stats.defensa + buff.value, base.originalDefensa + 1);
      if (buff.type === 'ataque') stats.ataque = Math.min(stats.ataque + buff.value, base.originalAtaque + 1);
      if (buff.type === 'critico') stats.hasAstuciaBuff = true;
    });
  }

  // Pasiva: Sigilo (+2 Defensa si cobertura... simplificado a siempre +2 contra ataques lejanos en cálculo de daño)
  // Aquí devolvemos stats para UI y lógica general
  return stats;
}

function addBuff(piece, type, value, duration) {
  const stats = pieceMap.get(piece);
  if (!stats.buffs) stats.buffs = [];
  
  // Regla: Solo renueva duración si ya existe, no stackea valor infinito
  const existing = stats.buffs.find(b => b.type === type);
  if (existing) {
    existing.turns = duration;
  } else {
    stats.buffs.push({ type, value, turns: duration });
  }
  logCombat(`${stats.nombre} recibe mejora de ${type}.`);
}

function tickBuffs(piece) {
  const stats = pieceMap.get(piece);
  if (stats.buffs) {
    stats.buffs.forEach(b => b.turns--);
    stats.buffs = stats.buffs.filter(b => b.turns > 0);
  }
  // Control Mental
  if (stats.mindControlTurns > 0) {
    stats.mindControlTurns--;
    if (stats.mindControlTurns === 0) {
      // Revertir equipo
      const originalTeam = piece.classList.contains('piece--hero') ? HERO_TEAM : VILLAIN_TEAM; // Simplificación
      // En realidad guardamos el equipo original en stats
      piece.dataset.team = stats.originalTeam;
      logCombat(`${stats.nombre} recupera el control de su mente.`);
    }
  }
}

// --- MOVIMIENTO ---
function canTraverse(piece) {
  const stats = getEffectiveStats(piece);
  return hasPassive(stats, 'Volar') || hasPassive(stats, 'Fase');
}

function remainingMovement(piece) { return Number(piece.dataset.movesLeft ?? 0); }

function spendMovement(piece, amount) {
  piece.dataset.movesLeft = Math.max(0, remainingMovement(piece) - amount);
}

function highlightMovement(piece) {
  squares.forEach(s => s.classList.remove('square--move'));
  const origin = getPieceSquare(piece);
  const maxMove = remainingMovement(piece);
  if (!origin || maxMove <= 0) return;

  const queue = [{ square: origin, distance: 0 }];
  const visited = new Map();
  visited.set(origin, 0);
  const canFly = canTraverse(piece);
  const myTeam = piece.dataset.team;

  while (queue.length > 0) {
    const { square, distance } = queue.shift();
    if (distance >= maxMove) continue;

    const row = Number(square.dataset.row);
    const col = Number(square.dataset.col);
    const neighbors = [[row+1, col], [row-1, col], [row, col+1], [row, col-1]];

    neighbors.forEach(([r, c]) => {
      const neighbor = getSquareAt(r, c);
      if (!neighbor || visited.has(neighbor)) return;

      const occupant = neighbor.querySelector('.piece');
      const isBarrier = neighbor.classList.contains('square--barrier');
      
      // Lógica de Bloqueo
      let blocked = false;
      if (occupant) {
        if (occupant.dataset.team !== myTeam && !canFly) blocked = true;
      }
      if (isBarrier && !canFly) blocked = true;

      if (!blocked) {
        const newDist = distance + 1;
        visited.set(neighbor, newDist);
        // Solo iluminar si está vacía para terminar el movimiento
        if ((!occupant && !isBarrier) || canFly) { 
           // Nota: Si vuela/fase, puede pasar, pero no termina encima de barreras o piezas.
           if (!occupant && !isBarrier) neighbor.classList.add('square--move');
           queue.push({ square: neighbor, distance: newDist });
        }
      }
    });
  }
}

// --- RANGO Y TARGETING ---
function highlightRange(piece) {
  squares.forEach(s => s.classList.remove('square--range'));
  const origin = getPieceSquare(piece);
  const stats = getEffectiveStats(piece);
  const canFly = hasPassive(stats, 'Volar');
  const isFlyingAttack = canFly && currentAction === 'Ataque';
  let range = stats.rango === 0 ? 1 : stats.rango;

  // Modificadores de rango por acción
  if (currentAction === 'Superfuerza' || currentAction === 'Telekinesis') range = 3; // Rango para lanzar objetos
  if (currentAction === 'Control Mental') range = 5; // Rango típico mental

  squares.forEach((square) => {
    const dist = getDistance(origin, square);
    if (dist <= 0 || dist > range) return;
    if (square.classList.contains('square--barrier')) return;
    const lineBlocked = dist > 1 && !hasLineOfSight(origin, square);
    if (lineBlocked && !isFlyingAttack) return;
    square.classList.add('square--range');
  });

  if (origin && (currentAction === 'Pulso' || currentAction.includes('Mejora'))) {
    origin.classList.add('square--range');
  }
}

// --- ACCIONES Y PODERES ---

function renderPowerButtons(piece) {
  powerButtons.innerHTML = '';
  const stats = getEffectiveStats(piece);

  // Botón Básico
  createButton('Ataque', 'button--primary');

  // Activas
  if (stats.activos) {
    stats.activos.forEach(p => createButton(p.nombre, 'button'));
  }

  // Pasivas "activables" (como Telekinesis/Superfuerza si están listadas como pasivas en tu CSV pero quieres usarlas)
  // En tu CSV, Superfuerza es Pasiva pero dice "puede agarrar... perderá el turno". 
  // Lo trataremos como una acción especial si tiene la pasiva.
  if (hasPassive(stats, 'Superfuerza')) createButton('Superfuerza', 'button--warning');
}

function createButton(label, className) {
  const btn = document.createElement('button');
  btn.className = `button ${className}`;
  btn.textContent = label;
  btn.onclick = () => selectAction(label);
  powerButtons.appendChild(btn);
}

function selectAction(action) {
  currentAction = action;
  attackButton.textContent = action;
  clearTargetSelection();
  const attacker = turnOrder[turnIndex];
  highlightRange(attacker);
  logCombat(`Acción seleccionada: ${action}`);
}

// --- CLICK EN TABLERO ---
board.addEventListener('click', (e) => {
  const sq = e.target.closest('.square');
  if (!sq) return;
  const activePiece = turnOrder[turnIndex];
  
  // 1. Movimiento
  if (sq.classList.contains('square--move') && !sq.querySelector('.piece')) {
    movePiece(activePiece, sq);
    return;
  }

  // 2. Selección de Objetivo
  const targetPiece = sq.querySelector('.piece');
  
  if (pendingBarrierPlacement) {
    if (!areAdjacentSquares(pendingBarrierPlacement.lastSquare, sq)) return;
    if (!placeBarrierBlock(sq)) return;
    pendingBarrierPlacement.remaining--;
    pendingBarrierPlacement.created += 1;
    pendingBarrierPlacement.lastSquare = sq;
    updateBarrierPreview(sq);
    if (pendingBarrierPlacement.remaining <= 0 || barrierPreviewSquares.length === 0) {
      const created = pendingBarrierPlacement.created;
      logCombat(`Barrera creada (${created} segmentos).`);
      pendingBarrierPlacement = null;
      clearBarrierPreview();
      endTurn();
    }
    return;
  }

  // Caso especial: Barrera (target es una casilla vacía)
  if (currentAction === 'Barrera' && sq.classList.contains('square--range') && !targetPiece && !sq.classList.contains('square--barrier')) {
    resolveBarrier(activePiece, sq);
    return;
  }

  if (targetPiece) {
    if (!sq.classList.contains('square--range')) return; // Fuera de rango visual
    
    // Validar equipo según acción
    const isAlly = targetPiece.dataset.team === activePiece.dataset.team;
    const isSelf = targetPiece === activePiece;

    // Lógica de filtrado de objetivos
    let valid = false;
    const attackerStats = getEffectiveStats(activePiece);
    const targetStats = getEffectiveStats(targetPiece);
    const attackerCanFly = hasPassive(attackerStats, 'Volar');
    const targetCanFly = hasPassive(targetStats, 'Volar');
    
    if (currentAction === 'Curar' || currentAction.includes('Mejora')) {
      if (isAlly || isSelf) valid = true;
    } else if (currentAction === 'Ataque' || currentAction === 'Incapacitar' || currentAction === 'Control Mental') {
      if (!isAlly) valid = true;
    } else if (currentAction === 'Explosión' || currentAction === 'Pulso') {
      valid = true; // Afecta a todos, permite seleccionar centro
    } else if (currentAction === 'Superfuerza' || currentAction === 'Telekinesis') {
      if (!isAlly) valid = true; // Lanzar cosas al enemigo
    }

    if (valid && attackerCanFly && currentAction === 'Ataque' && !targetCanFly) {
      valid = false;
    }

    if (valid) selectTarget(targetPiece);
  }
});

function selectTarget(piece) {
  clearTargetSelection();
  selectedTarget = piece;
  getPieceSquare(piece).classList.add('square--target');
  attackButton.classList.add('button--pulse');
}

function selectSquareTarget(sq) {
  clearTargetSelection();
  selectedTarget = sq; // Target es el DIV, no una pieza
  sq.classList.add('square--target');
  attackButton.classList.add('button--pulse');
}

function clearTargetSelection() {
  selectedTarget = null;
  squares.forEach(s => s.classList.remove('square--target'));
  attackButton.classList.remove('button--pulse');
  clearBarrierPreview();
}

// --- EJECUCIÓN DE ACCIÓN (BOTÓN PRINCIPAL) ---
attackButton.addEventListener('click', () => {
  if (!selectedTarget && currentAction !== 'Pulso') return; // Pulso puede no requerir target si es self-centered
  
  const attacker = turnOrder[turnIndex];
  
  // Despachar a la función correcta
  if (currentAction === 'Ataque') resolveAttack(attacker, selectedTarget);
  else if (currentAction === 'Curar') resolveHeal(attacker, selectedTarget);
  else if (currentAction === 'Incapacitar') resolveIncapacitate(attacker, selectedTarget);
  else if (currentAction === 'Control Mental') resolveMindControl(attacker, selectedTarget);
  else if (currentAction === 'Explosión') resolveAOE(attacker, selectedTarget, 'explosion');
  else if (currentAction === 'Pulso') resolveAOE(attacker, selectedTarget || attacker, 'pulse'); // Pulso a veces es self
  else if (currentAction === 'Barrera') resolveBarrier(attacker, selectedTarget);
  else if (currentAction === 'Superfuerza' || currentAction === 'Telekinesis') resolveThrow(attacker, selectedTarget);
  else if (currentAction.includes('Mejora')) resolveBuff(attacker, selectedTarget, currentAction);
  
  if (currentAction === 'Barrera' && pendingBarrierPlacement) return;
  // Finalizar turno (salvo doble ataque, que es complejo, lo simplificamos a 1 acción)
  endTurn();
});

// --- LÓGICA DE RESOLUCIÓN ---

function rollDice(n = 2) {
  let sum = 0;
  for(let i=0; i<n; i++) sum += Math.floor(Math.random() * 6) + 1;
  return sum;
}

function calculateDamage(attacker, defender, type = 'normal') {
  const attStats = getEffectiveStats(attacker);
  const defStats = getEffectiveStats(defender);
  const dist = getDistance(getPieceSquare(attacker), getPieceSquare(defender));
  
  // 1. Daño Base
  let rawDmg = dist <= 1 ? (attStats.danoCC || attStats.dano) : (attStats.danoAD || attStats.dano);
  if (type === 'throw') rawDmg = 3; // Daño fijo por lanzar objeto
  
  // 2. Modificadores de Atacante
  if (hasPassive(attStats, 'Experto a/d') && dist > 1) rawDmg += 2;
  if (hasPassive(attStats, 'Garras') && dist <= 1) {
    // Reroll daño si impacta (simulado: +1d6 extra daño base temporal, simplificado a promedio +2)
    rawDmg += 2; 
  }

  // 3. Modificadores de Defensor
  let resistance = 0;
  if (hasPassive(defStats, 'Resistencia')) resistance += 1;
  if (hasPassive(defStats, 'Invulnerable') || hasPassive(defStats, 'Invunerable')) resistance += 2;
  
  // Sigilo: +2 Defensa (no reducción de daño, sino dificultad de impacto)
  let defense = defStats.defensa;
  if (hasPassive(defStats, 'Sigilo')) defense += 2;

  return { rawDmg, resistance, defense };
}

function applyDamage(target, amount) {
  const stats = pieceMap.get(target);
  stats.currentVida -= amount;
  if (stats.currentVida <= 0) {
    stats.currentVida = 0;
    eliminatePiece(target);
    logCombat(`${stats.nombre} ha sido ELIMINADO.`);
  }
}

function resolveAttack(attacker, defender) {
  const attStats = getEffectiveStats(attacker);
  const defStats = getEffectiveStats(defender);
  const attackerCanFly = hasPassive(attStats, 'Volar');
  const defenderCanFly = hasPassive(defStats, 'Volar');
  const attackerSquare = getPieceSquare(attacker);
  const defenderSquare = getPieceSquare(defender);
  const maxRange = attStats.rango === 0 ? 1 : attStats.rango;
  const distance = getDistance(attackerSquare, defenderSquare);
  if (attackerCanFly && !defenderCanFly) {
    logCombat('Un volador solo puede atacar a otro volador.');
    return;
  }
  if (distance > maxRange) {
    logCombat('El objetivo está fuera de rango.');
    return;
  }
  const lineBlocked = distance > 1 && !hasLineOfSight(attackerSquare, defenderSquare);
  if (lineBlocked && !attackerCanFly) {
    logCombat('Ataque bloqueado por una barrera.');
    return;
  }
  const dmgCalc = calculateDamage(attacker, defender);
  
  // Tirada
  const roll = rollDice(2);
  let isCrit = roll === 12;
  if (hasPassive(attStats, 'Astucia') || attStats.hasAstuciaBuff) isCrit = (roll >= 11);
  
  const totalHit = roll + attStats.ataque;
  
  let msg = `Tirada: ${roll} + ${attStats.ataque} = ${totalHit} vs Def ${dmgCalc.defense}. `;
  
  if (totalHit >= dmgCalc.defense || isCrit) {
    playSound('attack');
    let damage = Math.max(0, dmgCalc.rawDmg - dmgCalc.resistance);
    if (isCrit) damage *= 2; // Crítico x2
    
    applyDamage(defender, damage);
    msg += `¡IMPACTO! Daño: ${damage}.`;
    
    // Robo de Vida
    if (hasPassive(attStats, 'Robo de Vida')) {
      const heal = Math.min(damage, attStats.vida - attStats.currentVida);
      attStats.currentVida += heal;
      msg += ` (Roba ${heal} vida)`;
    }
  } else {
    playSound('fail');
    msg += "Fallo.";
  }
  logCombat(msg);
}

function resolveHeal(attacker, target) {
  const stats = pieceMap.get(target);
  // Fórmula CSV: Ataque + Daño Recibido + 2d6 >= Defensa
  const missingHealth = stats.vida - stats.currentVida;
  const attStats = getEffectiveStats(attacker);
  
  const roll = rollDice(2);
  const total = attStats.ataque + missingHealth + roll;
  
  if (total >= stats.defensa) {
    const healRoll = rollDice(1);
    const healAmount = Math.min(healRoll, missingHealth);
    stats.currentVida += healAmount;
    logCombat(`${attStats.nombre} cura a ${stats.nombre} por ${healAmount} PV.`);
  } else {
    logCombat("Fallo al intentar curar.");
  }
}

function resolveIncapacitate(attacker, defender) {
  const attStats = getEffectiveStats(attacker);
  const defStats = getEffectiveStats(defender); // Usamos get para leer defensa
  const targetData = pieceMap.get(defender); // Usamos get directo para escribir estado

  const roll = rollDice(2);
  if (roll + attStats.ataque >= defStats.defensa) {
    targetData.incapacitated = true;
    logCombat(`¡${targetData.nombre} INCAPACITADO! Pierde el próximo turno.`);
  } else {
    logCombat("Intento de incapacitar fallido.");
  }
}

function resolveMindControl(attacker, defender) {
  const roll = rollDice(2);
  const attStats = getEffectiveStats(attacker);
  const defStats = getEffectiveStats(defender);
  const targetData = pieceMap.get(defender);

  if (roll + attStats.ataque >= defStats.defensa) {
    targetData.mindControlTurns = 1;
    targetData.originalTeam = defender.dataset.team;
    // Cambiar equipo visualmente y lógicamente
    const newTeam = attacker.dataset.team;
    defender.dataset.team = newTeam;
    // Actualizar color borde (sucio pero efectivo)
    defender.style.borderColor = newTeam === HERO_TEAM ? '#2ecc71' : '#e74c3c';
    logCombat(`¡CONTROL MENTAL! ${targetData.nombre} cambia de bando.`);
  } else {
    logCombat("Control Mental resistido.");
  }
}

function resolveAOE(attacker, centerTarget, type) {
  playSound('explode');
  const centerSq = centerTarget.classList?.contains('square') ? centerTarget : getPieceSquare(centerTarget);
  const row = Number(centerSq.dataset.row);
  const col = Number(centerSq.dataset.col);
  
  // Lista de afectados: Centro + Adyacentes
  const coords = [[row,col], [row+1,col], [row-1,col], [row,col+1], [row,col-1]];
  
  let hits = [];
  coords.forEach(([r, c]) => {
    const sq = getSquareAt(r, c);
    if (sq) {
      const p = sq.querySelector('.piece');
      if (p) hits.push(p);
    }
  });

  // Pulso: Atacante no se daña a sí mismo si es el centro
  if (type === 'pulse') {
    hits = hits.filter(p => p !== attacker);
  }

  logCombat(`Resolviendo ${type === 'explosion' ? 'Explosión' : 'Pulso'}...`);
  hits.forEach(victim => {
    resolveAttack(attacker, victim); // Reutilizamos lógica de ataque individual
  });
}

function resolveThrow(attacker, defender) {
  // Simulación de Telekinesis/Superfuerza lanzando objetos
  // Tratamos como un ataque especial con daño fijo base alto
  logCombat(`${pieceMap.get(attacker).nombre} lanza escombros.`);
  const attStats = getEffectiveStats(attacker);
  const dmgCalc = calculateDamage(attacker, defender, 'throw');
  
  const roll = rollDice(2);
  if (roll + attStats.ataque >= dmgCalc.defense) {
    applyDamage(defender, dmgCalc.rawDmg); // Daño directo ignorando alguna resistencia
    logCombat(`Impacto de objeto: ${dmgCalc.rawDmg} daño.`);
  } else {
    logCombat("El objeto lanzado falla.");
  }
}

function placeBarrierBlock(square) {
  if (!square || square.querySelector('.piece') || square.classList.contains('square--barrier')) return false;
  const barrier = document.createElement('div');
  barrier.className = 'barrier';
  square.classList.add('square--barrier');
  square.appendChild(barrier);
  activeBarriers.push({ element: barrier, square, turns: BARRIER_DURATION });
  playSound('barrier');
  return true;
}

function resolveBarrier(attacker, square) {
  if (!square) return;
  if (!placeBarrierBlock(square)) return;
  pendingBarrierPlacement = { attacker, remaining: 3, lastSquare: square, created: 1 };
  updateBarrierPreview(square);
}

function resolveBuff(attacker, centerTarget, actionName) {
  // Buff AOE: Target + Adyacentes
  const centerSq = getPieceSquare(centerTarget);
  const row = Number(centerSq.dataset.row);
  const col = Number(centerSq.dataset.col);
  const coords = [[row,col], [row+1,col], [row-1,col], [row,col+1], [row,col-1]];

  let type = '';
  let val = 0;
  if (actionName.includes('Agilidad')) { type = 'agilidad'; val = 10; }
  if (actionName.includes('Defensa')) { type = 'defensa'; val = 1; }
  if (actionName.includes('Ataque')) { type = 'ataque'; val = 1; }
  if (actionName.includes('Crítico')) { type = 'critico'; val = 0; }

  let count = 0;
  coords.forEach(([r, c]) => {
    const sq = getSquareAt(r, c);
    const p = sq?.querySelector('.piece');
    if (p && p.dataset.team === attacker.dataset.team) {
      addBuff(p, type, val, 2);
      count++;
    }
  });
  logCombat(`${actionName} aplicada a ${count} aliados.`);
}

// --- FLUJO DE TURNOS ---
function movePiece(piece, square) {
  const dist = Number(reachableSquares(piece).get(square)); // (Necesita refactor rápido de reachableSquares para devolver Map correcto, asumimos que funciona como antes)
  // Simplificado para movimiento directo:
  square.appendChild(piece);
  spendMovement(piece, 1); // Coste simplificado o calcular dist
  playSound('click');
  highlightMovement(piece);
  highlightRange(piece);
}

function eliminatePiece(piece) {
  piece.dataset.eliminated = 'true';
  piece.style.opacity = '0.3';
  piece.style.pointerEvents = 'none';
  // Actualizar UI
  renderLifeCards();
}

function endTurn() {
  const currentP = turnOrder[turnIndex];
  const stats = pieceMap.get(currentP);

  // Regeneración
  if (hasPassive(stats, 'Regeneración') && stats.currentVida < stats.vida && stats.currentVida > 0) {
    stats.currentVida++;
    logCombat("Regeneración: +1 PV");
  }

  // Tick Buffs
  tickBuffs(currentP);

  // Tick Barreras (Global o por turno, simplificamos a reducir en cada turno global)
  activeBarriers.forEach(b => {
    b.turns--;
    if (b.turns <= 0) {
      b.element.remove();
      b.square.classList.remove('square--barrier');
    }
  });
  activeBarriers = activeBarriers.filter(b => b.turns > 0);

  // Siguiente turno
  clearTargetSelection();
  renderLifeCards();
  
  let loopGuard = 0;
  do {
    turnIndex = (turnIndex + 1) % turnOrder.length;
    loopGuard++;
  } while (turnOrder[turnIndex].dataset.eliminated === 'true' && loopGuard < 100);

  startTurn(turnOrder[turnIndex]);
}

function startTurn(piece) {
  const stats = pieceMap.get(piece);
  
  // Incapacitado?
  if (stats.incapacitated) {
    stats.incapacitated = false;
    logCombat(`${stats.nombre} está incapacitado y pierde el turno.`);
    endTurn();
    return;
  }

  // Reset Movimiento
  piece.dataset.movesLeft = stats.movimiento;
  
  // UI Update
  document.querySelectorAll('.piece').forEach(p => p.classList.remove('piece--active'));
  piece.classList.add('piece--active');
  updateStatusBar(piece);
  renderPowerButtons(piece);
  highlightMovement(piece);
  highlightRange(piece);

  // IA Tonta
  if (piece.dataset.team === VILLAIN_TEAM) {
    // Retraso para que se vea
    setTimeout(() => {
        // IA: Mover al enemigo más cercano y atacar si puede
        // Implementación básica placeholder
        const enemies = turnOrder.filter(p => p.dataset.team === HERO_TEAM && p.dataset.eliminated !== 'true');
        if (enemies.length > 0) {
            const target = enemies[0]; // Ataca al primero que pille
            resolveAttack(piece, target);
            endTurn();
        } else {
            endTurn();
        }
    }, 1000);
  }
}

function updateStatusBar(piece) {
  if (!turnInfo || !movementInfo) {
    return;
  }
  const stats = pieceMap.get(piece);
  turnInfo.textContent = `Turno: ${stats.nombre}`;
  movementInfo.textContent = `Mov: ${piece.dataset.movesLeft}`;
}

function logCombat(msg) {
  combatInfo.textContent = msg;
  console.log(msg);
}

// --- INIT ---
function init() {
  const pieces = Array.from(document.querySelectorAll('.piece'));
  pieces.forEach(p => {
    const key = p.dataset.key;
    const base = personajes[key];
    if (base) {
      // Hidratar estado inicial
      pieceMap.set(p, { 
        ...base, 
        currentVida: base.vida,
        originalAgilidad: base.agilidad,
        originalDefensa: base.defensa,
        originalAtaque: base.ataque,
        buffs: []
      });
    }
  });

  // Ordenar por agilidad
  turnOrder = pieces.sort((a, b) => {
    const sa = pieceMap.get(a);
    const sb = pieceMap.get(b);
    return (sb?.agilidad || 0) - (sa?.agilidad || 0);
  });

  renderLifeCards();
  if (turnOrder.length) startTurn(turnOrder[0]);
}

function renderLifeCards() {
  allyCards.innerHTML = '';
  enemyCards.innerHTML = '';
  turnOrder.forEach(p => {
    const stats = pieceMap.get(p);
    if (!stats) return;
    const div = document.createElement('div');
    div.className = 'life-card';
    if (p.dataset.eliminated === 'true') div.style.opacity = '0.5';
    div.innerHTML = `
      <img src="${stats.imagen}" class="life-card__avatar">
      <div><strong>${stats.nombre}</strong><br>Vida: ${stats.currentVida}/${stats.vida}</div>
    `;
    (p.dataset.team === HERO_TEAM ? allyCards : enemyCards).appendChild(div);
  });
}

// Arrancar
init();
