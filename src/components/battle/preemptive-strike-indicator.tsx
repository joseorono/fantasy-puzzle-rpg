import { useAtomValue } from 'jotai';
import { lastPreemptiveStrikeAtom } from '~/stores/battle-atoms';
import { BattleCallout } from '~/components/battle/battle-callout';

/**
 * Centered "Preemptive Strike!" callout that flashes when a hit lands on a still-observing
 * enemy (see {@link lastPreemptiveStrikeAtom}).
 */
export function PreemptiveStrikeIndicator() {
  const lastPreemptiveStrike = useAtomValue(lastPreemptiveStrikeAtom);
  return <BattleCallout trigger={lastPreemptiveStrike} label="Preemptive Strike!" color="#ffd47a" />;
}
