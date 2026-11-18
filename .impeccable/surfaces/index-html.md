---
version: 1
slug: "index-html"
primary_target: "index.html"
related_targets: ["app.js","styles.css"]
---

# Game screen (index.html)

Scope: the whole game page, daily and practice. Visitor mode: Operate (a student solves one case, mostly on a phone in a short break).

Audience and job: Vietnamese medical students; read progressive clues, name the diagnosis in at most six guesses, share the result, sometimes practise by specialty.

Constraints: plain static HTML/CSS/JS; keep every app.js hook (ids, data attributes, classes it toggles); keyboard access, visible focus, reduced motion, responsive layout; Vietnamese diacritics.

## Direction contract

THESIS: Each case is a page of photocopied đề cương the student marks up themselves. Refuses the soft-card SaaS dashboard: no rounded panels, icon tiles, gradients or hero illustration.

OWN-WORLD: Cool grey xerox paper (#ecece7) with faint toner speckle, toner black ink, one-pixel black rules, zero radius. Fluorescent highlighter yellow marks the newest clue and the active mode, pink marks wrong guesses, green marks the solved answer; blue ballpoint handwriting carries the player's own guesses. Be Vietnam Pro for print, Patrick Hand for ballpoint.

STORY: The student sees today's case at once, reads the highlighted clue, writes a guess, and watches the page fill with their own marks; the finished page is worth sharing.

FIRST VIEWPORT: Phone: one-line masthead (chanle, Hôm nay / Luyện tập), mode words Lâm sàng / Điều trị as big type with the active one highlighted, a thin meta row (difficulty, specialty, lượt còn lại), the case title as a heavy headline, numbered clue lines, ruled guess slots, then the guess field and Đoán button, all within the first screen. Desktop: same page column plus a right margin column for stats and help, like margin notes. Guess history stays in the case column beside the guess field at every width (user decision, 2026-11-18).

FORM: Photocopied revision notes (Đề cương photo), position 3 on the ordered list; seed:0ac8f0717e3c2fb3. Raises: hierarchy by type scale alone (variable-font specimen); one-pixel rules and printed-mark states, spent guess as a struck bar (centre-rail setting); chrome deleted, mode words as controls (metro tiles); practice bank as packed numbered grid (doujin catalog, deferred).

SIGNATURE: Revealing a clue draws a highlighter stroke across it left to right (background-size sweep, instant under reduced motion); a wrong guess gets a ballpoint strike-through.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
