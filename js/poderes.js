const poderes = {
  avispa: {
    activos: [
      {
        nombre: 'Picadura Atómica',
        descripcion: 'Un rayo concentrado que inflige daño a distancia y reduce la agilidad del objetivo temporalmente.',
      },
      {
        nombre: 'Micromovilización',
        descripcion: 'Reduce su tamaño para atravesar casillas ocupadas y reposicionarse sin provocar ataques de oportunidad.',
      },
    ],
    pasivos: [
      {
        nombre: 'Ala cuántica',
        descripcion: 'Obtiene un ligero bono de esquiva al moverse y es más difícil de acertar a larga distancia.',
      },
    ],
  },
  hulk: {
    activos: [
      {
        nombre: 'Golpe de Trueno',
        descripcion: 'Un ataque cuerpo a cuerpo que empuja al objetivo y puede derribar a enemigos cercanos.',
      },
      {
        nombre: 'Salto Colosal',
        descripcion: 'Hulk salta varias casillas ignorando obstáculos para caer causando daño en área.',
      },
    ],
    pasivos: [
      {
        nombre: 'Ira Desatada',
        descripcion: 'Cada vez que recibe daño aumenta su ataque en el siguiente turno.',
      },
    ],
  },
  capitan: {
    activos: [
      {
        nombre: 'Lanzamiento de Escudo',
        descripcion: 'Ataque a distancia que puede rebotar entre múltiples objetivos.',
      },
    ],
    pasivos: [
      {
        nombre: 'Liderazgo Táctico',
        descripcion: 'Los aliados adyacentes ganan bonificaciones defensivas mientras él esté en pie.',
      },
    ],
  },
  spider: {
    activos: [
      {
        nombre: 'Red Progresiva',
        descripcion: 'Enreda a un objetivo reduciendo su movimiento y aplicando daño continuo leve.',
      },
    ],
    pasivos: [
      {
        nombre: 'Sentido Arácnido',
        descripcion: 'Alta probabilidad de esquivar el primer ataque recibido en cada ronda.',
      },
    ],
  },
  lobezno: {
    activos: [
      {
        nombre: 'Corte Giratorio',
        descripcion: 'Ataque en área en las casillas adyacentes que aplica sangrado.',
      },
    ],
    pasivos: [
      {
        nombre: 'Curación Acelerada',
        descripcion: 'Recupera una pequeña cantidad de vida al final de su turno.',
      },
    ],
  },
  ciclope: {
    activos: [
      {
        nombre: 'Ráfaga Óptica',
        descripcion: 'Ataque de largo alcance que atraviesa a los enemigos en línea recta.',
      },
    ],
    pasivos: [
      {
        nombre: 'Disciplina Estratégica',
        descripcion: 'Gana precisión adicional cuando no se mueve durante su turno.',
      },
    ],
  },
  chaquetaAmarilla: {
    activos: [
      {
        nombre: 'Descarga Bioeléctrica',
        descripcion: 'Impacta a un objetivo cercano con electricidad, ralentizándolo durante un turno.',
      },
    ],
    pasivos: [
      {
        nombre: 'Armadura Ajustable',
        descripcion: 'Reduce parte del daño recibido después de moverse al menos una casilla.',
      },
    ],
  },
  duende: {
    activos: [
      {
        nombre: 'Bomba Calabaza',
        descripcion: 'Lanza un explosivo de área que inflige daño a todo lo que haya en su radio.',
      },
    ],
    pasivos: [
      {
        nombre: 'Planeador Insidioso',
        descripcion: 'Puede reposicionarse una casilla extra después de atacar a distancia.',
      },
    ],
  },
  dientesDeSable: {
    activos: [
      {
        nombre: 'Emboscada Bestial',
        descripcion: 'Se desplaza rápidamente hasta un enemigo cercano y causa un tajo profundo.',
      },
    ],
    pasivos: [
      {
        nombre: 'Instinto Predador',
        descripcion: 'Gana daño adicional cuando persigue a enemigos con poca vida.',
      },
    ],
  },
  boomerang: {
    activos: [
      {
        nombre: 'Lluvia de Boomerangs',
        descripcion: 'Ataque a distancia que puede golpear hasta dos objetivos en línea.',
      },
    ],
    pasivos: [
      {
        nombre: 'Rebote Controlado',
        descripcion: 'Recupera alcance adicional si el ataque previo falló.',
      },
    ],
  },
  juggernaut: {
    activos: [
      {
        nombre: 'Arremetida Imparable',
        descripcion: 'Se mueve varias casillas en línea recta arrasando con cualquier enemigo en su camino.',
      },
    ],
    pasivos: [
      {
      nombre: 'Masa Irresistible',
      descripcion: 'Recibe menos daño de los ataques a distancia y no puede ser empujado.',
    },
    ],
  },
  mole: {
    activos: [
      {
        nombre: 'Golpe de Túnel',
        descripcion: 'Se sumerge bajo tierra, emerge junto a un enemigo y ataca ignorando obstáculos intermedios.',
      },
    ],
    pasivos: [
      {
        nombre: 'Sigilo Subterráneo',
        descripcion: 'Es más difícil de detectar o alcanzar si terminó su movimiento en casillas vacías.',
      },
    ],
  },
};
