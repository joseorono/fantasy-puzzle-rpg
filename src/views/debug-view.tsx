import type { ComponentType } from 'react';
import InventoryTestView from '~/views/inventory-test';
import ResourcesTestView from '~/views/resources-test';
import SoundTestView from '~/views/sound-test';
import TestView from '~/views/test-view';
import PartyTestView from '~/views/party-test';
import RouterTestView from '~/views/router-test';
import GlobalAnimationTest from '~/views/global-animation-test';
import SkillDebugView from '~/views/skill-debug';

interface DebugSection {
  id: string;
  label: string;
  Component: ComponentType;
  /** Hide this entry from the table of contents (e.g. the TOC itself). */
  hideFromToc?: boolean;
}

const DEBUG_SECTIONS: DebugSection[] = [
  { id: 'global-animation', label: 'Global Animation', Component: GlobalAnimationTest },
  { id: 'router', label: 'Router', Component: RouterTestView },
  { id: 'table-of-contents', label: 'Contents', Component: TableOfContents, hideFromToc: true },
  { id: 'skill-system', label: 'Skill System', Component: SkillDebugView },
  { id: 'party', label: 'Party', Component: PartyTestView },
  { id: 'inventory', label: 'Inventory', Component: InventoryTestView },
  { id: 'resources', label: 'Resources', Component: ResourcesTestView },
  { id: 'sound', label: 'Sound', Component: SoundTestView },
  { id: 'misc', label: 'Misc / Test', Component: TestView },
];

function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/** Sticky table of contents; lives in DEBUG_SECTIONS so it can be reordered. */
function TableOfContents() {
  return (
    <nav className="sticky top-0 z-10 border-b border-slate-700 bg-slate-900/95 px-6 py-3 backdrop-blur">
      <h2 className="mb-2 text-sm font-bold tracking-wide text-slate-300 uppercase">
        Table Of Contents - Debug Sections
      </h2>
      <ul className="flex flex-wrap gap-2">
        {DEBUG_SECTIONS.filter((section) => !section.hideFromToc).map((section) => (
          <li key={section.id}>
            <button
              onClick={() => scrollToSection(section.id)}
              className="rounded bg-slate-700 px-3 py-1 text-sm font-semibold text-white transition-colors hover:bg-slate-600"
            >
              {section.label}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/**
 * Debug view containing all test components, with a table of contents for
 * quickly jumping to a given section.
 */
export default function DebugView() {
  const dividerClasses = 'my-4 border-b border-gray-200';

  return (
    <>
      {DEBUG_SECTIONS.map((section, index) => (
        <section key={section.id} id={section.id} className="scroll-mt-20">
          {index > 0 && <hr className={dividerClasses} />}
          <section.Component />
        </section>
      ))}
    </>
  );
}

