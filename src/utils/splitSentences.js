/** Split text into sentences for granular highlighting. */
export const splitSentences = (text) => {
  if (!text) return [text || ""];
  const matches = String(text).match(/[^.!?]*[.!?]+/g);
  if (!matches) return [text];
  const joined = matches.join("");
  const remaining = String(text).slice(joined.length).trim();
  if (remaining) matches.push(remaining);
  return matches.map((s) => s.trim()).filter(Boolean);
};
