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
    playEffectSound(passTurnSound);
    finishTurn(piece);
}

async function performSniperFlow(piece, stats) {
    if (shouldTriggerSniperPulse(piece, stats)) {
        handleActionClick('pulso', { bypassVisuals: true });
        return;
    }

    const initialTarget = chooseSniperTarget(piece, stats);
    if (initialTarget && canShootTarget(piece, initialTarget)) {
        const action = chooseSniperAction(piece, stats, initialTarget);
        selectedTarget = initialTarget;
        handleActionClick(action, { bypassVisuals: true });
        return;
    }

    const moveToShoot = findSniperMoveSquare(piece, stats);
    if (moveToShoot) {
        const { square } = moveToShoot;
        const distance = movementDistances.get(square) ?? 0;
        clearHighlights();
        highlightMovement(piece);
        square.classList.add('square--target');
        await sleep(ENEMY_ACTION_DELAY_MS);
        await animatePieceToSquare(piece, square);
        spendMovement(piece, distance);
        clearHighlights();
        highlightMovement(piece);
        highlightRange(piece);
        updateStatusBar(piece);

        await sleep(ENEMY_ACTION_DELAY_MS);
        const refreshedTarget = chooseSniperTarget(piece, stats);
        if (refreshedTarget && canShootTarget(piece, refreshedTarget)) {
            const action = chooseSniperAction(piece, stats, refreshedTarget);
            selectedTarget = refreshedTarget;
            handleActionClick(action, { bypassVisuals: true });
            return;
        }
    }

    const chaseSquare = chooseSniperChaseSquare(piece, stats);
    if (chaseSquare) {
        const distance = movementDistances.get(chaseSquare) ?? 0;
        clearHighlights();
        highlightMovement(piece);
        chaseSquare.classList.add('square--target');
        await sleep(ENEMY_ACTION_DELAY_MS);
        await animatePieceToSquare(piece, chaseSquare);
        spendMovement(piece, distance);
        clearHighlights();
        highlightMovement(piece);
        highlightRange(piece);
        updateStatusBar(piece);
    }

    playEffectSound(passTurnSound);
    finishTurn(piece);
}
async function performWildcardTurn(piece, stats) {
    if (hasPower(stats, 'Pulso') && countAdjacentEnemies(piece) > 2) {
        handleActionClick('pulso', { bypassVisuals: true });
        return;
    }

    if (hasPower(stats, 'Curar')) {
        const criticalAlly = findCriticalAlly(piece);
        if (criticalAlly && canUseSupportAction(piece, criticalAlly, 'curar', 'ally')) {
            await performSupportActionFlow(piece, {
                actionKey: 'curar',
                target: criticalAlly,
                targetType: 'ally',
            });
            return;
        }
    }

    const hasEnemyInRange = Boolean(findEnemyInRange(piece));
    const damage = stats.dano || 0;

    if (damage >= 3 && hasAttackOpportunity(piece, stats)) {
        await performSniperFlow(piece, stats);
        return;
    }

    if (damage <= 2 && hasEnemyInRange) {
        const controlOrBuff = chooseSupportControlOrBuff(piece, stats, { allowBuffs: true });
        if (controlOrBuff) {
            await performSupportActionFlow(piece, controlOrBuff);
            return;
        }
    }

    if (!hasEnemyInRange) {
        const buffDecision = chooseSupportBuffTarget(stats, getAllies(piece));
        if (buffDecision) {
            await performSupportActionFlow(piece, buffDecision);
            return;
        }
    }

    await performSniperFlow(piece, stats);
}

async function performSupportTurn(piece, stats) {
    const decision = chooseSupportAction(piece, stats);
    if (!decision) {
        playEffectSound(passTurnSound);
        finishTurn(piece);
        return;
    }

    await performSupportActionFlow(piece, decision);
}

async function performSupportActionFlow(piece, decision) {
    const { actionKey, target, targetType } = decision;
    const targetSquare = getPieceSquare(target);
    if (!targetSquare) {
        playEffectSound(passTurnSound);
        finishTurn(piece);
        return;
    }

    if (canUseSupportAction(piece, target, actionKey, targetType)) {
        await executeSupportAction(piece, target, actionKey);
        return;
    }

    const moveSquare = findSupportMoveSquare(piece, target, actionKey, targetType);
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

        await sleep(ENEMY_ACTION_DELAY_MS);
        if (canUseSupportAction(piece, target, actionKey, targetType)) {
            await executeSupportAction(piece, target, actionKey);
            return;
        }
    }

    const chaseSquare = chooseSupportChaseSquare(piece, target, targetType);
    if (chaseSquare) {
        const distance = movementDistances.get(chaseSquare) ?? 0;
        clearHighlights();
        highlightMovement(piece);
        chaseSquare.classList.add('square--target');
        await sleep(ENEMY_ACTION_DELAY_MS);
        await animatePieceToSquare(piece, chaseSquare);
        spendMovement(piece, distance);
        clearHighlights();
        highlightMovement(piece);
        highlightRange(piece);
        updateStatusBar(piece);
    }

    playEffectSound(passTurnSound);
    finishTurn(piece);
}

function chooseSupportAction(piece, stats) {
    const team = piece.dataset.team;
    const allies = pieces
        .map((p) => p.element)
        .filter((candidate) => candidate && candidate.dataset.team === team && candidate.dataset.eliminated !== 'true');

    if (hasPower(stats, 'Curar')) {
        const damagedAllies = allies.filter((ally) => {
            const allyStats = pieceMap.get(ally);
            return allyStats && allyStats.currentVida < allyStats.maxVida;
        });
        if (damagedAllies.length > 0) {
            damagedAllies.sort((a, b) => {
                const aVida = pieceMap.get(a)?.currentVida ?? 0;
                const bVida = pieceMap.get(b)?.currentVida ?? 0;
                return aVida - bVida;
            });
            return { actionKey: 'curar', target: damagedAllies[0], targetType: 'ally' };
        }
    }

    const buffDecision = chooseSupportBuffTarget(stats, allies);
    if (buffDecision) {
        return buffDecision;
    }

    const enemies = getVisibleEnemies(piece, { requireVisibility: false });
    if (enemies.length === 0) return null;

    enemies.sort((a, b) => {
        const scoreA = enemyDangerScore(pieceMap.get(a));
        const scoreB = enemyDangerScore(pieceMap.get(b));
        return scoreB - scoreA;
    });

    const target = enemies[0];
    if (hasPower(stats, 'Incapacitar')) {
        const targetStats = pieceMap.get(target);
        if (targetStats?.incapacitatedTurns === 0) {
            return { actionKey: 'incapacitar', target, targetType: 'enemy' };
        }
    }
    if (hasPower(stats, 'Control Mental')) {
        const targetStats = pieceMap.get(target);
        if (!targetStats?.mindControlled) {
            return { actionKey: 'control mental', target, targetType: 'enemy' };
        }
    }

    return { actionKey: 'attack', target, targetType: 'enemy' };
}

function chooseSupportControlOrBuff(piece, stats, { allowBuffs = true } = {}) {
    const allies = getAllies(piece);

    const enemies = getVisibleEnemies(piece, { requireVisibility: false });
    if (enemies.length > 0) {
        enemies.sort((a, b) => {
            const scoreA = enemyDangerScore(pieceMap.get(a));
            const scoreB = enemyDangerScore(pieceMap.get(b));
            return scoreB - scoreA;
        });

        const target = enemies[0];
        if (hasPower(stats, 'Incapacitar')) {
            const targetStats = pieceMap.get(target);
            if (targetStats?.incapacitatedTurns === 0) {
                return { actionKey: 'incapacitar', target, targetType: 'enemy' };
            }
        }
        if (hasPower(stats, 'Control Mental')) {
            const targetStats = pieceMap.get(target);
            if (!targetStats?.mindControlled) {
                return { actionKey: 'control mental', target, targetType: 'enemy' };
            }
        }
    }

    if (!allowBuffs) {
        return null;
    }

    const buffDecision = chooseSupportBuffTarget(stats, allies);
    if (buffDecision) {
        return buffDecision;
    }

    return null;
}

function hasAttackOpportunity(piece, stats) {
    const target = chooseSniperTarget(piece, stats);
    if (target && canShootTarget(piece, target)) return true;
    return Boolean(findSniperMoveSquare(piece, stats));
}

function chooseSupportBuffTarget(stats, allies) {
    const buffs = [
        { key: 'mejora de ataque', stat: 'ataque' },
        { key: 'mejora de defensa', stat: 'defensa' },
        { key: 'mejora de agilidad', stat: 'agilidad' },
        { key: 'mejora de critico', stat: 'critico' },
    ];

    let best = null;
    buffs.forEach(({ key, stat }) => {
        if (!hasPower(stats, key)) return;
        allies.forEach((ally) => {
            const allyStats = pieceMap.get(ally);
            if (!allyStats) return;
            const alreadyBuffed = stat === 'critico'
                ? Boolean(allyStats.critBuff)
                : Boolean(allyStats.statBuffs?.[stat]);
            if (alreadyBuffed) return;
            const strength = allyStrengthScore(allyStats);
            if (!best || strength > best.strength) {
                best = { actionKey: key, target: ally, targetType: 'ally', strength };
            }
        });
    });

    if (!best) return null;
    return { actionKey: best.actionKey, target: best.target, targetType: best.targetType };
}

function getAllies(piece) {
    const team = piece.dataset.team;
    return pieces
        .map((p) => p.element)
        .filter((candidate) => candidate && candidate.dataset.team === team && candidate.dataset.eliminated !== 'true');
}

function findEnemyInRange(piece) {
    const enemies = getVisibleEnemies(piece, { requireVisibility: true });
    return enemies.find((enemy) => {
        const origin = getPieceSquare(piece);
        const targetSquare = getPieceSquare(enemy);
        if (!origin || !targetSquare) return false;
        return isWithinAttackRange(origin, targetSquare, rangeForPiece(piece));
    });
}

function findCriticalAlly(piece) {
    const team = piece.dataset.team;
    const allies = pieces
        .map((p) => p.element)
        .filter((candidate) => candidate && candidate.dataset.team === team && candidate.dataset.eliminated !== 'true');

    const criticalAllies = allies.filter((ally) => {
        const allyStats = pieceMap.get(ally);
        if (!allyStats) return false;
        return allyStats.currentVida / allyStats.maxVida < 0.5;
    });

    if (criticalAllies.length === 0) return null;
    criticalAllies.sort((a, b) => {
        const aVida = pieceMap.get(a)?.currentVida ?? 0;
        const bVida = pieceMap.get(b)?.currentVida ?? 0;
        return aVida - bVida;
    });
    return criticalAllies[0];
}

function countAdjacentEnemies(piece) {
    const origin = getPieceSquare(piece);
    if (!origin) return 0;
    const deltas = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    let count = 0;
    deltas.forEach(([dr, dc]) => {
        const square = getSquareAt(
            Number(origin.dataset.row) + dr,
            Number(origin.dataset.col) + dc
        );
        const occupant = square?.querySelector?.('.piece');
        if (!occupant) return;
        if (occupant.dataset.team === piece.dataset.team) return;
        const occStats = pieceMap.get(occupant);
        if (occStats?.mindControlled && occStats.originalTeam === piece.dataset.team) return;
        count += 1;
    });
    return count;
}

function allyStrengthScore(stats) {
    if (!stats) return 0;
    return (stats.dano || 0) * 4 + (stats.ataque || 0) * 3 + (stats.vida || 0) * 2 + (stats.defensa || 0) * 2 + (stats.agilidad || 0);
}

function enemyDangerScore(stats) {
    if (!stats) return 0;
    return (stats.ataque || 0) * 2 + (stats.dano || 0) * 3 + (stats.vida || 0) + (stats.rango || 0);
}

function getVisibleEnemies(piece, { requireVisibility = true } = {}) {
    const seekerTeam = piece.dataset.team;
    return pieces
        .map((p) => p.element)
        .filter((candidate) => {
            if (!candidate || candidate.dataset.team === seekerTeam || candidate.dataset.eliminated === 'true') return false;
            const stats = pieceMap.get(candidate);
            if (stats?.mindControlled && stats.originalTeam === seekerTeam) return false;
            if (!requireVisibility) return true;
            return isVisibleTarget(piece, candidate);
        });
}

function canUseSupportAction(attacker, target, actionKey, targetType) {
    if (targetType === 'ally' && attacker === target) {
        return true;
    }
    if (targetType === 'ally') {
        return canUseSupportActionFromSquare(attacker, target, actionKey, getPieceSquare(attacker), false);
    }
    return canUseSupportActionFromSquare(attacker, target, actionKey, getPieceSquare(attacker), true);
}

function canUseSupportActionFromSquare(attacker, target, actionKey, originSquare, requireVisibility) {
    const targetSquare = getPieceSquare(target);
    if (!originSquare || !targetSquare) return false;
    const range = actionKey === 'attack' ? rangeForPiece(attacker) : rangeForAction(attacker, actionKey);
    const distance = attackDistance(originSquare, targetSquare);
    if (distance > range || distance === 0) return false;
    if (requireVisibility && !isVisibleTarget(attacker, target, originSquare)) return false;
    return true;
}

function findSupportMoveSquare(attacker, target, actionKey, targetType) {
    computeReachableSquares(attacker);
    if (movementDistances.size === 0) return null;
    const requireVisibility = targetType === 'enemy';
    let best = null;
    movementDistances.forEach((moveCost, square) => {
        if (!canUseSupportActionFromSquare(attacker, target, actionKey, square, requireVisibility)) return;
        if (!best || moveCost < best.moveCost) {
            best = { square, moveCost };
        }
    });
    return best?.square ?? null;
}

function chooseSupportChaseSquare(attacker, target, targetType) {
    const targetSquare = getPieceSquare(target);
    if (!targetSquare) return null;
    computeReachableSquares(attacker);
    if (movementDistances.size === 0) return null;

    const maxSteps = targetType === 'enemy'
        ? Math.min(4, remainingMovement(attacker))
        : remainingMovement(attacker);

    let best = null;
    movementDistances.forEach((moveCost, square) => {
        if (moveCost > maxSteps) return;
        const distance = attackDistance(square, targetSquare);
        if (!best || distance < best.distance || (distance === best.distance && moveCost > best.moveCost)) {
            best = { square, distance, moveCost };
        }
    });

    return best?.square ?? null;
}

async function executeSupportAction(attacker, target, actionKey) {
    const buffConfig = {
        'mejora de ataque': { stat: 'ataque', label: 'Mejora de Ataque' },
        'mejora de defensa': { stat: 'defensa', label: 'Mejora de Defensa' },
        'mejora de agilidad': { stat: 'agilidad', label: 'Mejora de Agilidad' },
        'mejora de critico': { stat: 'critico', label: 'Mejora de Crítico' },
    };

    if (actionKey === 'curar') {
        await resolveHeal(attacker, target);
        return;
    }

    if (buffConfig[actionKey]) {
        applyStatBuff(attacker, target, buffConfig[actionKey]);
        return;
    }

    if (actionKey === 'incapacitar' || actionKey === 'control mental') {
        await resolveAttack(attacker, target, actionKey, { allowCounter: false });
        return;
    }

    await resolveAttack(attacker, target, 'attack');
}

function shouldTriggerSniperPulse(piece, stats) {
    if (!hasPower(stats, 'Pulso')) return false;
    const origin = getPieceSquare(piece);
    if (!origin) return false;
    let adjacentEnemies = 0;
    const deltas = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    deltas.forEach(([dr, dc]) => {
        const square = getSquareAt(
            Number(origin.dataset.row) + dr,
            Number(origin.dataset.col) + dc
        );
        const occupant = square?.querySelector?.('.piece');
        if (!occupant) return;
        if (occupant.dataset.team === piece.dataset.team) return;
        const occStats = pieceMap.get(occupant);
        if (occStats?.mindControlled && occStats.originalTeam === piece.dataset.team) return;
        adjacentEnemies += 1;
    });
    return adjacentEnemies >= 2;
}

function isVisibleTarget(attacker, target, originSquare = null) {
    const attackerSquare = originSquare ?? getPieceSquare(attacker);
    const targetSquare = getPieceSquare(target);
    if (!attackerSquare || !targetSquare) return false;
    if (target.dataset.eliminated === 'true') return false;
    if (target.dataset.team === attacker.dataset.team) return false;
    const targetStats = pieceMap.get(target);
    if (targetStats?.mindControlled && targetStats.originalTeam === attacker.dataset.team) return false;
    const distance = attackDistance(attackerSquare, targetSquare);
    if (distance > 1 && !hasLineOfSight(attackerSquare, targetSquare)) return false;
    if (distance > 3 && hasPassive(targetStats, 'sigilo')) return false;
    return true;
}

function canShootTarget(attacker, target, originSquare = null) {
    const attackerSquare = originSquare ?? getPieceSquare(attacker);
    const targetSquare = getPieceSquare(target);
    if (!attackerSquare || !targetSquare) return false;
    if (!isVisibleTarget(attacker, target, attackerSquare)) return false;
    const distance = attackDistance(attackerSquare, targetSquare);
    return distance <= rangeForPiece(attacker);
}

function hasExplosionOpportunity(attacker, target) {
    const targetSquare = getPieceSquare(target);
    if (!targetSquare) return false;
    const deltas = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    return deltas.some(([dr, dc]) => {
        const square = getSquareAt(
            Number(targetSquare.dataset.row) + dr,
            Number(targetSquare.dataset.col) + dc
        );
        const occupant = square?.querySelector?.('.piece');
        if (!occupant) return false;
        if (occupant.dataset.team !== target.dataset.team) return false;
        if (occupant.dataset.eliminated === 'true') return false;
        return true;
    });
}

function chooseSniperAction(piece, stats, target) {
    if (hasPower(stats, 'Explosión') && hasExplosionOpportunity(piece, target)) {
        return 'explosion';
    }
    return 'attack';
}

function chooseSniperTarget(piece, stats, originSquare = null) {
    const attackerSquare = originSquare ?? getPieceSquare(piece);
    if (!attackerSquare) return null;

    const visibleEnemies = pieces
        .map((p) => p.element)
        .filter((candidate) => isVisibleTarget(piece, candidate, attackerSquare));

    if (visibleEnemies.length === 0) return null;

    const hasExplosion = hasPower(stats, 'Explosión');

    const sorted = visibleEnemies.slice().sort((a, b) => {
        const aExplosion = hasExplosion && hasExplosionOpportunity(piece, a);
        const bExplosion = hasExplosion && hasExplosionOpportunity(piece, b);
        if (aExplosion !== bExplosion) return aExplosion ? -1 : 1;

        const aVida = pieceMap.get(a)?.currentVida ?? 0;
        const bVida = pieceMap.get(b)?.currentVida ?? 0;
        if (aVida !== bVida) return aVida - bVida;

        const aDist = attackDistance(attackerSquare, getPieceSquare(a));
        const bDist = attackDistance(attackerSquare, getPieceSquare(b));
        return aDist - bDist;
    });

    return sorted[0];
}

function findSniperMoveSquare(piece, stats) {
    computeReachableSquares(piece);
    if (movementDistances.size === 0) return null;

    let best = null;
    movementDistances.forEach((moveCost, square) => {
        const target = chooseSniperTarget(piece, stats, square);
        if (!target) return;
        if (!canShootTarget(piece, target, square)) return;

        const candidate = {
            square,
            target,
            moveCost,
            explosion: hasPower(stats, 'Explosión') && hasExplosionOpportunity(piece, target),
            vida: pieceMap.get(target)?.currentVida ?? 0,
            distance: attackDistance(square, getPieceSquare(target)),
        };

        if (!best) {
            best = candidate;
            return;
        }

        if (candidate.moveCost !== best.moveCost) {
            if (candidate.moveCost < best.moveCost) best = candidate;
            return;
        }

        if (candidate.explosion !== best.explosion) {
            if (candidate.explosion) best = candidate;
            return;
        }

        if (candidate.vida !== best.vida) {
            if (candidate.vida < best.vida) best = candidate;
            return;
        }

        if (candidate.distance < best.distance) {
            best = candidate;
        }
    });

    if (!best) return null;
    return { square: best.square, target: best.target };
}

function chooseSniperChaseSquare(piece, stats) {
    const target = findClosestEnemy(piece);
    if (!target) return null;
    const targetSquare = getPieceSquare(target);
    if (!targetSquare) return null;

    computeReachableSquares(piece);
    if (movementDistances.size === 0) return null;

    const maxSteps = Math.min(4, remainingMovement(piece));
    let best = null;
    let bestObject = null;
    const hasSuperStrength = hasPower(stats, 'Superfuerza');

    movementDistances.forEach((moveCost, square) => {
        if (moveCost > maxSteps) return;
        const distance = attackDistance(square, targetSquare);
        const occupant = square.querySelector('.object-token');
        const candidate = { square, moveCost, distance };

        if (hasSuperStrength && occupant) {
            if (!bestObject) {
                bestObject = candidate;
                return;
            }
            if (candidate.distance !== bestObject.distance) {
                if (candidate.distance < bestObject.distance) bestObject = candidate;
                return;
            }
            if (candidate.moveCost < bestObject.moveCost) bestObject = candidate;
            return;
        }

        if (!best) {
            best = candidate;
            return;
        }

        if (candidate.distance !== best.distance) {
            if (candidate.distance < best.distance) best = candidate;
            return;
        }
        if (candidate.moveCost < best.moveCost) best = candidate;
    });

    return (bestObject || best)?.square ?? null;
}
