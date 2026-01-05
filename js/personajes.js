const poderesFuente =
  (typeof window !== 'undefined' && window.poderes) ||
  (typeof poderes !== 'undefined' ? poderes : {});

const personajes = {
  agenteShield: {
    nombre: 'Agente SHIELD',
    movimiento: 3,
    ataque: 7,
    defensa: 15,
    dano: 2,
    rango: 3,
    vida: 4,
    agilidad: 0,
    imagen: 'imagenes/agenteShield.webp',
    animacion: 'animaciones/agenteShield.webp',
    poderes: poderesFuente.agenteShield,
    habilidades: { activas: [], pasivas: [] }
  },

  medicoShield: {
    nombre: 'Médico SHIELD',
    movimiento: 3,
    ataque: 6,
    defensa: 14,
    dano: 1,
    rango: 2,
    vida: 4,
    agilidad: 0,
    imagen: 'imagenes/medicoShield.webp',
    animacion: 'animaciones/medicoShield.webp',
    poderes: poderesFuente.medicoShield,
    habilidades: { activas: ['curar'], pasivas: [] }
  },

  agenteHydra: {
    nombre: 'Agente HYDRA',
    movimiento: 3,
    ataque: 7,
    defensa: 14,
    dano: 2,
    rango: 3,
    vida: 4,
    agilidad: 0,
    imagen: 'imagenes/agenteHydra.webp',
    animacion: 'animaciones/agenteHydra.webp',
    poderes: poderesFuente.agenteHydra,
    habilidades: { activas: [], pasivas: [] }
  },

  medicoHydra: {
    nombre: 'Médico HYDRA',
    movimiento: 3,
    ataque: 7,
    defensa: 14,
    dano: 1,
    rango: 2,
    vida: 4,
    agilidad: 0,
    imagen: 'imagenes/medicoHydra.webp',
    animacion: 'animaciones/medicoHydra.webp',
    poderes: poderesFuente.medicoHydra,
    habilidades: { activas: ['curar'], pasivas: [] }
  },

  maton: {
    nombre: 'Matón',
    movimiento: 3,
    ataque: 7,
    defensa: 14,
    dano: 2,
    rango: 0,
    vida: 4,
    agilidad: 0,
    imagen: 'imagenes/maton.webp',
    animacion: 'animaciones/maton.webp',
    poderes: poderesFuente.maton,
    habilidades: { activas: [], pasivas: [] }
  },

  esbirro: {
    nombre: 'Esbirro',
    movimiento: 3,
    ataque: 7,
    defensa: 13,
    dano: 2,
    rango: 2,
    vida: 5,
    agilidad: 0,
    imagen: 'imagenes/esbirro.webp',
    animacion: 'animaciones/esbirro.webp',
    poderes: poderesFuente.esbirro,
    habilidades: { activas: [], pasivas: [] }
  },

  agenteSkrull: {
    nombre: 'Agente Skrull',
    movimiento: 4,
    ataque: 7,
    defensa: 15,
    dano: 2,
    rango: 3,
    vida: 4,
    agilidad: 0,
    imagen: 'imagenes/agenteSkrull.webp',
    animacion: 'animaciones/agenteSkrull.webp',
    poderes: poderesFuente.agenteSkrull,
    habilidades: { activas: [], pasivas: [] }
  },

  guerreroSkrull: {
    nombre: 'Guerrero Skrull',
    movimiento: 4,
    ataque: 8,
    defensa: 16,
    dano: 2,
    rango: 4,
    vida: 4,
    agilidad: 0,
    imagen: 'imagenes/guerreroSkrull.webp',
    animacion: 'animaciones/guerreroSkrull.webp',
    poderes: poderesFuente.guerreroSkrull,
    habilidades: { activas: [], pasivas: [] }
  },

  blade: {
    nombre: 'Blade',
    movimiento: 4,
    ataque: 8,
    defensa: 15,
    dano: 2,
    rango: 0,
    vida: 6,
    agilidad: 30,
    imagen: 'imagenes/blade.webp',
    animacion: 'animaciones/blade.webp',
    poderes: poderesFuente.blade,
    habilidades: { activas: [], pasivas: ['Sigilo', 'Garras/Comillos/Cuchillos/Espadas', 'Resistencia'] }
  },

  avispa: {
    nombre: 'Avispa',
    movimiento: 4,
    ataque: 8,
    defensa: 19,
    dano: 2,
    rango: 3,
    vida: 5,
    agilidad: 20,
    imagen: 'imagenes/avispa.webp',
    animacion: 'animaciones/avispa.webp',
    poderes: poderesFuente.avispa,
    habilidades: { activas: ['incapacitar'], pasivas: [] }
  },

  constrictor: {
    nombre: 'Constrictor',
    movimiento: 3,
    ataque: 10,
    defensa: 15,
    dano: 2,
    rango: 2,
    vida: 6,
    agilidad: 10,
    imagen: 'imagenes/avispa.webp',
    animacion: 'animaciones/avispa.webp',
    poderes: poderesFuente.avispa,
    habilidades: { activas: ['incapacitar'], pasivas: [] }
  },

  boomerang: {
    nombre: 'Boomerang',
    movimiento: 3,
    ataque: 9,
    defensa: 15,
    dano: 1,
    rango: 4,
    vida: 5,
    agilidad: 30,
    imagen: 'imagenes/avispa.webp',
    animacion: 'animaciones/avispa.webp',
    poderes: poderesFuente.avispa,
    habilidades: { activas: ['incapacitar'], pasivas: [] }
  },

  kingpin: {
    nombre: 'Kingpin',
    movimiento: 3,
    ataque: 8,
    defensa: 16,
    dano: 2,
    rango: 0,
    vida: 7,
    agilidad: 10,
    imagen: 'imagenes/avispa.webp',
    animacion: 'animaciones/avispa.webp',
    poderes: poderesFuente.avispa,
    habilidades: { activas: ['incapacitar'], pasivas: [] }
  },

  buitre: {
    nombre: 'Buitre',
    movimiento: 4,
    ataque: 8,
    defensa: 16,
    dano: 2,
    rango: 0,
    vida: 5,
    agilidad: 30,
    imagen: 'imagenes/avispa.webp',
    animacion: 'animaciones/avispa.webp',
    poderes: poderesFuente.avispa,
    habilidades: { activas: ['incapacitar'], pasivas: [] }
  },

  jeanGrey: {
    nombre: 'Jean Grey',
    movimiento: 3,
    ataque: 7,
    defensa: 16,
    dano: 1,
    rango: 0,
    vida: 6,
    agilidad: 10,
    imagen: 'imagenes/avispa.webp',
    animacion: 'animaciones/avispa.webp',
    poderes: poderesFuente.avispa,
    habilidades: { activas: ['incapacitar'], pasivas: [] }
  },

  duende: {
    nombre: 'Duende',
    movimiento: 4,
    ataque: 9,
    defensa: 16,
    dano: 2,
    rango: 3,
    vida: 7,
    agilidad: 30,
    imagen: 'imagenes/avispa.webp',
    animacion: 'animaciones/avispa.webp',
    poderes: poderesFuente.avispa,
    habilidades: { activas: ['incapacitar'], pasivas: [] }
  },

  dientesDeSable: {
    nombre: 'Dientes de Sable',
    movimiento: 4,
    ataque: 10,
    defensa: 16,
    dano: 3,
    rango: 0,
    vida: 8,
    agilidad: 30,
    imagen: 'imagenes/avispa.webp',
    animacion: 'animaciones/avispa.webp',
    poderes: poderesFuente.avispa,
    habilidades: { activas: ['incapacitar'], pasivas: [] }
  },

  hulk: {
    nombre: 'Hulk',
    movimiento: 5,
    ataque: 12,
    defensa: 17,
    dano: 5,
    rango: 0,
    vida: 10,
    agilidad: 10,
    imagen: 'imagenes/avispa.webp',
    animacion: 'animaciones/avispa.webp',
    poderes: poderesFuente.avispa,
    habilidades: { activas: ['incapacitar'], pasivas: [] }
  },

  maestroMarionetas: {
    nombre: 'Maestro Marionetas',
    movimiento: 3,
    ataque: 7,
    defensa: 15,
    dano: 1,
    rango: 2,
    vida: 5,
    agilidad: 10,
    imagen: 'imagenes/avispa.webp',
    animacion: 'animaciones/avispa.webp',
    poderes: poderesFuente.avispa,
    habilidades: { activas: ['incapacitar'], pasivas: [] }
  },

  annihilus: {
    nombre: 'Annihilus',
    movimiento: 4,
    ataque: 11,
    defensa: 16,
    dano: 3,
    rango: 5,
    vida: 9,
    agilidad: 40,
    imagen: 'imagenes/avispa.webp',
    animacion: 'animaciones/avispa.webp',
    poderes: poderesFuente.avispa,
    habilidades: { activas: ['incapacitar'], pasivas: [] }
  },

  capitanAmerica: {
    nombre: 'Capitán América',
    movimiento: 4,
    ataque: 10,
    defensa: 17,
    dano: 2,
    rango: 3,
    vida: 8,
    agilidad: 40,
    imagen: 'imagenes/avispa.webp',
    animacion: 'animaciones/avispa.webp',
    poderes: poderesFuente.avispa,
    habilidades: { activas: ['incapacitar'], pasivas: [] }
  },

  spiderMan: {
    nombre: 'Spider-Man',
    movimiento: 5,
    ataque: 12,
    defensa: 18,
    dano: 2,
    rango: 3,
    vida: 9,
    agilidad: 50,
    imagen: 'imagenes/avispa.webp',
    animacion: 'animaciones/avispa.webp',
    poderes: poderesFuente.avispa,
    habilidades: { activas: ['incapacitar'], pasivas: [] }
  },

  lobezno: {
    nombre: 'Lobezno',
    movimiento: 4,
    ataque: 12,
    defensa: 16,
    dano: 2,
    rango: 0,
    vida: 8,
    agilidad: 30,
    imagen: 'imagenes/avispa.webp',
    animacion: 'animaciones/avispa.webp',
    poderes: poderesFuente.avispa,
    habilidades: { activas: ['incapacitar'], pasivas: [] }
  },

  profesorXavier: {
    nombre: 'Profesor Xavier',
    movimiento: 6,
    ataque: 11,
    defensa: 16,
    dano: 0,
    rango: 10,
    vida: 7,
    agilidad: 10,
    imagen: 'imagenes/avispa.webp',
    animacion: 'animaciones/avispa.webp',
    poderes: poderesFuente.avispa,
    habilidades: { activas: ['incapacitar'], pasivas: [] }
  },

  juggernaut: {
    nombre: 'Juggernaut',
    movimiento: 4,
    ataque: 13,
    defensa: 18,
    dano: 4,
    rango: 0,
    vida: 10,
    agilidad: 0,
    imagen: 'imagenes/avispa.webp',
    animacion: 'animaciones/avispa.webp',
    poderes: poderesFuente.avispa,
    habilidades: { activas: ['incapacitar'], pasivas: [] }
  },

  ciclope: {
    nombre: 'Cíclope',
    movimiento: 3,
    ataque: 11,
    defensa: 15,
    dano: 2,
    rango: 5,
    vida: 6,
    agilidad: 20,
    imagen: 'imagenes/avispa.webp',
    animacion: 'animaciones/avispa.webp',
    poderes: poderesFuente.avispa,
    habilidades: { activas: ['incapacitar'], pasivas: [] }
  },

  panteraNegra: {
    nombre: 'Pantera Negra',
    movimiento: 5,
    ataque: 9,
    defensa: 16,
    dano: 2,
    rango: 2,
    vida: 6,
    agilidad: 40,
    imagen: 'imagenes/avispa.webp',
    animacion: 'animaciones/avispa.webp',
    poderes: poderesFuente.avispa,
    habilidades: { activas: ['incapacitar'], pasivas: [] }
  },

  ventisca: {
    nombre: 'Ventisca',
    movimiento: 4,
    ataque: 11,
    defensa: 16,
    dano: 1,
    rango: 4,
    vida: 6,
    agilidad: 10,
    imagen: 'imagenes/avispa.webp',
    animacion: 'animaciones/avispa.webp',
    poderes: poderesFuente.avispa,
    habilidades: { activas: ['incapacitar'], pasivas: [] }
  },

  pyro: {
    nombre: 'Pyro',
    movimiento: 4,
    ataque: 9,
    defensa: 17,
    dano: 1,
    rango: 4,
    vida: 6,
    agilidad: 10,
    imagen: 'imagenes/avispa.webp',
    animacion: 'animaciones/avispa.webp',
    poderes: poderesFuente.avispa,
    habilidades: { activas: ['incapacitar'], pasivas: [] }
  },

  torbellino: {
    nombre: 'Torbellino',
    movimiento: 6,
    ataque: 8,
    defensa: 16,
    dano: 3,
    rango: 0,
    vida: 6,
    agilidad: 40,
    imagen: 'imagenes/avispa.webp',
    animacion: 'animaciones/avispa.webp',
    poderes: poderesFuente.avispa,
    habilidades: { activas: ['incapacitar'], pasivas: [] }
  },

  daredevil: {
    nombre: 'Daredevil',
    movimiento: 4,
    ataque: 9,
    defensa: 17,
    dano: 2,
    rango: 2,
    vida: 6,
    agilidad: 40,
    imagen: 'imagenes/avispa.webp',
    animacion: 'animaciones/avispa.webp',
    poderes: poderesFuente.avispa,
    habilidades: { activas: ['incapacitar'], pasivas: [] }
  },

  bullseye: {
    nombre: 'Bullseye',
    movimiento: 3,
    ataque: 11,
    defensa: 16,
    dano: 1,
    rango: 5,
    vida: 6,
    agilidad: 50,
    imagen: 'imagenes/avispa.webp',
    animacion: 'animaciones/avispa.webp',
    poderes: poderesFuente.avispa,
    habilidades: { activas: ['incapacitar'], pasivas: [] }
  },

  brujaEscarlata: {
    nombre: 'Bruja Escarlata',
    movimiento: 3,
    ataque: 8,
    defensa: 16,
    dano: 1,
    rango: 4,
    vida: 5,
    agilidad: 10,
    imagen: 'imagenes/avispa.webp',
    animacion: 'animaciones/avispa.webp',
    poderes: poderesFuente.avispa,
    habilidades: { activas: ['incapacitar'], pasivas: [] }
  },

  mercurio: {
    nombre: 'Mercurio',
    movimiento: 7,
    ataque: 9,
    defensa: 16,
    dano: 2,
    rango: 0,
    vida: 6,
    agilidad: 70,
    imagen: 'imagenes/avispa.webp',
    animacion: 'animaciones/avispa.webp',
    poderes: poderesFuente.avispa,
    habilidades: { activas: ['incapacitar'], pasivas: [] }
  },

  mrHyde: {
    nombre: 'Mr Hyde',
    movimiento: 4,
    ataque: 11,
    defensa: 15,
    dano: 3,
    rango: 0,
    vida: 7,
    agilidad: 10,
    imagen: 'imagenes/avispa.webp',
    animacion: 'animaciones/avispa.webp',
    poderes: poderesFuente.avispa,
    habilidades: { activas: ['incapacitar'], pasivas: [] }
  },

  klaw: {
    nombre: 'Klaw',
    movimiento: 4,
    ataque: 11,
    defensa: 16,
    dano: 2,
    rango: 5,
    vida: 8,
    agilidad: 20,
    imagen: 'imagenes/avispa.webp',
    animacion: 'animaciones/avispa.webp',
    poderes: poderesFuente.avispa,
    habilidades: { activas: ['incapacitar'], pasivas: [] }
  },

  controller: {
    nombre: 'Controller',
    movimiento: 3,
    ataque: 12,
    defensa: 17,
    dano: 3,
    rango: 0,
    vida: 7,
    agilidad: 30,
    imagen: 'imagenes/avispa.webp',
    animacion: 'animaciones/avispa.webp',
    poderes: poderesFuente.avispa,
    habilidades: { activas: ['incapacitar'], pasivas: [] }
  },

  hercules: {
    nombre: 'Hércules',
    movimiento: 4,
    ataque: 11,
    defensa: 15,
    dano: 4,
    rango: 0,
    vida: 9,
    agilidad: 20,
    imagen: 'imagenes/avispa.webp',
    animacion: 'animaciones/avispa.webp',
    poderes: poderesFuente.avispa,
    habilidades: { activas: ['incapacitar'], pasivas: [] }
  },

  picara: {
    nombre: 'Pícara',
    movimiento: 5,
    ataque: 10,
    defensa: 15,
    dano: 3,
    rango: 0,
    vida: 8,
    agilidad: 20,
    imagen: 'imagenes/avispa.webp',
    animacion: 'animaciones/avispa.webp',
    poderes: poderesFuente.avispa,
    habilidades: { activas: ['incapacitar'], pasivas: [] }
  },

  drExtrano: {
    nombre: 'Dr Extraño',
    movimiento: 3,
    ataque: 11,
    defensa: 17,
    dano: 2,
    rango: 5,
    vida: 8,
    agilidad: 20,
    imagen: 'imagenes/avispa.webp',
    animacion: 'animaciones/avispa.webp',
    poderes: poderesFuente.avispa,
    habilidades: { activas: ['incapacitar'], pasivas: [] }
  },

  magneto: {
    nombre: 'Magneto',
    movimiento: 5,
    ataque: 10,
    defensa: 17,
    dano: 4,
    rango: 4,
    vida: 8,
    agilidad: 30,
    imagen: 'imagenes/avispa.webp',
    animacion: 'animaciones/avispa.webp',
    poderes: poderesFuente.avispa,
    habilidades: { activas: ['incapacitar'], pasivas: [] }
  },

  kang: {
    nombre: 'Kang',
    movimiento: 5,
    ataque: 13,
    defensa: 18,
    dano: 2,
    rango: 5,
    vida: 9,
    agilidad: 10,
    imagen: 'imagenes/avispa.webp',
    animacion: 'animaciones/avispa.webp',
    poderes: poderesFuente.avispa,
    habilidades: { activas: ['incapacitar'], pasivas: [] }
  },

  ultron: {
    nombre: 'Ultrón',
    movimiento: 6,
    ataque: 14,
    defensa: 18,
    dano: 3,
    rango: 5,
    vida: 10,
    agilidad: 30,
    imagen: 'imagenes/avispa.webp',
    animacion: 'animaciones/avispa.webp',
    poderes: poderesFuente.avispa,
    habilidades: { activas: ['incapacitar'], pasivas: [] }
  },

  firelord: {
    nombre: 'Firelord',
    movimiento: 6,
    ataque: 13,
    defensa: 18,
    dano: 2,
    rango: 4,
    vida: 10,
    agilidad: 60,
    imagen: 'imagenes/avispa.webp',
    animacion: 'animaciones/avispa.webp',
    poderes: poderesFuente.avispa,
    habilidades: { activas: ['incapacitar'], pasivas: [] }
  },

  vision: {
    nombre: 'Vision',
    movimiento: 5,
    ataque: 11,
    defensa: 17,
    dano: 3,
    rango: 5,
    vida: 10,
    agilidad: 20,
    imagen: 'imagenes/avispa.webp',
    animacion: 'animaciones/avispa.webp',
    poderes: poderesFuente.avispa,
    habilidades: { activas: ['incapacitar'], pasivas: [] }
  },

  quasar: {
    nombre: 'Quasar',
    movimiento: 5,
    ataque: 11,
    defensa: 18,
    dano: 1,
    rango: 5,
    vida: 8,
    agilidad: 20,
    imagen: 'imagenes/avispa.webp',
    animacion: 'animaciones/avispa.webp',
    poderes: poderesFuente.avispa,
    habilidades: { activas: ['incapacitar'], pasivas: [] }
  },

  thanos: {
    nombre: 'Thanos',
    movimiento: 6,
    ataque: 15,
    defensa: 18,
    dano: 4,
    rango: 5,
    vida: 11,
    agilidad: 30,
    imagen: 'imagenes/avispa.webp',
    animacion: 'animaciones/avispa.webp',
    poderes: poderesFuente.avispa,
    habilidades: { activas: ['incapacitar'], pasivas: [] }
  },

  pesadilla: {
    nombre: 'Pesadilla',
    movimiento: 5,
    ataque: 14,
    defensa: 18,
    dano: 3,
    rango: 0,
    vida: 10,
    agilidad: 80,
    imagen: 'imagenes/avispa.webp',
    animacion: 'animaciones/avispa.webp',
    poderes: poderesFuente.avispa,
    habilidades: { activas: ['incapacitar'], pasivas: [] }
  },
  centinela: {
    nombre: 'Centinela',
    movimiento: 12,
    ataque: 11,
    defensa: 17,
    dano: 4,
    rango: 10,
    vida: 18,
    agilidad: 20,
    imagen: 'imagenes/avispa.webp',
    animacion: 'animaciones/avispa.webp',
    poderes: poderesFuente.avispa,
    habilidades: { activas: ['incapacitar'], pasivas: [] }
  },
};

if (typeof window !== 'undefined') {
  window.personajes = personajes;
}
