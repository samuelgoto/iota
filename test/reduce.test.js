import assert from "node:assert/strict";
import { bodyFromTokens } from "../src/search.js";
import { app, equals, I, K, leftApply, S, sym, U } from "../src/terms.js";
import { normalize, reduceOneNormalOrder } from "../src/reduce.js";

describe("normal-order reduction", () => {
  it("reduces SKK to identity behavior", () => {
    const x = sym("a");
    const term = leftApply([S, K, K, x]);
    const reduced = normalize(term, U);

    assert.equal(reduced.halted, true);
    assert.equal(equals(reduced.term, x), true);
  });

  it("performs one iota-style U reduction when U x -> x S K", () => {
    const ruleBody = bodyFromTokens(["x", "S", "K"]);
    const reduced = reduceOneNormalOrder(app(U, U), ruleBody);

    assert.equal(equals(reduced, leftApply([U, S, K])), true);
  });

  it("reduces I to its argument", () => {
    const x = sym("a");
    const reduced = normalize(app(I, x), U);

    assert.equal(reduced.halted, true);
    assert.equal(equals(reduced.term, x), true);
  });
});
