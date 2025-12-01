# Prompt: UI Design for an RPG Pause Menu

## Goal

Design a user interface for a classic JRPG-style pause menu (think Final Fantasy). The menu should overlay the main game screen and provide access to common RPG functions like inventory, equipment, and party stats.

## Core Layout

The menu should be a full-screen overlay with a semi-transparent dark backdrop that dims the game behind it. The layout is divided into three main sections:

1.  **Main Navigation (Left Panel)**: A vertical list of primary menu options.
2.  **Party Status (Right Panel)**: A persistent display of the current party members' core stats.
3.  **Content Area (Center/Right)**: A dynamic panel that displays detailed information based on the selection in the Main Navigation.

---

## 1. Main Navigation Panel

A clean, vertical list of selectable text options on the left side of the screen.

-   **Items**: View and use items from the inventory.
-   **Equip**: Change party members' equipment.
-   **Stats**: View detailed statistics for each party member.
-   **Options**: Adjust game settings (e.g., sound, text speed).
-   **Exit**: Close the menu and return to the game.

**Interaction:**
-   One option is always highlighted as the "active" selection.
-   The highlight should be visually distinct (e.g., a glowing arrow, a different background color, a border).

---

## 2. Party Status Panel

This panel should always be visible on the right side of the screen. It provides an at-a-glance summary of the party.

For each party member, display:
-   **Name**: Character's name (e.g., "Warrior").
-   **Class**: Character's class (e.g., "Warrior", "Rogue").
-   **Level**: Current level (e.g., "Lv. 10").
-   **HP Bar**: A visual representation of current vs. maximum health.
-   **HP Text**: The numeric value, e.g., "HP 150 / 200".

**Data Structure for a Party Member:**
```json
{
  "id": "warrior",
  "name": "Warrior",
  "class": "warrior",
  "level": 10,
  "currentHp": 150,
  "maxHp": 200,
  "stats": {
    "pow": 25, // Power
    "vit": 30, // Vitality
    "spd": 15  // Speed
  }
}
```

---

## 3. Content Area

This is the main, dynamic part of the menu. Its content changes based on the active selection from the Main Navigation panel.

### When "Items" is selected:

-   **Layout**: A two-panel layout. The left shows a categorized list of items, and the right shows details for the selected item.
-   **Item List**: A scrollable list of items, grouped by categories (`Consumable`, `Equipment`, `Key Item`). Each item in the list should show its name and the quantity owned (e.g., "Potion x15").
-   **Item Details**: When an item is selected, this area shows its name, a descriptive paragraph, and its icon.
-   **Currency Display**: Show the party's current currency at the bottom of this view (e.g., "Coins: 5000").

**Data Structure for an Item:**
```json
{
  "id": "potion",
  "name": "Potion",
  "description": "Heals a small amount of HP. Tastes like red.",
  "type": "consumable",
  "quantityOwned": 15
}
```

### When "Equip" is selected:

-   **Layout**: A view focused on a single character at a time. The user can cycle through party members.
-   **Character Selection**: Clearly indicate which party member is currently selected.
-   **Equipment Slots**: Display the character's available equipment slots (e.g., `Weapon`, `Armor`). Show the name and icon of the item currently equipped in each slot.
-   **Stat Changes**: When browsing available equipment for a slot, show a preview of how equipping that item will change the character's stats (e.g., `POW +5`, `SPD -2`).

**Data Structure for an Equipment Item:**
```json
{
  "id": "iron-sword",
  "name": "Iron Sword",
  "description": "A trusty, if a bit dull, sword.",
  "type": "equipment",
  "forClass": "warrior", // Optional: class restriction
  "statBonuses": {
    "pow": 5,
    "vit": 2,
    "spd": 0
  }
}
```

### When "Stats" is selected:

-   **Layout**: A full-page view dedicated to the stats of a single, selectable party member.
-   **Core Stats**: Display all primary stats clearly (e.g., `Power`, `Vitality`, `Speed`).
-   **Derived Stats**: Show other important values like `HP`, `Attack Damage`, `Defense`, etc.
-   **Experience**: Include an experience bar and text showing progress to the next level (e.g., "Next Level: 500 / 1200 EXP").

### When "Options" is selected:

-   **Layout**: A simple, scrollable list of game settings.
-   **Examples**: `Music Volume`, `Sound Effects Volume`, `Text Speed`, `Screen Shake (On/Off)`.
-   **Interaction**: Use common UI elements like sliders for volume and toggles for on/off settings.
