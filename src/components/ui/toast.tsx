/**
 * @file 纯粹的弹窗组件
 */
import { For, children, createSignal } from "solid-js";
import { Portal } from "solid-js/web";
import { JSX } from "solid-js";

import { cn } from "@/lib/utils";
import { Presence } from "@/components/ui/presence";
import { ToastCore } from "@/domains/ui/toast";

export const Toast = (props: { core: ToastCore; texts: string[] }) => {
  const { core } = props;

  return (
    <ToastContent store={core}>
      <For each={props.texts}>
        {(text) => {
          return <div class="text-center">{text}</div>;
        }}
      </For>
    </ToastContent>
  );
};

export const ToastPortal = (props: {
  store: ToastCore;
  children: JSX.Element;
}) => {
  const { store } = props;
  const c = children(() => props.children);

  return (
    <Portal>
      <Presence store={store.present}>
        <div class="fixed z-51 flex items-start justify-center sm:items-center">
          {c()}
        </div>
      </Presence>
    </Portal>
  );
};

export const ToastOverlay = (props) => {
  const { store } = props;

  const [visible, setVisible] = createSignal(store.visible);

  store.onVisibleChange((nextVisible) => {
    setVisible(nextVisible);
  });
  const state = () => getState(visible());

  return (
    <div
      ref={props.ref}
      data-state={state()}
      class={cn(
        "fixed inset-0 z-51 bg-black/50 backdrop-blur-sm transition-all duration-100",
        "data-[state=closed]:animate-out data-[state=open]:fade-in data-[state=closed]:fade-out"
      )}
    />
  );
};
ToastOverlay.displayName = "ToastOverlay";

export const ToastContent = (props: {
  store: ToastCore;
  children: JSX.Element;
}) => {
  const { store } = props;
  const c = children(() => props.children);
  const [visible, setVisible] = createSignal(store.visible);

  store.onVisibleChange((nextVisible) => {
    setVisible(nextVisible);
  });
  const state = () => getState(visible());

  // console.log("[COMPONENT]DialogContent - render");

  return (
    <ToastPortal store={store}>
      <div class="fixed z-51 left-[50%] translate-x-[-50%] top-60 w-120 h-120 ">
        <div
          data-state={state()}
          class={cn(
            "grid gap-4 rounded-b-lg bg-black text-white p-6 sm:max-w-lg sm:rounded-lg",
            "dark:bg-slate-900",
            "animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=open]:fade-in-90 data-[state=open]:slide-in-from-bottom-10 data-[state=open]:sm:slide-in-from-bottom-0 sm:zoom-in-90"
          )}
        >
          {c()}
        </div>
      </div>
    </ToastPortal>
  );
};

function getState(open: boolean) {
  return open ? "open" : "closed";
}
