# Fixes & View Polish TODO

- [x] Abstract Orb Component (coauthor: Mauricio) — Extracted to `src/components/battle/orb.tsx`
- [x] Fix bug where you can select 2 orbs at once by attempting to match 2 orbs that don't trigger a match — Handled via `invalidSwap` state, selection retention, and click locking during processing in `src/components/battle/match3-board.tsx`.
- [ ] Board generation deadlock detection: ensure initial boards and cascade settlements always contain at least one valid move, auto-shuffling if no matches are possible.
