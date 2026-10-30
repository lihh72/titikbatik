import assert from "node:assert/strict";
import test from "node:test";
import {
  artworkDate,
  catalogPalette,
  mediaName,
} from "../src/lib/artwork-presentation";

test("catalog palette keeps recorded names and never invents an unknown color", () => {
  assert.deepEqual(catalogPalette(" Navy, krem / Warna khusus "), [
    { name: "Navy", color: "#202b43" },
    { name: "krem", color: "#e6dac2" },
    { name: "Warna khusus", color: null },
  ]);
  assert.deepEqual(catalogPalette(" , / "), []);
  assert.equal(catalogPalette("Persik dan abu-abu").length, 2);
});

test("media labels localize costumes without changing arbitrary motif labels", () => {
  assert.equal(
    mediaName({ id: "costume-0", label: "Costume 1", kind: "image" }),
    "Busana",
  );
  assert.equal(
    mediaName({ id: "costume-2", label: "Costume 3", kind: "image" }),
    "Busana 3",
  );
  assert.equal(
    mediaName({ id: "motif", label: "Detail tenun", kind: "image" }),
    "Detail tenun",
  );
  assert.equal(
    mediaName({ id: "video", label: "Runway", kind: "video" }),
    "Video",
  );
});

test("missing creation dates remain explicitly unknown", () => {
  assert.equal(artworkDate("invalid"), "Belum tercatat");
  assert.match(artworkDate("2026-07-01T09:00:00+07:00"), /2026/);
});
