/**
 * @file 小黑块 提示
 */
import { For, createSignal, JSX } from "solid-js";

import * as ToastPrimitive from "@/packages/ui/toast";
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
    <Root store={store}>
      <Portal store={store}>
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

const Root = (props: { store: ToastCore } & JSX.HTMLAttributes<HTMLElement>) => {
  const { store } = props;
  return <ToastPrimitive.Root store={store}>{props.children}</ToastPrimitive.Root>;
};

const Portal = (props: { store: ToastCore } & JSX.HTMLAttributes<HTMLDivElement>) => {
  const { store } = props;

  return <ToastPrimitive.Portal store={store}>{props.children}</ToastPrimitive.Portal>;
};

const Overlay = (props: { store: ToastCore } & JSX.HTMLAttributes<HTMLDivElement>) => {
  const { store } = props;

  return (
    <ToastPrimitive.Overlay
      store={store}
      class={cn(
        "fixed inset-0 z-100 bg-black/50 backdrop-blur-sm transition-all duration-100",
        "data-[state=closed]:animate-out data-[state=open]:fade-in data-[state=closed]:fade-out",
        props.class
      )}
    />
  );
};

const Content = (props: { store: ToastCore; children: JSX.Element }) => {
  const { store } = props;

  return (
    <ToastPrimitive.Content
      store={store}
      class={cn(
        "grid gap-4 rounded-b-lg bg-black text-white p-6 sm:max-w-lg sm:rounded-lg",
        "dark:bg-slate-900",
        "animate-in sm:zoom-in-90",
        "data-[state=open]:fade-in-90",
        "data-[state=closed]:animate-out data-[state=closed]:fade-out"
      )}
    >
      {props.children}
    </ToastPrimitive.Content>
  );
};

export { Root, Portal, Overlay, Content };
