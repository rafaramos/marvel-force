const poderes = {
  agenteShield: {
    activos: [],
    pasivos: [],
  },
  medicoShield: {
    activos: [
      { nombre: 'Curar', descripcion: 'El personaje selecciona un compañero al que curar. Es como un ataque cuerpo a cuerpo con el modificador de los puntos de daño recibidos. Los puntos de daño recibidos es la diferencia entre los puntos de vida base y los actuales. Así que la tirada es ataque del atacante + daño recibido por el defensor + 2d6 deben ser iguales o mayores que la defensa del defensor. Si la tirada es acertada, el atacante tirará un 1d6 para calcular los puntos de vida que recupera el defensor, que nunca podrán ser superiores al daño recibido por el defensor.' }
    ],
    pasivos: [],
  },
  agenteHydra: {
    activos: [],
    pasivos: [],
  },
  medicoHydra: {
    activos: [
      { nombre: 'Curar', descripcion: 'El personaje selecciona un compañero al que curar. Es como un ataque cuerpo a cuerpo con el modificador de los puntos de daño recibidos. Los puntos de daño recibidos es la diferencia entre los puntos de vida base y los actuales. Así que la tirada es ataque del atacante + daño recibido por el defensor + 2d6 deben ser iguales o mayores que la defensa del defensor. Si la tirada es acertada, el atacante tirará un 1d6 para calcular los puntos de vida que recupera el defensor, que nunca podrán ser superiores al daño recibido por el defensor.' }
    ],
    pasivos: [],
  },
  maton: {
    activos: [],
    pasivos: [],
  },
  esbirro: {
    activos: [],
    pasivos: [],
  },
  agenteSkrull: {
    activos: [],
    pasivos: [],
  },
  guerreroSkrull: {
    activos: [],
    pasivos: [],
  },
  blade: {
    activos: [],
    pasivos: [
      { nombre: 'Sigilo', descripcion: 'El personaje tiene +2 a la defensa si está detrás de un objeto o detrás de un arbusto, en una tirada de ataque contra él.' },
      { nombre: 'Cuchillas/Garras/Colmillos', descripcion: 'Si el personaje consigue una tirada de ataque exitosa, su daño base para este turno se actualizará con una nueva tirada de 1d6. El nuevo daño base no podrá ser menor que el daño base del personaje. Tras pasar el turno, el personaje recupera su daño base antiguo.' },
      { nombre: 'Dureza', descripcion: 'Reducción del daño recibido de 1 para todos los ataques c/c y a/d.' }
    ],
  },
  lobaVenenosa: {
    activos: [],
    pasivos: [
      { nombre: 'Cuchillas/Garras/Colmillos', descripcion: 'Si el personaje consigue una tirada de ataque exitosa, su daño base para este turno se actualizará con una nueva tirada de 1d6. El nuevo daño base no podrá ser menor que el daño base del personaje. Tras pasar el turno, el personaje recupera su daño base antiguo.' }
    ],
  },
  elektra: {
    activos: [],
    pasivos: [
      { nombre: 'Sigilo', descripcion: 'El personaje tiene +2 a la defensa si está detrás de un objeto o detrás de un arbusto, en una tirada de ataque contra él.' },
      { nombre: 'Cuchillas/Garras/Colmillos', descripcion: 'Si el personaje consigue una tirada de ataque exitosa, su daño base para este turno se actualizará con una nueva tirada de 1d6. El nuevo daño base no podrá ser menor que el daño base del personaje. Tras pasar el turno, el personaje recupera su daño base antiguo.' }
    ],
  },
  avispa: {
    activos: [
      { nombre: 'Incapacitar', descripcion: 'El personaje selecciona un enemigo al que incapacitar. Si la tirada de ataque es exitosa, el defensor queda incapacitado y no podrá hacer otra acción salvo pasar, en el siguiente turno. No se puede incapacitar a un personaje incapacitado.' },
      { nombre: 'Mejora de Agilidad', descripcion: 'El personaje elige como objetivo un compañero, o a sí mismo, y resultan afectados dicho compañero, y los compañeros de las casillas adyacentes. Todos ellos obtienen una mejora de Agilidad de 10 durante 2 turnos. Lo máximo que se puede mejorar con respecto a la agilidad base es 10, es decir, que si le aplican dos veces seguidas mejora de defensa, renovará los dos turnos con mejora, pero seguira siendo una mejora de 10.' }
    ],
    pasivos: [
      { nombre: 'Volar', descripcion: 'El personaje puede pasar por encima de obstáculos y enemigos para mover.' }
    ],
  },
  constrictor: {
    activos: [
      { nombre: 'Incapacitar', descripcion: 'El personaje selecciona un enemigo al que incapacitar. Si la tirada de ataque es exitosa, el defensor queda incapacitado y no podrá hacer otra acción salvo pasar, en el siguiente turno. No se puede incapacitar a un personaje incapacitado.' }
    ],
    pasivos: [],
  },
  boomerang: {
    activos: [
      { nombre: 'Incapacitar', descripcion: 'El personaje selecciona un enemigo al que incapacitar. Si la tirada de ataque es exitosa, el defensor queda incapacitado y no podrá hacer otra acción salvo pasar, en el siguiente turno. No se puede incapacitar a un personaje incapacitado.' },
      { nombre: 'Explosión', descripcion: 'El personaje realiza un ataque contra un objetivo y contra todos los personajes en las casillas adyacentes al objetivo, incluido los aliados y el propio atacante, si estuviera entre los objetivos. El personaje compara su tirada con todos los personajes y se resuelven los daños de manera individual. Cuidado porque puedes matarte a ti mismo y a tus compañeros.' }
    ],
    pasivos: [
      { nombre: 'Experto a/d', descripcion: 'El daño base del personaje en los ataques a distancia se aumenta en 2.' },
      { nombre: 'Defensa a/d', descripcion: 'La resistencia del personaje en los ataques sufridos a distancia es de 2.' }
    ],
  },
  kingpin: {
    activos: [
      { nombre: 'Mejora de Agilidad', descripcion: 'El personaje elige como objetivo un compañero, o a sí mismo, y resultan afectados dicho compañero, y los compañeros de las casillas adyacentes. Todos ellos obtienen una mejora de Agilidad de 10 durante 2 turnos. Lo máximo que se puede mejorar con respecto a la agilidad base es 10, es decir, que si le aplican dos veces seguidas mejora de defensa, renovará los dos turnos con mejora, pero seguira siendo una mejora de 10.' }
    ],
    pasivos: [
      { nombre: 'Dureza', descripcion: 'Reducción del daño recibido de 1 para todos los ataques c/c y a/d.' }
    ],
  },
  buitre: {
    activos: [],
    pasivos: [
      { nombre: 'Volar', descripcion: 'El personaje puede pasar por encima de obstáculos y enemigos para mover.' }
    ],
  },
  jeanGrey: {
    activos: [
      { nombre: 'Telekinesis', descripcion: 'El personaje puede agarrar y usar objetos pesados o livianos. Los debe agarrar cuando esté dentro de su rango. Los podrá usar c/c o a/d, dentro de su rango normal.' },
      { nombre: 'Curar', descripcion: 'El personaje selecciona un compañero al que curar. Es como un ataque cuerpo a cuerpo con el modificador de los puntos de daño recibidos. Los puntos de daño recibidos es la diferencia entre los puntos de vida base y los actuales. Así que la tirada es ataque del atacante + daño recibido por el defensor + 2d6 deben ser iguales o mayores que la defensa del defensor. Si la tirada es acertada, el atacante tirará un 1d6 para calcular los puntos de vida que recupera el defensor, que nunca podrán ser superiores al daño recibido por el defensor.' }
    ],
    pasivos: [
      { nombre: 'Defensa a/d', descripcion: 'La resistencia del personaje en los ataques sufridos a distancia es de 2.' }
    ],
  },
  duende: {
    activos: [
      { nombre: 'Incapacitar', descripcion: 'El personaje selecciona un enemigo al que incapacitar. Si la tirada de ataque es exitosa, el defensor queda incapacitado y no podrá hacer otra acción salvo pasar, en el siguiente turno. No se puede incapacitar a un personaje incapacitado.' }
    ],
    pasivos: [
      { nombre: 'Experto a/d', descripcion: 'El daño base del personaje en los ataques a distancia se aumenta en 2.' },
      { nombre: 'Volar', descripcion: 'El personaje puede pasar por encima de obstáculos y enemigos para mover.' }
    ],
  },
  dientesDeSable: {
    activos: [],
    pasivos: [
      { nombre: 'Sigilo', descripcion: 'El personaje tiene +2 a la defensa si está detrás de un objeto o detrás de un arbusto, en una tirada de ataque contra él.' },
      { nombre: 'Cuchillas/Garras/Colmillos', descripcion: 'Si el personaje consigue una tirada de ataque exitosa, su daño base para este turno se actualizará con una nueva tirada de 1d6. El nuevo daño base no podrá ser menor que el daño base del personaje. Tras pasar el turno, el personaje recupera su daño base antiguo.' },
      { nombre: 'Dureza', descripcion: 'Reducción del daño recibido de 1 para todos los ataques c/c y a/d.' },
      { nombre: 'Regeneración', descripcion: 'El personaje recupera un 1 punto de vida tras finalizar su turno, siempre que esté por debajo de sus puntos de vida base.' }
    ],
  },
  hulk: {
    activos: [],
    pasivos: [
      { nombre: 'Trepar/Saltar', descripcion: 'El personaje puede pasar por encima de obstáculos y enemigos para mover.' },
      { nombre: 'Superfuerza', descripcion: 'El personaje puede agarrar y usar objetos pesados y livianos. Los debe agarrar cuando esté adyacente (perderá el turno). Los podrá usar c/c o a/d. Los ataques a/d tienen un rango de 2 casillas para los objetos pesados y 3 para los livianos. Los objetos se podrán utilizar 2 veces c/c y una vez a/d.' },
      { nombre: 'Invulnerable', descripcion: 'La resistencia del personaje en los ataques sufridos c/c y a/d se aumenta en 2.' },
      { nombre: 'Regeneración', descripcion: 'El personaje recupera un 1 punto de vida tras finalizar su turno, siempre que esté por debajo de sus puntos de vida base.' }
    ],
  },
  maestroMarionetas: {
    activos: [
      { nombre: 'Control Mental', descripcion: 'El personaje realiza una tirada de ataque normal contra su objetivo. Si acierta la tirada, el defensor jugará el siguiente turno para el equipo rival y se comportará como un personaje del equipo contrario.' }
    ],
    pasivos: [],
  },
  annihilus: {
    activos: [],
    pasivos: [
      { nombre: 'Invulnerable', descripcion: 'La resistencia del personaje en los ataques sufridos c/c y a/d se aumenta en 2.' },
      { nombre: 'Volar', descripcion: 'El personaje puede pasar por encima de obstáculos y enemigos para mover.' }
    ],
  },
  capitanAmerica: {
    activos: [
      { nombre: 'Mejora de Agilidad', descripcion: 'El personaje elige como objetivo un compañero, o a sí mismo, y resultan afectados dicho compañero, y los compañeros de las casillas adyacentes. Todos ellos obtienen una mejora de Agilidad de 10 durante 2 turnos. Lo máximo que se puede mejorar con respecto a la agilidad base es 10, es decir, que si le aplican dos veces seguidas mejora de defensa, renovará los dos turnos con mejora, pero seguira siendo una mejora de 10.' },
      { nombre: 'Curar', descripcion: 'El personaje selecciona un compañero al que curar. Es como un ataque cuerpo a cuerpo con el modificador de los puntos de daño recibidos. Los puntos de daño recibidos es la diferencia entre los puntos de vida base y los actuales. Así que la tirada es ataque del atacante + daño recibido por el defensor + 2d6 deben ser iguales o mayores que la defensa del defensor. Si la tirada es acertada, el atacante tirará un 1d6 para calcular los puntos de vida que recupera el defensor, que nunca podrán ser superiores al daño recibido por el defensor.' }
    ],
    pasivos: [
      { nombre: 'Defensa a/d', descripcion: 'La resistencia del personaje en los ataques sufridos a distancia es de 2.' },
      { nombre: 'Astucia', descripcion: 'Estos personajes obtienen un crítico no sólo sacando un 12 en una tirada de 2d6, también lo consiguen con 11.' },
      { nombre: 'Dureza', descripcion: 'Reducción del daño recibido de 1 para todos los ataques c/c y a/d.' }
    ],
  },
  spiderMan: {
    activos: [
      { nombre: 'Incapacitar', descripcion: 'El personaje selecciona un enemigo al que incapacitar. Si la tirada de ataque es exitosa, el defensor queda incapacitado y no podrá hacer otra acción salvo pasar, en el siguiente turno. No se puede incapacitar a un personaje incapacitado.' },
      { nombre: 'Mejora de Defensa', descripcion: 'El personaje elige como objetivo un compañero, o a sí mismo, y resultan afectados dicho compañero, y los compañeros de las casillas adyacentes. Todos ellos obtienen una mejora de Defensa de 1 durante 2 turnos. Lo máximo que se puede mejorar con respecto a la defensa base es 1, es decir, que si le aplican dos veces seguidas mejora de defensa, renovará los dos turnos con mejora, pero seguira siendo una mejora de 1.' }
    ],
    pasivos: [
      { nombre: 'Trepar/Saltar', descripcion: 'El personaje puede pasar por encima de obstáculos y enemigos para mover.' },
      { nombre: 'Astucia', descripcion: 'Estos personajes obtienen un crítico no sólo sacando un 12 en una tirada de 2d6, también lo consiguen con 11.' },
      { nombre: 'Doble ataque c/c', descripcion: 'Estos personajes tienen dos ataques c/c contra el mismo objetivo. Realizan una tirada de ataque, resuelven el daño en caso de éxito; y vuelven otra vez a realizar na tirada de ataque y vuelven a resolver el daño en caso de éxito. Siempre sobre el mismo personaje, así que sólo ejecutan en segundo ataque si el defensor sigue vivo.' }
    ],
  },
  lobezno: {
    activos: [],
    pasivos: [
      { nombre: 'Sigilo', descripcion: 'El personaje tiene +2 a la defensa si está detrás de un objeto o detrás de un arbusto, en una tirada de ataque contra él.' },
      { nombre: 'Cuchillas/Garras/Colmillos', descripcion: 'Si el personaje consigue una tirada de ataque exitosa, su daño base para este turno se actualizará con una nueva tirada de 1d6. El nuevo daño base no podrá ser menor que el daño base del personaje. Tras pasar el turno, el personaje recupera su daño base antiguo.' },
      { nombre: 'Dureza', descripcion: 'Reducción del daño recibido de 1 para todos los ataques c/c y a/d.' },
      { nombre: 'Regeneración', descripcion: 'El personaje recupera un 1 punto de vida tras finalizar su turno, siempre que esté por debajo de sus puntos de vida base.' }
    ],
  },
  profesorXavier: {
    activos: [
      { nombre: 'Control Mental', descripcion: 'El personaje realiza una tirada de ataque normal contra su objetivo. Si acierta la tirada, el defensor jugará el siguiente turno para el equipo rival y se comportará como un personaje del equipo contrario.' },
      { nombre: 'Mejora de Defensa', descripcion: 'El personaje elige como objetivo un compañero, o a sí mismo, y resultan afectados dicho compañero, y los compañeros de las casillas adyacentes. Todos ellos obtienen una mejora de Defensa de 1 durante 2 turnos. Lo máximo que se puede mejorar con respecto a la defensa base es 1, es decir, que si le aplican dos veces seguidas mejora de defensa, renovará los dos turnos con mejora, pero seguira siendo una mejora de 1.' },
      { nombre: 'Mejora de Agilidad', descripcion: 'El personaje elige como objetivo un compañero, o a sí mismo, y resultan afectados dicho compañero, y los compañeros de las casillas adyacentes. Todos ellos obtienen una mejora de Agilidad de 10 durante 2 turnos. Lo máximo que se puede mejorar con respecto a la agilidad base es 10, es decir, que si le aplican dos veces seguidas mejora de defensa, renovará los dos turnos con mejora, pero seguira siendo una mejora de 10.' }
    ],
    pasivos: [],
  },
  juggernaut: {
    activos: [],
    pasivos: [
      { nombre: 'Superfuerza', descripcion: 'El personaje puede agarrar y usar objetos pesados y livianos. Los debe agarrar cuando esté adyacente (perderá el turno). Los podrá usar c/c o a/d. Los ataques a/d tienen un rango de 2 casillas para los objetos pesados y 3 para los livianos. Los objetos se podrán utilizar 2 veces c/c y una vez a/d.' },
      { nombre: 'Invulnerable', descripcion: 'La resistencia del personaje en los ataques sufridos c/c y a/d se aumenta en 2.' }
    ],
  },
  ciclope: {
    activos: [],
    pasivos: [
      { nombre: 'Experto a/d', descripcion: 'El daño base del personaje en los ataques a distancia se aumenta en 2.' },
      { nombre: 'Defensa a/d', descripcion: 'La resistencia del personaje en los ataques sufridos a distancia es de 2.' }
    ],
  },
  panteraNegra: {
    activos: [],
    pasivos: [
      { nombre: 'Trepar/Saltar', descripcion: 'El personaje puede pasar por encima de obstáculos y enemigos para mover.' },
      { nombre: 'Astucia', descripcion: 'Estos personajes obtienen un crítico no sólo sacando un 12 en una tirada de 2d6, también lo consiguen con 11.' },
      { nombre: 'Cuchillas/Garras/Colmillos', descripcion: 'Si el personaje consigue una tirada de ataque exitosa, su daño base para este turno se actualizará con una nueva tirada de 1d6. El nuevo daño base no podrá ser menor que el daño base del personaje. Tras pasar el turno, el personaje recupera su daño base antiguo.' }
    ],
  },
  ventisca: {
    activos: [
      { nombre: 'Pulso', descripcion: 'El personaje realiza un ataque contra sí mismo y contra todos los personajes en las casillas adyacentes al objetivo, incluido los aliados. El personaje compara su tirada con todos los personajes y se resuelven los daños de manera individual. El personaje atacante no sufre daños por el ataque, ya que no se ataca a sí mismo. Cuidado porque puedes matar a tus compañeros.' },
      { nombre: 'Barrera', descripcion: 'El personaje crea un obstáculo de tres casillas verticales. La casila objetivo es la casilla central.' }
    ],
    pasivos: [],
  },
  pyro: {
    activos: [
      { nombre: 'Incapacitar', descripcion: 'El personaje selecciona un enemigo al que incapacitar. Si la tirada de ataque es exitosa, el defensor queda incapacitado y no podrá hacer otra acción salvo pasar, en el siguiente turno. No se puede incapacitar a un personaje incapacitado.' },
      { nombre: 'Explosión', descripcion: 'El personaje realiza un ataque contra un objetivo y contra todos los personajes en las casillas adyacentes al objetivo, incluido los aliados y el propio atacante, si estuviera entre los objetivos. El personaje compara su tirada con todos los personajes y se resuelven los daños de manera individual. Cuidado porque puedes matarte a ti mismo y a tus compañeros.' }
    ],
    pasivos: [
      { nombre: 'Experto a/d', descripcion: 'El daño base del personaje en los ataques a distancia se aumenta en 2.' }
    ],
  },
  torbellino: {
    activos: [],
    pasivos: [
      { nombre: 'Doble ataque c/c', descripcion: 'Estos personajes tienen dos ataques c/c contra el mismo objetivo. Realizan una tirada de ataque, resuelven el daño en caso de éxito; y vuelven otra vez a realizar na tirada de ataque y vuelven a resolver el daño en caso de éxito. Siempre sobre el mismo personaje, así que sólo ejecutan en segundo ataque si el defensor sigue vivo.' },
      { nombre: 'Defensa a/d', descripcion: 'La resistencia del personaje en los ataques sufridos a distancia es de 2.' }
    ],
  },
  daredevil: {
    activos: [
      { nombre: 'Incapacitar', descripcion: 'El personaje selecciona un enemigo al que incapacitar. Si la tirada de ataque es exitosa, el defensor queda incapacitado y no podrá hacer otra acción salvo pasar, en el siguiente turno. No se puede incapacitar a un personaje incapacitado.' }
    ],
    pasivos: [],
  },
  bullseye: {
    activos: [],
    pasivos: [
      { nombre: 'Experto a/d', descripcion: 'El daño base del personaje en los ataques a distancia se aumenta en 2.' },
      { nombre: 'Defensa a/d', descripcion: 'La resistencia del personaje en los ataques sufridos a distancia es de 2.' }
    ],
  },
  brujaEscarlata: {
    activos: [
      { nombre: 'Incapacitar', descripcion: 'El personaje selecciona un enemigo al que incapacitar. Si la tirada de ataque es exitosa, el defensor queda incapacitado y no podrá hacer otra acción salvo pasar, en el siguiente turno. No se puede incapacitar a un personaje incapacitado.' },
      { nombre: 'Mejora de Crítico', descripcion: 'El personaje elige como objetivo un compañero, o a sí mismo, y resultan afectados dicho compañero, y los compañeros de las casillas adyacentes. Todos ellos obtienen durante dos turnos el poder de Astucia. En caso se tener el poder de Astucia, consiguen crítico incluso sacando un 10. La Probabilidad no se acumula, es decir, un personaje que consiga Astucia por Probabilidad, no tendrá efecto si en el siguiente turno vuelve a recibir Probabilidad, sólo renovará los dos turnos con mejora, pero seguirá siendo la misma mejora.' }
    ],
    pasivos: [
      { nombre: 'Astucia', descripcion: 'Estos personajes obtienen un crítico no sólo sacando un 12 en una tirada de 2d6, también lo consiguen con 11.' }
    ],
  },
  mercurio: {
    activos: [],
    pasivos: [
      { nombre: 'Defensa a/d', descripcion: 'La resistencia del personaje en los ataques sufridos a distancia es de 2.' },
      { nombre: 'Doble ataque c/c', descripcion: 'Estos personajes tienen dos ataques c/c contra el mismo objetivo. Realizan una tirada de ataque, resuelven el daño en caso de éxito; y vuelven otra vez a realizar na tirada de ataque y vuelven a resolver el daño en caso de éxito. Siempre sobre el mismo personaje, así que sólo ejecutan en segundo ataque si el defensor sigue vivo.' }
    ],
  },
  mrHyde: {
    activos: [],
    pasivos: [
      { nombre: 'Superfuerza', descripcion: 'El personaje puede agarrar y usar objetos pesados y livianos. Los debe agarrar cuando esté adyacente (perderá el turno). Los podrá usar c/c o a/d. Los ataques a/d tienen un rango de 2 casillas para los objetos pesados y 3 para los livianos. Los objetos se podrán utilizar 2 veces c/c y una vez a/d.' },
      { nombre: 'Dureza', descripcion: 'Reducción del daño recibido de 1 para todos los ataques c/c y a/d.' }
    ],
  },
  klaw: {
    activos: [
      { nombre: 'Incapacitar', descripcion: 'El personaje selecciona un enemigo al que incapacitar. Si la tirada de ataque es exitosa, el defensor queda incapacitado y no podrá hacer otra acción salvo pasar, en el siguiente turno. No se puede incapacitar a un personaje incapacitado.' },
      { nombre: 'Barrera', descripcion: 'El personaje crea un obstáculo de tres casillas verticales. La casila objetivo es la casilla central.' }
    ],
    pasivos: [
      { nombre: 'Experto a/d', descripcion: 'El daño base del personaje en los ataques a distancia se aumenta en 2.' }
    ],
  },
  controller: {
    activos: [
      { nombre: 'Control Mental', descripcion: 'El personaje realiza una tirada de ataque normal contra su objetivo. Si acierta la tirada, el defensor jugará el siguiente turno para el equipo rival y se comportará como un personaje del equipo contrario.' }
    ],
    pasivos: [
      { nombre: 'Superfuerza', descripcion: 'El personaje puede agarrar y usar objetos pesados y livianos. Los debe agarrar cuando esté adyacente (perderá el turno). Los podrá usar c/c o a/d. Los ataques a/d tienen un rango de 2 casillas para los objetos pesados y 3 para los livianos. Los objetos se podrán utilizar 2 veces c/c y una vez a/d.' },
      { nombre: 'Dureza', descripcion: 'Reducción del daño recibido de 1 para todos los ataques c/c y a/d.' },
      { nombre: 'Regeneración', descripcion: 'El personaje recupera un 1 punto de vida tras finalizar su turno, siempre que esté por debajo de sus puntos de vida base.' }
    ],
  },
  hercules: {
    activos: [],
    pasivos: [
      { nombre: 'Superfuerza', descripcion: 'El personaje puede agarrar y usar objetos pesados y livianos. Los debe agarrar cuando esté adyacente (perderá el turno). Los podrá usar c/c o a/d. Los ataques a/d tienen un rango de 2 casillas para los objetos pesados y 3 para los livianos. Los objetos se podrán utilizar 2 veces c/c y una vez a/d.' },
      { nombre: 'Dureza', descripcion: 'Reducción del daño recibido de 1 para todos los ataques c/c y a/d.' }
    ],
  },
  picara: {
    activos: [],
    pasivos: [
      { nombre: 'Robo de vida', descripcion: 'Cada vez que consigue hacer daño a un rival, recupera el daño infligido en forma de puntos de vida, teniendo como límite sus puntos de vida base. Por ejemplo, Pícara tiene 8 puntos de vida. Nunca podrá tener más de esos 8 puntos de vida, pero si tiene 6 puntos de vida en un momento y consigue infligir 3 puntos de daño, llegará a su límite de 8 puntos de vida.' },
      { nombre: 'Invulnerable', descripcion: 'La resistencia del personaje en los ataques sufridos c/c y a/d se aumenta en 2.' },
      { nombre: 'Volar', descripcion: 'El personaje puede pasar por encima de obstáculos y enemigos para mover.' }
    ],
  },
  drExtrano: {
    activos: [
      { nombre: 'Incapacitar', descripcion: 'El personaje selecciona un enemigo al que incapacitar. Si la tirada de ataque es exitosa, el defensor queda incapacitado y no podrá hacer otra acción salvo pasar, en el siguiente turno. No se puede incapacitar a un personaje incapacitado.' },
      { nombre: 'Telekinesis', descripcion: 'El personaje puede agarrar y usar objetos pesados o livianos. Los debe agarrar cuando esté dentro de su rango. Los podrá usar c/c o a/d, dentro de su rango normal.' },
      { nombre: 'Pulso', descripcion: 'El personaje realiza un ataque contra sí mismo y contra todos los personajes en las casillas adyacentes al objetivo, incluido los aliados. El personaje compara su tirada con todos los personajes y se resuelven los daños de manera individual. El personaje atacante no sufre daños por el ataque, ya que no se ataca a sí mismo. Cuidado porque puedes matar a tus compañeros.' },
      { nombre: 'Barrera', descripcion: 'El personaje crea un obstáculo de tres casillas verticales. La casila objetivo es la casilla central.' },
      { nombre: 'Curar', descripcion: 'El personaje selecciona un compañero al que curar. Es como un ataque cuerpo a cuerpo con el modificador de los puntos de daño recibidos. Los puntos de daño recibidos es la diferencia entre los puntos de vida base y los actuales. Así que la tirada es ataque del atacante + daño recibido por el defensor + 2d6 deben ser iguales o mayores que la defensa del defensor. Si la tirada es acertada, el atacante tirará un 1d6 para calcular los puntos de vida que recupera el defensor, que nunca podrán ser superiores al daño recibido por el defensor.' },
      { nombre: 'Mejora de Crítico', descripcion: 'El personaje elige como objetivo un compañero, o a sí mismo, y resultan afectados dicho compañero, y los compañeros de las casillas adyacentes. Todos ellos obtienen durante dos turnos el poder de Astucia. En caso se tener el poder de Astucia, consiguen crítico incluso sacando un 10. La Probabilidad no se acumula, es decir, un personaje que consiga Astucia por Probabilidad, no tendrá efecto si en el siguiente turno vuelve a recibir Probabilidad, sólo renovará los dos turnos con mejora, pero seguirá siendo la misma mejora.' },
      { nombre: 'Mejora de Ataque', descripcion: 'El personaje elige como objetivo un compañero, o a sí mismo, y resultan afectados dicho compañero, y los compañeros de las casillas adyacentes. Todos ellos obtienen una mejora de Ataque de 1 durante 2 turnos. Lo máximo que se puede mejorar con respecto al ataque base es 1, es decir, que si le aplican dos veces seguidas mejora de ataque, renovará los dos turnos con mejora, pero seguira siendo una mejora de 1.' }
    ],
    pasivos: [
      { nombre: 'Fase', descripcion: 'El personaje puede pasar por encima de obstáculos y enemigos para mover.' },
      { nombre: 'Volar', descripcion: 'El personaje puede pasar por encima de obstáculos y enemigos para mover.' },
      { nombre: 'Defensa a/d', descripcion: 'La resistencia del personaje en los ataques sufridos a distancia es de 2.' },
      { nombre: 'Experto a/d', descripcion: 'El daño base del personaje en los ataques a distancia se aumenta en 2.' }
    ],
  },
  magneto: {
    activos: [
      { nombre: 'Telekinesis', descripcion: 'El personaje puede agarrar y usar objetos pesados o livianos. Los debe agarrar cuando esté dentro de su rango. Los podrá usar c/c o a/d, dentro de su rango normal.' },
      { nombre: 'Mejora de Agilidad', descripcion: 'El personaje elige como objetivo un compañero, o a sí mismo, y resultan afectados dicho compañero, y los compañeros de las casillas adyacentes. Todos ellos obtienen una mejora de Agilidad de 10 durante 2 turnos. Lo máximo que se puede mejorar con respecto a la agilidad base es 10, es decir, que si le aplican dos veces seguidas mejora de defensa, renovará los dos turnos con mejora, pero seguira siendo una mejora de 10.' }
    ],
    pasivos: [
      { nombre: 'Defensa a/d', descripcion: 'La resistencia del personaje en los ataques sufridos a distancia es de 2.' },
      { nombre: 'Volar', descripcion: 'El personaje puede pasar por encima de obstáculos y enemigos para mover.' }
    ],
  },
  kang: {
    activos: [
      { nombre: 'Incapacitar', descripcion: 'El personaje selecciona un enemigo al que incapacitar. Si la tirada de ataque es exitosa, el defensor queda incapacitado y no podrá hacer otra acción salvo pasar, en el siguiente turno. No se puede incapacitar a un personaje incapacitado.' },
      { nombre: 'Pulso', descripcion: 'El personaje realiza un ataque contra sí mismo y contra todos los personajes en las casillas adyacentes al objetivo, incluido los aliados. El personaje compara su tirada con todos los personajes y se resuelven los daños de manera individual. El personaje atacante no sufre daños por el ataque, ya que no se ataca a sí mismo. Cuidado porque puedes matar a tus compañeros.' }
    ],
    pasivos: [
      { nombre: 'Invulnerable', descripcion: 'La resistencia del personaje en los ataques sufridos c/c y a/d se aumenta en 2.' },
      { nombre: 'Experto a/d', descripcion: 'El daño base del personaje en los ataques a distancia se aumenta en 2.' },
      { nombre: 'Fase', descripcion: 'El personaje puede pasar por encima de obstáculos y enemigos para mover.' }
    ],
  },
  ultron: {
    activos: [
      { nombre: 'Explosión', descripcion: 'El personaje realiza un ataque contra un objetivo y contra todos los personajes en las casillas adyacentes al objetivo, incluido los aliados y el propio atacante, si estuviera entre los objetivos. El personaje compara su tirada con todos los personajes y se resuelven los daños de manera individual. Cuidado porque puedes matarte a ti mismo y a tus compañeros.' }
    ],
    pasivos: [
      { nombre: 'Invulnerable', descripcion: 'La resistencia del personaje en los ataques sufridos c/c y a/d se aumenta en 2.' },
      { nombre: 'Volar', descripcion: 'El personaje puede pasar por encima de obstáculos y enemigos para mover.' }
    ],
  },
  firelord: {
    activos: [
      { nombre: 'Explosión', descripcion: 'El personaje realiza un ataque contra un objetivo y contra todos los personajes en las casillas adyacentes al objetivo, incluido los aliados y el propio atacante, si estuviera entre los objetivos. El personaje compara su tirada con todos los personajes y se resuelven los daños de manera individual. Cuidado porque puedes matarte a ti mismo y a tus compañeros.' },
      { nombre: 'Pulso', descripcion: 'El personaje realiza un ataque contra sí mismo y contra todos los personajes en las casillas adyacentes al objetivo, incluido los aliados. El personaje compara su tirada con todos los personajes y se resuelven los daños de manera individual. El personaje atacante no sufre daños por el ataque, ya que no se ataca a sí mismo. Cuidado porque puedes matar a tus compañeros.' },
      { nombre: 'Barrera', descripcion: 'El personaje crea un obstáculo de tres casillas verticales. La casila objetivo es la casilla central.' }
    ],
    pasivos: [
      { nombre: 'Defensa a/d', descripcion: 'La resistencia del personaje en los ataques sufridos a distancia es de 2.' },
      { nombre: 'Experto a/d', descripcion: 'El daño base del personaje en los ataques a distancia se aumenta en 2.' },
      { nombre: 'Volar', descripcion: 'El personaje puede pasar por encima de obstáculos y enemigos para mover.' }
    ],
  },
  vision: {
    activos: [],
    pasivos: [
      { nombre: 'Fase', descripcion: 'El personaje puede pasar por encima de obstáculos y enemigos para mover.' },
      { nombre: 'Volar', descripcion: 'El personaje puede pasar por encima de obstáculos y enemigos para mover.' },
      { nombre: 'Superfuerza', descripcion: 'El personaje puede agarrar y usar objetos pesados y livianos. Los debe agarrar cuando esté adyacente (perderá el turno). Los podrá usar c/c o a/d. Los ataques a/d tienen un rango de 2 casillas para los objetos pesados y 3 para los livianos. Los objetos se podrán utilizar 2 veces c/c y una vez a/d.' },
      { nombre: 'Invulnerable', descripcion: 'La resistencia del personaje en los ataques sufridos c/c y a/d se aumenta en 2.' }
    ],
  },
  quasar: {
    activos: [
      { nombre: 'Incapacitar', descripcion: 'El personaje selecciona un enemigo al que incapacitar. Si la tirada de ataque es exitosa, el defensor queda incapacitado y no podrá hacer otra acción salvo pasar, en el siguiente turno. No se puede incapacitar a un personaje incapacitado.' },
      { nombre: 'Telekinesis', descripcion: 'El personaje puede agarrar y usar objetos pesados o livianos. Los debe agarrar cuando esté dentro de su rango. Los podrá usar c/c o a/d, dentro de su rango normal.' },
      { nombre: 'Barrera', descripcion: 'El personaje crea un obstáculo de tres casillas verticales. La casila objetivo es la casilla central.' },
      { nombre: 'Mejora de Defensa', descripcion: 'El personaje elige como objetivo un compañero, o a sí mismo, y resultan afectados dicho compañero, y los compañeros de las casillas adyacentes. Todos ellos obtienen una mejora de Defensa de 1 durante 2 turnos. Lo máximo que se puede mejorar con respecto a la defensa base es 1, es decir, que si le aplican dos veces seguidas mejora de defensa, renovará los dos turnos con mejora, pero seguira siendo una mejora de 1.' }
    ],
    pasivos: [
      { nombre: 'Experto a/d', descripcion: 'El daño base del personaje en los ataques a distancia se aumenta en 2.' },
      { nombre: 'Volar', descripcion: 'El personaje puede pasar por encima de obstáculos y enemigos para mover.' }
    ],
  },
  thanos: {
    activos: [],
    pasivos: [
      { nombre: 'Invulnerable', descripcion: 'La resistencia del personaje en los ataques sufridos c/c y a/d se aumenta en 2.' },
      { nombre: 'Regeneración', descripcion: 'El personaje recupera un 1 punto de vida tras finalizar su turno, siempre que esté por debajo de sus puntos de vida base.' },
      { nombre: 'Volar', descripcion: 'El personaje puede pasar por encima de obstáculos y enemigos para mover.' }
    ],
  },
  pesadilla: {
    activos: [
      { nombre: 'Incapacitar', descripcion: 'El personaje selecciona un enemigo al que incapacitar. Si la tirada de ataque es exitosa, el defensor queda incapacitado y no podrá hacer otra acción salvo pasar, en el siguiente turno. No se puede incapacitar a un personaje incapacitado.' },
      { nombre: 'Mejora de Ataque', descripcion: 'El personaje elige como objetivo un compañero, o a sí mismo, y resultan afectados dicho compañero, y los compañeros de las casillas adyacentes. Todos ellos obtienen una mejora de Ataque de 1 durante 2 turnos. Lo máximo que se puede mejorar con respecto al ataque base es 1, es decir, que si le aplican dos veces seguidas mejora de ataque, renovará los dos turnos con mejora, pero seguira siendo una mejora de 1.' }
    ],
    pasivos: [
      { nombre: 'Robo de vida', descripcion: 'Cada vez que consigue hacer daño a un rival, recupera el daño infligido en forma de puntos de vida, teniendo como límite sus puntos de vida base. Por ejemplo, Pícara tiene 8 puntos de vida. Nunca podrá tener más de esos 8 puntos de vida, pero si tiene 6 puntos de vida en un momento y consigue infligir 3 puntos de daño, llegará a su límite de 8 puntos de vida.' },
      { nombre: 'Invulnerable', descripcion: 'La resistencia del personaje en los ataques sufridos c/c y a/d se aumenta en 2.' }
    ],
  },
  centinela: {
    activos: [
      { nombre: 'Incapacitar', descripcion: 'El personaje selecciona un enemigo al que incapacitar. Si la tirada de ataque es exitosa, el defensor queda incapacitado y no podrá hacer otra acción salvo pasar, en el siguiente turno. No se puede incapacitar a un personaje incapacitado.' },
      { nombre: 'Explosión', descripcion: 'El personaje realiza un ataque contra un objetivo y contra todos los personajes en las casillas adyacentes al objetivo, incluido los aliados y el propio atacante, si estuviera entre los objetivos. El personaje compara su tirada con todos los personajes y se resuelven los daños de manera individual. Cuidado porque puedes matarte a ti mismo y a tus compañeros.' }
    ],
    pasivos: [
      { nombre: 'Dureza', descripcion: 'Reducción del daño recibido de 1 para todos los ataques c/c y a/d.' },
      { nombre: 'Defensa a/d', descripcion: 'La resistencia del personaje en los ataques sufridos a distancia es de 2.' },
      { nombre: 'Volar', descripcion: 'El personaje puede pasar por encima de obstáculos y enemigos para mover.' }
    ],
  },
};

if (typeof window !== 'undefined') {
  window.poderes = poderes;
}