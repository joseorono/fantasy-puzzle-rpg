import { useState } from 'react';
import { useParty, usePartyActions } from '~/stores/game-store';
import { INITIAL_PARTY } from '~/constants/party';

export default function PartyTestView() {
  const party = useParty();
  const { setParty, fullyHealParty: healPartyAction, damageAllPartyMembers: damageAction } = usePartyActions();
  const [expandedMember, setExpandedMember] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-6">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-2 text-4xl font-bold text-white">Party System Test View</h1>
        <p className="mb-8 text-slate-300">Test the Party store slice and party-system.ts methods</p>

        {/* Current Party State */}
        <div className="rounded-lg border border-slate-700 bg-slate-800 p-6">
          <h2 className="mb-6 text-2xl font-bold text-white">Current Party State</h2>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {party.map((member) => (
              <div
                key={member.id}
                className="cursor-pointer rounded-lg bg-slate-700 p-4 transition-colors hover:bg-slate-600"
                onClick={() => setExpandedMember(expandedMember === member.id ? null : member.id)}
              >
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-white">{member.name}</h3>
                    <p className="text-sm text-slate-400 capitalize">{member.class}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-300">Level {member.level}</p>
                  </div>
                </div>

                {/* HP Bar */}
                <div className="mb-3">
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="text-slate-300">HP</span>
                    <span className="text-slate-300">
                      {member.currentHp} / {member.maxHp}
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-900">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        member.currentHp === member.maxHp
                          ? 'bg-green-500'
                          : member.currentHp > member.maxHp / 2
                            ? 'bg-yellow-500'
                            : 'bg-red-500'
                      }`}
                      style={{
                        width: `${(member.currentHp / member.maxHp) * 100}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Stats Summary */}
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div className="rounded bg-slate-600 p-2">
                    <p className="text-slate-400">POW</p>
                    <p className="font-semibold text-white">{member.stats.pow}</p>
                  </div>
                  <div className="rounded bg-slate-600 p-2">
                    <p className="text-slate-400">VIT</p>
                    <p className="font-semibold text-white">{member.stats.vit}</p>
                  </div>
                  <div className="rounded bg-slate-600 p-2">
                    <p className="text-slate-400">SPD</p>
                    <p className="font-semibold text-white">{member.stats.spd}</p>
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedMember === member.id && (
                  <div className="mt-4 space-y-2 border-t border-slate-600 pt-4 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Base HP:</span>
                      <span className="text-white">{member.baseHp}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">VIT HP Multiplier:</span>
                      <span className="text-white">{member.vitHpMultiplier}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Skill Cooldown:</span>
                      <span className="text-white">
                        {member.skillCooldown} / {member.maxCooldown}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">EXP to Next Level:</span>
                      <span className="text-white">{member.expToNextLevel}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Color:</span>
                      <span className="text-white capitalize">{member.color}</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 rounded-lg border border-slate-700 bg-slate-800 p-6">
          <h2 className="mb-4 text-2xl font-bold text-white">Quick Actions</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <button
              onClick={() => {
                healPartyAction();
              }}
              className="rounded-lg bg-green-600 px-4 py-2 font-semibold text-white transition-colors hover:bg-green-700"
            >
              Heal All
            </button>
            <button
              onClick={() => {
                damageAction(10, false);
              }}
              className="rounded-lg bg-orange-600 px-4 py-2 font-semibold text-white transition-colors hover:bg-orange-700"
            >
              Damage All (10)
            </button>
            <button
              onClick={() => {
                setParty(INITIAL_PARTY);
              }}
              className="rounded-lg bg-slate-600 px-4 py-2 font-semibold text-white transition-colors hover:bg-slate-500"
            >
              Reset Party
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
