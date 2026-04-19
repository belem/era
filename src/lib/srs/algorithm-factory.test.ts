import { describe, it, expect } from "vitest";
import { getAlgorithm } from "./algorithm-factory";

describe("Algorithm factory", () => {
  it("returns SM2 algorithm", () => {
    const algo = getAlgorithm("SM2");
    expect(algo).toBeDefined();
    const state = algo.defaultState();
    expect(state.repetitions).toBe(0);
    expect(state.ease_factor).toBe(2.5);
  });

  it("returns LEITNER algorithm", () => {
    const algo = getAlgorithm("LEITNER");
    expect(algo).toBeDefined();
    const state = algo.defaultState();
    expect(state.leitner_box).toBe(0);
  });

  it("returns FSRS algorithm", () => {
    const algo = getAlgorithm("FSRS");
    expect(algo).toBeDefined();
    const state = algo.defaultState();
    expect(state.fsrs_stability).toBeNull();
    expect(state.fsrs_reps).toBe(0);
  });

  it("SM2 schedules a review", () => {
    const algo = getAlgorithm("SM2");
    const result = algo.schedule(algo.defaultState(), "good", new Date());
    expect(result.nextReviewAt).toBeInstanceOf(Date);
    expect(result.updatedState.repetitions).toBe(1);
    expect(result.updatedState.interval_days).toBe(1);
  });

  it("LEITNER schedules a review", () => {
    const algo = getAlgorithm("LEITNER");
    const result = algo.schedule(algo.defaultState(), "good", new Date());
    expect(result.nextReviewAt).toBeInstanceOf(Date);
    expect(result.updatedState.leitner_box).toBe(1);
  });

  it("FSRS schedules a review", () => {
    const algo = getAlgorithm("FSRS");
    const result = algo.schedule(algo.defaultState(), "good", new Date());
    expect(result.nextReviewAt).toBeInstanceOf(Date);
    expect(result.updatedState.fsrs_stability).not.toBeNull();
  });
});
