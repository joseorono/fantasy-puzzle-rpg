import { useAtomValue } from 'jotai';
import { lastReshuffleAtom } from '~/stores/battle-atoms';
import { BattleCallout } from '~/components/battle/battle-callout';

/**
 * Centered "No moves! Reshuffle!" callout that flashes when a refill left the board dead and
 * it was redistributed (see {@link lastReshuffleAtom}). The moved orbs replay their fall-in
 * animation at the same time, so the text only names what the player is already seeing.
 */
export function BoardReshuffleIndicator() {
  const lastReshuffle = useAtomValue(lastReshuffleAtom);
  return <BattleCallout trigger={lastReshuffle} label="No moves! Reshuffle!" color="#f3dfae" />;
}
