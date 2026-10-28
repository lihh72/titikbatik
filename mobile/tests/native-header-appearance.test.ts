import assert from "node:assert/strict";
import test from "node:test";
import { nativeHeaderAppearance } from "../src/lib/native-header-appearance";

test("iOS 27 selects the native soft edge without disabling SDK 58 system appearance", () => {
  const value = nativeHeaderAppearance("ios", "27.2", false, "#000000");
  assert.equal(value.scrollEdgeEffects.top, "soft");
  assert.equal(value.headerStyle, undefined);
  assert.equal(value.headerTransparent, undefined);
});
test("iOS 26 retains automatic native glass while older UIKit keeps its existing setup", () => {
  assert.equal(
    nativeHeaderAppearance("ios", "26.5", false, "#000000").scrollEdgeEffects
      .top,
    "automatic",
  );
  assert.equal(
    nativeHeaderAppearance("ios", "26.5", false, "#000000").headerStyle,
    undefined,
  );
  assert.deepEqual(
    nativeHeaderAppearance("ios", "18.7", false, "#000000").headerStyle,
    { backgroundColor: "transparent" },
  );
});
test("Reduce Transparency remains opaque and disables the native edge on every iOS version", () => {
  for (const version of [18, 26, 27]) {
    const value = nativeHeaderAppearance("ios", version, true, "#000000");
    assert.equal(value.scrollEdgeEffects.top, "hidden");
    assert.equal(value.headerTransparent, false);
    assert.deepEqual(value.headerStyle, { backgroundColor: "#000000" });
  }
});
test("Android never gets a translucent iOS header or forced soft edge", () => {
  const value = nativeHeaderAppearance("android", 37, false, "#000000");
  assert.equal(value.headerTransparent, false);
  assert.deepEqual(value.headerStyle, { backgroundColor: "#000000" });
  assert.equal(value.scrollEdgeEffects.top, "automatic");
});
