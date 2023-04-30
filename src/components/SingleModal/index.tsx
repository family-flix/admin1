/**
 * @file 带有 Footer 的 Modal 组件
 */
import { JSX } from "solid-js";

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogHeader,
  // DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { DialogCore } from "@/domains/ui/dialog";

const Modal = (props: {
  core: DialogCore;
  title: string;
  children: JSX.Element;
  footer?: JSX.Element;
}) => {
  const { core, title, children, footer } = props;

  return (
    <Dialog core={core}>
      <DialogContent store={core}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {children}
        <DialogFooter>
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
                    core.cancel();
                  }}
                >
                  取消
                </Button>
                <Button
                  variant="default"
                  size="default"
                  onClick={async () => {
                    core.ok();
                  }}
                >
                  确认
                </Button>
              </div>
            );
          })()}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default Modal;
