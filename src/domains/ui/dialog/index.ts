/**
 * @file 弹窗核心类
 */
import { Handler } from "mitt";

import { BaseDomain } from "@/domains/base";
import { PresenceCore } from "@/domains/ui/presence";
import { ButtonCore } from "@/domains/ui/button";
import { sleep } from "@/utils";

enum Events {
  BeforeShow,
  Show,
  BeforeHidden,
  Hidden,
  VisibleChange,
  Cancel,
  OK,
  AnimationStart,
  AnimationEnd,
  StateChange,
}
type TheTypesOfEvents = {
  [Events.BeforeShow]: void;
  [Events.Show]: void;
  [Events.BeforeHidden]: void;
  [Events.Hidden]: void;
  [Events.VisibleChange]: boolean;
  [Events.OK]: void;
  [Events.Cancel]: void;
  [Events.AnimationStart]: void;
  [Events.AnimationEnd]: void;
  [Events.StateChange]: DialogState;
};
type DialogState = {
  open: boolean;
  title: string;
  footer?: boolean;
};
type DialogProps = {
  title: string;
  footer?: boolean;
  onCancel: () => void;
  onOk: () => void;
};

export class DialogCore extends BaseDomain<TheTypesOfEvents> {
  visible = false;
  present = new PresenceCore();
  okBtn = new ButtonCore();
  cancelBtn = new ButtonCore();

  state: DialogState = {
    open: false,
    title: "",
  };

  constructor(options: Partial<{ name: string } & DialogProps> = {}) {
    super(options);

    const { title, footer = true, onOk, onCancel } = options;
    if (title) {
      this.state.title = title;
    }
    this.state.footer = footer;
    if (onOk) {
      this.onOk(onOk);
    }
    this.onCancel(
      (() => {
        if (onCancel) {
          return onCancel;
        }
        return () => {
          this.hide();
        };
      })()
    );
    this.present.onShow(async () => {
      this.state.open = true;
      this.emit(Events.VisibleChange, true);
      this.emit(Events.StateChange, { ...this.state });
    });
    this.present.onHidden(async () => {
      this.state.open = false;
      this.emit(Events.VisibleChange, false);
      this.emit(Events.StateChange, { ...this.state });
    });
    this.okBtn.onClick(() => {
      this.ok();
    });
    this.cancelBtn.onClick(() => {
      this.cancel();
    });
  }
  /** 显示弹窗 */
  show() {
    // this.emit(Events.BeforeShow);
    this.present.show();
  }
  /** 隐藏弹窗 */
  hide() {
    // this.emit(Events.Cancel);
    this.present.hide();
  }
  ok() {
    this.emit(Events.OK);
  }
  cancel() {
    this.emit(Events.Cancel);
  }
  setTitle(title: string) {
    this.state.title = title;
    this.emit(Events.StateChange, { ...this.state });
  }

  onShow(handler: Handler<TheTypesOfEvents[Events.Show]>) {
    this.on(Events.Show, handler);
  }
  onHide(handler: Handler<TheTypesOfEvents[Events.Hidden]>) {
    this.on(Events.Hidden, handler);
  }
  onVisibleChange(handler: Handler<TheTypesOfEvents[Events.VisibleChange]>) {
    this.on(Events.VisibleChange, handler);
  }
  onOk(handler: Handler<TheTypesOfEvents[Events.OK]>) {
    this.on(Events.OK, handler);
  }
  onCancel(handler: Handler<TheTypesOfEvents[Events.Cancel]>) {
    this.on(Events.Cancel, handler);
  }
  onStateChange(handler: Handler<TheTypesOfEvents[Events.StateChange]>) {
    this.on(Events.StateChange, handler);
  }

  get [Symbol.toStringTag]() {
    return "Dialog";
  }
}
