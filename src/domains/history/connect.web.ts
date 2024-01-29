import { HistoryCore } from "@/domains/history";

const ownerDocument = globalThis.document;

export function connect(history: HistoryCore) {
  const { $router: router } = history;
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
    console.log("[CORE]app/connect - link a", href);
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
  router.back = () => {
    window.history.back();
  };
  router.reload = () => {
    window.location.reload();
  };
  router.onPushState(({ from, to, path }) => {
    window.history.pushState(
      {
        from,
        to,
      },
      "",
      path
    );
  });
  router.onReplaceState(({ from, path, pathname }) => {
    // router.log("[Application ]- onReplaceState");
    window.history.replaceState(
      {
        from,
      },
      "",
      path
    );
  });
}
