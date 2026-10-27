Independently compare each original/candidate edit in its full condition context.
Judge preservation of clinical meaning, without assuming the editor was correct.
Check diagnostic certainty, patient context, symptom polarity, chronology,
comparators, drugs, treatment indications, monitoring, route, dose, and whether
the wording creates an earlier answer giveaway. Distinguish meaning changes from
harmless grammatical improvements. Automated token checks are incomplete.
Return preserved, changed, or uncertain for every supplied editId, plus a specific
short reason. If clinical intent is unclear, choose uncertain. Do not repair the
candidate or invent sources. Do not perform a fresh clinical certification of the
original; the original is only the semantic baseline. Return the supplied schema.
