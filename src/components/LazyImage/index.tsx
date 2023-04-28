import { createSignal, onMount } from "solid-js";

interface IProps {
  className?: string;
  src?: string;
  alt?: string;
}
const LazyImage = (props) => {
  const { className, src, alt } = props;

  let $img;
  let has_visible = false;
  const [visible, set_visible] = createSignal(false);

  onMount(() => {
    if (!src) {
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            $img.src = src;
            $img.classList.add("visible");
            if (has_visible === false) {
              set_visible(true);
            }
            has_visible = true;
            io.unobserve($img);
          }
        });
      },
      { threshold: 0.01 }
    );
    io.observe($img);
  });

  // console.log("[COMPONENT]LazyImage - render", visible);

  return (
    <div ref={$img} class={className}>
      {(() => {
        if (visible()) {
          return (
            <img
              src={src}
              alt={alt}
              onError={() => {
                set_visible(false);
              }}
            />
          );
        }
        return <div class="w-full h-full bg-gray-200 dark:bg-gray-800"></div>;
      })()}
    </div>
  );
};

export default LazyImage;
