import { CHARACTER_COLORS, CHARACTER_ICONS } from '~/constants/party';
import { RESOURCE_ICON_NAMES } from '~/constants/resources';
import { SAVE_SLOT_LABELS, type SaveSlotId } from '~/constants/storage-keys';
import { deriveSaveSummary, formatPlaytime } from '~/lib/save-game';
import { cn } from '~/lib/utils';
import type { SaveGame } from '~/types/save-game';
import { FrostyRpgIcon } from '~/components/sprite-icons/frost-icons';
import { ToffecBeigeCornersWrapper } from '~/components/cursor/toffec-beige-corners-wrapper';

const timestampFormatter = new Intl.DateTimeFormat(undefined, { dateStyle: 'short', timeStyle: 'short' });

interface SaveSlotCardProps {
  slotId: SaveSlotId;
  /** The slot's contents, or null when empty. */
  save: SaveGame | null;
  /** Save mode overwrites; load mode restores. Changes the empty-slot wording only. */
  mode: 'save' | 'load';
  selected: boolean;
  onActivate: () => void;
  /** Omitted for slots that can't be cleared (autosave, empty slots). */
  onDelete?: () => void;
  disabled?: boolean;
}

/**
 * One row in the save/load list: a party-and-progress summary of what's in the slot,
 * or an empty placeholder. Selection uses the app-standard corner brackets so keyboard
 * and pointer highlighting look identical to every other menu.
 */
export function SaveSlotCard({ slotId, save, mode, selected, onActivate, onDelete, disabled }: SaveSlotCardProps) {
  const summary = save ? deriveSaveSummary(save) : null;

  return (
    <ToffecBeigeCornersWrapper className="save-slot-card-wrapper" forceDisplay={selected}>
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled}
        className={cn(
          'save-slot-card',
          !summary && 'save-slot-card--empty',
          slotId === 'autosave' && 'save-slot-card--autosave',
          selected && 'save-slot-card--selected',
          disabled && 'save-slot-card--disabled',
        )}
        onClick={disabled ? undefined : onActivate}
        onKeyDown={(event) => {
          if (disabled || (event.key !== 'Enter' && event.key !== ' ')) return;
          event.preventDefault();
          onActivate();
        }}
      >
        <span className="save-slot-card__plaque pixel-font">
          {slotId === 'autosave' && (
            <img src="/assets/icons/indigolay/icon-autosave.png" alt="" className="save-slot-card__plaque-icon" />
          )}
          {SAVE_SLOT_LABELS[slotId]}
        </span>

        <div className="save-slot-card__content">
          <div className="save-slot-card__main">
            {summary ? (
              <>
                <div className="save-slot-card__party">
                  {summary.party.map((member) => {
                    const Icon = CHARACTER_ICONS[member.class];
                    return (
                      <span key={member.id} className="save-slot-card__member" title={member.name}>
                        <Icon className={cn('save-slot-card__member-icon', CHARACTER_COLORS[member.class].icon)} />
                        <span className="save-slot-card__member-level pixel-font">Lv{member.level}</span>
                      </span>
                    );
                  })}
                </div>

                <div className="save-slot-card__meta pixel-font">
                  <span className="save-slot-card__stat">
                    <FrostyRpgIcon name={RESOURCE_ICON_NAMES.coins} size={16} />
                    {summary.coins}
                  </span>
                  <span className="save-slot-card__stat">
                    <FrostyRpgIcon name={RESOURCE_ICON_NAMES.gold} size={16} />
                    {summary.gold}
                  </span>
                  <span className="save-slot-card__location">{summary.mapName}</span>
                </div>
              </>
            ) : (
              <div className="save-slot-card__empty-text pixel-font">
                {mode === 'save' ? '— Empty — Save here' : '— Empty —'}
              </div>
            )}
          </div>

          {summary && (
            <div className="save-slot-card__side">
              <div className="save-slot-card__details">
                <span className="save-slot-card__timestamp pixel-font">{timestampFormatter.format(summary.savedAt)}</span>
                <span className="save-slot-card__playtime pixel-font">{formatPlaytime(summary.playtimeMs)}</span>
              </div>
              {onDelete && (
                <button
                  type="button"
                  className="save-slot-card__delete"
                  aria-label={`Delete ${SAVE_SLOT_LABELS[slotId]}`}
                  onClick={(event) => {
                    event.stopPropagation();
                    onDelete();
                  }}
                >
                  <img src="/assets/icons/indigolay/Icon_trash.png" alt="" className="save-slot-card__delete-icon" />
                </button>
              )}
            </div>
          )}
        </div>

      </div>
    </ToffecBeigeCornersWrapper>
  );
}
