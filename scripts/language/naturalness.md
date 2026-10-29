Compare text A and text B for each supplied editId using the Vietnamese medical
style guide and full condition context. Their order is deliberately blinded.
Choose A, B, tie, or uncertain. Prefer natural, concise medical Vietnamese for
clinical-year students. Do not reward extra detail, verbosity, simplified medical
terms, or the fact a sentence is different. A valid technical term is not by itself
an error. Reject improvements that rely on a guessed clinical intention. Return
one short reason per pair and the supplied schema. Do not infer which version is
the original and do not refer to an editor's justification.

Independently rate ALL clauses of A and B using qualityA and qualityB:
natural (ready as written), needs_revision (still awkward/incomplete), or uncertain
(cannot judge without clarifying intent). The less awkward version can win a
preference while BOTH need_revision. Do not equate preference with readiness.
Check noun/verb combinations, lists, sentence structure, idiomatic Vietnamese,
and unexplained literal phrases throughout the entire field. Do not excuse a
bad clause because a different clause improved. Do not certify medical truth.
