const board = document.querySelector('.board');
const squares = Array.from(board.querySelectorAll('.square'));
const tooltip = document.getElementById('tooltip');
const passButton = document.getElementById('passTurn');
const attackButton = document.getElementById('attack');
const turnInfo = document.getElementById('turnInfo');
const movementInfo = document.getElementById('movementInfo');
const allyCards = document.getElementById('allyCards');
const enemyCards = document.getElementById('enemyCards');
const heroHistoryList = document.getElementById('heroHistory');
const villainHistoryList = document.getElementById('villainHistory');
const powerButtons = document.getElementById('powerButtons');

const pieceStats = personajes;

Object.entries(pieceStats).forEach(([key, stats]) => {
  if (!stats.name && stats.nombre) {
    stats.name = stats.nombre;
  }

  if (!stats.nombre && stats.name) {
    stats.nombre = stats.name;
  }

  if (!stats.nombre && !stats.name) {
    stats.name = key;
    stats.nombre = key;
  }

  const baseDamage = stats.dano ?? stats.danoCC ?? stats.danoAD ?? 0;
  stats.dano = baseDamage;
  stats.danoCC = stats.danoCC ?? baseDamage;
  stats.danoAD = stats.danoAD ?? baseDamage;

  const baseResistencia = stats.resistencia ?? stats.resistenciaCC ?? stats.resistenciaAD ?? 0;
  stats.resistencia = baseResistencia;
});
const HERO_TEAM = 'aliado';
const VILLAIN_TEAM = 'enemigo';
const POWER_LABELS = {
  incapacitar: 'Incapacitar',
};

const squareByCoord = new Map();

const FLYING_CHARACTERS = new Set(['avispa', 'duende', 'magneto', 'ultron', 'thanos']);

const PHASING_CHARACTERS = new Set(['kang']);

const LEAPING_CHARACTERS = new Set(['hulk', 'spiderMan']);

squares.forEach((square, index) => {
  const row = Math.floor(index / 8) + 1;
  const col = (index % 8) + 1;
  square.dataset.row = row;
  square.dataset.col = col;
  squareByCoord.set(`${row}-${col}`, square);
});

const pieceMap = new Map();

function isAlive(piece) {
  return piece && piece.dataset.eliminated !== 'true';
}

function isHero(piece) {
  return piece.dataset.team === HERO_TEAM;
}

function isVillain(piece) {
  return piece.dataset.team === VILLAIN_TEAM;
}

function livingPieces(team) {
  return turnOrder.filter((piece) => piece.dataset.team === team && isAlive(piece));
}

function hasPassive(stats, power) {
  return stats?.poderes?.pasivos?.includes(power);
}

function canTraverseEnemies(piece) {
  const key = piece?.dataset?.key;
  return FLYING_CHARACTERS.has(key) || PHASING_CHARACTERS.has(key) || LEAPING_CHARACTERS.has(key);
}

function hasActive(stats, power) {
  return stats?.poderes?.activos?.includes(power);
}

function powerLabel(key) {
  return POWER_LABELS[key] ?? key;
}

function pieceColor(element) {
  return element.dataset.team === 'aliado' ? '#2ecc71' : '#e74c3c';
}

function displayName(stats) {
  return stats?.nombre ?? stats?.name ?? 'Desconocido';
}

function attachPieceData(piece, key, team) {
  const base = pieceStats[key];
  const baseDamage = base?.dano ?? base?.danoCC ?? base?.danoAD ?? 0;
  const baseResistencia = base?.resistencia ?? 0;
  const stats = {
    ...base,
    dano: baseDamage,
    danoCC: base?.danoCC ?? baseDamage,
    danoAD: base?.danoAD ?? baseDamage,
    resistencia: baseResistencia,
    baseAtaque: base?.ataque ?? 0,
    currentVida: base?.vida,
    skipTurns: 0,
  };
  piece.dataset.key = key;
  piece.dataset.team = team;
  piece.dataset.rango = stats.rango;
  piece.dataset.movimiento = stats.movimiento;
  piece.dataset.stats = JSON.stringify(stats);
  pieceMap.set(piece, stats);
}

const pieces = Array.from(board.querySelectorAll('.piece')).map((element) => ({
  element,
  key: element.dataset.key,
  team: element.dataset.team,
}));

pieces.forEach(({ element, key, team }) => {
  if (element) {
    attachPieceData(element, key, team);
  }
});

function renderLifeCards() {
  allyCards.innerHTML = '';
  enemyCards.innerHTML = '';

  pieces.forEach(({ element }) => {
    if (!element) return;
    const stats = pieceMap.get(element);
    const container = element.dataset.team === 'aliado' ? allyCards : enemyCards;
    const card = document.createElement('div');
    card.className = 'life-card';
    card.innerHTML = `
      <span class="life-card__name"><span class="life-dot" style="background:${pieceColor(
        element
      )}"></span>${displayName(stats)}</span>
      <span class="life-value">Vida: ${Math.max(stats.currentVida, 0)}</span>
    `;
    container.appendChild(card);
  });
}

renderLifeCards();

const turnOrder = pieces
  .map(({ element }) => element)
  .filter(Boolean)
  .sort((a, b) => {
    const statsA = pieceMap.get(a);
    const statsB = pieceMap.get(b);
    if (statsA.agilidad === statsB.agilidad) {
      return Math.random() < 0.5 ? -1 : 1;
    }
    return statsB.agilidad - statsA.agilidad;
  });

let turnIndex = 0;
let selectedTarget = null;
let pendingAttackInfo = null;
let selectedAbility = null;

function normalizeAbilityKey(ability) {
  if (!ability) return null;
  return ability
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

const SUPPORT_ABILITIES = new Set([
  'mejora de ataque',
  'mejora de agilidad',
  'mejora de defensa',
  'mejora de critico',
  'curar',
]);

function isSupportAbility(ability) {
  return ability ? SUPPORT_ABILITIES.has(normalizeAbilityKey(ability)) : false;
}

function getPieceSquare(piece) {
  return piece.closest('.square');
}

function getSquareAt(row, col) {
  return squareByCoord.get(`${row}-${col}`) ?? null;
}

function reachableSquares(piece) {
  const origin = getPieceSquare(piece);
  const maxMove = remainingMovement(piece);
  const reachable = new Map();
  if (!origin || maxMove <= 0) return reachable;

  const queue = [{ square: origin, distance: 0 }];
  reachable.set(origin, 0);

  while (queue.length > 0) {
    const { square, distance } = queue.shift();
    if (distance >= maxMove) continue;

    const row = Number(square.dataset.row);
    const col = Number(square.dataset.col);
    const neighbors = [
      [row + 1, col],
      [row - 1, col],
      [row, col + 1],
      [row, col - 1],
    ];

    neighbors.forEach(([r, c]) => {
      const neighbor = getSquareAt(r, c);
      if (!neighbor) return;
      if (reachable.has(neighbor)) return;

      const occupant = neighbor.querySelector('.piece');
      if (occupant && occupant !== piece && occupant.dataset.team !== piece.dataset.team) {
        if (!canTraverseEnemies(piece)) return;
      }

      const nextDistance = distance + 1;
      if (nextDistance <= maxMove) {
        reachable.set(neighbor, nextDistance);
        queue.push({ square: neighbor, distance: nextDistance });
      }
    });
  }

  return reachable;
}

function clearMoveHighlights() {
  squares.forEach((square) => square.classList.remove('square--move'));
}

function clearRangeHighlights() {
  squares.forEach((square) => square.classList.remove('square--range', 'square--target'));
}

function clearHighlights() {
  clearMoveHighlights();
  clearRangeHighlights();
  tooltip.hidden = true;
  selectedTarget = null;
}

function highlightMovement(piece) {
  const reachable = availableMoveSquares(piece);
  reachable.forEach(({ square }) => {
    square.classList.add('square--move');
  });
}

function isWithinAttackRange(attackerSquare, targetSquare, maxRange) {
  const attackerRow = Number(attackerSquare.dataset.row);
  const attackerCol = Number(attackerSquare.dataset.col);
  const targetRow = Number(targetSquare.dataset.row);
  const targetCol = Number(targetSquare.dataset.col);
  const distance = Math.abs(targetRow - attackerRow) + Math.abs(targetCol - attackerCol);
  return distance > 0 && distance <= maxRange;
}

function highlightRange(piece) {
  clearRangeHighlights();
  const origin = getPieceSquare(piece);
  if (!origin) return;
  const maxRange = rangeForPiece(piece);
  if (maxRange <= 0) return;
  squares.forEach((square) => {
    if (isWithinAttackRange(origin, square, maxRange)) {
      square.classList.add('square--range');
    }
  });
}

function setActivePiece(piece) {
  document.querySelectorAll('.piece').forEach((p) => p.classList.remove('piece--active'));
  piece.classList.add('piece--active');
  updateStatusBar(piece);
  updateCombatInfo();
}

function renderPowerButtons(piece) {
  if (!powerButtons) return;
  powerButtons.innerHTML = '';
  if (!piece) return;
  const stats = pieceMap.get(piece);
  const activePowers = stats?.poderes?.activos ?? [];
  activePowers.forEach((powerKey) => {
    const key = normalizeAbilityKey(powerKey?.nombre ?? powerKey);
    const label = powerKey?.nombre ?? powerLabel(key);
    const btn = document.createElement('button');
    btn.className = 'button';
    btn.type = 'button';
    btn.textContent = label;
    btn.addEventListener('click', () => handleActivePower(key));
    powerButtons.appendChild(btn);
  });
}

function updateStatusBar(piece) {
  const stats = pieceMap.get(piece);
  if (!stats) return;
  turnInfo.textContent = `Turno: ${displayName(stats)}`;
  movementInfo.textContent = `Movimiento restante: ${remainingMovement(piece)}`;
}

function attackDistance(attackerSquare, targetSquare) {
  return (
    Math.abs(Number(attackerSquare.dataset.row) - Number(targetSquare.dataset.row)) +
    Math.abs(Number(attackerSquare.dataset.col) - Number(targetSquare.dataset.col))
  );
}

function availableMoveSquares(piece) {
  const reachable = reachableSquares(piece);
  const destinations = [];
  reachable.forEach((distance, square) => {
    if (distance === 0) return;
    const occupant = square.querySelector('.piece');
    if (occupant && occupant !== piece) return;
    destinations.push({ square, distance });
  });
  return destinations;
}

function closestHeroTarget(piece) {
  const heroes = livingPieces(HERO_TEAM);
  if (heroes.length === 0) return null;
  const origin = getPieceSquare(piece);
  return heroes
    .map((hero) => ({ hero, square: getPieceSquare(hero) }))
    .filter(({ square }) => square)
    .map(({ hero, square }) => ({ hero, distance: attackDistance(origin, square) }))
    .sort((a, b) => a.distance - b.distance)[0]?.hero;
}

function bestSquareTowardHeroes(piece) {
  const origin = getPieceSquare(piece);
  const heroes = livingPieces(HERO_TEAM).map((hero) => getPieceSquare(hero)).filter(Boolean);
  if (!origin || heroes.length === 0) return null;
  const candidates = availableMoveSquares(piece);
  if (candidates.length === 0) return null;
  const scored = candidates.map(({ square }) => {
    const distance = Math.min(...heroes.map((heroSquare) => attackDistance(square, heroSquare)));
    return { square, distance };
  });
  scored.sort((a, b) => a.distance - b.distance || Number(a.square.dataset.row) - Number(b.square.dataset.row));
  return scored[0]?.square ?? null;
}

function calculateDamage(attackerStats, defenderStats, distance, isCritical) {
  const isMelee = distance <= 1;
  const garrasRoll = isMelee && hasPassive(attackerStats, 'cuchillas') ? Math.floor(Math.random() * 6) + 1 : null;
  const damageForMode = isMelee ? attackerStats.danoCC : attackerStats.danoAD;
  const baseDamageStat = attackerStats.dano ?? damageForMode ?? 0;
  const baseDamage = isMelee && garrasRoll !== null ? Math.max(garrasRoll, damageForMode ?? baseDamageStat) : damageForMode ?? baseDamageStat;
  const resistance = defenderStats.resistencia ?? 0;
  const damageBeforeResist = isCritical ? baseDamage * 2 : baseDamage;
  const totalDamage = Math.max(damageBeforeResist - resistance, 0);
  return { totalDamage, isMelee, garrasRoll, baseDamage };
}

function eliminatePiece(piece) {
  const index = turnOrder.indexOf(piece);
  if (index !== -1) {
    turnOrder.splice(index, 1);
    if (index <= turnIndex && turnIndex > 0) {
      turnIndex -= 1;
    }
  }
  piece.dataset.eliminated = 'true';
  piece.remove();
}

function rangeForPiece(piece) {
  const r = parseInt(piece.dataset.rango, 10);
  return r === 0 ? 1 : r;
}

function showTooltip(piece) {
  const stats = pieceMap.get(piece);
  if (!stats) return;
  tooltip.innerHTML = `
    <h3>${displayName(stats)}</h3>
    <ul>
      <li>Mov: ${stats.movimiento}</li>
      <li>Atk: ${stats.ataque}</li>
      <li>Def: ${stats.defensa}</li>
      <li>Daño: ${stats.dano ?? stats.danoCC ?? stats.danoAD ?? 0}</li>
      <li>Resistencia: ${stats.resistencia ?? 0}</li>
      <li>Rango: ${stats.rango}</li>
      <li>Vida: ${Math.max(stats.currentVida, 0)}</li>
      <li>Agilidad: ${stats.agilidad}</li>
    </ul>
  `;
  tooltip.hidden = false;
}

function positionTooltip(target) {
  tooltip.style.left = '50%';
  tooltip.style.top = '50%';
}

function hideTooltip() {
  tooltip.hidden = true;
}

function updateCombatInfo() {
  const combatBox = document.getElementById('combatInfo');
  if (!pendingAttackInfo) {
    combatBox.textContent = '';
    return;
  }
  const {
    attacker,
    defender,
    difference,
    roll,
    success,
    critical,
    damage,
    defenderVida,
    attackerName,
    defenderName,
    action,
    damageRoll,
  } = pendingAttackInfo;
  let rollText = roll ? ` | Tirada 2d6: ${roll}` : '';
  let successText = '';
  if (roll) {
    successText = success ? critical ? ' (Crítico)' : ' (Éxito)' : ' (Fallo)';
  }
  const damageRollText = damageRoll ? ` | Garras 1d6: ${damageRoll}` : '';
  const damageText = roll ? ` | Daño: ${damage} | Vida defensor: ${defenderVida}` : '';
  combatBox.textContent = `${action ?? 'Ataque'} ${attackerName} (${attacker}) vs ${defenderName} (${defender}) | Diferencia: ${difference}${rollText}${successText}${damageRollText}${damageText}`;
}

function appendHistory(attacker, defender) {
  if (!pendingAttackInfo) return;
  const list = isHero(attacker) ? heroHistoryList : villainHistoryList;
  if (!list) return;
  const { attackerName, defenderName, difference, roll, success, critical, damage, defenderVida, action, damageRoll } =
    pendingAttackInfo;
  const outcome = roll ? (critical ? 'Crítico' : success ? 'Éxito' : 'Fallo') : 'Sin tirada';
  const li = document.createElement('li');
  li.className = 'history__item';
  li.innerHTML = `
    <strong>${attackerName}</strong> (${action ?? 'Ataque'}) → ${defenderName}<br/>
    Dif: ${difference} | Tirada: ${roll ?? '-'} (${outcome})<br/>
    ${damageRoll ? `Garras 1d6: ${damageRoll} | ` : ''}Daño: ${damage} | Vida defensor: ${defenderVida}
  `;
  list.prepend(li);
  while (list.children.length > 30) {
    list.removeChild(list.lastChild);
  }
}

function appendStatusHistory(piece, message) {
  const list = isHero(piece) ? heroHistoryList : villainHistoryList;
  if (!list) return;
  const stats = pieceMap.get(piece);
  const li = document.createElement('li');
  li.className = 'history__item';
  li.innerHTML = `<strong>${stats?.name ?? 'Personaje'}</strong>: ${message}`;
  list.prepend(li);
  while (list.children.length > 30) {
    list.removeChild(list.lastChild);
  }
}

function prepareAttackInfo(attacker, defender, ability = null) {
  const attackerStats = pieceMap.get(attacker);
  const defenderStats = pieceMap.get(defender);
  pendingAttackInfo = {
    attacker: attackerStats.ataque,
    defender: defenderStats.defensa,
    difference: attackerStats.ataque - defenderStats.defensa,
    roll: null,
    success: null,
    critical: false,
    damage: 0,
    defenderVida: defenderStats.currentVida,
    attackerName: attackerStats.name,
    defenderName: defenderStats.name,
    action: ability ? powerLabel(ability) : 'Ataque',
  };
  attackButton.classList.add('button--pulse');
  updateCombatInfo();
}

function calculateAttackRoll(attackerStats) {
  const die1 = Math.floor(Math.random() * 6) + 1;
  const die2 = Math.floor(Math.random() * 6) + 1;
  const roll = die1 + die2;
  const critical = roll === 12 || (hasPassive(attackerStats, 'astucia') && roll === 11);
  return { roll, critical };
}

function buildAttackInfo(attackerStats, defenderStats, distance, rollInfo, ability) {
  const { roll, critical } = rollInfo;
  const { totalDamage, garrasRoll } = calculateDamage(attackerStats, defenderStats, distance, critical);
  let success = false;
  if (critical) {
    success = true;
  } else if (roll === 2) {
    success = false;
  } else if (roll + attackerStats.ataque >= defenderStats.defensa) {
    success = true;
  }
  const inflictedDamage = success && ability !== 'incapacitar' ? totalDamage : 0;
  return {
    roll,
    critical,
    success,
    totalDamage,
    inflictedDamage,
    garrasRoll,
  };
}

function applyAttackOutcome(attacker, defender, outcome, ability, { skipFinish = false } = {}) {
  const attackerStats = pieceMap.get(attacker);
  const defenderStats = pieceMap.get(defender);
  if (!attackerStats || !defenderStats) return;

  if (outcome.success) {
    defenderStats.currentVida = Math.max(defenderStats.currentVida - outcome.inflictedDamage, 0);
    if (ability === 'incapacitar') {
      defenderStats.skipTurns = (defenderStats.skipTurns ?? 0) + 1;
    }
  }

  pendingAttackInfo = {
    attacker: attackerStats.ataque,
    defender: defenderStats.defensa,
    difference: attackerStats.ataque - defenderStats.defensa,
    roll: outcome.roll,
    success: outcome.success,
    critical: outcome.critical,
    damage: outcome.success ? (ability === 'incapacitar' ? 0 : outcome.totalDamage) : 0,
    defenderVida: defenderStats.currentVida,
    attackerName: attackerStats.name,
    defenderName: defenderStats.name,
    action: ability ? powerLabel(ability) : 'Ataque',
    damageRoll: outcome.garrasRoll,
  };

  appendHistory(attacker, defender);

  if (outcome.success && defenderStats.currentVida <= 0) {
    eliminatePiece(defender);
  }

  renderLifeCards();
  hideTooltip();
  if (!skipFinish) {
    clearRangeHighlights();
    selectedTarget = null;
    attackButton.classList.remove('button--pulse');
    updateCombatInfo();
    finishTurn(attacker);
  } else {
    updateCombatInfo();
  }
}

function resolveAttack(attacker, defender, { ability = null, rollInfo = null, skipFinish = false } = {}) {
  const attackerStats = pieceMap.get(attacker);
  const defenderStats = pieceMap.get(defender);
  const attackerSquare = getPieceSquare(attacker);
  const targetSquare = getPieceSquare(defender);
  const distance = attackDistance(attackerSquare, targetSquare);

  const roll = rollInfo ?? calculateAttackRoll(attackerStats);
  const outcome = buildAttackInfo(attackerStats, defenderStats, distance, roll, ability);
  applyAttackOutcome(attacker, defender, outcome, ability, { skipFinish });
}

function squaresInRange1(centerSquare) {
  const row = Number(centerSquare.dataset.row);
  const col = Number(centerSquare.dataset.col);
  const positions = [
    [row, col],
    [row + 1, col],
    [row - 1, col],
    [row, col + 1],
    [row, col - 1],
  ];
  return positions.map(([r, c]) => getSquareAt(r, c)).filter(Boolean);
}

function resolveAreaAttack(attacker, centerSquare, ability) {
  const attackerStats = pieceMap.get(attacker);
  if (!attackerStats) return;
  const targets = Array.from(
    new Set(
      squaresInRange1(centerSquare)
        .map((square) => square.querySelector('.piece'))
        .filter((piece) => piece && piece !== attacker && isAlive(piece))
    )
  );

  if (targets.length === 0) {
    alert('No hay objetivos en el área.');
    return;
  }

  const rollInfo = calculateAttackRoll(attackerStats);
  targets.forEach((target) => {
    resolveAttack(attacker, target, { ability, rollInfo, skipFinish: true });
  });

  clearRangeHighlights();
  selectedTarget = null;
  attackButton.classList.remove('button--pulse');
  finishTurn(attacker);
}

function applyAttackBuff(piece, duration = 2) {
  const stats = pieceMap.get(piece);
  if (!stats) return;
  const baseAttack = stats.baseAtaque ?? stats.ataque ?? 0;
  const bonus = Math.min(1, 1);
  const currentBonus = stats.attackBuff?.bonus ?? 0;
  const refreshed = currentBonus > 0;
  const totalBonus = Math.min(bonus, 1);
  stats.attackBuff = { bonus: totalBonus, remaining: duration };
  stats.ataque = baseAttack + totalBonus;
  appendStatusHistory(
    piece,
    refreshed
      ? `renueva Mejora de Ataque (+${totalBonus}) por ${duration} turnos.`
      : `recibe Mejora de Ataque (+${totalBonus}) por ${duration} turnos.`
  );
}

function applyAttackBuffAction(attacker, centerTarget) {
  if (!centerTarget) {
    alert('Selecciona primero un compañero dentro de tu rango.');
    return;
  }
  const centerSquare = getPieceSquare(centerTarget);
  if (!centerSquare) return;
  const allies = Array.from(
    new Set(
      squaresInRange1(centerSquare)
        .map((square) => square.querySelector('.piece'))
        .filter(
          (piece) =>
            piece &&
            piece.dataset.team === attacker.dataset.team &&
            isAlive(piece)
        )
    )
  );

  if (!allies.includes(centerTarget)) {
    allies.unshift(centerTarget);
  }

  if (allies.length === 0) {
    alert('No hay compañeros en el área para aplicar la mejora.');
    return;
  }

  allies.forEach((piece) => applyAttackBuff(piece));
  clearRangeHighlights();
  selectedTarget = null;
  selectedAbility = null;
  attackButton.classList.remove('button--pulse');
  finishTurn(attacker);
}

function clearTargetSelection(preserveAttack = false) {
  squares.forEach((square) => square.classList.remove('square--target'));
  selectedTarget = null;
  if (!preserveAttack) {
    pendingAttackInfo = null;
    selectedAbility = null;
  }
  attackButton.classList.remove('button--pulse');
  hideTooltip();
  updateCombatInfo();
  if (turnOrder.length > 0) {
    highlightRange(turnOrder[turnIndex]);
  }
}

function performAttackAction(ability = null) {
  const attacker = turnOrder[turnIndex];
  if (!attacker) return;
  const normalizedAbility = normalizeAbilityKey(ability);
  if (normalizedAbility) {
    selectedAbility = normalizedAbility;
  }
  const attackerSquare = getPieceSquare(attacker);
  const targetSquare = selectedTarget ? getPieceSquare(selectedTarget) : null;
  const maxRange = rangeForPiece(attacker);

  if (normalizedAbility === 'pulso' && !selectedTarget) {
    resolveAreaAttack(attacker, attackerSquare, normalizedAbility);
    return;
  }

  if (!targetSquare) {
    const needsAlly = isSupportAbility(normalizedAbility);
    alert(needsAlly ? 'Selecciona primero un compañero dentro de tu rango.' : 'Selecciona primero un enemigo dentro de tu rango.');
    return;
  }

  if (!isWithinAttackRange(attackerSquare, targetSquare, maxRange)) {
    alert('El objetivo está fuera de rango.');
    return;
  }

  if (normalizedAbility === 'mejora de ataque') {
    applyAttackBuffAction(attacker, selectedTarget);
    return;
  }

  if (normalizedAbility === 'explosion' || normalizedAbility === 'pulso') {
    resolveAreaAttack(attacker, targetSquare, normalizedAbility);
    return;
  }
  prepareAttackInfo(attacker, selectedTarget, normalizedAbility);
  resolveAttack(attacker, selectedTarget, { ability: normalizedAbility });
}

function handleActivePower(powerKey) {
  performAttackAction(powerKey);
}

attackButton.addEventListener('click', () => {
  selectedAbility = null;
  performAttackAction();
});

const movementPool = new Map();

function remainingMovement(piece) {
  return movementPool.get(piece) ?? Number(piece.dataset.movimiento);
}

function resetMovement(piece) {
  movementPool.set(piece, Number(piece.dataset.movimiento));
}

function spendMovement(piece, amount) {
  const left = Math.max(remainingMovement(piece) - amount, 0);
  movementPool.set(piece, left);
}

function applyEndOfTurnEffects(piece) {
  const stats = pieceMap.get(piece);
  if (!stats) return;
  tickSupportEffects(piece);
  if (hasPassive(stats, 'regeneracion') && stats.currentVida < stats.vida) {
    const before = stats.currentVida;
    stats.currentVida = Math.min(stats.currentVida + 1, stats.vida);
    const healed = stats.currentVida - before;
    if (healed > 0) {
      appendStatusHistory(piece, `se regenera +${healed} (Vida: ${stats.currentVida}/${stats.vida})`);
    }
  }
}

function tickSupportEffects(piece) {
  const stats = pieceMap.get(piece);
  if (!stats) return;
  if (stats.attackBuff) {
    stats.attackBuff.remaining -= 1;
    if (stats.attackBuff.remaining <= 0) {
      stats.attackBuff = null;
      stats.ataque = stats.baseAtaque ?? stats.ataque;
      appendStatusHistory(piece, 'pierde la Mejora de Ataque.');
    }
  }
}

function finishTurn(piece) {
  applyEndOfTurnEffects(piece);
  renderLifeCards();
  clearHighlights();
  clearTargetSelection();
  nextTurn();
}

board.addEventListener('click', (event) => {
  const square = event.target.closest('.square');
  if (!square) return;

  const activePiece = turnOrder[turnIndex];
  if (!activePiece) return;
  const targetPiece = square.querySelector('.piece');

  if (targetPiece && targetPiece !== activePiece) {
    const allowAllyTarget = isSupportAbility(selectedAbility);
    if (targetPiece.dataset.team === activePiece.dataset.team && !allowAllyTarget) return;
    const attackerSquare = getPieceSquare(activePiece);
    const maxRange = rangeForPiece(activePiece);
    if (!isWithinAttackRange(attackerSquare, square, maxRange)) {
      alert('Objetivo fuera de rango.');
      clearTargetSelection();
      return;
    }
    clearTargetSelection();
    square.classList.add('square--target');
    selectedTarget = targetPiece;
    prepareAttackInfo(activePiece, targetPiece, selectedAbility);
    return;
  }

  if (!square.classList.contains('square--move')) return;
  if (square.querySelector('.piece')) return;
  const reachable = reachableSquares(activePiece);
  const distance = reachable.get(square);
  if (!distance) return;
  if (distance > remainingMovement(activePiece)) return;
  square.appendChild(activePiece);
  spendMovement(activePiece, distance);
  clearHighlights();
  highlightMovement(activePiece);
  highlightRange(activePiece);
  updateStatusBar(activePiece);
});

function attachTooltipEvents(piece) {
  piece.addEventListener('pointerenter', () => {
    const activePiece = turnOrder[turnIndex];
    if (piece === activePiece || piece.dataset.team === activePiece.dataset.team) {
      hideTooltip();
      return;
    }
    showTooltip(piece);
    positionTooltip(piece);
  });

  piece.addEventListener('pointerleave', () => {
    hideTooltip();
  });
}

pieces.forEach(({ element }) => {
  if (element) {
    attachTooltipEvents(element);
  }
});

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function shouldUseIncapacitar(attackerStats, targetStats, expectedDamage = 0) {
  if (!attackerStats || !targetStats) return false;
  const targetResilience = targetStats.resistencia ?? 0;
  const targetThreat = targetStats.ataque ?? 0;
  const targetVida = targetStats.currentVida ?? targetStats.vida ?? 0;
  const canHurtEasily = targetVida <= expectedDamage + 1;
  const lowThreat = targetThreat <= 9;
  return expectedDamage < 1 && !(canHurtEasily && lowThreat) && targetResilience >= 2;
}

function expectedDamage(attackerStats, targetStats, distance) {
  const isMelee = distance <= 1;
  const baseDamage = attackerStats.dano ?? (isMelee ? attackerStats.danoCC ?? 0 : attackerStats.danoAD ?? 0);
  const resistance = targetStats.resistencia ?? 0;
  return Math.max(baseDamage - resistance, 0);
}

function bestVillainDecision(piece) {
  const attackerStats = pieceMap.get(piece);
  const origin = getPieceSquare(piece);
  const reachable = reachableSquares(piece);
  const candidates = [];
  reachable.forEach((distance, square) => {
    const occupant = square.querySelector('.piece');
    if (square !== origin && occupant) return;
    candidates.push({ square, distance });
  });

  const heroes = livingPieces(HERO_TEAM);
  let best = null;

  candidates.forEach(({ square, distance }) => {
    heroes.forEach((hero) => {
      const heroSquare = getPieceSquare(hero);
      if (!heroSquare) return;
      if (!isWithinAttackRange(square, heroSquare, rangeForPiece(piece))) return;

      const targetStats = pieceMap.get(hero);
      const attackDistanceValue = attackDistance(square, heroSquare);
      const damage = expectedDamage(attackerStats, targetStats, attackDistanceValue);
      const canIncapacitate =
        hasActive(attackerStats, 'incapacitar') && shouldUseIncapacitar(attackerStats, targetStats, damage);
      const ability = canIncapacitate ? 'incapacitar' : null;
      const damageScore = ability ? targetStats.ataque + targetStats.defensa : damage * 10;
      const finisherBonus = ability ? 0 : targetStats.currentVida <= damage ? 5 : 0;
      const movePenalty = distance * 0.1;
      const score = damageScore + finisherBonus - movePenalty;

      if (!best || score > best.score) {
        best = {
          target: hero,
          targetSquare: heroSquare,
          square,
          distance,
          ability,
          score,
        };
      }
    });
  });

  return best;
}

async function runVillainTurn(piece) {
  if (!isAlive(piece)) {
    nextTurn();
    return;
  }

  clearHighlights();
  highlightMovement(piece);
  highlightRange(piece);
  updateStatusBar(piece);
  await wait(1200);

  const decision = bestVillainDecision(piece);

  if (decision) {
    const origin = getPieceSquare(piece);
    if (decision.square && decision.square !== origin) {
      const reachable = reachableSquares(piece);
      const moveDistance = reachable.get(decision.square) ?? attackDistance(origin, decision.square);
      decision.square.classList.add('square--target');
      await wait(1000);
      decision.square.appendChild(piece);
      spendMovement(piece, moveDistance);
      clearRangeHighlights();
      highlightMovement(piece);
      highlightRange(piece);
      await wait(1000);
    }

    clearTargetSelection(true);
    clearHighlights();
    if (decision.targetSquare) {
      decision.targetSquare.classList.add('square--target');
    }
    highlightRange(piece);
    prepareAttackInfo(piece, decision.target, decision.ability);
    updateStatusBar(piece);
    await wait(1500);
    resolveAttack(piece, decision.target, { ability: decision.ability });
    return;
  }

  clearHighlights();
  finishTurn(piece);
}

function startTurn(piece) {
  if (!piece) return;
  if (!isAlive(piece)) {
    nextTurn();
    return;
  }
  const stats = pieceMap.get(piece);
  if (stats?.skipTurns && stats.skipTurns > 0) {
    stats.skipTurns -= 1;
    finishTurn(piece);
    return;
  }
  resetMovement(piece);
  setActivePiece(piece);
  clearTargetSelection(true);
  clearHighlights();
  renderPowerButtons(piece);
  attackButton.disabled = false;
  passButton.disabled = false;
  highlightMovement(piece);
  highlightRange(piece);
}

function nextTurn() {
  if (turnOrder.length === 0) return;
  turnIndex = (turnIndex + 1) % turnOrder.length;
  startTurn(turnOrder[turnIndex]);
}

passButton.addEventListener('click', () => {
  const piece = turnOrder[turnIndex];
  finishTurn(piece);
});

startTurn(turnOrder[turnIndex]);
