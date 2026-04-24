import assert from "node:assert/strict";
import {
  J,
  headsOverlap,
  normalizeJStyle,
  provesEmbeddedSK,
  searchJStyle,
} from "../src/j-style.js";
import { app, equals, leftApply, sym } from "../src/terms.js";

describe("J-style SK embedding search", () => {
  it("proves the classic j-style heads embed S and K", () => {
    const system = {
      sHead: app(J, J),
      kHead: app(J, app(J, J)),
    };

    assert.equal(provesEmbeddedSK(system), true);
  });

  it("rejects overlapping heads by default", () => {
    assert.equal(headsOverlap(J, app(J, J)), true);
    assert.equal(headsOverlap(app(J, J), app(J, app(J, J))), false);
  });

  it("reduces the classic j-style S head", () => {
    const system = {
      sHead: app(J, J),
      kHead: app(J, app(J, J)),
    };
    const a = sym("a");
    const b = sym("b");
    const c = sym("c");
    const reduced = normalizeJStyle(leftApply([system.sHead, a, b, c]), system);

    assert.equal(reduced.halted, true);
    assert.equal(equals(reduced.term, app(app(a, c), app(b, c))), true);
  });

  it("finds total size 5 as the shortest non-overlapping construction", () => {
    const systems = searchJStyle({ maxHeadSize: 3 });

    assert.ok(systems.length >= 1);
    assert.equal(systems[0].totalSize, 5);
  });
});

