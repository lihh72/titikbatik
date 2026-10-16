import assert from "node:assert/strict";
import { test } from "node:test";
import { headerButtons, type HeaderMode } from "../src/lib/header-buttons";

test("UIKit matches the same action slots from tabs through detail", () => {
  for (const mode of [
    "catalog",
    "saved",
    "assistant",
    "detail",
  ] as HeaderMode[]) {
    let primaryCalls = 0;
    let secondaryCalls = 0;
    const items = headerButtons(mode, {
      primary: () => primaryCalls++,
      secondary: () => secondaryCalls++,
    });
    assert.equal(items.at(-1)?.identifier, "titikbatik.primary-action");
    assert.equal(
      new Set(items.map((item) => item.identifier)).size,
      items.length,
    );
    items.at(-1)!.onPress();
    assert.equal(primaryCalls, 1);
    assert.equal(secondaryCalls, 0);
    if (mode === "catalog" || mode === "detail") {
      assert.equal(items[0].identifier, "titikbatik.secondary-action");
      items[0].onPress();
      assert.equal(secondaryCalls, 1);
    }
    assert.ok(
      items.every(
        (item) => item.sharesBackground && !item.hidesSharedBackground,
      ),
    );
  }
});

test("bookmark state and loading update icons without changing native identity", () => {
  const before = headerButtons(
    "detail",
    { primary: () => {} },
    { loading: true },
  );
  const after = headerButtons("detail", { primary: () => {} }, { saved: true });
  assert.deepEqual(
    before.map((item) => item.identifier),
    after.map((item) => item.identifier),
  );
  assert.ok(before.every((item) => item.disabled));
  assert.equal(after[0].icon.name, "bookmark.fill");
  assert.equal(after[0].selected, true);
  assert.equal(after[0].label, "Hapus dari tersimpan");
  assert.equal(after[1].icon.name, "square.and.arrow.up");
  assert.equal(
    headerButtons("assistant", { primary: () => {} }, { disabled: true })[0]
      .disabled,
    true,
  );
});
