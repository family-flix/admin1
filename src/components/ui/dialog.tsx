/**
 * @file 弹窗 组件
 */
import { children, createSignal, JSX } from "solid-js";
import { Portal as PortalPrimitive } from "solid-js/web";
import { X } from "lucide-solid";

import { DialogCore } from "@/domains/ui/dialog";
import { Presence } from "@/components/ui/presence";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils";

const Root = (
  props: { store: DialogCore } & JSX.HTMLAttributes<HTMLElement>
) => {
  return props.children;
};

const Portal = (
  props: { store: DialogCore } & JSX.HTMLAttributes<HTMLElement>
) => {
  const { store } = props;

  return (
    <PortalPrimitive>
      <Presence store={store.present}>
        <div class="fixed inset-0 z-50 flex items-start justify-center sm:items-center">
          {props.children}
        </div>
      </Presence>
    </PortalPrimitive>
  );
};

const Overlay = (
  props: { store: DialogCore } & JSX.HTMLAttributes<HTMLDivElement>
) => {
  const { store } = props;

  const [state, setState] = createSignal(store.state);

  store.onStateChange((nextState) => {
    setState(nextState);
  });

  return (
    <div
      ref={props.ref}
      data-state={getState(state().open)}
      class={cn(
        "fixed inset-0 z-50 bg-black/50 backdrop-blur-sm",
        "transition-all duration-100",
        "data-[state=open]:fade-in",
        "data-[state=closed]:animate-out data-[state=closed]:fade-out"
      )}
    />
  );
};

const Content = (
  props: {
    store: DialogCore;
  } & JSX.HTMLAttributes<HTMLElement>
) => {
  const { store } = props;
  const [state, setState] = createSignal(store.state);

  store.onStateChange((nextState) => {
    setState(nextState);
  });

  return (
    <div
      data-state={getState(state().open)}
      class={cn(
        "fixed z-50 grid w-full gap-4 rounded-b-lg bg-white p-6 sm:max-w-lg sm:rounded-lg",
        "sm:zoom-in-90",
        "dark:bg-slate-900",
        "animate-in data-[state=open]:fade-in-90",
        "data-[state=closed]:animate-out data-[state=closed]:fade-out"
      )}
    >
      {props.children}
      <div
        data-state={getState(state().open)}
        class={cn(
          "absolute top-4 right-4 cursor-pointer rounded-sm",
          "opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:pointer-events-none",
          "dark:focus:ring-slate-400 dark:focus:ring-offset-slate-900",
          "data-[state=open]:bg-slate-100 dark:data-[state=open]:bg-slate-800"
        )}
        onClick={() => {
          store.hide();
        }}
      >
        <X width={15} height={15} />
        <span class="sr-only">Close</span>
      </div>
    </div>
  );
};

const Header = (props: {} & JSX.HTMLAttributes<HTMLElement>) => {
  return (
    <div
      class={cn(
        "flex flex-col space-y-2 text-center sm:text-left",
        props.class
      )}
    >
      {props.children}
    </div>
  );
};

const Footer = (props) => {
  const { className } = props;
  const c = children(() => props.children);
  return (
    <div
      class={cn(
        "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
        className
      )}
    >
      {c()}
    </div>
  );
};

const Title = (props: {} & JSX.HTMLAttributes<HTMLElement>) => {
  const { title } = props;
  return (
    <div
      class={cn(
        "text-lg font-semibold text-slate-900",
        "dark:text-slate-50",
        props.children
      )}
    >
      {title}
    </div>
  );
};

const Submit = (
  props: { store: DialogCore } & JSX.HTMLAttributes<HTMLButtonElement>
) => {
  const { store } = props;

  return <Button store={store.okBtn}>{props.children}</Button>;
};

const Cancel = (
  props: { store: DialogCore } & JSX.HTMLAttributes<HTMLButtonElement>
) => {
  const { store } = props;

  return <Button store={store.cancelBtn}>{props.children}</Button>;
};

function getState(open: boolean) {
  return open ? "open" : "closed";
}

export {
  Root,
  Portal,
  Header,
  Title,
  Content,
  Overlay,
  Footer,
  Submit,
  Cancel,
};
