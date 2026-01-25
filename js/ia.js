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
    const stats = pieceMap.get(piece);
    if (!stats) {
        await sleep(ENEMY_ACTION_DELAY_MS);
        playEffectSound(passTurnSound);
        finishTurn(piece);
        return;
    }
    await waitForPopupsToClose();
    await sleep(ENEMY_ACTION_DELAY_MS);
    const highDamageProfile = isHighDamageProfile(stats);
    const mediumDamageProfile = isMediumDamageProfile(stats);
    const enemiesInRange = getEnemiesInRange(piece);
    const alliesInRange = getAlliesInRange(piece);
    const enemiesReachable = getEnemiesInMoveRange(piece);
    const allEnemies = getVisibleEnemies(piece, { requireVisibility: false });

    if (allEnemies.length === 0) {
        playEffectSound(passTurnSound);
        finishTurn(piece);
        return;
    }

    if (highDamageProfile) {
        await handleHighDamageFlow(piece, stats, { enemiesInRange, alliesInRange, enemiesReachable });
        return;
    }

    if (mediumDamageProfile) {
        await handleMediumDamageFlow(piece, stats, { enemiesInRange, alliesInRange, enemiesReachable });
        return;
    }

    await handleLowDamageFlow(piece, stats, { enemiesInRange, alliesInRange, enemiesReachable });
}

async function waitForPopupsToClose() {
    if (typeof turnPopup === 'undefined' || typeof deathPopup === 'undefined') return;
    while (!turnPopup.hidden || !deathPopup.hidden) {
        await sleep(100);
    }
}

function isHighDamageProfile(stats) {
    const damage = stats?.dano ?? 0;
    return (
        damage >= 3 ||
        hasPower(stats, 'Cuchillas/Garras/Colmillos') ||
        hasPower(stats, 'Experto a/d')
    );
}

function isMediumDamageProfile(stats) {
    const damage = stats?.dano ?? 0;
    return (
        damage === 2 &&
        !hasPower(stats, 'Cuchillas/Garras/Colmillos') &&
        !hasPower(stats, 'Experto a/d')
    );
}

function hasDureza(stats) {
    return hasPower(stats, 'Dureza');
}

function hasInvulnerable(stats) {
    return hasPower(stats, 'Invulnerable') || hasPower(stats, 'Invulnerabilidad');
}

function getEnemiesInRange(piece) {
    const origin = getPieceSquare(piece);
    if (!origin) return [];
    return getVisibleEnemies(piece, { requireVisibility: true }).filter((enemy) => {
        const targetSquare = getPieceSquare(enemy);
        if (!targetSquare) return false;
        return isWithinAttackRange(origin, targetSquare, rangeForPiece(piece));
    });
}

function getAlliesInRange(piece) {
    const origin = getPieceSquare(piece);
    if (!origin) return [];
    return getAllies(piece).filter((ally) => {
        if (ally === piece) return false;
        const targetSquare = getPieceSquare(ally);
        if (!targetSquare) return false;
        return isWithinAttackRange(origin, targetSquare, rangeForPiece(piece));
    });
}

function getEnemiesInMoveRange(piece) {
    const enemies = getVisibleEnemies(piece, { requireVisibility: false });
    return enemies.filter((enemy) => canReachTargetWithAction(piece, enemy, 'attack'));
}

function canReachTargetWithAction(piece, target, actionKey) {
    if (canUseSupportAction(piece, target, actionKey, 'enemy')) return true;
    return Boolean(findSupportMoveSquare(piece, target, actionKey, 'enemy'));
}

function passAITurn(piece) {
    playEffectSound(passTurnSound);
    finishTurn(piece);
}

async function performSupportActionIfInRange(attacker, target, actionKey, targetType = 'ally') {
    if (!canUseSupportAction(attacker, target, actionKey, targetType)) return false;
    await waitForPopupsToClose();
    await sleep(ENEMY_ACTION_DELAY_MS);
    await executeSupportAction(attacker, target, actionKey);
    return true;
}

async function tryHealSelfInRange(piece, stats) {
    if (!hasPower(stats, 'Curar')) return false;
    const selfStats = pieceMap.get(piece);
    if (!selfStats || selfStats.currentVida >= selfStats.maxVida) return false;
    return performSupportActionIfInRange(piece, piece, 'curar', 'ally');
}

async function tryHealAllyInRange(piece, stats) {
    if (!hasPower(stats, 'Curar')) return false;
    const ally = findDamagedAlly(piece);
    if (!ally) return false;
    return performSupportActionIfInRange(piece, ally, 'curar', 'ally');
}

async function tryBuffAllyInRange(piece, stats) {
    const allies = getAllies(piece).filter((ally) => ally !== piece);
    const decision = chooseSupportBuffTarget(piece, stats, allies);
    if (!decision) return false;
    return performSupportActionIfInRange(piece, decision.target, decision.actionKey, 'ally');
}

async function tryBuffSelfInRange(piece, stats) {
    const selfBuffAction = chooseSelfBuffAction(piece, stats);
    if (!selfBuffAction) return false;
    return performSupportActionIfInRange(piece, piece, selfBuffAction, 'ally');
}

async function trySupportSequenceInRange(piece, stats, sequence) {
    for (const step of sequence) {
        if (step === 'heal-self' && await tryHealSelfInRange(piece, stats)) return true;
        if (step === 'heal-ally' && await tryHealAllyInRange(piece, stats)) return true;
        if (step === 'buff-ally' && await tryBuffAllyInRange(piece, stats)) return true;
        if (step === 'buff-self' && await tryBuffSelfInRange(piece, stats)) return true;
    }
    return false;
}

async function executeAttackPriority(piece, stats, enemies, steps) {
    for (const step of steps) {
        if (step === 'attack-none') {
            const target = chooseTargetByDurability(enemies, ['none']);
            if (target && await performTargetedAction(piece, target, 'attack')) return true;
        }
        if (step === 'control mental' && hasPower(stats, 'Control Mental')) {
            const target = chooseDangerousEnemy(enemies);
            if (await performTargetedAction(piece, target, 'control mental')) return true;
        }
        if (step === 'incapacitar' && hasPower(stats, 'Incapacitar')) {
            const target = chooseDangerousEnemy(enemies);
            if (await performTargetedAction(piece, target, 'incapacitar')) return true;
        }
        if (step === 'attack-dureza') {
            const target = chooseTargetByDurability(enemies, ['dureza']);
            if (target && await performTargetedAction(piece, target, 'attack')) return true;
        }
        if (step === 'attack-invulnerable') {
            const target = chooseTargetByDurability(enemies, ['invulnerable']);
            if (target && await performTargetedAction(piece, target, 'attack')) return true;
        }
    }
    return false;
}

async function handleHighDamageFlow(piece, stats, { enemiesInRange, alliesInRange, enemiesReachable }) {
    if (enemiesInRange.length === 0 && alliesInRange.length === 0 && enemiesReachable.length === 0) {
        await moveTowardEnemy(piece);
        const updatedEnemies = getEnemiesInRange(piece);
        const updatedAllies = getAlliesInRange(piece);
        if (updatedEnemies.length > 0) {
            if (hasPower(stats, 'Pulso') && countAdjacentEnemies(piece) >= 3) {
                handleActionClick('pulso', { bypassVisuals: true });
                return;
            }
            const explosionTarget = findExplosionTarget(piece, updatedEnemies);
            if (explosionTarget) {
                await performTargetedAction(piece, explosionTarget, 'explosion');
                return;
            }
            if (await executeAttackPriority(piece, stats, updatedEnemies, [
                'attack-none',
                'control mental',
                'attack-dureza',
                'attack-invulnerable',
            ])) return;
        }
        if (updatedAllies.length > 0) {
            if (await trySupportSequenceInRange(piece, stats, [
                'heal-self',
                'heal-ally',
                'buff-ally',
                'buff-self',
            ])) return;
        } else {
            if (await trySupportSequenceInRange(piece, stats, ['heal-self', 'buff-self'])) return;
        }
        passAITurn(piece);
        return;
    }

    if (enemiesInRange.length === 0 && alliesInRange.length > 0) {
        await moveTowardEnemy(piece);
        const updatedEnemies = getEnemiesInRange(piece);
        const updatedAllies = getAlliesInRange(piece);
        if (updatedEnemies.length > 0) {
            if (hasPower(stats, 'Pulso') && countAdjacentEnemies(piece) >= 3) {
                handleActionClick('pulso', { bypassVisuals: true });
                return;
            }
            const explosionTarget = findExplosionTarget(piece, updatedEnemies);
            if (explosionTarget) {
                await performTargetedAction(piece, explosionTarget, 'explosion');
                return;
            }
            if (await executeAttackPriority(piece, stats, updatedEnemies, [
                'attack-none',
                'control mental',
                'attack-dureza',
                'attack-invulnerable',
            ])) return;
        }
        if (updatedAllies.length > 0) {
            if (await trySupportSequenceInRange(piece, stats, [
                'heal-self',
                'heal-ally',
                'buff-ally',
                'buff-self',
            ])) return;
        } else {
            if (await trySupportSequenceInRange(piece, stats, ['heal-self', 'buff-self'])) return;
        }
        passAITurn(piece);
        return;
    }

    if (enemiesInRange.length > 0 && alliesInRange.length > 0) {
        if (hasPower(stats, 'Pulso') && countAdjacentEnemies(piece) >= 3) {
            handleActionClick('pulso', { bypassVisuals: true });
            return;
        }
        const explosionTarget = findExplosionTarget(piece, enemiesInRange);
        if (explosionTarget) {
            await performTargetedAction(piece, explosionTarget, 'explosion');
            return;
        }
        if (enemiesInRange.length === 1) {
            if (await executeAttackPriority(piece, stats, enemiesInRange, [
                'attack-none',
                'control mental',
                'attack-dureza',
                'attack-invulnerable',
            ])) return;
        }
    }

    if (enemiesReachable.length > 0) {
        const explosionTarget = findExplosionTarget(piece, enemiesReachable);
        if (explosionTarget) {
            if (await performTargetedAction(piece, explosionTarget, 'explosion')) return;
        }
        if (enemiesReachable.length === 1) {
            if (await executeAttackPriority(piece, stats, enemiesReachable, [
                'attack-none',
                'control mental',
                'attack-dureza',
                'attack-invulnerable',
            ])) return;
        }
    }

    if (enemiesInRange.length > 0) {
        if (await executeAttackPriority(piece, stats, enemiesInRange, [
            'attack-none',
            'control mental',
            'attack-dureza',
            'attack-invulnerable',
        ])) return;
    }

    passAITurn(piece);
}

async function handleMediumDamageFlow(piece, stats, { enemiesInRange, alliesInRange, enemiesReachable }) {
    if (enemiesInRange.length === 0 && alliesInRange.length === 0 && enemiesReachable.length === 0) {
        await moveTowardEnemy(piece);
        const updatedEnemies = getEnemiesInRange(piece);
        const updatedAllies = getAlliesInRange(piece);
        if (updatedEnemies.length > 0) {
            const explosionTarget = findExplosionTarget(piece, updatedEnemies);
            if (explosionTarget) {
                await performTargetedAction(piece, explosionTarget, 'explosion');
                return;
            }
            if (await executeAttackPriority(piece, stats, updatedEnemies, [
                'attack-none',
                'control mental',
                'attack-dureza',
                'incapacitar',
                'attack-invulnerable',
            ])) return;
        }
        if (updatedAllies.length > 0) {
            if (await trySupportSequenceInRange(piece, stats, [
                'heal-self',
                'heal-ally',
                'buff-ally',
                'buff-self',
            ])) return;
        } else {
            if (await trySupportSequenceInRange(piece, stats, ['heal-self', 'buff-self'])) return;
        }
        passAITurn(piece);
        return;
    }

    if (enemiesInRange.length === 0 && alliesInRange.length > 0) {
        await moveTowardEnemy(piece);
        const updatedEnemies = getEnemiesInRange(piece);
        const updatedAllies = getAlliesInRange(piece);
        if (updatedEnemies.length > 0) {
            const explosionTarget = findExplosionTarget(piece, updatedEnemies);
            if (explosionTarget) {
                await performTargetedAction(piece, explosionTarget, 'explosion');
                return;
            }
            if (await executeAttackPriority(piece, stats, updatedEnemies, [
                'attack-none',
                'control mental',
                'attack-dureza',
                'incapacitar',
                'attack-invulnerable',
            ])) return;
        }
        if (updatedAllies.length > 0) {
            if (await trySupportSequenceInRange(piece, stats, [
                'heal-self',
                'heal-ally',
                'buff-ally',
                'buff-self',
            ])) return;
        } else {
            if (await trySupportSequenceInRange(piece, stats, ['heal-self', 'buff-self'])) return;
        }
        passAITurn(piece);
        return;
    }

    if (enemiesInRange.length > 0 && alliesInRange.length > 0) {
        if (hasPower(stats, 'Pulso') && countAdjacentEnemies(piece) >= 3) {
            handleActionClick('pulso', { bypassVisuals: true });
            return;
        }
        const explosionTarget = findExplosionTarget(piece, enemiesInRange);
        if (explosionTarget) {
            await performTargetedAction(piece, explosionTarget, 'explosion');
            return;
        }
        if (enemiesInRange.length === 1) {
            if (await executeAttackPriority(piece, stats, enemiesInRange, [
                'attack-none',
                'control mental',
                'attack-dureza',
                'incapacitar',
            ])) return;
            if (await trySupportSequenceInRange(piece, stats, [
                'heal-self',
                'heal-ally',
                'buff-ally',
                'buff-self',
            ])) return;
            if (await executeAttackPriority(piece, stats, enemiesInRange, ['attack-invulnerable'])) return;
        }
    }

    if (enemiesReachable.length > 0) {
        const explosionTarget = findExplosionTarget(piece, enemiesReachable);
        if (explosionTarget) {
            if (await performTargetedAction(piece, explosionTarget, 'explosion')) return;
        }
        if (enemiesReachable.length === 1) {
            if (await executeAttackPriority(piece, stats, enemiesReachable, [
                'attack-none',
                'control mental',
                'attack-dureza',
                'incapacitar',
                'attack-invulnerable',
            ])) return;
        }
    }

    if (enemiesInRange.length > 0) {
        if (await executeAttackPriority(piece, stats, enemiesInRange, [
            'attack-none',
            'control mental',
            'attack-dureza',
            'incapacitar',
            'attack-invulnerable',
        ])) return;
    }

    passAITurn(piece);
}

async function handleLowDamageFlow(piece, stats, { enemiesInRange, alliesInRange, enemiesReachable }) {
    if (enemiesInRange.length === 0 && alliesInRange.length === 0 && enemiesReachable.length === 0) {
        await moveTowardEnemy(piece);
        const updatedEnemies = getEnemiesInRange(piece);
        const updatedAllies = getAlliesInRange(piece);
        if (updatedEnemies.length > 0) {
            const explosionTarget = findExplosionTarget(piece, updatedEnemies);
            if (explosionTarget) {
                await performTargetedAction(piece, explosionTarget, 'explosion');
                return;
            }
            if (await executeAttackPriority(piece, stats, updatedEnemies, [
                'control mental',
                'incapacitar',
                'attack-none',
                'attack-dureza',
                'attack-invulnerable',
            ])) return;
        }
        if (updatedAllies.length > 0) {
            if (await trySupportSequenceInRange(piece, stats, [
                'heal-ally',
                'buff-ally',
                'heal-self',
                'buff-self',
            ])) return;
        } else {
            if (await trySupportSequenceInRange(piece, stats, ['heal-self', 'buff-self'])) return;
        }
        passAITurn(piece);
        return;
    }

    if (enemiesInRange.length === 0 && alliesInRange.length > 0) {
        await moveTowardEnemy(piece);
        const updatedEnemies = getEnemiesInRange(piece);
        const updatedAllies = getAlliesInRange(piece);
        if (updatedEnemies.length > 0) {
            const explosionTarget = findExplosionTarget(piece, updatedEnemies);
            if (explosionTarget) {
                await performTargetedAction(piece, explosionTarget, 'explosion');
                return;
            }
            if (await executeAttackPriority(piece, stats, updatedEnemies, [
                'control mental',
                'incapacitar',
                'attack-none',
                'attack-dureza',
                'attack-invulnerable',
            ])) return;
        }
        if (updatedAllies.length > 0) {
            if (await trySupportSequenceInRange(piece, stats, [
                'heal-ally',
                'buff-ally',
                'heal-self',
                'buff-self',
            ])) return;
        } else {
            if (await trySupportSequenceInRange(piece, stats, ['heal-self', 'buff-self'])) return;
        }
        passAITurn(piece);
        return;
    }

    if (enemiesInRange.length > 0 && alliesInRange.length > 0) {
        if (hasPower(stats, 'Pulso') && countAdjacentEnemies(piece) >= 3) {
            handleActionClick('pulso', { bypassVisuals: true });
            return;
        }
        const explosionTarget = findExplosionTarget(piece, enemiesInRange);
        if (explosionTarget) {
            await performTargetedAction(piece, explosionTarget, 'explosion');
            return;
        }
        if (enemiesInRange.length === 1) {
            if (await executeAttackPriority(piece, stats, enemiesInRange, [
                'control mental',
                'incapacitar',
            ])) return;
            if (await trySupportSequenceInRange(piece, stats, [
                'heal-ally',
                'buff-ally',
                'buff-self',
                'heal-self',
            ])) return;
            if (await executeAttackPriority(piece, stats, enemiesInRange, [
                'attack-none',
                'attack-dureza',
                'attack-invulnerable',
            ])) return;
        }
    }

    if (enemiesReachable.length > 0) {
        const explosionTarget = findExplosionTarget(piece, enemiesReachable);
        if (explosionTarget) {
            if (await performTargetedAction(piece, explosionTarget, 'explosion')) return;
        }
        if (enemiesReachable.length === 1) {
            if (await executeAttackPriority(piece, stats, enemiesReachable, [
                'control mental',
                'incapacitar',
                'attack-none',
                'attack-dureza',
                'attack-invulnerable',
            ])) return;
        }
    }

    if (enemiesInRange.length > 0) {
        if (await executeAttackPriority(piece, stats, enemiesInRange, [
            'control mental',
            'incapacitar',
            'attack-none',
            'attack-dureza',
            'attack-invulnerable',
        ])) return;
    }

    passAITurn(piece);
}

function findExplosionTarget(piece, enemies) {
    if (!hasPower(pieceMap.get(piece), 'Explosión')) return null;
    return enemies.find((enemy) => hasExplosionOpportunity(piece, enemy));
}

function chooseTargetByDurability(enemies, priorities) {
    for (const priority of priorities) {
        const candidate = enemies.find((enemy) => {
            const targetStats = pieceMap.get(enemy);
            if (!targetStats) return false;
            if (priority === 'none') return !hasDureza(targetStats) && !hasInvulnerable(targetStats);
            if (priority === 'dureza') return hasDureza(targetStats) && !hasInvulnerable(targetStats);
            if (priority === 'invulnerable') return hasInvulnerable(targetStats);
            return false;
        });
        if (candidate) return candidate;
    }
    return enemies[0] ?? null;
}

function chooseDangerousEnemy(enemies) {
    if (enemies.length === 0) return null;
    return enemies.slice().sort((a, b) => enemyDangerScore(pieceMap.get(b)) - enemyDangerScore(pieceMap.get(a)))[0];
}

async function performTargetedAction(piece, target, actionKey) {
    if (!target) return false;
    await waitForPopupsToClose();
    if (canUseSupportAction(piece, target, actionKey, 'enemy')) {
        await flashAITarget(piece, target);
        selectedTarget = target;
        await sleep(ENEMY_ACTION_DELAY_MS);
        handleActionClick(actionKey, { bypassVisuals: true });
        return true;
    }

    const moveSquare = findSupportMoveSquare(piece, target, actionKey, 'enemy');
    if (!moveSquare) return false;

    await movePieceToSquare(piece, moveSquare);
    if (canUseSupportAction(piece, target, actionKey, 'enemy')) {
        await flashAITarget(piece, target);
        selectedTarget = target;
        await sleep(ENEMY_ACTION_DELAY_MS);
        handleActionClick(actionKey, { bypassVisuals: true });
        return true;
    }

    return false;
}

async function executeSingleTargetSequence(piece, stats, enemies, steps) {
    for (const step of steps) {
        if (step === 'attack-weak') {
            const target = chooseTargetByDurability(enemies, ['none']);
            if (target) {
                if (await performTargetedAction(piece, target, 'attack')) return true;
            }
        }

        if (step === 'control mental' && hasPower(stats, 'Control Mental')) {
            const target = chooseDangerousEnemy(enemies);
            if (await performTargetedAction(piece, target, 'control mental')) return true;
        }

        if (step === 'incapacitar' && hasPower(stats, 'Incapacitar')) {
            const target = chooseDangerousEnemy(enemies);
            if (await performTargetedAction(piece, target, 'incapacitar')) return true;
        }

        if (step === 'attack-dureza') {
            const target = chooseTargetByDurability(enemies, ['dureza']);
            if (target) {
                if (await performTargetedAction(piece, target, 'attack')) return true;
            }
        }

        if (step === 'attack-invulnerable') {
            const target = chooseTargetByDurability(enemies, ['invulnerable']);
            if (target) {
                if (await performTargetedAction(piece, target, 'attack')) return true;
            }
        }

        if (step === 'support') {
            if (await attemptSupportAction(piece, stats)) return true;
        }
    }

    return false;
}

async function movePieceToSquare(piece, square) {
    await waitForPopupsToClose();
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
}

async function flashAITarget(piece, target) {
    if (!piece || !target) return;
    const isEnemyTarget = target.dataset.team !== piece.dataset.team;
    const className = isEnemyTarget ? 'piece--ai-target-enemy' : 'piece--ai-target-ally';
    target.classList.add(className);
    await sleep(ENEMY_ACTION_DELAY_MS);
    target.classList.remove(className);
}

function findSupportDecision(piece, stats, { requireInRange = false, alliesOnly = false } = {}) {
    const allies = getAllies(piece).filter((ally) => (alliesOnly ? ally !== piece : true));

    if (hasPower(stats, 'Curar')) {
        const selfStats = pieceMap.get(piece);
        if (!alliesOnly && selfStats && selfStats.currentVida < selfStats.maxVida) {
            if (!requireInRange || canUseSupportAction(piece, piece, 'curar', 'ally')) {
                return { actionKey: 'curar', target: piece, targetType: 'ally' };
            }
        }

        const damagedAlly = findDamagedAlly(piece);
        if (damagedAlly) {
            if (!requireInRange || canUseSupportAction(piece, damagedAlly, 'curar', 'ally')) {
                return { actionKey: 'curar', target: damagedAlly, targetType: 'ally' };
            }
        }
    }

    const buffDecision = chooseSupportBuffTarget(piece, stats, allies);
    if (buffDecision) {
        if (!requireInRange || canUseSupportAction(piece, buffDecision.target, buffDecision.actionKey, 'ally')) {
            return buffDecision;
        }
    }

    if (!alliesOnly) {
        const selfBuffAction = chooseSelfBuffAction(piece, stats);
        if (selfBuffAction) {
            if (!requireInRange || canUseSupportAction(piece, piece, selfBuffAction, 'ally')) {
                return { actionKey: selfBuffAction, target: piece, targetType: 'ally' };
            }
        }
    }

    return null;
}

async function attemptSupportAction(piece, stats) {
    const decision = findSupportDecision(piece, stats);
    if (!decision) return false;
    await performSupportActionFlow(piece, decision);
    return true;
}

async function attemptSupportActionInRange(piece, stats) {
    const decision = findSupportDecision(piece, stats, { requireInRange: true });
    if (!decision) return false;
    await performSupportActionFlow(piece, decision);
    return true;
}

async function moveTowardEnemy(piece) {
    const enemyTarget = findEnemyToAdvance(piece);
    if (!enemyTarget) return false;
    const moveSquare = chooseSupportChaseSquare(piece, enemyTarget, 'enemy');
    if (!moveSquare) return false;
    await movePieceToSquare(piece, moveSquare);
    return true;
}

async function moveTowardAllies(piece, stats) {
    const allies = getAllies(piece).filter((ally) => ally !== piece);
    if (allies.length === 0) return false;
    const target = findDamagedAlly(piece) ?? allies[0];
    const moveSquare = chooseSupportChaseSquare(piece, target, 'ally');
    if (!moveSquare) return false;
    await movePieceToSquare(piece, moveSquare);
    return true;
}

async function handleHighDamageInRange(piece, stats, enemies) {
    if (hasPower(stats, 'Pulso') && countAdjacentEnemies(piece) >= 3) {
        handleActionClick('pulso', { bypassVisuals: true });
        return;
    }

    const explosionTarget = findExplosionTarget(piece, enemies);
    if (explosionTarget) {
        await performTargetedAction(piece, explosionTarget, 'explosion');
        return;
    }

    if (enemies.length === 1) {
        const handled = await executeSingleTargetSequence(piece, stats, enemies, [
            'attack-weak',
            'control mental',
            'attack-dureza',
            'attack-invulnerable',
        ]);
        if (handled) return;
    }

    const target = chooseTargetByDurability(enemies, ['none', 'dureza', 'invulnerable']);
    if (target) {
        await performTargetedAction(piece, target, 'attack');
        return;
    }

    playEffectSound(passTurnSound);
    finishTurn(piece);
}

async function handleHighDamageMoveRange(piece, stats, enemies) {
    const explosionTarget = findExplosionTarget(piece, enemies);
    if (explosionTarget) {
        if (await performTargetedAction(piece, explosionTarget, 'explosion')) return;
    }

    if (enemies.length === 1) {
        const handled = await executeSingleTargetSequence(piece, stats, enemies, [
            'attack-weak',
            'control mental',
            'attack-dureza',
            'attack-invulnerable',
        ]);
        if (handled) return;
    }

    const target = chooseTargetByDurability(enemies, ['none', 'dureza', 'invulnerable']);
    if (target) {
        if (await performTargetedAction(piece, target, 'attack')) return;
    }

    playEffectSound(passTurnSound);
    finishTurn(piece);
}

async function handleHighDamageNoTargets(piece, stats) {
    if (!(await moveTowardEnemy(piece))) {
        playEffectSound(passTurnSound);
        finishTurn(piece);
        return;
    }

    const enemiesInRange = getEnemiesInRange(piece);
    if (enemiesInRange.length === 1) {
        const handled = await executeSingleTargetSequence(piece, stats, enemiesInRange, [
            'attack-weak',
            'control mental',
            'attack-dureza',
            'attack-invulnerable',
        ]);
        if (handled) return;
    }

    if (enemiesInRange.length > 0) {
        const target = chooseTargetByDurability(enemiesInRange, ['none', 'dureza', 'invulnerable']);
        if (target) {
            await performTargetedAction(piece, target, 'attack');
            return;
        }
    }

    const alliesInRange = getAlliesInRange(piece);
    if (alliesInRange.length > 0 || enemiesInRange.length === 0) {
        if (await attemptSupportActionInRange(piece, stats)) return;
    }

    playEffectSound(passTurnSound);
    finishTurn(piece);
}

async function handleHighDamageAlliesOnlyInRange(piece, stats) {
    if (await attemptSupportActionInRange(piece, stats)) {
        return;
    }

    if (!(await moveTowardEnemy(piece))) {
        playEffectSound(passTurnSound);
        finishTurn(piece);
        return;
    }

    const enemiesInRange = getEnemiesInRange(piece);
    if (enemiesInRange.length > 0) {
        await handleHighDamageInRange(piece, stats, enemiesInRange);
        return;
    }

    const alliesInRange = getAlliesInRange(piece);
    if (alliesInRange.length > 0) {
        if (await attemptSupportActionInRange(piece, stats)) return;
    } else {
        if (await attemptSupportActionInRange(piece, stats)) return;
    }

    playEffectSound(passTurnSound);
    finishTurn(piece);
}

async function handleMediumDamageNoTargets(piece, stats) {
    if (!(await moveTowardEnemy(piece))) {
        playEffectSound(passTurnSound);
        finishTurn(piece);
        return;
    }

    const enemiesInRange = getEnemiesInRange(piece);
    if (enemiesInRange.length === 1) {
        const handled = await executeSingleTargetSequence(piece, stats, enemiesInRange, [
            'attack-weak',
            'control mental',
            'attack-dureza',
            'incapacitar',
            'attack-invulnerable',
        ]);
        if (handled) return;
    }

    if (enemiesInRange.length > 0) {
        const target = chooseTargetByDurability(enemiesInRange, ['none', 'dureza', 'invulnerable']);
        if (target && await performTargetedAction(piece, target, 'attack')) return;
    }

    if (await attemptSupportActionInRange(piece, stats)) return;

    playEffectSound(passTurnSound);
    finishTurn(piece);
}

async function handleMediumDamageAlliesOnlyInRange(piece, stats) {
    if (await attemptSupportActionInRange(piece, stats)) {
        return;
    }

    if (!(await moveTowardEnemy(piece))) {
        playEffectSound(passTurnSound);
        finishTurn(piece);
        return;
    }

    const enemiesInRange = getEnemiesInRange(piece);
    if (enemiesInRange.length > 0) {
        await handleMediumDamageEnemiesOnlyInRange(piece, stats, enemiesInRange);
        return;
    }

    if (await attemptSupportActionInRange(piece, stats)) return;

    playEffectSound(passTurnSound);
    finishTurn(piece);
}

async function handleMediumDamageAlliesInRange(piece, stats, enemies) {
    if (hasPower(stats, 'Pulso') && countAdjacentEnemies(piece) >= 3) {
        handleActionClick('pulso', { bypassVisuals: true });
        return;
    }

    const explosionTarget = findExplosionTarget(piece, enemies);
    if (explosionTarget) {
        await performTargetedAction(piece, explosionTarget, 'explosion');
        return;
    }

    if (enemies.length === 1) {
        const handled = await executeSingleTargetSequence(piece, stats, enemies, [
            'attack-weak',
            'control mental',
            'attack-dureza',
            'incapacitar',
            'support',
            'attack-invulnerable',
        ]);
        if (handled) return;
    }

    const target = chooseTargetByDurability(enemies, ['none', 'dureza', 'invulnerable']);
    if (target) {
        await performTargetedAction(piece, target, 'attack');
        return;
    }

    playEffectSound(passTurnSound);
    finishTurn(piece);
}

async function handleMediumDamageEnemiesOnlyInRange(piece, stats, enemies) {
    if (hasPower(stats, 'Pulso') && countAdjacentEnemies(piece) >= 3) {
        handleActionClick('pulso', { bypassVisuals: true });
        return;
    }

    const explosionTarget = findExplosionTarget(piece, enemies);
    if (explosionTarget) {
        await performTargetedAction(piece, explosionTarget, 'explosion');
        return;
    }

    if (enemies.length === 1) {
        const handled = await executeSingleTargetSequence(piece, stats, enemies, [
            'attack-weak',
            'control mental',
            'attack-dureza',
            'incapacitar',
            'attack-invulnerable',
        ]);
        if (handled) return;
    }

    const target = chooseTargetByDurability(enemies, ['none', 'dureza', 'invulnerable']);
    if (target) {
        await performTargetedAction(piece, target, 'attack');
        return;
    }

    playEffectSound(passTurnSound);
    finishTurn(piece);
}

async function handleMediumDamageMoveRange(piece, stats, enemies) {
    const explosionTarget = findExplosionTarget(piece, enemies);
    if (explosionTarget) {
        if (await performTargetedAction(piece, explosionTarget, 'explosion')) return;
    }

    if (enemies.length === 1) {
        const handled = await executeSingleTargetSequence(piece, stats, enemies, [
            'attack-weak',
            'control mental',
            'attack-dureza',
            'incapacitar',
            'attack-invulnerable',
        ]);
        if (handled) return;
    }

    const target = chooseTargetByDurability(enemies, ['none', 'dureza', 'invulnerable']);
    if (target && await performTargetedAction(piece, target, 'attack')) return;

    playEffectSound(passTurnSound);
    finishTurn(piece);
}

async function handleLowDamageAlliesInRange(piece, stats, enemies) {
    if (hasPower(stats, 'Pulso') && countAdjacentEnemies(piece) >= 3) {
        handleActionClick('pulso', { bypassVisuals: true });
        return;
    }

    const explosionTarget = findExplosionTarget(piece, enemies);
    if (explosionTarget) {
        await performTargetedAction(piece, explosionTarget, 'explosion');
        return;
    }

    if (enemies.length === 1) {
        const handled = await executeSingleTargetSequence(piece, stats, enemies, [
            'control mental',
            'incapacitar',
            'support',
            'attack-weak',
            'attack-dureza',
            'attack-invulnerable',
        ]);
        if (handled) return;
    }

    const target = chooseTargetByDurability(enemies, ['none', 'dureza', 'invulnerable']);
    if (target) {
        await performTargetedAction(piece, target, 'attack');
        return;
    }

    playEffectSound(passTurnSound);
    finishTurn(piece);
}

async function handleLowDamageEnemiesOnlyInRange(piece, stats, enemies) {
    if (hasPower(stats, 'Pulso') && countAdjacentEnemies(piece) >= 3) {
        handleActionClick('pulso', { bypassVisuals: true });
        return;
    }

    const explosionTarget = findExplosionTarget(piece, enemies);
    if (explosionTarget) {
        await performTargetedAction(piece, explosionTarget, 'explosion');
        return;
    }

    if (enemies.length === 1) {
        const handled = await executeSingleTargetSequence(piece, stats, enemies, [
            'control mental',
            'incapacitar',
            'attack-weak',
            'attack-dureza',
            'attack-invulnerable',
        ]);
        if (handled) return;
    }

    const target = chooseTargetByDurability(enemies, ['none', 'dureza', 'invulnerable']);
    if (target) {
        await performTargetedAction(piece, target, 'attack');
        return;
    }

    playEffectSound(passTurnSound);
    finishTurn(piece);
}

async function handleLowDamageMoveRange(piece, stats, enemies) {
    const explosionTarget = findExplosionTarget(piece, enemies);
    if (explosionTarget) {
        if (await performTargetedAction(piece, explosionTarget, 'explosion')) return;
    }

    if (enemies.length === 1) {
        const handled = await executeSingleTargetSequence(piece, stats, enemies, [
            'control mental',
            'incapacitar',
            'attack-weak',
            'attack-dureza',
            'attack-invulnerable',
        ]);
        if (handled) return;
    }

    const target = chooseTargetByDurability(enemies, ['none', 'dureza', 'invulnerable']);
    if (target && await performTargetedAction(piece, target, 'attack')) return;

    playEffectSound(passTurnSound);
    finishTurn(piece);
}

async function handleLowDamageNoRange(piece, stats) {
    if (await attemptSupportAction(piece, stats)) return;
    if (await moveTowardEnemy(piece)) {
        playEffectSound(passTurnSound);
        finishTurn(piece);
        return;
    }
    playEffectSound(passTurnSound);
    finishTurn(piece);
}

async function handleLowDamageNoTargets(piece, stats) {
    if (!(await moveTowardEnemy(piece))) {
        playEffectSound(passTurnSound);
        finishTurn(piece);
        return;
    }

    const enemiesInRange = getEnemiesInRange(piece);
    if (enemiesInRange.length === 1) {
        const handled = await executeSingleTargetSequence(piece, stats, enemiesInRange, [
            'control mental',
            'incapacitar',
            'attack-weak',
            'attack-dureza',
            'attack-invulnerable',
        ]);
        if (handled) return;
    }

    if (enemiesInRange.length > 0) {
        const target = chooseTargetByDurability(enemiesInRange, ['none', 'dureza', 'invulnerable']);
        if (target && await performTargetedAction(piece, target, 'attack')) return;
    }

    if (await attemptSupportActionInRange(piece, stats)) return;

    playEffectSound(passTurnSound);
    finishTurn(piece);
}

async function handleLowDamageAlliesOnlyInRange(piece, stats) {
    if (await attemptSupportActionInRange(piece, stats)) {
        return;
    }

    if (!(await moveTowardEnemy(piece))) {
        playEffectSound(passTurnSound);
        finishTurn(piece);
        return;
    }

    const enemiesInRange = getEnemiesInRange(piece);
    if (enemiesInRange.length > 0) {
        await handleLowDamageEnemiesOnlyInRange(piece, stats, enemiesInRange);
        return;
    }

    if (await attemptSupportActionInRange(piece, stats)) return;

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

    const enemiesInRange = Boolean(findEnemyInRange(piece));
    const attackOpportunity = hasAttackOpportunity(piece, stats);
    const damage = stats.dano || 0;

    if (damage >= 3 && attackOpportunity) {
        await performSniperFlow(piece, stats);
        return;
    }

    const weakTargetInRange = findWeakEnemyInRange(piece);
    if (weakTargetInRange && attackOpportunity) {
        await performSniperFlow(piece, stats);
        return;
    }

    if (damage >= 2 && enemiesInRange) {
        await performSniperFlow(piece, stats);
        return;
    }

    if (enemiesInRange) {
        const controlMentalTarget = findEnemyForControl(piece, stats, 'control mental');
        if (controlMentalTarget) {
            await performSupportActionFlow(piece, {
                actionKey: 'control mental',
                target: controlMentalTarget,
                targetType: 'enemy',
            });
            return;
        }

        const incapacitateTarget = findEnemyForControl(piece, stats, 'incapacitar');
        if (incapacitateTarget) {
            await performSupportActionFlow(piece, {
                actionKey: 'incapacitar',
                target: incapacitateTarget,
                targetType: 'enemy',
            });
            return;
        }
    }

    if (hasPower(stats, 'Curar')) {
        const selfStats = pieceMap.get(piece);
        if (selfStats && selfStats.currentVida < selfStats.maxVida) {
            await performSupportActionFlow(piece, {
                actionKey: 'curar',
                target: piece,
                targetType: 'ally',
            });
            return;
        }

        const allyToHeal = findDamagedAlly(piece);
        if (allyToHeal) {
            await performSupportActionFlow(piece, {
                actionKey: 'curar',
                target: allyToHeal,
                targetType: 'ally',
            });
            return;
        }
    }

    const buffDecision = chooseSupportBuffTarget(piece, stats, getAllies(piece));
    if (buffDecision) {
        await performSupportActionFlow(piece, buffDecision);
        return;
    }

    const selfBuffAction = chooseSelfBuffAction(piece, stats);
    if (selfBuffAction) {
        await performSupportActionFlow(piece, {
            actionKey: selfBuffAction,
            target: piece,
            targetType: 'ally',
        });
        return;
    }

    const enemyTarget = findEnemyToAdvance(piece);
    if (enemyTarget) {
        const moveSquare = chooseSupportChaseSquare(piece, enemyTarget, 'enemy');
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

    if (enemyTarget && canShootTarget(piece, enemyTarget)) {
        selectedTarget = enemyTarget;
        handleActionClick('attack', { bypassVisuals: true });
        return;
    }

    playEffectSound(passTurnSound);
    finishTurn(piece);
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

    await waitForPopupsToClose();
    if (canUseSupportAction(piece, target, actionKey, targetType)) {
        await sleep(ENEMY_ACTION_DELAY_MS);
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
            await sleep(ENEMY_ACTION_DELAY_MS);
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

    const buffDecision = chooseSupportBuffTarget(piece, stats, allies);
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

    const buffDecision = chooseSupportBuffTarget(piece, stats, allies);
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

function chooseSupportBuffTarget(attacker, stats, allies) {
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
            const inRange = Boolean(attacker && canUseSupportAction(attacker, ally, key, 'ally'));
            if (
                !best ||
                (inRange && !best.inRange) ||
                (inRange === best.inRange && strength > best.strength)
            ) {
                best = { actionKey: key, target: ally, targetType: 'ally', strength, inRange };
            }
        });
    });

    if (!best) return null;
    return { actionKey: best.actionKey, target: best.target, targetType: best.targetType };
}

function chooseSelfBuffAction(piece, stats) {
    if (!piece || !stats) return null;
    const buffs = [
        { key: 'mejora de ataque', stat: 'ataque' },
        { key: 'mejora de defensa', stat: 'defensa' },
        { key: 'mejora de agilidad', stat: 'agilidad' },
        { key: 'mejora de critico', stat: 'critico' },
    ];

    const alreadyBuffed = (stat) => {
        if (stat === 'critico') return Boolean(stats.critBuff);
        return Boolean(stats.statBuffs?.[stat]);
    };

    const available = buffs.filter(({ key, stat }) => hasPower(stats, key) && !alreadyBuffed(stat));
    if (available.length === 0) return null;

    const preference = ['agilidad', 'ataque', 'defensa', 'critico'];
    available.sort((a, b) => preference.indexOf(a.stat) - preference.indexOf(b.stat));
    return available[0].key;
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

function findWeakEnemyInRange(piece) {
    const enemies = getVisibleEnemies(piece, { requireVisibility: true });
    const origin = getPieceSquare(piece);
    if (!origin) return null;
    return enemies.find((enemy) => {
        const targetSquare = getPieceSquare(enemy);
        if (!targetSquare) return false;
        if (!isWithinAttackRange(origin, targetSquare, rangeForPiece(piece))) return false;
        return isEnemyWeak(pieceMap.get(enemy));
    });
}

function isEnemyWeak(stats) {
    if (!stats) return false;
    const maxVida = stats.maxVida ?? stats.vida ?? 0;
    const currentVida = stats.currentVida ?? maxVida;
    if (maxVida <= 0) return false;
    return currentVida <= Math.max(2, Math.ceil(maxVida * 0.4));
}

function findEnemyForControl(piece, stats, actionKey) {
    if (!hasPower(stats, actionKey === 'control mental' ? 'Control Mental' : 'Incapacitar')) return null;
    const enemies = getVisibleEnemies(piece, { requireVisibility: false });
    if (enemies.length === 0) return null;

    const inRange = enemies.find((enemy) =>
        canUseSupportAction(piece, enemy, actionKey, 'enemy')
    );
    if (inRange) return inRange;

    let best = null;
    enemies.forEach((enemy) => {
        const moveSquare = findSupportMoveSquare(piece, enemy, actionKey, 'enemy');
        if (!moveSquare) return;
        const moveCost = movementDistances.get(moveSquare) ?? 0;
        if (!best || moveCost < best.moveCost) {
            best = { enemy, moveCost };
        }
    });

    return best?.enemy ?? null;
}

function findDamagedAlly(piece) {
    const allies = getAllies(piece);
    const damaged = allies.filter((ally) => {
        const stats = pieceMap.get(ally);
        return stats && stats.currentVida < stats.maxVida;
    });
    if (damaged.length === 0) return null;
    damaged.sort((a, b) => {
        const aMissing = pieceMap.get(a)?.maxVida - pieceMap.get(a)?.currentVida;
        const bMissing = pieceMap.get(b)?.maxVida - pieceMap.get(b)?.currentVida;
        return bMissing - aMissing;
    });
    return damaged[0];
}

function findEnemyToAdvance(piece) {
    const enemies = getVisibleEnemies(piece, { requireVisibility: false });
    if (enemies.length === 0) return null;
    const origin = getPieceSquare(piece);
    if (!origin) return enemies[0];
    return enemies.reduce((best, enemy) => {
        if (!best) return enemy;
        const bestSquare = getPieceSquare(best);
        const enemySquare = getPieceSquare(enemy);
        if (!bestSquare || !enemySquare) return best;
        const bestDist = attackDistance(origin, bestSquare);
        const enemyDist = attackDistance(origin, enemySquare);
        return enemyDist < bestDist ? enemy : best;
    }, null);
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
    if (distance > range) return false;
    if (distance === 0) {
        const isSelf = attacker === target;
        if (!isSelf) return false;
        const allowedSelfActions = new Set([
            'curar',
            'mejora de ataque',
            'mejora de defensa',
            'mejora de agilidad',
            'mejora de critico',
        ]);
        return allowedSelfActions.has(actionKey);
    }
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
