import { describe, it, expect } from "vitest";
import { leitner } from "./leitner";

describe("Leitner algorithm", () => {
  const fresh = leitner.defaultState();

  it("starts at box 0", () => {
    expect(fresh.leitner_box).toBe(0);
  });

  it("advances one box on 'good'", () => {
    const { updatedState } = leitner.schedule(fresh, "good", new Date());
    expect(updatedState.leitner_box).toBe(1);
  });

  it("advances two boxes on 'easy'", () => {
    const { updatedState } = leitner.schedule(fresh, "easy", new Date());
    expect(updatedState.leitner_box).toBe(2);
  });

  it("resets to box 0 on 'forgot'", () => {
    const box3 = { ...fresh, leitner_box: 3 };
    const { updatedState } = leitner.schedule(box3, "forgot", new Date());
    expect(updatedState.leitner_box).toBe(0);
  });

  it("drops one box on 'hard'", () => {
    const box3 = { ...fresh, leitner_box: 3 };
    const { updatedState } = leitner.schedule(box3, "hard", new Date());
    expect(updatedState.leitner_box).toBe(2);
  });

  it("never drops below box 0 on 'hard'", () => {
    const { updatedState } = leitner.schedule(fresh, "hard", new Date());
    expect(updatedState.leitner_box).toBe(0);
  });

  it("caps at box 4", () => {
    const box4 = { ...fresh, leitner_box: 4 };
    const { updatedState } = leitner.schedule(box4, "good", new Date());
    expect(updatedState.leitner_box).toBe(4);
  });

  it("sets correct intervals per box", () => {
    const now = new Date("2026-01-01T12:00:00Z");
    const expected = [1, 2, 5, 14, 30];

    for (let box = 0; box <= 4; box++) {
      const state = { ...fresh, leitner_box: box };
      const { nextReviewAt } = leitner.schedule(state, "good", now);
      const nextBox = Math.min(4, box + 1);
      const diffMs = nextReviewAt.getTime() - now.getTime();
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
      expect(diffDays).toBe(expected[nextBox]);
    }
  });

  it("rebuilds state from history", () => {
    const events = [
      { rating: "good" as const, reviewedAt: new Date("2026-01-01") },
      { rating: "good" as const, reviewedAt: new Date("2026-01-03") },
      { rating: "forgot" as const, reviewedAt: new Date("2026-01-08") },
      { rating: "good" as const, reviewedAt: new Date("2026-01-09") },
    ];
    const result = leitner.migrateFromHistory(events);
    // good->box1, good->box2, forgot->box0, good->box1
    expect(result.leitner_box).toBe(1);
    expect(result.repetitions).toBe(4);
  });
});
