/**
 * @file 气泡 组件
 * 仅负责计算气泡位置，不负责显隐
 */
import { JSX, createSignal, onMount, onCleanup } from "solid-js";

import { PopperCore } from "@/domains/ui/popper";
import { cn } from "@/utils";

import { Arrow as PrimitiveArrow } from "./arrow";

// const PopperContext = createContext<PopperCore>();
const PopperRoot = (
  props: { store: PopperCore } & JSX.HTMLAttributes<HTMLElement>
) => {
  // const { store } = props;

  return props.children;
};

const PopperAnchor = (
  props: {
    store: PopperCore;
  } & JSX.HTMLAttributes<HTMLElement>
) => {
  const { store } = props;
  let $anchor: HTMLDivElement;

  // console.log("[COMPONENT]PopperAnchor - before setReference", store.reference);
  if (!store.reference) {
    store.setReference({
      getRect() {
        const rect = $anchor.getBoundingClientRect();
        return rect;
      },
    });
    return (
      <div
        ref={(el) => {
          $anchor = el;
          if (typeof props.ref === "function") {
            props.ref(el);
            return;
          }
          props.ref = el;
        }}
        class={cn("popper__anchor", "inline-block")}
      >
        {props.children}
      </div>
    );
  }
  return props.children;
};

const PopperContent = (
  props: {
    store: PopperCore;
  } & JSX.HTMLAttributes<HTMLElement>
) => {
  const { store } = props;
  // const store = useContext(PopperContext);
  const [state, setState] = createSignal(store.state);

  let $content: HTMLDivElement;

  store.onStateChange((nextState) => {
    setState(nextState);
  });
  onMount(() => {
    store.setFloating({
      getRect() {
        const rect = $content.getBoundingClientRect();
        console.log(
          "[COMPONENT]PopperContent - getRect of floating",
          $content,
          rect
        );
        return rect;
      },
    });
  });

  const x = () => state().x;
  const y = () => state().y;
  const isPlaced = () => state().isPlaced;
  const strategy = () => state().strategy;
  const placedSide = () => state().placedSide;
  const placedAlign = () => state().placedAlign;

  return (
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
      tabIndex={-1}
      onPointerEnter={() => {
        console.log("[]PopperContent - pointerEnter");
        store.enter();
      }}
      onPointerLeave={() => {
        store.leave();
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
        {props.children}
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
const PopperArrow = (
  props: {
    store: PopperCore;
  } & JSX.HTMLAttributes<HTMLElement>
) => {
  const { store } = props;
  // const store = useContext(PopperContext);
  const [state, setState] = createSignal(store.state);
  // const { arrowX, arrowY, baseSide, placedSide, shouldHideArrow } = state;
  let $arrow: HTMLSpanElement;

  const off = store.onStateChange((nextState) => {
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
