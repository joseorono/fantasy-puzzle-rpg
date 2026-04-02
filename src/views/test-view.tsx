import { FranukaSlider } from '~/components/ui-custom/franuka-slider';
import { ToffecButton } from '~/components/ui-custom/toffec-button';
import { ToffecCloseButton } from '~/components/ui-custom/toffec-close-button';
import { FancyBorderPixelButton } from '~/components/ui/fancy-border-pixel-button';
import { Tooltip, TooltipTrigger, TooltipContent } from '~/components/ui-custom/tooltip';
import { MarqueeText } from '~/components/marquee/marquee-text';
import { NarikRedwoodBitFont } from '~/components/bitmap-fonts/narik-redwood';
import { NarikWoodBitFont } from '~/components/bitmap-fonts/narik-wood';
import { FrostyRpgIcon } from '~/components/sprite-icons/frost-icons';
import Franuka05aFrame from '~/components/frames/franuka-05a-frame';

export default function TestView() {
  function handleClick() {
    console.log('Test button clicked!');
  }

  return (
    <>
      <MarqueeText type="general" variant="marquee--gray" />
      <MarqueeText type="general" variant="marquee--clear" />
      <div id="test-view" className="p-8">
        <h1 className="mb-4 text-3xl font-bold">Test View</h1>
        <Tooltip>
          <TooltipTrigger asChild>
            <ToffecButton onClick={handleClick}>Test Button</ToffecButton>
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
        {/* Sprite Icons: Frost (inside Franuka 05a Frame) */}
        <div className="mt-6">
          <Franuka05aFrame>
            <div className="flex flex-col gap-4 p-4">
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
                <FrostyRpgIcon name="bookRed" size={32} />
                <FrostyRpgIcon name="silverKey" size={32} />
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
                <FrostyRpgIcon name="longbow" size={32} />
                <FrostyRpgIcon name="mageStaff" size={32} />
                <FrostyRpgIcon name="ironArmor" size={32} />
                <FrostyRpgIcon name="steelHelm" size={32} />
                <FrostyRpgIcon name="shield" size={32} />
              </div>
            </div>
          </Franuka05aFrame>
        </div>
        {/* ToffecCloseButton variants */}
        <div className="mt-6">
          <Franuka05aFrame>
            <div className="flex flex-col gap-6 p-4">
              <h2 className="text-xl font-bold">ToffecCloseButton</h2>

              {/* With background */}
              <div className="flex flex-col gap-2">
                <p className="text-xs opacity-70">With background (hasBg)</p>
                <div className="flex items-center gap-4">
                  <ToffecCloseButton variant="medieval1" hasBg />
                  <ToffecCloseButton variant="medieval2" hasBg />
                  <ToffecCloseButton variant="medieval3" hasBg />
                  <ToffecCloseButton variant="fairy2" hasBg />
                  <ToffecCloseButton variant="fairy3" hasBg />
                </div>
              </div>

              {/* Without background */}
              <div className="flex flex-col gap-2">
                <p className="text-xs opacity-70">No background (hasBg=false)</p>
                <div className="flex items-center gap-4">
                  <ToffecCloseButton variant="medieval4" hasBg={false} />
                  <ToffecCloseButton variant="medieval5" hasBg={false} />
                  <ToffecCloseButton variant="medieval6" hasBg={false} />
                  <ToffecCloseButton variant="fairy1" hasBg={false} />
                </div>
              </div>

              {/* Size variants */}
              <div className="flex flex-col gap-2">
                <p className="text-xs opacity-70">Sizes (medieval1 with bg)</p>
                <div className="flex items-center gap-4">
                  <ToffecCloseButton variant="medieval1" hasBg size="sm" />
                  <ToffecCloseButton variant="medieval1" hasBg size="default" />
                  <ToffecCloseButton variant="medieval1" hasBg size="lg" />
                  <ToffecCloseButton variant="medieval1" hasBg size="xl" />
                </div>
              </div>

              {/* Size variants without frame*/}
              <div className="flex flex-col gap-2">
                <p className="text-xs opacity-70">Sizes (medieval5 no bg)</p>
                <div className="flex items-center gap-4">
                  <ToffecCloseButton variant="medieval5" hasBg={false} size="sm" />
                  <ToffecCloseButton variant="medieval5" hasBg={false} size="default" />
                  <ToffecCloseButton variant="medieval5" hasBg={false} size="lg" />
                  <ToffecCloseButton variant="medieval5" hasBg={false} size="xl" />
                </div>
              </div>

              {/* Disabled */}
              <div className="flex flex-col gap-2">
                <p className="text-xs opacity-70">Disabled</p>
                <div className="flex items-center gap-4">
                  <ToffecCloseButton variant="medieval1" hasBg disabled />
                  <ToffecCloseButton variant="fairy3" hasBg disabled />
                  <ToffecCloseButton variant="medieval5" hasBg={false} disabled />
                </div>
              </div>
            </div>
          </Franuka05aFrame>
        </div>
        {/* FranukaSlider variants */}
        <div className="mt-6">
          <Franuka05aFrame>
            <div className="flex flex-col gap-6 p-4">
              <h2 className="text-xl font-bold">FranukaSlider Variants</h2>

              {/* Background: Wood */}
              <div className="flex flex-col gap-2">
                <p className="text-xs opacity-70">Wood frame + blue fill (default)</p>
                <FranukaSlider defaultValue={[60]} max={100} step={1} />
              </div>
              <div className="flex flex-col gap-2">
                <p className="text-xs opacity-70">Wood frame + red fill</p>
                <FranukaSlider defaultValue={[45]} max={100} step={1} fillInVariant="red" />
              </div>
              <div className="flex flex-col gap-2">
                <p className="text-xs opacity-70">Wood frame + green fill</p>
                <FranukaSlider defaultValue={[75]} max={100} step={1} fillInVariant="green" />
              </div>

              {/* Backgrounds only (empty to show the bg) */}
              <div className="flex flex-col gap-2">
                <p className="text-xs opacity-70">Wood frame (empty)</p>
                <FranukaSlider defaultValue={[0]} max={100} step={1} frameVariant="wood" />
              </div>
              <div className="flex flex-col gap-2">
                <p className="text-xs opacity-70">Gold frame (empty)</p>
                <FranukaSlider defaultValue={[0]} max={100} step={1} frameVariant="gold" />
              </div>
              <div className="flex flex-col gap-2">
                <p className="text-xs opacity-70">Ornate frame (empty)</p>
                <FranukaSlider defaultValue={[0]} max={100} step={1} frameVariant="ornate" />
              </div>

              {/* Background: Gold */}
              <div className="flex flex-col gap-2">
                <p className="text-xs opacity-70">Gold frame + red fill</p>
                <FranukaSlider defaultValue={[50]} max={100} step={1} frameVariant="gold" fillInVariant="red" />
              </div>
              <div className="flex flex-col gap-2">
                <p className="text-xs opacity-70">Gold frame + blue fill</p>
                <FranukaSlider defaultValue={[65]} max={100} step={1} frameVariant="gold" fillInVariant="blue" />
              </div>

              {/* Background: Ornate */}
              <div className="flex flex-col gap-2">
                <p className="text-xs opacity-70">Ornate frame + green fill</p>
                <FranukaSlider defaultValue={[55]} max={100} step={1} frameVariant="ornate" fillInVariant="green" />
              </div>
              <div className="flex flex-col gap-2">
                <p className="text-xs opacity-70">Ornate frame + blue fill</p>
                <FranukaSlider defaultValue={[40]} max={100} step={1} frameVariant="ornate" fillInVariant="blue" />
              </div>
            </div>
          </Franuka05aFrame>
        </div>
      </div>
    </>
  );
}
