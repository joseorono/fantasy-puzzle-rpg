import { ToffecButton } from '~/components/ui-custom/toffec-button';

export default function ToffecButtonDemo() {
  const handleClick = () => {
    console.log('Button clicked!');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-2 text-4xl font-bold text-white">ToffecButton Component Demo</h1>
        <p className="mb-8 text-slate-300">Reusable pixel-art pill-shaped buttons with cva variants</p>

        {/* Color Variants */}
        <section className="mb-12">
          <h2 className="mb-6 text-2xl font-bold text-white">Color Variants</h2>
          <div className="flex flex-wrap gap-6">
            <ToffecButton variant="tan" onClick={handleClick}>
              Tan
            </ToffecButton>
            <ToffecButton variant="mauve" onClick={handleClick}>
              Mauve
            </ToffecButton>
            <ToffecButton variant="orange" onClick={handleClick}>
              Orange
            </ToffecButton>
            <ToffecButton variant="cream" onClick={handleClick}>
              Cream
            </ToffecButton>
            <ToffecButton variant="gray" onClick={handleClick}>
              Gray
            </ToffecButton>
          </div>
        </section>

        {/* Size Variants */}
        <section className="mb-12">
          <h2 className="mb-6 text-2xl font-bold text-white">Size Variants (Pill)</h2>
          <div className="flex flex-wrap items-center gap-6">
            <div>
              <p className="mb-2 text-sm text-slate-400">Small</p>
              <ToffecButton variant="tan" size="sm" onClick={handleClick}>
                Small
              </ToffecButton>
            </div>
            <div>
              <p className="mb-2 text-sm text-slate-400">Default</p>
              <ToffecButton variant="tan" onClick={handleClick}>
                Default
              </ToffecButton>
            </div>
            <div>
              <p className="mb-2 text-sm text-slate-400">Large</p>
              <ToffecButton variant="tan" size="lg" onClick={handleClick}>
                Large
              </ToffecButton>
            </div>
          </div>
        </section>

        {/* Circle Variants */}
        <section className="mb-12">
          <h2 className="mb-6 text-2xl font-bold text-white">Circle Variants</h2>
          <div className="flex flex-wrap items-center gap-6">
            <div>
              <p className="mb-2 text-sm text-slate-400">Circle SM</p>
              <ToffecButton variant="tan" size="circle-sm" onClick={handleClick}>
                →
              </ToffecButton>
            </div>
            <div>
              <p className="mb-2 text-sm text-slate-400">Circle</p>
              <ToffecButton variant="orange" size="circle" onClick={handleClick}>
                ⚡
              </ToffecButton>
            </div>
            <div>
              <p className="mb-2 text-sm text-slate-400">Circle LG</p>
              <ToffecButton variant="cream" size="circle-lg" onClick={handleClick}>
                ✓
              </ToffecButton>
            </div>
          </div>
        </section>

        {/* Disabled State */}
        <section className="mb-12">
          <h2 className="mb-6 text-2xl font-bold text-white">Disabled State</h2>
          <div className="flex flex-wrap gap-6">
            <ToffecButton variant="tan" onClick={handleClick} disabled>
              Disabled
            </ToffecButton>
            <ToffecButton variant="cream" onClick={handleClick} disabled>
              Disabled
            </ToffecButton>
            <ToffecButton variant="orange" size="circle" onClick={handleClick} disabled>
              ✗
            </ToffecButton>
          </div>
        </section>

        {/* Usage Examples */}
        <section>
          <h2 className="mb-6 text-2xl font-bold text-white">Common Usage</h2>
          <div className="flex flex-wrap gap-6">
            <ToffecButton variant="cream" onClick={handleClick}>
              Continue
            </ToffecButton>
            <ToffecButton variant="tan" onClick={handleClick}>
              Reset
            </ToffecButton>
            <ToffecButton variant="orange" onClick={handleClick}>
              Confirm
            </ToffecButton>
            <ToffecButton variant="mauve" onClick={handleClick}>
              Cancel
            </ToffecButton>
          </div>
        </section>
      </div>
    </div>
  );
}
