/**
 * @file 小黑块 提示
 */
import {
  For,
  createSignal,
  JSX,
  onMount,
  onCleanup,
  createEffect,
} from "solid-js";
import { Portal as PortalPrimitive } from "solid-js/web";

import { Presence } from "@/components/ui/presence";
import { ToastCore } from "@/domains/ui/toast";
import { cn } from "@/utils";

export const Toast = (props: { store: ToastCore }) => {
  const { store } = props;

  const [state, setState] = createSignal(store.state);
  store.onStateChange((nextState) => {
    setState(nextState);
  });

  const texts = () => state().texts;

  return (
    <Root>
      <Portal store={store}>
        {/* <Overlay
          store={store}
          class={cn(
            "fixed inset-0 z-51 bg-black/50 backdrop-blur-sm transition-all duration-100",
            "data-[state=closed]:animate-out data-[state=open]:fade-in data-[state=closed]:fade-out"
          )}
        /> */}
        <Content store={store}>
          <For each={texts()}>
            {(text) => {
              return <div class="text-center">{text}</div>;
            }}
          </For>
        </Content>
      </Portal>
    </Root>
  );
};

const Root = (props: {} & JSX.HTMLAttributes<HTMLElement>) => {
  return props.children;
};

const Portal = (
  props: { store: ToastCore } & JSX.HTMLAttributes<HTMLDivElement>
) => {
  const { store } = props;

  return (
    <PortalPrimitive>
      <Presence store={store.present}>{props.children}</Presence>
    </PortalPrimitive>
  );
};

const Overlay = (
  props: { store: ToastCore } & JSX.HTMLAttributes<HTMLDivElement>
) => {
  const { store } = props;

  const [open, setOpen] = createSignal(store.open);

  store.onOpenChange((nextOpen) => {
    setOpen(nextOpen);
  });

  return (
    <div
      ref={props.ref}
      data-state={open() ? "open" : "closed"}
      class={cn(props.class)}
    />
  );
};

const Content = (props: { store: ToastCore; children: JSX.Element }) => {
  const { store } = props;
  const [open, setOpen] = createSignal(store.open);

  store.onOpenChange((nextOpen) => {
    setOpen(nextOpen);
  });
  // "fixed z-51 flex items-start justify-center sm:items-center"
  // onMount(() => {
  //   console.log("[]ToastContent onMount");
  // });
  // onCleanup(() => {
  //   console.log("[]ToastContent onCleanup");
  // });
  // createEffect(() => {
  //   console.log("open changed", open());
  // });

  return (
    <div class="fixed z-99 left-[50%] translate-x-[-50%] top-60 w-120 h-120 ">
      <div
        data-state={open() ? "open" : "closed"}
        class={cn(
          "grid gap-4 rounded-b-lg bg-black text-white p-6 sm:max-w-lg sm:rounded-lg",
          "dark:bg-slate-900",
          "animate-in sm:zoom-in-90",
          "data-[state=open]:fade-in-90",
          "data-[state=closed]:animate-out data-[state=closed]:fade-out"
        )}
        onAnimationEnd={() => {
          console.log("onAnimationEnd", store.open);
        }}
      >
        {props.children}
      </div>
    </div>
  );
};

export { Root, Portal, Content };
