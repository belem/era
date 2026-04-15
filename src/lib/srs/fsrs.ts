import {
  fsrs,
  createEmptyCard,
  Rating as FSRSRating,
  type Card,
  type Grade,
} from "ts-fsrs";
import type { SRSAlgorithm, Rating } from "./types";

const f = fsrs();

const ratingMap: Record<Rating, Grade> = {
  forgot: FSRSRating.Again,
  hard: FSRSRating.Hard,
  good: FSRSRating.Good,
  easy: FSRSRating.Easy,
};

function toCard(state: Record<string, number | null>, lastReview: Date): Card {
  const base = createEmptyCard(lastReview);
  return {
    ...base,
    stability: (state.fsrs_stability as number) ?? base.stability,
    difficulty: (state.fsrs_difficulty as number) ?? base.difficulty,
    reps: (state.fsrs_reps as number) ?? 0,
    last_review: lastReview,
  };
}

export const fsrsAlgorithm: SRSAlgorithm = {
  schedule(state, rating, lastReview) {
    const card = toCard(state, lastReview);
    const now = new Date();
    const result = f.next(card, now, ratingMap[rating]);
    const scheduled = result.card;

    return {
      nextReviewAt: scheduled.due,
      updatedState: {
        fsrs_stability: scheduled.stability,
        fsrs_difficulty: scheduled.difficulty,
        fsrs_reps: scheduled.reps,
        repetitions: scheduled.reps,
        ease_factor: state.ease_factor ?? 2.5,
        interval_days: scheduled.scheduled_days,
        leitner_box: 0,
      },
    };
  },

  defaultState() {
    return {
      fsrs_stability: null,
      fsrs_difficulty: null,
      fsrs_reps: 0,
      repetitions: 0,
      ease_factor: 2.5,
      interval_days: 0,
      leitner_box: 0,
    };
  },

  migrateFromHistory(events) {
    let card = createEmptyCard();

    for (const e of events) {
      const result = f.next(card, e.reviewedAt, ratingMap[e.rating]);
      card = result.card;
    }

    return {
      fsrs_stability: card.stability,
      fsrs_difficulty: card.difficulty,
      fsrs_reps: card.reps,
      repetitions: card.reps,
      ease_factor: 2.5,
      interval_days: card.scheduled_days,
      leitner_box: 0,
      nextReviewAt: card.due,
    };
  },
};
