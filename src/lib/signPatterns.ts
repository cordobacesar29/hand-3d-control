/**
 * Sign language patterns for LSA (Lengua de Señas Argentina)
 *
 * Finger configuration: [thumb, index, middle, ring, pinky]
 * true = finger extended, false = finger closed
 */

export interface SignPattern {
  /** Letter being signed */
  letter: string;
  /** Which fingers should be extended: [thumb, index, middle, ring, pinky] */
  fingers: [boolean, boolean, boolean, boolean, boolean];
  /** Human-readable description */
  description: string;
}

/**
 * LSA alphabet patterns (simple detectable subset)
 *
 * Only includes letters that can be reliably detected from finger extension.
 * Letters requiring orientation, movement, or touching face are excluded.
 */
export const LSA_PATTERNS: SignPattern[] = [
  {
    letter: 'A',
    fingers: [true, false, false, false, false],
    description: 'Fist with thumb out to the side',
  },
  {
    letter: 'B',
    fingers: [false, true, true, true, true],
    description: 'All four fingers extended, thumb tucked',
  },
  {
    letter: 'C',
    fingers: [true, true, true, true, true],
    description: 'Hand open in C shape (all fingers out)',
  },
  {
    letter: 'E',
    fingers: [false, false, false, false, false],
    description: 'Closed fist, thumb tucked',
  },
  {
    letter: 'I',
    fingers: [false, false, false, false, true],
    description: 'Only pinky extended',
  },
  {
    letter: 'L',
    fingers: [true, true, false, false, false],
    description: 'L shape: thumb and index extended',
  },
  {
    letter: 'U',
    fingers: [false, true, true, false, false],
    description: 'Index and middle together, pointing up',
  },
  {
    letter: 'V',
    fingers: [false, true, true, false, false],
    description: 'Victory sign: index and middle spread',
  },
  {
    letter: 'W',
    fingers: [false, true, true, true, false],
    description: 'Index, middle, and ring extended',
  },
  {
    letter: 'Y',
    fingers: [true, false, false, false, true],
    description: 'Hang loose: thumb and pinky extended',
  },
];

/**
 * Match result with confidence
 */
export interface MatchResult {
  isMatch: boolean;
  /** Number of fingers that match (0-5) */
  matchingFingers: number;
  /** Confidence score (0-1) */
  confidence: number;
}

/**
 * Check if current hand state matches a sign pattern
 *
 * @param extendedFingers - Current hand state [thumb, index, middle, ring, pinky]
 * @param pattern - Sign pattern to match against
 * @param tolerance - How many fingers can be "wrong" (default: 0 = exact match)
 * @returns Match result with confidence
 */
export function matchSign(
  extendedFingers: boolean[],
  pattern: SignPattern,
  tolerance = 0
): MatchResult {
  if (extendedFingers.length !== 5) {
    return { isMatch: false, matchingFingers: 0, confidence: 0 };
  }

  let matchingFingers = 0;

  for (let i = 0; i < 5; i++) {
    if (extendedFingers[i] === pattern.fingers[i]) {
      matchingFingers++;
    }
  }

  const wrongFingers = 5 - matchingFingers;
  const isMatch = wrongFingers <= tolerance;
  const confidence = matchingFingers / 5;

  return { isMatch, matchingFingers, confidence };
}

/**
 * Find best matching pattern from a list
 *
 * @param extendedFingers - Current hand state
 * @param patterns - Patterns to search (defaults to all LSA patterns)
 * @param minConfidence - Minimum confidence to return a match (default: 0.8 = 4/5 fingers)
 * @returns Best matching pattern or null if no match meets threshold
 */
export function findBestMatch(
  extendedFingers: boolean[],
  patterns: SignPattern[] = LSA_PATTERNS,
  minConfidence = 0.8
): { pattern: SignPattern; result: MatchResult } | null {
  let best: { pattern: SignPattern; result: MatchResult } | null = null;

  for (const pattern of patterns) {
    const result = matchSign(extendedFingers, pattern);

    if (result.confidence >= minConfidence) {
      if (!best || result.confidence > best.result.confidence) {
        best = { pattern, result };
      }
    }
  }

  return best;
}

/**
 * Get a random pattern for the learning game
 *
 * @param patterns - Patterns to choose from (defaults to all LSA patterns)
 * @param exclude - Optional letter to exclude (e.g., current letter)
 */
export function getRandomPattern(
  patterns: SignPattern[] = LSA_PATTERNS,
  exclude?: string
): SignPattern {
  const available = exclude
    ? patterns.filter((p) => p.letter !== exclude)
    : patterns;

  const index = Math.floor(Math.random() * available.length);
  return available[index] ?? patterns[0];
}
