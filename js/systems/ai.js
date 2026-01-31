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
   2. LÓGICA DE TURNO (IA EN PARTIDA)
   ========================================================================== */

async function performEnemyTurn(piece) {
    if (!piece) return;
    const origin = getPieceSquare(piece);
    if (!origin) {
        playEffectSound(passTurnSound);
        finishTurn(piece);
        return;
    }

    const enemies = pieces
        .map((p) => p.element)
        .filter((element) => element && element.dataset.team !== piece.dataset.team && element.dataset.eliminated !== 'true');
    if (enemies.length === 0) {
        playEffectSound(passTurnSound);
        finishTurn(piece);
        return;
    }

    const attackRange = rangeForPiece(piece);
    const enemiesInRange = enemies.filter((enemy) => {
        const targetSquare = getPieceSquare(enemy);
        return targetSquare && isWithinAttackRange(origin, targetSquare, attackRange);
    });

    computeReachableSquares(piece);
    const reachableSquares = Array.from(movementDistances.keys());
    reachableSquares.push(origin);

    const moveToSquare = async (square) => {
        if (!square || square === origin) return;
        const distance = movementDistances.get(square);
        if (distance === undefined) return;
        await animatePieceToSquare(piece, square);
        spendMovement(piece, distance);
    };

    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    const flashAITarget = async (target) => {
        if (!target) return;
        const attackerTeam = piece.dataset.team;
        const className = target.dataset.team === attackerTeam
            ? 'piece--ai-target-ally'
            : 'piece--ai-target-enemy';
        target.classList.add(className);
        await sleep(500);
        target.classList.remove(className);
    };

    if (enemiesInRange.length > 0) {
        let best = null;
        enemiesInRange.forEach((enemy) => {
            const enemySquare = getPieceSquare(enemy);
            if (!enemySquare) return;
            reachableSquares.forEach((square) => {
                if (!isWithinAttackRange(square, enemySquare, attackRange)) return;
                const distance = attackDistance(square, enemySquare);
                const moveCost = square === origin ? 0 : (movementDistances.get(square) ?? Infinity);
                if (!best || distance > best.distance || (distance === best.distance && moveCost < best.moveCost)) {
                    best = { enemy, square, distance, moveCost };
                }
            });
        });

        if (best) {
            await moveToSquare(best.square);
            await flashAITarget(best.enemy);
            await resolveAttack(piece, best.enemy, 'attack');
            return;
        }
    }

    let gapCloser = null;
    enemies.forEach((enemy) => {
        const enemySquare = getPieceSquare(enemy);
        if (!enemySquare) return;
        const enemyDistFromOrigin = attackDistance(origin, enemySquare);
        reachableSquares.forEach((square) => {
            if (!isWithinAttackRange(square, enemySquare, attackRange)) return;
            const moveCost = square === origin ? 0 : (movementDistances.get(square) ?? Infinity);
            if (!gapCloser || moveCost < gapCloser.moveCost ||
                (moveCost === gapCloser.moveCost && enemyDistFromOrigin < gapCloser.enemyDistFromOrigin)) {
                gapCloser = { enemy, square, moveCost, enemyDistFromOrigin };
            }
        });
    });

    if (gapCloser) {
        await moveToSquare(gapCloser.square);
        await flashAITarget(gapCloser.enemy);
        await resolveAttack(piece, gapCloser.enemy, 'attack');
        return;
    }

    clearHighlights();
    playEffectSound(passTurnSound);
    finishTurn(piece);
}
