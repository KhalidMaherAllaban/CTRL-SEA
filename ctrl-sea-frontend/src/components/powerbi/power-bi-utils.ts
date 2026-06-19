export function secureEmbedUrl(embedUrl: string, pageName?: string, filters: Record<string, string> = {}, theme = "ctrl-sea-dark") {
  try {
    const url = new URL(embedUrl);
    const isLocal = ["localhost", "127.0.0.1"].includes(url.hostname);
    if (url.protocol !== "https:" && !(isLocal && url.protocol === "http:")) return null;
    if (pageName) url.searchParams.set("pageName", pageName);
    for (const [key, value] of Object.entries(filters)) {
      if (value) url.searchParams.set(`filter.${key}`, value);
    }
    url.searchParams.set("theme", theme);
    return url.toString();
  } catch {
    return null;
  }
}
