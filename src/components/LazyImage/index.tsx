import { JSX, Show, createSignal, onMount } from "solid-js";

export const LazyImage = (props: Partial<{ src: string; alt: string }> & JSX.HTMLAttributes<HTMLImageElement>) => {
  const { src, alt } = props;

  let $img: HTMLImageElement | undefined;
  let has_visible = false;

  const [visible, set_visible] = createSignal(false);

  onMount(() => {
    if (!src) {
      return;
    }
    const $$img = $img;
    if (!$$img) {
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            $$img.src = src;
            $$img.classList.add("visible");
            if (has_visible === false) {
              set_visible(true);
            }
            has_visible = true;
            io.unobserve($$img);
          }
        });
      },
      { threshold: 0.01 }
    );
    io.observe($$img);
  });

  // console.log("[COMPONENT]LazyImage - render", visible);

  return (
    <div ref={$img} class={props.class}>
      <Show when={visible()} fallback={<div class="w-full h-full bg-slate-300 dark:bg-gray-800"></div>}>
        <img
          src={src}
          alt={alt}
          onError={() => {
            set_visible(false);
          }}
        />
      </Show>
    </div>
  );
};
