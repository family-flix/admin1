import { JSX, Show, createSignal } from "solid-js";
import { children } from "solid-js";

import { PresenceCore } from "@/domains/ui/presence";

export const Presence = (props: {
  store: PresenceCore;
  children: JSX.Element;
}) => {
  const { store } = props;
  const [present, setPresent] = createSignal(false);
  const [visible, setVisible] = createSignal(false);

  store.onShow(() => {
    console.log("[COMPONENT]Presence - onShow");
    setVisible(true);
    setPresent(true);
  });
  store.onHidden(() => {
    console.log("[COMPONENT]Presence - onHidden");
    setVisible(false);
  });
  store.onDestroy(() => {
    console.log("[COMPONENT]Presence - onDestroy");
    setPresent(false);
  });

  const state = () => getState(visible());
  const c = children(() => props.children);

  return (
    <Show when={present()}>
      <div
        data-state={state()}
        // class="animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=open]:fade-in-90 data-[state=open]:slide-in-from-bottom-10 data-[state=open]:sm:slide-in-from-bottom-0"
        onAnimationEnd={() => {
          console.log("[COMPONENT]Presence - animation end");
          store.emitAnimationEnd();
        }}
      >
        {c()}
      </div>
    </Show>
  );
};

function getState(open: boolean) {
  return open ? "open" : "closed";
}
