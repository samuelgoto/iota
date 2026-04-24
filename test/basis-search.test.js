import assert from "node:assert/strict";
import {
  enumeratePrimitiveTerms,
  normalizeBasis,
  searchCombinatorBases,
} from "../src/basis-search.js";
import { app, equals, leftApply, sym } from "../src/terms.js";

describe("ordinary combinator-basis search", () => {
  it("enumerates primitive expressions", () => {
    assert.equal(enumeratePrimitiveTerms(["A"], 3).length, 4);
    assert.equal(enumeratePrimitiveTerms(["A", "B"], 2).length, 6);
  });

  it("reduces a direct SK basis", () => {
    const basis = {
      names: ["A", "B"],
      rules: [
        { name: "A", arity: 3, body: app(app(sym("a"), sym("c")), app(sym("b"), sym("c"))) },
        { name: "B", arity: 2, body: sym("a") },
      ],
      rulesByName: new Map(),
    };
    basis.rulesByName = new Map(basis.rules.map((rule) => [rule.name, rule]));

    const a = sym("a");
    const b = sym("b");
    const c = sym("c");
    const reduced = normalizeBasis(leftApply([sym("A"), a, b, c]), basis);

    assert.equal(reduced.halted, true);
    assert.equal(equals(reduced.term, app(app(a, c), app(b, c))), true);
  });

  it("rediscovers SK at full size 10", () => {
    const { results } = searchCombinatorBases({
      primitiveCount: 2,
      maxArity: 3,
      maxBodyLeaves: 4,
      maxWitnessSize: 1,
      maxBasisFullSize: 10,
    });

    assert.ok(results.some((result) => result.cost.fullSize === 10));
  });
});
