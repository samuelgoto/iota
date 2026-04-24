import assert from "node:assert/strict";
import {
  classicJSystem,
  enumerateVarBodies,
  normalizeGeneralJ,
} from "../src/general-j-search.js";
import { app, equals, leftApply, sym } from "../src/terms.js";

describe("general J-like rewrite-system search", () => {
  it("enumerates variable-only bodies", () => {
    assert.equal(enumerateVarBodies(2, 1).length, 2);
    assert.equal(enumerateVarBodies(2, 2).length, 6);
  });

  it("reduces the classic j system", () => {
    const system = classicJSystem();
    const a = sym("a");
    const b = sym("b");
    const c = sym("c");
    const reduced = normalizeGeneralJ(leftApply([system.rules[0].head, a, b, c]), system);

    assert.equal(reduced.halted, true);
    assert.equal(equals(reduced.term, app(app(a, c), app(b, c))), true);
  });

});
