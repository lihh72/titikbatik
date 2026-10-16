import assert from "node:assert/strict";
import { test } from "node:test";
import { catalogRows } from "../src/lib/catalog-rows";

test("layout changes preserve every item and reserve the final empty spaces", () => {
  const items = ["a", "b", "c", "d", "e", "f", "g"];
  for (const columns of [2, 3] as const) {
    const rows = catalogRows(items, columns);
    assert.deepEqual(
      rows.flat().filter((value) => value !== null),
      items,
    );
    assert.ok(rows.every((row) => row.length === columns));
    assert.equal(rows.length, Math.ceil(items.length / columns));
  }
  assert.deepEqual(catalogRows([], 2), []);
  assert.deepEqual(catalogRows(["a"], 3), [["a", null, null]]);
});
