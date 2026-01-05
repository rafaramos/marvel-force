const poderesFuente =
  (typeof window !== 'undefined' && window.poderes) ||
  (typeof poderes !== 'undefined' ? poderes : {});

const personajes = {
  {
  agenteShield: { nombre: 'Agente SHIELD', movimiento: 3, ataque: 7, defensa: 15, dano: 2, rango: 3, vida: 4, agilidad: 0 },
  medicoShield: { nombre: 'Médico SHIELD', movimiento: 3, ataque: 6, defensa: 14, dano: 1, rango: 2, vida: 4, agilidad: 0 },
  agenteHydra: { nombre: 'Agente HYDRA', movimiento: 3, ataque: 7, defensa: 14, dano: 2, rango: 3, vida: 4, agilidad: 0 },
  medicoHydra: { nombre: 'Médico HYDRA', movimiento: 3, ataque: 7, defensa: 14, dano: 1, rango: 2, vida: 4, agilidad: 0 },
  maton: { nombre: 'Matón', movimiento: 3, ataque: 7, defensa: 14, dano: 2, rango: 0, vida: 4, agilidad: 0 },
  esbirro: { nombre: 'Esbirro', movimiento: 3, ataque: 7, defensa: 13, dano: 2, rango: 2, vida: 5, agilidad: 0 },
  agenteSkrull: { nombre: 'Agente Skrull', movimiento: 4, ataque: 7, defensa: 15, dano: 2, rango: 3, vida: 4, agilidad: 0 },
  guerreroSkrull: { nombre: 'Guerrero Skrull', movimiento: 4, ataque: 8, defensa: 16, dano: 2, rango: 4, vida: 4, agilidad: 0 },
  blade: { nombre: 'Blade', movimiento: 4, ataque: 8, defensa: 15, dano: 2, rango: 0, vida: 6, agilidad: 30 },
  avispa: { nombre: 'Avispa', movimiento: 4, ataque: 8, defensa: 19, dano: 2, rango: 3, vida: 5, agilidad: 20 },
  constrictor: { nombre: 'Constrictor', movimiento: 3, ataque: 10, defensa: 15, dano: 2, rango: 2, vida: 6, agilidad: 10 },
  boomerang: { nombre: 'Boomerang', movimiento: 3, ataque: 9, defensa: 15, dano: 1, rango: 4, vida: 5, agilidad: 30 },
  kingpin: { nombre: 'Kingpin', movimiento: 3, ataque: 8, defensa: 16, dano: 2, rango: 0, vida: 7, agilidad: 10 },
  buitre: { nombre: 'Buitre', movimiento: 4, ataque: 8, defensa: 16, dano: 2, rango: 0, vida: 5, agilidad: 30 },
  jeanGrey: { nombre: 'Jean Grey', movimiento: 3, ataque: 7, defensa: 16, dano: 1, rango: 0, vida: 6, agilidad: 10 },
  duende: { nombre: 'Duende', movimiento: 4, ataque: 9, defensa: 16, dano: 2, rango: 3, vida: 7, agilidad: 30 },
  dientesDeSable: { nombre: 'Dientes de Sable', movimiento: 4, ataque: 10, defensa: 16, dano: 3, rango: 0, vida: 8, agilidad: 30 },
  hulk: { nombre: 'Hulk', movimiento: 5, ataque: 12, defensa: 17, dano: 5, rango: 0, vida: 10, agilidad: 10 },
  maestroMarionetas: { nombre: 'Maestro Marionetas', movimiento: 3, ataque: 7, defensa: 15, dano: 1, rango: 2, vida: 5, agilidad: 10 },
  annihilus: { nombre: 'Annihilus', movimiento: 4, ataque: 11, defensa: 16, dano: 3, rango: 5, vida: 9, agilidad: 40 },
  capitanAmerica: { nombre: 'Capitán América', movimiento: 4, ataque: 10, defensa: 17, dano: 2, rango: 3, vida: 8, agilidad: 40 },
  spiderMan: { nombre: 'Spider-Man', movimiento: 5, ataque: 12, defensa: 18, dano: 2, rango: 3, vida: 9, agilidad: 50 },
  lobezno: { nombre: 'Lobezno', movimiento: 4, ataque: 12, defensa: 16, dano: 2, rango: 0, vida: 8, agilidad: 30 },
  profesorXavier: { nombre: 'Profesor Xavier', movimiento: 6, ataque: 11, defensa: 16, dano: 0, rango: 10, vida: 7, agilidad: 10 },
  juggernaut: { nombre: 'Juggernaut', movimiento: 4, ataque: 13, defensa: 18, dano: 4, rango: 0, vida: 10, agilidad: 0 },
  ciclope: { nombre: 'Cíclope', movimiento: 3, ataque: 11, defensa: 15, dano: 2, rango: 5, vida: 6, agilidad: 20 },
  panteraNegra: { nombre: 'Pantera Negra', movimiento: 5, ataque: 9, defensa: 16, dano: 2, rango: 2, vida: 6, agilidad: 40 },
  ventisca: { nombre: 'Ventisca', movimiento: 4, ataque: 11, defensa: 16, dano: 1, rango: 4, vida: 6, agilidad: 10 },
  pyro: { nombre: 'Pyro', movimiento: 4, ataque: 9, defensa: 17, dano: 1, rango: 4, vida: 6, agilidad: 10 },
  torbellino: { nombre: 'Torbellino', movimiento: 6, ataque: 8, defensa: 16, dano: 3, rango: 0, vida: 6, agilidad: 40 },
  daredevil: { nombre: 'Daredevil', movimiento: 4, ataque: 9, defensa: 17, dano: 2, rango: 2, vida: 6, agilidad: 40 },
  bullseye: { nombre: 'Bullseye', movimiento: 3, ataque: 11, defensa: 16, dano: 1, rango: 5, vida: 6, agilidad: 50 },
  brujaEscarlata: { nombre: 'Bruja Escarlata', movimiento: 3, ataque: 8, defensa: 16, dano: 1, rango: 4, vida: 5, agilidad: 10 },
  mercurio: { nombre: 'Mercurio', movimiento: 7, ataque: 9, defensa: 16, dano: 2, rango: 0, vida: 6, agilidad: 70 },
  mrHyde: { nombre: 'Mr Hyde', movimiento: 4, ataque: 11, defensa: 15, dano: 3, rango: 0, vida: 7, agilidad: 10 },
  klaw: { nombre: 'Klaw', movimiento: 4, ataque: 11, defensa: 16, dano: 2, rango: 5, vida: 8, agilidad: 20 },
  controller: { nombre: 'Controller', movimiento: 3, ataque: 12, defensa: 17, dano: 3, rango: 0, vida: 7, agilidad: 30 },
  hercules: { nombre: 'Hércules', movimiento: 4, ataque: 11, defensa: 15, dano: 4, rango: 0, vida: 9, agilidad: 20 },
  picara: { nombre: 'Pícara', movimiento: 5, ataque: 10, defensa: 15, dano: 3, rango: 0, vida: 8, agilidad: 20 },
  drExtrano: { nombre: 'Dr Extraño', movimiento: 3, ataque: 11, defensa: 17, dano: 2, rango: 5, vida: 8, agilidad: 20 },
  magneto: { nombre: 'Magneto', movimiento: 5, ataque: 10, defensa: 17, dano: 4, rango: 4, vida: 8, agilidad: 30 },
  kang: { nombre: 'Kang', movimiento: 5, ataque: 13, defensa: 18, dano: 2, rango: 5, vida: 9, agilidad: 10 },
  ultron: { nombre: 'Ultrón', movimiento: 6, ataque: 14, defensa: 18, dano: 3, rango: 5, vida: 10, agilidad: 30 },
  firelord: { nombre: 'Firelord', movimiento: 6, ataque: 13, defensa: 18, dano: 2, rango: 4, vida: 10, agilidad: 60 },
  vision: { nombre: 'Vision', movimiento: 5, ataque: 11, defensa: 17, dano: 3, rango: 5, vida: 10, agilidad: 20 },
  quasar: { nombre: 'Quasar', movimiento: 5, ataque: 11, defensa: 18, dano: 1, rango: 5, vida: 8, agilidad: 20 },
  thanos: { nombre: 'Thanos', movimiento: 6, ataque: 15, defensa: 18, dano: 4, rango: 5, vida: 11, agilidad: 30 },
  pesadilla: { nombre: 'Pesadilla', movimiento: 5, ataque: 14, defensa: 18, dano: 3, rango: 0, vida: 10, agilidad: 80 },
  centinela: { nombre: 'Centinela', movimiento: 12, ataque: 11, defensa: 17, dano: 4, rango: 10, vida: 18, agilidad: 20 }
}


};

if (typeof window !== 'undefined') {
  window.personajes = personajes;
}
