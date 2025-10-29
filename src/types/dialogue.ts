
export type DialogueSide = "left" | "right";

export interface DialogueCharacter {
  id: string;
  name: string;
  portrait?: string; // URL or image path
  side: DialogueSide;
}

export interface DialogueLine {
  id: string;
  speakerId: string; // reference to DialogueCharacter.id
  text: string;
  emotion?: string; // optional (e.g. "angry", "happy", etc.)
  // could also store additional metadata like sound effects, animation cues, etc.
}

export interface DialogueScene {
  id: string;
  characters: DialogueCharacter[];
  lines: DialogueLine[];
}
