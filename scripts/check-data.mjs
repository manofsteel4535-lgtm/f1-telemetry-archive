import { readFileSync, existsSync } from "node:fs";
import assert from "node:assert/strict";
import { profiles, featuredIds } from "../src/data/profiles.js";
const data = JSON.parse(
  readFileSync(new URL("../src/data/circuits.json", import.meta.url)),
);
assert.equal(data.length, 78, "Registry snapshot should contain 78 venues");
assert.equal(
  new Set(data.map((c) => c.id)).size,
  data.length,
  "Circuit IDs must be unique",
);
for (const c of data) {
  assert(
    c.length > 0 && c.turns > 0 && c.first >= 1950 && c.last >= c.first,
    `Invalid dimensions or dates: ${c.id}`,
  );
  assert(
    c.path || existsSync(new URL(`../public${c.image}`, import.meta.url)),
    `Missing map: ${c.id}`,
  );
  if (c.image) {
    const bytes = readFileSync(new URL(`../public${c.image}`, import.meta.url));
    assert(
      bytes.subarray(0, 2000).toString().includes("<svg") ||
        bytes.subarray(0, 4).equals(Buffer.from([137, 80, 78, 71])),
      `Invalid map bytes: ${c.id}`,
    );
  }
  assert(c.source.startsWith("https://"), "Source URL required");
  for (const r of c.records)
    assert(
      r.configuration && r.source,
      "Record must identify source configuration",
    );
}
for (const id of featuredIds) {
  assert(
    data.some((c) => c.id === id && c.path),
    `Featured circuit needs a vector map: ${id}`,
  );
  for (const corner of profiles[id].corners)
    assert(
      corner.fraction >= 0 && corner.fraction <= 1,
      "Marker fraction invalid",
    );
}
console.log(
  `PASS: ${data.length} unique venues, 78 maps, configuration-labelled records, ${featuredIds.length} coaching profiles.`,
);
