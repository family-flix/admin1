// import { useEffect, useRef, useState } from "react";
import { Match, Switch, createSignal, onMount } from "solid-js";
import { JSX } from "solid-js/jsx-runtime";
import { effect } from "solid-js/web";
import { Image, ImageOff } from "lucide-solid";

import { ImageCore, ImageStep } from "@/domains/ui/image";
import { connect } from "@/domains/ui/image/connect.web";
import { cn } from "@/utils";

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
  effect(() => {
    if (!props.src) {
      return;
    }
    image.updateSrc(props.src);
  });

  return (
    <Switch>
      <Match when={state().step === ImageStep.Failed}>
        <div class={cn(props.class, "flex items-center justify-center bg-slate-200")}>
          <ImageOff class="w-8 h-8 text-slate-500" />
        </div>
      </Match>
      <Match when={state().step === ImageStep.Pending}>
        <div ref={$img} class={cn(props.class, "flex items-center justify-center bg-slate-200")}>
          <Image class="w-8 h-8 text-slate-500" />
        </div>
      </Match>
      <Match when={[ImageStep.Loading, ImageStep.Loaded].includes(state().step)}>
        <img
          class={props.class}
          style={{ "object-fit": state().fit }}
          src={state().src}
          alt={state().alt}
          onError={() => {
            image.handleError();
          }}
        />
      </Match>
    </Switch>
  );
}
