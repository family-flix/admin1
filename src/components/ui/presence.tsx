/**
 * @file 控制内容显隐的组件
 */
import { JSX, Show, createSignal } from "solid-js";
import { children } from "solid-js";

import { PresenceCore } from "@/domains/ui/presence";
import { cn } from "@/utils";

export const Presence = (props: {
  store: PresenceCore;
  children:
    | ((options: Partial<{ present: boolean }>) => JSX.Element)
    | JSX.Element;
}) => {
  const { store } = props;

  const [state, setState] = createSignal(store.state);

  store.onStateChange((nextState) => {
    // store.log("onStateChange", nextState);
    setState(nextState);
  });

  const visible = () => state().visible;
  const unmounted = () => state().unmounted;
  const openOrClosed = () => isOpenOrClosed(visible());

  return (
    <Show when={visible()}>
      <div
        data-state={openOrClosed()}
        role="presentation"
        class={cn(
          "presence"
          // "animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=open]:fade-in-90 data-[state=open]:slide-in-from-bottom-10 data-[state=open]:sm:slide-in-from-bottom-0"
        )}
        onAnimationEnd={() => {
          store.endAnimate();
        }}
      >
        {(() => {
          if (typeof props.children === "function") {
            return props.children({ present: visible() });
          }
          return props.children;
        })()}
      </div>
    </Show>
  );
};

function isOpenOrClosed(open: boolean) {
  return open ? "open" : "closed";
}
