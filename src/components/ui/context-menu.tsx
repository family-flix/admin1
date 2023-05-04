import { createContext, onMount, useContext } from "solid-js";
import { JSX } from "solid-js/jsx-runtime";

import { ContextMenuCore } from "@/domains/ui/context-menu";
import * as Menu from "@/components/ui/menu";

const ContextMenuContext = createContext<ContextMenuCore>();

export const ContextMenuRoot = (props: {
  store: ContextMenuCore;
  children: JSX.Element;
}) => {
  const { store } = props;
  return (
    <ContextMenuContext.Provider value={store}>
      <Menu.Root store={store.menu}>{props.children}</Menu.Root>
    </ContextMenuContext.Provider>
  );
};

export const ContextMenuTrigger = (props: {
  class?: string;
  children: JSX.Element;
}) => {
  const store = useContext(ContextMenuContext);
  let $span: HTMLSpanElement;

  onMount(() => {
    store.menu.popper.setReference($span.getBoundingClientRect());
  });

  return (
    <span
      ref={$span}
      style={{ "-webkit-touch-callout": "none" }}
      onContextMenu={(event) => {
        event.preventDefault();
        store.log("onContextMenu");
        store.menu.popper.updateReference({
          width: 0,
          height: 0,
          x: event.clientX,
          y: event.clientY,
        });
        store.menu.show();
      }}
      onPointerDown={() => {
        // ...
      }}
      onPointerMove={() => {
        // ...
      }}
      onPointerCancel={() => {
        // ...
      }}
      onPointerUp={() => {
        // ...
      }}
    >
      {props.children}
    </span>
  );
};

export const ContextMenuPortal = (props: { children: JSX.Element }) => {
  return <Menu.Portal>{props.children}</Menu.Portal>;
};

export const ContextMenuContent = (props: {
  class?: string;
  children: JSX.Element;
}) => {
  return <Menu.Content class={props.class}>{props.children}</Menu.Content>;
};

export const ContextMenuGroup = (props: { children: JSX.Element }) => {
  return <Menu.Group>{props.children}</Menu.Group>;
};

export const ContextMenuLabel = (props: {
  class?: string;
  children: JSX.Element;
}) => {
  return <Menu.Label class={props.class}>{props.children}</Menu.Label>;
};

export const ContextMenuItem = (props: {
  class?: string;
  children: JSX.Element;
}) => {
  return <Menu.Item class={props.class}>{props.children}</Menu.Item>;
};

export const ContextMenuSeparator = (props: {
  class?: string;
  children?: JSX.Element;
}) => {
  return <Menu.Separator class={props.class}></Menu.Separator>;
};

export const ContextMenuArrow = (props: {
  class?: string;
  children: JSX.Element;
}) => {
  return <Menu.Arrow class={props.class}>{props.children}</Menu.Arrow>;
};

export const ContextMenuSub = (props: {
  class?: string;
  children: JSX.Element;
}) => {
  return <Menu.Sub>{props.children}</Menu.Sub>;
};

export const ContextMenuSubTrigger = (props: {
  class?: string;
  children: JSX.Element;
}) => {
  return (
    <Menu.SubTrigger class={props.class}>{props.children}</Menu.SubTrigger>
  );
};

export const ContextMenuSubContent = (props: {
  class?: string;
  children: JSX.Element;
}) => {
  return (
    <Menu.SubContent class={props.class}>{props.children}</Menu.SubContent>
  );
};

const Root = ContextMenuRoot;
const Trigger = ContextMenuTrigger;
const Portal = ContextMenuPortal;
const Content = ContextMenuContent;
const Group = ContextMenuGroup;
const Label = ContextMenuLabel;
const Item = ContextMenuItem;
const Separator = ContextMenuSeparator;
const Arrow = ContextMenuArrow;
const Sub = ContextMenuSub;
const SubTrigger = ContextMenuSubTrigger;
const SubContent = ContextMenuSubContent;

export {
  Root,
  Trigger,
  Portal,
  Content,
  Group,
  Label,
  Item,
  Separator,
  Arrow,
  Sub,
  SubTrigger,
  SubContent,
};
