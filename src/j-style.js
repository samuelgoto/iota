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

export const J = sym("J");

export function enumerateJTerms(maxSize) {
  if (!Number.isInteger(maxSize) || maxSize <= 0) {
    throw new Error("maxSize must be a positive integer");
  }

  const bySize = new Map([[1, [J]]]);
  const all = [J];

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

function spinePrefix(prefixTerm, term) {
  const prefix = flattenLeftApplication(prefixTerm);
  const target = flattenLeftApplication(term);

  if (prefix.length > target.length) {
    return false;
  }

  return prefix.every((part, index) => equals(part, target[index]));
}

export function headsOverlap(a, b) {
  return spinePrefix(a, b) || spinePrefix(b, a);
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
  const sArgs = matchHead(spine, system.sHead);

  if (sArgs && sArgs.length >= 3) {
    const [x, y, z, ...rest] = sArgs;
    return leftApply([app(app(clone(x), clone(z)), app(clone(y), clone(z))), ...rest]);
  }

  const kArgs = matchHead(spine, system.kHead);

  if (kArgs && kArgs.length >= 2) {
    const [x, , ...rest] = kArgs;
    return leftApply([clone(x), ...rest]);
  }

  return null;
}

export function reduceOneJStyle(term, system) {
  const atHead = tryReduceHead(term, system);

  if (atHead) {
    return atHead;
  }

  if (term.type === "sym") {
    return null;
  }

  const reducedLeft = reduceOneJStyle(term.left, system);
  if (reducedLeft) {
    return app(reducedLeft, clone(term.right));
  }

  const reducedRight = reduceOneJStyle(term.right, system);
  if (reducedRight) {
    return app(clone(term.left), reducedRight);
  }

  return null;
}

export function normalizeJStyle(term, system, options = {}) {
  const maxSteps = options.maxSteps ?? 100;
  let current = clone(term);

  for (let steps = 0; steps < maxSteps; steps += 1) {
    const next = reduceOneJStyle(current, system);

    if (!next) {
      return { term: current, steps, halted: true };
    }

    current = next;
  }

  return { term: current, steps: maxSteps, halted: false, reason: "maxSteps" };
}

export function provesEmbeddedSK(system) {
  const a = sym("a");
  const b = sym("b");
  const c = sym("c");
  const expectedS = app(app(a, c), app(b, c));
  const reducedS = normalizeJStyle(leftApply([system.sHead, a, b, c]), system);
  const reducedK = normalizeJStyle(leftApply([system.kHead, a, b]), system);

  return (
    reducedS.halted &&
    reducedK.halted &&
    equals(reducedS.term, expectedS) &&
    equals(reducedK.term, a)
  );
}

export function searchJStyle(options = {}) {
  const maxHeadSize = options.maxHeadSize ?? 4;
  const allowOverlap = options.allowOverlap ?? false;
  const heads = enumerateJTerms(maxHeadSize);
  const systems = [];

  for (const sHead of heads) {
    for (const kHead of heads) {
      if (equals(sHead, kHead)) {
        continue;
      }

      if (!allowOverlap && headsOverlap(sHead, kHead)) {
        continue;
      }

      const system = {
        sHead,
        kHead,
        sSize: size(sHead),
        kSize: size(kHead),
        totalSize: size(sHead) + size(kHead),
      };

      if (provesEmbeddedSK(system)) {
        systems.push(system);
      }
    }
  }

  return systems.sort((a, b) => {
    if (a.totalSize !== b.totalSize) {
      return a.totalSize - b.totalSize;
    }

    if (Math.max(a.sSize, a.kSize) !== Math.max(b.sSize, b.kSize)) {
      return Math.max(a.sSize, a.kSize) - Math.max(b.sSize, b.kSize);
    }

    return `${key(a.sHead)}:${key(a.kHead)}`.localeCompare(`${key(b.sHead)}:${key(b.kHead)}`);
  });
}

export function describeJSystem(system) {
  return [
    `S head: ${format(system.sHead)}  (size ${system.sSize})`,
    `K head: ${format(system.kHead)}  (size ${system.kSize})`,
    `total head size: ${system.totalSize}`,
    "",
    `${formatCompact(system.sHead)} a b c -> a c (b c)`,
    `${formatCompact(system.kHead)} a b -> a`,
  ].join("\n");
}

