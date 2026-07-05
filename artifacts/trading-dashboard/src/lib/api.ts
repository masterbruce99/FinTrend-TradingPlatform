export function getApiUrl(): string {
  const base = import.meta.env.VITE_API_URL || "";
  return base.endsWith("/") ? base : base + "/";
}
