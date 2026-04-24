import {
  app,
  clone,
  equals,
  flattenLeftApplication,
  formatCompact,
  isRuleVarName,
  key,
  leftApply,
  ruleVarIndex,
  ruleVarName,
  size,
  sym,
} from "./terms.js";
import { enumerateVarBodies } from "./general-j-search.js";

function primitiveNames(count) {
  return Array.from({ length: count }, (_, index) => String.fromCharCode("A".charCodeAt(0) + index));
}

function isVar(term) {
  return term.type === "sym" && isRuleVarName(term.name);
}

function substituteVars(term, bindings) {
  if (term.type === "sym") {
    if (!isVar(term)) {
      return clone(term);
    }

    const binding = bindings[ruleVarIndex(term.name)];

    if (!binding) {
      throw new Error(`unbound variable in rule body: ${term.name}`);
    }

    return clone(binding);
  }

  return app(substituteVars(term.left, bindings), substituteVars(term.right, bindings));
}

function ruleSize(rule) {
  const usages = variableUsages(rule);

  return {
    arity: rule.arity,
    body: size(rule.body),
    full: rule.arity + size(rule.body),
    discards: usages.some((count) => count === 0),
    duplicates: usages.some((count) => count > 1),
  };
}

function variableUsages(rule) {
  const counts = Array.from({ length: rule.arity }, () => 0);

  function visit(term) {
    if (term.type === "sym") {
      if (isVar(term)) {
        counts[ruleVarIndex(term.name)] += 1;
      }

      return;
    }

    visit(term.left);
    visit(term.right);
  }

  visit(rule.body);
  return counts;
}

function tryReduceHead(term, basis) {
  const spine = flattenLeftApplication(term);
  const head = spine[0];

  if (head.type !== "sym") {
    return null;
  }

  const rule = basis.rulesByName.get(head.name);

  if (!rule || spine.length - 1 < rule.arity) {
    return null;
  }

  const args = spine.slice(1, rule.arity + 1);
  const rest = spine.slice(rule.arity + 1);
  return leftApply([substituteVars(rule.body, args), ...rest]);
}

export function reduceOneBasis(term, basis) {
  const atHead = tryReduceHead(term, basis);

  if (atHead) {
    return atHead;
  }

  if (term.type === "sym") {
    return null;
  }

  const reducedLeft = reduceOneBasis(term.left, basis);
  if (reducedLeft) {
    return app(reducedLeft, clone(term.right));
  }

  const reducedRight = reduceOneBasis(term.right, basis);
  if (reducedRight) {
    return app(clone(term.left), reducedRight);
  }

  return null;
}

export function normalizeBasis(term, basis, options = {}) {
  const maxSteps = options.maxSteps ?? 100;
  const maxTermSize = options.maxTermSize ?? 1000;
  let current = clone(term);

  for (let steps = 0; steps < maxSteps; steps += 1) {
    if (size(current) > maxTermSize) {
      return { term: current, steps, halted: false, reason: "maxTermSize" };
    }

    const next = reduceOneBasis(current, basis);

    if (!next) {
      return { term: current, steps, halted: true };
    }

    current = next;
  }

  return { term: current, steps: maxSteps, halted: false, reason: "maxSteps" };
}

export function enumeratePrimitiveTerms(names, maxSize) {
  if (!Number.isInteger(maxSize) || maxSize <= 0) {
    throw new Error("maxSize must be a positive integer");
  }

  const bySize = new Map([[1, names.map(sym)]]);
  const all = [...bySize.get(1)];

  for (let termSize = 2; termSize <= maxSize; termSize += 1) {
    const terms = [];

    for (let leftSize = 1; leftSize < termSize; leftSize += 1) {
      const rightSize = termSize - leftSize;

      for (const left of bySize.get(leftSize) ?? []) {
        for (const right of bySize.get(rightSize) ?? []) {
          const term = app(left, right);
          terms.push(term);
          all.push(term);
        }
      }
    }

    bySize.set(termSize, terms);
  }

  return all;
}

function provesSBehavior(expression, basis, options) {
  const a = sym("a");
  const b = sym("b");
  const c = sym("c");
  const expected = app(app(a, c), app(b, c));
  const reduced = normalizeBasis(leftApply([expression, a, b, c]), basis, options);

  return {
    proved: reduced.halted && equals(reduced.term, expected),
    steps: reduced.steps,
  };
}

function provesKBehavior(expression, basis, options) {
  const a = sym("a");
  const b = sym("b");
  const reduced = normalizeBasis(leftApply([expression, a, b]), basis, options);

  return {
    proved: reduced.halted && equals(reduced.term, a),
    steps: reduced.steps,
  };
}

function findWitnesses(basis, options) {
  const maxWitnessSize = options.maxWitnessSize ?? 5;
  const reductionOptions = {
    maxSteps: options.maxReductionSteps ?? 100,
    maxTermSize: options.maxTermSize ?? 1000,
  };
  const witnesses = {};
  const cache = new Map();

  function cachedProof(kind, expression) {
    const cacheKey = `${kind}:${key(expression)}`;

    if (cache.has(cacheKey)) {
      return cache.get(cacheKey);
    }

    const proof =
      kind === "S"
        ? provesSBehavior(expression, basis, reductionOptions)
        : provesKBehavior(expression, basis, reductionOptions);

    cache.set(cacheKey, proof);
    return proof;
  }

  for (const expression of enumeratePrimitiveTerms(basis.names, maxWitnessSize)) {
    if (!witnesses.S) {
      const proof = cachedProof("S", expression);

      if (proof.proved) {
        witnesses.S = { expression, steps: proof.steps };
      }
    }

    if (!witnesses.K) {
      const proof = cachedProof("K", expression);

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

export function enumerateRuleShapes(options = {}) {
  const maxArity = options.maxArity ?? 3;
  const maxBodyLeaves = options.maxBodyLeaves ?? 4;
  const maxRuleFullSize = options.maxRuleFullSize ?? Number.POSITIVE_INFINITY;
  const rules = [];

  for (let arity = 1; arity <= maxArity; arity += 1) {
    for (const body of enumerateVarBodies(arity, maxBodyLeaves)) {
      const shape = { arity, body };
      const cost = ruleSize(shape);

      if (cost.full <= maxRuleFullSize) {
        rules.push({ shape, cost });
      }
    }
  }

  return rules.sort((a, b) => {
    if (a.cost.full !== b.cost.full) {
      return a.cost.full - b.cost.full;
    }

    return `${a.shape.arity}:${formatCompact(a.shape.body)}`.localeCompare(
      `${b.shape.arity}:${formatCompact(b.shape.body)}`,
    );
  });
}

function makeBasis(names, shapes) {
  const rules = names.map((name, index) => ({
    name,
    arity: shapes[index].arity,
    body: shapes[index].body,
  }));

  return {
    names,
    rules,
    rulesByName: new Map(rules.map((rule) => [rule.name, rule])),
  };
}

function basisCost(basis) {
  const ruleCosts = basis.rules.map(ruleSize);
  const fullSize = ruleCosts.reduce((sum, cost) => sum + cost.full, 0);
  const aritySize = ruleCosts.reduce((sum, cost) => sum + cost.arity, 0);
  const bodySize = ruleCosts.reduce((sum, cost) => sum + cost.body, 0);
  const discards = ruleCosts.some((cost) => cost.discards);
  const duplicates = ruleCosts.some((cost) => cost.duplicates);

  return { ruleCosts, fullSize, aritySize, bodySize, discards, duplicates };
}

function basisKey(basis) {
  return basis.rules
    .map((rule) => `${rule.name}/${rule.arity}->${formatCompact(rule.body)}`)
    .join(";");
}

export function searchCombinatorBases(options = {}) {
  const primitiveCount = options.primitiveCount ?? 2;
  const names = primitiveNames(primitiveCount);
  const maxBasisFullSize = options.maxBasisFullSize ?? Number.POSITIVE_INFINITY;
  const maxSystems = options.maxSystems ?? Number.POSITIVE_INFINITY;
  const structuralFilter = options.structuralFilter ?? true;
  const ruleShapes = enumerateRuleShapes(options);
  const results = [];
  let searched = 0;

  function visit(selected) {
    if (results.length >= maxSystems) {
      return;
    }

    if (selected.length === primitiveCount) {
      const basis = makeBasis(
        names,
        selected.map((entry) => entry.shape),
      );
      const cost = basisCost(basis);

      if (cost.fullSize > maxBasisFullSize) {
        return;
      }

      if (structuralFilter && (!cost.discards || !cost.duplicates)) {
        return;
      }

      searched += 1;
      const witnesses = findWitnesses(basis, options);

      if (witnesses.S && witnesses.K) {
        results.push({ basis, cost, witnesses });
      }

      return;
    }

    for (const shape of ruleShapes) {
      const currentFullSize =
        selected.reduce((sum, entry) => sum + entry.cost.full, 0) + shape.cost.full;

      if (currentFullSize > maxBasisFullSize) {
        break;
      }

      visit([...selected, shape]);
    }
  }

  visit([]);

  return {
    searched,
    results: sortCombinatorBases(results),
  };
}

export function sortCombinatorBases(results) {
  return results.sort((a, b) => {
    if (a.cost.fullSize !== b.cost.fullSize) {
      return a.cost.fullSize - b.cost.fullSize;
    }

    if (a.basis.rules.length !== b.basis.rules.length) {
      return a.basis.rules.length - b.basis.rules.length;
    }

    return basisKey(a.basis).localeCompare(basisKey(b.basis));
  });
}

export function describeCombinatorBasis(result) {
  const lines = [
    `full size: ${result.cost.fullSize}`,
    `arity size: ${result.cost.aritySize}`,
    `body size: ${result.cost.bodySize}`,
    "",
  ];

  for (let index = 0; index < result.basis.rules.length; index += 1) {
    const rule = result.basis.rules[index];
    const cost = result.cost.ruleCosts[index];
    const vars = Array.from({ length: rule.arity }, (_, index) => ruleVarName(index)).join(" ");
    lines.push(`${rule.name} ${vars} -> ${formatCompact(rule.body)}`);
    lines.push(`  arity=${cost.arity}, body=${cost.body}, full=${cost.full}`);
  }

  lines.push("");
  lines.push(`S witness: ${formatCompact(result.witnesses.S.expression)}`);
  lines.push(`K witness: ${formatCompact(result.witnesses.K.expression)}`);

  return lines.join("\n");
}
