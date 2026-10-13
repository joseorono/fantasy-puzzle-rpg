import { useState } from 'react';
import { soundService } from '~/services/sound-service';
import { SoundNames } from '~/constants/audio';
import { getNavDirection, isConfirmKey } from '~/constants/keyboard';
import { TUTORIAL_TOPICS, TUTORIAL_TOPIC_ORDER } from '~/constants/tutorial';
import { useWindowKeyDown } from '~/hooks/use-window-keydown';
import { cn } from '~/lib/utils';
import { FrostyRpgIcon } from '~/components/sprite-icons/frost-icons';
import { PauseMenuTabHeader } from '~/components/pause-menu/pause-menu-tab-header';
import type { TutorialTopicId } from '~/types/tutorial';

interface PauseMenuTutorialProps {
  /** The content zone owns the keyboard — ↑↓ pick a topic. */
  keyboardActive?: boolean;
}

/** Hidden tab: every tutorial topic, one at a time. Opened with H / ? or the map's key hint. */
export function PauseMenuTutorial({ keyboardActive = false }: PauseMenuTutorialProps) {
  const [selectedId, setSelectedId] = useState<TutorialTopicId>(TUTORIAL_TOPIC_ORDER[0]);

  function selectTopic(id: TutorialTopicId) {
    if (id === selectedId) return;
    soundService.playSound(SoundNames.clickChangeTab, 0.35, 0.1, 0.05);
    setSelectedId(id);
  }

  // No sidebar entry to hand back to, so ← / → / Enter are swallowed; Esc closes the menu.
  useWindowKeyDown((event) => {
    if (event.defaultPrevented) return;

    const direction = getNavDirection(event.key);
    if (direction === 'up' || direction === 'down') {
      event.preventDefault();
      const count = TUTORIAL_TOPIC_ORDER.length;
      const step = direction === 'down' ? 1 : -1;
      selectTopic(TUTORIAL_TOPIC_ORDER[(TUTORIAL_TOPIC_ORDER.indexOf(selectedId) + step + count) % count]);
      return;
    }

    if (direction === 'left' || direction === 'right' || isConfirmKey(event.key)) {
      event.preventDefault();
    }
  }, keyboardActive);

  const selected = TUTORIAL_TOPICS[selectedId];

  return (
    <>
      <PauseMenuTabHeader text="Tutorial" hint="How everything works, in short." />
      <div className="pause-menu-tutorial-layout">
        <div className="pause-menu-item-list pause-menu-tutorial-list">
          {TUTORIAL_TOPIC_ORDER.map((id) => {
            const topic = TUTORIAL_TOPICS[id];
            const isSelected = id === selectedId;
            return (
              <div
                key={id}
                className={cn(
                  'pause-menu-item-row',
                  isSelected && 'selected',
                  keyboardActive && isSelected && 'kb-cursor',
                )}
                onClick={() => selectTopic(id)}
              >
                <span className="pause-menu-item-row__icon">
                  <FrostyRpgIcon name={topic.iconName} size={24} />
                </span>
                <span className="pause-menu-item-row__name pixel-font">{topic.title}</span>
              </div>
            );
          })}
        </div>

        <article key={selected.id} className="pause-menu-tutorial-card">
          <h3 className="pause-menu-tutorial-card__title pixel-font">{selected.title}</h3>
          <ul className="pause-menu-tutorial-card__lines">
            {selected.lines.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </article>
      </div>
    </>
  );
}
