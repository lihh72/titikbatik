import assert from "node:assert/strict";
import { test } from "node:test";
import { appendCatalogPage } from "../src/lib/catalog-page";

test("page merging preserves current order, object identity and the previous duplicate semantics", () => {
  const current = Array.from({ length: 10000 }, (_, index) => ({
    id: String(index),
  }));
  const incoming = Array.from({ length: 1000 }, (_, index) => ({
    id: String(index + 9500),
  }));
  incoming.push(incoming[incoming.length - 1]);
  const expected = [
    ...current,
    ...incoming.filter((item) => !current.some((old) => old.id === item.id)),
  ];
  const merged = appendCatalogPage(current, incoming);
  assert.deepEqual(merged, expected);
  assert.equal(merged[0], current[0]);
  assert.equal(merged[current.length], incoming[500]);
  assert.equal(current.length, 10000);
  assert.equal(incoming.length, 1001);
});
