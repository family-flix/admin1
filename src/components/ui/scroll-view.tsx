/**
 * @file 可滚动容器，支持下拉刷新、滚动监听等
 */
import { createSignal, onMount, JSX, children } from "solid-js";

import { ScrollViewCore } from "@/domains/ui/scroll-view";
import { Dynamic } from "solid-js/web";
import { ArrowDown, ArrowUp, Loader2 } from "lucide-solid";

export const ScrollView = (
  props: { store: ScrollViewCore } & JSX.HTMLAttributes<HTMLDivElement>
) => {
  const { store, children } = props;

  const [state, setState] = createSignal(store.state);

  store.onStateChange((nextState) => {
    setState(nextState);
  });

  return (
    <Root class={props.class}>
      <Content store={store}>{children}</Content>
    </Root>
  );
};

export const PageView = (
  props: { store: ScrollViewCore } & JSX.HTMLAttributes<HTMLDivElement>
) => {
  const { store, children } = props;

  const [state, setState] = createSignal(store.state);

  store.onStateChange((nextState) => {
    setState(nextState);
  });

  const options = {
    pulling: () => (
      <div class="flex items-center justify-center">
        <ArrowDown width={18} height={18} />
        <div>下拉刷新</div>
      </div>
    ),
    releasing: () => (
      <div class="flex items-center justify-center">
        <ArrowUp width={18} height={18} />
        <div>松手刷新</div>
      </div>
    ),
    refreshing: () => (
      <div class="flex items-center justify-center">
        <Loader2 width={18} height={18} />
        <div>正在刷新</div>
      </div>
    ),
  };
  const step = () => state().step;

  return (
    <Root class="overflow-hidden fixed inset-0 w-screen h-screen">
      <Indicator store={store}>
        <div class="flex items-center justify-center h-[80px]">
          <Dynamic component={options[step()]} />
        </div>
      </Indicator>
      <Content
        store={store}
        class="absolute inset-0 max-h-screen overflow-y-auto"
      >
        {children}
      </Content>
    </Root>
  );
};

const Root = (props: {} & JSX.HTMLAttributes<HTMLElement>) => {
  return <div class={props.class}>{props.children}</div>;
};
const Indicator = (
  props: {
    store: ScrollViewCore;
  } & JSX.HTMLAttributes<HTMLElement>
) => {
  const { store } = props;
  const [state, setState] = createSignal(store.state);
  store.onStateChange((nextState) => {
    setState(nextState);
  });
  store.enablePullToRefresh();
  const top = () => state().top - 60;

  return (
    <div style={{ transform: `translateY(${top()}px)` }}>{props.children}</div>
  );
};
const Content = (
  props: { store: ScrollViewCore } & JSX.HTMLAttributes<HTMLElement>
) => {
  const { store } = props;
  let $page: HTMLDivElement;

  const [state, setState] = createSignal(store.state);

  store.onStateChange((nextState) => {
    setState(nextState);
  });
  onMount(() => {
    const { clientWidth, clientHeight, scrollHeight } = $page;
    store.setRect({
      width: clientWidth,
      height: clientHeight,
      contentHeight: scrollHeight,
    });
  });

  const top = () => state().top;

  return (
    <div
      ref={$page}
      class={props.class}
      style={{ transform: `translateY(${top()}px)` }}
      onTouchStart={(event) => {
        const { pageX, pageY } = event.touches[0];
        const position = { x: pageX, y: pageY };
        store.startPull(position);
      }}
      onTouchMove={(event) => {
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
        store.setRect({
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
