# Skill Registry — Hand 3D Control

Last updated: 2026-11-04

## Contract

**Delegator use only.** This registry is an index, not a summary. Pass exact `SKILL.md` paths to subagents. The agent reads them before work.

## Skills

| Skill | Trigger / description | Scope | Path |
| --- | --- | --- | --- |
| `hand-tracking-setup` | MediaPipe Hands initialization, landmark normalization, camera input | cv | `.claude/skills/hand-tracking-setup/SKILL.md` |
| `hand-to-world-mapping` | Hand-to-3D coordinate transform, viewport mapping, boundary enforcement | cv-3d | `.claude/skills/hand-to-world-mapping/SKILL.md` |
| `gesture-patterns` | Gesture state machine, pattern detection, tolerance thresholds | gestures | `.claude/skills/gesture-patterns/SKILL.md` |
| `react-three-fiber` | R3F scene setup, hooks, component patterns, performance | 3d | `.claude/skills/react-three-fiber/SKILL.md` |
| `accessibility-design` | Keyboard alternatives, ARIA labels, gesture tolerance, inclusive UX | a11y | `.claude/skills/accessibility-design/SKILL.md` |
| `oxlint-config` | Oxlint setup, React rules, TypeScript type-aware linting | tooling | `.claude/skills/oxlint-config/SKILL.md` |
| `tailwind-4` | Tailwind CSS 4 with Vite, utility patterns, responsive design | styling | `.claude/skills/tailwind-4/SKILL.md` |

## Loading protocol

1. Match task context against the `Trigger / description` column.
2. Pass only the matching `Path` values to the subagent under `## Skills to load before work`.
3. Instruct the subagent to read those exact `SKILL.md` files before starting.
4. If no matching skill exists, proceed without skill injection.

## Adding skills

Create skill files at `.claude/skills/{skill-name}/SKILL.md` and register them here.
