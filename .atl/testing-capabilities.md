# Testing Capabilities — Hand 3D Control

**Project:** hand-3d-control
**Platform:** Node.js / Browser
**Last detected:** 2026-11-04

## Testing Framework Status

| Layer | Tool | Installed | Command | Strict TDD |
|-------|------|-----------|---------|-----------|
| Linting | Oxlint | ✅ Yes | `npm run lint` | N/A |
| Type Checking | TypeScript | ✅ Yes | `npm run build` (implicit) | N/A |
| Unit/Integration | None | ❌ No | — | **false** |
| E2E | None | ❌ No | — | **false** |
| Build | Vite + TypeScript | ✅ Yes | `npm run build` | N/A |

## Detected Stack

```json
{
  "framework": "React 19",
  "language": "TypeScript 7.0",
  "build": "Vite 8.3",
  "3d": "Three.js + React Three Fiber",
  "cv": "MediaPipe Hands",
  "styling": "Tailwind CSS 4",
  "linter": "Oxlint 1.89",
  "repository": "Not a git repo"
}
```

## Quality Gates (Pre-merge requirements)

```bash
npm run lint      # Oxlint static analysis
npm run build     # TypeScript + Vite build (includes type checking)
```

All must pass before merge. No test suite available.

## Strict TDD Mode

**Status:** `false` (disabled)

**Reason:** No test runner installed (no Jest, Vitest, Mocha, etc.). Testing framework must be installed before enabling TDD mode.

### To Enable TDD

1. Install test runner (e.g., Vitest + @testing-library/react):
   ```bash
   npm install --save-dev vitest @testing-library/react jsdom
   ```
2. Add npm script: `"test": "vitest"`
3. Update `strict_tdd: true` in SDD initialization
4. Test files must follow `src/**/*.test.ts(x)` or `src/**/*.spec.ts(x)` pattern

## Current Quality Practices

- **Linting:** Oxlint enforces React rules of hooks, component export patterns
- **Type Safety:** Strict TypeScript (noUnusedLocals, noUnusedParameters, noImplicitAny)
- **Build Verification:** TypeScript compilation + Vite bundle analysis
- **No runtime tests:** Functional validation via manual dev/preview server

## Gaps / Recommendations

1. **Unit Testing:** Add Vitest for component and utility testing
2. **Integration Testing:** Add @testing-library/react for user interaction flows
3. **E2E Testing:** Consider Playwright/Cypress for hand gesture simulation
4. **Coverage:** No coverage tracking available until test suite installed
5. **Gesture Testing:** MediaPipe mocking strategy needed for isolated unit tests

## References

- [Oxlint documentation](https://oxc.rs/docs/guide/usage/linter)
- [TypeScript strict mode guide](https://www.typescriptlang.org/tsconfig#strict)
- [Vitest + React testing setup](https://vitest.dev/)
