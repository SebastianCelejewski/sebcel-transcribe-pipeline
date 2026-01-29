import { describe, it, expect } from "vitest";
import { createWorkPlan, hasWork } from "../src/workPlan.mjs";

describe("hasWork", () => {
  it("returns false when plan is empty", () => {
    expect(
      hasWork({ txt: [], srt: [] })
    ).toBe(false);
  });

  it("returns true when txt work exists", () => {
    expect(
      hasWork({ txt: ["en"], srt: [] })
    ).toBe(true);
  });

  it("returns true when srt work exists", () => {
    expect(
      hasWork({ txt: [], srt: ["pl"] })
    ).toBe(true);
  });
});