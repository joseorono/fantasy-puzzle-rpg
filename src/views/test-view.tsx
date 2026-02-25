import { Button } from '~/components/ui/button';
import { FancyBorderPixelButton } from '~/components/ui/fancy-border-pixel-button';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '~/components/ui/tooltip';
import { MarqueeText } from '~/components/marquee/marquee-text';
import { NarikRedwoodBitFont } from '~/components/bitmap-fonts/narik-redwood';
import { NarikWoodBitFont } from '~/components/bitmap-fonts/narik-wood';

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
          <NarikRedwoodBitFont text="HELLO WORLD" size={1} />
          <NarikRedwoodBitFont text="Hello World" size={2} />
          <NarikRedwoodBitFont text="abcdefghijkl" size={3} />
          <NarikRedwoodBitFont text="Score: 12345" size={4} />
          <NarikRedwoodBitFont text="BITMAP 5x" size={5} />
          <NarikRedwoodBitFont text="Big Text" size={8} />
        </div>
        {/* Bitmap Font: Narik Wood */}
        <div className="mt-6 flex flex-col gap-4">
          <NarikWoodBitFont text="HELLO WORLD" size={1} />
          <NarikWoodBitFont text="Hello World" size={2} />
          <NarikWoodBitFont text="abcdefghijkl" size={3} />
          <NarikWoodBitFont text="Score: 12345" size={4} />
          <NarikWoodBitFont text="BITMAP 5x" size={5} />
          <NarikWoodBitFont text="Big Text" size={8} />
        </div>
      </div>
    </TooltipProvider>
  );
}
