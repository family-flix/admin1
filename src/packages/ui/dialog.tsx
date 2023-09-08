/**
 * @file 弹窗 组件
 */
import { createSignal, JSX } from "solid-js";

import { DialogCore } from "@/domains/ui/dialog";
import { Presence } from "@/components/ui/presence";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils";

import { Portal as PortalPrimitive } from "./portal";
import { Show } from "./show";

export function Dialog(
  props: {
    store: DialogCore;
  } & JSX.HTMLAttributes<HTMLElement>
) {
  const { store } = props;

  const [state, setState] = createSignal(store.state);

  store.onStateChange((nextState) => {
    setState(nextState);
  });

  const title = () => state().title;
  const footer = () => state().footer;

  return (
    <Root store={store}>
      <Portal store={store}>
        <Overlay store={store} />
        <Content store={store}>
          <Header>
            <Title>{title()}</Title>
          </Header>
          {props.children}
          <Show when={!!footer()}>
            <Footer>
              <div class="space-x-2">
                <Cancel store={store}>取消</Cancel>
                <Submit store={store}>确认</Submit>
              </div>
            </Footer>
          </Show>
        </Content>
      </Portal>
    </Root>
  );
}

const Root = (props: { store: DialogCore } & JSX.HTMLAttributes<HTMLElement>) => {
  return props.children;
};

const Portal = (props: { store: DialogCore } & JSX.HTMLAttributes<HTMLElement>) => {
  const { store } = props;

  return (
    <Presence store={store.present}>
      <PortalPrimitive>
        <div class={props.class}>{props.children}</div>
      </PortalPrimitive>
    </Presence>
  );
};

const Overlay = (props: { store: DialogCore } & JSX.HTMLAttributes<HTMLDivElement>) => {
  const { store } = props;

  const [state, setState] = createSignal(store.state);

  store.onStateChange((nextState) => {
    setState(nextState);
  });

  return (
    <div
      data-state={getState(state().open)}
      class={cn(props.class)}
      onClick={() => {
        if (!store.closeable) {
          return;
        }
        store.hide();
      }}
    />
  );
};

const Content = (
  props: {
    store: DialogCore;
  } & JSX.HTMLAttributes<HTMLElement>
) => {
  const { store } = props;
  const [state, setState] = createSignal(store.state);

  store.onStateChange((nextState) => {
    setState(nextState);
  });

  return (
    <div class={cn(props.class)} data-state={getState(state().open)}>
      {props.children}
    </div>
  );
};

const Close = (props: { store: DialogCore } & JSX.HTMLAttributes<HTMLElement>) => {
  const { store } = props;
  const [state, setState] = createSignal(store.state);

  store.onStateChange((nextState) => {
    setState(nextState);
  });

  return (
    <div
      class={props.class}
      data-state={getState(state().open)}
      onClick={() => {
        props.store.hide();
      }}
    >
      {props.children}
      <span class="sr-only">Close</span>
    </div>
  );
};

const Header = (props: {} & JSX.HTMLAttributes<HTMLElement>) => {
  return <div class={cn(props.class)}>{props.children}</div>;
};

const Footer = (props: {} & JSX.HTMLAttributes<HTMLDivElement>) => {
  return <div class={cn(props.class)}>{props.children}</div>;
};

const Title = (props: {} & JSX.HTMLAttributes<HTMLElement>) => {
  return <div class={cn(props.class)}>{props.children}</div>;
};

const Submit = (props: { store: DialogCore } & JSX.HTMLAttributes<HTMLButtonElement>) => {
  const { store } = props;

  return <Button store={store.okBtn}>{props.children}</Button>;
};

const Cancel = (props: { store: DialogCore } & JSX.HTMLAttributes<HTMLButtonElement>) => {
  const { store } = props;

  return (
    <Button variant="subtle" store={store.cancelBtn}>
      {props.children}
    </Button>
  );
};

function getState(open: boolean) {
  return open ? "open" : "closed";
}

export { Root, Portal, Header, Title, Content, Close, Overlay, Footer, Submit, Cancel };
