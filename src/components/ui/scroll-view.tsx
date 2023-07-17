/**
 * @file 可滚动容器，支持下拉刷新、滚动监听等
 */
import { JSX } from "solid-js/jsx-runtime";
import { Show, createSignal, onMount } from "solid-js";
import { ArrowDown, ArrowUp, Loader2 } from "lucide-solid";

import { ScrollViewCore } from "@/domains/ui/scroll-view";
import { cn } from "@/utils";

export const ScrollView = (
  props: {
    store: ScrollViewCore;
  } & JSX.HTMLAttributes<HTMLDivElement>
) => {
  const { store, ...restProps } = props;

  const [state, setState] = createSignal(store.state);

  store.onStateChange((nextState) => {
    setState(nextState);
  });

  const options = {
    pending: () => null,
    pulling: () => (
      <div class="flex items-center justify-center space-x-2">
        <ArrowDown width={18} height={18} />
        <div>下拉刷新</div>
      </div>
    ),
    releasing: () => (
      <div class="flex items-center justify-center space-x-2">
        <ArrowUp width={18} height={18} />
        <div>松手刷新</div>
      </div>
    ),
    refreshing: () => (
      <div class="flex items-center justify-center space-x-2">
        <Loader2 class="animate animate-spin" width={18} height={18} />
        <div>正在刷新</div>
      </div>
    ),
  };
  //   const step = () => state().step;
  // const { step } = state();
  const step = () => state().step;
  const Component = options[step()];

  return (
    <Root class={cn("relative")}>
      <Show when={state().pullToRefresh}>
        <Indicator store={store}>
          <div class="flex items-center justify-center h-[80px]">
            <Component />
          </div>
        </Indicator>
      </Show>
      <Content store={store} class={cn("w-full h-full overflow-y-auto hide-scroll", props.class)}>
        {props.children}
      </Content>
    </Root>
  );
};

const Root = (props: {} & JSX.HTMLAttributes<HTMLDivElement>) => {
  return <div class={props.class}>{props.children}</div>;
};
const Indicator = (props: { store: ScrollViewCore } & JSX.HTMLAttributes<HTMLElement>) => {
  const { store } = props;
  const [state, setState] = createSignal(store.state);
  store.onStateChange((nextState) => {
    setState(nextState);
  });
  store.enablePullToRefresh();
  //   const top = () => state().top - 60;
  const top = () => state().top - 60;

  return (
    <div
      style={{
        transform: `translateY(${top()}px)`,
      }}
    >
      {props.children}
    </div>
  );
};
const Content = (props: { store: ScrollViewCore } & JSX.HTMLAttributes<HTMLDivElement>) => {
  const { store } = props;
  //   let $page: HTMLDivElement;
  // const $page = useRef<HTMLDivElement>(null);
  let $page: HTMLDivElement | undefined = undefined;

  const [state, setState] = createSignal(store.state);

  store.onStateChange((nextState) => {
    setState(nextState);
  });
  onMount(() => {
    if (!$page) {
      return;
    }
    const { clientWidth, clientHeight, scrollHeight } = $page;
    store.setRect({
      width: clientWidth,
      height: clientHeight,
      contentHeight: scrollHeight,
    });
  });

  //   const top = () => state().top;
  const top = () => state().top;

  return (
    <div
      ref={$page}
      class={props.class}
      style={{ transform: `translateY(${top()}px)` }}
      onTouchStart={(event) => {
        // console.log('start');
        const { pageX, pageY } = event.touches[0];
        const position = { x: pageX, y: pageY };
        store.startPull(position);
      }}
      onTouchMove={(event) => {
        // console.log("move");
        const { pageX, pageY } = event.touches[0];
        const position = {
          x: pageX,
          y: pageY,
        };
        store.pulling(position);
      }}
      onTouchEnd={() => {
        store.endPulling();
      }}
      onScroll={(event) => {
        if (!$page) {
          return;
        }
        store.setRect({
          height: $page.clientHeight,
          contentHeight: $page.scrollHeight,
        });
        store.scroll({
          scrollTop: event.currentTarget.scrollTop,
        });
      }}
    >
      {props.children}
    </div>
  );
};

export { Root, Indicator, Content };
