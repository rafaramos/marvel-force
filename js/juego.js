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
      
      const punchSound = new Audio('sonidos/efectos/punch.mp3');
      const ohSound = new Audio('sonidos/efectos/oh.mp3');
      const failureSound = new Audio('sonidos/efectos/failure.mp3');
      const passTurnSound = new Audio('sonidos/efectos/pasar.wav');
      const deathSound = new Audio('sonidos/efectos/muerte.wav');

      const criticoSound = new Audio('sonidos/efectos/critico.mp3');
      const pifiaSound = new Audio('sonidos/efectos/pifia.mp3');

      const controlMentalSound = new Audio('sonidos/efectos/controlMental.mp3');
      const curarSound = new Audio('sonidos/efectos/curar.mp3');
      const explosionSound = new Audio('sonidos/efectos/explosion.mp3');
      const incapacitarSound = new Audio('sonidos/efectos/incapacitar.wav');
      const pulsoSound = new Audio('sonidos/efectos/pulso.wav');
      const telekinesisSound = new Audio('sonidos/efectos/telekinesis.wav');
      const barrierSound = new Audio('sonidos/efectos/barrera.wav');

      // --- NUEVO: Configuración de Objetos ---
    const objectSound = new Audio('sonidos/efectos/objeto.wav');
    
    const MAP_OBJECTS = [
        { name: 'Autobús', type: 'heavy', img: 'objetos/autobus.webp' },
        { name: 'Coche', type: 'heavy', img: 'objetos/coche.webp' },
        { name: 'Moto', type: 'light', img: 'objetos/moto.webp' },
        { name: 'Semáforo', type: 'light', img: 'objetos/semaforo.webp' }
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
      const BOARD_COLS = 16;
      const backgroundMusic = new Audio('sonidos/sintonias/Endgame.mp3');
      backgroundMusic.loop = true;
      backgroundMusic.volume = 0.35;

      const introMusic = new Audio('sonidos/sintonias/introduccion.wav');
      introMusic.loop = true; // Para que se repita si tardas mucho en elegir
      introMusic.volume = 0.4; // Ajusta el volumen si quieres

      let backgroundStarted = false;
      let isPlayerVsAI = false;
      let gameStarted = false;
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
      const selections = { player1: [], player2: [] };
      let availableCharacters = [];

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

      playButton.addEventListener('click', () => {
        revealModes();
      });

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

    const AI_DELAY_MS = 900;
    const TURN_DELAY_MS = 250;
    const ENEMY_ACTION_DELAY_MS = 500;
    const DEFAULT_MOVE_DURATION_MS = 1200;

    let squaresByCoord = new Map();
    const pieceMap = new Map();
    let movementDistances = new Map();
    let currentAction = 'attack';
    let movementAnimationDuration = DEFAULT_MOVE_DURATION_MS;
    const movementPool = new Map();
    let turnOrder = [];
    let turnIndex = 0;

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

    function hasPassive(stats, key) {
      const search = normalizePowerKey(key);
      const powerList = stats?.poderes?.pasivos || [];
      const legacyList = stats?.habilidades?.pasivas || [];
      const normalized = [
        ...powerList.map((entry) => normalizePowerKey(entry?.nombre ?? entry)),
        ...legacyList.map((entry) => normalizePowerKey(entry?.nombre ?? entry)),
      ];
      return normalized.includes(search);
    }

    function hasActive(stats, key) {
      const search = normalizePowerKey(key);
      const list = stats?.poderes?.activos || [];
      return list.map((entry) => normalizePowerKey(entry?.nombre ?? entry)).includes(search);
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

      const rawPowers = stats.poderes || { activos: [], pasivos: [] };

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
          const borderColor = pieceColor(element);
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
      const candidate = key ? `animaciones/${key}.webp` : null;
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
      const stats = pieceMap.get(piece);
      if (!stats) return;
      const actives = stats.poderes?.activos || [];
      actives.forEach((ability) => {
        const key = normalizePowerKey(ability?.nombre ?? ability);
        
        

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'button';
        const labels = {
          incapacitar: 'Incapacitar',
          explosion: 'Explosión',
          pulso: 'Pulso',
          barrera: 'Barrera',
          probabilidad: 'Probabilidad',
          'mejora de ataque': 'Mejora de Ataque',
          'mejora de defensa': 'Mejora de Defensa',
          'mejora de agilidad': 'Mejora de Agilidad',
          'mejora de critico': 'Mejora de Crítico',
          curar: 'Curar',
          'telekinesis': 'Telekinesis'
        };
        
        btn.textContent = labels[key] || ability?.nombre || ability;
        btn.disabled = false;
        btn.addEventListener('click', () => handleActionClick(key));
        powerControls.appendChild(btn);
      });
    }

    let selectedTarget = null;
    let pendingAttackInfo = null;
    let latestActionMessage = null;
    let latestPopupContext = null;
    let resolveTurnPopup = null;
    let resolveDeathPopup = null;
    const pendingDeathMessages = [];

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
            // B) ENEMIGOS
            if (occupant && occupant.dataset.team !== piece.dataset.team && !canPassEnemies) {
                continue;
            }
            
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
      
      const stats = pieceMap.get(piece);
      const physRange = rangeForPiece(piece);
      const mentalFloor = getMentalRangeFloor(piece);
      const maxCheck = Math.max(physRange, mentalFloor);
      const isSupport = isSupportPower(currentAction);
      
      const isTelekinesis = currentAction === 'telekinesis'; 
      
      const attackerFlies = hasPassive(stats, 'volar') || hasPassive(stats, 'vuelo');
      
      board.classList.add('targeting');

      let targetsFound = false;
      let rangeSquaresFound = false; // Nueva variable para detectar si hay casillas de rango

      squares.forEach((square) => {
        const dist = attackDistance(origin, square);
        if (dist > maxCheck) return;
        if (isBarrierSquare(square)) return;
        if (dist === 0 && !isSupport) return;
        
        const hasObject = square.querySelector('.object-token');
        const hasPiece = square.querySelector('.piece');

        // VISIÓN AÉREA
        const blockedByLOS = dist > 1 && !hasLineOfSight(origin, square);
        let canSeeThroughBarrier = false;

        if (blockedByLOS && !isSupport && attackerFlies) {
            const targetPiece = square.querySelector('.piece');
            if (targetPiece) {
                const targetStats = pieceMap.get(targetPiece);
                if (targetStats && (hasPassive(targetStats, 'volar') || hasPassive(targetStats, 'vuelo'))) {
                    canSeeThroughBarrier = true;
                }
            } else {
                canSeeThroughBarrier = true;
            }
        }
        
        if (blockedByLOS && !canSeeThroughBarrier) return;

        let isValidSquare = false;
        const shouldHighlight = true; 

        if (dist <= physRange) {
          if (shouldHighlight) square.classList.add('square--range');
          isValidSquare = true;
          rangeSquaresFound = true; // Marcamos que hemos pintado rango
        } else if (dist <= maxCheck) {
          if (shouldHighlight) square.classList.add('square--range-special');
          isValidSquare = true;
          rangeSquaresFound = true; // Marcamos que hemos pintado rango
        }

        if (isValidSquare) {
          const targetPiece = square.querySelector('.piece');
          
          if (targetPiece) {
            const targetStats = pieceMap.get(targetPiece); 
            const isAlly = targetPiece.dataset.team === piece.dataset.team;
            
            // LÓGICA DE SIGILO
            const isHiddenByStealth = dist > 3 && hasPassive(targetStats, 'sigilo');

            if (isSupport && isAlly) {
              targetPiece.classList.add('valid-ally');
              targetsFound = true;
            }
            else if (!isSupport && !isAlly) {
              // Si NO está oculto, marcamos. Si está oculto, NO marcamos (y se verá gris)
              if (!isHiddenByStealth) {
                  if (piece.dataset.team === 'aliado') targetPiece.classList.add('valid-target');
                  else targetPiece.classList.add('valid-target-blue');
                  targetsFound = true;
              }
            }
            else if (!isSupport && isAlly && pieceMap.get(targetPiece)?.mindControlled) {
               if (!isHiddenByStealth) {
                  if (piece.dataset.team === 'aliado') targetPiece.classList.add('valid-target');
                  else targetPiece.classList.add('valid-target-blue');
                  targetsFound = true;
              }
            }
          }
          else if (hasObject) {
              if (isTelekinesis) {
                  hasObject.classList.add('valid-target'); 
                  targetsFound = true;
              }
          }
        }
      });
      
      // CORRECCIÓN: Solo quitamos el modo 'targeting' si no hay objetivos Y TAMPOCO hay rango visual.
      // Si hay rango (casillas naranjas) pero no objetivos (por Sigilo), mantenemos el oscurecimiento
      // para que los enemigos ocultos se vean grises ("apagados").
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
      attackButton.disabled = false;
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

function rangeForAction(attacker, actionKey) {
  const stats = pieceMap.get(attacker);
  const baseRange = effectiveRangeFromStats(stats);
  if (actionKey === 'control mental' || actionKey === 'telekinesis') {
    return Math.max(baseRange, getMentalRangeFloor(attacker));
  }
  return baseRange;
}

   function calculateDamage(attackerStats, defenderStats, distance, isCritical) {
      const isMelee = distance <= 1;
      
      let baseDamageBeforeClaws = attackerStats.dano ?? 0;

      if (!isMelee && hasPassive(attackerStats, 'experto a/d')) {
        baseDamageBeforeClaws += 2;
      }
      
      let clawsRoll = null;
      const hasClaws = isMelee && hasPassive(attackerStats, 'cuchillas/garras/colmillos'); 

      if (hasClaws) {
        clawsRoll = Math.floor(Math.random() * 6) + 1;
      }
      
      const baseDamageAfterClaws = hasClaws
        ? Math.max(baseDamageBeforeClaws, clawsRoll)
        : baseDamageBeforeClaws;
      
      const baseDamageWithCrit = isCritical ? baseDamageAfterClaws * 2 : baseDamageAfterClaws;
      
      // 4. Cálculo de Resistencia
      let valDureza = 0;
      let valInvulnerable = 0;
      
      // --- CAMBIO: HEMOS ELIMINADO LA LÍNEA DE 'defensa a/d' DE AQUÍ ---
      // Ya no reduce daño, solo ayuda a esquivar.
      
      if (hasPassive(defenderStats, 'dureza')) valDureza = 1;
      if (hasPassive(defenderStats, 'invulnerable')) valInvulnerable = 2;
      
      const resistance = Math.max(valDureza, valInvulnerable);
      // -----------------------------------------------------------------
      
      const totalDamage = Math.max(baseDamageWithCrit - resistance, 0);
      
      return {
        totalDamage,
        isMelee,
        clawsRoll,
        rawDamage: baseDamageWithCrit,
        resistance,
        baseDamageBeforeClaws,
        baseDamageAfterClaws,
      };
    }
    

  function evaluateAttackRoll(attackerStats, defenderStats, roll, distance, options = {}) {
      const { allowCounter = false } = options;
      
      // 1. Gestión de Defensa a/d (sigue siendo un modificador numérico válido)
      let effectiveDefense = defenderStats.defensa;
      if (distance > 1 && hasPassive(defenderStats, 'defensa a/d')) {
          effectiveDefense += 2;
      }

      // 2. REGLA SUPREMA: MATEMÁTICAS PURAS
      // Ataque + Tirada >= Defensa del Defensor
      const attackValue = attackerStats.ataque + roll;
      const success = attackValue >= effectiveDefense;

      // 3. Gestión de Flags (Crítico y Pifia)
      const critical = isCriticalRoll(attackerStats, roll);
      const isPifia = (roll === 2); // Doble 1

      // 4. Lógica de Contragolpe
      // Se activa si es Pifia (2), INDEPENDIENTEMENTE de si el ataque acertó o no matemáticamente.
      const isIncapacitated = (defenderStats.incapacitatedTurns || 0) > 0;
      const defenderRange = effectiveRangeFromStats(defenderStats);
      const isWithinDefenderRange = distance <= defenderRange;

      const shouldCounter = allowCounter && isPifia && !isIncapacitated && isWithinDefenderRange;
      
      return { success, critical, isPifia, shouldCounter };
    }
    

    function hasProbabilidad(stats) {
      return Number(stats?.probabilidadTurns ?? 0) > 0;
    }

    function isCriticalRoll(attackerStats, roll) {
      if (!roll) return false;
      const hasAstucia = hasPassive(attackerStats, 'astucia');
      const empowered = hasProbabilidad(attackerStats);
      const critBuff = Boolean(attackerStats?.critBuff);
      if ((empowered && hasAstucia) || (critBuff && (empowered || hasAstucia))) return roll >= 10;
      if (empowered || hasAstucia || critBuff) return roll >= 11;
      return roll === 12;
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
          poderes: raw.poderes || { activos: [], pasivos: [] }
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

  const activos = (stats.poderes?.activos || []).map(p => p.nombre || p).join('</li><li>');
  const pasivos = (stats.poderes?.pasivos || []).map(p => p.nombre || p).join('</li><li>');

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

    <div>
        ${activos ? `<h4>Poderes Activos</h4><ul class="power-list"><li>${activos}</li></ul>` : ''}
        ${pasivos ? `<h4>Poderes Pasivos</h4><ul class="power-list"><li>${pasivos}</li></ul>` : ''}
    </div>
    
    ${buffosTexto ? `<h4 style="color:#4ade80">Buffos Temporales</h4><div style="font-size:0.8rem; margin-left:10px;">${buffosTexto}</div>` : ''}
  `;

  tooltip.hidden = false;
  requestAnimationFrame(() => positionTooltip(target));
}


// Calcula el rango mínimo garantizado por poderes mentales
    function getMentalRangeFloor(piece) {
      const stats = pieceMap.get(piece);
      if (!stats) return 0;

      // Jerarquía: Telekinesis (3) > Control Mental (2)
      // Si tiene Telekinesis, el suelo es 3 (tenga o no CM).
      if (hasActive(stats, 'telekinesis')) return 3;
      
      // Si solo tiene Control Mental, el suelo es 2.
      if (hasActive(stats, 'control mental')) return 2;

      return 0;
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

   function actionLabel(actionKey) {
      const labels = {
        'incapacitar': 'Incapacitar',
        'explosion': 'Explosión',
        'pulso': 'Pulso',
        'barrera': 'Barrera',
        'probabilidad': 'Probabilidad',
        'mejora de ataque': 'Mejora de Ataque',
        'mejora de defensa': 'Mejora de Defensa',
        'mejora de agilidad': 'Mejora de Agilidad',
        'mejora de critico': 'Mejora de Crítico',
        'curar': 'Curar',
        'control mental': 'Control Mental',
        'telekinesis': 'Telekinesis'
      };
      return labels[actionKey] || 'Ataque';
    }

    function neededRollToHit(attackerStats, defenderStats, isMelee) {
      if (!attackerStats || !defenderStats) return 0;
      
      let effectiveDefense = defenderStats.defensa;
      
      if (!isMelee && hasPassive(defenderStats, 'defensa a/d')) {
          effectiveDefense += 2;
      }
      
      // Fórmula: Necesito que (Ataque + Dado) >= Defensa
      // Por tanto: Dado >= Defensa - Ataque
      const needed = effectiveDefense - attackerStats.ataque;
      
      // Lo único que mantenemos es que el dado no puede sacar menos de 2.
      // Si la matemática dice que necesitas un -5, te dirá que necesitas un 2 (lo mínimo posible).
      return Math.max(2, needed);
    }

     function buildAttackPopupMessage({
        attackerStats,
        defenderStats,
        roll,
        success,
        damage,
        isMelee,
        resistance,
        rawDamage, 
        actionKey,
        clawsRoll,
        critical,
        heldObject
      }) {
        
        // 1. Defensa Visual
        let defBase = defenderStats.defensa;
        let defDisplay = `${defBase}`;
        let effectiveDefense = defBase;

        if (!isMelee && hasPassive(defenderStats, 'defensa a/d')) {
            effectiveDefense = defBase + 2;
            defDisplay = `${effectiveDefense} (${defBase} + 2)`;
        }

        // 2. Necesidad y Tirada
        const needed = Math.max(2, effectiveDefense - attackerStats.ataque);
        const rollText = critical ? `${roll} (CRÍTICO)` : `${roll}`;

        // --- Casos Especiales ---
        if (actionKey === 'incapacitar') {
            const part1 = `${attackerStats.name} realiza un ataque de Incapacitación con ${attackerStats.ataque} de Ataque a ${defenderStats.name} que tiene ${defDisplay} de Defensa.`;
            const part2 = `${attackerStats.name} necesita un ${needed} y consigue un ${rollText}.`;
            const part3 = success 
                ? `${attackerStats.name} Incapacita a ${defenderStats.name}.`
                : `${attackerStats.name} falla el ataque de Incapacitación contra ${defenderStats.name}.`;
            return `${part1} ${part2} ${part3}`;
        }

        if (actionKey === 'control mental') {
            const part1 = `${attackerStats.name} realiza un ataque de Control Mental con ${attackerStats.ataque} de Ataque a ${defenderStats.name} que tiene ${defDisplay} de Defensa.`;
            const part2 = `${attackerStats.name} necesita un ${needed} y consigue un ${rollText}.`;
            const part3 = success 
                ? `${defenderStats.name} es controlado por ${attackerStats.name} por 1 turno.`
                : `${attackerStats.name} falla el ataque de Control Mental contra ${defenderStats.name}.`;
            return `${part1} ${part2} ${part3}`;
        }

        // --- ATAQUE NORMAL (C/C o A/D) ---
        const attackType = isMelee ? 'ataque cuerpo a cuerpo' : 'ataque a distancia';
        const sentence1 = `${attackerStats.name} realiza un ${attackType} con ${attackerStats.ataque} de Ataque a ${defenderStats.name} que tiene ${defDisplay} de Defensa.`;
        const sentence2 = `${attackerStats.name} necesita un ${needed} y consigue un ${rollText}.`;

        // FALLO
        if (!success) {
            let failMsg = `${sentence1} ${sentence2} ${attackerStats.name} falla el ataque contra ${defenderStats.name}.`;
            if (heldObject) failMsg += ` El objeto usado (${heldObject.name}) se rompe tras el ataque.`;
            return failMsg;
        }

        // ÉXITO
        let damageText = '';
        let resistanceText = ` y la Resistencia de ${defenderStats.name} es ${resistance}.`;

        // A) GARRAS
        if (clawsRoll !== null) {
             damageText = `${attackerStats.name} realiza una tirada de Cuchillas/Garras/Colmillos y saca un ${clawsRoll}, con lo que su Daño es ${rawDamage}`;
             if (critical) damageText += ` (${clawsRoll} X 2)`;
             damageText += `.`; // Punto para separar de resistencia
             
             resistanceText = `${defenderStats.name} tiene una resistencia de ${resistance}.`; 
        } 
        // B) NORMAL / OBJETO
        else {
            let breakdown = '';
            
            // Lógica exacta para objeto: "7 (5 + 2)"
            if (heldObject && attackerStats.originalDano !== undefined) {
                const base = attackerStats.originalDano;
                const bonus = attackerStats.dano - base; 
                
                if (!critical) {
                    breakdown = ` (${base} + ${bonus})`;
                } else {
                    // Si es crítico: "14 ((5 + 2) X 2)" o simplificado
                    breakdown = ` ((${base} + ${bonus}) X 2)`;
                }
            }
            // Experto A/D
            else if (!isMelee && hasPassive(attackerStats, 'experto a/d')) {
                 if (!critical) breakdown = ` (${attackerStats.dano} + 2)`;
            }
            // Crítico normal
            else if (critical) {
                const base = rawDamage / 2;
                breakdown = ` (${base} X 2)`;
            }

            damageText = `El Daño de ${attackerStats.name} es ${rawDamage}${breakdown}`;
        }

        // Unimos frase de Daño + Resistencia
        let sentence3 = (clawsRoll !== null) ? `${damageText} ${resistanceText}` : `${damageText}${resistanceText}`;

        // Frase 4: Daño Final y Eliminación
        let sentence4 = `${attackerStats.name} le causa ${damage} puntos de Daño Infligido a ${defenderStats.name}`;
        
        if (defenderStats.currentVida <= 0) {
            sentence4 += `, que es ELIMINADO.`;
        } else {
            sentence4 += `.`;
        }

        // Frase Objeto siempre al final y limpia
        let objectMsg = '';
        if (heldObject) {
             objectMsg = ` El objeto usado (${heldObject.name}) se rompe tras el ataque.`;
        }

        return `${sentence1} ${sentence2} ${sentence3} ${sentence4}${objectMsg}`;
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
      
      // --- CAMBIO AQUÍ: Nombre actualizado en la barra ---
      const clawsText = info.clawsRoll ? ` | Cuchillas d6: ${info.clawsRoll}` : '';
      // --------------------------------------------------
      
      const noteText = info.note ? ` | ${info.note}` : '';
      combatBox.textContent = `${info.action} ${info.attackerName} (${info.attacker}) vs ${info.defenderName} (${info.defender}) | Diferencia: ${info.difference}${rollText}${successText}${damageText}${clawsText}${noteText}`;
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
        actionLabelOverride = null, 
        isSecondAttack = false 
      } = options;

      const attackerStats = pieceMap.get(attacker);
      const defenderStats = pieceMap.get(defender);
      
      if (!attackerStats || !defenderStats) return;

      const attackerSquare = getPieceSquare(attacker);
      const targetSquare = getPieceSquare(defender);
      const maxRange = rangeForAction(attacker, actionKey);
      const distance = attackDistance(attackerSquare, targetSquare);

      // --- NUEVO: Bloqueo por Sigilo (> 3 casillas) ---
      if (distance > 3 && hasPassive(defenderStats, 'sigilo')) {
          const blockedMessage = `${defenderStats.name} está oculto por Sigilo (demasiado lejos).`;
          addHistoryEntry(attacker.dataset.team, blockedMessage, { attacker, defenders: [defender] });
          pendingAttackInfo = null;
          updateCombatInfo();
          if (!skipTurnAdvance) {
            await showTurnPopup(blockedMessage);
            // Opcional: ¿Gasta el turno o le dejas volver a intentar? 
            // Si quieres que gaste turno: finishTurn(attacker);
            // Si quieres que pueda elegir otro objetivo (mejor jugabilidad):
            hideTooltip();
            attackButton.classList.remove('button--pulse');
          }
          return;
      }

      // 1. Chequeo de Distancia Máxima
      if (distance > maxRange) {
        const blockedMessage = 'El objetivo está fuera de rango.';
        addHistoryEntry(attacker.dataset.team, blockedMessage, { attacker, defenders: [defender] });
        pendingAttackInfo = null;
        updateCombatInfo();
        if (!skipTurnAdvance) {
          await showTurnPopup(blockedMessage);
          finishTurn(attacker, { showPopup: false });
        }
        return;
      }

      // 2. Chequeo de Barreras (Vuelo)
      const lineOfSightBlocked = distance > 1 && !hasLineOfSight(attackerSquare, targetSquare);
      if (lineOfSightBlocked) {
        const attackerFlies = hasPassive(attackerStats, 'volar') || hasPassive(attackerStats, 'vuelo');
        const defenderFlies = hasPassive(defenderStats, 'volar') || hasPassive(defenderStats, 'vuelo');
        
        if (!attackerFlies || !defenderFlies) {
            const blockedMessage = 'La barrera bloquea el ataque (se requiere Volar vs Volar).';
            addHistoryEntry(attacker.dataset.team, blockedMessage, { attacker, defenders: [defender] });
            pendingAttackInfo = null;
            updateCombatInfo();
            if (!skipTurnAdvance) {
              await showTurnPopup(blockedMessage);
              finishTurn(attacker, { showPopup: false });
            }
            return;
        }
      }

      // 3. CÁLCULOS
      const die1 = Math.floor(Math.random() * 6) + 1;
      const die2 = Math.floor(Math.random() * 6) + 1;
      const roll = die1 + die2;
      
      const { success, critical, isPifia, shouldCounter } = evaluateAttackRoll(
        attackerStats, defenderStats, roll, distance, { allowCounter }
      );

      if (critical) playEffectSound(criticoSound);
      if (isPifia) playEffectSound(pifiaSound);

      const { totalDamage, clawsRoll, isMelee, resistance, rawDamage, baseDamageBeforeClaws, baseDamageAfterClaws } = 
        calculateDamage(attackerStats, defenderStats, distance, critical);

      const isStatusAttack = actionKey === 'incapacitar' || actionKey === 'control mental';
      const damageApplied = success && !isStatusAttack ? totalDamage : 0;

      // 4. APLICAR EFECTOS
      let specialEffectMessage = ''; 

      if (success) {
        if (actionKey === 'incapacitar') {
          setIncapacitated(defender, 1);
          if (isEnemy(attacker, defender)) addPoints(attacker, 10);
          playEffectSound(incapacitarSound);
        } 
        else if (actionKey === 'control mental') {
          const currentTeam = defender.dataset.team;
          defenderStats.originalTeam = currentTeam; 
          const newTeam = currentTeam === 'aliado' ? 'enemigo' : 'aliado';
          defenderStats.team = newTeam;
          defender.dataset.team = newTeam;
          defenderStats.mindControlled = true;
          if (isEnemy(attacker, defender)) addPoints(attacker, 10);
          playEffectSound(controlMentalSound);
        }
        else if (damageApplied > 0) {
          defenderStats.currentVida = Math.max(defenderStats.currentVida - damageApplied, 0);
          if (isEnemy(attacker, defender)) addPoints(attacker, damageApplied * SCORE_PER_DAMAGE);

          if (hasPassive(attackerStats, 'robo de vida')) {
            const missing = attackerStats.maxVida - attackerStats.currentVida;
            const heal = Math.min(damageApplied, missing);
            if (heal > 0) {
              attackerStats.currentVida += heal;
              specialEffectMessage = ` ${attackerStats.name} roba vida (+${heal}).`;
            }
          }
        }
      }

      // 5. PREPARAR MENSAJE
      // Guardamos referencia al objeto ANTES de borrarlo para pasarlo al texto
      const usedObject = attackerStats.heldObject ? { ...attackerStats.heldObject } : null;

      let popupMessage = buildAttackPopupMessage({
        attackerStats, defenderStats, roll, success, damage: damageApplied,
        isMelee, resistance, rawDamage, actionKey, clawsRoll, critical,
        baseDamageBeforeClaws, baseDamageAfterClaws, heldObject: usedObject 
      });
      
      popupMessage += specialEffectMessage; 
      
      // --- LÓGICA DE ROMPER OBJETO (SOLO LÓGICA, NO TEXTO) ---
      // Aquí estaba el error. Hemos quitado las líneas que añadían texto repetido.
      if (attackerStats.heldObject) {
          // Restaurar stats originales
          attackerStats.dano = attackerStats.originalDano;
          attackerStats.rango = attackerStats.originalRango;
          attacker.dataset.rango = attackerStats.rango; 
          
          // Borrar objeto
          delete attackerStats.heldObject;
          attacker.classList.remove('piece--holding');
      }
      // -------------------------------------------------------

      addHistoryEntry(attacker.dataset.team, popupMessage, { attacker, defenders: [defender] });

      // Gestión de Muerte
      if (success && !isStatusAttack && defenderStats.currentVida <= 0) {
        if (defenderStats.mindControlled) {
            defenderStats.team = defenderStats.originalTeam;
            defender.dataset.team = defenderStats.originalTeam;
            defenderStats.mindControlled = false;
        }
        queueDeathMessage(`${defenderStats.name} eliminado por ${attackerStats.name}.`);
        if (isEnemy(attacker, defender)) addPoints(attacker, SCORE_PER_KILL);
        eliminatePiece(defender);
      }

      // Sonido e Interfaz
      const skipFailureSound = isPifia; 
      const isZeroDamageHit = success && damageApplied === 0 && !isStatusAttack;
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
        await showTurnPopup(`¡PIFIA! ${attackerStats.name} ha fallado estrepitosamente.\n${defenderStats.name} prepara su contraataque.\n(Haz clic para resolver la réplica)`);
        await sleep(300);
        await resolveAttack(defender, attacker, 'attack', {
          allowCounter: false,
          skipTurnAdvance: true,
          actionLabelOverride: 'Réplica',
        });
        if (!skipTurnAdvance) finishTurn(attacker);
        return;
      }

      const hasDoubleAttack = hasPassive(attackerStats, 'doble ataque c/c');
      if (isMelee && hasDoubleAttack && !isSecondAttack && !options.actionLabelOverride && !isStatusAttack &&
          defenderStats.currentVida > 0 && defender.dataset.eliminated !== 'true' &&
          attackerStats.currentVida > 0 && attacker.dataset.eliminated !== 'true') {
        
        await showTurnPopup(`${popupMessage}\n\n[DOBLE ATAQUE]\n(Clic para el segundo golpe)`);
        await sleep(300);
        await resolveAttack(attacker, defender, actionKey, {
          ...options,
          isSecondAttack: true, 
          actionLabelOverride: '2º Ataque c/c'
        });
        return; 
      }

      if (!skipTurnAdvance) {
        hideTooltip();
        clearRangeHighlights();
        selectedTarget = null;
        attackButton.classList.remove('button--pulse');
        finishTurn(attacker);
      }
    }

async function resolveExplosion(attacker, centerTarget) {
  const attackerStats = pieceMap.get(attacker);
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

  const msg = `${attackerStats.name} ejecuta una Explosión. ${attackerStats.name} tiene ${attackerStats.ataque} de Ataque y consigue en la tirada un ${roll}. ${attackerStats.name} tiene un daño base para Explosión de ${baseDmg}. Afectados: ${listaAfectados}.`;

  // --- CORRECCIÓN: Pasar defenders para que salgan las imágenes ---
  addHistoryEntry(attacker.dataset.team, msg, { attacker, defenders: affectedPieces });
  
  playEffectSound(explosionSound);
  renderLifeCards();
  
  await showTurnPopup(msg);
  finishTurn(attacker, { showPopup: false });
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

  const msg = `${attackerStats.name} ejecuta un Pulso. ${attackerStats.name} tiene ${attackerStats.ataque} de Ataque y consigue en la tirada un ${roll}. ${attackerStats.name} tiene un daño base para Pulso de ${baseRaw}. Afectados: ${listaAfectados}.`;

  playEffectSound(pulsoSound);
  
  // CORRECCIÓN: Pasar defenders con los elementos HTML para las fotos
  addHistoryEntry(attacker.dataset.team, msg, { attacker, defenders: affectedPiecesElements });
  
  registerTurnSound({ damageDealt: totalDamageDealt, attackFailed: !anySuccess });
  renderLifeCards();
  
  await showTurnPopup(msg);
  finishTurn(attacker, { showPopup: false });
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

  finishTurn(attacker, { showPopup: false });
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
        ? `${attackerStats.name} aplica Probabilidad sobre ${recipientNames}.`
        : `${attackerStats.name} intenta aplicar Probabilidad, pero nadie se beneficia.`;

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
      finishTurn(attacker);
    }

   function applyStatBuff(attacker, target, { stat, label }) {
      const attackerStats = pieceMap.get(attacker);
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
        ? `${attackerStats.name} aplica ${label} sobre: ${lista}.`
        : `${attackerStats.name} intenta aplicar ${label}, pero nadie se beneficia.`;

      // CORRECCIÓN 2: Pasamos 'defenders: affected' para que salgan sus fotos
      addHistoryEntry(attacker.dataset.team, message, { 
          attacker, 
          defenders: affected 
      });
      
      renderLifeCards();
      
      showTurnPopup(message).then(() => {
          finishTurn(attacker, { showPopup: false });
      });
    }


async function resolveHeal(attacker, target) {
      const attackerStats = pieceMap.get(attacker);
      const targetStats = pieceMap.get(target);
      
      // Cálculo de Daño Infligido (Heridas)
      const wounds = Math.max(targetStats.maxVida - targetStats.currentVida, 0);
      
      if (wounds === 0) {
        await showTurnPopup(`${attackerStats.name} intenta curar a ${targetStats.name}, pero ya está al máximo de salud.`);
        finishTurn(attacker, { showPopup: false });
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
          
          addHistoryEntry(attacker.dataset.team, msg, { attacker });
          renderLifeCards();
          await showTurnPopup(msg);
      } else {
          const msg = `${sentence1} ${sentence2} ${attackerStats.name} falla la curación.`;
          playEffectSound(failureSound);
          addHistoryEntry(attacker.dataset.team, msg, { attacker });
          await showTurnPopup(msg);
      }

      finishTurn(attacker, { showPopup: false });
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

      // ==================================================================
      // A) RESOLVER TELEKINESIS ACTIVA (Fase de soltar/lanzar)
      // ==================================================================
      if (pendingTelekinesis) {
          const { attacker, victim } = pendingTelekinesis;
          const isObject = victim.classList.contains('object-token');
          
          // OPCIÓN 1: MOVER (Casilla Azul)
          if (square.classList.contains('square--placement')) {
              await animatePieceToSquare(victim, square);
              playEffectSound(telekinesisSound);
              
              const attackerName = pieceMap.get(attacker).name;
              const victimName = isObject ? victim.dataset.name : pieceMap.get(victim).name;

              // 10 PUNTOS POR MOVER
              addPoints(attacker, 10);

              const conector = isObject ? '' : ' a';
              const msg = `${attackerName} usa Telekinesis para mover${conector} ${victimName}.`;
              
              addHistoryEntry(attacker.dataset.team, msg, { attacker, defenders: isObject ? [] : [victim] });
              
              if (!isObject) await showTurnPopup(msg);

              cancelTelekinesis();
              finishTurn(attacker, { showPopup: false });
              return;
          }

          // OPCIÓN 2: LANZAR OBJETO (Clic en Enemigo)
          if (isObject) {
             const targetEnemy = square.querySelector('.piece');
             if (targetEnemy && (targetEnemy.classList.contains('valid-target') || targetEnemy.classList.contains('valid-target-blue'))) {
                 await resolveObjectThrow(attacker, victim, targetEnemy);
                 return;
             }
          }
          
          cancelTelekinesis();
          return;
      }
      
      // ==================================================================
      // B) LÓGICA NORMAL
      // ==================================================================
      const activePiece = turnOrder[turnIndex];
      if (isPlayerVsAI && activePiece.dataset.team === 'enemigo') return;

      let targetPiece = square.querySelector('.piece');
      const targetObject = square.querySelector('.object-token');

      // --- BARRERAS ---
      if (pendingBarrierPlacement) {
          if (!areAdjacentSquares(pendingBarrierPlacement.lastSquare, square)) {
             if (typeof showTurnPopup === 'function') showTurnPopup('La barrera solo puede crecer en casillas adyacentes.');
             return;
          }
          if (!placeBarrierBlock(square, pendingBarrierPlacement.attacker)) {
             if (typeof showTurnPopup === 'function') showTurnPopup('No se puede colocar la barrera aquí.');
             return;
          }
          pendingBarrierPlacement.created += 1;
          pendingBarrierPlacement.remaining -= 1;
          pendingBarrierPlacement.lastSquare = square;
          updateBarrierPreview(square);
          if (pendingBarrierPlacement.remaining <= 0 || barrierPreviewSquares.length === 0) {
            await finalizeBarrierPlacement(pendingBarrierPlacement.attacker, pendingBarrierPlacement.created);
          }
          return;
      }

      if (currentAction === 'barrera' && !targetPiece) {
        const isOrange = square.classList.contains('square--range');
        if (!isOrange || isBarrierSquare(square)) {
             alert('Fuera de rango.'); return;
        }
        await resolveBarrier(activePiece, square);
        return;
      }

      // --- SELECCIÓN DE OBJETIVO ---
      let selectionTarget = targetPiece;
      if (currentAction === 'telekinesis' && !targetPiece && targetObject) {
          selectionTarget = targetObject;
      }

      if (selectionTarget) {
        if (currentAction === 'barrera') {
             alert('La barrera requiere casilla vacía.'); return;
        }

        const isObject = selectionTarget.classList.contains('object-token');
        const targetStats = isObject ? null : pieceMap.get(selectionTarget);
        
        if (isObject && currentAction !== 'telekinesis') return;

        const isOrange = square.classList.contains('square--range');
        const isPurple = square.classList.contains('square--range-special');
        
        if (!isOrange && !isPurple) {
          clearTargetSelection();
          return;
        }

        // --- NUEVO BLOQUEO: Verificar Sigilo en el CLIC ---
        // Si es un enemigo, está lejos (>3) y tiene Sigilo, impedimos seleccionarlo.
        // (Nota: Calculamos distancia desde la pieza activa)
        if (!isObject && targetStats && isEnemy(activePiece, selectionTarget)) {
             const dist = attackDistance(getPieceSquare(activePiece), square);
             // Si tiene sigilo y está lejos
             if (dist > 3 && hasPassive(targetStats, 'sigilo')) {
                 // Bloqueamos silenciosamente o mostramos aviso
                 // (Opcional: alert("Objetivo oculto por Sigilo"))
                 return; 
             }
        }
        // --------------------------------------------------

        clearTargetSelection();
        square.classList.add('square--target');
        
        if (isObject) selectionTarget.classList.add('object-selected');
        else selectionTarget.classList.add('piece--selected');

        selectedTarget = selectionTarget;

        if (currentAction === 'telekinesis' || isSupportPower(currentAction)) {
            handleActionClick(currentAction);
            return;
        }

        const attackerStats = pieceMap.get(activePiece);
        let noteText = 'Objetivo seleccionado';
        if (targetStats?.mindControlled) noteText = 'Marioneta (Fuego Amigo)';

        pendingAttackInfo = {
          action: actionLabel(currentAction),
          attackerName: attackerStats?.name,
          defenderName: targetStats?.name || 'Objeto',
          note: noteText,
        };
        updateCombatInfo();
        attackButton.classList.add('button--pulse');
        return;
      }

      // --- MOVIMIENTO ---
      if (square.classList.contains('square--move')) {
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
          }
          return;
      }
    });

function handleActionClick(actionKey, options = {}) {
  currentAction = actionKey;
  const attacker = turnOrder[turnIndex];

  // 1. Acciones sin objetivo (Área inmediata)
  if (actionKey === 'pulso') {
    resolvePulse(attacker);
    return;
  }

  // 2. Modo "Armar poder" (Si no hay objetivo seleccionado)
  if (!selectedTarget) {
    highlightRange(attacker);
    
    const combatBox = document.getElementById('combatInfo');
      const labels = {
      incapacitar: 'Incapacitar',
      'control mental': 'Control Mental',
      curar: 'Curar',
      'mejora de ataque': 'Mejora de Ataque',
      'mejora de defensa': 'Mejora de Defensa',
      'mejora de agilidad': 'Mejora de Agilidad',
      'mejora de critico': 'Mejora de Crítico',
      'telekinesis': 'Telekinesis',
      'explosion': 'Explosión',
      'barrera': 'Barrera'
    };
    const nombre = labels[actionKey] || actionKey;

    if (combatBox) {
         combatBox.style.display = 'block';
         combatBox.textContent = `Modo [${nombre}] activo. Selecciona un objetivo.`;
    }
    return;
  }

  if (actionKey === 'barrera' && pendingBarrierPlacement) {
    return;
  }

  if (actionKey === 'barrera') {
    const targetSquare = selectedTarget?.classList?.contains('square')
      ? selectedTarget
      : getPieceSquare(selectedTarget);
    const isInOrangeZone = targetSquare?.classList.contains('square--range');
    
    // Aquí también aplicamos el bypass por si acaso la IA usa barreras en el futuro
    if (!isInOrangeZone && !options.bypassVisuals) {
      if (typeof showTurnPopup === 'function') showTurnPopup('El objetivo está fuera de rango.');
      else alert('El objetivo está fuera de rango.');
      clearTargetSelection();
      return;
    }
    resolveBarrier(attacker, targetSquare);
    return;
  }

  const targetSquare = getPieceSquare(selectedTarget);
  
  // 3. Validación de rango (Naranja/Púrpura)
  const isInPurpleZone = targetSquare.classList.contains('square--range-special');
  const isInOrangeZone = targetSquare.classList.contains('square--range');
  
  // Si el objetivo está en la zona Púrpura (lejos), solo permitimos poderes mentales
  // Nota: Si bypassVisuals es true, asumimos que la IA ya ha calculado que el rango es válido para el poder usado
  if (isInPurpleZone && !isInOrangeZone && !options.bypassVisuals) {
      const mentalActions = ['control mental', 'telekinesis']; 
      const normalizedKey = normalizePowerKey(actionKey); 

      if (!mentalActions.includes(normalizedKey)) {
          if (typeof showTurnPopup === 'function') showTurnPopup('El objetivo está demasiado lejos. Solo puedes usar poderes mentales aquí.');
          else alert('Demasiado lejos.');
          return;
      }
  }
  
  // Si no hay luz, no hay ataque (AQUÍ ESTÁ EL CAMBIO CRÍTICO VISUAL)
  if (!isInOrangeZone && !isInPurpleZone && !options.bypassVisuals) {
      alert('El objetivo está fuera de rango (Visual).');
      clearTargetSelection();
      return;
  }

  // 4. TELEKINESIS: Iniciar fase de colocación
  if (actionKey === 'telekinesis') {
      startTelekinesisPlacement(attacker, selectedTarget);
      return; 
  }

  // 5. Resto de poderes
  const supportAction = normalizePowerKey(actionKey);

  if (supportAction === 'probabilidad') { applyProbabilidad(attacker, selectedTarget); return; }
  if (supportAction === 'mejora de ataque') { applyStatBuff(attacker, selectedTarget, { stat: 'ataque', label: 'Mejora de Ataque' }); return; }
  if (supportAction === 'mejora de defensa') { applyStatBuff(attacker, selectedTarget, { stat: 'defensa', label: 'Mejora de Defensa' }); return; }
  if (supportAction === 'mejora de agilidad') { applyStatBuff(attacker, selectedTarget, { stat: 'agilidad', label: 'Mejora de Agilidad' }); return; }
  if (supportAction === 'mejora de critico') { applyStatBuff(attacker, selectedTarget, { stat: 'critico', label: 'Mejora de Crítico' }); return; }
  if (supportAction === 'curar') { resolveHeal(attacker, selectedTarget); return; }

  if (actionKey === 'incapacitar') {
    const tStats = pieceMap.get(selectedTarget);
    if (tStats.incapacitatedTurns > 0) {
       showTurnPopup(`¡${tStats.name} ya está incapacitado!`);
       return;
    }
    resolveAttack(attacker, selectedTarget, 'incapacitar', { allowCounter: false });
    return;
  }

  if (actionKey === 'control mental') {
    const tStats = pieceMap.get(selectedTarget);
    if (tStats.mindControlled) {
        showTurnPopup(`¡${tStats.name} ya está bajo control mental!`);
        return;
    }
    // FIX: Añadido { allowCounter: false } para evitar contragolpe
    resolveAttack(attacker, selectedTarget, 'control mental', { allowCounter: false });
    return;
  }

  // 6. Ataque estándar y Explosión
  prepareAttackInfo(attacker, selectedTarget, actionKey);
  
  if (actionKey === 'explosion') {
    resolveExplosion(attacker, selectedTarget);
  } else {
    resolveAttack(attacker, selectedTarget, actionKey);
  }
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

        const animation = piece.animate(
          [
            { transform: `translate(-50%, -50%) translate(${deltaX}px, ${deltaY}px)` },
            { transform: 'translate(-50%, -50%)' },
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
      const { skipRegeneration = false, summaryOverride = null, showPopup = null } = options;
      
      const stats = pieceMap.get(piece);
      
      // 1. Regeneración
      const regenResult = skipRegeneration ? { regenerated: false, message: '' } : applyRegeneration(piece);
      
      // --- CORRECCIÓN: ACTUALIZAR FOTO DEL POPUP SI HUBO REGENERACIÓN ---
      if (regenResult.regenerated && latestPopupContext) {
          // Buscamos al personaje en las listas del popup y actualizamos sus datos (vida nueva)
          const updateList = (list) => {
              for (let i = 0; i < list.length; i++) {
                  if (list[i].key === piece.dataset.key) {
                      // Hacemos una nueva foto conservando su rol
                      list[i] = snapshotCharacter(piece, list[i].role);
                  }
              }
          };
          updateList(latestPopupContext.allies);
          updateList(latestPopupContext.enemies);
      }
      // ------------------------------------------------------------------

      // 2. Probabilidad
      const probabilityResult = consumeProbabilidadTurn(piece);
      
      // 3. Buffos
      const buffMessages = consumeStatBuffs(piece);

      // 4. Recuperación de Control Mental (Fin de turno normal)
      let mindControlMsg = '';
      if (stats && stats.mindControlled) {
        stats.team = stats.originalTeam;
        piece.dataset.team = stats.originalTeam;
        stats.mindControlled = false;
        delete stats.originalTeam;
        mindControlMsg = ` ${stats.name} se libera del control mental.`;
      }

      // Construcción del mensaje final
      const summaryParts = [
        summaryOverride || latestActionMessage || (stats ? `${stats.name} finaliza su turno.` : 'Turno completado.'),
      ];
      if (regenResult?.regenerated) summaryParts.push(regenResult.message);
      if (probabilityResult?.expired) summaryParts.push(probabilityResult.message);
      buffMessages.forEach((msg) => summaryParts.push(msg));
      if (mindControlMsg) summaryParts.push(mindControlMsg);

      const summary = summaryParts.join(' ').trim();
      latestActionMessage = null;

      if (latestPopupContext) {
        latestPopupContext.message = summary;
      } else if (regenResult?.regenerated || mindControlMsg) {
        setLatestPopupContext(summary, [{ piece, role: piece.dataset.team === 'aliado' ? 'attacker' : 'defender' }]);
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

      advanceTurn();
    }

function startTurn(piece) {
      if (!piece) return;
      const stats = pieceMap.get(piece);
      if (!stats) return;

      // --- NUEVO: Limpieza de barreras del turno anterior ---
      activeBarriers = activeBarriers.filter(b => {
        if (b.creator === piece) {
          b.element.remove();
          b.square.classList.remove('square--barrier');
          return false; // Lo sacamos de la lista
        }
        return true; // Lo mantenemos
      });
      // -----------------------------------------------------

      pendingBarrierPlacement = null;
      clearBarrierPreview();

      // 1. Verificar Incapacitado
      if (stats.incapacitatedTurns && stats.incapacitatedTurns > 0) {
        const incapMessage = `${stats.name} pierde el turno por estar incapacitado.`;
        addHistoryEntry(piece.dataset.team, incapMessage, { attacker: piece });
        stats.incapacitatedTurns -= 1;
        if (stats.incapacitatedTurns <= 0) {
          piece.classList.remove('piece--incapacitated');
        }
        renderLifeCards();
        finishTurn(piece, { summaryOverride: incapMessage });
        return;
      }

      // 2. Configuración Estándar
      resetMovement(piece);
      setActivePiece(piece); 
      clearTargetSelection(true);
      clearHighlights();
      highlightMovement(piece);
      highlightRange(piece);

      // 3. Bloqueo para IA
      if (isPlayerVsAI && piece.dataset.team === 'enemigo') {
        passButton.disabled = true;
        attackButton.disabled = true;
        setTimeout(() => performEnemyTurn(piece), 1000);
      }
    }


    function ownerLabel(playerId) {
      if (playerId === 'player1') return 'Jugador 1';
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

    function renderDraftCards() {
      draftGrid.innerHTML = '';
      const ownership = new Map();
      Object.entries(selections).forEach(([playerId, picks]) => {
        picks.forEach((key) => ownership.set(key, playerId));
      });

      availableCharacters.forEach((key) => {
        const stats = pieceStats[key];
        const card = document.createElement('button');
        card.type = 'button';
        card.className = 'draft-card';
        // --- IMPORTANTE: Guardamos la clave para que el tooltip sepa qué buscar ---
        card.dataset.key = key; 
        
        card.innerHTML = `
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
    }

    function updateDraftLabels() {
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
    }

    function draftIsComplete() {
      const teamsFull = selections.player1.length === 12 && selections.player2.length === 12;
      const outOfTurns = draftIndex >= draftOrder.length;
      return teamsFull || outOfTurns;
    }

    function handleDraftPick(key) {
      if (!draftActive) return;
      if (draftIndex >= draftOrder.length) {
        finalizeDraft();
        return;
      }

      const pickerId = draftOrder[draftIndex];
      if (!pickerId) return;
      if (!availablePool().includes(key)) return;
      if (selections[pickerId].length >= 12) return;

      selections[pickerId].push(key);
      draftIndex = Math.min(draftIndex + 1, draftOrder.length);
      renderDraftCards();

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
      if (isPlayerVsAI && nextPicker === 'player2') {
        setTimeout(performAIPick, 600);
      }
    }

    

    function buildPositionsFromSelections() {
      const allySlots = generateSlots(selections.player1.length, {
        startCol: 1,
        direction: 1,
        palette: ALLY_COLORS,
      });

      const enemySlots = generateSlots(selections.player2.length, {
        startCol: BOARD_COLS,
        direction: -1,
        palette: ENEMY_COLORS,
      });

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

      selections.player1 = [];
      selections.player2 = [];
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
      if (isPlayerVsAI && currentPicker === 'player2') {
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
      
      if (turnOrder.length > 0) {
        highlightRange(turnOrder[turnIndex]);
        startTurn(turnOrder[turnIndex]);
      }
    }



    function handleModeSelection(mode) {
      if (draftActive || gameStarted) return;
      showDraftScreen();
      beginDraft(mode);
    }

    modeSelection.addEventListener('click', (event) => {
      const button = event.target.closest('[data-mode]');
      if (!button) return;
      handleModeSelection(button.dataset.mode);
    });

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

         // 2. CASILLAS ROJAS (Para lanzar objeto contra enemigo)
         // Solo si tenemos un objeto levantado
         if (isObject && occupant && occupant.dataset.team !== attacker.dataset.team) {
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
          if (isObject) {
              instruction += ` O selecciona un ENEMIGO para lanzárselo.`;
          }
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
    
    // Animación visual (Simple: movemos el objeto encima del enemigo)
    const targetSquare = getPieceSquare(targetPiece);
    await animatePieceToSquare(objectElement, targetSquare, { duration: 600 });
    
    // Sonido impacto
    playEffectSound(punchSound);

    // Aplicar daño
    // NOTA: Los objetos lanzados ignoran defensa, es daño directo (salvo invulnerabilidad si quisieras programarlo)
    // Aquí aplicamos lógica simple de daño directo.
    let appliedDamage = damage;
    
    // Reducción por dureza/invulnerable (Opcional, pero consistente con el juego)
    let resistance = 0;
    if (hasPassive(targetStats, 'dureza')) resistance = 1;
    if (hasPassive(targetStats, 'invulnerable')) resistance = 2;
    appliedDamage = Math.max(0, damage - resistance);

    targetStats.currentVida = Math.max(0, targetStats.currentVida - appliedDamage);
    
    // Puntos
    if (isEnemy(attacker, targetPiece)) {
        addPoints(attacker, appliedDamage * SCORE_PER_DAMAGE);
    }

    // Mensaje
    const msg = `${attackerStats.name} lanza ${objectName} a ${targetStats.name}.\nDaño base: ${damage}. Resistencia: ${resistance}.\nDaño final: ${appliedDamage}.`;
    addHistoryEntry(attacker.dataset.team, msg, { attacker, defenders: [targetPiece] });

    // Destruir objeto
    objectElement.remove();

    // Comprobar muerte
    if (targetStats.currentVida <= 0) {
        queueDeathMessage(`${targetStats.name} eliminado por impacto de objeto.`);
        if (isEnemy(attacker, targetPiece)) addPoints(attacker, SCORE_PER_KILL);
        eliminatePiece(targetPiece);
    }
    
    renderLifeCards();
    cancelTelekinesis(); // Limpia estados
    
    await showTurnPopup(msg);
    finishTurn(attacker, { showPopup: false });
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
      if (isPlayerVsAI && activePiece.dataset.team === 'enemigo') return;

      playEffectSound(passTurnSound);
      finishTurn(activePiece);
    });

    attackButton.addEventListener('click', () => {
      const activePiece = turnOrder[turnIndex];
      if (!activePiece) return;
      
      // Bloqueo IA
      if (isPlayerVsAI && activePiece.dataset.team === 'enemigo') return;

      if (!selectedTarget) return;

      // Efecto visual del botón
      attackButton.classList.remove('button--pulse');

      // Ejecutar la acción según lo que esté seleccionado
      if (currentAction === 'explosion') {
        resolveExplosion(activePiece, selectedTarget);
      } else {
        // Ataques normales, Incapacitar, Control Mental, etc.
        resolveAttack(activePiece, selectedTarget, currentAction);
      }
    });

    // -----------------------------------------------------------

  initNormalGame();
