import { useState } from "react";
import { DialogueScene } from "~/components/dialogue/dialogue-scene";
import {
  TEST_DIALOGUE_SCENE,
  SIMPLE_DIALOGUE_SCENE,
} from "~/constants/dialogue-scenes/test-scene";

export function DialogueTestView() {
  const [activeScene, setActiveScene] = useState<"test" | "simple" | null>(
    null
  );
  const [sceneKey, setSceneKey] = useState(0);

  function handleComplete() {
    console.log("Dialogue scene completed!");
    setActiveScene(null);
  }

  function startTestScene() {
    setSceneKey((k) => k + 1);
    setActiveScene("test");
  }

  function startSimpleScene() {
    setSceneKey((k) => k + 1);
    setActiveScene("simple");
  }

  function closeDialogue() {
    setActiveScene(null);
  }

  return (
    <div className="dialogue-test-view">
      {/* Background scene */}
      <div
        style={{
          minHeight: "100vh",
          background: "linear-gradient(to bottom, #1a1a2e, #0f3460)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "2rem",
          padding: "2rem",
        }}
      >
        <h1
          style={{
            color: "#fff",
            fontFamily: "monospace",
            fontSize: "2rem",
            textShadow: "2px 2px 4px rgba(0, 0, 0, 0.8)",
            marginBottom: "1rem",
          }}
        >
          Dialogue System Test
        </h1>

        <div
          style={{
            display: "flex",
            gap: "1rem",
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          <button
            onClick={startTestScene}
            style={{
              padding: "1rem 2rem",
              fontSize: "1.125rem",
              fontFamily: "monospace",
              fontWeight: "bold",
              backgroundColor: "#16213e",
              color: "#ffd700",
              border: "3px solid #ffd700",
              cursor: "pointer",
              textTransform: "uppercase",
              boxShadow: "0 4px 8px rgba(0, 0, 0, 0.5)",
            }}
          >
            Start Test Scene
          </button>

          <button
            onClick={startSimpleScene}
            style={{
              padding: "1rem 2rem",
              fontSize: "1.125rem",
              fontFamily: "monospace",
              fontWeight: "bold",
              backgroundColor: "#16213e",
              color: "#ffd700",
              border: "3px solid #ffd700",
              cursor: "pointer",
              textTransform: "uppercase",
              boxShadow: "0 4px 8px rgba(0, 0, 0, 0.5)",
            }}
          >
            Start Simple Scene
          </button>

          {activeScene && (
            <button
              onClick={closeDialogue}
              style={{
                padding: "1rem 2rem",
                fontSize: "1.125rem",
                fontFamily: "monospace",
                fontWeight: "bold",
                backgroundColor: "#8b0000",
                color: "#fff",
                border: "3px solid #ff4444",
                cursor: "pointer",
                textTransform: "uppercase",
                boxShadow: "0 4px 8px rgba(0, 0, 0, 0.5)",
              }}
            >
              Close Dialogue
            </button>
          )}
        </div>

        <div
          style={{
            marginTop: "2rem",
            padding: "1.5rem",
            backgroundColor: "rgba(0, 0, 0, 0.6)",
            border: "2px solid #ffd700",
            maxWidth: "600px",
            color: "#fff",
            fontFamily: "monospace",
            lineHeight: "1.6",
          }}
        >
          <h2
            style={{
              color: "#ffd700",
              marginBottom: "1rem",
              fontSize: "1.25rem",
            }}
          >
            Controls:
          </h2>
          <ul style={{ listStyle: "none", padding: 0 }}>
            <li>• Click anywhere or press SPACE/ENTER to advance</li>
            <li>• Hold CTRL to fast-forward text</li>
            <li>• First click completes current text</li>
            <li>• Second click advances to next line</li>
          </ul>

          <h2
            style={{
              color: "#ffd700",
              marginTop: "1.5rem",
              marginBottom: "1rem",
              fontSize: "1.25rem",
            }}
          >
            Features:
          </h2>
          <ul style={{ listStyle: "none", padding: 0 }}>
            <li>• Typewriter text animation</li>
            <li>• Character portraits with active/inactive states</li>
            <li>• Retro 16-bit pixel art aesthetic</li>
            <li>• Dark transparent backdrop</li>
            <li>• Speaker name display</li>
            <li>• Continue indicator</li>
          </ul>
        </div>
      </div>

      {/* Active dialogue scene */}
      {activeScene === "test" && (
        <DialogueScene
          key={sceneKey}
          scene={TEST_DIALOGUE_SCENE}
          onComplete={handleComplete}
        />
      )}

      {activeScene === "simple" && (
        <DialogueScene
          key={sceneKey}
          scene={SIMPLE_DIALOGUE_SCENE}
          onComplete={handleComplete}
        />
      )}
    </div>
  );
}
