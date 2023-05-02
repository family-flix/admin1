/**
 * @file 气泡 组件
 * Popover 是基于该组件的
 */
import {
  JSX,
  children,
  createContext,
  createSignal,
  onMount,
  useContext,
  onCleanup,
} from "solid-js";

import { PopperCore } from "@/domains/ui/popper";
import { cn } from "@/utils";

import { Arrow as PrimitiveArrow } from "./arrow";

const PopperContext = createContext<PopperCore>();

const PopperRoot = (props: { store: PopperCore; children: JSX.Element }) => {
  const { store } = props;

  // console.log("[COMPONENT]PopperRoot", store);

  return <div class={cn("popper__root")}>{props.children}</div>;
};

const PopperAnchor = (props: {
  store: PopperCore;
  class?: string;
  children: JSX.Element;
}) => {
  const { store, children } = props;
  // const store = useContext(PopperContext);

  let $anchor: HTMLDivElement;

  // console.log("[COMPONENT]PopperAnchor", store);

  onMount(() => {
    setTimeout(() => {
      const size = $anchor.getBoundingClientRect();
      store.log("setReference", $anchor, { x: size.x, y: size.y });
      store.setReference(size);
    }, 100);
  });

  // const c = children(() => props.children);

  return (
    <div
      class={cn("popper__anchor", "inline-block", props.class)}
      ref={$anchor}
    >
      {children}
    </div>
  );
};

const PopperContent = (props: {
  store: PopperCore;
  class?: string;
  children: JSX.Element;
}) => {
  const { store, children } = props;
  // const store = useContext(PopperContext);
  const [state, setState] = createSignal(store.state);

  let $content: HTMLDivElement;

  const off = store.onPlaced((nextState) => {
    console.log("[COMPONENT]PopperContent - onPlaced", nextState);
    setState(nextState);
  });

  onMount(() => {
    store.setFloating($content.getBoundingClientRect());
  });
  onCleanup(() => {
    off();
  });

  const x = () => state().x;
  const y = () => state().y;
  const isPlaced = () => state().isPlaced;
  const strategy = () => state().strategy;
  const placedSide = () => state().placedSide;
  const placedAlign = () => state().placedAlign;

  return (
    <div
      ref={$content}
      class={cn("popper__content", props.class)}
      style={{
        position: strategy(),
        left: 0,
        top: 0,
        transform: isPlaced()
          ? `translate3d(${Math.round(x())}px, ${Math.round(y())}px, 0)`
          : "translate3d(0, -200%, 0)", // keep off the page when measuring
        "min-width": "max-content",
        // zIndex: contentZIndex,
        // ["--radix-popper-transform-origin" as any]: [
        //   middlewareData.transformOrigin?.x,
        //   middlewareData.transformOrigin?.y,
        // ].join(" "),
      }}
    >
      <div
        class={cn("popper__content-child")}
        data-side={placedSide()}
        data-align={placedAlign()}
        // style={{
        //   animation: !isPlaced() ? "none" : undefined,
        // }}
      >
        {children}
      </div>
    </div>
  );
};

const OPPOSITE_SIDE = {
  top: "bottom",
  right: "left",
  bottom: "top",
  left: "right",
};
const PopperArrow = (props: { store: PopperCore; class?: string }) => {
  const { store } = props;
  // const store = useContext(PopperContext);
  const [state, setState] = createSignal(store.state);
  // const { arrowX, arrowY, baseSide, placedSide, shouldHideArrow } = state;
  let $arrow: HTMLSpanElement;

  const off = store.onPlaced((nextState) => {
    setState(nextState);
  });

  onMount(() => {
    store.setArrow($arrow.getBoundingClientRect());
  });
  onCleanup(() => {
    off();
  });

  const baseSide = () => OPPOSITE_SIDE[state().placedSide];
  const placedSide = () => state().placedSide;

  return (
    <span
      ref={$arrow}
      class={cn("popper__arrow", props.class)}
      style={{
        position: "absolute",
        left: "20px",
        top: "0px",
        [baseSide()]: 0,
        "transform-origin": {
          top: "",
          right: "0 0",
          bottom: "center 0",
          left: "100% 0",
        }[placedSide()],
        transform: {
          top: "translateY(100%)",
          right: "translateY(50%) rotate(90deg) translateX(-50%)",
          bottom: `rotate(180deg)`,
          left: "translateY(50%) rotate(-90deg) translateX(50%)",
        }[placedSide()],
        // visibility: shouldHideArrow ? "hidden" : undefined,
      }}
    >
      <PrimitiveArrow />
    </span>
  );
};

const Root = PopperRoot;
const Anchor = PopperAnchor;
const Content = PopperContent;
const Arrow = PopperArrow;
export { Root, Anchor, Content, Arrow };
