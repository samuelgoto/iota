import { app, equals, format, formatCompact, leftApply, size, sym, U } from "./terms.js";
import { normalize } from "./reduce.js";

const BODY_TOKENS = ["x", "S", "K"];

function tokenToTerm(token) {
  return sym(token);
}

export function bodyFromTokens(tokens) {
  return leftApply(tokens.map(tokenToTerm));
}

export function* enumerateBodies(length, tokens = BODY_TOKENS) {
  if (!Number.isInteger(length) || length <= 0) {
    throw new Error("body length must be a positive integer");
  }

  function* visit(prefix) {
    if (prefix.length === length) {
      yield prefix;
      return;
    }

    for (const token of tokens) {
      yield* visit([...prefix, token]);
    }
  }

  yield* visit([]);
}

export function enumerateBodyTerms(length, tokens = BODY_TOKENS) {
  if (!Number.isInteger(length) || length <= 0) {
    throw new Error("body length must be a positive integer");
  }

  const byLength = new Map();
  byLength.set(1, tokens.map(tokenToTerm));

  for (let termLength = 2; termLength <= length; termLength += 1) {
    const terms = [];

    for (let leftLength = 1; leftLength < termLength; leftLength += 1) {
      const rightLength = termLength - leftLength;

      for (const left of byLength.get(leftLength)) {
        for (const right of byLength.get(rightLength)) {
          terms.push(app(left, right));
        }
      }
    }

    byLength.set(termLength, terms);
  }

  return byLength.get(length);
}

export function catalan(n) {
  if (!Number.isInteger(n) || n < 0) {
    throw new Error("catalan input must be a non-negative integer");
  }

  let result = 1;

  for (let k = 0; k < n; k += 1) {
    result = (result * 2 * (2 * k + 1)) / (k + 2);
  }

  return result;
}

export function candidateCount(length, alphabetSize = BODY_TOKENS.length) {
  return alphabetSize ** length * catalan(length - 1);
}

function provesSBehavior(expression, ruleBody, options) {
  const a = sym("a");
  const b = sym("b");
  const c = sym("c");
  const term = leftApply([expression, a, b, c]);
  const expected = app(app(a, c), app(b, c));
  const reduced = normalize(term, ruleBody, options);

  return {
    proved: reduced.halted && equals(reduced.term, expected),
    steps: reduced.steps,
  };
}

function provesKBehavior(expression, ruleBody, options) {
  const a = sym("a");
  const b = sym("b");
  const term = leftApply([expression, a, b]);
  const reduced = normalize(term, ruleBody, options);

  return {
    proved: reduced.halted && equals(reduced.term, a),
    steps: reduced.steps,
  };
}

export function* enumerateUTerms(maxSize) {
  if (!Number.isInteger(maxSize) || maxSize <= 0) {
    throw new Error("maxSize must be a positive integer");
  }

  const bySize = new Map([[1, [U]]]);
  yield U;

  for (let termSize = 2; termSize <= maxSize; termSize += 1) {
    const terms = [];

    for (let leftSize = 1; leftSize < termSize; leftSize += 1) {
      const rightSize = termSize - leftSize;

      for (const left of bySize.get(leftSize) ?? []) {
        for (const right of bySize.get(rightSize) ?? []) {
          const term = app(left, right);
          terms.push(term);
          yield term;
        }
      }
    }

    bySize.set(termSize, terms);
  }
}

export function findWitnesses(ruleBody, options = {}) {
  const maxExpressionSize = options.maxExpressionSize ?? 8;
  const maxReductionSteps = options.maxReductionSteps ?? 1000;
  const maxTermSize = options.maxTermSize ?? 5000;
  const witnesses = {};
  const reductionOptions = {
    maxSteps: maxReductionSteps,
    maxTermSize,
  };

  for (const expression of enumerateUTerms(maxExpressionSize)) {
    if (!witnesses.S) {
      const proof = provesSBehavior(expression, ruleBody, reductionOptions);

      if (proof.proved) {
        witnesses.S = { expression, steps: proof.steps };
      }
    }

    if (!witnesses.K) {
      const proof = provesKBehavior(expression, ruleBody, reductionOptions);

      if (proof.proved) {
        witnesses.K = { expression, steps: proof.steps };
      }
    }

    if (witnesses.S && witnesses.K) {
      return witnesses;
    }
  }

  return witnesses;
}

export function searchBodyLength(length, options = {}) {
  const results = [];

  for (const ruleBody of enumerateBodyTerms(length, options.tokens ?? BODY_TOKENS)) {
    const witnesses = findWitnesses(ruleBody, options);

    if (witnesses.S && witnesses.K) {
      results.push({
        ruleBody,
        bodySize: size(ruleBody),
        witnesses,
      });
    }
  }

  return results;
}

export function describeResult(result) {
  return [
    `U x -> ${format(result.ruleBody)}`,
    `S = ${formatCompact(result.witnesses.S.expression)}`,
    `K = ${formatCompact(result.witnesses.K.expression)}`,
  ].join("\n");
}
