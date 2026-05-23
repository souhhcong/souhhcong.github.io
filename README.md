# chanle

`chanle` is a Vietnamese clinical diagnosis guessing game for medical students. It currently includes 100 fictional sample cards and is designed to run on GitHub Pages at `https://souhhcong.github.io/`.

Vietnamese diagnosis labels are normalized toward ICD-10 names from the Vietnam ICD lookup at `https://icd.kcb.vn/icd-10/icd10`; common classroom names remain accepted as aliases.

Difficulty tiers:

- `Dễ`: shows autocomplete suggestions and accepts common aliases.
- `Vừa`: removes autocomplete suggestions but still accepts aliases.
- `Khó`: hides the case title until the answer is shown and only accepts the ICD diagnosis name or ICD code.

## Local use

Serve the folder with any static file server, then open `index.html`. The app loads `cases.csv`, so opening the HTML directly with `file://` may not work in every browser.

## Case Data

Cases live in `cases.csv`. Add or edit rows there instead of changing `app.js`.

Important columns:

- `id`, `title`, `icd_code`, `diagnosis`, `aliases`
- `clue1` through `clue6`
- `summary`
- `pearl1_title`, `pearl1_text`, `pearl2_title`, `pearl2_text`
- optional `differential*_name` and `differential*_note`

## Deploy to GitHub Pages

For a user site, put these files in the root of the `souhhcong.github.io` repository and push to `main`. GitHub Pages will serve the site from the repository root at:

```text
https://souhhcong.github.io/
```

The `.nojekyll` file is included so GitHub Pages serves the static assets exactly as written.

## Notes

The cases are fictional prompts for entertainment and study practice only. They are not medical advice and must not be used to diagnose, advise, or treat real patients.
