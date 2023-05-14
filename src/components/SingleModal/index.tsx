/**
 * @file 带有 Footer 的 Modal 组件
 */
import { JSX } from "solid-js";

import { Root, Title, Content, Header, Footer } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { DialogCore } from "@/domains/ui/dialog";

export const Modal = (props: {
  store: DialogCore;
  title?: string;
  children: JSX.Element;
  footer?: JSX.Element;
}) => {
  const { store: store, title, children, footer } = props;

  return (
    <Root store={store}>
      <Content store={store}>
        <Header>
          <Title>{title}</Title>
        </Header>
        {children}
        <Footer>
          {(() => {
            if (footer !== undefined) {
              return footer;
            }
            return (
              <div class="space-x-2">
                <Button
                  variant="subtle"
                  size="default"
                  onClick={() => {
                    store.cancel();
                  }}
                >
                  取消
                </Button>
                <Button
                  variant="default"
                  size="default"
                  onClick={async () => {
                    store.ok();
                  }}
                >
                  确认
                </Button>
              </div>
            );
          })()}
        </Footer>
      </Content>
    </Root>
  );
};
