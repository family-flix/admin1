/**
 * @file 小黑块 提示
 */
import { createSignal, JSX } from "solid-js";

import { Portal as PortalPrimitive } from "@/packages/ui/portal";
import { Presence } from "@/components/ui/presence";
import { ToastCore } from "@/domains/ui/toast";
import { cn } from "@/utils";

const Root = (props: { store: ToastCore } & JSX.HTMLAttributes<HTMLElement>) => {
  return props.children;
};

const Portal = (props: { store: ToastCore } & JSX.HTMLAttributes<HTMLDivElement>) => {
  const { store } = props;

  return (
    <Presence store={store.present}>
      <PortalPrimitive>{props.children}</PortalPrimitive>
    </Presence>
  );
};

const Overlay = (props: { store: ToastCore } & JSX.HTMLAttributes<HTMLDivElement>) => {
  const { store } = props;

  const [open, setOpen] = createSignal(store.open);

  store.onOpenChange((nextOpen) => {
    setOpen(nextOpen);
  });

  return <div ref={props.ref} data-state={open() ? "open" : "closed"} class={cn(props.class)} />;
};

const Content = (props: { store: ToastCore } & JSX.HTMLAttributes<HTMLDivElement>) => {
  const { store } = props;
  const [open, setOpen] = createSignal(store.open);

  store.onOpenChange((nextOpen) => {
    setOpen(nextOpen);
  });

  return (
    <div class="fixed z-[99] left-[50%] translate-x-[-50%] top-60 w-120 h-120 ">
      <div data-state={open() ? "open" : "closed"} class={cn(props.class)}>
        {props.children}
      </div>
    </div>
  );
};

export { Root, Portal, Overlay, Content };
