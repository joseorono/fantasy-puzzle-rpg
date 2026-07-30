import { useState } from 'react';
import { IndigoLayStyledLists, IndigolayStyledListItem, type IndigoLayListVariant } from '~/components/ui-custom/indigolay-styled-list';
import { IndigolayDivider } from '~/components/dividers/indigolay-divider';
import { ToffecButton } from '~/components/ui-custom/toffec-button';

interface VariantConfig {
  id: IndigoLayListVariant;
  label: string;
  subtitle: string;
  dividerVariant: 'default' | 'gold' | 'victory' | 'silver';
  badgeColor: string;
  frameClasses: string;
}

const VARIANTS: VariantConfig[] = [
  {
    id: 'indigolay',
    label: 'INDIGOLAY SPELLS & ABILITIES',
    subtitle: 'Classic cyan & indigo spectral glow style',
    dividerVariant: 'default',
    badgeColor: 'text-cyan-400 border-cyan-500/40 bg-cyan-950/50',
    frameClasses: 'border-indigo-600/80 shadow-[0_0_20px_rgba(99,102,241,0.25)]',
  },
  {
    id: 'gilded',
    label: 'GILDED TREASURES & REWARDS',
    subtitle: 'Rich metallic gold & amber style for loot & masteries',
    dividerVariant: 'gold',
    badgeColor: 'text-amber-300 border-amber-500/40 bg-amber-950/50',
    frameClasses: 'border-amber-600/80 shadow-[0_0_20px_rgba(245,158,11,0.25)]',
  },
  {
    id: 'regal',
    label: 'REGAL CROWN & MASTERY',
    subtitle: 'Majestic purple & magenta royal style for noble abilities',
    dividerVariant: 'victory',
    badgeColor: 'text-purple-300 border-purple-500/40 bg-purple-950/50',
    frameClasses: 'border-purple-600/80 shadow-[0_0_20px_rgba(168,85,247,0.25)]',
  },
  {
    id: 'shading',
    label: 'SHADED STATS & ATTRIBUTES',
    subtitle: 'Deep embossed dark obsidian contrast for stats & lore',
    dividerVariant: 'silver',
    badgeColor: 'text-slate-300 border-slate-500/40 bg-slate-950/50',
    frameClasses: 'border-slate-600/80 shadow-[0_0_20px_rgba(148,163,184,0.2)]',
  },
  {
    id: 'sovereign',
    label: 'SOVEREIGN ULTIMATE GOLD',
    subtitle: 'Realistic metallic gold SVG diamond with specular sheen',
    dividerVariant: 'gold',
    badgeColor: 'text-amber-200 border-amber-400/50 bg-amber-950/60 font-bold',
    frameClasses: 'border-amber-500/90 shadow-[0_0_25px_rgba(251,191,36,0.35)]',
  },
  {
    id: 'sovereign-shading',
    label: 'SOVEREIGN GOLD SHADING',
    subtitle: 'Sovereign metallic gold diamond with deep embossed shading contrast',
    dividerVariant: 'gold',
    badgeColor: 'text-amber-200 border-slate-400/50 bg-stone-950/80 font-bold',
    frameClasses: 'border-amber-600/90 shadow-[0_0_25px_rgba(0,0,0,0.6)]',
  },
  {
    id: 'chevron',
    label: 'CHEVRON LIST STYLE',
    subtitle: 'Standard transparent list with Icon_chevron-right.png bullet',
    dividerVariant: 'default',
    badgeColor: 'text-indigo-300 border-indigo-500/40 bg-indigo-950/50',
    frameClasses: 'border-indigo-600/80 shadow-[0_0_20px_rgba(99,102,241,0.25)]',
  },
  {
    id: 'send',
    label: 'SEND LIST STYLE',
    subtitle: 'Standard transparent list with Icon_send.png bullet',
    dividerVariant: 'default',
    badgeColor: 'text-indigo-300 border-indigo-500/40 bg-indigo-950/50',
    frameClasses: 'border-indigo-600/80 shadow-[0_0_20px_rgba(99,102,241,0.25)]',
  },
];

const SAMPLE_ITEMS = [
  'Increases POW by +15% when matching 4 or more red gems',
  'Slows how fast the party Guard meter decays in boss encounters',
  'Reduces item cooldowns by 1.5s after executing a Skill Combo',
];

export default function ListStylesTestView() {
  const [bordered, setBordered] = useState(false);
  const [compact, setCompact] = useState(false);
  const [size, setSize] = useState<'sm' | 'default' | 'lg'>('default');
  const [activeModalVariant, setActiveModalVariant] = useState<IndigoLayListVariant | null>(null);

  const activeConfig = VARIANTS.find((v) => v.id === activeModalVariant);

  return (
    <div className="mx-auto max-w-5xl p-6 text-slate-100">
      {/* Header & Controls */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-slate-700 pb-4">
        <div>
          <h1 className="pixel-font text-xl font-bold tracking-wide text-amber-400">
            Modal List Styles — IndigoLayStyledLists
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Visual de las variantes de listas sobre contenedores de modal: <code className="text-amber-200">sovereign</code> y la variante con sombreado <code className="text-amber-300">sovereign-shading</code>.
          </p>
        </div>

        {/* Global Controls */}
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-800 bg-slate-900/90 p-3 text-xs shadow-md">
          <label className="flex cursor-pointer items-center gap-1.5 select-none text-slate-300 hover:text-white">
            <input
              type="checkbox"
              checked={bordered}
              onChange={(e) => setBordered(e.target.checked)}
              className="accent-amber-500"
            />
            Bordered Items Box (Optional)
          </label>
          <label className="flex cursor-pointer items-center gap-1.5 select-none text-slate-300 hover:text-white">
            <input
              type="checkbox"
              checked={compact}
              onChange={(e) => setCompact(e.target.checked)}
              className="accent-amber-500"
            />
            Compact Mode
          </label>
          <div className="flex items-center gap-1.5 text-slate-400">
            <span>Size:</span>
            {(['sm', 'default', 'lg'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSize(s)}
                className={`rounded px-2.5 py-0.5 font-mono text-xs transition-all ${
                  size === s
                    ? 'bg-amber-600 font-bold text-white shadow-sm'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Modal Container Previews */}
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        {VARIANTS.map((v) => (
          <div
            key={v.id}
            className={`confirm-panel relative flex flex-col overflow-hidden rounded-lg border-4 bg-[url('/assets/bg/looping/bg-board.png')] bg-repeat p-0 ${v.frameClasses}`}
          >
            {/* Modal Header */}
            <div className="flex flex-col items-center p-4 pb-2 text-center">
              <div className={`mb-1 inline-block rounded border px-2 py-0.5 font-mono text-[10px] uppercase ${v.badgeColor}`}>
                variant=&quot;{v.id}&quot;
              </div>
              <h3 className="pixel-font text-xs font-bold tracking-wide text-amber-200">{v.label}</h3>
              <p className="mt-1 text-[11px] text-slate-300/80">{v.subtitle}</p>
            </div>

            {/* Indigolay Divider */}
            <IndigolayDivider variant={v.dividerVariant} className="my-1" />

            {/* Modal Body with Clean Transparent List */}
            <div className="flex-1 p-4">
              <IndigoLayStyledLists variant={v.id} bordered={bordered} compact={compact} size={size}>
                {SAMPLE_ITEMS.map((item, idx) => (
                  <IndigolayStyledListItem key={idx}>{item}</IndigolayStyledListItem>
                ))}
              </IndigoLayStyledLists>
            </div>

            {/* Modal Footer Actions */}
            <div className="flex items-center justify-center gap-3 border-t border-amber-950/40 bg-black/40 p-3">
              <ToffecButton variant="tan" size="xs" onClick={() => setActiveModalVariant(v.id)}>
                Ver en Modal Fullscreen
              </ToffecButton>
            </div>
          </div>
        ))}
      </div>

      {/* Pop-up Overlay Modal Simulation */}
      {activeModalVariant && activeConfig && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setActiveModalVariant(null)}
        >
          <div
            className={`confirm-panel w-full max-w-lg overflow-hidden rounded-lg border-4 bg-[url('/assets/bg/looping/bg-board.png')] bg-repeat p-0 shadow-2xl ${activeConfig.frameClasses}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col items-center p-5 pb-3 text-center">
              <span className={`mb-1.5 inline-block rounded border px-2.5 py-0.5 font-mono text-xs uppercase ${activeConfig.badgeColor}`}>
                Modal Live Demo
              </span>
              <h2 className="pixel-font text-sm font-bold tracking-wide text-amber-200">{activeConfig.label}</h2>
            </div>

            <IndigolayDivider variant={activeConfig.dividerVariant} />

            <div className="p-6">
              <IndigoLayStyledLists variant={activeModalVariant} bordered={bordered} compact={compact} size={size}>
                <IndigolayStyledListItem>Efecto de habilidad equipado en ranura primaria</IndigolayStyledListItem>
                <IndigolayStyledListItem>Aumenta la probabilidad de combo crítico en un +20%</IndigolayStyledListItem>
                <IndigolayStyledListItem>Carga el medidor de Guard de la party en cada turno</IndigolayStyledListItem>
              </IndigoLayStyledLists>
            </div>

            <div className="flex items-center justify-center p-4 pt-0">
              <ToffecButton variant="cream" size="xs" onClick={() => setActiveModalVariant(null)}>
                Cerrar Modal
              </ToffecButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
