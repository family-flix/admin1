/**
 * @file ???
 */
import { createSignal, JSX } from "solid-js";

import { PageLoading } from "@/components/PageLoading";
import { ViewComponentProps } from "@/types";

export function KeepAliveRouteView(
  props: ViewComponentProps & {
    index: number;
    /** 当隐藏时，是否立刻消失，而不等待动画 */
    immediately?: boolean;
  } & JSX.HTMLAttributes<HTMLDivElement>
) {
  const { app, router, view, index, immediately = false } = props;

  const [state, setState] = createSignal(view.state);
  const loading = <PageLoading class="w-full h-full" />;
  const [pageContent, setPageContent] = createSignal(loading);

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

  // const className = cn(mounted() ? "block" : "hidden", props.class);

  return (
    <div
      class={props.class}
      style={{
        display: (() => {
          if (immediately) {
            if (visible()) {
              return "block";
            }
            return "none";
          }
          return mounted() ? "block" : "none";
        })(),
        "z-index": index,
      }}
      data-state={visible() ? "open" : "closed"}
      onScroll={(event) => {
        console.log(event);
      }}
    >
      {pageContent()}
    </div>
  );
}
