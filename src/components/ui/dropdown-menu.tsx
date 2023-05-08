/**
 * @file 下拉菜单
 */
import { For, createSignal, onCleanup, JSX } from "solid-js";
import { ChevronRight } from "lucide-solid";

import { DropdownMenuCore } from "@/domains/ui/dropdown-menu";
import { MenuItemCore } from "@/domains/ui/menu/item";
import { MenuCore } from "@/domains/ui/menu";
import { cn } from "@/utils";

import * as Menu from "./menu";

export const DropdownMenu = (props: {
  store: DropdownMenuCore;
  children: JSX.Element;
}) => {
  const { store } = props;

  const [state, setState] = createSignal(store.state);
  store.onStateChange((nextState) => {
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
              if (item.menu) {
                return <ItemWithSub menu={item.menu} store={item} />;
              }
              return (
                <Item class="DropdownMenuItem" store={item}>
                  {/* New Private Window <div class="RightSlot">⇧+⌘+N</div> */}
                  {item.label}
                </Item>
              );
            }}
          </For>
          {/* <DropdownMenuArrow class="DropdownMenuArrow" /> */}
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
    <Sub store={item.menu}>
      <SubTrigger class="DropdownMenuSubTrigger" parent={menu} store={item}>
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

// const DropdownMenuContext = createContext<DropdownMenuCore>();
const Root = (
  props: {
    store: DropdownMenuCore;
  } & JSX.HTMLAttributes<HTMLElement>
) => {
  const { store } = props;

  onCleanup(() => {
    store.destroy();
  });

  return <Menu.Root store={store.menu}>{props.children}</Menu.Root>;
};

/* -------------------------------------------------------------------------------------------------
 * DropdownMenuTrigger
 * -----------------------------------------------------------------------------------------------*/
const Trigger = (
  props: {
    store: DropdownMenuCore;
  } & JSX.HTMLAttributes<HTMLElement>
) => {
  const { store } = props;

  // const store = useContext(DropdownMenuContext);
  const [state, setState] = createSignal(store.state);
  store.onStateChange((nextState) => {
    setState(nextState);
  });

  const disabled = () => state().disabled;

  return (
    <Menu.Anchor store={store.menu}>
      <button
        onPointerDown={() => {
          store.toggle();
        }}
        onKeyDown={(event) => {
          if (disabled) {
            return;
          }
          if (["Enter", " "].includes(event.key)) {
            store.toggle();
            return;
          }
          if (event.key === "ArrowDown") {
            // context.onOpenChange(true)
          }
          // prevent keydown from scrolling window / first focused item to execute
          // that keydown (inadvertently closing the menu)
          if (["Enter", " ", "ArrowDown"].includes(event.key)) {
            event.preventDefault();
          }
        }}
      >
        {props.children}
      </button>
    </Menu.Anchor>
  );
};

/* -------------------------------------------------------------------------------------------------
 * DropdownMenuPortal
 * -----------------------------------------------------------------------------------------------*/
const Portal = (
  props: {
    store: MenuCore;
  } & JSX.HTMLAttributes<HTMLElement>
) => {
  const { store } = props;
  // const store = useContext(DropdownMenuContext);

  return <Menu.Portal store={store}>{props.children}</Menu.Portal>;
};

/* -------------------------------------------------------------------------------------------------
 * DropdownMenuContent
 * -----------------------------------------------------------------------------------------------*/
const Content = (
  props: {
    store: DropdownMenuCore;
  } & JSX.HTMLAttributes<HTMLElement>
) => {
  const { store } = props;

  // onCleanup(() => {
  //   console.log("DropdownMenu is cleanup");
  // });

  return (
    <Menu.Content class={cn(props.class)} store={store.menu}>
      {props.children}
    </Menu.Content>
  );
};

/* -------------------------------------------------------------------------------------------------
 * DropdownMenuGroup
 * -----------------------------------------------------------------------------------------------*/
const Group = (props: { store: DropdownMenuCore; children: JSX.Element }) => {
  const { store } = props;
  return <Menu.Group>{props.children}</Menu.Group>;
};

/* -------------------------------------------------------------------------------------------------
 * DropdownMenuLabel
 * -----------------------------------------------------------------------------------------------*/
const Label = (
  props: {
    // store: DropdownMenuCore;
  } & JSX.HTMLAttributes<HTMLElement>
) => {
  return <Menu.Label class={props.class}>{props.children}</Menu.Label>;
};

/* -------------------------------------------------------------------------------------------------
 * DropdownMenuItem
 * -----------------------------------------------------------------------------------------------*/
const Item = (
  props: {
    store: MenuItemCore;
  } & JSX.HTMLAttributes<HTMLElement>
) => {
  const { store } = props;
  // const store = useContext(DropdownMenuContext);

  return (
    <Menu.Item class={props.class} store={store}>
      {props.children}
    </Menu.Item>
  );
};

/* -------------------------------------------------------------------------------------------------
 * DropdownMenuSeparator
 * -----------------------------------------------------------------------------------------------*/
const Separator = (props: { class?: string }) => {
  return <Menu.Separator class={props.class}></Menu.Separator>;
};

/* -------------------------------------------------------------------------------------------------
 * DropdownMenuArrow
 * -----------------------------------------------------------------------------------------------*/
const Arrow = (
  props: {
    store: DropdownMenuCore;
  } & JSX.HTMLAttributes<HTMLElement>
) => {
  const { store } = props;
  return (
    <Menu.Arrow store={store.menu} class={props.class}>
      {props.children}
    </Menu.Arrow>
  );
};

/* -------------------------------------------------------------------------------------------------
 * DropdownMenuSub
 * -----------------------------------------------------------------------------------------------*/
const Sub = (
  props: {
    store: MenuCore;
    // children: JSX.Element;
  } & JSX.HTMLAttributes<HTMLElement>
) => {
  const { store } = props;
  // const store = useContext(DropdownMenuContext);

  return <Menu.Sub store={store}>{props.children}</Menu.Sub>;
};

/* -------------------------------------------------------------------------------------------------
 * DropdownMenuSubTrigger
 * -----------------------------------------------------------------------------------------------*/
const SubTrigger = (
  props: {
    parent: MenuCore;
    store: MenuItemCore;
  } & JSX.HTMLAttributes<HTMLElement>
) => {
  const { store } = props;
  // const store = useContext(DropdownMenuContext);

  return (
    <Menu.SubTrigger class={props.class} store={store}>
      {props.children}
    </Menu.SubTrigger>
  );
};

/* -------------------------------------------------------------------------------------------------
 * DropdownMenuSubContent
 * -----------------------------------------------------------------------------------------------*/
const SubContent = (
  props: {
    store: MenuCore;
  } & JSX.HTMLAttributes<HTMLElement>
) => {
  const { store } = props;
  // const store = useContext()

  return (
    <Menu.SubContent class={props.class}>{props.children}</Menu.SubContent>
  );
};

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
