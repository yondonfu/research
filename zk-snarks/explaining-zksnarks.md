# Explaining zkSNARKs

## Homomorphic Hidings (HH)

Alice can prove to Bob that she knows `x` and `y` s.t. `x + y = 7` by sending `E(x)` and `E(y)`. Bob can verify the proof by computing `E(x + y)` and `E(7)` and checking `E(x + y) == E(7)`.

We construct HHs with finite fields.

Addition within a range `{0,1...n-1}` can be defined as `(a + b) mod n`. `{0,1...n-1}` is the field `Z_n`.

Multiplication within a range `{0,1...n-1}` can be defined as `(a * b) mod p` s.t. `p` is prime.
- `p` must be prime or else the result could be 0 even if both factors are not i.e. if `p = 4` then `2 * 2 = 0 (mod 4 )`
- Some useful properties
- Cyclic: there is an element `g` (the generator) in the field s.t. any element in the field can be expressed as `g^a` for some `a` in `{0,1...p-2}` and `g^0 = 1`
- Discrete logarithm hardness: given a large `p` and an element `h` in the field, finding integer `a` in `{0,1...p-2}` s.t. `g^a = h (mod p)` is hard
- Exponent multiplication: given `a` and `b` in `{0,1...p-2}`, `g^a * g^b = g^(a+b) (mod p-1)`

We can construct the HH that Alice and Bob use using the properties of finite field multiplication.
- Let `E(x) = g^x` for all `x` s.t. `x` is in a finite field 
- By the cyclic property, each unique `x` maps to a unique output
- By the discrete logarithm hardness property, given `E(x) = g^x` it is hard to find `x`
- By the exponent multiplication property, given `E(x)` and `E(y)`, `E(x + y) = g^(x+y) = g^x * g^y= E(x) + E(y)`

## Blind Evaluation of Polynomials

Alice can prove to Bob that she knows a polynomial `P`. Bob knows a random point `s` and sends Alice `E(1),E(2)...E(s^d)`. Alice uses the hidings to compute `E(P(s))` and sends it to Bob. At the end, Bob learns `E(P(s))` which proves Alice knows `P` without `Bob` knowing `P` and `Alice` never learns `s`.

Let `s` be from a prime field. `P(s)` is a linear combination of `1,s...s^d` and their coefficients. The previously constructed HH `E` supports linear combinations since we can compute `E(ax + by)` with `E(x)` and `E(y)`.
- `E(ax + by) = g^(ax) * g^(by) = (g^x)^a & (g^y)^b = E(x)^a * E(y)*b`

In general terms, Bob is a verifier that wants to check if Alice, the solver, knows it. The Schwartz-Zippel Lemma states that different polynomials differ at most points. Since the solver is evaluating the polynomial at an unknown random point, if it does not know the polynomial it will likely give a wrong answer.

## Knowledge of Coefficient Test and Assumption

Alice doesn't have to send `E(P(s))` to Bob.
