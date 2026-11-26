const months = [
  ["jan", "januari"], ["feb", "februari"], ["mar", "maret"], ["apr", "april"],
  ["mei"], ["jun", "juni"], ["jul", "juli"], ["agu", "ags", "agt", "agustus"],
  ["sep", "sept", "september"], ["okt", "oktober"], ["nov", "november"], ["des", "desember"],
];

export function jakartaToday(now = new Date()) {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Jakarta" }).format(now);
}

export function validDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value + "T00:00:00Z");
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function parseChat(raw: string, today: string) {
  const names: string[] = [];
  let date = "";
  let warning = "";
  for (const original of raw.split(/\r\n?|\n/)) {
    const line = original.normalize("NFKC").replace(/[\u200b\u200e\u200f\ufeff\ufe0f]/g, "")
      .trim().replace(/^[*_~]+|[*_~]+$/g, "").trim();
    if (!line) continue;
    if (/^(?:potongan|diskon|note|catatan)\b/i.test(line)) break;
    const row = /^(\d+)\s*[.)]\s*(.*)$/.exec(line);
    if (row) {
      const number = Number(row[1]);
      if (number !== names.length + 1 || number > 40) {
        warning = `Daftar berhenti sebelum nomor ${number}. Periksa pemain sebelum konfirmasi.`;
        break;
      }
      const name = row[2]
        .replace(/[#*0-9]\u20e3|[\p{Extended_Pictographic}\p{Regional_Indicator}\p{Emoji_Modifier}✓✔](?:[\ufe0e\ufe0f\u{e0020}-\u{e007f}]|\u200d(?=\p{Extended_Pictographic}))*/gu, " ")
        .replace(/\s+/gu, " ").trim();
      names.push(name.toLowerCase().replace(/\p{L}/u, letter => letter.toUpperCase()));
    } else if (names.length) {
      break;
    } else if (!date && !/^(?:💵|💳|biaya|pembayaran|rekening)/iu.test(line)) {
      const match = /\b(\d{1,2})\s+([\p{L}]+)\.?(?:\s+(\d{4})\b)?/u.exec(line);
      if (match) {
        const month = months.findIndex(list => list.includes(match[2].toLowerCase()));
        const candidate = [match[3] || today.slice(0, 4), String(month + 1).padStart(2, "0"), match[1].padStart(2, "0")].join("-");
        if (month >= 0 && validDate(candidate)) date = candidate;
      }
    }
  }
  return { date, names, warning };
}
