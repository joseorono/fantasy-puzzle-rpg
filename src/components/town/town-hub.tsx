import { useState } from "react";
import type { Resources } from "~/types/resources";
import type { ConsumableItemData } from "~/types";
import type { townLocations } from "~/types/map";
import Blacksmith from "./blacksmith";
import Inn from "./inn";
import ItemStore from "./item-store";
import type { ItemStoreParams } from "~/types";
import { Button } from '../ui/8bit/button';

interface TownHubProps {
    innCost: Resources;
    itemsForSell: ItemStoreParams;
    onLeaveCallback: () => void;
}

export default function TownHub({ innCost, itemsForSell, onLeaveCallback }: TownHubProps) {

    
    const [currentLocation, setCurrentLocation] = useState<townLocations>("town-hub");
    const handleGoToPlace = (place: townLocations) => {
        setCurrentLocation(place);
    };

    const handleReturnToHub = () => {
        setCurrentLocation("town-hub");
    };

    switch (currentLocation) {
        case "blacksmith":
            return <Blacksmith onLeaveCallback={handleReturnToHub} />;
        case "inn":
            return <Inn price={innCost} onLeaveCallback={handleReturnToHub} />;
        case "item-store":
            return <ItemStore itemsForSell={itemsForSell} onLeaveCallback={handleReturnToHub} />;
    }
    
    return (
        <div>
            <h1>Town Hub</h1>
            <Button onClick={() => handleGoToPlace("blacksmith")}>Blacksmith</Button>
            <Button onClick={() => handleGoToPlace("inn")}>Inn</Button>
            <Button onClick={() => handleGoToPlace("item-store")}>Item Store</Button>
            <Button onClick={onLeaveCallback}>Leave</Button>
        </div>
    );
}