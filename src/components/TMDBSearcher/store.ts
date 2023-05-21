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
};
type TMDBSearcherDialogProps = {
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
  };

  constructor(options: Partial<{ name } & TMDBSearcherDialogProps> = {}) {
    super(options);

    const { onOk, onCancel } = options;
    this.dialog = new DialogCore({
      onOk: () => {
        // this.emit(Events.Ok, { value: this.tmdb.state.cur });
        if (onOk) {
          onOk(this.tmdb.state.cur);
        }
      },
      onCancel,
    });
    this.okBtn = this.dialog.okBtn;
    this.cancelBtn = this.dialog.cancelBtn;
    this.tmdb.list.onStateChange((nextState) => {
      this.state.list = nextState;
      this.emit(Events.StateChange, { ...this.state });
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
