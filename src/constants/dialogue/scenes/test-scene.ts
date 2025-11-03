import type { DialogueScene } from "~/types/dialogue";
import { INNKEEPER_CHAR, WITCH_CHAR, NARRATOR_CHAR, KNIGHT_CHAR, MAGE_CHAR } from "../characters";

export const TEST_DIALOGUE_SCENE: DialogueScene = {
  id: "test-scene-1",
  characters: [INNKEEPER_CHAR, WITCH_CHAR],
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
  characters: [{ ...INNKEEPER_CHAR, side: "center" }],
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

export const CUTSCENE_WITH_NARRATOR: DialogueScene = {
  id: "cutscene-narrator",
  characters: [NARRATOR_CHAR, KNIGHT_CHAR, MAGE_CHAR],
  lines: [
    {
      id: "line-1",
      speakerId: "narrator",
      text: "The ancient temple loomed before them, its weathered stones covered in mysterious runes that glowed faintly in the moonlight.",
    },
    {
      id: "line-2",
      speakerId: "knight",
      text: "This place... it feels wrong. Like we're being watched.",
    },
    {
      id: "line-3",
      speakerId: "mage",
      text: "Your instincts serve you well, Sir Roland. The magical wards here are still active after all these centuries.",
    },
    {
      id: "line-4",
      speakerId: "narrator",
      text: "A cold wind swept through the courtyard, carrying with it whispers of forgotten voices.",
    },
    {
      id: "line-5",
      speakerId: "knight",
      text: "Can you dispel them? We need to get inside before dawn.",
    },
    {
      id: "line-6",
      speakerId: "mage",
      text: "I can try, but breaking these wards will alert whatever guards this place. Are you ready for a fight?",
    },
    {
      id: "line-7",
      speakerId: "knight",
      text: "I was born ready. Do what you must.",
    },
    {
      id: "line-8",
      speakerId: "narrator",
      text: "Elara began to chant, her hands weaving intricate patterns in the air. The runes on the temple walls pulsed with increasing intensity.",
    },
    {
      id: "line-9",
      speakerId: "mage",
      text: "It's done! But we must hurry—the guardians will awaken soon!",
    },
    {
      id: "line-10",
      speakerId: "narrator",
      text: "As if in response to her words, the ground beneath them began to tremble...",
    },
  ],
};
