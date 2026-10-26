# chanle

`chanle` is a Vietnamese diagnosis guessing game for medical students. It includes 400 distinct fictional conditions, each with six clinical clues and six treatment clues (2,400 clues per mode), and runs as a static site on GitHub Pages at `https://souhhcong.github.io/`.

Choose **Dữ kiện lâm sàng** to guess from a vignette or **Kế hoạch điều trị** to guess from management steps, key drugs, procedures and monitoring. Both types start with one clue and allow six guesses. An incorrect guess reveals another clue; opening a clue manually does not spend a guess. Treatment headings stay neutral until the answer is shown, and treatment explanations connect the plan to the original clinical vignette after completion.

The **Chuyên khoa** picker groups conditions into 16 overlapping specialties, including ophthalmology, ENT and psychiatry. Choosing a specialty starts focused practice in either game type, with matching autocomplete suggestions at every difficulty. A condition can belong to several relevant groups, such as respiratory medicine and paediatrics.

Daily challenges use all specialties, with a different deterministic weighted question for each game type and difficulty. Progress is saved separately for all six combinations. Today's started cases survive bank or rating changes. Existing v2/v3 progress and aggregate statistics migrate into v4 without recounting a completed disease. Each new daily game/difficulty counts once per date; replaying the same legacy pinned disease does not count twice. Game type, difficulty and practice specialty preferences are remembered.

Clinical diagnosis names are shown separately from ICD-10 category labels. Vietnamese names, common classroom synonyms, English aliases, and the case's ICD code are accepted when listed for that case; matching ignores accents, capitalization, and punctuation.

All difficulties use the same presentation and rules as the original easy mode: autocomplete suggestions, visible clinical titles, six progressive clues, six guesses, and identical accepted answers. Treatment titles remain neutral until completion. Difficulty changes which questions are drawn:

- `Dễ`: favors familiar undergraduate knowledge and common conditions.
- `Vừa`: favors intermediate familiarity.
- `Khó`: favors rarer conditions and more specialised recognition.

`case-difficulty.json` assigns every case an integer `hardness` from 1 (very familiar core knowledge) to 5 (rare or specialised knowledge). Ratings are editorial estimates of expected familiarity for Vietnamese medical students across clinical rotations, rather than measured learner performance or disease severity. Local relevance and classic teaching patterns matter: an uncommon but high-yield emergency can be easier than an obscure inherited disorder. Calibration sources and individual rationales stay internal.

Sampling weights for hardness 1–5 are `16, 8, 3, 1, 0.25` on Easy; `1, 4, 10, 4, 1` on Medium; and `0.25, 1, 3, 8, 16` on Hard. All cases remain eligible. Practice uses weighted random draws within the selected specialty, excluding the current case and a recent-history window of up to 12 cases (one quarter of a group's size, rounded down, with at least one for groups of two or more). Histories are separate by game type and specialty and retained across difficulty changes. A one-case group can repeat. This replaces the old full-bank shuffle so sustained practice retains the chosen difficulty bias.

Daily selection uses deterministic weighted exponential races seeded by local calendar date, game type, difficulty and case ID. The six new daily questions are distinct when the bank has enough cases. Existing saved questions are pinned before drawing the remaining slots. Row order and the order in which difficulties are played do not change the daily schedule. Switching practice difficulty draws a fresh weighted case; switching daily difficulty restores that slot or selects its scheduled case.

The responsive study dashboard shows a live six-step clue timeline, remaining guesses, guess history and personal accuracy. Clinical and treatment modes use distinct accent colors. New clues animate into view, and completed rounds reveal all six clues with a full-width review of the reasoning, differentials and teaching points. The review receives keyboard focus after completion. Help supports Escape, controls have visible focus styles, and animations respect reduced-motion preferences. The interface uses local SVG icons and system fonts without third-party UI packages or font requests.

## Local use

With Deno 2 installed, start the local preview:

```sh
deno task dev
```

Open `http://127.0.0.1:8000/__preview/` to select game type, specialty, case and difficulty, reset a round, and check phone or tablet widths. Case labels include the authored hardness (H1–H5). Explicit preview links bypass weighted selection so any case can be tested at any difficulty. Open `http://127.0.0.1:8000/` for the game alone. Files are read on each request, so reload after editing them. Stop the server with Ctrl-C; use `deno task dev --port=8001` if port 8000 is occupied.

On localhost only, links such as `http://127.0.0.1:8000/?case=400&game=treatment&category=psychiatry&difficulty=hard` start the chosen case as a fresh practice round. `game` is `clinical` or `treatment`; `category` uses an ID from the revision data and falls back to all specialties if it does not contain that case. These query controls are ignored on the public website.

The preview server binds to this computer's loopback address and serves an explicit list of game files. It does not expose `.internal/`, `.git/`, scripts, tests, or directory listings. Its read permissions also exclude the internal editorial folder. Opening `index.html` directly with `file://` will not reliably load the case CSV.

## Case Data

Cases live in `cases.csv`. Add or edit rows there instead of changing `app.js`.

Important columns:

- `id`, `title`, `diagnosis` (the clinical answer), `aliases` (accepted synonyms, separated by `|`)
- `icd_code`, `icd_label` (the classification category, which may be broader than the clinical answer)
- `clue1` through `clue6`
- `summary`
- `pearl1_title`, `pearl1_text`, `pearl2_title`, `pearl2_text`
- optional `differential*_name` and `differential*_note`

The app validates required fields, unique case IDs and normalized diagnoses, code format, complete explanation pairs, and conflicting accepted answers before starting. Diagnoses, aliases and ICD codes cannot belong to more than one condition; a broad category label may be shared. Code-format checks do not establish that a code is medically appropriate. Anki exports include the selected game type's six clues, explanations, differentials and teaching points. Shared scores identify game type and specialty without including the answer.

`revision-data.json` extends the clinical bank without changing its reviewed CSV rows:

- `categories`: objects with stable `id` and Vietnamese `label` values.
- `cases`: exactly one object per clinical case, containing numeric `caseId`, nonempty `categoryIds`, exactly six `treatmentClues`, and `treatmentExplanation`.

Category IDs can overlap between cases but cannot be duplicated within one case; every category must contain at least one condition. The clinical bank, revision bank and difficulty ratings are all required at startup. The difficulty file contains `version: 1` and a `cases` array of `{caseId, hardness}` records, exactly one per case. Unknown IDs, duplicates, missing or out-of-range ratings, and extra public fields are rejected. Public fields are allowlisted to reject accidental metadata additions. The extension cannot replace diagnoses or accepted answers from the clinical bank. Every treatment clue is checked for direct diagnosis, alias (including short abbreviations) and code giveaways, using the same normalization as grading and whole-word boundaries. Tests inject these failures, including accent, case and punctuation variants, to ensure validation rejects them. This detects configured answer text; it cannot establish that two differently named diseases are medically distinct or that a clue is clinically unambiguous.

Treatment content describes the fictional case and relevant eligibility conditions. It omits prescribing schedules. The six-step reveal is a game mechanic; urgent interventions may occur simultaneously. Source-check new content internally before updating its review fingerprint.

## Development checks

With Deno 2 installed, run:

```sh
deno task check
```

These checks also run on pushes and pull requests. They require no downloaded JavaScript packages.

After editing `app.js`, `styles.css` or `assets/logo.svg`, run `deno task version:assets` before checking and committing. This stamps content hashes into the HTML asset URLs so browsers load the matching release after a GitHub Pages deployment. The deployment test rejects stale versions.

Editorial references, source-check dates, unresolved questions, and any actual clinician review records belong in the local, Git-ignored `.internal/` folder. They are not loaded by the browser or included in Anki exports. Keep a private backup separately; a public clone will not contain those files. Maintainers who have the local ledger can validate its case fingerprints with:

```sh
deno task check:internal
```

The internal check requires six clinical clue review records and six treatment review records per case, with individual notes and source references. Treatment records also cover their explanation, category membership and underlying clinical case. The validator rejects incomplete coverage and stale records. Editing content requires reviewing the affected claims before updating its fingerprints. These checks track editorial work; they do not establish medical correctness or clinician approval.

The same internal check validates the separate familiarity review against every public hardness value and diagnosis, including individual rationales and calibration sources. Difficulty tests cover sampling boundaries, sustained practice distributions in both games, daily distributions across dates, category constraints, recent-case avoidance, deterministic schedules, missing-data failures and save migration.

Deploy tracked repository files only; do not upload a whole working directory containing `.internal/`.

## Condition-familiarity methodology pilot

The [condition-difficulty research design](docs/condition-difficulty.md) proposes a curriculum-first 0–100 rubric for Vietnamese Y4–Y6 students, production Luna/Terra prompts, validation gates, and an offline Deno pipeline. Run `deno task research:difficulty` to prepare the designated pilot packet when the local reference data is available. All reference candidates, source snapshots, model responses and results remain in `.internal/condition-difficulty/`; the 42 candidate labels require human review. The pilot does not modify public ratings or classify the remaining bank. See the design document for ingestion, pairwise comparison and evaluation commands.

## Internal search-frequency research

Prepare Vietnamese diagnosis and synonym queries for all 400 cases without making network requests:

```sh
deno task research:frequency
```

The plan is saved to `.internal/google-frequency-plan.json`. Each case uses one quoted OR query so overlapping synonym counts are not added together. Automatically selected terms need review; supply replacements with `--terms=.internal/search-terms.json`, an object mapping case IDs to arrays of phrases, such as `{"18":["bệnh tả","dịch tả"]}`.

For DataForSEO, complete any account verification requested in its dashboard, then copy the API login and API password from its [API Access page](https://app.dataforseo.com/api-access) into your local `~/.env` as `DATAFORSEO_LOGIN` and `DATAFORSEO_PASSWORD`. The API password differs from your account password. API error 40104 means account verification is still required. Submit one test search using the standard queue:

```sh
deno run --env-file="$HOME/.env" --allow-read --allow-write=.internal \
  --allow-env=DATAFORSEO_LOGIN,DATAFORSEO_PASSWORD --allow-net=api.dataforseo.com \
  scripts/google-frequency.js --provider=dataforseo --collect --limit=1
```

Rerun the same command after a few minutes to retrieve the saved task. Queued tasks and failed retrievals retain their IDs, so retries use GET requests instead of submitting another paid search. The first request uses the real API, not the sandbox's sample data. Records stay in `.internal/google-frequency-dataforseo-results.json`. A valid numeric `se_results_count` is required; wrong tasks, changed queries, locale mismatches, automatic spelling corrections and inconsistent zero counts are rejected. A `did_you_mean` suggestion is recorded separately and accepted only when the reported keyword and Google query URL preserve the original query, with `nfpr=1` in that URL. DataForSEO does not support a strict `lr` page-language filter, so the request uses Vietnamese names, Vietnamese interface language and Vietnam location without claiming every page is Vietnamese. Providers cannot be mixed into a ranking.

The script uses normal priority, depth 10 and one result page, with no extra result features. Requests are spaced by at least 1.25 seconds within a run. The published [base rate](https://dataforseo.com/pricing/google-serp/google-organic-serp-api) is $0.0006 per search, about $0.24 for 400 cases before any applicable charges; new-account [trial credit](https://dataforseo.com/faq) is $1. Start with one case to verify the response before increasing `--limit`. For DataForSEO, `--limit` bounds tasks submitted or retrieved during that run. Successful cached cases are skipped. `--refresh` deliberately creates new paid searches. If a submission's outcome is unknown after a timeout or interruption, collection stops until you check the provider's task history; only use `--refresh` after resolving that ambiguity.

For a Serper key, save `SERPER_API_KEY` in your local environment or `~/.env`. Check support for total-result counts with **one request** first:

```sh
deno run --env-file="$HOME/.env" --allow-read --allow-write=.internal \
  --allow-env=SERPER_API_KEY --allow-net=google.serper.dev \
  scripts/google-frequency.js --provider=serper --collect --limit=1
```

Serper's public sample shows result lists without a total count. The adapter accepts an explicit valid `searchInformation.totalResults` if returned; otherwise it records `count_unavailable` and stops. It never substitutes the returned list length. The Serper request uses Vietnamese queries, interface language and Vietnam location, with autocorrection disabled; it does not claim a strict Vietnamese-page restriction. Its records stay separate in `.internal/google-frequency-serper-results.json` and cannot mix with SerpApi counts. Run the one-request check before attempting a larger collection. To prepare a Serper plan offline, run `deno task research:frequency --provider=serper`.

[Google Search Console](https://developers.google.com/webmaster-tools/v1/searchanalytics/query) reports traffic for sites you control and cannot supply web-wide result counts. The optional collection adapter uses [SerpApi](https://serpapi.com/search-api); it requires a separate compatible account and a `SERPAPI_API_KEY` in your local environment. No account is created by this script. Start with a bounded pilot:

```sh
deno task research:frequency --collect --limit=5
```

If the key is stored in `~/.env` and not exported by your shell, load it explicitly:

```sh
deno run --env-file="$HOME/.env" --allow-read --allow-write=.internal \
  --allow-env=SERPAPI_API_KEY --allow-net=serpapi.com \
  scripts/google-frequency.js --collect --limit=5
```

Collection can consume API quota. Use `--case=18` for one case or an explicit `--limit=400` for the full bank. Successful matching queries are reused; `--refresh` requests them again. Collection stops at the first failed, unavailable or corrected-query response. Missing counts remain unknown rather than becoming zero. SerpApi reports and timestamps stay in `.internal/google-frequency-results.json`; other providers use their separate report paths above.

These are estimated matching web pages, not exact text occurrences or measured student knowledge. Google describes result totals as estimates that [may not be accurate](https://developers.google.com/custom-search/v1/reference/rest/v1/Search). Quoted wording, synonym coverage, news and public interest can affect the comparison. The report produces an inverse-percentile `webFrequencyHardness` only after all cases have comparable valid counts; ties stay together. It never changes `case-difficulty.json`. Private methodology notes are in `.internal/google-frequency-method.md`.

## Deploy to GitHub Pages

For a user site, put these files in the root of the `souhhcong.github.io` repository and push to `main`. GitHub Pages will serve the site from the repository root at:

```text
https://souhhcong.github.io/
```

The `.nojekyll` file is included so GitHub Pages serves the static assets exactly as written.

## Notes

The cases are fictional prompts for entertainment and study practice only. They are not medical advice and must not be used to diagnose, advise, or treat real patients.
