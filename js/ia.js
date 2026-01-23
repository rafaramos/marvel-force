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




Es una decisión sabia. A veces, cuando el código se complica tanto y empiezan a aparecer comportamientos erráticos (fuego amigo, bucles), lo mejor es limpiar el tablero, asegurar lo que funciona y dejar "aparcado" lo que falla hasta tener la mente fresca.

Aquí tienes el archivo ia.js completamente saneado.

Cambios realizados:

Eliminado getSupportAction (Bloque A) y resolvePower (Bloque D). Ya no existen.

Supports y Comodines: Ahora la IA detecta su rol y simplemente dice "Paso turno", ejecutando finishTurn inmediatamente. No hacen nada.

Francotiradores y Fajadores: Mantienen intacta su lógica agresiva (Pulse, Explosión, Move & Attack, Persecución), que era la que funcionaba bien.

Copia y pega esto para sustituir tu código actual:

JavaScript

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
   2. LÓGICA DE CEREBRO (4 ROLES)
   ========================================================================== */

function getAIRole(stats) {
    const rango = stats.rango || 1; 
    const vida = stats.vida || 1; 
    const daño = stats.dano || 0; 

    const sniperPowers = ['Experto a/d', 'Pulso', 'Explosión'];
    const hasSniper = sniperPowers.some(p => hasPower(stats, p));
    
    const supportPowers = ['Curar','Mejora de Ataque','Mejora de Defensa','Mejora de Crítico', 'Mejora de Agilidad',
                           'Control Mental','Telekinesis'];
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
   BLOQUE A: HELPERS DE VISIÓN Y DISTANCIA
   ========================================================================== */

function getDist(el1, el2) {
    const sq1 = el1.closest('.square');
    const sq2 = el2.closest('.square');
    if (!sq1 || !sq2) return 9999;
    return Math.abs(Number(sq1.dataset.row) - Number(sq2.dataset.row)) + 
           Math.abs(Number(sq1.dataset.col) - Number(sq2.dataset.col));
}

function isValidTarget(targetPiece, dist) {
    if (!targetPiece) return false;
    const tStats = pieceMap.get(targetPiece);
    if (dist > 3 && hasPower(tStats, 'Sigilo')) {
        return false;
    }
    return true;
}

async function announceAttack(target) {
    const tSq = target.closest('.square');
    if (tSq) {
        tSq.classList.add('square--target');      
        target.classList.add('piece--selected');  
    }
    target.style.transition = "transform 0.2s ease-in-out";
    target.style.transform = "scale(1.15)"; 

    await new Promise(r => setTimeout(r, 1000));
    
    target.style.transform = "";
    target.style.transition = "";
    if (tSq) {
        tSq.classList.remove('square--target');
        target.classList.remove('piece--selected');
    }
}

// Detecta si merece la pena usar Explosión
function shouldExplode(attacker, target) {
    const stats = pieceMap.get(attacker);
    if (!hasPower(stats, 'Explosión') && !hasPower(stats, 'Explosion')) return false;

    const tSq = target.closest('.square');
    const row = Number(tSq.dataset.row);
    const col = Number(tSq.dataset.col);
    const offsets = [[1,0], [-1,0], [0,1], [0,-1]];

    for (const [dr, dc] of offsets) {
        const neighbor = document.querySelector(`.square[data-row="${row+dr}"][data-col="${col+dc}"]`);
        if (neighbor) {
            const adjacentPiece = neighbor.querySelector('.piece');
            if (adjacentPiece && adjacentPiece.dataset.team === target.dataset.team) {
                console.log("💥 IA Detecta agrupación -> Prepara EXPLOSIÓN.");
                return true;
            }
        }
    }
    return false;
}

// Detecta si debe usar Pulso (Rodeado)
function shouldUsePulse(attacker) {
    const stats = pieceMap.get(attacker);
    if (!hasPower(stats, 'Pulso')) return false;

    const sq = attacker.closest('.square');
    const row = Number(sq.dataset.row);
    const col = Number(sq.dataset.col);
    const offsets = [[1,0], [-1,0], [0,1], [0,-1]];
    
    let adjacentEnemies = 0;

    for (const [dr, dc] of offsets) {
        const neighbor = document.querySelector(`.square[data-row="${row+dr}"][data-col="${col+dc}"]`);
        if (neighbor) {
            const p = neighbor.querySelector('.piece');
            if (p && p.dataset.team === 'aliado') {
                adjacentEnemies++;
            }
        }
    }
    return adjacentEnemies >= 2;
}

//* ==========================================================================
   BLOQUE B: CÁLCULO DE MOVIMIENTO
   ========================================================================== */

function getBestMove(piece, role, stats, target, movementDistances) {
    const MOVE_CAP = 4; 
    let bestSquare = null;
    let goingForObject = false;
    let lowestDistToTarget = 9999;
    const targetSquare = target.closest('.square');

    // Lógica de Objetos (Solo Francotirador + Superfuerza)
    if (role === 'francotirador' && hasPower(stats, 'Superfuerza') && !stats.heldObject) {
        let minObjDist = 999;
        movementDistances.forEach((cost, square) => {
            if (cost > MOVE_CAP) return;
            if (square.querySelector('.object-token')) {
                const d = getDist(piece, square); 
                if (d < minObjDist) {
                    minObjDist = d;
                    bestSquare = square;
                    goingForObject = true;
                }
            }
        });
    }

    // Persecución estándar
    if (!goingForObject) {
        movementDistances.forEach((cost, candidateSquare) => {
            if (cost > MOVE_CAP) return; 
            const dist = getDist(candidateSquare, targetSquare);
            if (dist < lowestDistToTarget) {
                lowestDistToTarget = dist;
                bestSquare = candidateSquare;
            }
        });
    }
    return { bestSquare, goingForObject };
}

/* ==========================================================================
   BLOQUE C: EJECUCIÓN (LÓGICA LIMPIA)
   ========================================================================== */

async function performEnemyTurn(piece) {
    const stats = pieceMap.get(piece);
    const role = getAIRole(stats);
    const range = stats.rango || 1;
    
    console.log(`🤖 IA (${piece.dataset.key}) | Rol: ${role.toUpperCase()} | Iniciando turno...`);

    // 1. ROLES PASIVOS (Support y Comodín) -> PASAN TURNO
    if (role === 'support' || role === 'comodin') {
        console.log("💤 Rol pasivo: Pasando turno.");
        await new Promise(r => setTimeout(r, 500));
        finishTurn(piece);
        return;
    }

    // 2. ROLES ACTIVOS (Francotirador y Fajador) -> COMBATE
    // Si no es ninguno de los dos, salimos por seguridad
    if (role !== 'francotirador' && role !== 'fajador') {
        finishTurn(piece);
        return;
    }

    // --- CHECK EMERGENCIA: PULSO ---
    if (shouldUsePulse(piece)) {
        console.log("😰 ¡Rodeado! Activando PULSO.");
        await announceAttack(piece); 
        if (typeof resolvePulse === 'function') await resolvePulse(piece);
        else await resolveAttack(piece, piece, 'pulso');
        return;
    }

    // A. BUSCAR ENEMIGOS
    const enemies = Array.from(document.querySelectorAll('.piece'))
        .filter(p => p.dataset.team === 'aliado' && p.dataset.eliminated !== 'true');

    if (enemies.length === 0) { finishTurn(piece); return; }

    // Helpers locales de combate
    const getBestTargetInRange = (candidateList, currentSquare = null) => {
        const attackerSq = currentSquare || piece.closest('.square');
        const validTargets = candidateList.filter(e => {
            const eSq = e.closest('.square');
            // Distancia manual
            const dist = Math.abs(Number(attackerSq.dataset.row) - Number(eSq.dataset.row)) + 
                         Math.abs(Number(attackerSq.dataset.col) - Number(eSq.dataset.col));
            return dist <= range && isValidTarget(e, dist);
        });
        if (validTargets.length === 0) return null;
        
        validTargets.sort((a, b) => {
            // Prioridad: Explosión > Menos Vida > Distancia
            const explodeA = shouldExplode(piece, a); const explodeB = shouldExplode(piece, b);
            if (explodeA && !explodeB) return -1; if (!explodeA && explodeB) return 1;
            
            const hpA = pieceMap.get(a).currentVida; const hpB = pieceMap.get(b).currentVida;
            if (hpA !== hpB) return hpA - hpB;
            
            return getDist(piece, a) - getDist(piece, b);
        });
        return validTargets[0];
    };

    const executeBestAttack = async (attacker, victim) => {
        if (shouldExplode(attacker, victim)) await resolveExplosion(attacker, victim);
        else await resolveAttack(attacker, victim, 'attack');
    };

    // B. IDENTIFICAR ENEMIGO MÁS CERCANO (Referencia general)
    let closestEnemy = null;
    let minDist = 9999;
    enemies.forEach(e => {
        const d = getDist(piece, e);
        if (d < minDist) { minDist = d; closestEnemy = e; }
    });

    // C. ATAQUE ESTÁTICO (YA A RANGO)
    const bestStaticTarget = getBestTargetInRange(enemies);
    if (bestStaticTarget) {
        console.log(`⚔️ Objetivo a tiro. Atacando.`);
        await announceAttack(bestStaticTarget);
        await executeBestAttack(piece, bestStaticTarget);
        return;
    }

    // D. MOVE & ATTACK
    highlightMovement(piece); 
    if (!movementDistances || movementDistances.size === 0) {
        clearHighlights();
        finishTurn(piece);
        return;
    }

    let attackSquare = null;
    let minMoveCost = 999;
    const navTargetSquare = closestEnemy.closest('.square'); 

    movementDistances.forEach((cost, square) => {
        const dist = getDist(square, navTargetSquare);
        if (dist <= range && isValidTarget(closestEnemy, dist)) {
            if (cost < minMoveCost) {
                minMoveCost = cost;
                attackSquare = square;
            }
        }
    });

    if (attackSquare) {
        console.log(`🎯 Move & Attack (${minMoveCost} pasos).`);
        clearHighlights(); 
        await animatePieceToSquare(piece, attackSquare);
        if (typeof spendMovement === 'function') spendMovement(piece, minMoveCost);
        if (typeof highlightRange === 'function') highlightRange(piece); 

        const bestPostMoveTarget = getBestTargetInRange(enemies);
        if (bestPostMoveTarget) {
             await announceAttack(bestPostMoveTarget);
             await executeBestAttack(piece, bestPostMoveTarget);
        }
        return;
    }

    // E. PERSECUCIÓN
    console.log("🏃 Persecución Ofensiva.");
    const { bestSquare, goingForObject } = getBestMove(piece, role, stats, closestEnemy, movementDistances);
    
    clearHighlights(); 

    if (bestSquare) {
        await animatePieceToSquare(piece, bestSquare);
        if (typeof spendMovement === 'function') spendMovement(piece, movementDistances.get(bestSquare)||0);
        if (typeof highlightRange === 'function') highlightRange(piece);

        if (goingForObject) {
            const objEl = bestSquare.querySelector('.object-token');
            if (objEl) {
                if (typeof objectSound !== 'undefined') objectSound.play().catch(()=>{});
                const type = objEl.dataset.type;
                stats.heldObject = { type, name: objEl.dataset.name };
                if (type === 'light') { stats.dano += 1; stats.rango = 3; } 
                else { stats.dano += 2; stats.rango = 2; }
                piece.dataset.rango = stats.rango;
                piece.classList.add('piece--holding');
                objEl.remove();
            }
        }

        const bestChaseTarget = getBestTargetInRange(enemies);
        if (bestChaseTarget) {
            console.log(`👊 Oportunidad tras avance.`);
            await announceAttack(bestChaseTarget);
            await executeBestAttack(piece, bestChaseTarget);
            return;
        }
    }

    if (typeof highlightRange === 'function') highlightRange(piece);
    await new Promise(r => setTimeout(r, 800));
    finishTurn(piece);
}