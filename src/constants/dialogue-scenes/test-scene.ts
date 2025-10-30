import type { DialogueScene } from "~/types/dialogue";

export const TEST_DIALOGUE_SCENE: DialogueScene = {
  id: "test-scene-1",
  characters: [
    {
      id: "innkeeper",
      name: "Innkeeper",
      portrait: "/assets/portraits/Innkeeper_02.png",
      side: "left",
    },
    {
      id: "witch",
      name: "Mysterious Witch",
      portrait: "/assets/portraits/Witch_03.png",
      side: "right",
    },
  ],
  lines: [
    {
      id: "line-1",
      speakerId: "innkeeper",
      text: "Welcome, traveler! You look weary from your journey. Can I get you something to drink?",
    },
    {
      id: "line-2",
      speakerId: "witch",
      text: "I'll have whatever's strongest. I've come a long way seeking ancient knowledge.",
      emotion: "mysterious",
    },
    {
      id: "line-3",
      speakerId: "innkeeper",
      text: "Ancient knowledge, eh? You're not the first to come here looking for that. There's an old library in the mountains...",
    },
    {
      id: "line-4",
      speakerId: "witch",
      text: "The Crimson Library? I've heard tales of it. They say it holds secrets from before the Great Calamity.",
      emotion: "curious",
    },
    {
      id: "line-5",
      speakerId: "innkeeper",
      text: "Aye, that's the one. But be warned - many have ventured there, and few have returned.",
    },
    {
      id: "line-6",
      speakerId: "witch",
      text: "I appreciate the warning, but I didn't come all this way to turn back now. Tell me, how do I get there?",
      emotion: "determined",
    },
    {
      id: "line-7",
      speakerId: "innkeeper",
      text: "Head north through the Whispering Woods. When you reach the fork in the road, take the eastern path. You'll know you're close when the air grows cold.",
    },
    {
      id: "line-8",
      speakerId: "witch",
      text: "Thank you, innkeeper. Your help won't be forgotten. Now, about that drink...",
      emotion: "grateful",
    },
  ],
};

export const SIMPLE_DIALOGUE_SCENE: DialogueScene = {
  id: "simple-scene",
  characters: [
    {
      id: "innkeeper",
      name: "Innkeeper",
      portrait: "/assets/portraits/Innkeeper_02.png",
      side: "center",
    },
  ],
  lines: [
    {
      id: "line-1",
      speakerId: "innkeeper",
      text: "Welcome to the Golden Tankard Inn!",
    },
    {
      id: "line-2",
      speakerId: "innkeeper",
      text: "We have the finest ale in all the land.",
    },
    {
      id: "line-3",
      speakerId: "innkeeper",
      text: "Make yourself at home, traveler!",
    },
  ],
};
