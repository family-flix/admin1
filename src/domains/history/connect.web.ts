import { HistoryCore } from "@/domains/history";

const ownerDocument = globalThis.document;

export function connect(history: HistoryCore<string, any>) {
  history.reload = () => {
    window.location.reload();
  };
  ownerDocument.addEventListener("click", (event) => {
    // console.log('[DOMAIN]app/connect.web', event.target);
    let target = event.target;
    if (target instanceof Document) {
      return;
    }
    if (target === null) {
      return;
    }
    let matched = false;
    while (target) {
      const t = target as HTMLElement;
      if (t.tagName === "A") {
        matched = true;
        break;
      }
      target = t.parentNode;
    }
    if (!matched) {
      return;
    }
    const t = target as HTMLElement;
    const href = t.getAttribute("href");
    console.log("[DOMAIN]history/connect.web - link a", href);
    if (!href) {
      return;
    }
    if (!href.startsWith("/")) {
      return;
    }
    if (href.startsWith("http")) {
      return;
    }
    if (t.getAttribute("target") === "_blank") {
      return;
    }
    event.preventDefault();
    history.handleClickLink({ href, target: null });
  });
  window.addEventListener("popstate", (event) => {
    console.log("[DOMAIN]history/connect - window.addEventListener('popstate'", event.state?.from, event.state?.to);
    const { type } = event;
    const { pathname, href } = window.location;
    history.$router.handlePopState({ type, href, pathname: event.state?.to });
  });
}
