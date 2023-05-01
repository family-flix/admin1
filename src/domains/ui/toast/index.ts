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
  Ok,
  AnimationStart,
  AnimationEnd,
  ContentChange,
}
type TheTypesOfEvents = {
  [Events.BeforeShow]: void;
  [Events.Show]: void;
  [Events.BeforeHidden]: void;
  [Events.Hidden]: void;
  [Events.VisibleChange]: boolean;
  [Events.Ok]: void;
  [Events.Cancel]: void;
  [Events.AnimationStart]: void;
  [Events.AnimationEnd]: void;
  [Events.ContentChange]: {
    icon?: unknown;
    texts: string[];
  };
};

export class ToastCore extends BaseDomain<TheTypesOfEvents> {
  delay = 2000;
  timer: NodeJS.Timeout | null = null;
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
  async show(params: { icon?: unknown; texts: string[] }) {
    const { icon, texts } = params;
    this.emit(Events.ContentChange, {
      icon,
      texts,
    });
    if (this.timer !== null) {
      this.clearTimer();
      this.timer = setTimeout(() => {
        this.hide();
        this.clearTimer();
      }, this.delay);
      return;
    }
    this.present.show();
    this.timer = setTimeout(() => {
      this.hide();
      this.clearTimer();
    }, this.delay);
  }
  clearTimer() {
    if (this.timer === null) {
      return;
    }
    clearTimeout(this.timer);
    this.timer = null;
  }
  onShow(handler: Handler<TheTypesOfEvents[Events.Show]>) {
    this.on(Events.Show, handler);
  }
  onContentChange(handler: Handler<TheTypesOfEvents[Events.ContentChange]>) {
    this.on(Events.ContentChange, handler);
  }
  /** 隐藏弹窗 */
  hide() {
    this.present.hide();
  }
  onHide(handler: Handler<TheTypesOfEvents[Events.Hidden]>) {
    this.on(Events.Hidden, handler);
  }
  onVisibleChange(handler: Handler<TheTypesOfEvents[Events.VisibleChange]>) {
    this.on(Events.VisibleChange, handler);
  }

  get [Symbol.toStringTag]() {
    return "Toast";
  }
}
