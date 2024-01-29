import { Application } from "@/domains/app";

const ownerDocument = globalThis.document;

export function connect(app: Application) {
  app.getComputedStyle = (el: HTMLElement) => {
    return window.getComputedStyle(el);
  };
  app.setTitle = (title: string) => {
    document.title = title;
  };
  app.copy = (text: string) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand("copy");
    document.body.removeChild(textArea);
  };
  app.notify = async (msg: { title: string; body: string }) => {
    const { title, body } = msg;
    // 请求通知权限
    const permission = await Notification.requestPermission();
    console.log("[DOMAIN]app/connect - app.notify", permission);
    if (permission !== "granted") {
      alert(body);
      return;
    }
    // 创建通知
    const notification = new Notification(title, {
      body,
      // icon: "notification-icon.png", // 可选的图标
    });
    // 处理通知点击事件
    // notification.onclick = function () {
    // };
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
    console.log("[DOMAIN]Application connect popstate", event.state?.from, event.state?.to);
    const { type } = event;
    const { pathname, href } = window.location;
    app.emit(app.Events.PopState, { type, href, pathname: event.state?.to });
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
    // app.emit(app.Events.Resize, { width: innerWidth, height: innerHeight });
    app.resize(size);
  });
  window.addEventListener("blur", () => {
    app.emit(app.Events.Blur);
  });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      app.emit(app.Events.Hidden);
      return;
    }
    app.emit(app.Events.Show);
  });

  const { availHeight, availWidth } = window.screen;
  if (window.navigator.userAgent.match(/iphone/i)) {
    const matched = [
      // iphonex iphonexs iphone12mini
      "375-812",
      // iPhone XS Max iPhone XR
      "414-896",
      // iPhone pro max iPhone14Plus
      "428-926",
      // iPhone 12/pro 13/14  753
      "390-844",
      // iPhone 14Pro
      "393-852",
      // iPhone 14ProMax
      "430-932",
    ].includes(`${availWidth}-${availHeight}`);
    app.safeArea = !!matched;
  }
  ownerDocument.addEventListener("keydown", (event) => {
    const { key } = event;
    app.keydown({ key });
  });
  // ownerDocument.addEventListener("click", (event) => {
  //   // console.log('[DOMAIN]app/connect.web', event.target);
  //   let target = event.target;
  //   if (target instanceof Document) {
  //     return;
  //   }
  //   if (target === null) {
  //     return;
  //   }
  //   let matched = false;
  //   while (target) {
  //     const t = target as HTMLElement;
  //     if (t.tagName === "A") {
  //       matched = true;
  //       break;
  //     }
  //     target = t.parentNode;
  //   }
  //   if (!matched) {
  //     return;
  //   }
  //   const t = target as HTMLElement;
  //   const href = t.getAttribute("href");
  //   console.log("[CORE]app/connect - link a", href);
  //   if (!href) {
  //     return;
  //   }
  //   if (!href.startsWith("/")) {
  //     return;
  //   }
  //   if (href.startsWith("http")) {
  //     return;
  //   }
  //   if (t.getAttribute("target") === "_blank") {
  //     return;
  //   }
  //   event.preventDefault();
  //   app.emit(app.Events.ClickLink, { href, target: null });
  // });
  const originalBodyPointerEvents = ownerDocument.body.style.pointerEvents;
  app.disablePointer = () => {
    ownerDocument.body.style.pointerEvents = "none";
  };
  app.enablePointer = () => {
    ownerDocument.body.style.pointerEvents = originalBodyPointerEvents;
  };
}
