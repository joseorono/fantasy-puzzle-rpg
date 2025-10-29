import { useState, useCallback } from "react";
import type { DialogueScene, DialogueLine } from "../types/dialogue";

export function useDialogue(scene: DialogueScene) {
  const [index, setIndex] = useState(0);

  const currentLine: DialogueLine | undefined = scene.lines[index];
  const next = useCallback(() => {
    setIndex((i) => Math.min(i + 1, scene.lines.length - 1));
  }, [scene.lines.length]);

  const isLast = index === scene.lines.length - 1;

  return { currentLine, index, next, isLast };
}
