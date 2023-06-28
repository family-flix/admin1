/**
 * @file ???
 */
import { createSignal, JSX } from "solid-js";

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

  store.onStateChange((nextState) => {
    setState(nextState);
  });

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
      {props.children}
    </div>
  );
}
