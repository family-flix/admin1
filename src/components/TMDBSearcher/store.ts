import { TheMediaInTMDB } from "@/biz/services/media_profile";
import { ButtonCore, DialogCore } from "@/domains/ui";
import { BaseDomain, Handler } from "@/domains/base";
import { Response } from "@/domains/list/typing";
import { TMDBSearcherCore } from "@/biz/tmdb";
import { MediaTypes } from "@/constants";

enum Events {
  Ok,
  Cancel,
  StateChange,
}
type TheTypesOfEvents = {
  [Events.Ok]: TMDBSearcherDialogState;
  [Events.Cancel]: void;
  [Events.StateChange]: TMDBSearcherDialogState;
};
type TMDBSearcherDialogState = {
  value: null | TheMediaInTMDB;
  list: Response<TheMediaInTMDB>;
  showFooter: boolean;
};
type TMDBSearcherDialogProps = {
  type?: MediaTypes;
  /** 是否底部按钮 */
  footer: boolean;
  /** 是否展示确定按钮 */
  okBtn: boolean;
  /** 是否展示取消按钮 */
  cancelBtn: boolean;
  onCancel: () => void;
  onOk: (profile: TheMediaInTMDB) => void;
};

export class TMDBSearcherDialogCore extends BaseDomain<TheTypesOfEvents> {
  tmdb: TMDBSearcherCore;
  dialog: DialogCore;
  okBtn: ButtonCore;
  cancelBtn: ButtonCore;

  state: TMDBSearcherDialogState;

  constructor(options: Partial<{ _name: string } & TMDBSearcherDialogProps> = {}) {
    super(options);

    const { type, footer = true, onOk, onCancel } = options;
    this.dialog = new DialogCore({
      title: type === MediaTypes.Movie ? "搜索电影" : "搜索电视剧",
      footer,
      onOk: () => {
        if (onOk && this.tmdb.state.cur) {
          onOk(this.tmdb.state.cur);
        }
      },
      onCancel,
    });
    this.tmdb = new TMDBSearcherCore({
      type,
    });
    this.state = {
      value: null,
      list: this.tmdb.$list.response,
      showFooter: footer,
    };
    this.okBtn = this.dialog.okBtn;
    this.cancelBtn = this.dialog.cancelBtn;
    this.tmdb.$list.onStateChange((nextState) => {
      this.state.list = nextState;
      this.emit(Events.StateChange, { ...this.state });
    });
    this.tmdb.onTip((msg) => {
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
    this.tmdb.$list.refresh();
  }
  input(name: string) {
    this.tmdb.$input.setValue(name);
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
