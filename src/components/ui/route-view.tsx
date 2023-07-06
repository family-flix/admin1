/**
 * @file 会销毁页面的视图（如果希望不销毁可以使用 keep-alive-route-view
 */
import { Show, createSignal, JSX } from "solid-js";

import { PageLoading } from "@/components/PageLoading";
import { ViewComponentProps } from "@/types";

export function RouteView(props: ViewComponentProps & JSX.HTMLAttributes<HTMLDivElement>) {
  const { app, view, router } = props;

  const [state, setState] = createSignal(view.state);
  const [pageContent, setPageContent] = createSignal(<PageLoading class="w-full h-full" />);

  view.onStateChange((nextState) => {
    setState(nextState);
  });
  (async () => {
    if (typeof view.component === "function") {
      if (view.loaded) {
        return;
      }
      const PageView = await view.component();
      setPageContent(<PageView app={app} router={router} view={view} />);
      view.setLoaded();
      return;
    }
    setPageContent(view.component as JSX.Element);
  })();

  const visible = () => state().visible;
  const mounted = () => state().mounted;

  // effect(() => {
  //   console.log("RouteView", store._name, visible(), mounted());
  // });

  return (
    <Show when={mounted()}>
      <div
        class="w-full h-full"
        // class={cn(
        //   "animate-in sm:zoom-in-90",
        //   "data-[state=open]:data-[state=open]:slide-in-from-bottom-full",
        //   "data-[state=closed]:animate-out data-[state=closed]:slide-out-to-top-full"
        // )}
        data-state={visible() ? "open" : "closed"}
        // onAnimationEnd={() => {
        //   store.presence.animationEnd();
        // }}
      >
        {pageContent()}
      </div>
    </Show>
  );
}
