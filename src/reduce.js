import { app, clone, flattenLeftApplication, leftApply, size } from "./terms.js";

function replaceX(term, value) {
  if (term.type === "sym") {
    return term.name === "x" ? clone(value) : clone(term);
  }

  return app(replaceX(term.left, value), replaceX(term.right, value));
}

function tryReduceHead(term, ruleBody) {
  const spine = flattenLeftApplication(term);
  const head = spine[0];

  if (head.type !== "sym") {
    return null;
  }

  if (head.name === "S" && spine.length >= 4) {
    const [, x, y, z, ...rest] = spine;
    return leftApply([app(app(clone(x), clone(z)), app(clone(y), clone(z))), ...rest]);
  }

  if (head.name === "K" && spine.length >= 3) {
    const [, x, , ...rest] = spine;
    return leftApply([clone(x), ...rest]);
  }

  if (head.name === "U" && spine.length >= 2) {
    const [, x, ...rest] = spine;
    return leftApply([replaceX(ruleBody, x), ...rest]);
  }

  return null;
}

export function reduceOneNormalOrder(term, ruleBody) {
  const atHead = tryReduceHead(term, ruleBody);

  if (atHead) {
    return atHead;
  }

  if (term.type === "sym") {
    return null;
  }

  const reducedLeft = reduceOneNormalOrder(term.left, ruleBody);
  if (reducedLeft) {
    return app(reducedLeft, clone(term.right));
  }

  const reducedRight = reduceOneNormalOrder(term.right, ruleBody);
  if (reducedRight) {
    return app(clone(term.left), reducedRight);
  }

  return null;
}

export function normalize(term, ruleBody, options = {}) {
  const maxSteps = options.maxSteps ?? 1000;
  const maxTermSize = options.maxTermSize ?? 5000;
  let current = clone(term);

  for (let steps = 0; steps < maxSteps; steps += 1) {
    if (size(current) > maxTermSize) {
      return { term: current, steps, halted: false, reason: "maxTermSize" };
    }

    const next = reduceOneNormalOrder(current, ruleBody);

    if (!next) {
      return { term: current, steps, halted: true };
    }

    current = next;
  }

  return { term: current, steps: maxSteps, halted: false, reason: "maxSteps" };
}
