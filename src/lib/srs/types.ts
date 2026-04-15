export type Rating = "forgot" | "hard" | "good" | "easy";
export type AlgorithmName = "SM2" | "LEITNER" | "FSRS";

export interface ScheduleResult {
  nextReviewAt: Date;
  updatedState: Record<string, number | null>;
}

export interface SRSAlgorithm {
  schedule(
    state: Record<string, number | null>,
    rating: Rating,
    lastReview: Date
  ): ScheduleResult;

  defaultState(): Record<string, number | null>;

  migrateFromHistory(
    events: { rating: Rating; reviewedAt: Date }[]
  ): Record<string, number | null | Date> & { nextReviewAt: Date };
}
