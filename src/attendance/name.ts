export function normalizeMemberName(name: string) {
  return name.normalize("NFKC").trim().replace(/\s+/gu, " ").toLowerCase().normalize("NFKC");
}
