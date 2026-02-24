import { Button } from '~/components/ui/button';
import { FancyBorderPixelButton } from '~/components/ui/fancy-border-pixel-button';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '~/components/ui/tooltip';
import { MarqueeText } from '~/components/marquee/marquee-text';
import { NarikRedwood } from '~/components/bitmap-fonts/narik-redwood';
import { NarikWood } from '~/components/bitmap-fonts/narik-wood';

export default function TestView() {
  function handleClick() {
    console.log('Test button clicked!');
  }

  return (
    <TooltipProvider>
      <MarqueeText type="general" variant="marquee--gray" />
      <MarqueeText type="general" variant="marquee--clear" />
      <div id="test-view" className="p-8">
        <h1 className="mb-4 text-3xl font-bold">Test View</h1>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button onClick={handleClick}>Test Button</Button>
          </TooltipTrigger>
          <TooltipContent side="right">Click to test the button functionality</TooltipContent>
        </Tooltip>
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
        {/* Bitmap Font: Narik Redwood */}
        <div className="mt-6 flex flex-col gap-4">
          <NarikRedwood text="HELLO WORLD" size={1} />
          <NarikRedwood text="Hello World" size={2} />
          <NarikRedwood text="abcdefghijkl" size={3} />
          <NarikRedwood text="Score: 12345" size={4} />
          <NarikRedwood text="BITMAP 5x" size={5} />
          <NarikRedwood text="Big Text" size={8} />
        </div>
        {/* Bitmap Font: Narik Wood */}
        <div className="mt-6 flex flex-col gap-4">
          <NarikWood text="HELLO WORLD" size={1} />
          <NarikWood text="Hello World" size={2} />
          <NarikWood text="abcdefghijkl" size={3} />
          <NarikWood text="Score: 12345" size={4} />
          <NarikWood text="BITMAP 5x" size={5} />
          <NarikWood text="Big Text" size={8} />
        </div>
      </div>
    </TooltipProvider>
  );
}
