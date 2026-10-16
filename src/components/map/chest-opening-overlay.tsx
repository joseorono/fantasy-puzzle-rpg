import { useEffect, useRef, useState, type CSSProperties } from 'react';
import type { ChestVariant } from '~/types/chest';
import type { LootTable } from '~/types/loot';
import { OverlayContainer } from '~/components/overlays/overlay-container';
import { SparkleLayer } from '~/components/effects/sparkle-layer';
import { BurstParticles } from '~/components/effects/burst-particles';
import { NarikWoodBitFont } from '~/components/bitmap-fonts/narik-wood';
import { ItemIcon } from '~/components/sprite-icons/item-icon';
import { ResourceStatItem } from '~/components/ui-custom/resource-stat-item';
import { ChestSprite } from './chest-sprite';
import { buildChestLootIcons } from './chest-loot-icons';
import { CHEST_OPENING } from '~/constants/chest';
import { RESOURCE_DISPLAY_ORDER, RESOURCE_ICON_NAMES, RESOURCE_LABELS } from '~/constants/resources';
import { SoundNames } from '~/constants/audio';
import { KeyboardKeys } from '~/constants/keyboard';
import { getBestLootRarity } from '~/lib/loot';
import { getRarityColor, getRarityLabel } from '~/lib/rarity';
import { cn } from '~/lib/utils';
import { soundService } from '~/services/sound-service';
import { useWindowKeyDown } from '~/hooks/use-window-keydown';

type ChestOpeningPhase = 'shake' | 'open' | 'parade' | 'reveal';

const { parade: PARADE } = CHEST_OPENING;
/** One icon's whole beat: launch, hold, grow-and-vanish. */
const PARADE_ICON_MS = PARADE.launchMs + PARADE.holdMs + PARADE.popMs;

const ADVANCE_KEYS: readonly string[] = [
  KeyboardKeys.Enter,
  KeyboardKeys.Space,
  KeyboardKeys.Escape,
  KeyboardKeys.Backspace,
];

interface ChestOpeningOverlayProps {
  variant: ChestVariant;
  /** What the chest actually granted. */
  loot: LootTable;
  /** Called once the ceremony ends, on its own or skipped through. */
  onDone: () => void;
}

/**
 * The chest-opening ceremony: the chest rattles, the lid pops in a flash and a burst of
 * sparks, then each piece of loot launches out to where the rays cross, grows and vanishes
 * for the next, and finally the whole haul is listed. A click or confirm/cancel key skips
 * to the next beat (or the next icon).
 */
export function ChestOpeningOverlay({ variant, loot, onDone }: ChestOpeningOverlayProps) {
  const [phase, setPhase] = useState<ChestOpeningPhase>('shake');
  const [paradeIndex, setParadeIndex] = useState(0);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  const bestRarity = getBestLootRarity(loot);
  const glowColor = bestRarity && bestRarity !== 'common' ? getRarityColor(bestRarity) : CHEST_OPENING.defaultGlowColor;

  const earnedResources = RESOURCE_DISPLAY_ORDER.filter((key) => loot.resources.item[key] > 0);
  const lootEntries = [
    ...loot.equipableItems.map((lootItem) => ({ kind: 'equipment' as const, lootItem })),
    ...loot.consumableItems.map((lootItem) => ({ kind: 'consumable' as const, lootItem })),
  ];
  const revealCount = lootEntries.length + (earnedResources.length > 0 ? 1 : 0);
  const lootIcons = buildChestLootIcons(loot, PARADE.iconSize);
  const paradeIcon = phase === 'parade' ? lootIcons[paradeIndex] : undefined;

  function clearTimers() {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }

  function schedule(callback: () => void, delayMs: number) {
    timersRef.current.push(setTimeout(callback, delayMs));
  }

  function finish() {
    clearTimers();
    onDoneRef.current();
  }

  function revealLoot() {
    clearTimers();
    setPhase('reveal');
    schedule(finish, CHEST_OPENING.revealHoldMs + revealCount * CHEST_OPENING.lootStaggerMs);
  }

  /** Launches the icon at `index`, or lists the haul once every icon has had its turn. */
  function launchIcon(index: number) {
    clearTimers();
    const lootIcon = lootIcons[index];
    if (!lootIcon) {
      revealLoot();
      return;
    }
    setPhase('parade');
    setParadeIndex(index);
    const sound = lootIcon.kind === 'resource' ? SoundNames.clickCoin : SoundNames.shimmeringSuccessShorter;
    soundService.playSound(sound, PARADE.volume, 0, 0, 1 + index * PARADE.pitchStep);
    schedule(() => launchIcon(index + 1), PARADE_ICON_MS);
  }

  function openLid() {
    clearTimers();
    setPhase('open');
    soundService.playSound(SoundNames.rhodesmasChime, 0.7, 0.1, 0.05);
    soundService.playSound(SoundNames.shimmeringSuccessShort, 0.8);
    schedule(() => launchIcon(0), CHEST_OPENING.revealDelayMs);
  }

  function advance() {
    if (phase === 'shake') openLid();
    else if (phase === 'open') launchIcon(0);
    else if (phase === 'parade') launchIcon(paradeIndex + 1);
    else finish();
  }

  useEffect(() => {
    // Each rattle clicks a little higher, winding up to the pop.
    CHEST_OPENING.rattleAtMs.forEach((atMs, index) => {
      const pitch = 1 + index * CHEST_OPENING.rattlePitchStep;
      schedule(() => soundService.playSound(SoundNames.mechanicalClick, CHEST_OPENING.rattleVolume, 0, 0, pitch), atMs);
    });
    schedule(openLid, CHEST_OPENING.shakeMs);
    return clearTimers;
    // Runs once: the timeline starts on mount, and every later beat schedules its own.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Claimed ahead of the map and the pause menu, which would otherwise open under the ceremony.
  useWindowKeyDown(
    (event) => {
      event.stopImmediatePropagation();
      if (!ADVANCE_KEYS.includes(event.key)) return;
      event.preventDefault();
      if (!event.repeat) advance();
    },
    true,
    { capture: true },
  );

  const isOpen = phase !== 'shake';

  return (
    <OverlayContainer onDismiss={advance} dismissOnKey={false} autoDismissMs={null}>
      <div
        className={cn('chest-opening', `chest-opening--${phase}`)}
        style={{ '--chest-glow': glowColor } as CSSProperties}
        onClick={advance}
      >
        <div className="chest-opening__title">
          <NarikWoodBitFont text="Treasure Found" size={1.4} />
        </div>

        <div className="chest-opening__stage">
          <div className="chest-opening__rays" />
          <div className="chest-opening__glow" />
          {isOpen && <div className="chest-opening__flash" />}
          <div className="chest-opening__chest">
            <ChestSprite variant={variant} animation={isOpen ? 'open' : 'idle'} scale={CHEST_OPENING.displayScale} />
          </div>
          {paradeIcon && (
            // Keyed per icon so each one replays the launch from the chest.
            <div
              key={paradeIcon.key}
              className="chest-opening__parade"
              style={
                {
                  '--parade-color': paradeIcon.color ?? glowColor,
                  '--parade-ms': `${PARADE_ICON_MS}ms`,
                } as CSSProperties
              }
            >
              <div className="chest-opening__parade-halo motion-hold" />
              <div className="chest-opening__parade-icon motion-hold">{paradeIcon.icon}</div>
            </div>
          )}
          {isOpen && (
            <BurstParticles
              count={CHEST_OPENING.burstParticleCount}
              colors={[glowColor, CHEST_OPENING.defaultGlowColor, '#fff4d6']}
            />
          )}
        </div>

        {phase === 'reveal' && (
          <div className="chest-opening__loot">
            {lootEntries.map(({ kind, lootItem }, index) => (
              <div
                key={`${kind}-${index}`}
                className="chest-opening__entry"
                style={{ animationDelay: `${index * CHEST_OPENING.lootStaggerMs}ms` }}
              >
                <ItemIcon item={lootItem.item} size={32} />
                <span
                  className="chest-opening__entry-name"
                  style={kind === 'equipment' ? { color: getRarityColor(lootItem.rarity) } : undefined}
                >
                  {lootItem.item.name}
                  {kind === 'equipment' && (
                    <span className="chest-opening__entry-rarity">{getRarityLabel(lootItem.rarity)}</span>
                  )}
                </span>
              </div>
            ))}
            {earnedResources.length > 0 && (
              <div
                className="chest-opening__resources"
                style={{ animationDelay: `${lootEntries.length * CHEST_OPENING.lootStaggerMs}ms` }}
              >
                {earnedResources.map((key) => (
                  <ResourceStatItem
                    key={key}
                    variant="treasure"
                    resource={key}
                    label={RESOURCE_LABELS[key]}
                    value={loot.resources.item[key]}
                    iconName={RESOURCE_ICON_NAMES[key]}
                    prefix="+"
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {(phase === 'parade' || phase === 'reveal') && (
          <p className="chest-opening__hint pixel-font">[ Click or Enter ]</p>
        )}

        {isOpen && <SparkleLayer count={CHEST_OPENING.sparkleCount} />}
      </div>
    </OverlayContainer>
  );
}
