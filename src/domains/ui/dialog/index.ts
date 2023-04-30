/**
 * @file 弹窗核心类
 */
import { Handler } from "mitt";

import { BaseDomain } from "@/domains/base";
import { PresenceCore } from "@/domains/ui/presence";
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
};

export class DialogCore extends BaseDomain<TheTypesOfEvents> {
  visible = false;
  present = new PresenceCore();

  constructor() {
    super();

    this.present.onShow(async () => {
      this.emit(Events.VisibleChange, true);
    });
    this.present.onHidden(async () => {
      this.emit(Events.VisibleChange, false);
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
}
