/**
 * @file 会销毁页面的视图（如果希望不销毁可以使用 keep-alive-route-view
 */
import { Show, createSignal, JSX } from "solid-js";
import { effect } from "solid-js/web";

import { RouteViewCore } from "@/domains/route_view";
import { cn } from "@/utils";

export function RouteView(props: { store: RouteViewCore } & JSX.HTMLAttributes<HTMLElement>) {
  const { store } = props;
  const [state, setState] = createSignal(store.state);

  store.onStateChange((nextState) => {
    setState(nextState);
  });

  const visible = () => state().visible;
  const mounted = () => state().mounted;

  effect(() => {
    console.log("RouteView", store.name, visible(), mounted());
  });

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
        {props.children}
      </div>
    </Show>
  );
}
