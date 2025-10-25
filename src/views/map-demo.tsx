import { useState } from 'react';
import type { CharacterPosition, MapData } from '~/types/map';
import { MAP_1, MAP_2 } from '~/constants/maps';
import { MapBackground, MapCharacter } from '~/components/map';

function Map1() {
  const mapData: MapData = MAP_1;
  const [charLocation, setCharLocation] = useState<CharacterPosition>({ row: 0, col: 1 });

  function handleMove(newPosition: CharacterPosition) {
    setCharLocation(newPosition);
    console.log('Character moved to:', newPosition);
  }

  return (
    <div className="relative">
      <MapCharacter charLocation={charLocation} mapData={mapData} onMove={handleMove} />
      <MapBackground mapData={mapData} />
    </div>
  );
}

function Map2() {
  const mapData: MapData = MAP_2;
  const [charLocation, setCharLocation] = useState<CharacterPosition>({ row: 0, col: 2 });

  function handleMove(newPosition: CharacterPosition) {
    setCharLocation(newPosition);
    console.log('Character moved to:', newPosition);
  }

  return (
    <div className="relative">
      <MapCharacter charLocation={charLocation} mapData={mapData} onMove={handleMove} />
      <MapBackground mapData={mapData} />
    </div>
  );
}

export function MapDemo() {
  const [activeMap, setActiveMap] = useState<'map1' | 'map2'>('map1');

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-gray-950 p-8">
      <div className="text-center">
        <h1 className="mb-2 text-4xl font-bold text-white">Map System Demo</h1>
        <p className="text-gray-400">Use Arrow Keys or WASD to move the character 🧙</p>
      </div>

      <div className="flex gap-4">
        <button
          onClick={() => setActiveMap('map1')}
          className={`rounded-lg px-6 py-2 font-semibold transition-colors ${
            activeMap === 'map1'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          Map 1
        </button>
        <button
          onClick={() => setActiveMap('map2')}
          className={`rounded-lg px-6 py-2 font-semibold transition-colors ${
            activeMap === 'map2'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          Map 2
        </button>
      </div>

      <div className="rounded-lg bg-gray-800 p-6 shadow-2xl">
        {activeMap === 'map1' ? <Map1 /> : <Map2 />}
      </div>

      <div className="max-w-md rounded-lg bg-gray-800 p-4 text-sm text-gray-300">
        <h3 className="mb-2 font-semibold text-white">Tile Legend:</h3>
        <div className="grid grid-cols-2 gap-2">
          <div>🌱 Grass (walkable)</div>
          <div>🟫 Road (walkable)</div>
          <div>💧 Water (blocked)</div>
          <div>🌲 Forest (blocked)</div>
          <div>🏘️ Town (walkable)</div>
          <div>⚔️ Battle (walkable)</div>
          <div>👹 Boss (walkable)</div>
          <div>🏰 Dungeon (walkable)</div>
        </div>
      </div>
    </div>
  );
}
