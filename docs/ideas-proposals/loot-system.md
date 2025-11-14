
General:

- Puedes que en la misma carpeta con las constantes de los mapas, crees una constante de Loot Tables para cada mapa y así puedes ponerlo al azar.
- Tambien podriamos tener un Loot Table para cada enemigo.

Para el loot:

- Ya tenemos para poner treasure.
  - para esos seria un cofre, que interactuas y te sale una notificacion de que recibiste X item o algo de resources.
  - Para pruebas puedes hacerlo como sea, si quieres un modal o algo flotante, da igual
- Floor Loot:
  - Esto simplemente reproduce un sonido cuando lo pisas, puede ser cualquier sonido
  - Te sale algo flotante por un segundo que diga cuando de cada Resource conseguiste (no mostrar si es 0).
  - Puedes usar la funcion randIntInRange(min, max) para obtener un numero aleatorio entre 0 y el maximo de cada Resource
  - Estos estarian en varios lugares walkable random
  - Cuando los pisas, obtienes los recursos, y el loot del piso desaparecese  no lo puedes agarrar mas, aun cuando entras y sales del mapa.
  - No podemos actualizar el store slice de los mapas a cada rato, deberia actualizarse todo al salir del mapa pero de resto hacerlo en estado global.
  - Al finalizar el mapa, debemos actualizar el store slice de los mapas.
