import { useState } from 'react';
import { DialogueScene } from '~/components/dialogue';
import {
  TEST_DIALOGUE_SCENE,
  SIMPLE_DIALOGUE_SCENE,
  CUTSCENE_WITH_NARRATOR,
} from '~/constants/dialogue/scenes/test-scene';
import { FrostyRpgIcon } from '~/components/sprite-icons/frost-icons';
import { ToffecButton } from '~/components/ui-custom/toffec-button';

export function DialogueTestView() {
  const [activeScene, setActiveScene] = useState<'test' | 'simple' | 'narrator' | null>(null);
  const [sceneKey, setSceneKey] = useState(0);

  function handleComplete() {
    console.log('Dialogue scene completed!');
    setActiveScene(null);
  }

  function startScene(scene: 'test' | 'simple' | 'narrator') {
    setSceneKey((k) => k + 1);
    setActiveScene(scene);
  }

  function closeDialogue() {
    setActiveScene(null);
  }

  return (
    <div className="dialogue-test-view">
      <div
        className="flex min-h-screen flex-col items-center justify-center gap-8 p-8"
        style={{
          backgroundImage: "url('/assets/bg/looping/bg-board-2.png')",
          backgroundRepeat: 'repeat',
          backgroundSize: 'auto',
        }}
      >
        {/* Header card */}
        <div className="nim w-[420px]">
          <div className="nim-header">
            <div className="nim-icon-wrapper">
              <FrostyRpgIcon name="openBook" size={28} />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="nim-title pixel-font">Dialogue System Test</h2>
              <p className="nim-type pixel-font">Demo</p>
            </div>
          </div>

          <div className="nim-description">
            <p>Pick a scene to preview the dialogue system.</p>
          </div>

          <div className="nim-actions">
            <ToffecButton variant="cream" size="sm" className="nim-btn" onClick={() => startScene('test')}>
              <FrostyRpgIcon name="openBook" size={16} />
              Test Scene
            </ToffecButton>

            <ToffecButton variant="tan" size="sm" className="nim-btn" onClick={() => startScene('simple')}>
              <FrostyRpgIcon name="openBook" size={16} />
              Simple Scene
            </ToffecButton>

            <ToffecButton variant="mauve" size="sm" className="nim-btn" onClick={() => startScene('narrator')}>
              <FrostyRpgIcon name="orbPurple" size={16} />
              Narrator Cutscene
            </ToffecButton>

            {activeScene && (
              <ToffecButton variant="orange" size="sm" className="nim-btn" onClick={closeDialogue}>
                Close Dialogue
              </ToffecButton>
            )}
          </div>
        </div>

        {/* Controls reference card */}
        <div className="nim w-[420px]">
          <div className="nim-header">
            <div className="nim-icon-wrapper">
              <FrostyRpgIcon name="lantern" size={28} />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="nim-title pixel-font">Controls</h2>
              <p className="nim-type pixel-font">Reference</p>
            </div>
          </div>

          <div className="nim-description">
            <p>• Click or press SPACE/ENTER to advance</p>
            <p>• Hold CTRL to fast-forward text</p>
            <p>• Scroll up to open Message History</p>
            <p>• First click completes current text</p>
            <p>• Second click advances to next line</p>
          </div>
        </div>

        {/* Features card */}
        <div className="nim w-[420px]">
          <div className="nim-header">
            <div className="nim-icon-wrapper">
              <FrostyRpgIcon name="orbPurple" size={28} />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="nim-title pixel-font">Features</h2>
              <p className="nim-type pixel-font">Info</p>
            </div>
          </div>

          <div className="nim-description">
            <p>• Typewriter text animation</p>
            <p>• Character portraits with active/inactive states</p>
            <p>• Message History/Log (scroll up to open)</p>
            <p>• Narrator support for cutscenes</p>
            <p>• Retro 16-bit pixel art aesthetic</p>
            <p>• Speaker name display & continue indicator</p>
          </div>
        </div>
      </div>

      {/* Active dialogue scene */}
      {activeScene === 'test' && (
        <DialogueScene key={sceneKey} scene={TEST_DIALOGUE_SCENE} onComplete={handleComplete} />
      )}

      {activeScene === 'simple' && (
        <DialogueScene key={sceneKey} scene={SIMPLE_DIALOGUE_SCENE} onComplete={handleComplete} />
      )}

      {activeScene === 'narrator' && (
        <DialogueScene key={sceneKey} scene={CUTSCENE_WITH_NARRATOR} onComplete={handleComplete} />
      )}
    </div>
  );
}
