// Catches common email typos before sign-up. Returns a suggested address or null.
const DOMAINS = ["st.knust.edu.gh", "idl.knust.edu.gh", "gmail.com", "yahoo.com", "outlook.com", "hotmail.com", "icloud.com"];
const TLD_FIXES: Record<string, string> = { con: "com", cmo: "com", coom: "com", gmial: "gmail", gmai: "gmail", gnail: "gmail" };

function distance(a: string, b: string): number {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++)
    d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
}

export function suggestEmail(raw: string): string | null {
  const email = raw.trim().toLowerCase();
  const at = email.lastIndexOf("@");
  if (at < 1 || at === email.length - 1) return null;
  const local = email.slice(0, at), domain = email.slice(at + 1);
  if (DOMAINS.includes(domain)) return null;
  if (domain === "knust.edu.gh") return `${local}@st.knust.edu.gh`;
  const parts = domain.split(".").map((p) => TLD_FIXES[p] ?? p).join(".");
  if (DOMAINS.includes(parts)) return `${local}@${parts}`;
  let best: string | null = null, bestScore = 3;
  for (const known of DOMAINS) {
    const score = distance(domain, known);
    if (score > 0 && score < bestScore) { best = known; bestScore = score; }
  }
  return best ? `${local}@${best}` : null;
}
