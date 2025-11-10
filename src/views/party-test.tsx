import { useState } from 'react';
import { useParty, usePartyActions } from '~/stores/game-store';
import { fullyHealParty, isPartyFullyHealed, damageAllPartyMembers } from '~/lib/party-system';
import { INITIAL_PARTY } from '~/constants/game';

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
}

export default function PartyTestView() {
  const party = useParty();
  const { setParty, fullyHealParty: healPartyAction, damageAllPartyMembers: damageAction } = usePartyActions();
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [expandedMember, setExpandedMember] = useState<string | null>(null);

  // Pure function tests
  const runPureFunctionTests = () => {
    const results: TestResult[] = [];

    // Test 1: fullyHealParty restores all members to max HP
    const damagedParty = INITIAL_PARTY.map((member) => ({
      ...member,
      currentHp: Math.max(1, member.maxHp - 10),
    }));
    const healedParty = fullyHealParty(damagedParty);
    const allHealed = healedParty.every((member) => member.currentHp === member.maxHp);
    results.push({
      name: 'fullyHealParty - Restores all members to max HP',
      passed: allHealed,
      message: allHealed
        ? 'All party members restored to max HP'
        : `Expected all members at max HP, got: ${healedParty.map((m) => `${m.name}: ${m.currentHp}/${m.maxHp}`).join(', ')}`,
    });

    // Test 2: fullyHealParty doesn't mutate original array
    const originalHp = damagedParty[0].currentHp;
    fullyHealParty(damagedParty);
    const notMutated = damagedParty[0].currentHp === originalHp;
    results.push({
      name: 'fullyHealParty - Does not mutate original array',
      passed: notMutated,
      message: notMutated
        ? 'Original array unchanged'
        : `Original array was mutated: ${damagedParty[0].currentHp} !== ${originalHp}`,
    });

    // Test 3: isPartyFullyHealed returns true when all at max HP
    const fullyHealedParty = fullyHealParty(INITIAL_PARTY);
    const isHealed = isPartyFullyHealed(fullyHealedParty);
    results.push({
      name: 'isPartyFullyHealed - Returns true when all at max HP',
      passed: isHealed === true,
      message: isHealed ? 'Correctly identified fully healed party' : 'Failed to identify fully healed party',
    });

    // Test 4: isPartyFullyHealed returns false when any member is damaged
    const partiallyDamaged = fullyHealedParty.map((member, idx) =>
      idx === 0 ? { ...member, currentHp: member.maxHp - 1 } : member,
    );
    const isNotHealed = isPartyFullyHealed(partiallyDamaged);
    results.push({
      name: 'isPartyFullyHealed - Returns false when any member is damaged',
      passed: isNotHealed === false,
      message: !isNotHealed ? 'Correctly identified damaged party' : 'Failed to identify damaged party',
    });

    // Test 5: damageAllPartyMembers reduces HP by damage amount
    const testDamage = 5;
    const damagedByAmount = damageAllPartyMembers(fullyHealedParty, testDamage);
    const correctDamage = damagedByAmount.every(
      (member, idx) => member.currentHp === fullyHealedParty[idx].maxHp - testDamage,
    );
    results.push({
      name: `damageAllPartyMembers - Reduces all HP by ${testDamage}`,
      passed: correctDamage,
      message: correctDamage
        ? `All members took ${testDamage} damage`
        : `Damage not applied correctly: ${damagedByAmount.map((m) => `${m.name}: ${m.currentHp}`).join(', ')}`,
    });

    // Test 6: damageAllPartyMembers respects canDie = false (min HP = 1)
    const heavyDamage = 1000;
    const damagedNoDeath = damageAllPartyMembers(fullyHealedParty, heavyDamage, false);
    const allAlive = damagedNoDeath.every((member) => member.currentHp >= 1);
    results.push({
      name: 'damageAllPartyMembers - Respects canDie=false (min HP=1)',
      passed: allAlive,
      message: allAlive
        ? 'All members survived with at least 1 HP'
        : `Some members died: ${damagedNoDeath.map((m) => `${m.name}: ${m.currentHp}`).join(', ')}`,
    });

    // Test 7: damageAllPartyMembers allows death when canDie = true
    const damagedWithDeath = damageAllPartyMembers(fullyHealedParty, heavyDamage, true);
    const canReachZero = damagedWithDeath.every((member) => member.currentHp === 0);
    results.push({
      name: 'damageAllPartyMembers - Allows death when canDie=true',
      passed: canReachZero,
      message: canReachZero
        ? 'All members can reach 0 HP'
        : `Members did not reach 0 HP: ${damagedWithDeath.map((m) => `${m.name}: ${m.currentHp}`).join(', ')}`,
    });

    // Test 8: damageAllPartyMembers doesn't mutate original
    const originalFirstMemberHp = fullyHealedParty[0].currentHp;
    damageAllPartyMembers(fullyHealedParty, 10);
    const damageNotMutated = fullyHealedParty[0].currentHp === originalFirstMemberHp;
    results.push({
      name: 'damageAllPartyMembers - Does not mutate original array',
      passed: damageNotMutated,
      message: damageNotMutated
        ? 'Original array unchanged'
        : `Original array was mutated: ${fullyHealedParty[0].currentHp} !== ${originalFirstMemberHp}`,
    });

    setTestResults(results);
  };

  const passedCount = testResults.filter((r) => r.passed).length;
  const totalCount = testResults.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-6">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-2 text-4xl font-bold text-white">Party System Test View</h1>
        <p className="mb-8 text-slate-300">Test the Party store slice and party-system.ts methods</p>

        {/* Test Controls */}
        <div className="mb-8">
          <button
            onClick={runPureFunctionTests}
            className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-700"
          >
            Run Pure Function Tests
          </button>
        </div>

        {/* Test Results */}
        {testResults.length > 0 && (
          <div className="mb-8 rounded-lg border border-slate-700 bg-slate-800 p-6">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Test Results</h2>
              <div className="text-lg font-semibold">
                <span className={passedCount === totalCount ? 'text-green-400' : 'text-yellow-400'}>
                  {passedCount}/{totalCount} Passed
                </span>
              </div>
            </div>

            <div className="space-y-3">
              {testResults.map((result, idx) => (
                <div
                  key={idx}
                  className={`rounded-lg border-l-4 p-4 ${
                    result.passed ? 'border-green-500 bg-green-900/20' : 'border-red-500 bg-red-900/20'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className={result.passed ? 'text-green-400' : 'text-red-400'}>
                          {result.passed ? '✓' : '✗'}
                        </span>
                        <h3 className="font-semibold text-white">{result.name}</h3>
                      </div>
                      <p className="mt-1 text-sm text-slate-300">{result.message}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

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
