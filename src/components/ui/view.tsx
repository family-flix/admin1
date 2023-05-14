import { Show, createSignal, JSX } from "solid-js";

import { ViewCore } from "@/domains/router";
import { cn } from "@/utils";

export function View(
  props: { store: ViewCore } & JSX.HTMLAttributes<HTMLElement>
) {
  const { store } = props;
  const [state, setState] = createSignal(store.state);

  store.onStateChange((nextState) => {
    setState(nextState);
  });

  const visible = () => state().visible;
  const mounted = () => state().mounted;

  return (
    <Show when={visible()}>
      <div
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
