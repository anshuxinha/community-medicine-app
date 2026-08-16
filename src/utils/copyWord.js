import AsyncStorage from "@react-native-async-storage/async-storage";

export const WORD_COPY_HINT_STORAGE_KEY = "reading_word_copy_hint_seen";

/**
 * Pull a copyable word out of a token, dropping surrounding punctuation
 * while keeping hyphens, slashes, apostrophes, and trailing %.
 */
export function extractCopyWord(token) {
  const trimmed = String(token ?? "").trim();
  if (!trimmed) return "";
  const stripped = trimmed.replace(
    /^[^\p{L}\p{N}%]+|[^\p{L}\p{N}%]+$/gu,
    "",
  );
  return stripped || trimmed;
}

/**
 * Split text into display pieces. Trailing whitespace stays on the
 * preceding word so each copyable token is one Text node.
 */
export function splitCopyablePieces(text) {
  const raw = String(text ?? "");
  if (!raw) return [];
  const parts = raw.split(/(\s+)/);
  const pieces = [];
  for (const part of parts) {
    if (!part) continue;
    if (/^\s+$/.test(part)) {
      if (pieces.length === 0) {
        pieces.push({ text: part, copyable: false });
      } else {
        pieces[pieces.length - 1].text += part;
      }
    } else {
      pieces.push({ text: part, copyable: true });
    }
  }
  return pieces;
}

export async function hasSeenWordCopyHint() {
  try {
    const raw = await AsyncStorage.getItem(WORD_COPY_HINT_STORAGE_KEY);
    return raw === "true";
  } catch {
    return false;
  }
}

export async function markWordCopyHintSeen() {
  try {
    await AsyncStorage.setItem(WORD_COPY_HINT_STORAGE_KEY, "true");
  } catch {
    // Local flag is best-effort.
  }
}
