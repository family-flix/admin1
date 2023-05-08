/**
 * @file 控制内容显隐的组件
 */
import { JSX, Show, createSignal } from "solid-js";

import { PresenceCore } from "@/domains/ui/presence";
import { cn } from "@/utils";

export const Presence = (props: {
  store: PresenceCore;
  children: JSX.Element;
}) => {
  const { store } = props;

  const [state, setState] = createSignal(store.state);

  store.onStateChange((nextState) => {
    console.log(...store.log("onStateChange", nextState));
    setState(nextState);
  });

  const open = () => state().open;
  const unmounted = () => state().unmounted;
  const openOrClosed = () => isOpenOrClosed(open());

  return (
    <Show when={open()}>
      <div
        data-state={openOrClosed()}
        role="presentation"
        class={cn(
          "presence"
          // "animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=open]:fade-in-90 data-[state=open]:slide-in-from-bottom-10 data-[state=open]:sm:slide-in-from-bottom-0"
        )}
        onAnimationEnd={() => {
          store.animationEnd();
        }}
      >
        {props.children}
      </div>
    </Show>
  );
};

function isOpenOrClosed(open: boolean) {
  return open ? "open" : "closed";
}
