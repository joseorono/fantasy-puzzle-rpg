import { Button } from '~/components/ui/button';
import { FancyBorderPixelButton } from '~/components/ui/fancy-border-pixel-button';

export default function TestView() {
  function handleClick() {
    console.log('Test button clicked!');
  }

  return (
    <div className="p-8">
      <h1 className="mb-4 text-3xl font-bold">Test View</h1>
      <Button onClick={handleClick}>Test Button</Button>
      <div className="mt-6 flex items-center gap-4">
        <FancyBorderPixelButton
          label="LEVEL UP"
          onClick={handleClick}
          fillColor="#6f7f8a"
          textColor="#cdd6db"
          frameOuterColor="#a9905b"
          frameInnerColor="#d8c999"
        />
      </div>
    </div>
  );
}
