/**
 * @file 下拉菜单
 */
import { For, createSignal, JSX } from "solid-js";
import { ChevronRight } from "lucide-solid";

import { DropdownMenuCore } from "@/domains/ui/dropdown-menu";
import { MenuItemCore } from "@/domains/ui/menu/item";
import { MenuCore } from "@/domains/ui/menu";
import { Show } from "@/packages/ui/show";
import { cn } from "@/utils";

import * as DropdownMenuPrimitive from "@/packages/ui/dropdown-menu";

export const DropdownMenu = (props: { store: DropdownMenuCore } & JSX.HTMLAttributes<HTMLElement>) => {
  const { store } = props;

  const [state, setState] = createSignal(store.state);
  store.onStateChange((nextState) => {
    setState(nextState);
  });

  const items = () => state().items;

  return (
    <DropdownMenuPrimitive.Root store={store}>
      <DropdownMenuPrimitive.Trigger store={store}>{props.children}</DropdownMenuPrimitive.Trigger>
      <DropdownMenuPrimitive.Portal store={store.menu}>
        <DropdownMenuPrimitive.Content
          class={cn(
            "z-50 min-w-[8rem] overflow-hidden rounded-md border border-slate-100 bg-white p-1 text-slate-700 shadow-md animate-in data-[side=right]:slide-in-from-left-2 data-[side=left]:slide-in-from-right-2 data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-400",
            props.class
          )}
          store={store}
        >
          <For each={items()}>
            {(item) => {
              if (item.menu) {
                return <ItemWithSubMenu menu={item.menu} store={item} />;
              }
              return (
                <DropdownMenuPrimitive.Item
                  class={cn(
                    "relative flex cursor-default select-none items-center rounded-sm py-1.5 px-2 text-sm font-medium outline-none  data-[disabled]:pointer-events-none data-[disabled]:opacity-50 dark:focus:bg-slate-700",
                    // "pl-8"
                    "focus:bg-slate-100"
                  )}
                  store={item}
                >
                  <Show when={!!item.icon}>{item.icon as Element}</Show>
                  {item.label}
                  <Show when={item.shortcut}>{item.shortcut}</Show>
                </DropdownMenuPrimitive.Item>
              );
            }}
          </For>
          {/* <DropdownMenuArrow class="DropdownMenuArrow" /> */}
        </DropdownMenuPrimitive.Content>
      </DropdownMenuPrimitive.Portal>
    </DropdownMenuPrimitive.Root>
  );
};

const ItemWithSubMenu = (
  props: {
    menu: MenuCore;
    store: MenuItemCore;
  } & JSX.HTMLAttributes<HTMLElement>
) => {
  const { store: item, menu: subMenu } = props;

  const [itemState, setItemState] = createSignal(item.state);
  const [state, setState] = createSignal(subMenu.state);

  item.onStateChange((nextState) => {
    setItemState(nextState);
  });
  subMenu.onStateChange((nextState) => {
    setState(nextState);
  });

  const items = () => state().items;
  const label = () => itemState().label;

  return (
    <DropdownMenuPrimitive.Sub store={subMenu}>
      <DropdownMenuPrimitive.SubTrigger
        class={cn(
          "flex cursor-default select-none items-center rounded-sm py-1.5 px-2 text-sm font-medium outline-none focus:bg-slate-100 data-[state=open]:bg-slate-100 dark:focus:bg-slate-700 dark:data-[state=open]:bg-slate-700",
          // "pl-8",
          props.class
        )}
        parent={subMenu}
        store={item}
      >
        {label()}
        <div class="ml-auto h-4 w-4">
          <ChevronRight width={15} height={15} />
        </div>
      </DropdownMenuPrimitive.SubTrigger>
      <DropdownMenuPrimitive.Portal store={subMenu}>
        <DropdownMenuPrimitive.SubContent
          class={cn(
            "z-50 min-w-[8rem] overflow-hidden rounded-md border border-slate-100 bg-white p-1 text-slate-700 shadow-md animate-in slide-in-from-left-1 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-400",
            props.class
          )}
          store={subMenu}
        >
          <For each={items()}>
            {(ii) => {
              const { label } = ii;
              if (ii.menu) {
                return <ItemWithSubMenu menu={subMenu} store={ii}></ItemWithSubMenu>;
              }
              return (
                <DropdownMenuPrimitive.Item
                  class={cn(
                    "relative flex cursor-default select-none items-center rounded-sm py-1.5 px-2 text-sm font-medium outline-none focus:bg-slate-100 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 dark:focus:bg-slate-700"
                    // "pl-8"
                  )}
                  store={ii}
                >
                  {label}
                </DropdownMenuPrimitive.Item>
              );
            }}
          </For>
        </DropdownMenuPrimitive.SubContent>
      </DropdownMenuPrimitive.Portal>
    </DropdownMenuPrimitive.Sub>
  );
};
