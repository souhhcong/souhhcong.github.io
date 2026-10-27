# Vietnamese medical language workflow

This tool edits Vietnamese for clinical-year medical students. It separates language review from medical source review and condition difficulty. It never writes the three playable banks or the existing `.internal/medical-review.json` ledger. Outputs, source snapshots and model responses stay under Git-ignored `.internal/vietnamese-copyedit/`; the preview server does not serve that directory.

Vietnamese is the provisional CLI prompt default; it has not been demonstrated superior. Set `--language=en` to use the baseline English instructions.

## Existing conditions

1. Supply the complete condition, including all six clinical clues, six treatment clues and explanations. Luna proposes at most three field edits per condition and may abstain. English and Vietnamese prompts share a versioned style guide.
2. Deterministic checks reject changed quantities, units, comparisons, polarity counts, listed drugs, uncertainty markers, acronyms and identity terms. These checks are deliberately conservative and do not establish semantic equivalence.
3. A separate Terra review compares meaning against the original. Two separate Terra naturalness reviews compare masked A/B variants with reversed order. Editor reasons and prompt language labels are hidden from the naturalness reviewers. They receive the original full clinical context, which can reveal the original wording; this is not perfect blinding.
4. Only preserved edits preferred in both orientations pass. Ties, uncertainty, meaning changes, guard failures or editor ambiguity notes retain the entire original condition. Real bank validators check the combined candidate bank, aliases, categories, six clues, ICD format and treatment answer giveaways. Copyediting also rejects newly introduced explicit answers in clinical titles/clues, while preserving pre-existing wording.
5. Stage a complete candidate bank, machine-readable decisions, before/after diff and remaining contextual language flags. A flag is a review hint, not an error or an automatic replacement. A condition with no proposed edits has not been certified fluent.

### Native subagent handoff (no API key)

Run from the repository root. Each command prints its artifact path. Replace `PLAN`, `OUTPUT`, `EDITOR`, etc. with those paths; `EDITOR` and the review arguments refer to **cache reports**, not raw outputs.

```sh
deno task copyedit plan --ids=31,44,116,145,391 --language=vi --run=pilot-v1
```

Give the printed plan to a Luna subagent in a fresh context, using `plan.model` and `plan.reasoning`. Ask it to follow `instructions`, `styleGuide`, full `conditions` and strict `schema`, and save only the structured output. Then:

```sh
deno task copyedit ingest --plan=PLAN --input=OUTPUT
deno task copyedit review --editor=EDITOR --phase=meaning
deno task copyedit review --editor=EDITOR --phase=naturalness
deno task copyedit review --editor=EDITOR --phase=naturalness --reverse=true
```

Give each review plan to a separate Terra subagent in a fresh context. Do not show editors' outputs, other reviews or comparison answer keys. Ingest each returned output with the same `ingest` command, then:

```sh
deno task copyedit stage --editor=EDITOR --meaning=MEANING --naturalness=FORWARD --reverse=REVERSE --run=pilot-v1
```

Batch plans support 1–20 conditions. Smaller batches may improve attention; the pilot used 20, while the API runner uses one condition per editor call. Those configurations need separate recall/cost evaluation.

### Optional unattended API runner

The transport uses the OpenAI Responses API with strict JSON schema, no response storage, no automatic retries and recorded token usage. The model IDs in `policy.json` are native agent identifiers. **API availability of those exact IDs has not been verified.** Configure API-accessible model IDs explicitly and bump the policy version before an API experiment; native agents and API models are not assumed equivalent. No live API request has been made by this implementation; transport tests use mocked responses.

Load `OPENAI_API_KEY` from your private environment. If using `~/.env`:

```sh
deno run --env-file="$HOME/.env" --allow-read \
  --allow-write=.internal/vietnamese-copyedit --allow-env=OPENAI_API_KEY \
  --allow-net=api.openai.com scripts/copyedit-cli.js run \
  --ids=31,44,116,145,391 --language=vi --run=api-pilot-v1 --limit=5 --max-calls=20
```

Otherwise use `deno task copyedit:run --ids=31 --run=api-one-v1 --limit=1 --max-calls=4`.

Each existing condition costs one editor call and, if edits are proposed, three reviewer calls. Zero-edit conditions skip model reviewers. New conditions add a fact-review call. `--max-calls` limits requests, not money; usage is recorded but monetary pricing is not guessed. Start small. No automatic full-bank run is scheduled.

Requests are serial and cached by a hash of all context, instructions, schema, policy, language, model, reasoning and run ID. Reuse the same run ID for resume. Changing the run ID deliberately creates new calls. Pending receipts are written before requests. A pending request without a completed cache stops resume: inspect its outcome before intentionally starting a new run. Previously completed decisions remain cached when a call budget is exhausted. A completed run produces one combined staged bank, rather than hundreds of full bank copies. Concurrent runs are unsupported; run one writer at a time.

## New conditions

Use source-first drafting. Copyediting does not invent or validate a medical condition from its name alone.

```sh
deno task copyedit template --id=401
```

The private intake template has the exact existing bank fields. Fill every required field, provide six clues for each game type, choose existing category IDs from `revision-data.json`, and supply unique Vietnamese/English aliases and ICD code. `hardness: 3` is only a provisional administrative value; the copyeditor does not see or determine it. Difficulty calibration remains a separate workflow.

The envelope is `{ "version": 1, "condition": { "caseId", "clinical", "revision", "hardness", "kind": "new" }, "evidence": [...] }`. `clinical` uses the exact CSV headers; revision and hardness use the current bank item schemas. Empty template fields intentionally fail intake validation.

Every source receipt requires `id`, `title`, `url`, `locator`, `capturedAt`, `snapshotText`, `snapshotSha256`, `excerpt`, and `fields`. `fields` lists the exact clinical/revision paths supported by that excerpt; see `FACT_FIELDS` in `vietnamese-copyedit.js`. The full source snapshot is private. Its SHA-256 must match, and the exact excerpt must occur in it. For retrieved text/HTML/JSON:

```sh
deno run --allow-read --allow-write=.internal/vietnamese-copyedit \
  --allow-net=SOURCE_HOST scripts/copyedit-cli.js capture \
  --url=https://SOURCE_HOST/document --id=source-1 --title=TITLE --locator=SECTION \
  --fields=clinical.summary,revision.treatmentExplanation --excerpt-file=EXCERPT_FILE
```

Use the printed receipt in the draft's `evidence` array. For PDF, preserve the original document, use a trusted text extractor, and provide an equivalent receipt with a page locator. Do not fabricate a snapshot or use a search snippet as complete support. Capture checks retrieval/integrity, not source authority or completeness; an author must select suitable sources and scopes. Model reviews treat sources as untrusted data, never instructions.

```sh
deno task copyedit plan --draft=.internal/vietnamese-copyedit/intake/401.json --language=vi --run=intake-401-v1
```

Follow the editor and three review handoffs above, plus:

```sh
deno task copyedit review --editor=EDITOR --phase=facts
# Give this plan to Terra, then ingest its structured output.
deno task copyedit stage --editor=EDITOR --meaning=MEANING --naturalness=FORWARD \
  --reverse=REVERSE --facts=FACTS --run=intake-401-v1
```

The facts reviewer must support **every nonempty required field**, including diagnosis, aliases, ICD labels, clinical/differential explanations and treatment, using supplied in-scope excerpts. Missing support blocks new-condition staging, including zero-edit drafts. Snapshot integrity and model agreement do not establish clinical correctness. Existing review statuses and source hashes are never copied into new records or silently refreshed.

Promotion to playable data is a separate release step: inspect the staged diff, resolve flags, perform the applicable medical/source review, record honest attribution and hashes in the existing review ledger, then run `deno task check` and `deno task check:internal`. This tool has no automatic promotion command. User proofreading can validate phrasing without implying clinical sign-off.

## Prompt experiment and calibration

Generate two editor plans with `--language=en` and `--language=vi`, identical condition IDs, Luna model and reasoning settings, using separate fresh subagents. Complete both before comparing. The shipped pilot IDs span 20 conditions across specialties, including contextual language traps; this is a convenience sample, not an unbiased accuracy estimate.

```sh
deno task copyedit proofread --english=EN_CACHE_REPORT --vietnamese=VI_CACHE_REPORT --run=en-vi-pilot
```

This writes `comparisons/en-vi-pilot/PROOFREAD.md`, editable `proofread.json` and a separate answer key. A/B/C hide original/English/Vietnamese origins. Identical variants are intentional; score ties fairly. Proofread before opening the key. Judge naturalness **and** meaning, and flag ambiguous intent rather than repairing it by guessing. The sheet covers the union of proposed fields only. Also inspect unchanged flagged fields and a random set of unchanged conditions to estimate missed problems.

Measure preserved-meaning edit precision, human preference against original, English-vs-Vietnamese wins/ties on the same fields, problematic-field recall on an independently marked sample, reviewer order disagreement, abstentions, guard failures, specialty coverage and tokens/calls per accepted edit. A second model's judgment is a screening signal, not ground truth. Repeated wording failures and agreed proofreading choices become style-guide examples and a held-out regression set. Reserve unseen conditions for final evaluation; examples shown in prompts are not held-out tests. Repeat runs and 1/5/20-condition batch comparisons are needed before choosing a default or scaling to 400+.

Run deterministic verification with `deno task check`. Policy or prompt changes invalidate cache keys; bump `policy.version` for intentional rubric/style changes. Keep old artifacts immutable so comparisons remain reproducible.
