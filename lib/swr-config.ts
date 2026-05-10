/**
 * Shared SWR configuration — all components must use this fetcher
 * so SWR can deduplicate identical requests across the component tree.
 *
 * Without this, TopNav + Dashboard + Review + Earnings + Settings
 * each fire their own /api/auth/me → 5 identical requests on page load.
 */
export const fetcher = (url: string) =>
  fetch(url, { credentials: 'include' }).then(r => {
    if (!r.ok) throw new Error(`API error: ${r.status}`);
    return r.json();
  });

export const swrConfig = {
  revalidateOnFocus: false,
  dedupingInterval: 30_000, // 30s — shared across all components
  errorRetryCount: 2,
};
