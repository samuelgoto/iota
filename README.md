# One-Point Basis Search

This repo currently has two related searches:

```text
Iota-style
```

Search for unary rules like `U x -> body`, where the body may mention `S` and
`K`.

```text
J-style
```

Search for one-symbol head-pattern systems where certain `J`-only heads behave
like `S` and `K`, without using `S` or `K` as primitive symbols.

## J-Style Search

The J-style search is deliberately separate from the Iota-style search. It does
not use `S` or `K` inside the primitive definition. Instead, it searches for
`J`-only expression heads that can be assigned the behavior of `S` and `K`:

```text
SHead a b c -> a c (b c)
KHead a b   -> a
```

where `SHead` and `KHead` are non-overlapping expression heads built only from
`J`. This is not yet a search over every possible one-symbol rewrite system; it
is a search over direct SK embeddings, where two `J`-only head patterns behave
like the SK basis.

The size metric is total head size:

```text
size(SHead) + size(KHead)
```

where size counts `J` leaves. For example:

```text
J             size 1
J J           size 2
J (J J)       size 3
(J J) J       size 3
```

The classic system is:

```text
SHead = J J
KHead = J (J J)
```

which gives:

```text
J J a b c       -> a c (b c)
J (J J) a b     -> a
```

Run it with:

```sh
npm run j-search -- --max-head-size 3
npm run j-search -- --max-head-size 4 --limit 20
npm run j-search -- --max-head-size 5 --limit 5
```

Current results:

```text
max head size 3 -> 4 systems
max head size 4 -> 46 systems
max head size 5 -> 424 systems
```

With non-overlapping heads, the shortest systems found have total head size 5.
The first two are:

```text
SHead = J (J J)   size 3
KHead = J J       size 2
total = 5
```

and:

```text
SHead = J J       size 2
KHead = J (J J)   size 3
total = 5
```

The second one is the classic `j` presentation.

### What "Overlapping Heads" Means

Two heads overlap when one can match the beginning of the other. For example:

```text
J
J J
```

overlap because any term beginning with `J J ...` also begins with `J ...`.

If you run:

```sh
npm run j-search -- --max-head-size 2 --allow-overlap
```

the program finds a smaller order-dependent system:

```text
SHead = J J
KHead = J
total = 3
```

This system only works if the evaluator gives the `SHead = J J` rule priority
over the `KHead = J` rule. The ambiguity shows up on this term:

```text
J J a b c
```

If the `SHead = J J` rule fires first:

```text
J J a b c -> a c (b c)
```

If the `KHead = J` rule fires first:

```text
J J a b c -> J b c -> b
```

Those are different results. The default search rejects this kind of system
because it is not a clean set of independent head patterns; its meaning depends
on rule priority.

## General J-Like Rewrite-System Search

The direct J-style search above still hard-codes the two rule bodies:

```text
a c (b c)
a
```

The more general search tries to find systems that are "like `j`, but not
necessarily `j`." It enumerates two-rule systems of this form:

```text
Head v0 v1 ... -> Body
Head v0 v1 ... -> Body
```

where:

```text
Head
```

is built only from `J`.

```text
Body
```

is built only from the rule arguments `v0`, `v1`, ...

The search then looks for `J`-only witnesses that behave like `S` and `K`.
This means a system can be found even if neither rule is directly an `S` rule
or directly a `K` rule.

Run it with:

```sh
npm run general-j-search -- --max-head-size 3 --max-arity 3 --max-body-leaves 4 --max-witness-size 5 --max-full-size 14
npm run general-j-search -- --max-head-size 3 --max-arity 3 --max-body-leaves 4 --max-witness-size 5 --max-full-size 15
npm run general-j-search -- --max-head-size 3 --max-arity 3 --max-body-leaves 4 --max-witness-size 5 --max-full-size 16 --limit 20
```

The main size metric is:

```text
full size = head leaves + arity + body leaves
```

For the classic `j` system:

```text
J J v0 v1 v2       -> v0 v2 (v1 v2)
J (J J) v0 v1      -> v0
```

the full size is:

```text
(2 + 3 + 4) + (3 + 2 + 1) = 15
```

Current bounded results:

```text
full size <= 14 -> 0 systems
full size <= 15 -> 2 systems
full size <= 16 -> 6 systems
```

So, under this two-rule, non-overlapping-head, variable-only-body search,
nothing smaller than the classic `j` system was found. At exactly size 15, the
only systems found are the classic system and the S/K-swapped version:

```text
J J v0 v1 -> v0
J (J J) v0 v1 v2 -> v0 v2 (v1 v2)

S witness: J (J J)
K witness: J J
```

```text
J (J J) v0 v1 -> v0
J J v0 v1 v2 -> v0 v2 (v1 v2)

S witness: J J
K witness: J (J J)
```

At size 16, genuinely different-looking variants begin to appear. For example:

```text
J (J J) v0 v1 v2 -> v1
J J v0 v1 v2 -> v0 v2 (v1 v2)

S witness: J J
K witness: J (J J) J
```

and:

```text
J J v0 v1 v2 -> v1
J (J J) v0 v1 v2 -> v0 v2 (v1 v2)

S witness: J (J J)
K witness: J J J
```

These are still very close to `j`: they keep one S-like rule and replace the
K-like rule with a projection that needs one extra dummy argument. But they are
not exactly the classic `j` presentation.

## Iota-Style Search

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

## Names And References

The names in this repo are conservative:

```text
U x -> ((x S) K)
```

This is the usual universal Iota combinator. See
[Iota and Jot](https://en.wikipedia.org/wiki/Iota_and_Jot) and
[Esolang: Iota](https://esolangs.org/wiki/Iota).

```text
U x -> ((x K) S)
```

This is a documented simple alternative one-point basis; see Johannes Bader's
[One-point bases for lambda-calculus](https://olydis.medium.com/one-point-bases-for-%CE%BB-calculus-4163b1b326ad).
In the "Similar alternatives" section, Bader lists this exact left-associated
shape as `X = lambda x -> x "K" "S"` and gives the witnesses `S = X X X` and
`K = X (S X X)`.
This repo calls it "Rho-style" only as a local nickname. I have not found a
standard source that names this basis `rho`.

```text
U x -> (((x K) S) K)
```

This is the known `X' = lambda x. x K S K` one-point basis. See the
[one-point basis section of Combinatory logic](https://en.wikipedia.org/wiki/Combinatory_logic#One-point_basis).
John Tromp's
[Bases.lhs](https://github.com/tromp/AIT/blob/master/Bases.lhs)
also lists this shape as `<K,S,K>`.

The other length-4 candidates below are valid under this repo's bounded search,
but I have not found standard names or canonical references for them. They are
best treated as generated SK-packaging variants unless a better source is found.

## Commands

```sh
npm test
npm run search -- --length 1
npm run search -- --length 3 --max-expression-size 8 --max-reduction-steps 100 --max-term-size 1000
npm run search -- --length 3 --max-expression-size 10 --max-reduction-steps 100 --max-term-size 1000
npm run search -- --length 3 --tokens x,S,K,I --max-expression-size 9 --max-reduction-steps 100 --max-term-size 1000
npm run search -- --length 3 --left-associated-only --max-expression-size 10
```

Useful search knobs:

```text
--max-expression-size N
```

Raises the largest `U`-only witness expression considered for `S` and `K`.
This is the main relaxation if a real basis needs larger witnesses.

```text
--max-reduction-steps N
--max-term-size N
```

Raises evaluator limits. These are safety bounds; some bad candidates expand
very quickly.

```text
--tokens x,S,K,I
```

Relaxes the rule-body alphabet. The default is `x,S,K`. Adding `I` treats
identity as a primitive shorthand, so it changes the size metric.

```text
--left-associated-only
```

Restricts bodies to the original `x A B ...` shape. This is not a relaxation,
but it is useful for comparing directly with Iota-style definitions.

## Known Small Results With Current Bounds

Length 1:

```text
none
```

Length 2:

```text
none
```

### Length 3

Found 2 candidates.

This has been checked in a few nearby regimes:

```text
tokens x,S,K; all binary trees; max witness size 10 -> 2 candidates
tokens x,S,K,I; all binary trees; max witness size 9 -> 2 candidates
tokens x,S,K; left-associated only; max witness size 10 -> 2 candidates
```

So, with the current notion of "length 3", the search still only finds the two
expected candidates. This is not a proof that no candidate exists with a much
larger witness, but it does suggest the scarcity is not just caused by the
initial `--max-expression-size 8` bound.

#### 1. `U x -> ((x S) K)`

This is Iota-style:

```text
S = U (U (U (U U)))
K = U (U (U U))
```

S witness reduction:

```text
   U (U (U (U U)))
-> U (U (U U)) S K
-> U (U U) S K S K
-> U U S K S K S K
-> U S K S K S K S K
-> S S K K S K S K S K
-> S K (K K) S K S K S K
-> K S ((K K) S) K S K S K
-> S K S K S K
-> K K (S K) S K
-> K S K
-> S
```

K witness reduction:

```text
   U (U (U U))
-> U (U U) S K
-> U U S K S K
-> U S K S K S K
-> S S K K S K S K
-> S K (K K) S K S K
-> K S ((K K) S) K S K
-> S K S K
-> K K (S K)
-> K
```

#### 2. `U x -> ((x K) S)`

This is Rho-style in this repo's local terminology. It is a known simple
alternative one-point basis, but I have not found `rho` as a standard name for
it. The reference above lists the same rule as `X = lambda x -> x "K" "S"`.

```text
S = U U U
K = U ((((U U) U) U) U)
```

S witness reduction:

```text
   U U U
-> U K S U
-> K K S S U
-> K S U
-> S
```

K witness reduction:

```text
   U ((((U U) U) U) U)
-> U U U U U K S
-> U K S U U U K S
-> K K S S U U U K S
-> K S U U U K S
-> S U U K S
-> U K (U K) S
-> K K S (U K) S
-> K (U K) S
-> U K
-> K K S
-> K
```

### Length 4

Found 10 candidates.

#### 1. `U x -> (K ((x S) K))`

```text
S = U ((U (U (U U))) U) U
K = U (U (U U)) U
```

S witness reduction:

```text
   U ((U (U (U U))) U) U
-> K ((((U (U (U U))) U) S) K) U
-> U (U (U U)) U S K
-> K (((U (U U)) S) K) U S K
-> U (U U) S K S K
-> K (((U U) S) K) S K S K
-> U U S K K S K
-> K ((U S) K) S K K S K
-> U S K K K S K
-> K ((S S) K) K K K S K
-> S S K K K S K
-> S K (K K) K S K
-> K K ((K K) K) S K
-> K S K
-> S
```

K witness reduction:

```text
   U (U (U U)) U
-> K (((U (U U)) S) K) U
-> U (U U) S K
-> K (((U U) S) K) S K
-> U U S K K
-> K ((U S) K) S K K
-> U S K K K
-> K ((S S) K) K K K
-> S S K K K
-> S K (K K) K
-> K K ((K K) K)
-> K
```

#### 2. `U x -> (K ((x K) S))`

```text
S = U (U (U U)) U
K = U U U
```

S witness reduction:

```text
   U (U (U U)) U
-> K (((U (U U)) K) S) U
-> U (U U) K S
-> K (((U U) K) S) K S
-> U U K S S
-> K ((U K) S) K S S
-> U K S S S
-> K ((K K) S) S S S
-> K K S S S
-> K S S
-> S
```

K witness reduction:

```text
   U U U
-> K ((U K) S) U
-> U K S
-> K ((K K) S) S
-> K K S
-> K
```

#### 3. `U x -> ((x S) (K K))`

```text
S = U (U U) U
K = U (U (((U U) U) U))
```

S witness reduction:

```text
   U (U U) U
-> U U S (K K) U
-> U S (K K) S (K K) U
-> S S (K K) (K K) S (K K) U
-> S (K K) ((K K) (K K)) S (K K) U
-> K K S (((K K) (K K)) S) (K K) U
-> K (((K K) (K K)) S) (K K) U
-> K K (K K) S U
-> K S U
-> S
```

K witness reduction:

```text
   U (U (((U U) U) U))
-> U (((U U) U) U) S (K K)
-> U U U U S (K K) S (K K)
-> U S (K K) U U S (K K) S (K K)
-> S S (K K) (K K) U U S (K K) S (K K)
-> S (K K) ((K K) (K K)) U U S (K K) S (K K)
-> K K U (((K K) (K K)) U) U S (K K) S (K K)
-> K (((K K) (K K)) U) U S (K K) S (K K)
-> K K (K K) U S (K K) S (K K)
-> K U S (K K) S (K K)
-> U (K K) S (K K)
-> K K S (K K) S (K K)
-> K (K K) S (K K)
-> K K (K K)
-> K
```

#### 4. `U x -> ((x K) (x S))`

```text
S = U (U (U U)) U
K = U ((((U (U (U U))) U) U) U)
```

S witness reduction:

```text
   U (U (U U)) U
-> U (U U) K ((U (U U)) S) U
-> U U K ((U U) S) K ((U (U U)) S) U
-> U K (U S) K ((U U) S) K ((U (U U)) S) U
-> K K (K S) (U S) K ((U U) S) K ((U (U U)) S) U
-> K (U S) K ((U U) S) K ((U (U U)) S) U
-> U S ((U U) S) K ((U (U U)) S) U
-> S K (S S) ((U U) S) K ((U (U U)) S) U
-> K ((U U) S) ((S S) ((U U) S)) K ((U (U U)) S) U
-> U U S K ((U (U U)) S) U
-> U K (U S) S K ((U (U U)) S) U
-> K K (K S) (U S) S K ((U (U U)) S) U
-> K (U S) S K ((U (U U)) S) U
-> U S K ((U (U U)) S) U
-> S K (S S) K ((U (U U)) S) U
-> K K ((S S) K) ((U (U U)) S) U
-> K ((U (U U)) S) U
-> U (U U) S
-> U U K ((U U) S) S
-> U K (U S) K ((U U) S) S
-> K K (K S) (U S) K ((U U) S) S
-> K (U S) K ((U U) S) S
-> U S ((U U) S) S
-> S K (S S) ((U U) S) S
-> K ((U U) S) ((S S) ((U U) S)) S
-> U U S S
-> U K (U S) S S
-> K K (K S) (U S) S S
-> K (U S) S S
-> U S S
-> S K (S S) S
-> K S ((S S) S)
-> S
```

K witness reduction:

```text
   U ((((U (U (U U))) U) U) U)
-> U (U (U U)) U U U K (((((U (U (U U))) U) U) U) S)
-> U (U U) K ((U (U U)) S) U U U K (((((U (U (U U))) U) U) U) S)
-> U U K ((U U) S) K ((U (U U)) S) U U U K (((((U (U (U U))) U) U) U) S)
-> U K (U S) K ((U U) S) K ((U (U U)) S) U U U K (((((U (U (U U))) U) U) U) S)
-> K K (K S) (U S) K ((U U) S) K ((U (U U)) S) U U U K (((((U (U (U U))) U) U) U) S)
-> K (U S) K ((U U) S) K ((U (U U)) S) U U U K (((((U (U (U U))) U) U) U) S)
-> U S ((U U) S) K ((U (U U)) S) U U U K (((((U (U (U U))) U) U) U) S)
-> S K (S S) ((U U) S) K ((U (U U)) S) U U U K (((((U (U (U U))) U) U) U) S)
-> K ((U U) S) ((S S) ((U U) S)) K ((U (U U)) S) U U U K (((((U (U (U U))) U) U) U) S)
-> U U S K ((U (U U)) S) U U U K (((((U (U (U U))) U) U) U) S)
-> U K (U S) S K ((U (U U)) S) U U U K (((((U (U (U U))) U) U) U) S)
-> K K (K S) (U S) S K ((U (U U)) S) U U U K (((((U (U (U U))) U) U) U) S)
-> K (U S) S K ((U (U U)) S) U U U K (((((U (U (U U))) U) U) U) S)
-> U S K ((U (U U)) S) U U U K (((((U (U (U U))) U) U) U) S)
-> S K (S S) K ((U (U U)) S) U U U K (((((U (U (U U))) U) U) U) S)
-> K K ((S S) K) ((U (U U)) S) U U U K (((((U (U (U U))) U) U) U) S)
-> K ((U (U U)) S) U U U K (((((U (U (U U))) U) U) U) S)
-> U (U U) S U U K (((((U (U (U U))) U) U) U) S)
-> U U K ((U U) S) S U U K (((((U (U (U U))) U) U) U) S)
-> U K (U S) K ((U U) S) S U U K (((((U (U (U U))) U) U) U) S)
-> K K (K S) (U S) K ((U U) S) S U U K (((((U (U (U U))) U) U) U) S)
-> K (U S) K ((U U) S) S U U K (((((U (U (U U))) U) U) U) S)
-> U S ((U U) S) S U U K (((((U (U (U U))) U) U) U) S)
-> S K (S S) ((U U) S) S U U K (((((U (U (U U))) U) U) U) S)
-> K ((U U) S) ((S S) ((U U) S)) S U U K (((((U (U (U U))) U) U) U) S)
-> U U S S U U K (((((U (U (U U))) U) U) U) S)
-> U K (U S) S S U U K (((((U (U (U U))) U) U) U) S)
-> K K (K S) (U S) S S U U K (((((U (U (U U))) U) U) U) S)
-> K (U S) S S U U K (((((U (U (U U))) U) U) U) S)
-> U S S U U K (((((U (U (U U))) U) U) U) S)
-> S K (S S) S U U K (((((U (U (U U))) U) U) U) S)
-> K S ((S S) S) U U K (((((U (U (U U))) U) U) U) S)
-> S U U K (((((U (U (U U))) U) U) U) S)
-> U K (U K) (((((U (U (U U))) U) U) U) S)
-> K K (K S) (U K) (((((U (U (U U))) U) U) U) S)
-> K (U K) (((((U (U (U U))) U) U) U) S)
-> U K
-> K K (K S)
-> K
```

#### 5. `U x -> ((x K) (K S))`

```text
S = U (U U)
K = U (((U (U U)) U) U)
```

S witness reduction:

```text
   U (U U)
-> U U K (K S)
-> U K (K S) K (K S)
-> K K (K S) (K S) K (K S)
-> K (K S) K (K S)
-> K S (K S)
-> S
```

K witness reduction:

```text
   U (((U (U U)) U) U)
-> U (U U) U U K (K S)
-> U U K (K S) U U K (K S)
-> U K (K S) K (K S) U U K (K S)
-> K K (K S) (K S) K (K S) U U K (K S)
-> K (K S) K (K S) U U K (K S)
-> K S (K S) U U K (K S)
-> S U U K (K S)
-> U K (U K) (K S)
-> K K (K S) (U K) (K S)
-> K (U K) (K S)
-> U K
-> K K (K S)
-> K
```

#### 6. `U x -> ((x (K S)) K)`

```text
S = U (U U)
K = U (((U (U U)) U) U)
```

S witness reduction:

```text
   U (U U)
-> U U (K S) K
-> U (K S) K (K S) K
-> K S (K S) K K (K S) K
-> S K K (K S) K
-> K (K S) (K (K S)) K
-> K S K
-> S
```

K witness reduction:

```text
   U (((U (U U)) U) U)
-> U (U U) U U (K S) K
-> U U (K S) K U U (K S) K
-> U (K S) K (K S) K U U (K S) K
-> K S (K S) K K (K S) K U U (K S) K
-> S K K (K S) K U U (K S) K
-> K (K S) (K (K S)) K U U (K S) K
-> K S K U U (K S) K
-> S U U (K S) K
-> U (K S) (U (K S)) K
-> K S (K S) K (U (K S)) K
-> S K (U (K S)) K
-> K K ((U (K S)) K)
-> K
```

#### 7. `U x -> ((x (K K)) S)`

```text
S = U U
K = U (U (U ((U U) U)))
```

S witness reduction:

```text
   U U
-> U (K K) S
-> K K (K K) S S
-> K S S
-> S
```

K witness reduction:

```text
   U (U (U ((U U) U)))
-> U (U ((U U) U)) (K K) S
-> U ((U U) U) (K K) S (K K) S
-> U U U (K K) S (K K) S (K K) S
-> U (K K) S U (K K) S (K K) S (K K) S
-> K K (K K) S S U (K K) S (K K) S (K K) S
-> K S S U (K K) S (K K) S (K K) S
-> S U (K K) S (K K) S (K K) S
-> U S ((K K) S) (K K) S (K K) S
-> S (K K) S ((K K) S) (K K) S (K K) S
-> K K ((K K) S) (S ((K K) S)) (K K) S (K K) S
-> K (S ((K K) S)) (K K) S (K K) S
-> S ((K K) S) S (K K) S
-> K K S (K K) (S (K K)) S
-> K (K K) (S (K K)) S
-> K K S
-> K
```

#### 8. `U x -> (((x K) S) S)`

```text
S = U (U (U (((U U) U) (U U))))
K = U (U ((U (U U)) (U U)))
```

S witness reduction:

```text
   U (U (U (((U U) U) (U U))))
-> U (U (((U U) U) (U U))) K S S
-> U (((U U) U) (U U)) K S S K S S
-> U U U (U U) K S S K S S K S S
-> U K S S U (U U) K S S K S S K S S
-> K K S S S S U (U U) K S S K S S K S S
-> K S S S U (U U) K S S K S S K S S
-> S S U (U U) K S S K S S K S S
-> S (U U) (U (U U)) K S S K S S K S S
-> U U K ((U (U U)) K) S S K S S K S S
-> U K S S K ((U (U U)) K) S S K S S K S S
-> K K S S S S K ((U (U U)) K) S S K S S K S S
-> K S S S K ((U (U U)) K) S S K S S K S S
-> S S K ((U (U U)) K) S S K S S K S S
-> S ((U (U U)) K) (K ((U (U U)) K)) S S K S S K S S
-> U (U U) K S ((K ((U (U U)) K)) S) S K S S K S S
-> U U K S S K S ((K ((U (U U)) K)) S) S K S S K S S
-> U K S S K S S K S ((K ((U (U U)) K)) S) S K S S K S S
-> K K S S S S K S S K S ((K ((U (U U)) K)) S) S K S S K S S
-> K S S S K S S K S ((K ((U (U U)) K)) S) S K S S K S S
-> S S K S S K S ((K ((U (U U)) K)) S) S K S S K S S
-> S S (K S) S K S ((K ((U (U U)) K)) S) S K S S K S S
-> S S ((K S) S) K S ((K ((U (U U)) K)) S) S K S S K S S
-> S K (((K S) S) K) S ((K ((U (U U)) K)) S) S K S S K S S
-> K S ((((K S) S) K) S) ((K ((U (U U)) K)) S) S K S S K S S
-> S ((K ((U (U U)) K)) S) S K S S K S S
-> K ((U (U U)) K) S K (S K) S S K S S
-> U (U U) K K (S K) S S K S S
-> U U K S S K K (S K) S S K S S
-> U K S S K S S K K (S K) S S K S S
-> K K S S S S K S S K K (S K) S S K S S
-> K S S S K S S K K (S K) S S K S S
-> S S K S S K K (S K) S S K S S
-> S S (K S) S K K (S K) S S K S S
-> S S ((K S) S) K K (S K) S S K S S
-> S K (((K S) S) K) K (S K) S S K S S
-> K K ((((K S) S) K) K) (S K) S S K S S
-> K (S K) S S K S S
-> S K S K S S
-> K K (S K) S S
-> K S S
-> S
```

K witness reduction:

```text
   U (U ((U (U U)) (U U)))
-> U ((U (U U)) (U U)) K S S
-> U (U U) (U U) K S S K S S
-> U U K S S (U U) K S S K S S
-> U K S S K S S (U U) K S S K S S
-> K K S S S S K S S (U U) K S S K S S
-> K S S S K S S (U U) K S S K S S
-> S S K S S (U U) K S S K S S
-> S S (K S) S (U U) K S S K S S
-> S S ((K S) S) (U U) K S S K S S
-> S (U U) (((K S) S) (U U)) K S S K S S
-> U U K ((((K S) S) (U U)) K) S S K S S
-> U K S S K ((((K S) S) (U U)) K) S S K S S
-> K K S S S S K ((((K S) S) (U U)) K) S S K S S
-> K S S S K ((((K S) S) (U U)) K) S S K S S
-> S S K ((((K S) S) (U U)) K) S S K S S
-> S ((((K S) S) (U U)) K) (K ((((K S) S) (U U)) K)) S S K S S
-> K S S (U U) K S ((K ((((K S) S) (U U)) K)) S) S K S S
-> S (U U) K S ((K ((((K S) S) (U U)) K)) S) S K S S
-> U U S (K S) ((K ((((K S) S) (U U)) K)) S) S K S S
-> U K S S S (K S) ((K ((((K S) S) (U U)) K)) S) S K S S
-> K K S S S S S (K S) ((K ((((K S) S) (U U)) K)) S) S K S S
-> K S S S S (K S) ((K ((((K S) S) (U U)) K)) S) S K S S
-> S S S (K S) ((K ((((K S) S) (U U)) K)) S) S K S S
-> S (K S) (S (K S)) ((K ((((K S) S) (U U)) K)) S) S K S S
-> K S ((K ((((K S) S) (U U)) K)) S) ((S (K S)) ((K ((((K S) S) (U U)) K)) S)) S K S S
-> S ((S (K S)) ((K ((((K S) S) (U U)) K)) S)) S K S S
-> S (K S) ((K ((((K S) S) (U U)) K)) S) K (S K) S S
-> K S K (((K ((((K S) S) (U U)) K)) S) K) (S K) S S
-> S (((K ((((K S) S) (U U)) K)) S) K) (S K) S S
-> K ((((K S) S) (U U)) K) S K S ((S K) S) S
-> K S S (U U) K K S ((S K) S) S
-> S (U U) K K S ((S K) S) S
-> U U K (K K) S ((S K) S) S
-> U K S S K (K K) S ((S K) S) S
-> K K S S S S K (K K) S ((S K) S) S
-> K S S S K (K K) S ((S K) S) S
-> S S K (K K) S ((S K) S) S
-> S (K K) (K (K K)) S ((S K) S) S
-> K K S ((K (K K)) S) ((S K) S) S
-> K ((K (K K)) S) ((S K) S) S
-> K (K K) S S
-> K K S
-> K
```

#### 9. `U x -> (((x K) S) K)`

This is the known `X' = lambda x. x K S K` basis. This repo also calls it
Chi-style as a local nickname.

```text
S = U (U U)
K = U U U
```

S witness reduction:

```text
   U (U U)
-> U U K S K
-> U K S K K S K
-> K K S K S K K S K
-> K K S K K S K
-> K K K S K
-> K S K
-> S
```

K witness reduction:

```text
   U U U
-> U K S K U
-> K K S K S K U
-> K K S K U
-> K K U
-> K
```

#### 10. `U x -> (((x K) K) S)`

```text
S = U (U U)
K = U (U (U ((U U) U)))
```

S witness reduction:

```text
   U (U U)
-> U U K K S
-> U K K S K K S
-> K K K S K S K K S
-> K S K S K K S
-> S S K K S
-> S K (K K) S
-> K S ((K K) S)
-> S
```

K witness reduction:

```text
   U (U (U ((U U) U)))
-> U (U ((U U) U)) K K S
-> U ((U U) U) K K S K K S
-> U U U K K S K K S K K S
-> U K K S U K K S K K S K K S
-> K K K S K S U K K S K K S K K S
-> K S K S U K K S K K S K K S
-> S S U K K S K K S K K S
-> S K (U K) K S K K S K K S
-> K K ((U K) K) S K K S K K S
-> K S K K S K K S
-> S K S K K S
-> K K (S K) K S
-> K K S
-> K
```
