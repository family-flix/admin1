import { Application } from "@/domains/app";

export function bind(app: Application) {
  const { router } = app;
  const ownerDocument = globalThis.document;
  app.getComputedStyle = (el: HTMLElement) => {
    return window.getComputedStyle(el);
  };
  window.addEventListener("DOMContentLoaded", () => {
    // 1
    const { innerWidth, innerHeight } = window;
    app.setSize({ width: innerWidth, height: innerHeight });
  });
  window.addEventListener("load", () => {
    // console.log("2");
  });
  window.addEventListener("popstate", (event) => {
    const { type } = event;
    const { pathname } = window.location;
    app.emit(app.Events.PopState, { type, pathname });
  });
  window.addEventListener("beforeunload", (event) => {
    // // 取消事件
    // event.preventDefault();
    // // Chrome 以及大部分浏览器需要返回值
    // event.returnValue = "";
    // // 弹出提示框
    // const confirmationMessage = "确定要离开页面吗？";
    // (event || window.event).returnValue = confirmationMessage;
    // return confirmationMessage;
  });
  window.addEventListener("resize", () => {
    const { innerWidth, innerHeight } = window;
    const size = {
      width: innerWidth,
      height: innerHeight,
    };
    console.log("resize", size);
    // app.emit(app.Events.Resize, { width: innerWidth, height: innerHeight });
    app.resize(size);
  });
  window.addEventListener("blur", () => {
    app.emit(app.Events.Blur);
  });
  ownerDocument.addEventListener("keydown", (event) => {
    const { key } = event;
    app.keydown({ key });
  });
  ownerDocument.addEventListener("click", (event) => {
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
    if (!href) {
      return;
    }
    if (!href.startsWith("/")) {
      return;
    }
    if (href.startsWith("http")) {
      return;
    }
    event.preventDefault();
    app.emit(app.Events.ClickLink, { href });
  });
  router.onBack(() => {
    window.history.back();
  });
  router.onReload(() => {
    window.location.reload();
  });
  router.onPushState(({ from, path }) => {
    // router.log("[Application ]- onPushState", path);
    window.history.pushState(
      {
        from,
      },
      null,
      path
    );
  });
  router.onReplaceState(({ from, path, pathname }) => {
    // router.log("[Application ]- onReplaceState");
    window.history.replaceState(
      {
        from,
      },
      null,
      path
    );
  });

  const originalBodyPointerEvents = ownerDocument.body.style.pointerEvents;
  app.disablePointer = () => {
    ownerDocument.body.style.pointerEvents = "none";
  };
  app.enablePointer = () => {
    ownerDocument.body.style.pointerEvents = originalBodyPointerEvents;
  };
}
