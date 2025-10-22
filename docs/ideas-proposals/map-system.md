

# Caching on React 19

We're using the React Compiler.

Instead of generating the verbose useMemo or useCallback hooks, the compiler uses an internal, low-level React function (often referenced as _c or similar in compiled output) to create a small array-based cache.

For a piece of cached logic (like a computed value or a JSX element), the compiler generates a conditional check against its dependencies.

# Graphics

We'll probably grab a Tileset from someplace and use it to create the map.

# React 19 Caching - Consequences:

If we have a MapData that is a const, we can use it to create a Map:

```ts
const MAP_1: MapData = {
 [
    [GRASS, ROAD, ROAD, ROAD, ROAD],
    [ROAD, GRASS, GRASS, GRASS, GRASS],
    [ROAD, GRASS, GRASS, GRASS, GRASS],
    [ROAD, GRASS, GRASS, GRASS, GRASS],
    [ROAD, GRASS, GRASS, GRASS, GRASS],
 ] as const;
}
```

And we do it like this, using only the Constant as a Props:

```ts
import { MAP_1 } from "../constants/maps";

function Map1() {
    const map: MapData = MAP_1;
    const charLocation: [number, number] = [0, 0];
    return (
        <MapCharacter charLocation={charLocation} />
        <MapBackground mapData={mapData} />
    )
}
```

Since React Compiler will detect that the MapData is a const, it will cache the MapBackground component and only re-render it when the mapData changes, which should be only once when we load the map.

# Reading Material

##  Using Two-Dimensional Arrays to Build a Walkable Game Map (in React!)
##  by Raquel Román-Rodriguez
 https://dev.to/raquii/using-two-dimensional-arrays-to-build-a-walkable-game-map-in-react-22e7


# Requirements

- [ ] Hay nodos (MapNode)
- [ ] El personaje se mueve entre nodos
- [ ] Ciertos nodos son peleas
- [ ] Ciertos nodos son Bosses
- [ ] Ciertos nodos son Pueblos
- [ ] Ciertos nodos son Dungeons (Estos son un branch de mapas a un ladito que no estorben el camino principal)
- [ ] No puedes traspasar por un Nodo de Battle o Boss al menos que tengas su propiedad {completed: true}
- [ ] Cada nodo debe cuando se paras sobre él mostrar información sobre el tipo de nodo (Battle, Boss, pueblo, etc), si está completado o no, y un menu flotante con opciones.
- [ ] El menu flotante debe tener opciones para interactuar con el nodo, e.g: Entrar al pueblo, Entrar al dungeon, Fight (si es Boss/Battle) etc.
- [ ] Debe haber un Nodo de Next Map o Preview Map para ir al siguiente mapa o al mapa anterior (maybe esto sería como un Linked List).
- [ ] Optionalmente, puede tener una secuencia de Dialogo al nodo, o puede iniciar un combate o puede cambiar de vista a un pueblo, asi que tiene que tener alguna especie de forma de pasar callbacks o algo.