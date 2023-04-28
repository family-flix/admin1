/**
 * @file 页面容器，负责页面切换动画、下拉刷新、滚动监听等
 */
// import React, { useEffect, useRef, useState } from "react";
// import cx from "classnames";

// import { cn } from "@/utils";
// import { Page } from "@/domains/router";
import { JSX } from "solid-js";
import { children, createMemo, createSignal, onMount } from "solid-js";

import { PageCore } from "@/domains/router/something";
import { ViewCore } from "@/domains/router";
// import { classList } from "solid-js/web";
// import { useInitialize } from "@/hooks";
// import { useTheme } from "@/components/Theme";

// interface IProps {
//   className?: string;
//   style?: React.CSSProperties;
//   children: React.ReactElement;
//   page: Page;
//   index: number;
// }
export const Window = (props: {
  className: string;
  style: string | JSX.CSSProperties;
  page: PageCore;
  // view: ViewCore;
  index: number;
  children: JSX.Element;
}) => {
  const { className, style, page } = props;

  const c = children(() => props.children);

  let $wrap;
  let $page;
  let $content;
  // const wrapRef = useRef<HTMLDivElement>(null);
  // const pageRef = useRef<HTMLDivElement>(null);
  // const contentRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = createSignal(false);
  const [hidden, setHidden] = createSignal(false);
  const [y, setY] = createSignal(0);
  const [state, setState] = createSignal("pending");
  // const { resolvedTheme } = useTheme();

  onMount(() => {
    page.onPullDown(({ yDistance, state }) => {
      setY(yDistance);
      setState(state);
    });
    page.onHidden(() => {
      setHidden(true);
    });
    if ($page === null || $content === null) {
      return;
    }
    page.client.width = $page.clientWidth;
    page.client.height = $page.clientHeight;
    page.client.contentHeight = $content.clientHeight;
    $page.addEventListener("scroll", () => {
      page.client.contentHeight = $content.clientHeight;
      page.emitPageScroll({
        scrollTop: $page.scrollTop,
      });
    });
    // $page.addEventListener("touchstart", (event) => {
    //   const { pageX, screenY } = event.touches[0];
    //   page.handleTouchStart({ x: pageX, y: screenY });
    // });
    // $page.addEventListener(
    //   "touchmove",
    //   (event) => {
    //     const { pageX, screenY } = event.touches[0];
    //     page.handleTouchMove({ x: pageX, y: screenY });
    //   },
    //   { passive: true }
    // );
    // $page.addEventListener("touchend", () => {
    //   page.handleTouchEnd();
    // });
    page.emitReady();
    // 为了有从右向左的滑动动画
    setTimeout(() => {
      setLoaded(true);
    }, 200);
  });

  const s = createMemo(() => state());

  return (
    <div
      ref={$wrap}
      class="page overflow-hidden fixed inset-0 w-screen h-screen"
      classList={{
        slide: props.index !== 0,
        mounted: loaded(),
        unmounted: hidden(),
      }}
      style={style}
    >
      <div
        ref={$page}
        class="absolute inset-0 max-h-screen overflow-y-auto"
        classList={{
          // resolvedTheme === "light" ?  : "bg-[#171717]"
          "bg-gray-100": true,
        }}
      >
        <div
          class="pull-to-refresh absolute z-10"
          style={{
            left: "50%",
            transform: `translateX(-50%)`,
            top: "28px",
            opacity: y() / 80,
          }}
        >
          {(() => {
            if (s() === "pulling") {
              return "下拉刷新";
            }
            if (s() === "releasing") {
              return "松手刷新";
            }
            if (s() === "refreshing") {
              return "正在刷新";
            }
            return null;
          })()}
        </div>
        <div
          ref={$content}
          class="content relative z-20"
          style={{ top: `${y}px` }}
        >
          {c()}
        </div>
      </div>
    </div>
  );
};
