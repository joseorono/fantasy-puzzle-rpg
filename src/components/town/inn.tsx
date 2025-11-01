import type { Resources } from "~/types/resources";
import { usePartyActions, usePartyState } from "~/stores/game-store";
import { useResourcesState, useResourcesActions  } from "~/stores/game-store";
import { canAfford } from "~/lib/resources";
import { Button } from '../ui/8bit/button';

export default function Inn({ price, onLeaveCallback }: { price: Resources; onLeaveCallback: () => void }) {

    const partyActions = usePartyActions();
    // const partyState = usePartyState();

    const resourcesActions = useResourcesActions();
    const resourcesState = useResourcesState();

    const handleFullyHealParty = () => {
        if (canAfford(resourcesState, price)) {
            partyActions.fullyHealParty();
            resourcesActions.reduceResources(price);
        } else {
            console.log("Not enough coins");   
        }
    };
    return (
        <div>
            <Button onClick={onLeaveCallback}>Leave</Button>
            <h1>Inn</h1>
            <p>Price: {price.coins} coins</p>
            <Button 
                disabled={partyActions.isPartyFullyHealed() || resourcesState.coins < price.coins} 
                onClick={() => handleFullyHealParty()}>
                Fully heal party
            </Button>
            <div>
                Does the party need healing?
                { partyActions.isPartyFullyHealed() ? "no" : "yes" }
            </div>
        </div>
    );
}