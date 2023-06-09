import { BaseDomain } from "@/domains/base";
import { Response } from "@/domains/list/typing";
import { TMDBSearcherCore } from "@/domains/tmdb";
import { TheTVInTMDB } from "@/domains/tmdb/services";
import { ButtonCore } from "@/domains/ui/button";
import { DialogCore } from "@/domains/ui/dialog";
import { Handler } from "mitt";

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
  value: null | TheTVInTMDB;
  list: Response<TheTVInTMDB>;
  showFooter: boolean;
};
type TMDBSearcherDialogProps = {
  /** 是否底部按钮 */
  footer: boolean;
  /** 是否展示确定按钮 */
  okBtn: boolean;
  /** 是否展示取消按钮 */
  cancelBtn: boolean;
  onCancel: () => void;
  onOk: (searched_tv: TheTVInTMDB) => void;
};

export class TMDBSearcherDialogCore extends BaseDomain<TheTypesOfEvents> {
  tmdb = new TMDBSearcherCore();
  dialog: DialogCore;
  okBtn: ButtonCore;
  cancelBtn: ButtonCore;

  state: TMDBSearcherDialogState = {
    value: null,
    list: this.tmdb.list.response,
    showFooter: true,
  };

  constructor(options: Partial<{ _name: string } & TMDBSearcherDialogProps> = {}) {
    super(options);

    const { footer = true, onOk, onCancel } = options;
    this.dialog = new DialogCore({
      title: "搜索电视剧",
      footer,
      onOk: () => {
        if (onOk && this.tmdb.state.cur) {
          onOk(this.tmdb.state.cur);
        }
      },
      onCancel,
    });
    this.state.showFooter = footer;
    this.okBtn = this.dialog.okBtn;
    this.cancelBtn = this.dialog.cancelBtn;
    this.tmdb.list.onStateChange((nextState) => {
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
    this.tmdb.list.refresh();
  }
  input(name: string) {
    this.tmdb.input.change(name);
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
