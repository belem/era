import { sm2, nextReviewDate } from "./sm2";
import type { SRSAlgorithm, Rating } from "./types";

export const sm2Algorithm: SRSAlgorithm = {
  schedule(state, rating, lastReview) {
    const current = {
      repetitions: (state.repetitions as number) ?? 0,
      easeFactor: (state.ease_factor as number) ?? 2.5,
      interval: (state.interval_days as number) ?? 0,
    };

    const result = sm2(current, rating);
    const nextReview = nextReviewDate(new Date(), result.interval);

    return {
      nextReviewAt: nextReview,
      updatedState: {
        repetitions: result.repetitions,
        ease_factor: result.easeFactor,
        interval_days: result.interval,
        leitner_box: 0,
        fsrs_stability: null,
        fsrs_difficulty: null,
        fsrs_reps: 0,
      },
    };
  },

  defaultState() {
    return {
      repetitions: 0,
      ease_factor: 2.5,
      interval_days: 0,
      leitner_box: 0,
      fsrs_stability: null,
      fsrs_difficulty: null,
      fsrs_reps: 0,
    };
  },

  migrateFromHistory(events) {
    let state = { repetitions: 0, easeFactor: 2.5, interval: 0 };
    let lastDate = new Date();

    for (const e of events) {
      state = sm2(state, e.rating);
      lastDate = e.reviewedAt;
    }

    const nextReview = nextReviewDate(lastDate, state.interval);

    return {
      repetitions: state.repetitions,
      ease_factor: state.easeFactor,
      interval_days: state.interval,
      leitner_box: 0,
      fsrs_stability: null,
      fsrs_difficulty: null,
      fsrs_reps: 0,
      nextReviewAt: nextReview,
    };
  },
};
