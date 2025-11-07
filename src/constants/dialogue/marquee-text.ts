export type MarqueeTextTypes = "blacksmith" | "inn"
| "item-shop" | "level-up" | "world-map";

// Type: Object of String Arrays
export const MARQUEE_HELP_TEXT: Readonly<{ [K in MarqueeTextTypes]: readonly string[] }> = {
    "blacksmith": [
        "The "
    ],
    "inn": [
        ""
    ],
    "item-shop": [
        ""
    ],
    "level-up": [
        ""
    ],
    "world-map": [
        ""
    ]
} as const;
