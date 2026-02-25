import { Button } from '~/components/ui/button';
import { FancyBorderPixelButton } from '~/components/ui/fancy-border-pixel-button';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '~/components/ui/tooltip';
import { MarqueeText } from '~/components/marquee/marquee-text';
import { NarikRedwoodBitFont } from '~/components/bitmap-fonts/narik-redwood';
import { NarikWoodBitFont } from '~/components/bitmap-fonts/narik-wood';
import { FrostyRpgIcon } from '~/components/sprite-icons/frost-icons';

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
        {/* Sprite Icons: Frost */}
        <div className="mt-6 flex flex-col gap-4">
          <h2 className="text-xl font-bold">Sprite Icons (Frost)</h2>
          <div className="flex items-end gap-3">
            <FrostyRpgIcon name="smallPotion" />
            <FrostyRpgIcon name="smallPotion" size={32} />
            <FrostyRpgIcon name="smallPotion" size={48} />
            <FrostyRpgIcon name="largePotion" size={48} />
          </div>
          <div className="flex flex-wrap gap-2">
            <FrostyRpgIcon name="herb" size={32} />
            <FrostyRpgIcon name="berries" size={32} />
            <FrostyRpgIcon name="mushroom" size={32} />
            <FrostyRpgIcon name="feather" size={32} />
            <FrostyRpgIcon name="blueCrystal" size={32} />
            <FrostyRpgIcon name="redCrystal" size={32} />
            <FrostyRpgIcon name="purpleCrystal" size={32} />
            <FrostyRpgIcon name="coinPurse" size={32} />
          </div>
          <div className="flex flex-wrap gap-2">
            <FrostyRpgIcon name="scroll" size={32} />
            <FrostyRpgIcon name="goldKey" size={32} />
            <FrostyRpgIcon name="skull" size={32} />
            <FrostyRpgIcon name="compass" size={32} />
            <FrostyRpgIcon name="ring" size={32} />
            <FrostyRpgIcon name="bomb" size={32} />
            <FrostyRpgIcon name="coins" size={32} />
            <FrostyRpgIcon name="chalice" size={32} />
          </div>
          <div className="flex flex-wrap gap-2">
            <FrostyRpgIcon name="shortSword" size={32} />
            <FrostyRpgIcon name="flameSword" size={32} />
            <FrostyRpgIcon name="battleAxe" size={32} />
            <FrostyRpgIcon name="longBow" size={32} />
            <FrostyRpgIcon name="mageStaff" size={32} />
            <FrostyRpgIcon name="ironArmor" size={32} />
            <FrostyRpgIcon name="steelHelm" size={32} />
            <FrostyRpgIcon name="shield" size={32} />
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
