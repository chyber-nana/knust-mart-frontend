import { useEffect } from "react";

const DEFAULT_TITLE = "KNUST Mart | Buy and Sell on KNUST Campus, Kumasi";

/** Sets the tab title and search-result description for the current page; restores the defaults when leaving it. */
export function usePageMeta(title?: string, description?: string) {
  useEffect(() => {
    if (!title) return;
    const tag = document.querySelector('meta[name="description"]');
    const previous = tag?.getAttribute("content") ?? "";
    document.title = title;
    if (description) tag?.setAttribute("content", description.slice(0, 160));
    return () => { document.title = DEFAULT_TITLE; tag?.setAttribute("content", previous); };
  }, [title, description]);
}
