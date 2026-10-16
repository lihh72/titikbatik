import assert from "node:assert/strict";
import { test } from "node:test";
import { headerFadeProgress } from "../src/lib/header-fade";

test("expanded header fade respects automatic iOS insets and manual list padding", () => {
  assert.equal(headerFadeProgress(-103, 103), 0);
  assert.equal(headerFadeProgress(0, 0), 0);
  assert.equal(headerFadeProgress(-71, 103), 0.5);
  assert.equal(headerFadeProgress(32, 0), 0.5);
  assert.equal(headerFadeProgress(-150, 103), 0);
  assert.equal(headerFadeProgress(120, 0), 1);
});
