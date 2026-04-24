export function sym(name) {
  return { type: "sym", name };
}

export function app(left, right) {
  return { type: "app", left, right };
}

export const S = sym("S");
export const K = sym("K");
export const U = sym("U");

export function clone(term) {
  if (term.type === "sym") {
    return sym(term.name);
  }

  return app(clone(term.left), clone(term.right));
}

export function equals(a, b) {
  if (a.type !== b.type) {
    return false;
  }

  if (a.type === "sym") {
    return a.name === b.name;
  }

  return equals(a.left, b.left) && equals(a.right, b.right);
}

export function size(term) {
  if (term.type === "sym") {
    return 1;
  }

  return size(term.left) + size(term.right);
}

export function leftApply(terms) {
  if (terms.length === 0) {
    throw new Error("leftApply requires at least one term");
  }

  return terms.slice(1).reduce((left, right) => app(left, right), terms[0]);
}

export function flattenLeftApplication(term) {
  const terms = [];
  let cursor = term;

  while (cursor.type === "app") {
    terms.unshift(cursor.right);
    cursor = cursor.left;
  }

  terms.unshift(cursor);
  return terms;
}

export function format(term) {
  if (term.type === "sym") {
    return term.name;
  }

  return `(${format(term.left)} ${format(term.right)})`;
}

export function formatCompact(term) {
  const parts = flattenLeftApplication(term).map((part) => {
    if (part.type === "sym") {
      return part.name;
    }

    return format(part);
  });

  return parts.join(" ");
}

