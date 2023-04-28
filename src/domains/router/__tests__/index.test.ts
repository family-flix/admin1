import { describe, it, expect, vi } from "vitest";
import { ViewCore } from "..";

describe("sub routes", () => {
  const router = new ViewCore({ prefix: "" });
  const subRouter = new ViewCore({ prefix: "/" });
  subRouter.register("/home", () => {
    return {
      title: "home",
      component: "home-component",
    };
  });
  router.register("/", () => {
    return {
      title: "layout1",
      component: "main-layout",
      child: subRouter,
    };
  });
  router.onStart((params) => {
    subRouter.start(params);
  });
  router.onSubViewsChange(() => {});
  const fn1 = vi.fn(() => {});
  // subRouter.onStateChange(fn1);
  router.start({
    // host: "admin-t.funzm.com",
    // protocol: "https://",
    // origin: "admin-t.funzm.com",
    // href: "https://admin-t.funzm.com",
    pathname: "/",
  });

  expect(fn1.mock.calls[0]).toBe(null);
});
