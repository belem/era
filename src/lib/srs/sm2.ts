export interface SM2State {
  repetitions: number;
  easeFactor: number;
  interval: number; // days
}

const qualityMap = { forgot: 0, hard: 2, good: 3, easy: 5 } as const;
export type Rating = keyof typeof qualityMap;

export function sm2(state: SM2State, rating: Rating): SM2State {
  const q = qualityMap[rating];

  // Calculate interval first using the OLD ease factor (for reps >= 3)
  let interval: number;
  const reps = state.repetitions + 1;

  if (q < 3) {
    // Failed — reset repetitions, short interval
    interval = 1;
  } else if (reps === 1) {
    interval = 1;
  } else if (reps === 2) {
    interval = 6;
  } else {
    // Use the OLD ease factor to calculate new interval
    interval = Math.round(state.interval * state.easeFactor);
  }

  // Then update the ease factor for next time
  const ef = Math.max(1.3, state.easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)));

  // Failed reviews reset repetitions
  if (q < 3) {
    return { repetitions: 0, easeFactor: ef, interval };
  }

  return { repetitions: reps, easeFactor: ef, interval };
}

export function nextReviewDate(lastReview: Date, intervalDays: number): Date {
  const next = new Date(lastReview);
  next.setDate(next.getDate() + intervalDays);
  return next;
}
