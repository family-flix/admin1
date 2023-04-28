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
export const EmptyPageContainer = (props: {
  page: PageCore;
  index: number;
  children: JSX.Element;
}) => {
  const { page } = props;

  const c = children(() => props.children);

  //   let $wrap;
  //   let $page;
  //   let $content;
  // const wrapRef = useRef<HTMLDivElement>(null);
  // const pageRef = useRef<HTMLDivElement>(null);
  // const contentRef = useRef<HTMLDivElement>(null);

  onMount(() => {
    //     if ($page === null || $content === null) {
    //       return;
    //     }
    //     page.client.width = $page.clientWidth;
    //     page.client.height = $page.clientHeight;
    //     page.client.contentHeight = $content.clientHeight;
    //     $page.addEventListener("scroll", () => {
    //       page.client.contentHeight = $content.clientHeight;
    //       page.emitPageScroll({
    //         scrollTop: $page.scrollTop,
    //       });
    //     });
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
  });

  return <div>{c()}</div>;
};
