/* ==========================================================================
   1. LÓGICA DE DRAFT
   ========================================================================== */

function normalizeKey(str) {
    if (!str) return '';
    return str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function hasPower(stats, powerName) {
    const search = normalizeKey(powerName);
    const activos = (stats.poderes?.activos || []).map(p => normalizeKey(p.nombre || p));
    const pasivos = (stats.poderes?.pasivos || []).map(p => normalizeKey(p.nombre || p));
    const legacy = (stats.habilidades?.pasivas || []).map(p => normalizeKey(p.nombre || p)); 
    return activos.includes(search) || pasivos.includes(search) || legacy.includes(search);
}

function evaluateCombatValue(key, stats, enemySelections) {
    let value = 0;
    value += (stats.dano || 0) * 50;
    value += (stats.ataque || 0) * 30;
    value += (stats.defensa || 0) * 10;
    value += (stats.vida || 0) * 20;
    value += (stats.rango || 0) * 7;
    value += (stats.movimiento || 0) * 10;
    value += (stats.agilidad || 0) * 0.25;

    if (hasPower(stats, 'Sigilo')) value += 20;
    if (hasPower(stats, 'Cuchillas/Garras/Colmillos')) value += 30;
    if (hasPower(stats, 'Dureza')) value += 20;
    if (hasPower(stats, 'Volar')) value += 30;
    if (hasPower(stats, 'Saltar/Trepar')) value += 10;
    if (hasPower(stats, 'Fase')) value += 20;
    if (hasPower(stats, 'Experto a/d')) value += 30;
    if (hasPower(stats, 'Defensa a/d')) value += 30;
    if (hasPower(stats, 'Regeneración')) value += 40;
    if (hasPower(stats, 'Superfuerza')) value += 50;
    if (hasPower(stats, 'Invulnerable')) value += 50;
    if (hasPower(stats, 'Astucia')) value += 30;
    if (hasPower(stats, 'Doble ataque c/c')) value += 10;
    if (hasPower(stats, 'Robo de vida')) value += 10;
    if (hasPower(stats, 'Curar')) value += 30;
    if (hasPower(stats, 'Incapacitar')) value += 30;
    if (hasPower(stats, 'Explosión')) value += 20;
    if (hasPower(stats, 'Telekinesis')) value += 40;
    if (hasPower(stats, 'Control Mental')) value += 40;
    if (hasPower(stats, 'Pulso')) value += 10;
    if (hasPower(stats, 'Barrera')) value += 10;
    if (hasPower(stats, 'Mejora de Ataque')) value += 50;
    if (hasPower(stats, 'Mejora de Agilidad')) value += 50;
    if (hasPower(stats, 'Mejora de Defensa')) value += 50;
    if (hasPower(stats, 'Mejora de Crítico')) value += 50;

    return value;
}

function performAIPick() {
    if (!draftActive) return;
    if (draftIsComplete() || draftIndex >= draftOrder.length) {
        finalizeDraft();
        return;
    }
    const options = availablePool();
    if (options.length === 0) { finalizeDraft(); return; }
    const playerSelections = selections.player1;

    const scoredCandidates = options.map(key => {
        const stats = pieceStats[key];
        const score = evaluateCombatValue(key, stats, playerSelections);
        return { key: key, score: score };
    });
    scoredCandidates.sort((a, b) => b.score - a.score);
    handleDraftPick(scoredCandidates[0].key);
}

/* ==========================================================================
   2. LÓGICA DE CEREBRO (4 ROLES: FRANCOTIRADOR, FAJADOR, SUPPORT, COMODÍN)
   ========================================================================== */

function getAIRole(stats) {

    const rango = stats.rango || 1; 
    const vida = stats.vida || 1; 
    const daño = stats.dano || 0; 

    const sniperPowers = ['Experto a/d', 'Pulso', 'Explosión'
    ];

    const hasSniper = sniperPowers.some(p => hasPower(stats, p));
    
    const supportPowers = ['Curar','Mejora de Ataque','Mejora de Defensa','Mejora de Crítico', 'Mejora de Agilidad',
                           'Control Mental','Telekinesis',
    ];
    
    const hasSupport = supportPowers.some(p => hasPower(stats, p));

    if (daño <= 1 && !hasSniper) return 'support';

    if (rango >=4 || hasSniper) {
          if (hasSupport) return 'comodin';
          return 'francotirador';
    }

    if (hasSupport) return 'comodin';

    return 'fajador';            
}

/* ==========================================================================
   3. LÓGICA DE TURNO (IA EN PARTIDA)
   ========================================================================== */

function findClosestEnemy(piece) {
    const origin = getPieceSquare(piece);
    if (!origin) return null;

    // Equipo del que busca (normalmente 'enemigo' para la IA)
    const seekerTeam = piece.dataset.team;

    const opponents = pieces
        .map((p) => p.element)
        .filter((p) => {
            // Filtros básicos: debe existir, ser del equipo contrario y estar vivo
            if (!p || p.dataset.team === seekerTeam || p.dataset.eliminated === 'true') return false;

            // --- PROTECCIÓN CONTRA FUEGO AMIGO (CONTROL MENTAL) ---
            const stats = pieceMap.get(p);
            // Si el objetivo está controlado mentalmente Y su equipo original era el mío...
            // ¡NO LE ATAQUES! (Es un compañero secuestrado)
            if (stats?.mindControlled && stats.originalTeam === seekerTeam) {
                return false;
            }
            // ------------------------------------------------------

            return true;
        });

    let best = null;
    let bestDistance = Infinity;
    opponents.forEach((candidate) => {
        const sq = getPieceSquare(candidate);
        if (!sq) return;
        const distance = attackDistance(origin, sq);
        if (distance < bestDistance) {
            bestDistance = distance;
            best = candidate;
        }
    });
    return best;
}

function chooseEnemyMoveSquare(piece, targetSquare) {
    computeReachableSquares(piece);
    const origin = getPieceSquare(piece);
    const maxRange = rangeForPiece(piece);
    if (origin && targetSquare && isWithinAttackRange(origin, targetSquare, maxRange)) {
        return null;
    }
    let bestSquare = null;
    let bestDistance = Infinity;
    movementDistances.forEach((_, square) => {
        const distance = attackDistance(square, targetSquare);
        if (distance < bestDistance) {
            bestDistance = distance;
            bestSquare = square;
        }
    });
    return bestSquare;
}

function shouldUseIncapacitar(attackerStats, targetStats) {
    if (!attackerStats || !targetStats) return false;
    const targetResilience = targetStats.resistencia ?? 0; // Esto leerá 0 o lo calculado si se pasara, pero para IA simple vale
    const targetThreat = targetStats.ataque ?? 0;
    const targetVida = targetStats.currentVida ?? targetStats.vida ?? 0;

    // CAMBIO V2: Simplificar lectura de daño potencial
    const potentialDamage = attackerStats.dano ?? 0;

    const canLikelyFinish = targetVida <= potentialDamage + 4;
    const tanky = targetResilience > 0 && targetVida > potentialDamage + 6;
    const veryDangerous = targetThreat >= 11;
    return (tanky || veryDangerous) && !canLikelyFinish;
}

function selectBestEnemyAction(piece, targetPiece) {
    const stats = pieceMap.get(piece);
    const abilities = (stats?.poderes?.activos || []).map((entry) => normalizePowerKey(entry?.nombre ?? entry));
    const targetStats = pieceMap.get(targetPiece);
    const targetSquare = getPieceSquare(targetPiece);
    const origin = getPieceSquare(piece);

    // Comprobamos rango visual
    const inRange = origin && targetSquare && isWithinAttackRange(origin, targetSquare, rangeForPiece(piece));

    if (!inRange) return 'move';

    if (abilities.includes('explosion')) {
        const deltas = [-1, 0, 1];
        let enemyNeighbors = 0;
        deltas.forEach((dr) => {
            deltas.forEach((dc) => {
                const sq = getSquareAt(Number(targetSquare.dataset.row) + dr, Number(targetSquare.dataset.col) + dc);
                const occupant = sq?.querySelector('.piece');
                if (occupant && occupant !== piece && occupant.dataset.team !== piece.dataset.team) {
                    enemyNeighbors += 1;
                }
            });
        });
        if (enemyNeighbors >= 2) {
            return 'explosion';
        }
    }

    if (
        abilities.includes('incapacitar') &&
        targetStats?.incapacitatedTurns === 0 &&
        shouldUseIncapacitar(stats, targetStats)
    ) {
        return 'incapacitar';
    }

    return 'attack';
}

async function performEnemyTurn(piece) {
    const target = findClosestEnemy(piece);

    // Si no hay enemigos (muy raro), pasa turno con sonido
    if (!target) {
        playEffectSound(passTurnSound);
        finishTurn(piece);
        return;
    }

    const targetSquare = getPieceSquare(target);
    const chosenAction = selectBestEnemyAction(piece, target);

    if (chosenAction === 'move') {
        const moveSquare = chooseEnemyMoveSquare(piece, targetSquare);
        if (moveSquare) {
            const distance = movementDistances.get(moveSquare) ?? 0;
            clearHighlights();
            highlightMovement(piece);
            moveSquare.classList.add('square--target');
            await sleep(ENEMY_ACTION_DELAY_MS);
            await animatePieceToSquare(piece, moveSquare);
            spendMovement(piece, distance);
            clearHighlights();
            highlightMovement(piece);
            highlightRange(piece);
            updateStatusBar(piece);
        }
    }

    await sleep(ENEMY_ACTION_DELAY_MS);
    const refreshedTarget = findClosestEnemy(piece) || target;
    const action = selectBestEnemyAction(piece, refreshedTarget);

    // Si decide moverse otra vez o no atacar, pasa turno con sonido
    if (action === 'move') {
        playEffectSound(passTurnSound); // <--- AÑADIDO SONIDO AQUÍ
        finishTurn(piece);
        return;
    }

    selectedTarget = refreshedTarget;
    handleActionClick(action);
}
