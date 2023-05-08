/**
 * @file 菜单 组件
 */
import {
  createContext,
  createSignal,
  onCleanup,
  onMount,
  useContext,
} from "solid-js";
import { JSX } from "solid-js/jsx-runtime";
import { Portal as PortalPrimitive } from "solid-js/web";

import { MenuCore } from "@/domains/ui/menu";
import { MenuItemCore } from "@/domains/ui/menu/item";
import { cn } from "@/utils";

import * as Popper from "./popper";
import { Presence } from "./presence";
import { DismissableLayer } from "./dismissable-layer";
import * as Collection from "./collection";

/* -------------------------------------------------------------------------------------------------
 * MenuRoot
 * -----------------------------------------------------------------------------------------------*/
const Root = (props: { store: MenuCore } & JSX.HTMLAttributes<HTMLElement>) => {
  const { store } = props;

  onCleanup(() => {
    store.destroy();
  });

  return <Popper.Root store={store.popper}>{props.children}</Popper.Root>;
};

/* -------------------------------------------------------------------------------------------------
 * MenuAnchor
 * -----------------------------------------------------------------------------------------------*/
const Anchor = (
  props: { store: MenuCore } & JSX.HTMLAttributes<HTMLElement>
) => {
  const { store } = props;
  // const store = useContext(MenuContext);

  return (
    <Popper.Anchor class={props.class} store={store.popper}>
      {props.children}
    </Popper.Anchor>
  );
};

/* -------------------------------------------------------------------------------------------------
 * MenuPortal
 * -----------------------------------------------------------------------------------------------*/
const Portal = (
  props: {
    store: MenuCore;
  } & JSX.HTMLAttributes<HTMLElement>
) => {
  const { store } = props;
  // const store = useContext(MenuContentContext);

  return (
    // <Presence store={store.presence}>
    <PortalPrimitive>{props.children}</PortalPrimitive>
    // </Presence>
  );
};

/* -------------------------------------------------------------------------------------------------
 * MenuContent
 * -----------------------------------------------------------------------------------------------*/
const Content = (
  props: {
    store: MenuCore;
  } & JSX.HTMLAttributes<HTMLElement>
) => {
  const { store } = props;
  // const store = useContext(MenuContext);
  onMount(() => {
    console.log("[]MenuContent onMounted");
  });

  return (
    <Presence store={store.presence}>
      <ContentNonModal store={store} class={props.class}>
        {props.children}
      </ContentNonModal>
    </Presence>
  );
};
// 这里多一个，是因为还存在 MenuContentModal 场景，这两个和 MenuSubContent 都复用 MenuContentImpl
const ContentNonModal = (
  props: {
    store: MenuCore;
  } & JSX.HTMLAttributes<HTMLElement>
) => {
  const { store } = props;

  return (
    <ContentImpl store={store} class={props.class}>
      {props.children}
    </ContentImpl>
  );
};

const ContentImpl = (
  props: {
    store: MenuCore;
  } & JSX.HTMLAttributes<HTMLElement>
) => {
  const { store } = props;

  return (
    <DismissableLayer store={store.layer}>
      <Popper.Content class={props.class} store={store.popper}>
        {props.children}
      </Popper.Content>
    </DismissableLayer>
  );
};

/* -------------------------------------------------------------------------------------------------
 * MenuGroup
 * -----------------------------------------------------------------------------------------------*/
const Group = (props: {} & JSX.HTMLAttributes<HTMLElement>) => {
  return <div>{props.children}</div>;
};

/* -------------------------------------------------------------------------------------------------
 * MenuLabel
 * -----------------------------------------------------------------------------------------------*/
const Label = (props: {} & JSX.HTMLAttributes<HTMLElement>) => {
  return <div class={props.class}>{props.children}</div>;
};

/* -------------------------------------------------------------------------------------------------
 * MenuItem
 * -----------------------------------------------------------------------------------------------*/
const Item = (
  props: {
    store: MenuItemCore;
    disabled?: boolean;
  } & JSX.HTMLAttributes<HTMLElement>
) => {
  const { store } = props;

  return (
    <ItemImpl
      class={props.class}
      store={store}
      onClick={() => {
        store.click();
      }}
    >
      {props.children}
    </ItemImpl>
  );
};
const ItemImpl = (
  props: {
    store: MenuItemCore;
  } & JSX.HTMLAttributes<HTMLDivElement>
) => {
  const { store: item, ...restProps } = props;
  let $item: HTMLDivElement;
  const [state, setState] = createSignal(item.state);
  item.onStateChange((nextState) => {
    setState(nextState);
  });
  item.onFocus(() => {
    $item.focus();
  });
  item.onBlur(() => {
    $item.blur();
  });

  const visible = () => state().open;
  const disabled = () => state().disabled;
  const focused = () => state().focused;

  return (
    <div
      ref={(el) => {
        $item = el;
        if (typeof props.ref === "function") {
          props.ref(el);
          return;
        }
        props.ref = $item;
      }}
      class={cn("menu__item-impl", props.class)}
      role="menuitem"
      aria-haspopup="menu"
      // aria-expanded=""
      data-state={getOpenState(visible())}
      data-highlighted={focused() ? "" : undefined}
      aria-disabled={disabled() || undefined}
      data-disabled={disabled() ? "" : undefined}
      tabIndex={disabled() ? undefined : -1}
      onPointerMove={(event) => {
        if (event.pointerType !== "mouse") {
          return;
        }
        item.move();
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
      {...restProps}
    >
      {props.children}
    </div>
  );
};

const Separator = (props: {} & JSX.HTMLAttributes<HTMLElement>) => {
  return <div class={props.class}></div>;
};
const Arrow = (
  props: {
    store: MenuCore;
  } & JSX.HTMLAttributes<HTMLElement>
) => {
  const { store } = props;
  // const store = useContext(MenuContext);

  return <Popper.Arrow class={props.class} store={store.popper}></Popper.Arrow>;
};

/* -------------------------------------------------------------------------------------------------
 * MenuSub
 * -----------------------------------------------------------------------------------------------*/
const Sub = (
  props: {
    store: MenuCore;
  } & JSX.HTMLAttributes<HTMLElement>
) => {
  const { store } = props;

  return <Popper.Root store={store.popper}>{props.children}</Popper.Root>;
};
const SubTrigger = (
  props: {
    store: MenuItemCore;
  } & JSX.HTMLAttributes<HTMLDivElement>
) => {
  const { store: item } = props;

  let $item: HTMLDivElement;
  // const store = useContext(MenuSubContext);

  // 既然在 SubTrigger 里面了，传入的 item 必然有 item.menu。但是为了避免可能的错误，还是用 ?. 处理
  item.menu?.popper.setReference({
    getRect() {
      const rect = $item.getBoundingClientRect();
      console.log(...item.menu.popper.log("get reference rect", $item, rect));
      return rect;
    },
  });
  onCleanup(() => {
    item.menu?.popper.removeReference();
  });

  return (
    <Anchor store={item.menu}>
      <ItemImpl ref={$item} class={props.class} store={item}>
        {props.children}
      </ItemImpl>
    </Anchor>
  );
};

// const MenuSubContentContext = createContext<MenuCore>();
const SubContent = (
  props: {
    store?: MenuCore;
  } & JSX.HTMLAttributes<HTMLElement>
) => {
  const { store } = props;
  // const store = useContext(MenuSubContext);

  return (
    <Presence store={store.presence}>
      <ContentImpl store={store} class={props.class}>
        {props.children}
      </ContentImpl>
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

// const Root = MenuRoot;
// const Anchor = MenuAnchor;
// const Portal = MenuPortal;
// const Content = MenuContent;
// const Group = MenuGroup;
// const Label = MenuLabel;
// const Item = MenuItem;
// const Separator = MenuSeparator;
// const Arrow = MenuArrow;
// const Sub = MenuSub;
// const SubTrigger = MenuSubTrigger;
// const SubContent = MenuSubContent;
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
