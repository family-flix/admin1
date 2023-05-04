import { createContext, createSignal, onCleanup, useContext } from "solid-js";
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
      <DropdownMenuTrigger>{props.children}</DropdownMenuTrigger>
      <DropdownMenuPortal>
        <DropdownMenuContent class="DropdownMenuContent">
          <DropdownMenuItem class="DropdownMenuItem" disabled>
            New Private Window <div class="RightSlot">⇧+⌘+N</div>
          </DropdownMenuItem>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger class="DropdownMenuSubTrigger">
              More Tools
              <div class="RightSlot">
                <ChevronRight width={15} height={15} />
              </div>
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent class="DropdownMenuSubContent">
                <DropdownMenuItem class="DropdownMenuItem">
                  Save Page As… <div class="RightSlot">⌘+S</div>
                </DropdownMenuItem>
                <DropdownMenuItem class="DropdownMenuItem">
                  Create Shortcut…
                </DropdownMenuItem>
                <DropdownMenuItem class="DropdownMenuItem">
                  Name Window…
                </DropdownMenuItem>
                <DropdownMenuSeparator class="DropdownMenu.Separator" />
                <DropdownMenuItem class="DropdownMenuItem">
                  Developer Tools
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
          <DropdownMenuSeparator class="DropdownMenuSeparator" />
          <DropdownMenuLabel class="DropdownMenuLabel">
            People
          </DropdownMenuLabel>
          {/* <DropdownMenuArrow class="DropdownMenuArrow" /> */}
        </DropdownMenuContent>
      </DropdownMenuPortal>
    </DropdownMenuRoot>
  );
};

const DropdownMenuContext = createContext<DropdownMenuCore>();
const DropdownMenuRoot = (props: {
  store?: DropdownMenuCore;
  children: JSX.Element;
}) => {
  const { store } = props;

  onCleanup(() => {
    store.destroy();
  });

  return (
    <DropdownMenuContext.Provider value={store}>
      <Menu.Root store={store.menu}>{props.children}</Menu.Root>
    </DropdownMenuContext.Provider>
  );
};

/* -------------------------------------------------------------------------------------------------
 * DropdownMenuTrigger
 * -----------------------------------------------------------------------------------------------*/
const DropdownMenuTrigger = (props: {
  // store?: DropdownMenuCore;
  children: JSX.Element;
}) => {
  // const { store } = props;

  const store = useContext(DropdownMenuContext);
  const [state, setState] = createSignal(store.state);

  const disabled = () => state().disabled;

  return (
    <Menu.Anchor>
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
  // store?: DropdownMenuCore;
  children: JSX.Element;
}) => {
  // const { store } = props;
  // const store = useContext(DropdownMenuContext);

  return <Menu.Portal>{props.children}</Menu.Portal>;
};

/* -------------------------------------------------------------------------------------------------
 * DropdownMenuContent
 * -----------------------------------------------------------------------------------------------*/
const DropdownMenuContent = (props: {
  // store?: DropdownMenuCore;
  class?: string;
  children: JSX.Element;
}) => {
  return <Menu.Content class={cn(props.class)}>{props.children}</Menu.Content>;
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
  // store?: DropdownMenuCore;
  class?: string;
  disabled?: boolean;
  children: JSX.Element;
}) => {
  // const { store } = props;
  // const store = useContext(DropdownMenuContext);

  return (
    <Menu.Item class={props.class} disabled={props.disabled}>
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
  // store: DropdownMenuCore;
  class?: string;
  children?: JSX.Element;
}) => {
  // const { store } = props;
  return (
    <Menu.Arrow
      // store={store.menu}
      class={props.class}
    >
      {props.children}
    </Menu.Arrow>
  );
};

/* -------------------------------------------------------------------------------------------------
 * DropdownMenuSub
 * -----------------------------------------------------------------------------------------------*/
const DropdownMenuSub = (props: {
  // store?: DropdownMenuCore;
  children: JSX.Element;
}) => {
  // const { store } = props;
  // const store = useContext(DropdownMenuContext);

  return (
    <Menu.Sub
    // store={store.menu}
    >
      {props.children}
    </Menu.Sub>
  );
};

/* -------------------------------------------------------------------------------------------------
 * DropdownMenuSubTrigger
 * -----------------------------------------------------------------------------------------------*/
const DropdownMenuSubTrigger = (props: {
  store?: DropdownMenuCore;
  class?: string;
  children: JSX.Element;
}) => {
  // const { store } = props;
  // const store = useContext(DropdownMenuContext);

  return (
    <Menu.SubTrigger class={props.class}>{props.children}</Menu.SubTrigger>
  );
};

/* -------------------------------------------------------------------------------------------------
 * DropdownMenuSubContent
 * -----------------------------------------------------------------------------------------------*/
const DropdownMenuSubContent = (props: {
  // store: DropdownMenuCore;
  class?: string;
  children: JSX.Element;
}) => {
  // const { store } = props;
  // const store = useContext()

  return (
    <Menu.SubContent class={props.class}>{props.children}</Menu.SubContent>
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
