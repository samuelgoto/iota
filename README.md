# Iota-Style One-Point Basis Search

This searches for one-combinator bases of the form:

```text
U x -> body
```

where `body` is an SK expression whose leaves are drawn from:

```text
x, S, K
```

The search treats "body length" as the number of leaves and includes every
binary parenthesization. For example, length 3 includes both:

```text
((x S) K)
(x (S K))
```

A candidate is reported only when the search finds concrete `U`-only
expressions that behave like `S` and `K` on fresh symbolic arguments:

```text
S a b c -> a c (b c)
K a b   -> a
```

This is a bounded proof search, not a complete decision procedure for all
possible candidates. Increasing the expression-size, reduction-step, and
intermediate-term-size limits can find more witnesses, but may also get slower.

## Commands

```sh
npm test
npm run search -- --length 1
npm run search -- --length 3 --max-expression-size 8 --max-reduction-steps 100 --max-term-size 1000
```

## Known Small Results With Current Bounds

Length 1:

```text
none
```

Length 2:

```text
none
```

Length 3:

```text
U x -> ((x S) K)
U x -> ((x K) S)
```

These correspond to Iota and Rho-style definitions.

Length 4 finds 10 candidates with the default bounded search settings used in
the tests/manual run. One of them is Chi:

```text
U x -> (((x K) S) K)
```
