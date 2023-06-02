/**
 * @file ???
 */
import { createSignal, JSX } from "solid-js";

import { RouteViewCore } from "@/domains/route_view";
import { ScrollViewCore } from "@/domains/ui/scroll-view";
import { cn } from "@/utils";

import { PageView } from "./scroll-view";

const scrollView = new ScrollViewCore();

export function KeepAliveRouteView(
  props: {
    store: RouteViewCore;
    index: number;
  } & JSX.HTMLAttributes<HTMLDivElement>
) {
  const { store, index } = props;

  const [state, setState] = createSignal(store.state);

  store.onStateChange((nextState) => {
    setState(nextState);
  });

  const visible = () => state().visible;
  const mounted = () => state().mounted;

  // const className = cn(mounted() ? "block" : "hidden", props.class);

  return (
    <div
      class={cn("absolute left-0 top-0 w-full h-full", props.class)}
      classList={{
        block: mounted(),
        hidden: !mounted(),
      }}
      style={{
        "z-index": index,
      }}
      data-state={visible() ? "open" : "closed"}
    >
      {props.children}
    </div>
  );
}
