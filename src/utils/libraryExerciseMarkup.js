const EXERCISE_PAIR_RE =
  /\[EX\]([\s\S]*?)\[\/EX\]\s*\[ANS\]([\s\S]*?)\[\/ANS\]/gi;

export const hasExerciseMarkup = (content = "") =>
  /\[(?:EX|ANS)\]/i.test(String(content));

export const isExerciseMarkupLine = (line = "") => {
  const t = String(line).trim();
  if (!t) return false;
  if (/^\[(EX|ANS)\]/i.test(t)) return true;
  if (/\[\/(EX|ANS)\]/i.test(t)) return true;
  return false;
};

/**
 * Split library markdown into plain-text segments and EX/ANS exercise pairs.
 * Unmatched leftover text is returned as { type: "text" }.
 */
export const splitExerciseSegments = (content = "") => {
  const source = String(content);
  const parts = [];
  const re = new RegExp(EXERCISE_PAIR_RE.source, EXERCISE_PAIR_RE.flags);
  let lastIndex = 0;
  let match;
  let idx = 0;

  while ((match = re.exec(source)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: "text", text: source.slice(lastIndex, match.index) });
    }
    parts.push({
      type: "exercise",
      id: `ex-${idx}`,
      question: String(match[1] || "").trim(),
      answer: String(match[2] || "").trim(),
    });
    idx += 1;
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < source.length) {
    parts.push({ type: "text", text: source.slice(lastIndex) });
  }

  return parts;
};

/**
 * Closed-card title: "Qn. " plus the first sentence of the stem.
 */
export const exerciseHeaderTitle = (question = "", maxLen = 140) => {
  const q = String(question).replace(/\s+/g, " ").trim();
  if (!q) return "Exercise";
  const numMatch = q.match(/^(\d+)[.)]\s*/);
  const prefix = numMatch ? `Q${numMatch[1]}. ` : "";
  const rest = numMatch ? q.slice(numMatch[0].length) : q;
  const sentenceMatch = rest.match(/^.*?[.!?](?=\s|$)/);
  const first = (sentenceMatch ? sentenceMatch[0] : rest).trim();
  if (first.length <= maxLen) return prefix + first;
  return `${prefix}${first.slice(0, maxLen - 1).trimEnd()}…`;
};
