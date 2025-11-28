import { Button } from '~/components/ui/button';
import { FancyBorderPixelButton } from '~/components/ui/fancy-border-pixel-button';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '~/components/ui/tooltip';
import { MarqueeText } from '~/components/marquee/marquee-text';

export default function TestView() {
  function handleClick() {
    console.log('Test button clicked!');
  }

  return (
    <TooltipProvider>
      <MarqueeText type="general" variant="marquee--gray" />
      <MarqueeText type="general" variant="marquee--clear" />
      <div className="p-8">
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
      </div>
    </TooltipProvider>
  );
}
