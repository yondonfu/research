# Vitalik On zkSNARKs

Computation -> Algebraic Circuit -> R1CS -> QAP -> Linear PCP -> Linear Interactive Proof -> zkSNARK

## Computation -> Algebraic Circuit

Flatten code into a sequence of statements of the forms:
- `x = y`
- `x = y (op) z`

This is analagous to creating an arithmetic circuit with logic gates for each op.

## Arithmetic Circuit -> R1CS

Rank-1 Constraint System (R1CS):
- Sequence of groups of 3 vectors `(a, b, c)`
- Solution is the vector `s` s.t. `s . a * s . b - s . c = 0`

One constraint per logic gate.

Vector length = # of variables in system
- Dummy variable `~one` at index 1 with value 1
- Input variables
- Dummy variable `~out` for output
- Intermediate variables

Vector slots only have values when the variables corresponding those slots are involved in a logic gate.

`s` contains assignments for all variables. This is also the witness.

## R1CS -> QAP
