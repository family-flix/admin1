/**
 * @file ???
 */
import { createSignal, JSX, onCleanup } from "solid-js";

// import { PageLoading } from "@/components/PageLoading";
import { RouteViewCore } from "@/domains/route_view";

export function KeepAliveRouteView(
  props: {
    store: RouteViewCore;
    index: number;
    /** 当隐藏时，是否立刻消失，而不等待动画 */
    immediately?: boolean;
  } & JSX.HTMLAttributes<HTMLDivElement>
) {
  const { store, index, immediately = false } = props;

  const [state, setState] = createSignal(store.state);
  // const loading = <PageLoading class="w-full h-full" />;
  // const [pageContent, setPageContent] = createSignal(loading);

  store.onStateChange((nextState) => {
    setState(nextState);
  });
  // (async () => {
  //   if (typeof view.component === "function") {
  //     if (view.loaded) {
  //       return;
  //     }
  //     const PageView = await view.component();
  //     setPageContent(<PageView app={app} view={view} />);
  //     view.setLoaded();
  //     return;
  //   }
  //   setPageContent(view.component as JSX.Element);
  // })();
  onCleanup(() => {
    store.setUnload();
    // setPageContent(loading);
  });

  // const className = cn(mounted() ? "block" : "hidden", props.class);

  return (
    <div
      class={props.class}
      style={{
        display: (() => {
          if (immediately) {
            if (state().visible) {
              return "block";
            }
            return "none";
          }
          return state().mounted ? "block" : "none";
        })(),
        "z-index": index,
      }}
      data-state={state().visible ? "open" : "closed"}
    >
      {props.children}
    </div>
  );
}
