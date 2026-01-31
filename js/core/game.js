const board = document.querySelector('.board');
      const startScreen = document.getElementById('startScreen');
      const draftScreen = document.getElementById('draftScreen');
      const gameContainer = document.getElementById('gameContainer');
      const playButton = document.getElementById('playButton');
      const modeSelection = document.getElementById('modeSelection');
      const modeButtons = modeSelection.querySelectorAll('[data-mode]');
      const draftGrid = document.getElementById('draftGrid');
      const draftPrompt = document.getElementById('draftPrompt');
      const draftPicker = document.getElementById('draftPicker');
    const draftTurn = document.getElementById('draftTurn');
    const draftCounter = document.getElementById('draftCounter');
    const draftInfo = document.getElementById('draftInfo');
    const draftSubtitle = document.getElementById('draftSubtitle');
    const draftFinalizeButton = document.getElementById('draftFinalizeButton');
      const pieceStats =
        (typeof personajes !== 'undefined' && personajes) ||
        (typeof window !== 'undefined' ? window.personajes : {});

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
      const SCORE_PER_DAMAGE = 10;
      const SCORE_PER_KILL = 50;
      const gameState = { mode: null };
      
      const punchSound = new Audio('assets/audio/sfx/punch.mp3');
      const ohSound = new Audio('assets/audio/sfx/oh.mp3');
      const failureSound = new Audio('assets/audio/sfx/failure.mp3');
      const passTurnSound = new Audio('assets/audio/sfx/pasar.wav');
      const deathSound = new Audio('assets/audio/sfx/muerte.wav');

      const criticoSound = new Audio('assets/audio/sfx/critico.mp3');

      const bonusConfirmSound = new Audio('assets/audio/sfx/click.wav');

      const controlMentalSound = new Audio('assets/audio/sfx/controlMental.mp3');
      const curarSound = new Audio('assets/audio/sfx/curar.mp3');
      const explosionSound = new Audio('assets/audio/sfx/explosion.mp3');
      const incapacitarSound = new Audio('assets/audio/sfx/incapacitar.wav');
      const pulsoSound = new Audio('assets/audio/sfx/pulso.wav');
      const telekinesisSound = new Audio('assets/audio/sfx/telekinesis.wav');
      const barrierSound = new Audio('assets/audio/sfx/barrera.wav');

      // --- NUEVO: Configuración de Objetos ---
    const objectSound = new Audio('assets/audio/sfx/objeto.wav');
    
    const MAP_OBJECTS = [
        { name: 'Autobús', type: 'heavy', img: 'assets/images/objects/autobus.webp' },
        { name: 'Coche', type: 'heavy', img: 'assets/images/objects/coche.webp' },
        { name: 'Moto', type: 'light', img: 'assets/images/objects/moto.webp' },
        { name: 'Semáforo', type: 'light', img: 'assets/images/objects/semaforo.webp' }
    ];

    function placeGameObjects() {
      document.querySelectorAll('.object-token').forEach(el => el.remove());
      
      const availableSquares = squares.filter(sq => {
          const hasPiece = sq.querySelector('.piece');
          const isBarrier = isBarrierSquare(sq);
          const hasObject = sq.querySelector('.object-token');
          return !hasPiece && !isBarrier && !hasObject;
      });

      const shuffled = availableSquares.sort(() => 0.5 - Math.random());
      
      MAP_OBJECTS.forEach((obj, index) => {
          if (shuffled[index]) {
              const img = document.createElement('img');
              img.src = obj.img;
              img.className = 'object-token';
              
              // --- CAMBIO: Clases visuales según peso ---
              if (obj.type === 'heavy') img.classList.add('object-heavy');
              else img.classList.add('object-light');
              // ------------------------------------------

              img.alt = obj.name;
              img.dataset.type = obj.type; 
              img.dataset.name = obj.name;
              shuffled[index].appendChild(img);
          }
      });
    }
      
      let pendingPopupSound = null;
      const BOARD_ROWS = 10;
      const BOARD_COLS = 10;
      const backgroundMusic = new Audio('assets/audio/music/Endgame.mp3');
      backgroundMusic.loop = true;
      backgroundMusic.volume = 0.35;

      const introMusic = new Audio('assets/audio/music/introduccion.wav');
      introMusic.loop = true; // Para que se repita si tardas mucho en elegir
      introMusic.volume = 0.4; // Ajusta el volumen si quieres

      let backgroundStarted = false;
      let isPlayerVsAI = false;
      let isAIVsAI = false;
      let gameStarted = false;
      const playerControl = { player1: 'manual', player2: 'manual' };
      const PROBABILIDAD_DURATION = 2;
      const SUPPORT_POWERS = new Set([
        'probabilidad',
        'mejora de ataque',
        'mejora de defensa',
        'mejora de agilidad',
        'mejora de critico',
        'curar',
      ]);
      let draftOrder = [];
      let draftIndex = 0;
      let firstPicker = 'player1';
      let draftActive = false;
      const draftFinalized = { player1: false, player2: false };
      const selections = { player1: [], player2: [] };
      let availableCharacters = [];

      function shouldAIPick(playerId) {
        return isAIVsAI || (isPlayerVsAI && playerId === 'player2');
      }

      function playerIdForPiece(piece) {
        if (!piece) return null;
        return piece.dataset.team === 'aliado' ? 'player1' : 'player2';
      }

      function isCPUControlledPiece(piece) {
        if (!piece) return false;
        const playerId = playerIdForPiece(piece);
        if (playerId && playerControl[playerId]) {
          return playerControl[playerId] === 'auto';
        }
        if (isAIVsAI) return true;
        return isPlayerVsAI && piece.dataset.team === 'enemigo';
      }

      function updateControlToggleButton(button, playerId) {
        if (!button) return;
        const mode = playerControl[playerId] || 'manual';
        const label = playerId === 'player1' ? 'J1' : 'J2';
        button.textContent = `${label}: ${mode.toUpperCase()}`;
        button.classList.toggle('is-auto', mode === 'auto');
        button.classList.toggle('is-manual', mode === 'manual');
      }

      function updateControlToggles() {
        updateControlToggleButton(document.getElementById('controlToggleP1'), 'player1');
        updateControlToggleButton(document.getElementById('controlToggleP2'), 'player2');
      }

      function triggerAITurnIfActive(playerId) {
        const activePiece = turnOrder[turnIndex];
        if (!activePiece) return;
        if (playerIdForPiece(activePiece) !== playerId) return;
        if (!isCPUControlledPiece(activePiece)) return;
        if (actionUsedThisTurn) return;
        passButton.disabled = true;
        attackButton.disabled = true;
        setTimeout(() => performEnemyTurn(activePiece), 0);
      }

      function setPlayerControlMode(playerId, mode) {
        playerControl[playerId] = mode;
        updateControlToggles();
        const activePiece = turnOrder[turnIndex];
        if (activePiece && playerIdForPiece(activePiece) === playerId) {
          if (mode === 'auto') {
            triggerAITurnIfActive(playerId);
          } else {
            passButton.disabled = false;
            attackButton.disabled = false;
          }
        }
      }

      // --- NUEVA VARIABLE DE ESTADO ---
    let pendingTelekinesis = null; // Guardará { attacker, victim } mientras eliges destino
      const BARRIER_SEGMENTS = 4;
      let barrierPreviewSquares = [];
      let pendingBarrierPlacement = null;

let activeBarriers = []; // Nueva lista para rastrear barreras activas



    function revealModes() {
      startScreen.classList.add('start-screen--modes');
      playButton.hidden = true;
      playButton.style.display = 'none';
      playButton.setAttribute('aria-hidden', 'true');
      modeSelection.hidden = false;
      modeSelection.removeAttribute('hidden');
      modeSelection.style.display = 'grid';
    }

    function hideStartScreen() {
      startScreen.classList.add('start-screen--hidden');
      startScreen.setAttribute('aria-hidden', 'true');
      startScreen.hidden = true;
      startScreen.style.display = 'none';
    }

      const controlToggleP1Button = document.getElementById('controlToggleP1');
      if (controlToggleP1Button) {
        controlToggleP1Button.addEventListener('click', () => {
          const nextMode = playerControl.player1 === 'auto' ? 'manual' : 'auto';
          setPlayerControlMode('player1', nextMode);
        });
      }

      const controlToggleP2Button = document.getElementById('controlToggleP2');
      if (controlToggleP2Button) {
        controlToggleP2Button.addEventListener('click', () => {
          const nextMode = playerControl.player2 === 'auto' ? 'manual' : 'auto';
          setPlayerControlMode('player2', nextMode);
        });
      }

      if (draftFinalizeButton) {
        draftFinalizeButton.addEventListener('click', () => {
          if (!draftActive || !canFinalizeDraft()) return;
          advanceDraftIndex();
          const pickerId = draftOrder[draftIndex];
          if (!pickerId || draftFinalized[pickerId]) return;
          draftFinalized[pickerId] = true;
          updateDraftFinalizeButton();
          advanceDraftIndex();
          if (draftIsComplete()) {
            finalizeDraft();
            return;
          }
          updateDraftLabels();
          const nextPicker = draftOrder[draftIndex];
          if (shouldAIPick(nextPicker)) {
            setTimeout(performAIPick, 600);
          }
        });
      }

      let initialPositions = [];

      const ALLY_COLORS = ['piece--white', 'piece--red', 'piece--violet', 'piece--blue', 'piece--gold'];
      const ENEMY_COLORS = ['piece--black', 'piece--violet', 'piece--red', 'piece--blue', 'piece--gold'];

    function generateSlots(count, { startCol, direction, palette }) {
      const slots = [];
      let col = startCol;
      let colorIndex = 0;

      while (slots.length < count && col >= 1 && col <= BOARD_COLS) {
        for (let row = 1; row <= BOARD_ROWS && slots.length < count; row += 1) {
          const className = palette[colorIndex % palette.length];
          slots.push({ row, col, className });
          colorIndex += 1;
        }
        col += direction;
      }

      return slots;
    }

    function createPieceElement({ key, team, className }) {
    const stats = pieceStats[key];
    const piece = document.createElement('span');
    piece.className = `piece ${className}`;
    piece.dataset.team = team;
    piece.dataset.key = key;
    piece.setAttribute('role', 'img');
    piece.setAttribute('aria-label', stats?.name || key);
    piece.innerHTML = `
        <img class="piece__image" src="${stats?.imagen || ''}" alt="${stats?.name || key}" />
        <span class="piece__name">${stats?.name || key}</span>
    `;

    // --- AÑADE ESTA LÍNEA AQUÍ ---
    attachTooltipEvents(piece); 
    // -----------------------------

    return piece;
}

    function buildBoard() {
      board.innerHTML = '';
      for (let row = 1; row <= BOARD_ROWS; row += 1) {
        for (let col = 1; col <= BOARD_COLS; col += 1) {
          const square = document.createElement('div');
          square.className = 'square';
          const occupant = initialPositions.find((item) => item.row === row && item.col === col);
          if (occupant) {
            square.appendChild(createPieceElement(occupant));
          }
          board.appendChild(square);
        }
      }
      squares = Array.from(board.querySelectorAll('.square'));
      squaresByCoord = new Map();
      squares.forEach((square, index) => {
        const row = Math.floor(index / BOARD_COLS) + 1;
        const col = (index % BOARD_COLS) + 1;
        square.dataset.row = row;
        square.dataset.col = col;
        squaresByCoord.set(`${row},${col}`, square);
      });
    }

    let squares = [];
    const tooltip = document.getElementById('tooltip');
    const turnPopup = document.getElementById('turnPopup');
    const turnPopupMessage = document.getElementById('turnPopupMessage');
    const deathPopup = document.getElementById('deathPopup');
    const deathPopupMessage = document.getElementById('deathPopupMessage');
    const allyPanel = document.getElementById('allyPanel');
    const enemyPanel = document.getElementById('enemyPanel');
    const passButton = document.getElementById('passTurn');
    const attackButton = document.getElementById('attack');
    const powerControls = document.getElementById('powerControls');
    const turnInfo = document.getElementById('turnInfo');
    const movementInfo = document.getElementById('movementInfo');
    const allyCards = document.getElementById('allyCards');
    const enemyCards = document.getElementById('enemyCards');

    const AI_DELAY_MS = 1200;
    const TURN_DELAY_MS = 600;
    const ENEMY_ACTION_DELAY_MS = 250;
    const DEFAULT_MOVE_DURATION_MS = 1200;

    let squaresByCoord = new Map();
    const pieceMap = new Map();
    let movementDistances = new Map();
    let currentAction = 'attack';
    let movementAnimationDuration = DEFAULT_MOVE_DURATION_MS;
    const movementPool = new Map();
    let turnOrder = [];
    let turnIndex = 0;
    let actionUsedThisTurn = false;

    // --- FUNCIONES DE MOVIMIENTO (RECUPERADAS) ---
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
    // ---------------------------------------------

    function recomputeTurnOrder() {
      turnOrder = pieces
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
      turnIndex = 0;
    }

    function normalizePowerKey(power) {
      if (!power) return ''; // Protección contra nulos/undefined
      return power
        .toString()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
    }

    function mergePowerLists(primaryList = [], fallbackList = []) {
      const seen = new Set();
      return [...primaryList, ...fallbackList].filter((entry) => {
        const key = normalizePowerKey(entry?.nombre ?? entry);
        if (!key) return false;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    }

    function resolvePowerSets(stats) {
      const powers = stats?.poderes || { activos: [], pasivos: [] };
      const legacy = stats?.habilidades || { activas: [], pasivas: [] };
      return {
        activos: mergePowerLists(powers.activos || [], legacy.activas || []),
        pasivos: mergePowerLists(powers.pasivos || [], legacy.pasivas || []),
      };
    }

    function hasPassive(stats, key) {
      return false;
    }

    function hasActive(stats, key) {
      return false;
    }

    function pieceColor(element) {
      if (element.classList.contains('piece--white')) return '#dcdcdc';
      if (element.classList.contains('piece--red')) return '#c62828';
      if (element.classList.contains('piece--violet')) return '#8e44ad';
      if (element.classList.contains('piece--blue')) return '#1e88e5';
      if (element.classList.contains('piece--gold')) return '#f4a300';
      return '#1f1f1f';
    }

    function addPoints(piece, amount) {
      const stats = pieceMap.get(piece);
      if (!stats || !Number.isFinite(amount)) return;
      stats.puntos = (stats.puntos || 0) + amount;
    }

    function isEnemy(attacker, target) {
      return attacker?.dataset.team && target?.dataset.team && attacker.dataset.team !== target.dataset.team;
    }

function registerTurnSound({ damageDealt = 0, attackFailed = false, zeroDamageHit = false } = {}) {
      if (damageDealt > 0) {
        pendingPopupSound = 'punch';
      } else if (zeroDamageHit) {
        pendingPopupSound = 'oh'; // <--- Sonido para acierto con 0 daño
      } else if (attackFailed && !pendingPopupSound) {
        pendingPopupSound = 'failure';
      }
    }

    function playTurnSound() {
      const chosen = pendingPopupSound;
      pendingPopupSound = null;
      
      let sound = null;
      if (chosen === 'punch') sound = punchSound;
      else if (chosen === 'failure') sound = failureSound;
      else if (chosen === 'oh') sound = ohSound; // <--- Reproducimos el OH
      
      if (!sound) return;
      sound.currentTime = 0;
      sound.play().catch(() => {});
    }

    function playEffectSound(sound) {
      if (!sound) return;
      sound.currentTime = 0;
      sound.play().catch(() => {});
    }

    function startBackgroundMusic() {
      if (backgroundStarted) return;
      backgroundStarted = true;
      backgroundMusic.currentTime = 0;
      backgroundMusic.play().catch(() => {
        backgroundStarted = false;
      });
    }

    function attachPieceData(piece, key, team) {
      // --- CORRECCIÓN: Definimos la lista aquí mismo para evitar errores ---
      const HIDDEN_POWERS = []; // Lista vacía = todos los poderes visibles
      // -------------------------------------------------------------------

      const stats = pieceStats[key];
      if (!stats) return;

      const rawPowers = resolvePowerSets(stats);

      // Filtramos las listas eliminando los que estén en la lista negra
      const filteredPowers = {
          activos: (rawPowers.activos || []).filter(p => {
              const nombre = normalizePowerKey(p.nombre || p);
              return !HIDDEN_POWERS.includes(nombre);
          }),
          pasivos: (rawPowers.pasivos || []).filter(p => {
              const nombre = normalizePowerKey(p.nombre || p);
              return !HIDDEN_POWERS.includes(nombre);
          })
      };

      const baseDamage = stats.dano ?? 0;
      const baseResistencia = 0; 

      const computedStats = {
        ...stats,
        dano: baseDamage,
        resistencia: baseResistencia,
        poderes: filteredPowers, 
        baseAtaque: stats.ataque,
        baseDefensa: stats.defensa,
        baseAgilidad: stats.agilidad,
        statBuffs: {},
        currentVida: stats.vida,
        maxVida: stats.vida,
        incapacitatedTurns: 0,
        probabilidadTurns: 0,
        puntos: 0,
      };
      
      piece.dataset.key = key;
      piece.dataset.team = team;
      piece.dataset.rango = stats.rango;
      piece.dataset.movimiento = stats.movimiento;
      piece.dataset.stats = JSON.stringify(computedStats);
      pieceMap.set(piece, computedStats);
    }

    let pieces = [];

    function hydratePieces() {
      pieces = Array.from(board.querySelectorAll('.piece')).map((element) => ({
        element,
        key: element.dataset.key,
        team: element.dataset.team,
      }));

      pieceMap.clear();
      movementPool.clear();

      pieces.forEach(({ element, key, team }) => {
        if (element) {
          attachPieceData(element, key, team);
        }
      });
    }

   function renderLifeCards() {
      allyCards.innerHTML = '';
      enemyCards.innerHTML = '';

      const activePiece = turnOrder[turnIndex];
      const allyOrder = selections?.player1 ?? [];
      const enemyOrder = selections?.player2 ?? [];

      const piecesByTeam = {
        aliado: new Map(),
        enemigo: new Map(),
      };

      pieces.forEach(({ element }) => {
        if (!element) return;
        const team = element.dataset.team;
        if (!piecesByTeam[team]) return;
        piecesByTeam[team].set(element.dataset.key, element);
      });

      const appendCard = (element, container) => {
        const stats = pieceMap.get(element);
        const eliminated = element.dataset.eliminated === 'true';
        const card = document.createElement('div');
        card.className = `life-card${eliminated ? ' life-card--eliminated' : ''}`;

        if (element === activePiece) {
          const borderColor = element.dataset.team === 'aliado' ? '#2b9afc' : '#ef3f3f';
          card.classList.add('life-card--active-turn');
          card.style.setProperty('--life-card-border', borderColor);
        }

        // --- CAMBIO AQUÍ: Formato de vida Actual / Máxima ---
        const vidaActual = Math.max(stats.currentVida, 0);
        const vidaMax = stats.maxVida; 
        // ---------------------------------------------------

        card.innerHTML = `
          <div class="life-card__main">
            <img class="life-card__avatar" src="${stats.imagen}" alt="${stats.name}" loading="lazy" />
            <span class="life-card__label">${stats.name}</span>
            <span class="life-card__meta">Vida: ${vidaActual}/${vidaMax} · ${stats.puntos ?? 0} pts</span>
          </div>
        `;
        container.appendChild(card);
      };

      const renderTeamCards = (team, order, container) => {
        const used = new Set();
        order.forEach((key) => {
          const element = piecesByTeam[team].get(key);
          if (!element) return;
          used.add(element);
          appendCard(element, container);
        });

        pieces.forEach(({ element }) => {
          if (!element || element.dataset.team !== team || used.has(element)) return;
          appendCard(element, container);
        });
      };

      renderTeamCards('aliado', allyOrder, allyCards);
      renderTeamCards('enemigo', enemyOrder, enemyCards);
    }

    function rebuildGameState() {
      buildBoard();
      hydratePieces();
      movementDistances = new Map();
      recomputeTurnOrder();
      renderLifeCards();
    }

    const ANIMATION_OVERRIDES = {
      antorcha: 'animaciones/antorcha-humana.webp',
      avispa: 'animaciones/avispa.webp',
      bruja: 'animaciones/bruja-escarlata.webp',
      'bruja-escarlata': 'animaciones/bruja-escarlata.webp',
      capitan: 'animaciones/capitan-america.webp',
      cosa: 'animaciones/la-cosa.webp',
      duende: 'animaciones/duende.webp',
      hulk: 'animaciones/hulk.webp',
      hulka: 'animaciones/hulka.webp',
      'iron-man': 'animaciones/iron-man.webp',
      lobezno: 'animaciones/lobezno.webp',
      spider: 'animaciones/spider-man.webp',
      thor: 'animaciones/thor.webp',
      ciclope: 'animaciones/ciclope.webp',
    };

    function animationImageForPiece(piece, stats) {
      const key = piece?.dataset?.key || '';
      if (key && ANIMATION_OVERRIDES[key]) {
        return ANIMATION_OVERRIDES[key];
      }
      const candidate = key ? `assets/images/animations/${key}.webp` : null;
      return stats?.animacion || stats?.imagen || candidate || '';
    }

    function snapshotCharacter(piece, role) {
      if (!piece) return null;
      const stats = pieceMap.get(piece);
      if (!stats) return null;
      return {
        key: piece.dataset.key,
        team: piece.dataset.team,
        role,
        name: stats.name,
        vida: Math.max(stats.currentVida ?? stats.vida ?? 0, 0),
        puntos: stats.puntos ?? 0,
        imagen: animationImageForPiece(piece, stats),
        eliminated: piece.dataset.eliminated === 'true',
      };
    }

    function setLatestPopupContext(message, participants = []) {
      const context = { message: message || '', allies: [], enemies: [] };
      participants.forEach(({ piece, role }) => {
        const snapshot = snapshotCharacter(piece, role);
        if (!snapshot) return;
        if (snapshot.team === 'aliado') {
          context.allies.push(snapshot);
        } else {
          context.enemies.push(snapshot);
        }
      });
      latestPopupContext = context;
    }

   function renderDuelSide(container, characters) {
      container.innerHTML = '';
      if (!characters || characters.length === 0) {
        container.classList.add('duel-panel--hidden');
        container.style.setProperty('--duel-slot-count', 0);
        return;
      }

      container.classList.remove('duel-panel--hidden');
      container.style.setProperty('--duel-slot-count', characters.length);

      characters.forEach((char) => {
        const card = document.createElement('div');
        card.className = 'duel-card';
        if (char.eliminated) {
          card.classList.add('duel-card--eliminated');
        }
        
        // Mantenemos el ancho flexible, pero QUITAMOS el cálculo de fuentes
        card.style.flexBasis = `${100 / characters.length}%`;
        
        // --- BLOQUE ELIMINADO/COMENTADO ---
        // let fontSizeBase = 4.5 / Math.sqrt(characters.length); 
        // const nameSizeVw = Math.min(3.5, Math.max(1.1, fontSizeBase));
        // card.style.setProperty('--duel-name-size', `${nameSizeVw}vw`);
        // -----------------------------------

        const overlayClass = char.role === 'attacker' ? 'duel-card__overlay--attacker' : 'duel-card__overlay--defender';
        
        // Añadimos una clase extra si el nombre es MUY largo para ayudar al CSS
        const isLongName = char.name.length > 12;
        
        card.innerHTML = `
          <img class="duel-card__image" src="${char.imagen}" alt="${char.name}" />
          <div class="duel-card__overlay ${overlayClass}"></div>
          <div class="duel-card__label">
            <p class="duel-card__name ${isLongName ? 'duel-card__name--long' : ''}">${char.name}</p>
            <p class="duel-card__stats">
              <span class="duel-card__badge">Vida ${char.vida}</span>
              <span class="duel-card__badge">${char.puntos} pts</span>
            </p>
          </div>
        `;
        container.appendChild(card);
      });
    }

    function renderPopupPanels(context) {
      const allies = context?.allies || [];
      const enemies = context?.enemies || [];
      renderDuelSide(allyPanel, allies);
      renderDuelSide(enemyPanel, enemies);
    }

    function fallbackPopupContext(message) {
      const active = turnOrder[turnIndex];
      if (!active) {
        return { message: message || '', allies: [], enemies: [] };
      }
      const snapshot = snapshotCharacter(active, 'attacker');
      if (!snapshot) {
        return { message: message || '', allies: [], enemies: [] };
      }
      const isAlly = snapshot.team === 'aliado';
      return {
        message: message || '',
        allies: isAlly ? [snapshot] : [],
        enemies: isAlly ? [] : [snapshot],
      };
    }

    function addHistoryEntry(team, message, options = {}) {
      const { preserveLatest = false, attacker = null, defenders = [] } = options;
      if (!preserveLatest) {
        latestActionMessage = message;
      }
      if (attacker || defenders.length) {
        const participants = [];
        const seenPieces = new Set();
        if (attacker && !seenPieces.has(attacker)) {
          participants.push({ piece: attacker, role: 'attacker' });
          seenPieces.add(attacker);
        }
        defenders.forEach((target) => {
          if (seenPieces.has(target)) return;
          participants.push({ piece: target, role: 'defender' });
          seenPieces.add(target);
        });
        setLatestPopupContext(message, participants);
      }
    }

    function hideTurnPopup() {
      turnPopup.hidden = true;
    }

    function showTurnPopup(message) {
      return new Promise((resolve) => {
        resolveTurnPopup = () => {
          hideTurnPopup();
          resolve();
        };
        const context = latestPopupContext || fallbackPopupContext(message);
        const finalMessage = context?.message || message || 'Turno completado.';
        turnPopupMessage.textContent = finalMessage;
        renderPopupPanels(context);
        latestPopupContext = null;
        turnPopup.hidden = false;
        playTurnSound();
      });
    }

    function hideDeathPopup() {
      deathPopup.hidden = true;
    }

    function showDeathPopup(message) {
      return new Promise((resolve) => {
        resolveDeathPopup = () => {
          hideDeathPopup();
          resolve();
        };
        deathPopupMessage.textContent = message || 'Un personaje ha caído.';
        deathPopup.hidden = false;
      });
    }

    function handleTurnPopupDismiss() {
      if (turnPopup.hidden || !resolveTurnPopup) return;
      playTurnSound();
      const resolver = resolveTurnPopup;
      resolveTurnPopup = null;
      resolver();
    }

    function handleDeathPopupDismiss() {
      if (deathPopup.hidden || !resolveDeathPopup) return;
      const resolver = resolveDeathPopup;
      resolveDeathPopup = null;
      resolver();
    }

    function handleGlobalDismiss() {
      handleDeathPopupDismiss();
      handleTurnPopupDismiss();
    }

    ['keydown', 'mousedown', 'mouseup', 'touchstart'].forEach((eventName) => {
      document.addEventListener(eventName, (event) => {
        handleGlobalDismiss(event);
      });
    });

    function isSupportPower(actionKey) {
      return SUPPORT_POWERS.has(normalizePowerKey(actionKey));
    }

    function renderPowerButtons(piece) {
      powerControls.innerHTML = '';
      powerControls.hidden = true;
    }

    let selectedTarget = null;
    let pendingAttackInfo = null;
    let latestActionMessage = null;
    let latestPopupContext = null;
    let resolveTurnPopup = null;
    let resolveDeathPopup = null;
    const pendingDeathMessages = [];
    const targetFlashTimeouts = new WeakMap();

    function getPieceSquare(piece) {
      return piece.closest('.square');
    }

    function getSquareAt(row, col) {
      return squaresByCoord.get(`${row},${col}`);
    }

    function isBarrierSquare(square) {
      return Boolean(square?.classList.contains('square--barrier'));
    }

    function areAdjacentSquares(firstSquare, secondSquare) {
      if (!firstSquare || !secondSquare) return false;
      const rowDiff = Math.abs(Number(secondSquare.dataset.row) - Number(firstSquare.dataset.row));
      const colDiff = Math.abs(Number(secondSquare.dataset.col) - Number(firstSquare.dataset.col));
      return rowDiff + colDiff === 1;
    }

    function flashTargetPiece(piece, teamType) {
      if (!piece) return;
      const className = teamType === 'enemy' ? 'target-flash--enemy' : 'target-flash--ally';
      const existing = targetFlashTimeouts.get(piece);
      if (existing) {
        clearTimeout(existing);
      }
      piece.classList.remove('target-flash--enemy', 'target-flash--ally');
      piece.classList.add(className);
      const timeoutId = setTimeout(() => {
        piece.classList.remove(className);
        targetFlashTimeouts.delete(piece);
      }, 250);
      targetFlashTimeouts.set(piece, timeoutId);
    }

    function clearBarrierPreview() {
      barrierPreviewSquares.forEach((square) => square.classList.remove('square--barrier-preview'));
      barrierPreviewSquares = [];
    }

    function updateBarrierPreview(originSquare) {
      clearBarrierPreview();
      if (!originSquare) return;
      const offsets = [[1, 0], [-1, 0], [0, 1], [0, -1]];
      offsets.forEach(([dr, dc]) => {
        const square = getSquareAt(
          Number(originSquare.dataset.row) + dr,
          Number(originSquare.dataset.col) + dc
        );
        if (!square) return;
        if (square.querySelector('.piece') || isBarrierSquare(square)) return;
        square.classList.add('square--barrier-preview');
        barrierPreviewSquares.push(square);
      });
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
        for (const [dr, dc] of deltas) {
          const nr = Number(square.dataset.row) + dr;
          const nc = Number(square.dataset.col) + dc;
          if (nr < 1 || nr > BOARD_ROWS || nc < 1 || nc > BOARD_COLS) continue;
          const neighbor = getSquareAt(nr, nc);
          if (!neighbor || distances.has(neighbor)) continue;
          if (isBarrierSquare(neighbor)) continue;
          const nextDistance = distance + 1;
          distances.set(neighbor, nextDistance);
          queue.push({ square: neighbor, distance: nextDistance });
        }
      }
      return distances;
    }

function computeReachableSquares(piece) {
    const origin = getPieceSquare(piece);
    if (!origin) return;
    const stats = pieceMap.get(piece);
    
    // 1. Detectar pasivas de movimiento
    const hasFlight = hasPassive(stats, 'volar') || hasPassive(stats, 'vuelo') || hasPassive(stats, 'alado');
    const hasPhasing = hasPassive(stats, 'fase');
    const hasJump = hasPassive(stats, 'saltar/trepar'); 
    const hasSuperStrength = hasPassive(stats, 'superfuerza');

    // 2. Definir reglas de paso
    const canPassBarriers = hasFlight || hasPhasing; 
    const canPassEnemies = hasFlight || hasPhasing || hasJump;
    const canPassObjects = hasFlight || hasPhasing || hasJump || hasSuperStrength;

    const maxMove = remainingMovement(piece);
    const visited = new Map();
    const queue = [{ row: Number(origin.dataset.row), col: Number(origin.dataset.col), cost: 0 }];
    visited.set(`${origin.dataset.row},${origin.dataset.col}`, 0);

    const deltas = [[1, 0], [-1, 0], [0, 1], [0, -1]];

    // Definir límites del tablero usando las variables globales o fallback a DOM
    // Si BOARD_ROWS no está definida, intentamos contar filas del DOM, o defecto 10
    const limitRows = (typeof BOARD_ROWS !== 'undefined') ? BOARD_ROWS : (document.querySelectorAll('.board__row').length || 10);
    const limitCols = (typeof BOARD_COLS !== 'undefined') ? BOARD_COLS : (document.querySelectorAll('.board__row:first-child .square').length || 10);

    // --- FASE 1: CALCULAR CAMINOS (BFS) ---
    while (queue.length) {
        const { row, col, cost } = queue.shift();
        
        for (const [dr, dc] of deltas) {
            const nr = row + dr;
            const nc = col + dc;
            const key = `${nr},${nc}`;
            
            // CORRECCIÓN: Usar los límites reales detectados
            if (nr < 1 || nr > limitRows || nc < 1 || nc > limitCols) continue;
            
            const nextCost = cost + 1;
            if (nextCost > maxMove) continue;
            if (visited.has(key) && visited.get(key) <= nextCost) continue;
            
            const square = getSquareAt(nr, nc);
            if (!square) continue;
            
            // A) BARRERAS
            if (isBarrierSquare(square) && !canPassBarriers) continue;

            const occupant = square.querySelector('.piece');
            const hasObject = square.querySelector('.object-token');
            // B) ENEMIGOS
            if (occupant && occupant.dataset.team !== piece.dataset.team && !canPassEnemies) {
                continue;
            }
            // C) OBJETOS
            if (hasObject && !canPassObjects) continue;
            
            visited.set(key, nextCost);
            queue.push({ row: nr, col: nc, cost: nextCost });
        }
    }

    // --- FASE 2: FILTRAR DESTINOS VÁLIDOS ---
    movementDistances = new Map();
    
    visited.forEach((dist, key) => {
        const square = squaresByCoord.get(key);
        if (!square) return;
        
        const occupied = square.querySelector('.piece');
        const hasObject = square.querySelector('.object-token');
        
        // REGLA 1: No puedes parar encima de nadie
        if (occupied) return;
        
        // REGLA 2: No puedes parar en barrera
        if (isBarrierSquare(square)) return;
        
        // REGLA 3: OBJETOS
        if (hasObject) {
            // Solo superfuerza puede parar aquí
            if (!hasSuperStrength) return;
            // Si ya tienes objeto, no puedes coger otro (no parar)
            if (stats.heldObject) return;
        }

        if (dist > 0) {
            movementDistances.set(square, dist);
        }
    });
}



    function clearMoveHighlights() {
      squares.forEach((square) => square.classList.remove('square--move'));
    }

    // --- 1. LIMPIEZA COMPLETA ---
    function clearRangeHighlights() {
      board.classList.remove('targeting');
      clearBarrierPreview();
      squares.forEach((square) => {
          square.classList.remove('square--range', 'square--target', 'square--range-special');
          
          const piece = square.querySelector('.piece');
          if (piece) {
              // Quitamos TODAS las marcas posibles
              piece.classList.remove('valid-target', 'valid-target-blue', 'valid-ally', 'piece--selected');
          }
      });
    }


function highlightRange(piece) {
      clearRangeHighlights();
      const origin = getPieceSquare(piece);
      if (!origin) return;
      
      const physRange = rangeForPiece(piece);
      board.classList.add('targeting');

      let targetsFound = false;
      let rangeSquaresFound = false;

      squares.forEach((square) => {
        const dist = attackDistance(origin, square);
        if (dist > physRange) return;
        if (isBarrierSquare(square)) return;
        if (dist === 0) return;

        const blockedByLOS = dist > 1 && !hasLineOfSight(origin, square);
        if (blockedByLOS) return;

        square.classList.add('square--range');
        rangeSquaresFound = true;

        const targetPiece = square.querySelector('.piece');
        if (targetPiece && targetPiece.dataset.team !== piece.dataset.team) {
          targetPiece.classList.add('valid-target');
          targetsFound = true;
        }
      });
      
      if (!targetsFound && !rangeSquaresFound) {
          board.classList.remove('targeting');
      }
    }

  

    

    function clearHighlights() {
      clearMoveHighlights();
      clearRangeHighlights();
      tooltip.hidden = true;
      selectedTarget = null;
      pendingBarrierPlacement = null;
    }

    function setActionControlsEnabled(enabled) {
      attackButton.disabled = !enabled;
      powerControls.querySelectorAll('button').forEach((btn) => {
        btn.disabled = !enabled;
      });
    }

    function markActionUsed() {
      if (actionUsedThisTurn) return;
      actionUsedThisTurn = true;
      setActionControlsEnabled(false);
    }

    function registerActionUsage(attacker, { showPopup = false } = {}) {
      markActionUsed();
      clearRangeHighlights();
      clearTargetSelection(true);
      attackButton.classList.remove('button--pulse');
      updateCombatInfo();
      updateStatusBar(attacker);
      finishTurn(attacker, { showPopup });
    }

    function highlightMovement(piece) {
      computeReachableSquares(piece);
      if (movementDistances.size === 0) return;
      movementDistances.forEach((_, square) => {
        square.classList.add('square--move');
      });
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
            if (square && isBarrierSquare(square)) {
              return false;
            }
          }
        }
      }
      return true;
    }

    function isWithinAttackRange(attackerSquare, targetSquare, maxRange, { includeOrigin = false } = {}) {
      const distance = attackDistance(attackerSquare, targetSquare);
      if (distance > maxRange) return false;
      if (!includeOrigin && distance === 0) return false;
      if (distance > 1 && !hasLineOfSight(attackerSquare, targetSquare)) return false;
      return true;
    }

    



    function setActivePiece(piece) {
      document.querySelectorAll('.piece').forEach((p) => p.classList.remove('piece--active'));
      piece.classList.add('piece--active');
      passButton.disabled = false;
      setActionControlsEnabled(true);
      renderLifeCards();
      updateStatusBar(piece);
      updateCombatInfo();
      currentAction = 'attack';
      renderPowerButtons(piece);
    }

    function updateStatusBar(piece) {
      const stats = pieceMap.get(piece);
      if (!stats) return;
      if (turnInfo && movementInfo) {
        turnInfo.textContent = `Turno: ${stats.name}`;
        movementInfo.textContent = `Movimiento restante: ${remainingMovement(piece)}`;
      }
    }

    function attackDistance(attackerSquare, targetSquare) {
      return (
        Math.abs(Number(attackerSquare.dataset.row) - Number(targetSquare.dataset.row)) +
        Math.abs(Number(attackerSquare.dataset.col) - Number(targetSquare.dataset.col))
      );
    }

function effectiveRangeFromStats(stats) {
  const raw = Number(stats?.rango ?? 0);
  return raw === 0 ? 1 : raw;
}

function rangeForAction(attacker) {
  const stats = pieceMap.get(attacker);
  return effectiveRangeFromStats(stats);
}

   function calculateDamage(attackerStats, distance, isCritical) {
      const isMelee = distance <= 1;
      const baseDamage = attackerStats.dano ?? 0;
      const totalDamage = isCritical ? baseDamage * 2 : baseDamage;
      return {
        totalDamage,
        isMelee,
        rawDamage: totalDamage,
      };
    }
    

  function evaluateAttackRoll(attackerStats, defenderStats, roll, distance, options = {}) {
      const { allowCounter = true } = options;
      const effectiveDefense = defenderStats.defensa;
      const attackValue = attackerStats.ataque + roll;
      const success = attackValue >= effectiveDefense;

      const critical = roll >= 10;
      const defenderRange = effectiveRangeFromStats(defenderStats);
      const shouldCounter = allowCounter && roll <= 4 && distance <= defenderRange;
      
      return { success, critical, shouldCounter };
    }
    

    function isCriticalRoll(roll) {
      return roll >= 10;
    }

    function queueDeathMessage(message) {
      pendingDeathMessages.push(message);
    }

    async function showQueuedDeathPopups() {
      while (pendingDeathMessages.length > 0) {
        const message = pendingDeathMessages.shift();
        // eslint-disable-next-line no-await-in-loop
        await showDeathPopup(message);
      }
    }

    function eliminatePiece(piece) {
      if (!piece || piece.dataset.eliminated === 'true') return;
      playEffectSound(deathSound);
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

    // Variable global para controlar el tiempo (ponla justo antes de las funciones)
let tooltipTimer = null;

function showTooltip(target, isDraft = false) {
  let stats;

  if (isDraft) {
      const key = target.dataset.key;
      const raw = pieceStats[key];
      if (!raw) return;
      stats = {
          ...raw,
          name: raw.nombre || raw.name,
          currentVida: raw.vida,
          maxVida: raw.vida,
          baseAtaque: raw.ataque,
          baseDefensa: raw.defensa,
          baseAgilidad: raw.agilidad,
          poderes: resolvePowerSets(raw)
      };
  } else {
      stats = pieceMap.get(target);
  }

  if (!stats) return;

  let teamLabel = target.dataset.team || '';
  if (teamLabel) {
      teamLabel = teamLabel.charAt(0).toUpperCase() + teamLabel.slice(1);
      teamLabel = `(${teamLabel})`;
  } else if (isDraft) {
      teamLabel = ""; 
  }

  let listaBuffos = [];
  if (stats.statBuffs) Object.values(stats.statBuffs).forEach(v => listaBuffos.push(v.label));
  if (stats.critBuff) listaBuffos.push(stats.critBuff.label);
  if (stats.probabilidadTurns > 0) listaBuffos.push("Probabilidad");
  const buffosTexto = listaBuffos.join(', ');

  // --- CAMBIO: Eliminada la parte <small>(...)</small> de las stats ---
  tooltip.innerHTML = `
    <h3>${stats.name} <span style="font-size:0.8em; opacity:0.7">${teamLabel}</span></h3>
    
    <ul>
      <li><strong>Vida:</strong> ${Math.max(stats.currentVida, 0)} / ${stats.maxVida}</li>
      <li><strong>Movimiento:</strong> ${stats.movimiento}</li>
      <li><strong>Ataque:</strong> ${stats.ataque}</li>
      <li><strong>Defensa:</strong> ${stats.defensa}</li>
      <li><strong>Agilidad:</strong> ${stats.agilidad}</li>
      <li><strong>Daño:</strong> ${stats.dano}</li>
      <li><strong>Rango:</strong> ${stats.rango}</li>
    </ul>

    ${buffosTexto ? `<h4 style="color:#4ade80">Buffos Temporales</h4><div style="font-size:0.8rem; margin-left:10px;">${buffosTexto}</div>` : ''}
  `;

  tooltip.hidden = false;
  requestAnimationFrame(() => positionTooltip(target));
}


function hideTooltip() {
  tooltip.hidden = true;
  if (tooltipTimer) {
    clearTimeout(tooltipTimer);
    tooltipTimer = null;
  }
}

function attachTooltipEvents(piece) {
  // Usamos pointerenter/leave que funcionan mejor para ratón y touch
  piece.addEventListener('pointerenter', () => {
    // Si es la pieza activa o del mismo equipo, normalmente no mostramos info
    // PERO como es para debug, lo mostramos igual. Si quieres ocultarlo en turno propio, descomenta abajo:
    /* const activePiece = turnOrder[turnIndex];
    if (piece === activePiece) return; 
    */
    
    // Limpiamos cualquier timer anterior
    if (tooltipTimer) clearTimeout(tooltipTimer);

    // Esperamos 1 segundo (1000ms) antes de mostrar
    tooltipTimer = setTimeout(() => {
      showTooltip(piece);
    }, 1000);
  });

  piece.addEventListener('pointerleave', () => {
    hideTooltip();
  });
  
  // Ocultar también al hacer clic para que no moleste al atacar
  piece.addEventListener('click', () => {
    hideTooltip();
  });
}

    function positionTooltip(target) {
      const targetRect = target.getBoundingClientRect();
      const tooltipRect = tooltip.getBoundingClientRect();
      const offset = 12;
      const padding = 8;
      let left = targetRect.right + offset;
      let top = targetRect.top + targetRect.height / 2 - tooltipRect.height / 2;

      if (left + tooltipRect.width > window.innerWidth - padding) {
        left = targetRect.left - tooltipRect.width - offset;
      }

      left = Math.max(padding, Math.min(left, window.innerWidth - tooltipRect.width - padding));
      top = Math.max(padding, Math.min(top, window.innerHeight - tooltipRect.height - padding));

      tooltip.style.left = `${left}px`;
      tooltip.style.top = `${top}px`;
    }


    function setIncapacitated(piece, turns = 1) {
      const stats = pieceMap.get(piece);
      if (!stats) return;
      stats.incapacitatedTurns = turns;
      piece.classList.add('piece--incapacitated');
    }

   function actionLabel() {
      return 'Ataque';
    }

    function neededRollToHit(attackerStats, defenderStats) {
      if (!attackerStats || !defenderStats) return 0;
      const needed = defenderStats.defensa - attackerStats.ataque;
      return Math.max(2, needed);
    }

     function buildAttackPopupMessage({
        attackerStats,
        defenderStats,
        roll,
        success,
        damage,
        isMelee,
        critical
      }) {
        const defBase = defenderStats.defensa;
        const needed = Math.max(2, defBase - attackerStats.ataque);
        const rollText = critical ? `${roll} (CRÍTICO)` : `${roll}`;
        const attackType = isMelee ? 'ataque cuerpo a cuerpo' : 'ataque a distancia';
        const sentence1 = `${attackerStats.name} realiza un ${attackType} con ${attackerStats.ataque} de Ataque a ${defenderStats.name} que tiene ${defBase} de Defensa.`;
        const sentence2 = `${attackerStats.name} necesita un ${needed} y consigue un ${rollText}.`;

        if (!success) {
          return `${sentence1} ${sentence2} ${attackerStats.name} falla el ataque contra ${defenderStats.name}.`;
        }

        const damageLabel = damage === 1 ? 'Punto' : 'Puntos';
        let sentence3 = `${attackerStats.name} le causa ${damage} ${damageLabel} de Daño a ${defenderStats.name}.`;
        if (defenderStats.currentVida <= 0) {
          sentence3 += ` ${defenderStats.name} es ELIMINADO.`;
        }
        return `${sentence1} ${sentence2} ${sentence3}`;
    }



    
    function updateCombatInfo() {
      const combatBox = document.getElementById('combatInfo');
      if (!combatBox) return;
      
      if (!pendingAttackInfo) {
        combatBox.textContent = '';
        return;
      }
      const info = pendingAttackInfo;
      if (info.targets) {
        const summary = info.targets
          .map((target) => {
            const base = `${target.name}: ${target.success ? 'Éxito' : 'Fallo'}`;
            const damageText = target.success ? ` | Daño ${target.damage} (Vida ${target.vida})` : '';
            return `${base}${damageText}`;
          })
          .join(' | ');
        combatBox.textContent = `${info.action} de ${info.attackerName} | Tirada 2d6: ${info.roll}${
          info.critical ? ' (Crítico)' : ''
        } | ${summary}`;
        return;
      }
      let rollText = info.roll ? ` | Tirada 2d6: ${info.roll}` : '';
      let successText = '';
      if (info.roll) {
        successText = info.success ? (info.critical ? ' (Crítico)' : ' (Éxito)') : ' (Fallo)';
      }
      const damageText = info.roll ? ` | Daño: ${info.damage} | Vida defensor: ${info.defenderVida}` : '';
      const noteText = info.note ? ` | ${info.note}` : '';
      combatBox.textContent = `${info.action} ${info.attackerName} (${info.attacker}) vs ${info.defenderName} (${info.defender}) | Diferencia: ${info.difference}${rollText}${successText}${damageText}${noteText}`;
    }

    function prepareAttackInfo(attacker, defender, actionKey = 'attack') {
      const attackerStats = pieceMap.get(attacker);
      const defenderStats = pieceMap.get(defender);
      pendingAttackInfo = {
        action: actionLabel(actionKey),
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
        clawsRoll: null,
        note: null,
      };
      attackButton.classList.add('button--pulse');
      updateCombatInfo();
    }
    

// --- BLOQUE DE COMBATE OPTIMIZADO ---

async function resolveAttack(attacker, defender, actionKey = 'attack', options = {}) {
      const { 
        allowCounter = true, 
        skipTurnAdvance = false, 
        showPopup = true,
        logHistory = true,
        actionLabelOverride = null, 
        isSecondAttack = false 
      } = options;

      const attackerStats = pieceMap.get(attacker);
      const defenderStats = pieceMap.get(defender);
      
      if (!attackerStats || !defenderStats) return;

      const attackerSquare = getPieceSquare(attacker);
      const targetSquare = getPieceSquare(defender);
      const maxRange = rangeForAction(attacker);
      const distance = attackDistance(attackerSquare, targetSquare);

      // 1. Chequeo de Distancia Máxima
      if (distance > maxRange) {
        const blockedMessage = 'El objetivo está fuera de rango.';
        addHistoryEntry(attacker.dataset.team, blockedMessage, { attacker, defenders: [defender] });
        pendingAttackInfo = null;
        updateCombatInfo();
        if (!skipTurnAdvance) {
          await showTurnPopup(blockedMessage);
          registerActionUsage(attacker, { showPopup: false });
        }
        return;
      }

      // 2. CÁLCULOS
      const die1 = Math.floor(Math.random() * 6) + 1;
      const die2 = Math.floor(Math.random() * 6) + 1;
      const roll = die1 + die2;
      
      const { success, critical, shouldCounter } = evaluateAttackRoll(
        attackerStats, defenderStats, roll, distance, { allowCounter }
      );

      if (critical) playEffectSound(criticoSound);

      const { totalDamage, isMelee } = calculateDamage(attackerStats, distance, critical);
      const needed = Math.max(2, defenderStats.defensa - attackerStats.ataque);
      const damageApplied = success ? totalDamage : 0;

      if (success && damageApplied > 0) {
        defenderStats.currentVida = Math.max(defenderStats.currentVida - damageApplied, 0);
        if (isEnemy(attacker, defender)) addPoints(attacker, damageApplied * SCORE_PER_DAMAGE);
      }

      // 3. PREPARAR MENSAJE

      let popupMessage = buildAttackPopupMessage({
        attackerStats, defenderStats, roll, success, damage: damageApplied,
        isMelee, critical
      });

      if (logHistory) {
        addHistoryEntry(attacker.dataset.team, popupMessage, { attacker, defenders: [defender] });
      }

      // Gestión de Muerte
      if (success && defenderStats.currentVida <= 0) {
        queueDeathMessage(`${defenderStats.name} eliminado por ${attackerStats.name}.`);
        if (isEnemy(attacker, defender)) addPoints(attacker, SCORE_PER_KILL);
        eliminatePiece(defender);
      }

      // Sonido e Interfaz
      const skipFailureSound = false; 
      const isZeroDamageHit = success && damageApplied === 0;
      registerTurnSound({ 
        damageDealt: damageApplied, 
        attackFailed: !success && !skipFailureSound, 
        zeroDamageHit: isZeroDamageHit 
      });
      if (damageApplied > 0 && !pendingPopupSound) pendingPopupSound = 'punch';

      renderLifeCards();
      updateCombatInfo();

      // Flujo de Pifia / Doble Ataque / Fin de Turno
      if (shouldCounter && defenderStats.currentVida > 0 && defender.dataset.eliminated !== 'true') {
        if (showPopup) {
          await showTurnPopup(`${defenderStats.name} prepara su contraataque.\n(Haz clic para resolver la réplica)`);
          await sleep(300);
        }
        await resolveAttack(defender, attacker, 'attack', {
          allowCounter: false,
          skipTurnAdvance: true,
          actionLabelOverride: 'Réplica',
          showPopup,
          logHistory,
        });
        if (!skipTurnAdvance && showPopup) registerActionUsage(attacker, { showPopup: false });
        return { success, damageApplied, roll, needed, effectiveDefense };
      }

      if (!skipTurnAdvance && showPopup) {
        hideTooltip();
        clearRangeHighlights();
        selectedTarget = null;
        attackButton.classList.remove('button--pulse');
        await showTurnPopup(popupMessage);
        registerActionUsage(attacker, { showPopup: false });
      }
      return { success, damageApplied, roll, needed, effectiveDefense: defenderStats.defensa };
    }

async function resolveExplosion(attacker, centerTarget) {
  const attackerStats = pieceMap.get(attacker);
  const centerTargetStats = pieceMap.get(centerTarget);
  const attackerSquare = getPieceSquare(attacker);
  const centerSquare = getPieceSquare(centerTarget);
  
  const die1 = Math.floor(Math.random() * 6) + 1;
  const die2 = Math.floor(Math.random() * 6) + 1;
  const roll = die1 + die2;
  
  let baseDmg = attackerStats.dano ?? 0;
  
  const affectedPieces = [];
  const seenPieces = new Set();
  const CROSS_OFFSETS = [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]];

  CROSS_OFFSETS.forEach(([dr, dc]) => {
    const row = Number(centerSquare.dataset.row) + dr;
    const col = Number(centerSquare.dataset.col) + dc;
    const square = getSquareAt(row, col);
    if (!square) return;
    const piece = square.querySelector('.piece');
    if (!piece || seenPieces.has(piece)) return;
    seenPieces.add(piece);
    affectedPieces.push(piece);
  });

  const targetsDetails = [];

  affectedPieces.forEach((piece) => {
    const tStats = pieceMap.get(piece);
    const dist = attackDistance(attackerSquare, getPieceSquare(piece));
    
    const { success } = evaluateAttackRoll(attackerStats, tStats, roll, dist, { allowCounter: false });

    let dmg = 0;
    if (success) {
       let reduction = 0;
       if (hasPassive(tStats, 'dureza')) reduction = 1;
       if (hasPassive(tStats, 'invulnerable')) reduction = 2;
       
       dmg = Math.max(0, baseDmg - reduction);
       tStats.currentVida = Math.max(0, tStats.currentVida - dmg);
       if (isEnemy(attacker, piece)) addPoints(attacker, dmg * 10);
    }

    if (success && tStats.currentVida <= 0) {
        eliminatePiece(piece);
        if (isEnemy(attacker, piece)) addPoints(attacker, 50);
    }

    // --- CAMBIO: Texto detallado con eliminación ---
    if (success) {
        let detail = `${tStats.name} (daño ${dmg})`;
        if (tStats.currentVida <= 0) detail += ' que es ELIMINADO';
        targetsDetails.push(detail);
    } else {
        targetsDetails.push(`${tStats.name} (esquiva)`);
    }
  });

  const formatter = new Intl.ListFormat('es', { style: 'long', type: 'conjunction' });
  const listaAfectados = targetsDetails.length > 0 ? formatter.format(targetsDetails) : 'Ninguno';

  const msg = `${attackerStats.name} ejecuta una Explosión sobre ${centerTargetStats?.name ?? 'objetivo'}. ${attackerStats.name} tiene ${attackerStats.ataque} de Ataque y consigue en la tirada un ${roll}. ${attackerStats.name} tiene un daño base para Explosión de ${baseDmg}. Afectados: ${listaAfectados}.`;

  // --- CORRECCIÓN: Pasar defenders para que salgan las imágenes ---
  addHistoryEntry(attacker.dataset.team, msg, { attacker, defenders: affectedPieces });
  
  playEffectSound(explosionSound);
  renderLifeCards();
  
  await showTurnPopup(msg);
  registerActionUsage(attacker, { showPopup: false });
}



async function resolvePulse(attacker) {
  const attackerStats = pieceMap.get(attacker);
  const attackerSquare = getPieceSquare(attacker);
  
  const die1 = Math.floor(Math.random() * 6) + 1;
  const die2 = Math.floor(Math.random() * 6) + 1;
  const roll = die1 + die2;
  
  // Daño Base
  let baseRaw = attackerStats.dano ?? 0;
  
  // Recopilar afectados
  const affectedPiecesElements = []; // Para las fotos del popup
  const CROSS_OFFSETS = [[1, 0], [-1, 0], [0, 1], [0, -1]]; 

  CROSS_OFFSETS.forEach(([dr, dc]) => {
    const row = Number(attackerSquare.dataset.row) + dr;
    const col = Number(attackerSquare.dataset.col) + dc;
    const square = getSquareAt(row, col);
    const occupant = square?.querySelector('.piece');
    if (occupant) affectedPiecesElements.push(occupant);
  });

  const targetsDetails = [];
  let totalDamageDealt = 0;
  let anySuccess = false;

  affectedPiecesElements.forEach((piece) => {
    const tStats = pieceMap.get(piece);
    const success = (attackerStats.ataque + roll) >= tStats.defensa;

    let dmg = 0;
    if (success) {
      let reduction = 0;
      if (hasPassive(tStats, 'dureza')) reduction = 1;
      if (hasPassive(tStats, 'invulnerable')) reduction = 2;
      if (hasPassive(tStats, 'invulnerable a a/d')) reduction = Math.max(reduction, 2);

      dmg = Math.max(0, baseRaw - reduction);
      tStats.currentVida = Math.max(0, tStats.currentVida - dmg);
      totalDamageDealt += dmg;
      if (isEnemy(attacker, piece)) addPoints(attacker, dmg * 10);
      anySuccess = true;
    }

    if (success && tStats.currentVida <= 0) {
        eliminatePiece(piece);
        if (isEnemy(attacker, piece)) addPoints(attacker, 50);
    }
    
    // Texto para la lista
    if (success) {
        let detail = `${tStats.name} (daño ${dmg})`;
        if (tStats.currentVida <= 0) detail += ' que es ELIMINADO'; // Coherencia con Explosión
        targetsDetails.push(detail);
    } else {
        targetsDetails.push(`${tStats.name} (esquiva)`);
    }
  });

  // Formato lista con "y" (Intl.ListFormat)
  const formatter = new Intl.ListFormat('es', { style: 'long', type: 'conjunction' });
  const listaAfectados = targetsDetails.length > 0 ? formatter.format(targetsDetails) : 'Ninguno';

  const msg = `${attackerStats.name} ejecuta un Pulso sobre sí mismo. ${attackerStats.name} tiene ${attackerStats.ataque} de Ataque y consigue en la tirada un ${roll}. ${attackerStats.name} tiene un daño base para Pulso de ${baseRaw}. Afectados: ${listaAfectados}.`;

  playEffectSound(pulsoSound);
  
  // CORRECCIÓN: Pasar defenders con los elementos HTML para las fotos
  addHistoryEntry(attacker.dataset.team, msg, { attacker, defenders: affectedPiecesElements });
  
  registerTurnSound({ damageDealt: totalDamageDealt, attackFailed: !anySuccess });
  renderLifeCards();
  
  await showTurnPopup(msg);
  registerActionUsage(attacker, { showPopup: false });
}



function placeBarrierBlock(targetSquare, creator) {
      if (!targetSquare || targetSquare.querySelector('.piece') || isBarrierSquare(targetSquare)) return false;
      
      const barrier = document.createElement('div');
      barrier.className = 'barrier';
      targetSquare.classList.add('square--barrier');
      targetSquare.appendChild(barrier);
      playEffectSound(barrierSound);
      
      // REGISTRO: Guardamos quién creó este bloque
      if (creator) {
          activeBarriers.push({ 
              creator: creator, 
              element: barrier, 
              square: targetSquare 
          });
      }
      
      return true;
    }



async function finalizeBarrierPlacement(attacker, created) {
  // 1. PUNTOS
  addPoints(attacker, 10);

  const attackerStats = pieceMap.get(attacker);
  const message = `${attackerStats.name} crea una barrera (${created} bloques).`;
  
  addHistoryEntry(attacker.dataset.team, message, { attacker });
  
  pendingBarrierPlacement = null;
  pendingAttackInfo = null;
  clearBarrierPreview();
  hideTooltip();
  clearRangeHighlights();
  clearTargetSelection(true);
  attackButton.classList.remove('button--pulse');
  updateCombatInfo();
  
  // 2. REFRESCO VISUAL (Importante para ver los puntos)
  renderLifeCards(); 

  registerActionUsage(attacker, { showPopup: false });
}



async function resolveBarrier(attacker, targetSquare) {
      const attackerStats = pieceMap.get(attacker);
      if (!attackerStats || !targetSquare) return;
      
      // CAMBIO: Pasamos 'attacker' como segundo argumento
      if (!placeBarrierBlock(targetSquare, attacker)) {
        if (typeof showTurnPopup === 'function') await showTurnPopup('No se pudo colocar la barrera.');
        return;
      }

      pendingBarrierPlacement = {
        attacker,
        remaining: BARRIER_SEGMENTS - 1,
        lastSquare: targetSquare,
        created: 1,
      };
      clearRangeHighlights();
      clearTargetSelection(true);
      updateBarrierPreview(targetSquare);
      attackButton.classList.add('button--pulse');
      updateCombatInfo();

      if (pendingBarrierPlacement.remaining <= 0 || barrierPreviewSquares.length === 0) {
        await finalizeBarrierPlacement(attacker, pendingBarrierPlacement.created);
      }
    }



    function alliedPiecesInRange1(centerSquare, team) {
      if (!centerSquare) return [];

      // Definimos "Adyacentes" como la CRUZ (más el centro)
      const offsets = [
        [0, 0],   // Centro (Objetivo principal)
        [1, 0],   // Abajo
        [-1, 0],  // Arriba
        [0, 1],   // Derecha
        [0, -1],  // Izquierda
      ];

      const allies = [];
      const seenPieces = new Set();

      offsets.forEach(([dr, dc]) => {
        const row = Number(centerSquare.dataset.row) + dr;
        const col = Number(centerSquare.dataset.col) + dc;
        const square = getSquareAt(row, col);
        
        if (square) {
          const occupant = square.querySelector('.piece');
          // Debe haber pieza, no estar repetida y ser del MISMO equipo
          if (occupant && !seenPieces.has(occupant) && occupant.dataset.team === team) {
            seenPieces.add(occupant);
            allies.push(occupant);
          }
        }
      });

      return allies;
    }

    function applyProbabilidad(attacker, target) {
      const attackerStats = pieceMap.get(attacker);
      const targetStats = pieceMap.get(target);
      const centerSquare = getPieceSquare(target);
      if (!attackerStats || !centerSquare) return;

      const affected = alliedPiecesInRange1(centerSquare, attacker.dataset.team).map((piece) => {
        const stats = pieceMap.get(piece);
        if (!stats) return null;
        stats.probabilidadTurns = PROBABILIDAD_DURATION;
        return { piece, stats };
      });

      const validAffected = affected.filter(Boolean);

      const recipientNames = validAffected.map(({ stats }) => stats.name).join(', ');
      if (validAffected.length > 0) {
        addPoints(attacker, validAffected.length * 10);
        renderLifeCards();
      }
      const message = validAffected.length
        ? `${attackerStats.name} aplica Probabilidad sobre ${targetStats?.name ?? 'sí mismo'}: Probabilidad afecta a: ${recipientNames}.`
        : `${attackerStats.name} intenta aplicar Probabilidad sobre ${targetStats?.name ?? 'sí mismo'}, pero nadie se beneficia.`;

      addHistoryEntry(attacker.dataset.team, message, {
        attacker,
        defenders: validAffected.map(({ piece }) => piece),
      });

      pendingAttackInfo = {
        action: actionLabel('probabilidad'),
        attackerName: attackerStats.name,
        roll: '-',
        targets: validAffected.map(({ stats }) => ({
          name: stats.name,
          success: true,
          damage: 0,
          vida: stats.currentVida,
        })),
      };

      hideTooltip();
      clearRangeHighlights();
      clearTargetSelection(true);
      attackButton.classList.remove('button--pulse');
      updateCombatInfo();
      registerActionUsage(attacker, { showPopup: false });
    }

   function applyStatBuff(attacker, target, { stat, label }) {
      const attackerStats = pieceMap.get(attacker);
      const targetStats = pieceMap.get(target);
      const centerSquare = getPieceSquare(target);
      if (!attackerStats || !centerSquare) return;

      const affected = alliedPiecesInRange1(centerSquare, attacker.dataset.team);
      const details = [];

      affected.forEach((piece) => {
        const stats = pieceMap.get(piece);
        if (!stats) return;

        const configMap = {
            'ataque': { baseKey: 'baseAtaque', boost: 1 },
            'defensa': { baseKey: 'baseDefensa', boost: 1 },
            'agilidad': { baseKey: 'baseAgilidad', boost: 10 }
        };
        
        let newValDisplay = '';

        if (stat === 'critico') {
           stats.critBuff = { remaining: 2, label };
           // Para crítico solo listamos el nombre
           details.push(stats.name);
        } else {
           const conf = configMap[stat];
           if (conf) {
               if (stats[conf.baseKey] === undefined) stats[conf.baseKey] = stats[stat];
               stats[stat] = stats[conf.baseKey] + conf.boost;
               stats.statBuffs = stats.statBuffs || {};
               stats.statBuffs[stat] = { remaining: 2, label, baseValue: stats[conf.baseKey] };
               newValDisplay = stats[stat]; 
               
               // Formato: "Firelord (19)"
               details.push(`${stats.name} (${newValDisplay})`);
           }
        }
      });

      if (affected.length > 0) {
          addPoints(attacker, affected.length * 10);
          playEffectSound(curarSound);
      }

      // CORRECCIÓN 1: Formato de lista con "y" al final
      const formatter = new Intl.ListFormat('es', { style: 'long', type: 'conjunction' });
      const lista = details.length > 0 ? formatter.format(details) : '';
      
      const message = affected.length 
        ? `${attackerStats.name} aplica ${label} sobre ${targetStats?.name ?? 'sí mismo'}. ${label} afecta a: ${lista}.`
        : `${attackerStats.name} intenta aplicar ${label} sobre ${targetStats?.name ?? 'sí mismo'}, pero nadie se beneficia.`;

      // CORRECCIÓN 2: Pasamos 'defenders: affected' para que salgan sus fotos
      addHistoryEntry(attacker.dataset.team, message, { 
          attacker, 
          defenders: affected 
      });
      
      renderLifeCards();
      
      showTurnPopup(message).then(() => {
          registerActionUsage(attacker, { showPopup: false });
      });
    }


async function resolveHeal(attacker, target) {
      const attackerStats = pieceMap.get(attacker);
      const targetStats = pieceMap.get(target);
      
      // Cálculo de Daño Infligido (Heridas)
      const wounds = Math.max(targetStats.maxVida - targetStats.currentVida, 0);
      
      if (wounds === 0) {
        const msg = `${attackerStats.name} intenta curar a ${targetStats.name}, pero ya está al máximo de salud.`;
        addHistoryEntry(attacker.dataset.team, msg, { attacker, defenders: [target] });
        await showTurnPopup(msg);
        registerActionUsage(attacker, { showPopup: false });
        return;
      }

      const die1 = Math.floor(Math.random() * 6) + 1;
      const die2 = Math.floor(Math.random() * 6) + 1;
      const roll = die1 + die2;
      
      // Matemática: Ataque + Heridas + Dados vs Defensa
      const totalAttack = attackerStats.ataque + wounds + roll;
      const difficulty = targetStats.defensa;
      
      const success = totalAttack >= difficulty;
      const needed = Math.max(2, difficulty - (attackerStats.ataque + wounds));

      // Frase 1: Introducción y Datos
      const sentence1 = `${attackerStats.name} realiza una tirada de Curar sobre ${targetStats.name}. ${attackerStats.name} tiene ${attackerStats.ataque} de Ataque, ${targetStats.name} tiene ${wounds} puntos de Daño Infligido y una Defensa de ${difficulty}.`;
      
      // Frase 2: Necesidad y Tirada
      const sentence2 = `${attackerStats.name} necesita un ${needed} y consigue un ${roll}.`;

      if (success) {
          const healRoll = Math.floor(Math.random() * 6) + 1;
          const healed = Math.min(healRoll, wounds); // No curar más de lo dañado
          targetStats.currentVida += healed;
          addPoints(attacker, healed * 5);
          playEffectSound(curarSound);
          
          const sentence3 = `${attackerStats.name} lanza el dado de curar y consigue un ${healRoll}.`;
          const sentence4 = `${attackerStats.name} cura ${healed} Puntos de Vida a ${targetStats.name}.`;
          
          const msg = `${sentence1} ${sentence2} ${sentence3} ${sentence4}`;
          
          addHistoryEntry(attacker.dataset.team, msg, { attacker, defenders: [target] });
          renderLifeCards();
          await showTurnPopup(msg);
      } else {
          const msg = `${sentence1} ${sentence2} ${attackerStats.name} falla la curación.`;
          playEffectSound(failureSound);
          addHistoryEntry(attacker.dataset.team, msg, { attacker, defenders: [target] });
          await showTurnPopup(msg);
      }

      registerActionUsage(attacker, { showPopup: false });
}

   

    function clearTargetSelection(preserveAttack = false) {
      // Quitamos la clase visual potente de la pieza seleccionada anteriormente
      if (selectedTarget) {
          selectedTarget.classList.remove('piece--selected');
      }
      
      squares.forEach((square) => square.classList.remove('square--target'));
      selectedTarget = null;
      clearBarrierPreview();
      
      if (!preserveAttack) {
        pendingAttackInfo = null;
      }
      attackButton.classList.remove('button--pulse');
      hideTooltip();
      updateCombatInfo();
      if (turnOrder.length > 0) {
        highlightRange(turnOrder[turnIndex]);
      }
    }

   
    board.addEventListener('click', async (event) => {
      if (turnOrder.length === 0) return;
      const square = event.target.closest('.square');
      if (!square) return;

      const activePiece = turnOrder[turnIndex];
      if (isCPUControlledPiece(activePiece)) return;

      const targetPiece = square.querySelector('.piece');

      if (targetPiece) {
        const isOrange = square.classList.contains('square--range');
        if (!isOrange) {
          clearTargetSelection();
          return;
        }

        clearTargetSelection();
        square.classList.add('square--target');
        targetPiece.classList.add('piece--selected');
        selectedTarget = targetPiece;

        const attackerStats = pieceMap.get(activePiece);
        const targetStats = pieceMap.get(targetPiece);
        pendingAttackInfo = {
          action: actionLabel(currentAction),
          attackerName: attackerStats?.name,
          defenderName: targetStats?.name,
          note: 'Objetivo seleccionado',
        };
        updateCombatInfo();
        attackButton.classList.add('button--pulse');
        return;
      }

      // --- MOVIMIENTO ---
      if (square.classList.contains('square--move')) {
          if (actionUsedThisTurn) return;
          if (square.querySelector('.piece')) return;
          const distance = movementDistances.get(square);
          if (distance !== undefined && distance <= remainingMovement(activePiece)) {
              await animatePieceToSquare(activePiece, square);
              spendMovement(activePiece, distance);
              
              const objectEl = square.querySelector('.object-token');
              const stats = pieceMap.get(activePiece);
              if (objectEl && hasPassive(stats, 'superfuerza') && !stats.heldObject) {
                  playEffectSound(objectSound);
                  const type = objectEl.dataset.type;
                  const objName = objectEl.dataset.name;
                  if (stats.originalDano === undefined) stats.originalDano = stats.dano;
                  if (stats.originalRango === undefined) stats.originalRango = stats.rango;
                  stats.heldObject = { type: type, name: objName };
                  if (type === 'light') { stats.dano = stats.originalDano + 1; stats.rango = 3; } 
                  else { stats.dano = stats.originalDano + 2; stats.rango = 2; }
                  activePiece.dataset.rango = stats.rango;
                  activePiece.classList.add('piece--holding');
                  objectEl.remove();
              }

              clearHighlights();
              highlightMovement(activePiece);
              highlightRange(activePiece);
              updateStatusBar(activePiece);
              if (actionUsedThisTurn && remainingMovement(activePiece) <= 0) {
                  finishTurn(activePiece, { showPopup: false });
              }
          }
          return;
      }
    });

function handleActionClick(actionKey, options = {}) {
  if (actionUsedThisTurn) {
    return;
  }
  if (actionKey !== 'attack') {
    return;
  }
  currentAction = 'attack';
}



    function sleep(ms) {
      return new Promise((resolve) => setTimeout(resolve, ms));
    }

    function animatePieceToSquare(piece, square, options = {}) {
      return new Promise((resolve) => {
        const duration = Number(options.duration ?? movementAnimationDuration);
        if (!piece || !square) {
          resolve();
          return;
        }

        if (!Number.isFinite(duration) || duration <= 0) {
          square.appendChild(piece);
          resolve();
          return;
        }

        const startRect = piece.getBoundingClientRect();
        square.appendChild(piece);
        const endRect = piece.getBoundingClientRect();
        const deltaX = startRect.left - endRect.left;
        const deltaY = startRect.top - endRect.top;
        const baseTransform = 'translate(-50%, -50%)';
        const startTransform = `${baseTransform} translate(${deltaX}px, ${deltaY}px)`;
        const endTransform = baseTransform;

        const animation = piece.animate(
          [
            { transform: startTransform },
            { transform: endTransform },
          ],
          {
            duration,
            easing: 'ease-in-out',
          },
        );

        animation.addEventListener('finish', resolve);
        animation.addEventListener('cancel', resolve);
      });
    }

   

    
   

    function applyRegeneration(piece) {
      const stats = pieceMap.get(piece);
      if (!stats || !hasPassive(stats, 'regeneracion')) return { regenerated: false, message: '' };
      if (stats.currentVida < stats.maxVida) {
        stats.currentVida = Math.min(stats.currentVida + 1, stats.maxVida);
        renderLifeCards();
        const message = `${stats.name} regenera 1 punto de vida (vida ${stats.currentVida}).`;
        const shouldAttachContext = !latestPopupContext;
        addHistoryEntry(piece.dataset.team, message, {
          preserveLatest: true,
          attacker: shouldAttachContext ? piece : null,
        });
        return { regenerated: true, message };
      }
      return { regenerated: false, message: '' };
    }

    function consumeProbabilidadTurn(piece) {
      const stats = pieceMap.get(piece);
      if (!stats || !stats.probabilidadTurns) return { expired: false, message: '' };
      stats.probabilidadTurns = Math.max(stats.probabilidadTurns - 1, 0);
      if (stats.probabilidadTurns === 0) {
        return { expired: true, message: `${stats.name} pierde Probabilidad.` };
      }
      return { expired: false, message: '' };
    }

    function consumeStatBuffs(piece) {
      const stats = pieceMap.get(piece);
      if (!stats) return [];
      const messages = [];
      if (stats.statBuffs) {
        Object.entries(stats.statBuffs).forEach(([stat, buff]) => {
          buff.remaining -= 1;
          if (buff.remaining <= 0) {
            const baseKey = stat === 'ataque' ? 'baseAtaque' : stat === 'defensa' ? 'baseDefensa' : 'baseAgilidad';
            stats[stat] = stats[baseKey] ?? stats[stat];
            // CAMBIO: Usamos buff.label directamente para mantener mayúsculas
            const label = buff.label || stat; 
            messages.push(`${stats.name} pierde ${label}.`);
            delete stats.statBuffs[stat];
          }
        });
      }
      if (stats.critBuff) {
        stats.critBuff.remaining -= 1;
        if (stats.critBuff.remaining <= 0) {
          // CAMBIO: Usamos label directamente
          const label = stats.critBuff.label || 'Mejora de Crítico';
          messages.push(`${stats.name} pierde ${label}.`);
          delete stats.critBuff;
        }
      }
      return messages;
    }



    function advanceTurn() {
      if (turnOrder.length === 0) return;
      turnIndex = (turnIndex + 1) % turnOrder.length;
      const nextPiece = turnOrder[turnIndex];
      const delay = TURN_DELAY_MS;
      setTimeout(() => startTurn(nextPiece), delay);
    }

    async function finishTurn(piece, options = {}) {
      const { summaryOverride = null, showPopup = null } = options;
      
      const stats = pieceMap.get(piece);
      const summary = summaryOverride || latestActionMessage || (stats ? `${stats.name} finaliza su turno.` : 'Turno completado.');
      latestActionMessage = null;

      if (latestPopupContext) {
        latestPopupContext.message = summary;
      }

      const shouldShowPopup = showPopup ?? Boolean(latestPopupContext);
      if (shouldShowPopup) {
        await showTurnPopup(summary);
      } else {
        latestPopupContext = null;
      }

      if (pendingDeathMessages.length > 0) {
        await showQueuedDeathPopups();
      }

      const shouldPause = typeof isCPUControlledPiece === 'function' && isCPUControlledPiece(piece);
      if (shouldPause) {
        await sleep(ENEMY_ACTION_DELAY_MS);
      }

      advanceTurn();
    }

function startTurn(piece) {
      if (!piece) return;
      if (!turnPopup.hidden || !deathPopup.hidden) {
        setTimeout(() => startTurn(piece), 200);
        return;
      }
      const stats = pieceMap.get(piece);
      if (!stats) return;

      // Configuración Estándar
      resetMovement(piece);
      actionUsedThisTurn = false;
      setActivePiece(piece); 
      clearTargetSelection(true);
      clearHighlights();
      highlightMovement(piece);
      highlightRange(piece);

      // Bloqueo para IA
      if (isCPUControlledPiece(piece)) {
        passButton.disabled = true;
        attackButton.disabled = true;
        setTimeout(() => performEnemyTurn(piece), AI_DELAY_MS);
      }
    }


    function ownerLabel(playerId) {
      if (playerId === 'player1') return 'Jugador 1';
      if (isAIVsAI) {
        return playerId === 'player1' ? 'IA 1' : 'IA 2';
      }
      return isPlayerVsAI ? 'IA' : 'Jugador 2';
    }

    function generateDraftOrder(startingPlayer) {
      const other = startingPlayer === 'player1' ? 'player2' : 'player1';
      const order = [startingPlayer];
      let current = other;
      let streak = 0;
      while (order.length < 24) {
        order.push(current);
        streak += 1;
        if (streak === 2) {
          current = current === 'player1' ? 'player2' : 'player1';
          streak = 0;
        }
      }
      return order;
    }

    function availablePool() {
      return availableCharacters.filter((key) => !selections.player1.includes(key) && !selections.player2.includes(key));
    }

    function canFinalizeDraft() {
      return selections.player1.length > 0 && selections.player2.length > 0;
    }

    function updateDraftFinalizeButton() {
      if (!draftFinalizeButton) return;
      draftFinalizeButton.disabled = !canFinalizeDraft();
    }

    function isTeamLocked(playerId) {
      return draftFinalized[playerId] || selections[playerId].length >= 12;
    }

    function advanceDraftIndex() {
      while (draftIndex < draftOrder.length) {
        const pickerId = draftOrder[draftIndex];
        if (!pickerId) {
          draftIndex += 1;
          continue;
        }
        if (isTeamLocked(pickerId)) {
          draftIndex += 1;
          continue;
        }
        break;
      }
    }

    function renderDraftCards() {
      draftGrid.innerHTML = '';
      const ownership = new Map();
      Object.entries(selections).forEach(([playerId, picks]) => {
        picks.forEach((key) => ownership.set(key, playerId));
      });

      const scoredCharacters = availableCharacters.map((key) => {
        const stats = pieceStats[key] || {};
        const score = evaluateCombatValue(key, stats, []);
        return { key, score, stats };
      });
      scoredCharacters.sort((a, b) => b.score - a.score);

      scoredCharacters.forEach(({ key, score, stats }) => {
        const card = document.createElement('button');
        card.type = 'button';
        card.className = 'draft-card';
        // --- IMPORTANTE: Guardamos la clave para que el tooltip sepa qué buscar ---
        card.dataset.key = key; 
        
        card.innerHTML = `
          <span class="combat-score">${score}</span>
          <img class="draft-card__image" src="${stats?.imagen || ''}" alt="${stats?.name || key}" loading="lazy" />
          <div class="draft-card__body">
            <p class="draft-card__title">${stats?.name || key}</p>
          </div>
        `;

        // --- NUEVOS EVENTOS PARA EL TOOLTIP EN DRAFT ---
        // Al pasar el ratón por encima
        card.addEventListener('pointerenter', () => {
             // Llamamos a showTooltip indicando true (esDraft)
             showTooltip(card, true); 
        });
        
        // Al quitar el ratón
        card.addEventListener('pointerleave', () => {
             hideTooltip();
        });
        // -----------------------------------------------

        if (ownership.has(key)) {
          card.classList.add('draft-card--taken');
          card.dataset.owner = ownerLabel(ownership.get(key));
          card.disabled = true;
        } else {
          card.addEventListener('click', () => {
             // Al hacer clic también ocultamos el tooltip para que no moleste
             hideTooltip(); 
             handleDraftPick(key);
          });
        }

        draftGrid.appendChild(card);
      });

      updateDraftFinalizeButton();
    }

    function updateDraftLabels() {
      advanceDraftIndex();
      if (draftIndex >= draftOrder.length) {
        finalizeDraft();
        return;
      }

      const pickerId = draftOrder[draftIndex];
      draftPicker.textContent = `Elige: ${ownerLabel(pickerId)}`;
      draftTurn.textContent = `Turno ${draftIndex + 1} de ${draftOrder.length}`;
      draftCounter.textContent = `Jugador 1: ${selections.player1.length}/12 · ${ownerLabel('player2')}: ${selections.player2.length}/12`;
      draftSubtitle.textContent = `Empieza ${ownerLabel(firstPicker)}. Los turnos alternan ${firstPicker === 'player1' ? '1, 2, 2, 1...' : '2, 1, 1, 2...'} hasta llegar a 12 por bando.`;
      const remaining = 12 - selections[pickerId].length;
      draftPrompt.textContent = `${ownerLabel(pickerId)} selecciona (${remaining} plazas restantes en su equipo).`;
      draftInfo.textContent = 'Los personajes elegidos no se pueden repetir. Tras la última elección comenzará la partida.';
      updateDraftFinalizeButton();
    }

    function draftIsComplete() {
      const teamsFull = selections.player1.length === 12 && selections.player2.length === 12;
      const teamsFinalized = draftFinalized.player1 && draftFinalized.player2;
      const outOfTurns = draftIndex >= draftOrder.length;
      return teamsFull || teamsFinalized || outOfTurns;
    }

    function handleDraftPick(key) {
      if (!draftActive) return;
      advanceDraftIndex();
      if (draftIndex >= draftOrder.length) {
        finalizeDraft();
        return;
      }

      const pickerId = draftOrder[draftIndex];
      if (!pickerId) return;
      if (!availablePool().includes(key)) return;
      if (isTeamLocked(pickerId)) return;

      selections[pickerId].push(key);
      draftIndex = Math.min(draftIndex + 1, draftOrder.length);
      renderDraftCards();
      updateDraftFinalizeButton();

      if (selections.player1.length === 12 && selections.player2.length === 12) {
        finalizeDraft();
        return;
      }

      if (draftIsComplete()) {
        finalizeDraft();
        return;
      }

      updateDraftLabels();

      const nextPicker = draftOrder[draftIndex];
      if (shouldAIPick(nextPicker)) {
        setTimeout(performAIPick, 600);
      }
    }

    

    function buildPositionsFromSelections() {
      const FRONT_ROWS = [5, 6];
      const MID_ROWS = [4, 5, 6, 7];
      const BACK_ROWS = [3, 4, 5, 6, 7, 8];

      const allyColumns = { front: 3, mid: 2, back: 1 };
      const enemyColumns = {
        front: BOARD_COLS - 2,
        mid: BOARD_COLS - 1,
        back: BOARD_COLS,
      };

      const buildPyramidSlots = (count, palette, columns) => {
        const slots = [];
        let colorIndex = 0;
        const pushSlot = (row, col) => {
          const className = palette[colorIndex % palette.length];
          slots.push({ row, col, className });
          colorIndex += 1;
        };

        for (let i = 0; i < count; i += 1) {
          if (i < 2) {
            const row = FRONT_ROWS[i % FRONT_ROWS.length];
            pushSlot(row, columns.front);
          } else if (i < 6) {
            const row = MID_ROWS[(i - 2) % MID_ROWS.length];
            pushSlot(row, columns.mid);
          } else {
            const row = BACK_ROWS[(i - 6) % BACK_ROWS.length];
            pushSlot(row, columns.back);
          }
        }

        return slots;
      };

      const allySlots = buildPyramidSlots(selections.player1.length, ALLY_COLORS, allyColumns);
      const enemySlots = buildPyramidSlots(selections.player2.length, ENEMY_COLORS, enemyColumns);

      const positions = [];
      selections.player1.forEach((key, idx) => {
        const slot = allySlots[idx];
        if (slot) {
          positions.push({ ...slot, key, team: 'aliado' });
        }
      });
      selections.player2.forEach((key, idx) => {
        const slot = enemySlots[idx];
        if (slot) {
          positions.push({ ...slot, key, team: 'enemigo' });
        }
      });
      return positions;
    }

    function finalizeDraft() {
      draftActive = false;
      initialPositions = buildPositionsFromSelections();
      rebuildGameState();
      draftScreen.hidden = true;
      draftScreen.style.display = 'none';
      draftScreen.style.opacity = '0';
      draftScreen.style.visibility = 'hidden';
      startGame();
    }

    function showDraftScreen() {
      hideStartScreen();
      draftScreen.hidden = false;
      draftScreen.style.display = 'grid';
      draftScreen.style.opacity = '1';
      draftScreen.style.visibility = 'visible';
    }

    function beginDraft(mode) {
      // 1. CORRECCIÓN: Asignamos el modo correctamente
      isPlayerVsAI = (mode === 'ai');
      isAIVsAI = (mode === 'aivai');
      if (mode === 'ai') {
        playerControl.player1 = 'manual';
        playerControl.player2 = 'auto';
      } else if (mode === 'aivai') {
        playerControl.player1 = 'auto';
        playerControl.player2 = 'auto';
      } else {
        playerControl.player1 = 'manual';
        playerControl.player2 = 'manual';
      }
      updateControlToggles();

      selections.player1 = [];
      selections.player2 = [];
      draftFinalized.player1 = false;
      draftFinalized.player2 = false;
      availableCharacters = Object.keys(pieceStats);
      
      firstPicker = Math.random() < 0.5 ? 'player1' : 'player2';
      draftOrder = generateDraftOrder(firstPicker);
      draftIndex = 0;
      draftActive = true;
      
      showDraftScreen();
      updateDraftLabels();
      renderDraftCards();

      // 2. CORRECCIÓN: Si la IA empieza eligiendo, hay que avisarla
      const currentPicker = draftOrder[draftIndex];
      if (shouldAIPick(currentPicker)) {
        setTimeout(performAIPick, 600);
      }
    }

function startGame() {
      if (gameStarted) return;
      
      introMusic.pause();        
      introMusic.currentTime = 0; 

      gameStarted = true;
      hideStartScreen();
      draftScreen.hidden = true;
      gameContainer.hidden = false;
      
      // --- NUEVO: Colocamos los objetos al iniciar ---
      placeGameObjects(); 
      // -----------------------------------------------

      startBackgroundMusic();
      updateControlToggles();
      
      if (turnOrder.length > 0) {
        highlightRange(turnOrder[turnIndex]);
        startTurn(turnOrder[turnIndex]);
      }
    }



    function initGame(selectedMode) {
      if (draftActive || gameStarted) return;
      gameState.mode = selectedMode;
      hideStartScreen();
      showDraftScreen();
      if (typeof beginDraft === 'function') {
        beginDraft(selectedMode);
      } else {
        console.log('Iniciando Draft en modo:', selectedMode);
      }
    }

    function handleModeSelection(mode) {
      initGame(mode);
    }

    function prepareDefaultSelections() {
      const characters = Object.keys(pieceStats);
      if (characters.length === 0) return false;

      const midpoint = Math.ceil(characters.length / 2);
      selections.player1 = characters.slice(0, midpoint);
      selections.player2 = characters.slice(midpoint);

      initialPositions = buildPositionsFromSelections();
      return initialPositions.length > 0;
    }

    function startTelekinesisPlacement(attacker, victim) {
      pendingTelekinesis = { attacker, victim };
      
      const isObject = victim.classList.contains('object-token');
      const victimName = isObject ? victim.dataset.name : pieceMap.get(victim).name;

      clearHighlights();
      clearTargetSelection(true); 
      
      const origin = getPieceSquare(attacker);
      const physRange = rangeForPiece(attacker);
      const tkRange = Math.max(physRange, 3);
      
      let validMoves = 0;
      let validTargets = 0;

      squares.forEach(square => {
         const dist = attackDistance(origin, square);
         if (dist > tkRange) return;

         const occupant = square.querySelector('.piece');
         
         // 1. CASILLAS AZULES (Para soltar/mover)
         // Válido si está vacío O si es la casilla donde ya está la víctima
         if ((!occupant && !square.querySelector('.object-token')) || occupant === victim || square.querySelector('.object-token') === victim) {
             square.classList.add('square--placement');
             validMoves++;
         }

         // 2. CASILLAS ROJAS (Para lanzar contra enemigo)
         if (occupant && occupant.dataset.team !== attacker.dataset.team) {
             // Chequeo extra: Linea de visión para lanzar
             if (hasLineOfSight(origin, square)) {
                 occupant.classList.add('valid-target'); // Borde rojo
                 validTargets++;
             }
         }
      });

      const combatBox = document.getElementById('combatInfo');
      if (combatBox) {
          let instruction = `Moviendo a ${victimName}. Selecciona casilla AZUL para dejarlo.`;
          instruction += ` O selecciona un ENEMIGO para lanzarlo.`;
          combatBox.textContent = instruction;
          combatBox.style.display = 'block';
      }
      
      if (typeof showTurnPopup === 'function' && validMoves === 0 && validTargets === 0) {
          showTurnPopup("No hay destinos válidos para Telekinesis.");
          cancelTelekinesis();
      }
    }

    async function resolveObjectThrow(attacker, objectElement, targetPiece) {
      const attackerStats = pieceMap.get(attacker);
      const targetStats = pieceMap.get(targetPiece);
      const objectType = objectElement.dataset.type; // 'heavy' o 'light'
      const objectName = objectElement.dataset.name;

      // Daño fijo según tipo
      const damage = objectType === 'heavy' ? 3 : 2;

      const attackerSquare = getPieceSquare(attacker);
      const targetSquare = getPieceSquare(targetPiece);
      const distance = attackDistance(attackerSquare, targetSquare);
      const defenseBonus = distance > 1 && hasPassive(targetStats, 'defensa a/d') ? 2 : 0;
      const effectiveDefense = targetStats.defensa + defenseBonus;

      const die1 = Math.floor(Math.random() * 6) + 1;
      const die2 = Math.floor(Math.random() * 6) + 1;
      const roll = die1 + die2;
      const attackValue = attackerStats.ataque + roll;
      const success = attackValue >= effectiveDefense;
      const needed = Math.max(2, effectiveDefense - attackerStats.ataque);

      // Reducción por dureza/invulnerable
      let resistance = 0;
      if (hasPassive(targetStats, 'dureza')) resistance = 1;
      if (hasPassive(targetStats, 'invulnerable')) resistance = 2;

      const appliedDamage = success ? Math.max(0, damage - resistance) : 0;

      // Animación visual (Simple: movemos el objeto encima del enemigo)
      await animatePieceToSquare(objectElement, targetSquare, { duration: 600 });

      if (success) {
        playEffectSound(punchSound);
        targetStats.currentVida = Math.max(0, targetStats.currentVida - appliedDamage);
        if (isEnemy(attacker, targetPiece)) {
          addPoints(attacker, appliedDamage * SCORE_PER_DAMAGE);
        }
      } else {
        playEffectSound(failureSound);
      }

      const sentence2 = `${attackerStats.name} realiza un ataque telekinético de objeto (${objectName}) con ${attackerStats.ataque} de Ataque a ${targetStats.name} que tiene ${effectiveDefense} de Defensa. ${attackerStats.name} necesito un ${needed} y consigue un ${roll}.`;
      const damageLabel = appliedDamage === 1 ? 'punto' : 'puntos';
      const sentence3 = `El Daño del objeto es ${damage} y la Resistencia de ${targetStats.name} es ${resistance}. ${attackerStats.name} le causa ${appliedDamage} ${damageLabel} de Daño Infligido a ${targetStats.name}.`;
      const failureMessage = `${attackerStats.name} realiza un ataque telekinético de objeto (${objectName}) con ${attackerStats.ataque} de Ataque a ${targetStats.name} que tiene ${effectiveDefense} de Defensa. ${attackerStats.name} necesita un ${needed} y consigue un ${roll}. ${attackerStats.name} falla el ataque contra ${targetStats.name}.`;
      const msg = success ? `${sentence2} ${sentence3}` : failureMessage;

      addHistoryEntry(attacker.dataset.team, msg, { attacker, defenders: [targetPiece] });

      objectElement.remove();

      if (success && targetStats.currentVida <= 0) {
        queueDeathMessage(`${targetStats.name} eliminado por impacto de objeto.`);
        if (isEnemy(attacker, targetPiece)) addPoints(attacker, SCORE_PER_KILL);
        eliminatePiece(targetPiece);
      }

      renderLifeCards();
      cancelTelekinesis();

      await showTurnPopup(msg);
      registerActionUsage(attacker, { showPopup: false });
    }

    async function resolveTelekinesisThrow(attacker, victim, targetPiece) {
      const attackerStats = pieceMap.get(attacker);
      const victimStats = pieceMap.get(victim);
      const targetStats = pieceMap.get(targetPiece);
      if (!attackerStats || !victimStats || !targetStats) return;

      const isAllyThrow = victim.dataset.team === attacker.dataset.team;
      const targetSquare = getPieceSquare(targetPiece);

      if (isAllyThrow) {
        await animatePieceToSquare(victim, targetSquare, { duration: 600 });
        playEffectSound(telekinesisSound);

        const originalAtaque = victimStats.ataque;
        const originalDano = victimStats.dano;
        victimStats.ataque = originalAtaque + 2;
        victimStats.dano = (originalDano ?? 0) + 1;
        victimStats.telekinesisBoost = {
          baseAtaque: originalAtaque,
          ataqueBonus: 2,
          baseDano: originalDano ?? 0,
          danoBonus: 1,
        };
        victimStats.telekinesisCasterName = attackerStats.name;
        const boostedAtaque = victimStats.ataque;

        let attackSummary = null;
        try {
          attackSummary = await resolveAttack(victim, targetPiece, 'telekinesis-ally-throw', {
            skipTurnAdvance: true,
            showPopup: false,
            logHistory: false,
          });
        } finally {
          victimStats.ataque = originalAtaque;
          victimStats.dano = originalDano;
          delete victimStats.telekinesisBoost;
          delete victimStats.telekinesisCasterName;
        }

        const targetAlive = targetPiece.isConnected && targetPiece.dataset.eliminated !== 'true';
        let landingSquare = null;

        if (!targetAlive) {
          landingSquare = targetSquare;
        } else {
          const limitRows = (typeof BOARD_ROWS !== 'undefined') ? BOARD_ROWS : (document.querySelectorAll('.board__row').length || 10);
          const limitCols = (typeof BOARD_COLS !== 'undefined') ? BOARD_COLS : (document.querySelectorAll('.board__row:first-child .square').length || 10);
          const startRow = Number(targetSquare.dataset.row);
          const startCol = Number(targetSquare.dataset.col);
          const queue = [{ row: startRow, col: startCol }];
          const visited = new Set([`${startRow},${startCol}`]);
          const deltas = [[1, 0], [-1, 0], [0, 1], [0, -1]];

          while (queue.length && !landingSquare) {
            const { row, col } = queue.shift();
            for (const [dr, dc] of deltas) {
              const nr = row + dr;
              const nc = col + dc;
              if (nr < 1 || nr > limitRows || nc < 1 || nc > limitCols) continue;
              const key = `${nr},${nc}`;
              if (visited.has(key)) continue;
              visited.add(key);
              const square = getSquareAt(nr, nc);
              if (!square) continue;
              if (isBarrierSquare(square)) continue;
              if (square.querySelector('.object-token')) continue;
              if (square.querySelector('.piece')) {
                queue.push({ row: nr, col: nc });
                continue;
              }
              landingSquare = square;
              break;
            }
          }
        }

        if (!landingSquare) {
          const msg = `No hay una casilla libre cerca de ${targetStats.name} para aterrizar a ${victimStats.name}.`;
          addHistoryEntry(attacker.dataset.team, msg, { attacker, defenders: [targetPiece] });
          await showTurnPopup(msg);
          cancelTelekinesis();
          registerActionUsage(attacker, { showPopup: false });
          return;
        }

        if (landingSquare !== targetSquare) {
          await animatePieceToSquare(victim, landingSquare, { duration: 600 });
        }

        const attackNeeded = attackSummary?.needed ?? Math.max(2, targetStats.defensa - boostedAtaque);
        const attackRoll = attackSummary?.roll ?? 0;
        const attackSuccess = attackSummary?.success ?? false;
        const attackDamage = attackSummary?.damageApplied ?? 0;
        const defenseValue = attackSummary?.effectiveDefense ?? targetStats.defensa;
        const damageLabel = attackDamage === 1 ? 'punto' : 'puntos';

        const header = `${attackerStats.name} realiza un lanzamiento telekinético de aliado. Lanza a ${victimStats.name} contra ${targetStats.name}.`;
        const impactData = `${victimStats.name} tiene ${boostedAtaque} de Ataque y ${targetStats.name} tiene ${defenseValue} de Defensa.`;
        const rollText = `${victimStats.name} necesita un ${attackNeeded} y consigue un ${attackRoll}.`;
        const resultText = attackSuccess
          ? `El impacto causa ${attackDamage} ${damageLabel} de Daño Infligido a ${targetStats.name}.`
          : `${victimStats.name} falla el impacto y no causa daño.`;
        const msg = `${header} ${impactData} ${rollText} ${resultText}`;

        addHistoryEntry(attacker.dataset.team, msg, { attacker, defenders: [victim, targetPiece] });
        await showTurnPopup(msg);
        cancelTelekinesis();
        registerActionUsage(attacker, { showPopup: false });
        return;
      }

      const attackerSquare = getPieceSquare(attacker);
      const distance = attackDistance(attackerSquare, targetSquare);
      const defenseBonus = distance > 1 && hasPassive(targetStats, 'defensa a/d') ? 2 : 0;
      const effectiveDefense = targetStats.defensa + defenseBonus;

      const die1 = Math.floor(Math.random() * 6) + 1;
      const die2 = Math.floor(Math.random() * 6) + 1;
      const roll = die1 + die2;
      const attackValue = attackerStats.ataque + roll;
      const success = attackValue >= effectiveDefense;
      const needed = Math.max(2, effectiveDefense - attackerStats.ataque);

      let targetResistance = 0;
      if (hasPassive(targetStats, 'dureza')) targetResistance = 1;
      if (hasPassive(targetStats, 'invulnerable')) targetResistance = 2;

      let victimResistance = 0;
      if (hasPassive(victimStats, 'dureza')) victimResistance = 1;
      if (hasPassive(victimStats, 'invulnerable')) victimResistance = 2;

      const targetDamage = Math.max((victimStats.dano ?? 0) - targetResistance, 0);
      const victimDamage = Math.max((targetStats.dano ?? 0) - victimResistance, 0);

      if (success) {
        playEffectSound(punchSound);
        targetStats.currentVida = Math.max(0, targetStats.currentVida - targetDamage);
        victimStats.currentVida = Math.max(0, victimStats.currentVida - victimDamage);
        if (isEnemy(attacker, targetPiece)) {
          addPoints(attacker, targetDamage * SCORE_PER_DAMAGE);
        }
      } else {
        playEffectSound(failureSound);
      }

      const sentence1 = `${attackerStats.name} realiza un lanzamiento telekinético de enemigos. Lanza a ${victimStats.name} contra ${targetStats.name}.`;
      const sentence2 = `${attackerStats.name} tiene ${attackerStats.ataque} de Ataque y ${targetStats.name} tiene ${effectiveDefense} de Defensa. ${attackerStats.name} necesita un ${needed} y consigue un ${roll}.`;
      const targetDamageLabel = targetDamage === 1 ? 'punto' : 'puntos';
      const victimDamageLabel = victimDamage === 1 ? 'punto' : 'puntos';
      const sentence3 = success
        ? `El impacto causa ${targetDamage} ${targetDamageLabel} de Daño Infligido a ${targetStats.name} y ${victimStats.name} recibe ${victimDamage} ${victimDamageLabel}.`
        : `${attackerStats.name} falla el lanzamiento y no causa daño.`;
      const msg = `${sentence1} ${sentence2} ${sentence3}`;

      addHistoryEntry(attacker.dataset.team, msg, { attacker, defenders: [victim, targetPiece] });

      if (success && targetStats.currentVida <= 0) {
        queueDeathMessage(`${targetStats.name} eliminado por impacto telequinético.`);
        if (isEnemy(attacker, targetPiece)) addPoints(attacker, SCORE_PER_KILL);
        eliminatePiece(targetPiece);
      }
      if (success && victimStats.currentVida <= 0) {
        queueDeathMessage(`${victimStats.name} eliminado por el impacto telequinético.`);
        eliminatePiece(victim);
      }

      renderLifeCards();
      cancelTelekinesis();
      await showTurnPopup(msg);
      registerActionUsage(attacker, { showPopup: false });
    }

    function cancelTelekinesis() {
      pendingTelekinesis = null;
      squares.forEach(s => s.classList.remove('square--placement'));
      
      // Limpiamos targets rojos de lanzamiento
      document.querySelectorAll('.valid-target, .valid-target-blue').forEach(el => {
          el.classList.remove('valid-target', 'valid-target-blue');
      });
      
      // Limpiamos selección de objetos
      document.querySelectorAll('.object-selected').forEach(el => el.classList.remove('object-selected'));

      clearHighlights();
      
      const active = turnOrder[turnIndex];
      if (active) {
          highlightMovement(active);
          highlightRange(active);
          updateStatusBar(active);
      }
      updateCombatInfo();
    }




  // Y AÑADIMOS ESTO PARA INICIAR NORMALMENTE:
  function initNormalGame() {
      // Configuramos la pantalla visible
      startScreen.hidden = false;
      startScreen.classList.remove('start-screen--hidden');
      startScreen.removeAttribute('hidden');
      startScreen.style.display = 'grid';
      startScreen.style.opacity = '1';
      startScreen.style.visibility = 'visible';

      // --- AÑADE ESTO PARA ARRANCAR LA MÚSICA ---
      introMusic.play().catch(() => {
          // Si el navegador bloquea el autoplay, esperamos al primer clic en cualquier sitio
          console.log("Autoplay bloqueado: esperando interacción del usuario.");
          document.addEventListener('click', () => {
              introMusic.play().catch(() => {});
          }, { once: true });
      });
      // ------------------------------------------
  }
  // --- REACTIVAR BOTONES (PEGA ESTO ANTES DE initNormalGame) ---

    passButton.addEventListener('click', () => {
      const activePiece = turnOrder[turnIndex];
      if (!activePiece) return;
      
      // Bloqueo si es turno de la IA (para no pasarle el turno accidentalmente)
      if (isCPUControlledPiece(activePiece)) return;

      playEffectSound(passTurnSound);
      finishTurn(activePiece);
    });

    attackButton.addEventListener('click', () => {
      const activePiece = turnOrder[turnIndex];
      if (!activePiece) return;
      
      // Bloqueo IA
      if (isCPUControlledPiece(activePiece)) return;
      if (actionUsedThisTurn) return;

      if (!selectedTarget) return;

      // Efecto visual del botón
      attackButton.classList.remove('button--pulse');

      currentAction = 'attack';
      if (selectedTarget && selectedTarget.classList?.contains('piece')) {
        flashTargetPiece(selectedTarget, isEnemy(activePiece, selectedTarget) ? 'enemy' : 'ally');
      }
      markActionUsed();
      resolveAttack(activePiece, selectedTarget, 'attack');
    });

    // -----------------------------------------------------------

  initNormalGame();
