# Hand 3D Control — Exploration Findings

## Findings: Multi-hand configuration — 2026-10-30

### Files read
- `src/cv/handTracker.ts:4` — `maxNumHands: 1` in DEFAULT_CONFIG
- `src/cv/handTracker.ts:108-131` — `handleResults` processes ALL hands in `multiHandLandmarks` array
- `src/hooks/useHandTracking.ts:50-60` — passes full `hands` array to state, calculates average confidence
- `src/hooks/useHandControl.ts:56` — **ONLY uses `hands[0]`**, ignores additional hands
- `src/types/hand.ts:25-29` — `HandLandmarks` type supports single hand with handedness

### Patterns found
- **Array-ready pipeline**: `HandTracker.handleResults` already iterates over `multiHandLandmarks` (line 114-128)
- **Smoothing by handedness**: Landmarks smoothed separately per hand using `handedness.label` as key (line 144)
- **State passes array**: `useHandTracking` stores and exposes full `hands: HandLandmarks[]` array
- **Single-hand bottleneck**: `useHandControl` hardcodes `hands[0]` (line 56)

### Conventions
- `HandLandmarks[]` is the canonical multi-hand type throughout the pipeline
- Handedness ('Left' | 'Right') is preserved from MediaPipe

### Gaps / risks
1. **Config limitation**: `maxNumHands: 1` means MediaPipe never returns more than one hand
2. **useHandControl ignores second hand**: Even if `maxNumHands` were 2, line 56 discards `hands[1]`
3. **No hand assignment**: No logic to determine which hand controls what (left vs right roles)

---

### Answers to specific questions

**Is maxNumHands = 1 or 2?**
- Currently **1** (hardcoded in `src/cv/handTracker.ts:4`)

**Does the hands array ever contain more than one hand?**
- With current config: **No**, MediaPipe limited to 1
- If changed to 2: **Yes**, `handleResults` already builds array correctly

**What changes are needed to support two hands?**

| File | Change |
|------|--------|
| `handTracker.ts:4` | Change `maxNumHands: 1` to `maxNumHands: 2` |
| `useHandControl.ts` | Refactor to expose both hands or separate left/right control |
| New: hand assignment | Logic to determine hand roles (primary/secondary, or left/right) |
| Components | Decide how two hands interact (e.g., two-handed gestures like zoom, bimanual manipulation) |

**Minimal change for two-hand detection:**
Just change `maxNumHands: 2` — the rest of the pipeline will work, but `useHandControl` will still only use the first detected hand.

**Full two-hand support requires:**
1. Config change (`maxNumHands: 2`)
2. Refactor `useHandControl` to expose left/right hand separately OR return array of hand states
3. Update gesture detection to support two-handed gestures (e.g., two-finger scale)
4. Update scene components to accept multiple hand inputs
