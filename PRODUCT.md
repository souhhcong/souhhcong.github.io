# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Vietnamese medical students across clinical rotations. They mostly play on a phone in short breaks (between ward rounds, on the bus): one quick daily case. Some also run longer specialty practice sessions while revising.

## Product Purpose

chanle is a daily diagnosis guessing game in Vietnamese. A player reads progressive clues, either a clinical vignette (Dữ kiện lâm sàng) or a management plan (Kế hoạch điều trị), and names the diagnosis in at most six guesses. Success is a student who returns every day and recognises conditions faster.

## Positioning

A Wordle-style daily ritual built from a curated, source-checked Vietnamese case bank: 400 conditions, six clinical and six treatment clues each, difficulty set by how familiar a condition is to Vietnamese students rather than by disease severity.

## Operating Context

- Daily mode: one deterministic case per game type and difficulty, progress saved per day, shareable result grid (manual reveals show as yellow squares).
- Practice mode: focused play by one of 16 overlapping specialties.
- Rules: start with one clue; a wrong guess reveals another; opening a clue manually costs one guess; "Bỏ cuộc" gives up and opens the answer and explanation.
- Answers accept Vietnamese names, classroom synonyms, English aliases and ICD codes, ignoring accents, case and punctuation; autocomplete suggests diagnoses.

## Capabilities and Constraints

- Static site on GitHub Pages: plain JavaScript, HTML, CSS, local SVG assets; no build step or package install.
- Interface language is Vietnamese; full diacritics must render well.
- Medical content lives in `cases.csv`, `revision-data.json`, `case-difficulty.json`; the UI never edits it.
- Educational and entertainment use only; not clinical advice (footer disclaimer stays).

## Brand Commitments

- None fixed visually. The user confirmed every visual element (name styling, logo, colours) may be replaced; game rules and content stay.
- The product name is `chanle`.

## Evidence on Hand

- Real case bank of 400 conditions in the repository.
- Clinician sign-off: none. Difficulty ratings are editorial estimates, not learner-measured. Do not claim otherwise.
- No testimonials, user counts or institutional endorsements exist; do not invent them.

## Product Principles

- The daily case is the front door: on a phone, the clue and the guess box come first.
- Two registers: daily play should feel like a satisfying ritual worth sharing; practice should feel like focused study. Both matter equally.
- Content is the hero: clues, answers and explanations must stay easy to read in Vietnamese.
- Honest framing: no claims of clinical validation the data does not support.

## Accessibility & Inclusion

Keyboard access, visible focus, reduced-motion support and responsive layouts are required (project rule).
