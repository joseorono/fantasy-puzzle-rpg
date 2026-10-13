import { useAtomValue } from 'jotai';
import { lastLineClearAtom } from '~/stores/battle-atoms';
import { BattleCallout } from '~/components/battle/battle-callout';

/**
 * Centered "ROW CLEAR!" / "COLUMN CLEAR!" callout that flashes as a line-clear item resolves on the
 * board (see {@link lastLineClearAtom}). Warm amber, the same tone as the stagger callouts.
 */
export function LineClearIndicator() {
  const lastLineClear = useAtomValue(lastLineClearAtom);
  const label = lastLineClear?.orientation === 'column' ? 'COLUMN CLEAR!' : 'ROW CLEAR!';
  return <BattleCallout trigger={lastLineClear} label={label} color="#f6c453" />;
}
