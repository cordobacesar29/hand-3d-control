# SDD Initialization Report — Hand 3D Control

**Date:** 2026-11-04
**Project:** hand-3d-control
**Artifact Store:** none (Engram and openspec not configured; inline reporting only)
**Strict TDD Mode:** false (no test framework installed)

---

## 1. Tech Stack Detection

### Languages & Frameworks

| Component | Technology | Version | Notes |
|-----------|-----------|---------|-------|
| **Frontend Framework** | React | 19.3 | Server-agnostic; using React Compiler off (perf overhead) |
| **Language** | TypeScript | 7.0 | Strict mode enabled; noUnusedLocals, noUnusedParameters |
| **Build Tool** | Vite | 8.3 | HMR enabled; fast rebuild on save |
| **3D Graphics** | Three.js | 0.187 | WebGL renderer; scene, camera, lights |
| **3D React Binding** | React Three Fiber | 9.8 | R3F hooks for Three.js objects |
| **Hand Tracking** | MediaPipe Hands | 0.4 | Real-time hand detection; 21 landmarks per hand |
| **Styling** | Tailwind CSS | 4.3 | With Vite plugin; no inline styles |
| **Static Analysis** | Oxlint | 1.89 | React, TypeScript, Oxc plugins enabled |

### Project Type

- **Client-side 3D application**
- **Real-time CV (hand tracking)**
- **Accessibility-first UI**
- No backend; all logic runs in browser
- No database; state managed in React/Zustand (inferred)

### Architecture Domains

```
src/
├── components/        # React UI layer (frontend domain)
│   ├── ui/           # Primitives: Button, Panel, Slider
│   ├── feedback/     # GestureIndicator, HandOverlay
│   ├── controls/     # SettingsPanel, CameraSelector
│   └── layout/       # AppLayout
├── hooks/            # Custom React hooks (cross-domain bridges)
├── cv/               # MediaPipe setup, hand tracking (cv domain)
├── gestures/         # Gesture state machine, detection (gestures domain)
├── 3d/               # Three.js + R3F scene, renderer (3d domain)
├── scene/            # 3D objects, materials (3d domain)
├── a11y/             # Accessibility utilities (a11y domain)
├── lib/              # Shared utilities (no domain affiliation)
└── types/            # TypeScript definitions
```

**Critical Boundary Rule:** Components can import from hooks, lib, types, and other components. Components CANNOT directly import cv or 3d internals—use hooks to bridge.

---

## 2. Testing Capabilities

### Available Quality Gates

| Gate | Tool | Command | Status |
|------|------|---------|--------|
| **Linting** | Oxlint | `npm run lint` | ✅ Active |
| **Type Checking** | TypeScript | `npm run build` (implicit) | ✅ Active |
| **Unit Tests** | None | — | ❌ Not installed |
| **Integration Tests** | None | — | ❌ Not installed |
| **E2E Tests** | None | — | ❌ Not installed |
| **Build Validation** | Vite + TypeScript | `npm run build` | ✅ Active |

### Oxlint Configuration

**File:** `.oxlintrc.json`
**Plugins:** react, typescript, oxc

```json
{
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

### TypeScript Configuration

**Strict Mode Enabled:**
- `noUnusedLocals: true`
- `noUnusedParameters: true`
- `noFallthroughCasesInSwitch: true`
- `erasableSyntaxOnly: true`

### Test Runner Decision: `strict_tdd: false`

**Reason:** No test framework (Jest, Vitest, Mocha) installed.

**Fallback:** SDD-apply will use Standard Mode. Tests can be run manually during dev/preview, but no CI/CD test execution available.

**Recommendation:** Install Vitest + @testing-library/react to enable TDD. See `.atl/testing-capabilities.md` for setup steps.

---

## 3. Project Conventions & Constraints

### From `.atl/memory/conventions.md`

**Purpose:** Accessibility-first 3D manipulation via hand gestures.
**Target Users:** People with motor disabilities needing non-traditional input.

### Critical Rules (Must Follow)

1. **Accessibility is P0** — Every feature requires a keyboard alternative.
2. **No inline styles** — Tailwind only; no `style={}` prop.
3. **TypeScript strict** — No `any`, no implicit types.
4. **Gestures need tolerance** — Configurable thresholds; precision not required.
5. **30+ FPS target** — Smooth, predictable response times.

### Known Issues & Findings

From `.atl/memory/findings.md`:

- **Hand-to-World Mapping Mismatch:** Hand can reach only ~44-53% of visible scene area. Camera frustum is much larger than mapped coordinate space.
- **Z-Depth Underutilized:** Current mapping uses ~60% of configured Z range.
- **No Config Runtime Override:** `useHandControl` applies hardcoded defaults.
- **Grid Boundary Mismatch:** 10×10 grid spans [-5, 5] but hand only reaches [-3, 3] in X.
- **No Visual Feedback:** Users see objects they cannot reach.

### Import Boundary Enforcement

```typescript
// ✅ OK: component importing from hooks/lib/types
import { useGestureState } from '../hooks';
import { clamp } from '../lib';
import type { Landmark } from '../types';

// ❌ NOT OK: component directly importing cv internals
import { detectHand } from '../cv/mediapipe'; // Violates boundary
import { CoordinateTransform } from '../3d/transforms'; // Violates boundary

// ✅ OK: use hooks to bridge domains
import { useHandControl } from '../hooks'; // Hook handles cv+3d mapping
```

---

## 4. Artifact Store Configuration

### Available Backends

| Backend | Status | Suitable For |
|---------|--------|--------------|
| **Engram** | Not configured | Cross-session memory, fast saves |
| **OpenSpec** | Not configured | File-based artifacts, git-tracked specs |
| **Hybrid** | Not configured | Both backends simultaneously |
| **None** | Active (default) | Inline reporting only |

### Artifact Store Mode: `none`

**Why:** Engram and openspec are not initialized in this session. Orchestrator did not specify a preference. Results will be returned inline.

**To Enable Persistence:**
1. **Engram:** Requires Engram MCP server availability
2. **OpenSpec:** Create `openspec/` directory and write YAML/Markdown files
3. **Hybrid:** Both simultaneously

Recommendation for future sessions: Engram for solo iteration, OpenSpec for team sharing.

---

## 5. Skill Registry

**Location:** `.atl/skill-registry.md` (created)

**Skills Registered:** 7

| Skill | Domain | Purpose |
|-------|--------|---------|
| `hand-tracking-setup` | cv | MediaPipe Hands initialization, landmark normalization |
| `hand-to-world-mapping` | cv-3d | Hand-to-3D coordinate transform, viewport mapping |
| `gesture-patterns` | gestures | Gesture state machine, pattern detection |
| `react-three-fiber` | 3d | R3F scene setup, hooks, performance patterns |
| `accessibility-design` | a11y | Keyboard alternatives, ARIA, gesture tolerance |
| `oxlint-config` | tooling | Oxlint setup, React/TypeScript rules |
| `tailwind-4` | styling | Tailwind CSS 4 with Vite integration |

These skills are **templates for future use**; no external SKILL.md files exist yet. Register them here when implementing project-specific standards.

---

## 6. Next Steps

### Immediate (sdd-explore / sdd-new)

1. **Hand-to-World Mapping Fix** (Priority: High)
   - Explore: Current mapping ranges vs. camera frustum
   - Propose: Extend mapping to use full visible area
   - Risk: May affect existing gesture thresholds

2. **Gesture Tolerance Configuration** (Priority: High)
   - Explore: Current tolerance values, accessibility impact
   - Propose: Runtime-configurable thresholds
   - Risk: UI complexity, user onboarding

3. **Test Suite Setup** (Priority: Medium)
   - Explore: Vitest + @testing-library/react integration
   - Propose: Add unit and integration tests
   - Enables: Strict TDD mode for future changes

4. **Boundary Visual Feedback** (Priority: Medium)
   - Explore: Reachable area visualization
   - Propose: Grid overlay or visual boundaries
   - Risk: Visual clutter; accessibility review needed

---

## 7. Return Envelope

**Status:** success

**Summary:** SDD initialized for hand-3d-control. Detected React 19 + TypeScript 7 + Vite stack with MediaPipe Hands CV integration. No test framework; strict TDD disabled. Skill registry created. Conventions documented. Ready for sdd-explore or sdd-new.

**Artifacts Created:**
- `.atl/skill-registry.md` — 7 project skills registered
- `.atl/testing-capabilities.md` — Testing framework status and gaps
- `.atl/sdd-init.md` — This initialization report

**Testing Capabilities:**
- Linting: ✅ `npm run lint` (Oxlint)
- Type Checking: ✅ `npm run build` (TypeScript)
- Unit Testing: ❌ Not available
- Strict TDD: false

**Recommended Next Phase:** `sdd-explore` or `sdd-new` (see section 6)

**Risks:**
- No test suite; functional validation relies on manual dev/preview
- Hand-to-world mapping has known coverage gap (44-53% of visible area)
- Accessibility-first design requires keyboard alternatives for all features
- 30+ FPS requirement means performance review needed for new CV features

**Skill Resolution:** none (no orchestrator-injected skills; registry is local reference)
