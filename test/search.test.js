import assert from "node:assert/strict";
import {
  bodyFromTokens,
  candidateCount,
  enumerateBodies,
  enumerateBodyTerms,
  findWitnesses,
  searchBodyLength,
} from "../src/search.js";

describe("one-point basis search", () => {
  it("enumerates all length-1 bodies over x, S, K", () => {
    assert.deepEqual([...enumerateBodies(1)], [["x"], ["S"], ["K"]]);
  });

  it("enumerates all binary body shapes for a leaf length", () => {
    assert.equal(enumerateBodyTerms(3).length, candidateCount(3));
  });

  it("finds nothing at body length 1", () => {
    assert.deepEqual(searchBodyLength(1, { maxExpressionSize: 6 }), []);
  });

  it("finds iota witnesses for U x -> x S K", () => {
    const ruleBody = bodyFromTokens(["x", "S", "K"]);
    const witnesses = findWitnesses(ruleBody, { maxExpressionSize: 8 });

    assert.ok(witnesses.S);
    assert.ok(witnesses.K);
  });

  it("finds rho witnesses for U x -> x K S", () => {
    const ruleBody = bodyFromTokens(["x", "K", "S"]);
    const witnesses = findWitnesses(ruleBody, { maxExpressionSize: 8 });

    assert.ok(witnesses.S);
    assert.ok(witnesses.K);
  });

  it("finds chi witnesses for U x -> x K S K", () => {
    const ruleBody = bodyFromTokens(["x", "K", "S", "K"]);
    const witnesses = findWitnesses(ruleBody, { maxExpressionSize: 8 });

    assert.ok(witnesses.S);
    assert.ok(witnesses.K);
  });
});
