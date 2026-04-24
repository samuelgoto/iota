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

### Length 3

Found 2 candidates.

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
