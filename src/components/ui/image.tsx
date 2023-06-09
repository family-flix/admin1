// import { useEffect, useRef, useState } from "react";
import { JSX } from "solid-js/jsx-runtime";
import { createSignal, onMount } from "solid-js";

import { ImageCore } from "@/domains/ui/image";
import { connect } from "@/domains/ui/image/conneect.web";

export function LazyImage(props: { src?: string; alt?: string } & JSX.HTMLAttributes<HTMLImageElement>) {
  let $img: HTMLImageElement | undefined = undefined;

  const image = new ImageCore({ width: 200, height: 100, src: props.src, alt: props.alt });
  const [state, setState] = createSignal(image.state);
  image.onStateChange((nextState) => {
    // console.log("[COMPONENT]LazyImage - image.onStateChange", nextState);
    setState(nextState);
  });
  onMount(() => {
    if (!$img) {
      return;
    }
    connect($img, image);
  });

  const src = () => state().src;
  const alt = () => state().alt;
  const fit = () => state().fit;
  // const { src, alt, fit } = state();

  return <img ref={$img} class={props.class} style={{ "object-fit": fit() }} src={src()} alt={alt()} />;
}
