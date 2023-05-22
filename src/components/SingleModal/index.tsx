/**
 * @file Modal 组件
 * 和 Dialog 相比没有 Footer ？
 */
import { JSX, createSignal } from "solid-js";

import {
  Root,
  Title,
  Content,
  Header,
  Footer,
  Portal,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { DialogCore } from "@/domains/ui/dialog";
import { ButtonCore } from "@/domains/ui/button";

export function Modal(
  props: {
    store: DialogCore;
  } & JSX.HTMLAttributes<HTMLElement>
) {
  const { store } = props;

  const [state, setState] = createSignal(store.state);

  const okBtn = new ButtonCore({
    onClick() {
      store.ok();
    },
  });
  const cancelBtn = new ButtonCore({
    onClick() {
      store.cancel();
    },
  });

  store.onStateChange((nextState) => {
    setState(nextState);
  });

  const title = () => state().title;

  return (
    <Root store={store}>
      <Portal store={store}>
        <Content store={store}>
          <Header>
            <Title>{title()}</Title>
          </Header>
          {props.children}
          <Footer>
            <div class="space-x-2">
              <Button variant="subtle" size="default" store={cancelBtn}>
                取消
              </Button>
              <Button variant="default" size="default" store={okBtn}>
                确认
              </Button>
            </div>
          </Footer>
        </Content>
      </Portal>
    </Root>
  );
}
