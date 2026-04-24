import {
  app,
  clone,
  equals,
  flattenLeftApplication,
  format,
  formatCompact,
  key,
  leftApply,
  size,
  sym,
} from "./terms.js";
import { J, enumerateJTerms, headsOverlap } from "./j-style.js";

function varName(index) {
  return `v${index}`;
}

function isVar(term) {
  return term.type === "sym" && /^v\d+$/.test(term.name);
}

function varIndex(term) {
  return Number.parseInt(term.name.slice(1), 10);
}

function substituteVars(term, bindings) {
  if (term.type === "sym") {
    if (!isVar(term)) {
      return clone(term);
    }

    const binding = bindings[varIndex(term)];

    if (!binding) {
      throw new Error(`unbound variable in rule body: ${term.name}`);
    }

    return clone(binding);
  }

  return app(substituteVars(term.left, bindings), substituteVars(term.right, bindings));
}

export function enumerateVarBodies(arity, maxLeaves) {
  if (!Number.isInteger(arity) || arity <= 0) {
    throw new Error("arity must be a positive integer");
  }

  if (!Number.isInteger(maxLeaves) || maxLeaves <= 0) {
    throw new Error("maxLeaves must be a positive integer");
  }

  const vars = Array.from({ length: arity }, (_, index) => sym(varName(index)));
  const byLeaves = new Map([[1, vars]]);
  const all = [...vars];

  for (let leaves = 2; leaves <= maxLeaves; leaves += 1) {
    const terms = [];

    for (let leftLeaves = 1; leftLeaves < leaves; leftLeaves += 1) {
      const rightLeaves = leaves - leftLeaves;

      for (const left of byLeaves.get(leftLeaves) ?? []) {
        for (const right of byLeaves.get(rightLeaves) ?? []) {
          const term = app(left, right);
          terms.push(term);
          all.push(term);
        }
      }
    }

    byLeaves.set(leaves, terms);
  }

  return all;
}

function matchHead(spine, head) {
  const headSpine = flattenLeftApplication(head);

  if (headSpine.length > spine.length) {
    return null;
  }

  for (let index = 0; index < headSpine.length; index += 1) {
    if (!equals(headSpine[index], spine[index])) {
      return null;
    }
  }

  return spine.slice(headSpine.length);
}

function tryReduceHead(term, system) {
  const spine = flattenLeftApplication(term);

  for (const rule of system.rules) {
    const args = matchHead(spine, rule.head);

    if (!args || args.length < rule.arity) {
      continue;
    }

    const bindings = args.slice(0, rule.arity);
    const rest = args.slice(rule.arity);
    return leftApply([substituteVars(rule.body, bindings), ...rest]);
  }

  return null;
}

export function reduceOneGeneralJ(term, system) {
  const atHead = tryReduceHead(term, system);

  if (atHead) {
    return atHead;
  }

  if (term.type === "sym") {
    return null;
  }

  const reducedLeft = reduceOneGeneralJ(term.left, system);
  if (reducedLeft) {
    return app(reducedLeft, clone(term.right));
  }

  const reducedRight = reduceOneGeneralJ(term.right, system);
  if (reducedRight) {
    return app(clone(term.left), reducedRight);
  }

  return null;
}

export function normalizeGeneralJ(term, system, options = {}) {
  const maxSteps = options.maxSteps ?? 100;
  const maxTermSize = options.maxTermSize ?? 1000;
  let current = clone(term);

  for (let steps = 0; steps < maxSteps; steps += 1) {
    if (size(current) > maxTermSize) {
      return { term: current, steps, halted: false, reason: "maxTermSize" };
    }

    const next = reduceOneGeneralJ(current, system);

    if (!next) {
      return { term: current, steps, halted: true };
    }

    current = next;
  }

  return { term: current, steps: maxSteps, halted: false, reason: "maxSteps" };
}

function provesSBehavior(expression, system, options) {
  const a = sym("a");
  const b = sym("b");
  const c = sym("c");
  const expected = app(app(a, c), app(b, c));
  const reduced = normalizeGeneralJ(leftApply([expression, a, b, c]), system, options);

  return {
    proved: reduced.halted && equals(reduced.term, expected),
    steps: reduced.steps,
  };
}

function provesKBehavior(expression, system, options) {
  const a = sym("a");
  const b = sym("b");
  const reduced = normalizeGeneralJ(leftApply([expression, a, b]), system, options);

  return {
    proved: reduced.halted && equals(reduced.term, a),
    steps: reduced.steps,
  };
}

function findWitnesses(system, options) {
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
        ? provesSBehavior(expression, system, reductionOptions)
        : provesKBehavior(expression, system, reductionOptions);

    cache.set(cacheKey, proof);
    return proof;
  }

  for (const expression of enumerateJTerms(maxWitnessSize)) {
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

function ruleCost(rule) {
  return {
    headSize: size(rule.head),
    bodySize: size(rule.body),
    arity: rule.arity,
    coreSize: size(rule.head) + size(rule.body),
    fullSize: size(rule.head) + rule.arity + size(rule.body),
  };
}

function systemWithCosts(rules, witnesses) {
  const ruleCosts = rules.map(ruleCost);
  const coreSize = ruleCosts.reduce((sum, cost) => sum + cost.coreSize, 0);
  const fullSize = ruleCosts.reduce((sum, cost) => sum + cost.fullSize, 0);

  return { rules, ruleCosts, coreSize, fullSize, witnesses };
}

function systemKey(system) {
  return system.rules
    .map((rule) => `${format(rule.head)}/${rule.arity}->${format(rule.body)}`)
    .join(";");
}

export function* enumerateRules(options = {}) {
  const maxHeadSize = options.maxHeadSize ?? 3;
  const maxArity = options.maxArity ?? 3;
  const maxBodyLeaves = options.maxBodyLeaves ?? 4;

  for (const head of enumerateJTerms(maxHeadSize)) {
    for (let arity = 1; arity <= maxArity; arity += 1) {
      for (const body of enumerateVarBodies(arity, maxBodyLeaves)) {
        yield { head, arity, body };
      }
    }
  }
}

export function searchGeneralJ(options = {}) {
  const allowOverlap = options.allowOverlap ?? false;
  const maxSystems = options.maxSystems ?? Number.POSITIVE_INFINITY;
  const maxFullSize = options.maxFullSize ?? Number.POSITIVE_INFINITY;
  const maxCoreSize = options.maxCoreSize ?? Number.POSITIVE_INFINITY;
  const maxRulePairs = options.maxRulePairs ?? Number.POSITIVE_INFINITY;
  const rules = [...enumerateRules(options)]
    .map((rule) => ({ rule, cost: ruleCost(rule) }))
    .sort((a, b) => {
      if (a.cost.fullSize !== b.cost.fullSize) {
        return a.cost.fullSize - b.cost.fullSize;
      }

      if (a.cost.coreSize !== b.cost.coreSize) {
        return a.cost.coreSize - b.cost.coreSize;
      }

      return `${format(a.rule.head)}:${a.rule.arity}:${format(a.rule.body)}`.localeCompare(
        `${format(b.rule.head)}:${b.rule.arity}:${format(b.rule.body)}`,
      );
    });
  const seen = new Set();
  const systems = [];
  let checkedPairs = 0;

  for (let firstIndex = 0; firstIndex < rules.length; firstIndex += 1) {
    for (let secondIndex = firstIndex + 1; secondIndex < rules.length; secondIndex += 1) {
      const first = rules[firstIndex].rule;
      const second = rules[secondIndex].rule;
      const firstCost = rules[firstIndex].cost;
      const secondCost = rules[secondIndex].cost;

      if (firstCost.fullSize + secondCost.fullSize > maxFullSize) {
        break;
      }

      if (firstCost.coreSize + secondCost.coreSize > maxCoreSize) {
        continue;
      }

      if (!allowOverlap && headsOverlap(first.head, second.head)) {
        continue;
      }

      checkedPairs += 1;

      if (checkedPairs > maxRulePairs) {
        return sortGeneralJSystems(systems);
      }

      const system = { rules: [first, second] };
      const id = systemKey(system);

      if (seen.has(id)) {
        continue;
      }

      seen.add(id);
      const witnesses = findWitnesses(system, options);

      if (witnesses.S && witnesses.K) {
        systems.push(systemWithCosts(system.rules, witnesses));
      }

      if (systems.length >= maxSystems) {
        return sortGeneralJSystems(systems);
      }
    }
  }

  return sortGeneralJSystems(systems);
}

export function sortGeneralJSystems(systems) {
  return systems.sort((a, b) => {
    if (a.fullSize !== b.fullSize) {
      return a.fullSize - b.fullSize;
    }

    if (a.coreSize !== b.coreSize) {
      return a.coreSize - b.coreSize;
    }

    return systemKey(a).localeCompare(systemKey(b));
  });
}

function describeRule(rule, cost) {
  const vars = Array.from({ length: rule.arity }, (_, index) => varName(index)).join(" ");
  return [
    `${formatCompact(rule.head)} ${vars} -> ${formatCompact(rule.body)}`,
    `  head=${cost.headSize}, arity=${cost.arity}, body=${cost.bodySize}, full=${cost.fullSize}`,
  ].join("\n");
}

export function describeGeneralJSystem(system) {
  return [
    `full size: ${system.fullSize}`,
    `core size: ${system.coreSize}`,
    "",
    describeRule(system.rules[0], system.ruleCosts[0]),
    describeRule(system.rules[1], system.ruleCosts[1]),
    "",
    `S witness: ${formatCompact(system.witnesses.S.expression)}`,
    `K witness: ${formatCompact(system.witnesses.K.expression)}`,
  ].join("\n");
}

export function classicJSystem() {
  return {
    rules: [
      {
        head: app(J, J),
        arity: 3,
        body: app(app(sym("v0"), sym("v2")), app(sym("v1"), sym("v2"))),
      },
      {
        head: app(J, app(J, J)),
        arity: 2,
        body: sym("v0"),
      },
    ],
  };
}
