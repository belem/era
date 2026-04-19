import { describe, it, expect } from "vitest";
import { sm2, type SM2State } from "./sm2";

describe("SM-2 algorithm", () => {
  const fresh: SM2State = { repetitions: 0, easeFactor: 2.5, interval: 0 };

  it("resets on 'forgot' rating", () => {
    const state = sm2(fresh, "forgot");
    expect(state.repetitions).toBe(0);
    expect(state.interval).toBe(1);
    expect(state.easeFactor).toBeLessThan(2.5);
  });

  it("sets interval to 1 on first 'good'", () => {
    const state = sm2(fresh, "good");
    expect(state.repetitions).toBe(1);
    expect(state.interval).toBe(1);
  });

  it("sets interval to 6 on second 'good'", () => {
    const s1 = sm2(fresh, "good");
    const s2 = sm2(s1, "good");
    expect(s2.repetitions).toBe(2);
    expect(s2.interval).toBe(6);
  });

  it("multiplies interval by ease factor on third+ review", () => {
    const s1 = sm2(fresh, "good");
    const s2 = sm2(s1, "good");
    const s3 = sm2(s2, "good");
    expect(s3.interval).toBe(Math.round(6 * s2.easeFactor));
  });

  it("increases ease factor on 'easy'", () => {
    const state = sm2(fresh, "easy");
    expect(state.easeFactor).toBeGreaterThan(2.5);
  });

  it("decreases ease factor on 'hard'", () => {
    const state = sm2(fresh, "hard");
    expect(state.easeFactor).toBeLessThan(2.5);
  });

  it("never drops ease factor below 1.3", () => {
    let state = fresh;
    for (let i = 0; i < 20; i++) {
      state = sm2(state, "forgot");
    }
    expect(state.easeFactor).toBeGreaterThanOrEqual(1.3);
  });
});
