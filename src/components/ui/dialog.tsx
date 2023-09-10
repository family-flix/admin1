/**
 * @file 弹窗 组件
 */
import { createSignal, JSX } from "solid-js";
import { LucideX as X } from "lucide-solid";

import { DialogCore } from "@/domains/ui/dialog";
import * as DialogPrimitive from "@/packages/ui/dialog";
import { Show } from "@/packages/ui/show";
import { cn } from "@/utils";

export function Dialog(
  props: {
    store: DialogCore;
    width?: string;
  } & JSX.HTMLAttributes<HTMLElement>
) {
  const { store, width = "w-full sm:max-w-lg" } = props;

  const [state, setState] = createSignal(store.state);

  store.onStateChange((nextState) => {
    setState(nextState);
  });

  const title = () => state().title;
  const footer = () => state().footer;

  return (
    <DialogPrimitive.Root store={store}>
      <DialogPrimitive.Portal class="fixed inset-0 z-50 flex items-start justify-center sm:items-center" store={store}>
        <DialogPrimitive.Overlay
          class={cn(
            "fixed inset-0 z-50 bg-black/50 backdrop-blur-sm",
            "transition-all duration-100",
            "data-[state=open]:fade-in",
            "data-[state=closed]:animate-out data-[state=closed]:fade-out"
          )}
          store={store}
        />
        <DialogPrimitive.Content
          class={cn(
            "fixed z-50 grid gap-4 rounded-b-lg bg-white p-6 sm:rounded-lg",
            "sm:zoom-in-90",
            "dark:bg-slate-900",
            "animate-in data-[state=open]:fade-in-90",
            "data-[state=closed]:animate-out data-[state=closed]:fade-out"
          )}
          store={store}
        >
          <DialogPrimitive.Header class="flex flex-col space-y-2 text-center sm:text-left">
            <DialogPrimitive.Title class={cn("text-lg font-semibold text-slate-900", "dark:text-slate-50")}>
              {title()}
            </DialogPrimitive.Title>
          </DialogPrimitive.Header>
          {props.children}
          <Show when={state().closeable}>
            <DialogPrimitive.Close
              class={cn(
                "absolute top-4 right-4 cursor-pointer rounded-sm",
                "opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:pointer-events-none",
                "dark:focus:ring-slate-400 dark:focus:ring-offset-slate-900",
                "data-[state=open]:bg-slate-100 dark:data-[state=open]:bg-slate-800"
              )}
              store={store}
            >
              <X width={15} height={15} />
              <span class="sr-only">Close</span>
            </DialogPrimitive.Close>
          </Show>
          <Show when={footer()}>
            <DialogPrimitive.Footer class="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
              <div class="space-x-2">
                <DialogPrimitive.Cancel store={store}>取消</DialogPrimitive.Cancel>
                <DialogPrimitive.Submit store={store}>确认</DialogPrimitive.Submit>
              </div>
            </DialogPrimitive.Footer>
          </Show>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

const Root = (props: { store: DialogCore } & JSX.HTMLAttributes<HTMLElement>) => {
  return props.children;
};

const Portal = (props: { store: DialogCore } & JSX.HTMLAttributes<HTMLElement>) => {
  const { store } = props;

  return (
    <DialogPrimitive.Portal class="fixed inset-0 z-50 flex items-start justify-center sm:items-center" store={store}>
      {props.children}
    </DialogPrimitive.Portal>
  );
};

const Overlay = (props: { store: DialogCore } & JSX.HTMLAttributes<HTMLDivElement>) => {
  const { store } = props;

  return (
    <DialogPrimitive.Overlay
      class={cn(
        "fixed inset-0 z-50 bg-black/50 backdrop-blur-sm",
        "transition-all duration-100",
        "data-[state=open]:fade-in",
        "data-[state=closed]:animate-out data-[state=closed]:fade-out"
      )}
      store={store}
    />
  );
};

const Content = (
  props: {
    store: DialogCore;
  } & JSX.HTMLAttributes<HTMLElement>
) => {
  const { store } = props;

  return (
    <DialogPrimitive.Content
      class={cn(
        "fixed z-50 grid w-full gap-4 rounded-b-lg bg-white p-6 sm:max-w-lg sm:rounded-lg",
        "sm:zoom-in-90",
        "dark:bg-slate-900",
        "animate-in data-[state=open]:fade-in-90",
        "data-[state=closed]:animate-out data-[state=closed]:fade-out",
        props.class
      )}
      store={store}
    >
      {props.children}
      <DialogPrimitive.Close
        class={cn(
          "absolute top-4 right-4 cursor-pointer rounded-sm",
          "opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:pointer-events-none",
          "dark:focus:ring-slate-400 dark:focus:ring-offset-slate-900",
          "data-[state=open]:bg-slate-100 dark:data-[state=open]:bg-slate-800"
        )}
        store={store}
      >
        <X width={15} height={15} />
        <span class="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  );
};

const Header = (props: {} & JSX.HTMLAttributes<HTMLElement>) => {
  return <div class={cn("flex flex-col space-y-2 text-center sm:text-left", props.class)}>{props.children}</div>;
};

const Footer = (props: {} & JSX.HTMLAttributes<HTMLElement>) => {
  return (
    <DialogPrimitive.Footer class={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2")}>
      {props.children}
    </DialogPrimitive.Footer>
  );
};

const Title = (props: {} & JSX.HTMLAttributes<HTMLElement>) => {
  return (
    <DialogPrimitive.Title class={cn("text-lg font-semibold text-slate-900", "dark:text-slate-50")}>
      {props.children}
    </DialogPrimitive.Title>
  );
};

const Submit = (props: { store: DialogCore } & JSX.HTMLAttributes<HTMLButtonElement>) => {
  const { store } = props;
  return <DialogPrimitive.Submit store={store}>{props.children}</DialogPrimitive.Submit>;
};

const Cancel = (props: { store: DialogCore } & JSX.HTMLAttributes<HTMLButtonElement>) => {
  const { store } = props;
  return <DialogPrimitive.Cancel store={store}>{props.children}</DialogPrimitive.Cancel>;
};

// export { Root, Portal, Header, Title, Content, Overlay, Footer, Submit, Cancel };
