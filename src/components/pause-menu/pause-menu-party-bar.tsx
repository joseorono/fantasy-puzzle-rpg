import { useParty } from '~/stores/game-store';
import { PartyMemberCard } from '~/components/pause-menu/party-member-card';

export function PauseMenuPartyBar() {
  const party = useParty();

  return (
    <div className="pause-menu-party-bar">
      {party.map((member) => (
        <PartyMemberCard key={member.id} member={member} variant="bar" />
      ))}
    </div>
  );
}
