import type { SRSAlgorithm, Rating } from "./types";

// Leitner system: 5 boxes with fixed intervals (days)
const BOX_INTERVALS = [1, 2, 5, 14, 30] as const;
const MAX_BOX = BOX_INTERVALS.length - 1;

function nextBox(box: number, rating: Rating): number {
  if (rating === "forgot") return 0;
  if (rating === "hard") return Math.max(0, box - 1);
  // good or easy: advance
  return Math.min(MAX_BOX, box + (rating === "easy" ? 2 : 1));
}

export const leitner: SRSAlgorithm = {
  schedule(state, rating, lastReview) {
    const box = (state.leitner_box as number) ?? 0;
    const newBox = nextBox(box, rating);
    const intervalDays = BOX_INTERVALS[newBox];
    const nextReviewAt = new Date(lastReview);
    nextReviewAt.setDate(nextReviewAt.getDate() + intervalDays);

    return {
      nextReviewAt,
      updatedState: {
        leitner_box: newBox,
        repetitions: ((state.repetitions as number) ?? 0) + 1,
        ease_factor: state.ease_factor ?? 2.5,
        interval_days: intervalDays,
        fsrs_stability: null,
        fsrs_difficulty: null,
        fsrs_reps: 0,
      },
    };
  },

  defaultState() {
    return {
      leitner_box: 0,
      repetitions: 0,
      ease_factor: 2.5,
      interval_days: 0,
      fsrs_stability: null,
      fsrs_difficulty: null,
      fsrs_reps: 0,
    };
  },

  migrateFromHistory(events) {
    let box = 0;
    let lastDate = new Date();
    for (const e of events) {
      box = nextBox(box, e.rating);
      lastDate = e.reviewedAt;
    }
    const intervalDays = BOX_INTERVALS[box];
    const nextReviewAt = new Date(lastDate);
    nextReviewAt.setDate(nextReviewAt.getDate() + intervalDays);

    return {
      leitner_box: box,
      repetitions: events.length,
      ease_factor: 2.5,
      interval_days: intervalDays,
      fsrs_stability: null,
      fsrs_difficulty: null,
      fsrs_reps: 0,
      nextReviewAt,
    };
  },
};
