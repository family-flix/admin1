/**
 * @file 菜单 组件
 */
import { JSX } from "solid-js/jsx-runtime";
import { Portal as PortalPrimitive } from "solid-js/web";

import { MenuCore } from "@/domains/ui/menu";
import { MenuItemCore } from "@/domains/ui/menu/item";

import * as Popper from "./popper";
import { Presence } from "./presence";
import { DismissableLayer } from "./dismissable-layer";
import * as Collection from "./collection";
import { cn } from "@/utils";
import {
  createContext,
  createSignal,
  onCleanup,
  onMount,
  useContext,
} from "solid-js";

export type Menu = {};
export const Menu = (props: { options: {}[] }) => {};

/* -------------------------------------------------------------------------------------------------
 * MenuRoot
 * -----------------------------------------------------------------------------------------------*/
const MenuContext = createContext<MenuCore>();
const MenuRoot = (props: { store: MenuCore; children: JSX.Element }) => {
  const { store } = props;

  onCleanup(() => {
    store.destroy();
  });

  return (
    <Popper.Root store={store.popper}>
      <MenuContext.Provider value={store}>
        {props.children}
      </MenuContext.Provider>
    </Popper.Root>
  );
};

/* -------------------------------------------------------------------------------------------------
 * MenuAnchor
 * -----------------------------------------------------------------------------------------------*/
const MenuAnchor = (props: {
  // store?: MenuCore;
  ref?: HTMLElement;
  class?: string;
  children?: JSX.Element;
}) => {
  // const { store } = props;
  const store = useContext(MenuContext);

  return (
    <Popper.Anchor store={store.popper} class={props.class}>
      {props.children}
    </Popper.Anchor>
  );
};

/* -------------------------------------------------------------------------------------------------
 * MenuPortal
 * -----------------------------------------------------------------------------------------------*/
const MenuPortal = (props: {
  // store?: MenuCore;
  children: JSX.Element;
}) => {
  // const { store } = props;
  // const store = useContext(MenuContentContext);
  const store = useContext(MenuContext);

  return (
    <Presence store={store.presence}>
      <PortalPrimitive>{props.children}</PortalPrimitive>
    </Presence>
  );
};

/* -------------------------------------------------------------------------------------------------
 * MenuContent
 * -----------------------------------------------------------------------------------------------*/
const MenuContent = (props: {
  // store: MenuCore;
  class?: string;
  children: JSX.Element;
}) => {
  // const { store } = props;
  const store = useContext(MenuContext);

  return (
    <Presence store={store.presence}>
      <MenuContentNonModal store={store} class={props.class}>
        {props.children}
      </MenuContentNonModal>
    </Presence>
  );
};
// 这里多一个，是因为还存在 MenuContentModal 场景，这两个和 MenuSubContent 都复用 MenuContentImpl
const MenuContentNonModal = (props: {
  store: MenuCore;
  class?: string;
  children: JSX.Element;
}) => {
  const { store } = props;
  return (
    <MenuContentImpl store={store} class={props.class}>
      {props.children}
    </MenuContentImpl>
  );
};

const MenuContentContext = createContext<MenuCore>();
const MenuContentImpl = (props: {
  store: MenuCore;
  class?: string;
  children: JSX.Element;
}) => {
  const { store } = props;

  return (
    <MenuContentContext.Provider value={store}>
      <DismissableLayer store={store.layer}>
        <Popper.Content store={store.popper} class={props.class}>
          {props.children}
        </Popper.Content>
      </DismissableLayer>
    </MenuContentContext.Provider>
  );
};

/* -------------------------------------------------------------------------------------------------
 * MenuGroup
 * -----------------------------------------------------------------------------------------------*/
const MenuGroup = (props: { children: JSX.Element }) => {
  return <div>{props.children}</div>;
};

/* -------------------------------------------------------------------------------------------------
 * MenuLabel
 * -----------------------------------------------------------------------------------------------*/
const MenuLabel = (props: { class?: string; children: JSX.Element }) => {
  return <div class={props.class}>{props.children}</div>;
};

/* -------------------------------------------------------------------------------------------------
 * MenuItem
 * -----------------------------------------------------------------------------------------------*/
const MenuItem = (props: {
  // store: MenuCore;
  class?: string;
  disabled?: boolean;
  children: JSX.Element;
}) => {
  // const { store } = props;

  return <MenuItemImpl class={props.class}>{props.children}</MenuItemImpl>;
};
const MenuItemImpl = (props: {
  store?: MenuCore;
  class?: string;
  children: JSX.Element;
}) => {
  // const { store } = props;
  // const parent = useContext(MenuContext);
  let $item: HTMLDivElement;
  const store = useContext(MenuContentContext);
  // 如果处于 MenuSub 内，sub 才会有值
  const sub = useContext(MenuSubContext);

  // console.log("[COMPONENT]MenuItemImpl", store);
  const item = new MenuItemCore();
  store.appendItem(item);
  // 这种情况，只有放在 Sub 里面的 SubTrigger 才会触发
  if (sub && sub !== store) {
    item.setSub(sub);
  }
  // console.log("[COMPONENT]MenuItemImpl", store.items, store === sub);
  const [state, setState] = createSignal(item.state);
  item.onStateChange((nextState) => {
    item.log("onStateChange", nextState);
    setState(nextState);
  });
  item.onFocus(() => {
    $item.focus();
  });
  item.onBlur(() => {
    $item.blur();
  });

  onMount(() => {
    if (!item.sub) {
      return;
    }
    setTimeout(() => {
      const size = $item.getBoundingClientRect();
      // item.sub.log("setReference", $item, { x: size.x, y: size.y });
      item.sub.popper.setReference(size);
    }, 100);
  });

  const visible = () => state().subOpen;
  const disabled = () => state().disabled;
  const isFocused = () => state().focused;

  return (
    <div
      ref={$item}
      class={cn("menu__item-impl", props.class)}
      role="menuitem"
      aria-haspopup="menu"
      // aria-expanded=""
      data-state={getOpenState(visible())}
      data-highlighted={isFocused() ? "" : undefined}
      aria-disabled={disabled() || undefined}
      data-disabled={disabled() ? "" : undefined}
      onPointerMove={(event) => {
        if (event.pointerType !== "mouse") {
          return;
        }
        if (disabled()) {
          item.leave();
          return;
        }
        item.enter();
      }}
      onPointerLeave={(event) => {
        if (event.pointerType !== "mouse") {
          return;
        }
        item.leave();
      }}
      onFocus={() => {
        item.focus();
      }}
      onBlur={() => {
        item.blur();
      }}
    >
      {props.children}
    </div>
  );
};

const MenuSeparator = (props: { class?: string }) => {
  return <div class={props.class}></div>;
};
const MenuArrow = (props: {
  // store: MenuCore;
  class?: string;
  children: JSX.Element;
}) => {
  // const { store } = props;
  const store = useContext(MenuContext);

  return <Popper.Arrow store={store.popper} class={props.class}></Popper.Arrow>;
};

/* -------------------------------------------------------------------------------------------------
 * MenuSub
 * -----------------------------------------------------------------------------------------------*/
const MenuSubContext = createContext<MenuCore>();
const MenuSub = (props: {
  // store?: MenuCore;
  children: JSX.Element;
}) => {
  // const { store } = props;
  const store = useContext(MenuContext);

  const sub = new MenuCore({
    name: "SubMenu",
    side: "right",
    align: "start",
  });
  store.appendSub(sub);
  // sub.onLeave(() => {
  //   sub.log("onLeave at MenuSub");
  // });

  return (
    <Popper.Root store={sub.popper}>
      <MenuContext.Provider value={store}>
        <MenuSubContext.Provider value={sub}>
          {props.children}
        </MenuSubContext.Provider>
      </MenuContext.Provider>
    </Popper.Root>
  );
};
const MenuSubTrigger = (props: {
  // store?: MenuCore;
  class?: string;
  children: JSX.Element;
}) => {
  // const { store } = props;
  // const store = useContext(MenuSubContext);

  return (
    <MenuAnchor
      // store={store}
      class={props.class}
    >
      <MenuItemImpl
        // store={store}
        class={props.class}
      >
        {props.children}
      </MenuItemImpl>
    </MenuAnchor>
  );
};

// const MenuSubContentContext = createContext<MenuCore>();
const MenuSubContent = (props: {
  // store?: MenuCore;
  class?: string;
  children: JSX.Element;
}) => {
  // const { store } = props;
  const store = useContext(MenuSubContext);

  return (
    <Presence store={store.presence}>
      <MenuContentImpl store={store} class={props.class}>
        {props.children}
      </MenuContentImpl>
    </Presence>
  );
};

function getOpenState(open: boolean) {
  return open ? "open" : "closed";
}
type CheckedState = boolean | "indeterminate";
function isIndeterminate(checked?: CheckedState): checked is "indeterminate" {
  return checked === "indeterminate";
}

function getCheckedState(checked: CheckedState) {
  return isIndeterminate(checked)
    ? "indeterminate"
    : checked
    ? "checked"
    : "unchecked";
}

function focusFirst(candidates: HTMLElement[]) {
  const PREVIOUSLY_FOCUSED_ELEMENT = document.activeElement;
  for (const candidate of candidates) {
    // if focus is already where we want to go, we don't want to keep going through the candidates
    if (candidate === PREVIOUSLY_FOCUSED_ELEMENT) return;
    candidate.focus();
    if (document.activeElement !== PREVIOUSLY_FOCUSED_ELEMENT) return;
  }
}

/**
 * Wraps an array around itself at a given start index
 * Example: `wrapArray(['a', 'b', 'c', 'd'], 2) === ['c', 'd', 'a', 'b']`
 */
function wrapArray<T>(array: T[], startIndex: number) {
  return array.map((_, index) => array[(startIndex + index) % array.length]);
}

/**
 * This is the "meat" of the typeahead matching logic. It takes in all the values,
 * the search and the current match, and returns the next match (or `undefined`).
 *
 * We normalize the search because if a user has repeatedly pressed a character,
 * we want the exact same behavior as if we only had that one character
 * (ie. cycle through options starting with that character)
 *
 * We also reorder the values by wrapping the array around the current match.
 * This is so we always look forward from the current match, and picking the first
 * match will always be the correct one.
 *
 * Finally, if the normalized search is exactly one character, we exclude the
 * current match from the values because otherwise it would be the first to match always
 * and focus would never move. This is as opposed to the regular case, where we
 * don't want focus to move if the current match still matches.
 */
function getNextMatch(values: string[], search: string, currentMatch?: string) {
  const isRepeated =
    search.length > 1 && Array.from(search).every((char) => char === search[0]);
  const normalizedSearch = isRepeated ? search[0] : search;
  const currentMatchIndex = currentMatch ? values.indexOf(currentMatch) : -1;
  let wrappedValues = wrapArray(values, Math.max(currentMatchIndex, 0));
  const excludeCurrentMatch = normalizedSearch.length === 1;
  if (excludeCurrentMatch)
    wrappedValues = wrappedValues.filter((v) => v !== currentMatch);
  const nextMatch = wrappedValues.find((value) =>
    value.toLowerCase().startsWith(normalizedSearch.toLowerCase())
  );
  return nextMatch !== currentMatch ? nextMatch : undefined;
}

type Point = { x: number; y: number };
type Polygon = Point[];
type Side = "left" | "right";
type GraceIntent = { area: Polygon; side: Side };

// Determine if a point is inside of a polygon.
// Based on https://github.com/substack/point-in-polygon
function isPointInPolygon(point: Point, polygon: Polygon) {
  const { x, y } = point;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x;
    const yi = polygon[i].y;
    const xj = polygon[j].x;
    const yj = polygon[j].y;

    // prettier-ignore
    const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }

  return inside;
}

function isPointerInGraceArea(event: PointerEvent, area?: Polygon) {
  if (!area) return false;
  const cursorPos = { x: event.clientX, y: event.clientY };
  return isPointInPolygon(cursorPos, area);
}

function whenMouse<E>(handler) {
  return (event) =>
    event.pointerType === "mouse" ? handler(event) : undefined;
}

const Root = MenuRoot;
const Anchor = MenuAnchor;
const Portal = MenuPortal;
const Content = MenuContent;
const Group = MenuGroup;
const Label = MenuLabel;
const Item = MenuItem;
const Separator = MenuSeparator;
const Arrow = MenuArrow;
const Sub = MenuSub;
const SubTrigger = MenuSubTrigger;
const SubContent = MenuSubContent;
export {
  Root,
  Anchor,
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
