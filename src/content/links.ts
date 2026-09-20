/** Keep editorial links independent of the hosting directory (GitHub Pages or LNCC). */
export function withBase(path: string, base = "/"): string {
  return `${base.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
}

export function isLink(value: string): boolean {
  if (/\s|[<>"\\]/u.test(value)) return false;
  if (value.startsWith("#")) return value.length > 1;
  if (value.startsWith("/")) return !value.startsWith("//");
  try {
    const url = new URL(value);
    return ["http:", "https:", "mailto:"].includes(url.protocol);
  } catch {
    return false;
  }
}

export function resolveLink(value: string, base = "/"): string {
  if (!isLink(value)) throw new Error(`Link inválido: ${value}`);
  return value.startsWith("/") ? withBase(value, base) : value;
}
