import { useGlobalAnimation, type GlobalAnimationType } from '~/components/global-animations-system';

export default function GlobalAnimationTest() {
  const { trigger, triggerSequence } = useGlobalAnimation();
  const buttonClass = "px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors capitalize";

  const animations: GlobalAnimationType[] = ['screen-shake', 'fade-in-and-out', 'view-transition-circle'];

  const handleCombo = () =>
    triggerSequence(animations, () =>
      console.log('All animations done!')
    );

  return (
    <div className='mx-auto max-w-xl'>
      {
        animations.map((animationName) => (
          <button
            key={animationName}
            onClick={() => {
              trigger(animationName)
              .then(() => console.log(`Anim ${animationName} done!`))
            }}
            className={buttonClass}
          >
            Trigger {animationName}
          </button>
        ))
      }
      <button className={buttonClass} onClick={handleCombo}>Combo All Animations</button>
    </div>
  );
}
