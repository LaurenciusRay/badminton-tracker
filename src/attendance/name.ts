export const INVISIBLE_CHARS_REGEX = /[\u200B-\u200D\u200E\u200F\u202A-\u202E\u2060-\u206F\uFEFF\uFE00-\uFE0F\p{Cf}]/gu;

export function cleanMemberDisplayName(name: string) {
  return name
    .normalize("NFKC")
    .replace(INVISIBLE_CHARS_REGEX, "")
    .replace(/\s+/gu, " ")
    .trim();
}

export function normalizeMemberName(name: string) {
  return cleanMemberDisplayName(name).toLowerCase();
}

