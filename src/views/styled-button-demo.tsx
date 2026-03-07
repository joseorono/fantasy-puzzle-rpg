import { StyledButton } from '~/components/ui/styled-button';

export default function StyledButtonDemo() {
  const handleClick = () => {
    console.log('Button clicked!');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-2 text-4xl font-bold text-white">StyledButton Component Demo</h1>
        <p className="mb-8 text-slate-300">Reusable pixel-art pill-shaped buttons with cva variants</p>

        {/* Color Variants */}
        <section className="mb-12">
          <h2 className="mb-6 text-2xl font-bold text-white">Color Variants</h2>
          <div className="flex flex-wrap gap-6">
            <StyledButton variant="tan" onClick={handleClick}>
              Tan
            </StyledButton>
            <StyledButton variant="mauve" onClick={handleClick}>
              Mauve
            </StyledButton>
            <StyledButton variant="orange" onClick={handleClick}>
              Orange
            </StyledButton>
            <StyledButton variant="cream" onClick={handleClick}>
              Cream
            </StyledButton>
            <StyledButton variant="gray" onClick={handleClick}>
              Gray
            </StyledButton>
          </div>
        </section>

        {/* Size Variants */}
        <section className="mb-12">
          <h2 className="mb-6 text-2xl font-bold text-white">Size Variants (Pill)</h2>
          <div className="flex flex-wrap items-center gap-6">
            <div>
              <p className="mb-2 text-sm text-slate-400">Small</p>
              <StyledButton variant="tan" size="sm" onClick={handleClick}>
                Small
              </StyledButton>
            </div>
            <div>
              <p className="mb-2 text-sm text-slate-400">Default</p>
              <StyledButton variant="tan" onClick={handleClick}>
                Default
              </StyledButton>
            </div>
            <div>
              <p className="mb-2 text-sm text-slate-400">Large</p>
              <StyledButton variant="tan" size="lg" onClick={handleClick}>
                Large
              </StyledButton>
            </div>
          </div>
        </section>

        {/* Circle Variants */}
        <section className="mb-12">
          <h2 className="mb-6 text-2xl font-bold text-white">Circle Variants</h2>
          <div className="flex flex-wrap items-center gap-6">
            <div>
              <p className="mb-2 text-sm text-slate-400">Circle SM</p>
              <StyledButton variant="tan" size="circle-sm" onClick={handleClick}>
                →
              </StyledButton>
            </div>
            <div>
              <p className="mb-2 text-sm text-slate-400">Circle</p>
              <StyledButton variant="orange" size="circle" onClick={handleClick}>
                ⚡
              </StyledButton>
            </div>
            <div>
              <p className="mb-2 text-sm text-slate-400">Circle LG</p>
              <StyledButton variant="cream" size="circle-lg" onClick={handleClick}>
                ✓
              </StyledButton>
            </div>
          </div>
        </section>

        {/* Disabled State */}
        <section className="mb-12">
          <h2 className="mb-6 text-2xl font-bold text-white">Disabled State</h2>
          <div className="flex flex-wrap gap-6">
            <StyledButton variant="tan" onClick={handleClick} disabled>
              Disabled
            </StyledButton>
            <StyledButton variant="cream" onClick={handleClick} disabled>
              Disabled
            </StyledButton>
            <StyledButton variant="orange" size="circle" onClick={handleClick} disabled>
              ✗
            </StyledButton>
          </div>
        </section>

        {/* Usage Examples */}
        <section>
          <h2 className="mb-6 text-2xl font-bold text-white">Common Usage</h2>
          <div className="flex flex-wrap gap-6">
            <StyledButton variant="cream" onClick={handleClick}>
              Continue →
            </StyledButton>
            <StyledButton variant="tan" onClick={handleClick}>
              Reset
            </StyledButton>
            <StyledButton variant="orange" onClick={handleClick}>
              Confirm
            </StyledButton>
            <StyledButton variant="mauve" onClick={handleClick}>
              Cancel
            </StyledButton>
          </div>
        </section>
      </div>
    </div>
  );
}
