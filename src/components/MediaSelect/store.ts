/**
 * @file
 */
import { ButtonCore, DialogCore } from "@/domains/ui";
import { BaseDomain, Handler } from "@/domains/base";
import { Response } from "@/domains/list/typing";
import { MediaSearchCore } from "@/domains/media_search";
import { MediaTypes } from "@/constants";
import { MediaProfileItem } from "@/services/common";

enum Events {
  Ok,
  Cancel,
  StateChange,
}
type TheTypesOfEvents = {
  [Events.Ok]: MediaSelectState;
  [Events.Cancel]: void;
  [Events.StateChange]: MediaSelectState;
};
type MediaSelectState = {
  value: null | MediaProfileItem;
  list: Response<MediaProfileItem>;
  showFooter: boolean;
};
type MediaSelectProps = {
  type?: MediaTypes;
  /** 是否底部按钮 */
  footer: boolean;
  /** 是否展示确定按钮 */
  okBtn: boolean;
  /** 是否展示取消按钮 */
  cancelBtn: boolean;
  onOk: (profile: MediaProfileItem) => void;
  onCancel: () => void;
};

export class MediaSelectCore extends BaseDomain<TheTypesOfEvents> {
  searcher: MediaSearchCore;
  dialog: DialogCore;
  okBtn: ButtonCore;
  cancelBtn: ButtonCore;

  state: MediaSelectState;

  constructor(options: Partial<{ _name: string } & MediaSelectProps> = {}) {
    super(options);

    const { type, footer = true, onOk, onCancel } = options;
    const title = (() => {
      if (!type) {
        return "搜索影视剧";
      }
      if (type === MediaTypes.Movie) {
        return "搜索电影";
      }
      if (type === MediaTypes.Season) {
        return "搜索电视剧";
      }
      return "搜索";
    })();
    this.dialog = new DialogCore({
      title,
      footer,
      onOk: () => {
        if (onOk && this.searcher.state.cur) {
          onOk(this.searcher.state.cur);
        }
      },
      onCancel,
    });
    this.searcher = new MediaSearchCore({
      type,
    });
    this.state = {
      value: null,
      list: this.searcher.$list.response,
      showFooter: footer,
    };
    this.okBtn = this.dialog.okBtn;
    this.cancelBtn = this.dialog.cancelBtn;
    this.searcher.$list.onStateChange((nextState) => {
      this.state.list = nextState;
      this.emit(Events.StateChange, { ...this.state });
    });
    this.searcher.onTip((msg) => {
      this.tip(msg);
    });
  }

  show() {
    this.dialog.show();
  }
  hide() {
    this.dialog.hide();
  }
  refresh() {
    this.searcher.$list.refresh();
  }
  input(name: string) {
    this.searcher.input.setValue(name);
  }

  onOk(handler: Handler<TheTypesOfEvents[Events.Ok]>) {
    this.on(Events.Ok, handler);
  }
  onCancel(handler: Handler<TheTypesOfEvents[Events.Ok]>) {
    this.on(Events.Ok, handler);
  }
  onStateChange(handler: Handler<TheTypesOfEvents[Events.StateChange]>) {
    this.on(Events.StateChange, handler);
  }
}
