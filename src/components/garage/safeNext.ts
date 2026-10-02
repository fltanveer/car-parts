// Only allow same-site relative paths for ?next= redirects (no open redirect).
export const safeNext = (raw: string | string[] | undefined | null, fallback = "/") => {
  const v = Array.isArray(raw) ? raw[0] : raw;
  if (!v || !v.startsWith("/") || v.startsWith("//") || v.startsWith("/\\")) return fallback;
  return v;
};
