export const siteUrl = (
  process.env.PUBLIC_URL ?? `http://localhost:${process.env.PORT ?? 3000}`
).replace(/\/$/, "");

export function fullUrl(kind: string, slug: string): string {
  if (kind === "shortlink") return `${siteUrl}/${slug}`;
  if (kind === "file") return `${siteUrl}/f/${slug}`;
  return `${siteUrl}/s/${slug}`;
}
