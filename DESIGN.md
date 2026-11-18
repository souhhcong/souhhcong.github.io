---
name: chanle
description: A daily Vietnamese diagnosis case, set as a photocopied revision page the student marks up.
colors:
  paper: "#ecece7"
  toner: "#1c1c1a"
  toner-2: "#55554f"
  rule-soft: "rgba(28, 28, 26, 0.25)"
  field: "#fafaf8"
  highlighter: "#ffe53b"
  pink: "rgba(255, 111, 174, 0.5)"
  green: "#5fe08a"
  pen: "#2340a0"
typography:
  brand:
    fontFamily: "Be Vietnam Pro, ui-sans-serif, system-ui, sans-serif"
    fontSize: "24px"
    fontWeight: 900
    lineHeight: 1
    letterSpacing: "-0.04em"
  display:
    fontFamily: "Be Vietnam Pro, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(32px, 8.8vw, 34px)"
    fontWeight: 900
    lineHeight: 1.12
    letterSpacing: "-0.04em"
  display-wide:
    fontFamily: "Be Vietnam Pro, ui-sans-serif, system-ui, sans-serif"
    fontSize: "56px"
    fontWeight: 900
    lineHeight: 1.06
    letterSpacing: "-0.04em"
  headline:
    fontFamily: "Be Vietnam Pro, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(26px, 6.5vw, 36px)"
    fontWeight: 900
    lineHeight: 1.2
    letterSpacing: "-0.04em"
  mode-word:
    fontFamily: "Be Vietnam Pro, ui-sans-serif, system-ui, sans-serif"
    fontSize: "23px"
    fontWeight: 900
    lineHeight: 1.1
    letterSpacing: "-0.04em"
  body:
    fontFamily: "Be Vietnam Pro, ui-sans-serif, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: "Be Vietnam Pro, ui-sans-serif, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 700
  meta:
    fontFamily: "Be Vietnam Pro, ui-sans-serif, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 500
  guess:
    fontFamily: "Be Vietnam Pro, ui-sans-serif, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 500
    lineHeight: 1.3
  figure:
    fontFamily: "Be Vietnam Pro, ui-sans-serif, system-ui, sans-serif"
    fontSize: "20px"
    fontWeight: 700
    lineHeight: 1.1
    fontFeature: "tnum"
rounded:
  none: "0px"
spacing:
  hair: "4px"
  sm: "8px"
  md: "16px"
  lg: "22px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.toner}"
    textColor: "{colors.paper}"
    typography: "{typography.body}"
    rounded: "{rounded.none}"
    padding: "0 22px"
    height: "48px"
  button-primary-disabled:
    backgroundColor: "{colors.toner-2}"
    textColor: "{colors.field}"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.toner}"
    rounded: "{rounded.none}"
    padding: "0 16px"
    height: "44px"
  button-outline-hover:
    backgroundColor: "{colors.toner}"
    textColor: "{colors.paper}"
  button-text:
    backgroundColor: "transparent"
    textColor: "{colors.toner}"
    height: "40px"
  input-guess:
    backgroundColor: "{colors.field}"
    textColor: "{colors.toner}"
    typography: "{typography.body}"
    rounded: "{rounded.none}"
    padding: "8px 12px"
    height: "48px"
  select-underline:
    backgroundColor: "transparent"
    textColor: "{colors.toner}"
    rounded: "{rounded.none}"
    padding: "4px 26px 3px 8px"
    height: "36px"
  nav-tab:
    backgroundColor: "transparent"
    textColor: "{colors.toner-2}"
    padding: "8px 0 4px"
  nav-tab-active:
    textColor: "{colors.toner}"
  mode-word:
    backgroundColor: "transparent"
    textColor: "{colors.toner-2}"
    typography: "{typography.mode-word}"
  mode-word-active:
    textColor: "{colors.toner}"
  guess-mark:
    textColor: "{colors.toner}"
    typography: "{typography.guess}"
    padding: "0 6px"
  guess-mark-miss:
    backgroundColor: "{colors.pink}"
    textColor: "{colors.toner-2}"
  guess-mark-hit:
    backgroundColor: "{colors.green}"
    textColor: "{colors.toner}"
---

# Design System: chanle

## Overview

**Creative North Star: "The Marked-Up Đề Cương"**

Every case is a page of photocopied revision notes. The page is cool grey xerox paper with a faint toner speckle, printed in toner black with one-pixel rules and no corners anywhere. Nothing floats, glows or sits in a card: hierarchy comes from type scale and weight alone, and structure comes from rules drawn across the column.

The student's own marks are the only colour. Fluorescent yellow highlighter marks the newest clue and the active mode; pink highlighter under a straight ruled strike-through marks a wrong guess; green highlighter marks the correct guess and the solved answer. Everything is set in one printed face: the player's guesses are print too, distinguished by their marks, not by a different hand. A finished page reads as a sheet the student has worked through, which is what gets shared.

The system rejects the soft-card SaaS dashboard it replaced: no rounded panels, icon tiles, gradients-as-decoration or hero illustration.

**Key Characteristics:**
- Xerox paper ground with SVG fractal-noise speckle, toner ink, zero radius everywhere.
- Hierarchy by a heavy grotesque at weight 900 with tight tracking, never by boxes.
- One-pixel rules: full toner for section heads, 25% toner for row dividers, dashed for unopened clue slots.
- Colour appears only as highlighter marks on text, never as a surface fill.
- One face, Be Vietnam Pro, for everything; no handwriting.

## Colors

A monochrome print palette with three highlighter inks applied as marks over text, plus one ballpoint blue reserved for focus.

### Primary
- **Toner Black** (toner): all printed text, heavy rules, the filled primary button, the logo ground.

### Secondary
- **Fluorescent Highlighter Yellow** (highlighter): the newest revealed clue, the active mode word, text selection, the logo bar. Applied as a chisel-edged gradient band behind the text, never as a block fill.
- **Ballpoint Blue** (pen): the focus outline and the text caret only. It never colours text or marks.

### Tertiary
- **Highlighter Pink** (pink): the chisel-edged band (lower 70%) behind a missed guess, under its toner strike-through.
- **Highlighter Green** (green): the band behind the correct guess and the solved answer.

### Neutral
- **Xerox Paper** (paper): page ground, dialog ground, text on toner fills.
- **Faded Toner** (toner-2): secondary print (meta lines, inactive nav and mode words, slot numbers, unopened clue numbers, disabled primary button ground).
- **Soft Rule** (rule-soft): row dividers between clues, slots, stats, pearls and differentials.
- **Fresh Sheet** (field): the guess input ground, the one surface whiter than the paper.

### Named Rules
**The Marks-Not-Fills Rule.** Highlighter colours are only ever drawn across text as bands. No panel, tile, chip or button is filled with them, and ballpoint blue never leaves focus and caret.

**The One Highlight Rule.** Yellow sits on the latest clue only; older clues drop the mark when a new one opens. The active mode word is the only other yellow on the page.

## Typography

**Print Font:** Be Vietnam Pro (with ui-sans-serif, system-ui) at 400, 500, 700, 900

**Character:** One dense Vietnamese-native grotesque carries the whole page, set heavy and tight for the mode words and the answer, and plain at 500 for the player's guesses. Numerals are tabular throughout.

### Hierarchy
- **Brand** (900, 24px, -0.04em, line-height 1): the masthead wordmark; 14px in the footer.
- **Prompt** (700, 15px, toner): the one instruction line above the clues, "Chẩn đoán ca bệnh" (clinical) or "Đoán bệnh từ kế hoạch điều trị" (treatment). The case's clinical title is never shown: it hints at the diagnosis (user decision). The case number, mode label and clue tally are screen-reader only.
- **Headline** (900, clamp(26px, 6.5vw, 36px), 1.2): the revealed answer; the dialog title uses the same voice at 26px.
- **Mode word** (900, 23px; 27px desktop; 21px below 360px): Lâm sàng / Điều trị as the game-type controls.
- **Body** (400, 16px, 1.55): clues (17px on desktop), summaries, explanations.
- **Label** (700, 13-14px): section heads (Lượt đoán, Dữ kiện tally, result subheads), clue numbers.
- **Meta** (500, 12-13px, faded toner): slot notes, footer.
- **Guess** (500, 16px, 1.3, toner): guesses on their slot lines; a miss drops to faded toner, a hit goes 700.
- **Figure** (700, 20px, 1.1, tabular): stat values on the result card.

### Named Rules
**The Type-Is-The-Chrome Rule.** Hierarchy changes by size and weight, not by containers. A new section gets a bold label over a toner rule, never a box.

**The One Face Rule.** Be Vietnam Pro sets every word on the page, the player's guesses included. The player's input is distinguished by highlighter marks and ruled strikes, never by a handwriting face.

## Layout

A single page column on phones (16px gutter, `shell` max 1120px). From 900px the sheet becomes a two-column grid: the case column (minmax(0, 1fr)) and a 300px margin column for input help and bank counts, separated by a full toner rule with 32px gap and 28px inner padding, like margin notes. Below 900px the margin column stacks under the case behind a toner rule.

The phone first viewport holds masthead, mode words, meta row, the prompt line, the highlighted clue, the unopened clue strip, the guess field and Đoán button. Guess history stays in the case column directly below the guess field at every width.

The meta row wraps: difficulty and lượt còn lại share the first line, the specialty select takes its own full-width line on phones and returns inline from 640px. Unopened clues collapse into a single flex row of numbered dashed slots instead of six empty lines.

Rhythm is tight and print-like: 4-10px inside rows, 16-22px between sections, 28-32px for the footer and desktop gutters. Under 360px vertical padding tightens a step further.

## Elevation & Depth

Flat. The page is a sheet of paper and everything printed on it sits in the same plane; depth is conveyed by rule weight (2px toner for the result divider and input frame, 1px toner for section heads, 25% toner for rows) and by the speckled paper texture.

### Shadow Vocabulary
- **Sheet lift** (`box-shadow: 0 18px 40px -20px rgba(0, 0, 0, 0.35)`): the help dialog only, a loose sheet laid over the page, with a 40% toner backdrop.

### Named Rules
**The One Loose Sheet Rule.** Dialogs (the result card and help) are the only lifted objects. Nothing on the page carries a shadow.

## Shapes

Zero radius everywhere, enforced globally. Forms are rectangles and rules: underlined selects, 1px outlined square buttons, a 2px-framed input butted against a solid toner button. The only soft edges are the chisel-edged highlighter bands (slanted gradient ends at 101deg). Strikes and underlines are straight ruled lines.

## Components

### Buttons
Printed, square and plain.
- **Primary** (toner fill, paper text, 700 16px, 48px tall, 0 22px): Đoán, Ca tiếp theo. Disabled turns faded toner with fresh-sheet text at full opacity, so it stays legible.
- **Outline square** (1px toner border, 44px, 0 16px, icon + 700 14px label): Chia sẻ, Thẻ Anki; the 36px help and close squares share the border. Hover inverts to toner fill.
- **Text actions** (700 14-15px, 1px underline offset 4px, 36-40px hit area): Mở dữ kiện, Ca khác, Xem cách chơi. Bỏ cuộc is the same in faded toner at 500.
- **Focus:** a 2px ballpoint-blue outline, 3px offset, on every control.

### Mode words
The game-type switch is two heavy words, not tabs or pills. The inactive word is faded toner; the active word turns toner and gets a highlighter band swept in left to right (background-size over 380ms, ease-out).

### Navigation
Masthead: wordmark left, Hôm nay / Luyện tập as text tabs (500 15px faded toner; active is 700 toner with a 2px toner underline), help square right, all over a 1px toner rule.

### Inputs / Fields
- **Guess field:** fresh-sheet ground, 2px toner frame, 48px, 16px text, ballpoint caret; butts directly against the primary Đoán button.
- **Selects:** transparent, 1px toner underline only, 700 15px, chevron icon at right, 36px tall.

### Clue list (signature)
Numbered lines (two-digit number in a 30px gutter) separated by soft rules, the first by a toner rule. The latest clue carries the highlighter band; a newly revealed clue sweeps it in over 450ms. Unopened clues show only their numbers over dashed underlines in one row. Under reduced motion the band appears instantly.

### Guess slots (signature)
Six ruled lines numbered in faded toner. A guess sits on its line in print (500 16px toner). A miss turns faded toner with a straight 1.5px toner line-through (skip-ink off) over a chisel pink band on the lower 70%; a hit goes bold over the green band. A manually opened clue fills its slot with a small printed note.

### Answer and result
The answer sets in headline type: green band when solved, a plain 2px toner underline at 6px offset when the round ended unsolved. Explanation pearls and differentials are two-column or stacked rows on soft rules. When a round ends, the answer slides to the front as a result card (dialog, 520ms rise with a slight settle; instant under reduced motion): answer, ICD line, Chia sẻ / Thẻ Anki, the explanation and differentials, then the stats as two-column ruled rows of printed labels with 700 20px tabular figures, then Ca tiếp theo. A square x closes it back to the case. On the main page a "Xem thống kê" button ("Xem kết quả" once the round is over) reopens it; mid-round the card holds the stats only.

## Do's and Don'ts

### Do:
- **Do** keep every corner at 0px and draw structure with 1px rules (toner for heads, 25% toner for rows).
- **Do** apply yellow, pink and green as chisel-edged bands behind text, with `box-decoration-break: clone` so marks wrap per line.
- **Do** mark a missed guess with a straight 1.5px toner line-through over the pink band, and keep ballpoint blue for focus and caret only.
- **Do** carry hierarchy with Be Vietnam Pro at 900 and -0.04em tracking for the mode words and the answer; never show the case's clinical title, it hints at the diagnosis.
- **Do** keep the speckled xerox paper (#ecece7) as the only page ground, including the dialog.
- **Do** make every reveal animation instant under reduced motion.

### Don't:
- **Don't** use rounded panels, cards, icon tiles, decorative gradients or hero illustration.
- **Don't** fill any surface or button with a highlighter or pen colour.
- **Don't** put more than one yellow clue mark on the page at once.
- **Don't** add shadows to anything on the page; only the dialog lifts.
- **Don't** reintroduce a handwriting font or drawn pen squiggles (wavy SVG strikes, scribbles); the user rejected both.
