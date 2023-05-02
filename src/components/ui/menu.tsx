/**
 * @file 菜单 组件
 */
import { JSX } from "solid-js/jsx-runtime";
import { Portal as PortalPrimitive } from "solid-js/web";

import { MenuCore } from "@/domains/ui/menu";

import * as Popper from "./popper";
import { Presence } from "./presence";
import { DismissableLayer } from "./dismissable-layer";
import * as Collection from "./collection";
import { cn } from "@/utils";
import { createSignal } from "solid-js";

export type Menu = {};
export const Menu = (props: { options: {}[] }) => {};

/* -------------------------------------------------------------------------------------------------
 * MenuRoot
 * -----------------------------------------------------------------------------------------------*/
const MenuRoot = (props: { store: MenuCore; children: JSX.Element }) => {
  const { store } = props;

  return <Popper.Root store={store.popper}>{props.children}</Popper.Root>;
};

/* -------------------------------------------------------------------------------------------------
 * MenuAnchor
 * -----------------------------------------------------------------------------------------------*/
const MenuAnchor = (props: { store: MenuCore; children: JSX.Element }) => {
  const { store } = props;
  return <Popper.Anchor store={store.popper}>{props.children}</Popper.Anchor>;
};

/* -------------------------------------------------------------------------------------------------
 * MenuPortal
 * -----------------------------------------------------------------------------------------------*/
const MenuPortal = (props: { store: MenuCore; children: JSX.Element }) => {
  const { store } = props;
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
  store: MenuCore;
  class?: string;
  children: JSX.Element;
}) => {
  const { store } = props;
  return (
    <Presence store={store.presence}>
      <MenuContentNonModal store={store} class={props.class}>
        {props.children}
      </MenuContentNonModal>
    </Presence>
  );
};

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

const MenuContentImpl = (props: {
  store: MenuCore;
  class?: string;
  children: JSX.Element;
}) => {
  const { store } = props;
  return (
    <div class={cn("menu__content-impl")}>
      <DismissableLayer store={store.layer}>
        <Popper.Content store={store.popper} class={props.class}>
          {props.children}
        </Popper.Content>
      </DismissableLayer>
    </div>
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
  store: MenuCore;
  class?: string;
  disabled?: boolean;
  children: JSX.Element;
}) => {
  const { store } = props;
  return (
    <MenuItemImpl store={store} class={props.class}>
      {props.children}
    </MenuItemImpl>
  );
};
const MenuItemImpl = (props: {
  store: MenuCore;
  class?: string;
  children: JSX.Element;
}) => {
  const { store } = props;

  let $item: HTMLDivElement;
  const itemStore = store.appendItem();
  const [state, setState] = createSignal(itemStore.state);
  itemStore.onStateChange((nextState) => {
    setState(nextState);
  });
  itemStore.onFocus(() => {
    $item.focus();
  });
  itemStore.onBlur(() => {
    $item.blur();
  });

  const disabled = () => state().disabled;
  const isFocused = () => state().focused;

  return (
    <div
      ref={$item}
      onPointerMove={() => {
        // ...
      }}
      onPointerDown={(event) => {
        // ...
      }}
      onPointerUp={(event) => {
        // ...
      }}
      onKeyDown={(event) => {
        const { key } = event;
        // emit key
        event.preventDefault();
      }}
    >
      <div
        class={props.class}
        role="menuitem"
        data-highlighted={isFocused() ? "" : undefined}
        aria-disabled={disabled() || undefined}
        data-disabled={disabled() ? "" : undefined}
        onPointerMove={(event) => {
          if (event.pointerType !== "mouse") {
            return;
          }
          if (disabled()) {
            itemStore.leave();
            return;
          }
          itemStore.enter();
        }}
        onPointerLeave={(event) => {
          if (event.pointerType !== "mouse") {
            return;
          }
          itemStore.leave();
        }}
        onFocus={() => {
          itemStore.focus();
        }}
        onBlur={() => {
          itemStore.blur();
        }}
      >
        {props.children}
      </div>
    </div>
  );
};

const MenuSeparator = (props: { class?: string }) => {
  return <div class={props.class}></div>;
};
const MenuArrow = (props: {
  store: MenuCore;
  class?: string;
  children: JSX.Element;
}) => {
  const { store } = props;
  return <Popper.Arrow store={store.popper} class={props.class}></Popper.Arrow>;
};

const MenuSub = (props: { store: MenuCore; children: JSX.Element }) => {
  const { store } = props;
  return <Popper.Root store={store.popper}>{props.children}</Popper.Root>;
};
const MenuSubTrigger = (props: {
  store: MenuCore;
  class?: string;
  children: JSX.Element;
}) => {
  const { store } = props;
  return (
    <MenuAnchor store={store}>
      <MenuItemImpl store={store} class={props.class}>
        {props.children}
      </MenuItemImpl>
    </MenuAnchor>
  );
};
const MenuSubContent = (props: {
  store: MenuCore;
  class?: string;
  children: JSX.Element;
}) => {
  const { store } = props;
  return (
    <Collection.Provider>
      <Presence store={store.presence}>
        <Collection.Slot>
          <MenuContentImpl store={store} class={props.class}>
            {props.children}
          </MenuContentImpl>
        </Collection.Slot>
      </Presence>
    </Collection.Provider>
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
