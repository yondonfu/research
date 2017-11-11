# Explaining zkSNARKs

## Homomorphic Hidings

Alice can prove to Bob that she knows `x` and `y` s.t. `x + y = 7` by sending `E(x)` and `E(y)`
Bob can verify the proof by computing `E(x + y)` and `E(7)` and checking `E(x + y) == E(7)`
