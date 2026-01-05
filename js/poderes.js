const poderes = {
  avispa: {
    activos: [
      {
        nombre: 'Incapacitar',
        descripcion: 'Aturde a un objetivo si el ataque impacta, obligándolo a perder su siguiente turno sin causar daño.',
      },
    ],
    pasivos: [
    ],
  },
  thor: {
    activos: [],
    pasivos: [],
  },
  'iron-man': {
    activos: [
      {
        nombre: 'Explosión',
        descripcion: 'Ataque de área que afecta al objetivo y a los adyacentes con una sola tirada.',
      },
    ],
    pasivos: [
      {
        nombre: 'Astucia',
        descripcion: 'Consigue crítico con 11 o 12 en la tirada de ataque.',
      },
      {
        nombre: 'Regeneración',
        descripcion: 'Recupera 1 punto de vida al final de su turno si no está al máximo.',
      },
    ],
  },
  hulka: {
    activos: [],
    pasivos: [],
  },
  'bruja-escarlata': {
    activos: [
      {
        nombre: 'Probabilidad',
        descripcion:
          'Bendice a un aliado y a las casillas adyacentes: los afectados mejoran su crítico durante 2 turnos.',
      },
    ],
    pasivos: [
      {
        nombre: 'Astucia',
        descripcion: 'Consigue crítico con 11 o 12 en la tirada de ataque.',
      },
    ],
  },
  thanos: {
    activos: [],
    pasivos: [
      {
        nombre: 'Regeneración',
        descripcion: 'Recupera 1 punto de vida al final de su turno si no está al máximo.',
      },
    ],
  },
  magneto: {
    activos: [],
    pasivos: [],
  },
  kang: {
    activos: [
      {
        nombre: 'Pulso',
        descripcion: 'Impacta en área a todo lo que esté dentro de su rango sin elegir un objetivo concreto.',
      },
      {
        nombre: 'Incapacitar',
        descripcion: 'Aturde a su objetivo si impacta, obligándolo a perder su siguiente turno.',
      },
    ],
    pasivos: [
      {
        nombre: 'Fase',
        descripcion: 'Puede moverse a través de aliados y enemigos, pero nunca terminar en una casilla ocupada.',
      },
    ],
  },
  'super-skrull': {
    activos: [
      {
        nombre: 'Incapacitar',
        descripcion: 'Aturde a su objetivo si impacta, obligándolo a perder su siguiente turno.',
      },
    ],
    pasivos: [],
  },
  blade: {
    activos: [],
    pasivos: [
      {
        nombre: 'Sigilo',
        descripcion:
          'Obtiene +2 a la defensa cuando está detrás de un objeto o arbusto al sufrir una tirada de ataque.',
      },
      {
        nombre: 'Garras/Comillos/Cuchillos/Espadas',
        descripcion:
          'Si logra impactar en ataque, lanza 1d6 para actualizar su daño base ese turno (nunca inferior al daño base).',
      },
      {
        nombre: 'Resistencia',
        descripcion: 'Reduce en 1 todo el daño recibido tanto de ataques cuerpo a cuerpo como a distancia.',
      },
    ],
  },
  hulk: {
    activos: [
    ],
    pasivos: [
      {
        nombre: 'Regeneración',
        descripcion: 'Recupera 1 punto de vida al final de su turno si no está al máximo.',
      },
    ],
  },
  capitan: {
    activos: [
    ],
    pasivos: [
      {
        nombre: 'Astucia',
        descripcion: 'Consigue crítico con 11 o 12 en la tirada de ataque.',
      },
    ],
  },
  spider: {
    activos: [
      {
        nombre: 'Incapacitar',
        descripcion: 'Si impacta, el defensor pierde su siguiente turno en lugar de recibir daño.',
      },
    ],
    pasivos: [
      {
        nombre: 'Astucia',
        descripcion: 'Consigue crítico con 11 o 12 en la tirada de ataque.',
      },
    ],
  },
  lobezno: {
    activos: [
    ],
    pasivos: [
      {
        nombre: 'Regeneración',
        descripcion: 'Recupera 1 punto de vida al final de su turno si no está al máximo.',
      },
      {
        nombre: 'Garras',
        descripcion: 'El daño cuerpo a cuerpo se lanza con 1d6; nunca inferior a su daño base.',
      },
    ],
  },
  ciclope: {
    activos: [
    ],
    pasivos: [
    ],
  },
  chaquetaAmarilla: {
    activos: [
      {
        nombre: 'Incapacitar',
        descripcion: 'Aturde al objetivo si impacta, sin causar daño.',
      },
    ],
    pasivos: [
    ],
  },
  duende: {
    activos: [
      {
        nombre: 'Incapacitar',
        descripcion: 'Embiste y deja fuera de combate durante un turno si acierta.',
      },
    ],
    pasivos: [
    ],
  },
  dientesDeSable: {
    activos: [
    ],
    pasivos: [
      {
        nombre: 'Garras',
        descripcion: 'El daño cuerpo a cuerpo se lanza con 1d6; nunca inferior a su daño base.',
      },
      {
        nombre: 'Regeneración',
        descripcion: 'Recupera 1 punto de vida al final de su turno si no está al máximo.',
      },
    ],
  },
  medicoShield: {
    activos: [
      {
        nombre: 'Curar',
        descripcion:
          'Elige a un aliado y realiza una tirada de ataque cuerpo a cuerpo usando ataque + daño recibido del objetivo + 2d6. Si iguala o supera la defensa, cura 1d6 (sin exceder el daño sufrido).',
      },
    ],
    pasivos: [],
  },
  medicoHydra: {
    activos: [
      {
        nombre: 'Curar',
        descripcion:
          'Elige a un aliado y realiza una tirada de ataque cuerpo a cuerpo usando ataque + daño recibido del objetivo + 2d6. Si iguala o supera la defensa, cura 1d6 (sin exceder el daño sufrido).',
      },
    ],
    pasivos: [],
  },
  boomerang: {
    activos: [
      {
        nombre: 'Incapacitar',
        descripcion: 'Busca aturdir a su objetivo si impacta.',
      },
      {
        nombre: 'Explosión',
        descripcion: 'Ataque de área que afecta al objetivo y a los adyacentes con una sola tirada.',
      },
    ],
    pasivos: [
    ],
  },
  juggernaut: {
    activos: [
    ],
    pasivos: [
    ],
  },
  mole: {
    activos: [
      {
        nombre: 'Incapacitar',
        descripcion: 'Aplica un golpe preciso que hace perder el siguiente turno al rival.',
      },
    ],
    pasivos: [
    ],
  },
  cosa: {
    activos: [],
    pasivos: [],
  },
  antorcha: {
    activos: [
      {
        nombre: 'Explosión',
        descripcion: 'Ataque de área que afecta al objetivo y a los adyacentes con una sola tirada.',
      },
      {
        nombre: 'Pulso',
        descripcion:
          'El atacante detona en su posición. Afecta en un radio igual a su rango, sin elegir objetivo.',
      },
    ],
    pasivos: [],
  },
  doom: {
    activos: [
      {
        nombre: 'Explosión',
        descripcion: 'Ataque de área que afecta al objetivo y a los adyacentes con una sola tirada.',
      },
      {
        nombre: 'Incapacitar',
        descripcion: 'Aturde al objetivo si impacta, sin causar daño.',
      },
    ],
    pasivos: [
      {
        nombre: 'Astucia',
        descripcion: 'Consigue crítico con 11 o 12 en la tirada de ataque.',
      },
    ],
  },
  ultron: {
    activos: [
      {
        nombre: 'Explosión',
        descripcion: 'Ataque de área que afecta al objetivo y a los adyacentes con una sola tirada.',
      },
    ],
    pasivos: [],
  },
};

const activosGenerales = [
  {
    nombre: 'Incapacitar',
    descripcion:
      'Si la tirada de ataque impacta, el defensor queda incapacitado y solo puede pasar su siguiente turno. No puede usarse sobre objetivos ya incapacitados.',
  },
  {
    nombre: 'Explosión',
    descripcion:
      'Ataque que afecta al objetivo y a todas las casillas adyacentes, incluyendo aliados y el propio atacante si se encuentra en el área. Se compara la tirada con cada personaje y se resuelve el daño individualmente.',
  },
  {
    nombre: 'Telekinesis',
    descripcion:
      'Permite agarrar objetos pesados o livianos dentro de su rango y usarlos cuerpo a cuerpo o a distancia respetando su rango normal.',
  },
  {
    nombre: 'Control Mental',
    descripcion:
      'Realiza una tirada de ataque normal; si acierta, el defensor juega su siguiente turno para el equipo rival como si fuera un miembro de ese equipo.',
  },
  {
    nombre: 'Pulso',
    descripcion:
      'Ataque en área que afecta al objetivo y a las casillas adyacentes. El atacante compara su tirada con cada personaje, pero no se hiere a sí mismo. Puede dañar a aliados.',
  },
  {
    nombre: 'Barrera',
    descripcion: 'Crea un obstáculo vertical de tres casillas, situando la casilla objetivo en el centro de la barrera.',
  },
  {
    nombre: 'Mejora de Ataque',
    descripcion:
      'Aplica a un aliado (o a sí mismo) y a los aliados adyacentes una mejora de +1 al ataque durante 2 turnos. El bono máximo sobre el ataque base es 1; aplicar de nuevo solo renueva la duración.',
  },
  {
    nombre: 'Mejora de Agilidad',
    descripcion:
      'Aplica a un aliado (o a sí mismo) y a los aliados adyacentes una mejora de +10 a la agilidad durante 2 turnos. El bono máximo sobre la agilidad base es 10; aplicar de nuevo solo renueva la duración.',
  },
  {
    nombre: 'Mejora de Defensa',
    descripcion:
      'Aplica a un aliado (o a sí mismo) y a los aliados adyacentes una mejora de +1 a la defensa durante 2 turnos. El bono máximo sobre la defensa base es 1; aplicar de nuevo solo renueva la duración.',
  },
  {
    nombre: 'Mejora de Crítico',
    descripcion:
      'Otorga Astucia durante 2 turnos a un aliado (o a sí mismo) y a los aliados adyacentes. Si ya tienen Astucia, también consiguen crítico con 10. Aplicaciones adicionales solo renuevan la duración.',
  },
];

const pasivosGenerales = [
  {
    nombre: 'Volar/Saltar/Trepar/Fase',
    descripcion: 'Puede cruzar obstáculos y enemigos al moverse, siempre que termine el desplazamiento en una casilla libre.',
  },
  {
    nombre: 'Experto a/d',
    descripcion: 'Añade +2 al daño base en cada ataque a distancia.',
  },
  {
    nombre: 'Invulnerable a/d',
    descripcion: 'Reduce en 2 el daño recibido de ataques a distancia.',
  },
  {
    nombre: 'Regeneración',
    descripcion: 'Recupera 1 punto de vida al finalizar su turno si está por debajo de su vida base.',
  },
  {
    nombre: 'Superfuerza',
    descripcion:
      'Puede agarrar objetos pesados o livianos estando adyacente (pierde ese turno) y luego usarlos c/c o a/d: rango 2 para pesados, 3 para livianos; 2 usos c/c y 1 a/d por objeto.',
  },
  {
    nombre: 'Invulnerable',
    descripcion: 'Aumenta en 2 la resistencia frente a ataques cuerpo a cuerpo y a distancia.',
  },
  {
    nombre: 'Astucia',
    descripcion: 'Consigue crítico con 11 o 12 en tiradas de ataque de 2d6.',
  },
  {
    nombre: 'Doble ataque c/c',
    descripcion:
      'Realiza dos ataques cuerpo a cuerpo consecutivos contra el mismo objetivo, resolviendo el daño tras cada tirada si el defensor sigue en pie.',
  },
  {
    nombre: 'Robo de vida',
    descripcion:
      'Cada vez que inflige daño, recupera esa misma cantidad en puntos de vida sin superar su vida base.',
  },
];

if (typeof window !== 'undefined') {
  window.poderes = poderes;
  window.activosGenerales = activosGenerales;
  window.pasivosGenerales = pasivosGenerales;
}
