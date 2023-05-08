/**
 * @file 右键菜单
 */
import { For, createContext, createSignal, onMount, JSX } from "solid-js";
import { ChevronRight } from "lucide-solid";

import { ContextMenuCore } from "@/domains/ui/context-menu";
import * as Menu from "@/components/ui/menu";
import { MenuCore } from "@/domains/ui/menu";
import { MenuItemCore } from "@/domains/ui/menu/item";

export const ContextMenu = (
  props: { store: ContextMenuCore } & JSX.HTMLAttributes<HTMLElement>
) => {
  const { store } = props;

  const [state, setState] = createSignal(store.state);
  store.onStateChange((nextState) => {
    console.log("[]store.onStateChange", nextState.items);
    setState(nextState);
  });

  const items = () => state().items;

  return (
    <Root store={store}>
      <Trigger store={store}>{props.children}</Trigger>
      <Portal store={store.menu}>
        <Content class="DropdownMenuContent" store={store}>
          <For each={items()}>
            {(item) => {
              const { label } = item;
              if (item.menu) {
                return (
                  <ItemWithSub menu={store.menu} store={item}></ItemWithSub>
                );
              }
              return (
                <Item class="DropdownMenuItem" store={item}>
                  {label}
                </Item>
              );
            }}
          </For>
        </Content>
      </Portal>
    </Root>
  );
};

const ItemWithSub = (
  props: {
    menu: MenuCore;
    store: MenuItemCore;
  } & JSX.HTMLAttributes<HTMLElement>
) => {
  const { menu, store: item } = props;
  const [itemState, setItemState] = createSignal(item.state);
  const [state, setState] = createSignal(item.menu.state);
  item.onStateChange((nextState) => {
    setItemState(nextState);
  });
  item.menu.onStateChange((nextState) => {
    setState(nextState);
  });

  const items = () => state().items;
  const label = () => itemState().label;

  return (
    <Sub subMenu={item.menu}>
      <SubTrigger class="DropdownMenuSubTrigger" parent={menu} item={item}>
        {label()}
        <div class="RightSlot">
          <ChevronRight width={15} height={15} />
        </div>
      </SubTrigger>
      <Portal store={item.menu}>
        <SubContent class="DropdownMenuSubContent" store={item.menu}>
          <For each={items()}>
            {(ii) => {
              const { label } = ii;
              if (ii.menu) {
                return <ItemWithSub menu={item.menu} store={ii}></ItemWithSub>;
              }
              return (
                <Item class="DropdownMenuItem" store={ii}>
                  {label}
                </Item>
              );
            }}
          </For>
        </SubContent>
      </Portal>
    </Sub>
  );
};

// const ContextMenuContext = createContext<ContextMenuCore>();
const Root = (
  props: {
    store: ContextMenuCore;
  } & JSX.HTMLAttributes<HTMLElement>
) => {
  const { store } = props;
  return <Menu.Root store={store.menu}>{props.children}</Menu.Root>;
};

/**
 * 点击展示菜单
 */
const Trigger = (
  props: { store: ContextMenuCore } & JSX.HTMLAttributes<HTMLElement>
) => {
  const { store: contextMenu } = props;
  // const store = useContext(ContextMenuContext);
  let $span: HTMLSpanElement;

  onMount(() => {
    contextMenu.setReference({
      getRect() {
        console.log("[ContextMenuTrigger]get reference rect", $span);
        return $span.getBoundingClientRect();
      },
    });
  });

  return (
    <span
      ref={$span}
      style={{ "-webkit-touch-callout": "none" }}
      onContextMenu={(event) => {
        event.preventDefault();
        const size = $span.getBoundingClientRect();
        const { x, y } = size;
        contextMenu.show({ x, y });
        contextMenu.updateReference({
          getRect() {
            const size = $span.getBoundingClientRect();
            const { width, height, top, left, right, bottom } = size;
            return {
              width,
              height,
              top,
              left,
              right,
              bottom,
              x: event.clientX,
              y: event.clientY,
            };
          },
        });
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
const Portal = (
  props: { store: MenuCore } & JSX.HTMLAttributes<HTMLElement>
) => {
  const { store } = props;
  return <Menu.Portal store={store}>{props.children}</Menu.Portal>;
};
const Content = (
  props: { store: ContextMenuCore } & JSX.HTMLAttributes<HTMLElement>
) => {
  const { store } = props;
  return (
    <Menu.Content class={props.class} store={store.menu}>
      {props.children}
    </Menu.Content>
  );
};
const Group = (props: {} & JSX.HTMLAttributes<HTMLElement>) => {
  return <Menu.Group>{props.children}</Menu.Group>;
};
const Label = (props: {} & JSX.HTMLAttributes<HTMLElement>) => {
  return <Menu.Label class={props.class}>{props.children}</Menu.Label>;
};
const Item = (
  props: { store: MenuItemCore } & JSX.HTMLAttributes<HTMLElement>
) => {
  const { store } = props;
  return (
    <Menu.Item class={props.class} store={store}>
      {props.children}
    </Menu.Item>
  );
};
const Separator = (props: {} & JSX.HTMLAttributes<HTMLElement>) => {
  return <Menu.Separator class={props.class}></Menu.Separator>;
};
const Arrow = (
  props: { store: MenuCore } & JSX.HTMLAttributes<HTMLElement>
) => {
  const { store } = props;

  return (
    <Menu.Arrow class={props.class} store={store}>
      {props.children}
    </Menu.Arrow>
  );
};
const Sub = (
  props: { subMenu: MenuCore } & JSX.HTMLAttributes<HTMLElement>
) => {
  const { subMenu } = props;
  return <Menu.Sub store={subMenu}>{props.children}</Menu.Sub>;
};
const SubTrigger = (
  props: {
    parent: MenuCore;
    item: MenuItemCore;
  } & JSX.HTMLAttributes<HTMLElement>
) => {
  const { item } = props;
  return (
    <Menu.SubTrigger class={props.class} store={item}>
      {props.children}
    </Menu.SubTrigger>
  );
};
const SubContent = (
  props: { store: MenuCore } & JSX.HTMLAttributes<HTMLElement>
) => {
  const { store } = props;
  return (
    <Menu.SubContent class={props.class} store={store}>
      {props.children}
    </Menu.SubContent>
  );
};
// const Root = ContextMenuRoot;
// const Trigger = ContextMenuTrigger;
// const Portal = ContextMenuPortal;
// const Content = ContextMenuContent;
// const Group = ContextMenuGroup;
// const Label = ContextMenuLabel;
// const Item = ContextMenuItem;
// const Separator = ContextMenuSeparator;
// const Arrow = ContextMenuArrow;
// const Sub = ContextMenuSub;
// const SubTrigger = ContextMenuSubTrigger;
// const SubContent = ContextMenuSubContent;
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
