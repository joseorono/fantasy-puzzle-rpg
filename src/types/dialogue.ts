
export type DialogueSide = "left" | "right" | "center";

export interface DialogueCharacter {
  id: string;
  name?: string;
  portrait?: string; // URL or image path
  side: DialogueSide;
}

export interface DialogueLine {
  id: string;
  speakerId: string; // reference to DialogueCharacter.id
  text: string;
  emotion?: string; // optional (e.g. "angry", "happy", etc.)
  showPortrait?: boolean; // default: true
  rotate90deg?: boolean; // default: false (rotate portrait 90 degrees; assumes all portraits face right)
  // could also store additional metadata like sound effects, animation cues, etc.
}

export interface DialogueScene {
  id: string;
  characters: DialogueCharacter[];
  lines: DialogueLine[];
}
