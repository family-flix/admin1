import { createSignal } from "solid-js";
import { DropdownMenuCore } from "@/domains/ui/dropdown-menu";
import { JSX } from "solid-js/jsx-runtime";
import { ChevronRight, Hammer } from "lucide-solid";

import * as Menu from "./menu";
import { cn } from "@/utils";
import { MenuCore } from "@/domains/ui/menu";

export const DropdownMenu = (props: {
  store: DropdownMenuCore;
  children: JSX.Element;
}) => {
  const { store } = props;
  return (
    <DropdownMenuRoot store={store}>
      <DropdownMenuTrigger store={store}>{props.children}</DropdownMenuTrigger>
      <DropdownMenuPortal store={store}>
        <DropdownMenuContent store={store} class="DropdownMenuContent">
          <DropdownMenuItem store={store} class="DropdownMenuItem">
            New Tab <div class="RightSlot">⌘+T</div>
          </DropdownMenuItem>
          <DropdownMenuItem store={store} class="DropdownMenuItem">
            New Window <div class="RightSlot">⌘+N</div>
          </DropdownMenuItem>
          <DropdownMenuItem store={store} class="DropdownMenuItem" disabled>
            New Private Window <div class="RightSlot">⇧+⌘+N</div>
          </DropdownMenuItem>
          <DropdownMenuSub store={store}>
            <DropdownMenuSubTrigger
              store={store}
              class="DropdownMenuSubTrigger"
            >
              More Tools
              <div class="RightSlot">
                <ChevronRight />
              </div>
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent
                store={store}
                class="DropdownMenuSubContent"
              >
                <DropdownMenuItem class="DropdownMenuItem">
                  Save Page As… <div class="RightSlot">⌘+S</div>
                </DropdownMenuItem>
                <DropdownMenuItem class="DropdownMenuItem">
                  Create Shortcut…
                </DropdownMenuItem>
                <DropdownMenuItem store={sub} class="DropdownMenuItem">
                  Name Window…
                </DropdownMenuItem>
                <DropdownMenuSeparator class="DropdownMenu.Separator" />
                <DropdownMenuItem store={sub} class="DropdownMenuItem">
                  Developer Tools
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
          {/* <DropdownMenuSeparator class="DropdownMenuSeparator" /> */}
          <DropdownMenuSeparator class="DropdownMenuSeparator" />
          <DropdownMenuLabel class="DropdownMenuLabel">
            People
          </DropdownMenuLabel>
          <DropdownMenuArrow store={store} class="DropdownMenuArrow" />
        </DropdownMenuContent>
      </DropdownMenuPortal>
    </DropdownMenuRoot>
  );
};

const DropdownMenuRoot = (props: {
  store: DropdownMenuCore;
  children: JSX.Element;
}) => {
  const { store } = props;
  return <Menu.Root store={store.menu}>{props.children}</Menu.Root>;
};

/* -------------------------------------------------------------------------------------------------
 * DropdownMenuTrigger
 * -----------------------------------------------------------------------------------------------*/
const DropdownMenuTrigger = (props: {
  store: DropdownMenuCore;
  children: JSX.Element;
}) => {
  const { store } = props;

  const [state, setState] = createSignal(store.state);

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
const DropdownMenuPortal = (props: {
  store: DropdownMenuCore;
  children: JSX.Element;
}) => {
  const { store } = props;
  return <Menu.Portal store={store.menu}>{props.children}</Menu.Portal>;
};

/* -------------------------------------------------------------------------------------------------
 * DropdownMenuContent
 * -----------------------------------------------------------------------------------------------*/
const DropdownMenuContent = (props: {
  store: DropdownMenuCore;
  class?: string;
  children: JSX.Element;
}) => {
  const { store } = props;
  return (
    <Menu.Content store={store.menu} class={cn(props.class)}>
      {props.children}
    </Menu.Content>
  );
};

/* -------------------------------------------------------------------------------------------------
 * DropdownMenuGroup
 * -----------------------------------------------------------------------------------------------*/
const DropdownMenuGroup = (props: {
  store: DropdownMenuCore;
  children: JSX.Element;
}) => {
  const { store } = props;
  return <Menu.Group>{props.children}</Menu.Group>;
};

/* -------------------------------------------------------------------------------------------------
 * DropdownMenuLabel
 * -----------------------------------------------------------------------------------------------*/
const DropdownMenuLabel = (props: {
  //   store?: DropdownMenuCore;
  class?: string;
  children: JSX.Element;
}) => {
  return <Menu.Label class={props.class}>{props.children}</Menu.Label>;
};

/* -------------------------------------------------------------------------------------------------
 * DropdownMenuItem
 * -----------------------------------------------------------------------------------------------*/
const DropdownMenuItem = (props: {
  store: DropdownMenuCore;
  class?: string;
  disabled?: boolean;
  children: JSX.Element;
}) => {
  const { store } = props;
  return (
    <Menu.Item store={store.menu} class={props.class} disabled={props.disabled}>
      {props.children}
    </Menu.Item>
  );
};

/* -------------------------------------------------------------------------------------------------
 * DropdownMenuSeparator
 * -----------------------------------------------------------------------------------------------*/
const DropdownMenuSeparator = (props: { class?: string }) => {
  return <Menu.Separator class={props.class}></Menu.Separator>;
};

/* -------------------------------------------------------------------------------------------------
 * DropdownMenuArrow
 * -----------------------------------------------------------------------------------------------*/
const DropdownMenuArrow = (props: {
  store: DropdownMenuCore;
  class?: string;
  children?: JSX.Element;
}) => {
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
const DropdownMenuSub = (props: {
  store: DropdownMenuCore;
  children: JSX.Element;
}) => {
  const { store } = props;
  return <Menu.Sub store={store.menu}>{props.children}</Menu.Sub>;
};

/* -------------------------------------------------------------------------------------------------
 * DropdownMenuSubTrigger
 * -----------------------------------------------------------------------------------------------*/
const DropdownMenuSubTrigger = (props: {
  store: DropdownMenuCore;
  class?: string;
  children: JSX.Element;
}) => {
  const { store } = props;
  return (
    <Menu.SubTrigger store={store.menu} class={props.class}>
      {props.children}
    </Menu.SubTrigger>
  );
};

/* -------------------------------------------------------------------------------------------------
 * DropdownMenuSubContent
 * -----------------------------------------------------------------------------------------------*/
const DropdownMenuSubContent = (props: {
  store: DropdownMenuCore;
  class?: string;
  children: JSX.Element;
}) => {
  const { store } = props;
  return (
    <Menu.SubContent store={store.menu} class={props.class}>
      {props.children}
    </Menu.SubContent>
  );
};

const Root = DropdownMenuRoot;
const Trigger = DropdownMenuTrigger;
const Portal = DropdownMenuPortal;
const Content = DropdownMenuContent;
const Group = DropdownMenuGroup;
const Label = DropdownMenuLabel;
const Item = DropdownMenuItem;
// const CheckboxItem = DropdownMenuCheckboxItem;
// const RadioGroup = DropdownMenuRadioGroup;
// const RadioItem = DropdownMenuRadioItem;
// const ItemIndicator = DropdownMenuItemIndicator;
const Separator = DropdownMenuSeparator;
const Arrow = DropdownMenuArrow;
const Sub = DropdownMenuSub;
const SubTrigger = DropdownMenuSubTrigger;
const SubContent = DropdownMenuSubContent;

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
