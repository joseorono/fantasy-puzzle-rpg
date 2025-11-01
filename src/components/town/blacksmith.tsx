import { Button } from '../ui/8bit/button';

export default function Blacksmith({ onLeaveCallback }: { onLeaveCallback: () => void }) {
    return (
        <div>
            <Button onClick={onLeaveCallback}>Leave</Button>
            <h1>Blacksmith</h1>
        </div>
    );
}