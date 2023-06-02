import { JSX, Show, createContext, createSignal, onCleanup, onMount, useContext } from "solid-js";
import { Portal as PortalPrimitive } from "solid-js/web";

import { SelectCore } from "@/domains/ui/select";
import { SelectItemCore } from "@/domains/ui/select/item";
import { SelectViewportCore } from "@/domains/ui/select/viewport";
import { SelectContentCore } from "@/domains/ui/select/content";
import { SelectTriggerCore } from "@/domains/ui/select/trigger";
import { SelectValueCore } from "@/domains/ui/select/value";
import { SelectWrapCore } from "@/domains/ui/select/wrap";
import { app } from "@/store/app";
import { cn } from "@/utils";

import * as PopperPrimitive from "@/packages/ui/popper";
import { DismissableLayer } from "@/packages/ui/dismissable-layer";
import * as Collection from "@/packages/ui/collection";

const SELECTION_KEYS = [" ", "Enter"];

const SelectContext = createContext<SelectCore>();
const SelectContentContext = createContext<SelectCore>();
const SelectNativeOptionContext = createContext<SelectCore>();
const SelectRoot = (props: { store: SelectCore } & JSX.HTMLAttributes<HTMLElement>) => {
  const { store } = props;
  return (
    <PopperPrimitive.Root store={store.popper}>
      <SelectContext.Provider value={store}>
        <Collection.Provider store={store.collection}>
          <SelectNativeOptionContext.Provider value={store}>{props.children}</SelectNativeOptionContext.Provider>
        </Collection.Provider>
      </SelectContext.Provider>
    </PopperPrimitive.Root>
  );
};

const SelectTrigger = (props: { store: SelectCore } & JSX.HTMLAttributes<HTMLElement>) => {
  const { store } = props;

  let $button: HTMLButtonElement | undefined = undefined;
  // const store = useContext(SelectContext);

  const [state, setState] = createSignal(store.state);

  onMount(() => {
    const $_button = $button;
    if (!$_button) {
      return;
    }
    const trigger = new SelectTriggerCore({
      $node: () => $_button,
      getRect() {
        return $_button.getBoundingClientRect();
      },
      getStyles() {
        return window.getComputedStyle($_button);
      },
    });
    store.setTrigger(trigger);
  });
  store.onStateChange((nextState) => {
    setState(nextState);
  });

  const open = () => state().open;
  const required = () => state().required;
  const disabled = () => state().disabled;

  return (
    <PopperPrimitive.Anchor store={store.popper}>
      <button
        ref={$button}
        class={props.class}
        type="button"
        role="combobox"
        aria-expanded={open()}
        aria-required={required()}
        aria-autocomplete="none"
        data-state={open() ? "open" : "closed"}
        disabled={disabled()}
        onClick={(event) => {
          event.currentTarget.focus();
        }}
        onPointerDown={(event) => {
          if (event.button === 0 && event.ctrlKey === false) {
            store.setTriggerPointerDownPos({
              x: Math.round(event.pageX),
              y: Math.round(event.pageY),
            });
            store.show();
          }
        }}
        onKeyDown={() => {
          // ...
        }}
      >
        {props.children}
      </button>
    </PopperPrimitive.Anchor>
  );
};

const SelectValue = (props: { store: SelectValueCore } & JSX.HTMLAttributes<HTMLElement>) => {
  let $value: HTMLSpanElement;
  const select = useContext(SelectContext);
  const [state, setState] = createSignal(select.state);
  select.onStateChange((nextState) => {
    setState(nextState);
  });
  // store.onValueChange((selectedItem) => {});

  const valueCore = new SelectValueCore({
    $node: () => $value,
    getRect() {
      return $value.getBoundingClientRect();
    },
    getStyles() {
      return window.getComputedStyle($value);
    },
  });
  select.setValue(valueCore);

  const showPlaceholder = () => state().value === undefined && props.placeholder !== undefined;

  return (
    <span ref={$value} style={{ "pointer-events": "none" }}>
      <Show when={!showPlaceholder()} fallback={props.placeholder}>
        {props.children}
      </Show>
    </span>
  );
};

const SelectIcon = (props: { class?: string; children: JSX.Element }) => {
  return (
    <span class={props.class} aria-hidden>
      {props.children || "▼"}
    </span>
  );
};

const SelectPortal = (props: { children: JSX.Element }) => {
  return <PortalPrimitive>{props.children}</PortalPrimitive>;
};

const SelectContent = (props: {
  // store: SelectCore;
  class?: string;
  children: JSX.Element;
}) => {
  // const { store } = props;
  const store = useContext(SelectContext);
  const [state, setState] = createSignal(store.state);
  store.onStateChange((nextState) => {
    setState(nextState);
  });

  const open = () => state().open;

  return (
    <Show
      when={open()}
      fallback={
        <PortalPrimitive mount={new DocumentFragment()}>
          <SelectContentContext.Provider value={store}>
            <Collection.Slot>
              <div>{props.children}</div>
            </Collection.Slot>
          </SelectContentContext.Provider>
        </PortalPrimitive>
      }
    >
      <SelectContentImpl store={store} class={props.class}>
        {props.children}
      </SelectContentImpl>
    </Show>
  );
};

const SelectContentImpl = (props: { store: SelectCore; class?: string; children: JSX.Element }) => {
  const { store } = props;
  let $content: HTMLDivElement;

  const content = new SelectContentCore({
    $node: () => $content,
    getRect() {
      return $content.getBoundingClientRect();
    },
    getStyles() {
      return window.getComputedStyle($content);
    },
  });
  onMount(() => {
    store.setContent(content);
  });
  store.onFocus(() => {
    // console.log(...store.log("onFocus"));
    $content.focus();
  });
  // window.addEventListener("blur", store.hide);
  app.onResize(() => {
    store.hide();
  });

  // onMount(() => {
  //   console.log("SelectContent mounted", $content);
  // });

  const SelectPosition = store.position === "popper" ? SelectPopperPosition : SelectItemAlignedPosition;

  return (
    <SelectContentContext.Provider value={store}>
      <DismissableLayer asChild store={store.layer}>
        <SelectPosition
          ref={$content}
          role="listbox"
          class={props.class}
          style={{
            display: "flex",
            "flex-direction": "column",
            // reset the outline by default as the content MAY get focused
            outline: "none",
          }}
        >
          {props.children}
        </SelectPosition>
      </DismissableLayer>
    </SelectContentContext.Provider>
  );
};

const SelectViewContext = createContext<SelectCore>();
const SelectItemAlignedPosition = (
  props: {
    ref?: ((el: HTMLDivElement) => void) | HTMLDivElement;
    children: JSX.Element;
  } & {
    class?: string;
    style?: JSX.CSSProperties;
  } & JSX.AriaAttributes
) => {
  // const { store } = props;
  let $wrap: HTMLDivElement;
  let $content: HTMLDivElement;
  const store = useContext(SelectContext);
  const [state, setState] = createSignal(store.state);
  store.onStateChange((nextState) => {
    setState(nextState);
  });

  const wrap = new SelectWrapCore({
    $node() {
      return $wrap;
    },
    getRect() {
      return $wrap.getBoundingClientRect();
    },
    getStyles() {
      return window.getComputedStyle($wrap);
    },
  });
  store.setWrap(wrap);

  onMount(() => {
    console.log(...store.log("SelectItemAlignedPosition", $content, $wrap));
    // store.position();
  });

  const wrapStyles = () => state().styles;

  return (
    <SelectViewContext.Provider value={store}>
      <div
        ref={$wrap}
        class={cn("select__content-wrap")}
        style={{
          display: "flex",
          "flex-direction": "column",
          position: "fixed",
          // ...wrapStyles(),
          // "z-index": contentZIndex,
        }}
      >
        <div
          ref={(el) => {
            $content = el;
            if (typeof props.ref === "function") {
              props.ref(el);
              return;
            }
            props.ref = el;
          }}
          role={props.role}
          class={cn("select__content", props.class)}
          style={{
            // When we get the height of the content, it includes borders. If we were to set
            // the height without having `boxSizing: 'border-box'` it would be too big.
            "box-sizing": "border-box",
            // We need to ensure the content doesn't get taller than the wrapper
            "max-height": "100%",
          }}
        >
          {props.children}
        </div>
      </div>
    </SelectViewContext.Provider>
  );
};

const SelectPopperPosition = (
  props: {
    ref?: ((el: HTMLDivElement) => void) | HTMLDivElement;
    children: JSX.Element;
  } & {
    class?: string;
    style?: JSX.CSSProperties;
  } & JSX.AriaAttributes
) => {
  const store = useContext(SelectContext);
  return (
    <PopperPrimitive.Content
      ref={props.ref}
      role={props.role}
      class={props.class}
      style={{
        "box-sizing": "border-box",
        ...(props.style || {}),
      }}
      store={store.popper}
    >
      {props.children}
    </PopperPrimitive.Content>
  );
};

const SelectViewport = (props: { class?: string; children: JSX.Element }) => {
  const style = `[data-radix-select-viewport]{scrollbar-width:none;-ms-overflow-style:none;-webkit-overflow-scrolling:touch;}[data-radix-select-viewport]::-webkit-scrollbar{display:none}`;
  const store = useContext(SelectContext);
  let $viewport: HTMLDivElement;

  const viewport = new SelectViewportCore({
    $node: () => $viewport,
    getRect() {
      return $viewport.getBoundingClientRect();
    },
    getStyles() {
      return window.getComputedStyle($viewport);
    },
  });
  onMount(() => {
    store.setViewport(viewport);
  });

  return (
    <>
      <style>{style}</style>
      <Collection.Slot>
        <div
          ref={$viewport}
          class={props.class}
          role="presentation"
          style={{
            position: "relative",
            flex: 1,
            overflow: "auto",
          }}
          onScroll={(event) => {
            const $viewport = event.currentTarget;
          }}
        >
          {props.children}
        </div>
      </Collection.Slot>
    </>
  );
};

const SelectGroupContext = createContext<SelectCore>();
const SelectGroup = (props: { children: JSX.Element }) => {
  // const { store } = props;
  const store = useContext(SelectContext);

  return (
    <SelectGroupContext.Provider value={store}>
      <div role="group">{props.children}</div>
    </SelectGroupContext.Provider>
  );
};

const SelectLabel = (props: { class?: string; children: JSX.Element }) => {
  return <div class={props.class}>{props.children}</div>;
};

const SelectItemContext = createContext<SelectItemCore>();
const SelectItem = (props: { value?: string; class?: string; children: JSX.Element }) => {
  const { value } = props;

  let $item: HTMLDivElement;
  const select = useContext(SelectContext);
  // console.log("SelectItem initial", store.state.value);
  const item = new SelectItemCore({
    value,
    state: {
      selected: select.state.value === value,
    },
    getRect: () => $item.getBoundingClientRect(),
    getStyles: () => window.getComputedStyle($item),
  });
  const [state, setState] = createSignal(item.state);
  item.onStateChange((nextState) => {
    setState(nextState);
  });
  item.onFocus(() => {
    // console.log("itemCore.onFocus");
    $item.focus({ preventScroll: true });
  });
  onMount(() => {
    select.appendItem(item);
  });
  // onCleanup(() => {
  //   item.destroy();
  // });

  const focused = () => state().focused;
  const selected = () => state().selected;
  const disabled = () => state().disabled;

  return (
    <SelectItemContext.Provider value={item}>
      <Collection.Item>
        <div
          ref={$item}
          class={props.class}
          role="option"
          data-highlighted={focused() ? "" : undefined}
          aria-selected={selected() && focused()}
          data-state={selected() ? "checked" : "unchecked"}
          aria-disabled={disabled() || undefined}
          data-disabled={disabled() ? "" : undefined}
          tabIndex={disabled() ? undefined : -1}
          onFocus={() => {
            // console.log(...itemCore.log("onFocus", value));
            item.focus();
          }}
          onBlur={() => {
            // console.log(...itemCore.log("onBlur", value));
            item.blur();
          }}
          onPointerUp={() => {
            select.select(item);
          }}
          onPointerMove={(event) => {
            item.move({ x: event.pageX, y: event.pageY });
          }}
          onPointerLeave={() => {
            item.leave();
          }}
          onKeyDown={(event) => {
            if (SELECTION_KEYS.includes(event.key)) {
              select.select(item);
            }
          }}
        >
          {props.children}
        </div>
      </Collection.Item>
    </SelectItemContext.Provider>
  );
};

const SelectItemText = (props: { children: JSX.Element }) => {
  const select = useContext(SelectContext);
  const item = useContext(SelectItemContext);
  let $node: HTMLSpanElement;

  const [state, setState] = createSignal(item.state);
  item.onStateChange((nextState) => {
    console.log(select.value?.$node(), props.children);
    setState(nextState);
  });
  item.setText({
    $node: () => $node,
    getRect() {
      return $node.getBoundingClientRect();
    },
    getStyles() {
      return window.getComputedStyle($node);
    },
  });

  const selected = () => state().selected;

  let $option = (
    <option value={state().value} disabled={state().disabled}>
      {$node?.textContent}
    </option>
  );

  return (
    <>
      <span ref={$node}>{props.children}</span>
      <Show when={selected()}>
        <PortalPrimitive mount={select.value.$node()}>{props.children}</PortalPrimitive>
      </Show>
    </>
  );
};

const SelectItemIndicator = (props: { class?: string; children: JSX.Element }) => {
  const item = useContext(SelectItemContext);
  const [state, setState] = createSignal(item.state);
  item.onStateChange((nextState) => {
    console.log(...item.log("item.onStateChange", item.value, nextState.selected));
    setState(nextState);
  });

  const selected = () => state().selected;

  return (
    <Show when={selected()}>
      <span class={props.class} aria-hidden>
        {props.children}
      </span>
    </Show>
  );
};

const SelectScrollUpButton = (props: { class?: string; children: JSX.Element }) => {
  const canScrollUp = () => true;
  return (
    <Show when={canScrollUp()}>
      <SelectScrollButtonImpl class={props.class}>{props.children}</SelectScrollButtonImpl>
    </Show>
  );
};

const SelectScrollDownButton = (props: { class?: string; children: JSX.Element }) => {
  const canScrollDown = () => true;
  return (
    <Show when={canScrollDown()}>
      <SelectScrollButtonImpl class={props.class}>{props.children}</SelectScrollButtonImpl>
    </Show>
  );
};

const SelectScrollButtonImpl = (props: { class?: string; children: JSX.Element }) => {
  return (
    <div
      class={props.class}
      onPointerMove={() => {
        // ...
      }}
      onPointerLeave={() => {
        // ...
      }}
    >
      {props.children}
    </div>
  );
};

const SelectSeparator = (props: { class?: string }) => {
  return <div class={props.class} aria-hidden />;
};

const SelectArrow = () => {
  const store = useContext(SelectContext);
  return <PopperPrimitive.Arrow store={store.popper}></PopperPrimitive.Arrow>;
};

const BubbleSelect = (props: { children: JSX.Element }) => {
  return <select />;
};

const Root = SelectRoot;
const Trigger = SelectTrigger;
const Value = SelectValue;
const Icon = SelectIcon;
const Portal = SelectPortal;
const Content = SelectContent;
const Viewport = SelectViewport;
const Group = SelectGroup;
const Label = SelectLabel;
const Item = SelectItem;
const ItemText = SelectItemText;
const ItemIndicator = SelectItemIndicator;
const ScrollUpButton = SelectScrollUpButton;
const ScrollDownButton = SelectScrollDownButton;
const Separator = SelectSeparator;
const Arrow = SelectArrow;
export {
  Root,
  Trigger,
  Value,
  Icon,
  Portal,
  Content,
  Viewport,
  Group,
  Label,
  Item,
  ItemText,
  ItemIndicator,
  ScrollUpButton,
  ScrollDownButton,
  Separator,
  Arrow,
};
