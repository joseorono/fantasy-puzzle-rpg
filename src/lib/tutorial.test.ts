import { describe, expect, it } from 'vitest';
import { TUTORIAL_TOPICS, TUTORIAL_TOPIC_ORDER } from '~/constants/tutorial';
import { MAP_REGISTRY } from '~/constants/maps';
import { buildTutorialScene } from './tutorial';
import { buildWalkableMask, isMaskWalkable } from './tilemap-collision';
import { findFloorLootAt, findNodeAt } from './map-content';
import { FOE_DEFAULT_TUNABLES } from '~/constants/foe';

const FORGE = MAP_REGISTRY['map-00-apprentice-forge'];

function forgeMask() {
  const tileset = FORGE.tiledData.tilesets?.[0];
  const ignoredGids = new Set([...(tileset?.blankGids ?? []), ...(tileset?.overheadGids ?? [])]);
  return buildWalkableMask(FORGE.tiledData, FORGE.walkableLayers, { surfaceLayers: FORGE.surfaceLayers, ignoredGids });
}

describe('tutorial topics', () => {
  it('lists every topic exactly once', () => {
    expect([...TUTORIAL_TOPIC_ORDER].sort()).toEqual(Object.keys(TUTORIAL_TOPICS).sort());
    expect(new Set(TUTORIAL_TOPIC_ORDER).size).toBe(TUTORIAL_TOPIC_ORDER.length);
  });

  it.each(Object.values(TUTORIAL_TOPICS).map((topic) => [topic.id, topic] as const))(
    '%s has a title and non-empty lines',
    (id, topic) => {
      expect(topic.id).toBe(id);
      expect(topic.title.length).toBeGreaterThan(0);
      expect(topic.lines.length).toBeGreaterThan(0);
      for (const line of topic.lines) expect(line.trim().length).toBeGreaterThan(0);
    },
  );
});

describe('buildTutorialScene', () => {
  const scene = buildTutorialScene('tutorial-test', ['skills', 'enemies']);

  it('narrates every line of every topic, in order', () => {
    expect(scene.id).toBe('tutorial-test');
    expect(scene.lines.map((line) => line.text)).toEqual([
      ...TUTORIAL_TOPICS.skills.lines,
      ...TUTORIAL_TOPICS.enemies.lines,
    ]);
    expect(scene.lines.every((line) => line.speakerId === 'narrator')).toBe(true);
    expect(scene.characters.map((character) => character.id)).toEqual(['narrator']);
  });

  it('gives every line a unique id', () => {
    const ids = scene.lines.map((line) => line.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('Apprentice Forge tutorial events', () => {
  const triggers = FORGE.dialogueTriggers ?? [];
  const mask = forgeMask();

  it('spawns on a walkable tile', () => {
    const { x, y } = FORGE.defaultPlayerPosition;
    expect(isMaskWalkable(mask, y, x)).toBe(true);
  });

  it.each(triggers.map((trigger) => [`${trigger.scene} (${trigger.row}, ${trigger.col})`, trigger] as const))(
    '%s is playable and on open ground',
    (_label, trigger) => {
      expect(trigger.autoPlay).toBe(true);
      expect(FORGE.dialogueScenes?.[trigger.scene], 'scene exists').toBeDefined();
      expect(isMaskWalkable(mask, trigger.row, trigger.col), 'walkable').toBe(true);
      expect(findNodeAt(FORGE.nodes, trigger.row, trigger.col), 'off nodes').toBeUndefined();
      expect(findFloorLootAt(FORGE.floorLoot, trigger.row, trigger.col), 'off loot').toBeUndefined();
    },
  );

  it('plays every lesson before the first FOE out of detection range of every patrol post', () => {
    const lessonsBeforeFoes = new Set([
      'tutorial-exploring',
      'tutorial-matching',
      'tutorial-skills',
      'tutorial-items',
      'tutorial-foes',
    ]);
    for (const trigger of triggers.filter((entry) => lessonsBeforeFoes.has(entry.scene))) {
      for (const foe of FORGE.foes ?? []) {
        const radius = foe.overrides?.detectionRadiusTiles ?? FOE_DEFAULT_TUNABLES.detectionRadiusTiles;
        for (const post of foe.patrol) {
          const distance = Math.hypot(post.row - trigger.row, post.col - trigger.col);
          expect(distance, `${foe.id} (${post.row}, ${post.col}) vs ${trigger.scene}`).toBeGreaterThan(radius);
        }
      }
    }
  });
});
