// Human wording preferences are evidence about language, never clinical approval.
import { editableFields, sha } from "./vietnamese-copyedit.js";

const fail = (message) => {
  throw new Error(`Language feedback: ${message}`);
};
const clean = (value) => value.replaceAll("\r\n", "\n");
export function parseProofreading(markdown, sheet, answerKey) {
  const sections = clean(markdown).split(/^## /m).slice(1);
  if (
    sections.length !== sheet.items.length ||
    answerKey.length !== sheet.items.length
  ) fail("incomplete comparison or answer key");
  const seen = new Set();
  const items = sections.map((section) => {
    const heading = section.split("\n")[0].match(/^(\d+)\. (.+) — (\S+)$/);
    const index = Number(heading?.[1]) - 1,
      original = sheet.items[index],
      key = answerKey.find((k) =>
        k.caseId === original?.caseId && k.field === original?.field
      );
    if (
      !original || !key || seen.has(index) ||
      heading[2] !== original.diagnosis || heading[3] !== original.field
    ) fail("stale, duplicate or unknown comparison heading");
    seen.add(index);
    const choices = original.choices.map((choice) => {
      const lines = section.split("\n").filter((line) =>
        line.startsWith(`**${choice.label}.** `)
      );
      const origin = key.choices.find((k) => k.label === choice.label)?.origin;
      if (
        lines.length !== 1 ||
        lines[0] !== `**${choice.label}.** ${choice.text}` ||
        !["original", "english_prompt", "vietnamese_prompt"].includes(origin)
      ) fail("comparison options or key changed");
      return { ...choice, origin };
    });
    if (new Set(choices.map((c) => c.origin)).size !== 3) {
      fail("duplicate origins in answer key");
    }
    const response = section.match(
      /^Lựa chọn:\s*(.*?)\s+Ghi chú:\s*([\s\S]*)$/m,
    );
    if (!response) fail("missing preference/comment line");
    const mdValue = response[1].trim(),
      mdComment = response[2].trim().replace(/^___$/, "");
    const jsonValue = original.preferred == null
        ? ""
        : String(original.preferred).trim(),
      jsonComment = original.comment?.trim() ?? "";
    if (jsonValue && mdValue && mdValue !== "___" && jsonValue !== mdValue) {
      fail("conflicting JSON and Markdown preferences; resolve before import");
    }
    if (jsonComment && mdComment && jsonComment !== mdComment) {
      fail("conflicting JSON and Markdown comments; resolve before import");
    }
    const value = jsonValue || mdValue, comment = jsonComment || mdComment;
    let labels = [];
    if (/^(tie|ngang nhau)$/i.test(value)) labels = choices.map((c) => c.label);
    else if (
      /^(none|không chọn câu nào)$/i.test(value) || value === "___" || !value
    ) labels = [];
    else if (/^[ABC](?:\s*[=,/]\s*[ABC])*$/.test(value)) {
      labels = value.split(/\s*[=,/]\s*/);
    } else fail("use A/B/C, A=B, tie or none");
    const texts = new Set(
      choices.filter((c) => labels.includes(c.label)).map((c) => c.text),
    );
    // Equivalent wording gets equal credit even when only one identical label was selected.
    const preferredOrigins = choices.filter((c) => texts.has(c.text)).map((c) =>
      c.origin
    );
    return {
      caseId: original.caseId,
      field: original.field,
      before: choices.find((c) => c.origin === "original").text,
      selected: value,
      comment,
      preferredOrigins,
      finalApproval: false,
      status: preferredOrigins.length
        ? "relative_preference_only"
        : "abstained",
    };
  });
  const counts = { englishWins: 0, vietnameseWins: 0, ties: 0, abstentions: 0 };
  for (const item of items) {
    const en = item.preferredOrigins.includes("english_prompt"),
      vi = item.preferredOrigins.includes("vietnamese_prompt");
    if (en && vi) counts.ties++;
    else if (en) counts.englishWins++;
    else if (vi) counts.vietnameseWins++;
    else counts.abstentions++;
  }
  return {
    items,
    summary: { ...counts, reviewed: items.length, finalApprovals: 0 },
  };
}

export function reviewTargetsFrom(feedback, conditions) {
  if (feedback.scope !== "wording_preferences_only_not_clinical_sign_off") {
    fail("unexpected feedback scope");
  }
  const targets = new Map();
  const relevant = new Map(conditions.map((c) => [c.caseId, c]));
  for (
    const item of [
      ...feedback.unchanged.filter((x) => x.status === "reported_issue"),
      ...feedback.items.filter((x) => x.comment),
    ]
  ) {
    const c = relevant.get(item.caseId);
    if (!c) continue;
    if (editableFields(c)[item.field] !== item.before) {
      fail("feedback baseline changed; re-review before reusing it");
    }
    targets.set(`${item.caseId}:${item.field}`, {
      caseId: item.caseId,
      field: item.field,
      before: item.before,
      comment: item.comment,
    });
  }
  return [...targets.values()];
}

export function parseUnchangedChecks(markdown) {
  const seen = new Set();
  return clean(markdown).split(/^## /m).slice(1).map((section) => {
    const heading = section.split("\n")[0].match(/^(\d+) — (\S+)$/);
    const body = section.slice(section.indexOf("\n") + 1).match(
      /^\s*([\s\S]*?)\n\s*Ghi chú \/ đề xuất:\s*([\s\S]*)$/,
    );
    const caseId = Number(heading?.[1]),
      field = heading?.[2],
      key = `${caseId}:${field}`;
    if (!heading || !body || seen.has(key) || !body[1].trim()) {
      fail("invalid or duplicate unchanged-field entry");
    }
    seen.add(key);
    const comment = body[2].trim();
    const status = /^OK[.!]?$/i.test(comment)
      ? "explicit_no_problem"
      : /^so so[.!]?$/i.test(comment)
      ? "uncertain"
      : /^reviewed in /i.test(comment)
      ? "covered_elsewhere"
      : !comment || comment === "___"
      ? "unreviewed"
      : "reported_issue";
    return {
      caseId,
      field,
      before: body[1].trim(),
      comment,
      status,
      clinicalApproval: false,
    };
  });
}

export function importFeedback(
  { markdown, sheet, answerKey, unchangedMarkdown },
) {
  const comparison = parseProofreading(markdown, sheet, answerKey);
  const unchanged = parseUnchangedChecks(unchangedMarkdown);
  return {
    version: 1,
    attribution: "project_owner_proofreading",
    scope: "wording_preferences_only_not_clinical_sign_off",
    sourceHashes: {
      markdown: sha(markdown),
      sheet: sha(sheet),
      answerKey: sha(answerKey),
      unchangedMarkdown: sha(unchangedMarkdown),
    },
    ...comparison,
    unchanged,
    summary: {
      ...comparison.summary,
      unchangedIssues:
        unchanged.filter((x) => x.status === "reported_issue").length,
      unchangedUncertain:
        unchanged.filter((x) => x.status === "uncertain").length,
      unchangedControls:
        unchanged.filter((x) => x.status === "explicit_no_problem").length,
    },
  };
}
