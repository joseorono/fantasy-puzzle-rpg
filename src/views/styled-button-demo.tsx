import { StyledButton } from '~/components/ui/styled-button';

export default function StyledButtonDemo() {
  const handleClick = () => {
    console.log('Button clicked!');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-2 text-4xl font-bold text-white">StyledButton Component Demo</h1>
        <p className="mb-8 text-slate-300">Reusable pixel-art pill-shaped buttons with color variants</p>

        {/* Brown/Tan Colors */}
        <section className="mb-12">
          <h2 className="mb-6 text-2xl font-bold text-white">Brown & Tan Variants</h2>
          <div className="flex flex-wrap gap-6">
            <StyledButton hexColor="#A07151" onClick={handleClick}>
              Next
            </StyledButton>
            <StyledButton hexColor="#8B6F47" onClick={handleClick}>
              Continue
            </StyledButton>
            <StyledButton hexColor="#6B5344" onClick={handleClick}>
              Confirm
            </StyledButton>
            <StyledButton hexColor="#A07151" isCircle={true} onClick={handleClick}>
              →
            </StyledButton>
          </div>
        </section>

        {/* Cream/Beige Colors */}
        <section className="mb-12">
          <h2 className="mb-6 text-2xl font-bold text-white">Cream & Beige Variants</h2>
          <div className="flex flex-wrap gap-6">
            <StyledButton hexColor="#D9C7AC" onClick={handleClick}>
              Finish
            </StyledButton>
            <StyledButton hexColor="#E8DCC8" onClick={handleClick}>
              Accept
            </StyledButton>
            <StyledButton hexColor="#C9B89A" onClick={handleClick}>
              Submit
            </StyledButton>
            <StyledButton hexColor="#D9C7AC" isCircle={true} onClick={handleClick}>
              ✓
            </StyledButton>
          </div>
        </section>

        {/* Orange Colors */}
        <section className="mb-12">
          <h2 className="mb-6 text-2xl font-bold text-white">Orange Variants</h2>
          <div className="flex flex-wrap gap-6">
            <StyledButton hexColor="#C06F21" onClick={handleClick}>
              Proceed
            </StyledButton>
            <StyledButton hexColor="#D9841F" onClick={handleClick}>
              Execute
            </StyledButton>
            <StyledButton hexColor="#B8621A" onClick={handleClick}>
              Activate
            </StyledButton>
            <StyledButton hexColor="#C06F21" isCircle={true} onClick={handleClick}>
              ⚡
            </StyledButton>
          </div>
        </section>

        {/* Gray Colors */}
        <section className="mb-12">
          <h2 className="mb-6 text-2xl font-bold text-white">Gray Variants</h2>
          <div className="flex flex-wrap gap-6">
            <StyledButton hexColor="#8B8680" onClick={handleClick}>
              Neutral
            </StyledButton>
            <StyledButton hexColor="#9D9691" onClick={handleClick}>
              Standard
            </StyledButton>
            <StyledButton hexColor="#7A7570" onClick={handleClick}>
              Default
            </StyledButton>
            <StyledButton hexColor="#8B8680" isCircle={true} onClick={handleClick}>
              ◆
            </StyledButton>
          </div>
        </section>

        {/* Disabled State */}
        <section className="mb-12">
          <h2 className="mb-6 text-2xl font-bold text-white">Disabled State</h2>
          <div className="flex flex-wrap gap-6">
            <StyledButton hexColor="#A07151" onClick={handleClick} disabled>
              Disabled
            </StyledButton>
            <StyledButton hexColor="#D9C7AC" onClick={handleClick} disabled>
              Disabled
            </StyledButton>
            <StyledButton hexColor="#C06F21" isCircle={true} onClick={handleClick} disabled>
              ✗
            </StyledButton>
          </div>
        </section>

        {/* Size Comparison */}
        <section>
          <h2 className="mb-6 text-2xl font-bold text-white">Size Comparison</h2>
          <div className="flex flex-wrap items-center gap-6">
            <div>
              <p className="mb-2 text-sm text-slate-400">Pill (Default)</p>
              <StyledButton hexColor="#A07151" onClick={handleClick}>
                Next
              </StyledButton>
            </div>
            <div>
              <p className="mb-2 text-sm text-slate-400">Circle</p>
              <StyledButton hexColor="#A07151" isCircle={true} onClick={handleClick}>
                →
              </StyledButton>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
