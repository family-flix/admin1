import { FileItem, searchDriveFiles } from "@/services/drive";
import { ButtonCore, DialogCore, InputCore } from "@/domains/ui";
import { BaseDomain, Handler } from "@/domains/base";
import { Response } from "@/domains/list/typing";
import { ListCore } from "@/domains/list";
import { RequestCore } from "@/domains/request";
import { JSONObject } from "@/types";

enum Events {
  Ok,
  Cancel,
  StateChange,
}
type TheTypesOfEvents = {
  [Events.Ok]: FileSearcherDialogState;
  [Events.Cancel]: void;
  [Events.StateChange]: FileSearcherDialogState;
};
type FileSearcherDialogState = {
  value: null | FileItem;
  list: Response<FileItem>;
  showFooter: boolean;
};
type FileSearcherDialogProps = {
  search: JSONObject;
  /** 是否底部按钮 */
  footer: boolean;
  /** 是否展示确定按钮 */
  okBtn: boolean;
  /** 是否展示取消按钮 */
  cancelBtn: boolean;
  onCancel: () => void;
  onOk: (file: FileItem) => void;
};

export class FileSearcherCore extends BaseDomain<TheTypesOfEvents> {
  $dialog = new DialogCore();
  $list = new ListCore(new RequestCore(searchDriveFiles));
  form = {
    input: new InputCore({
      defaultValue: "",
    }),
    btn: new ButtonCore(),
    reset: new ButtonCore(),
  };
  okBtn: ButtonCore;
  cancelBtn: ButtonCore;

  get state(): FileSearcherDialogState {
    return {
      value: null,
      list: this.$list.response,
      showFooter: true,
    };
  }

  constructor(options: Partial<{ _name: string } & FileSearcherDialogProps> = {}) {
    super(options);

    const { search, footer = true, onCancel } = options;
    this.$dialog = new DialogCore({
      title: "搜索云盘文件",
      footer,
      onCancel,
    });
    if (search) {
      this.$list.setParams((prev) => {
        return {
          ...prev,
          ...search,
        };
      });
    }
    this.$list.onLoadingChange((loading) => {
      this.form.btn.setLoading(loading);
      this.form.reset.setLoading(loading);
    });
    this.form.input.onEnter(() => {
      this.form.btn.click();
    });
    this.form.btn.onClick(() => {
      const name = this.form.input.value;
      if (!name) {
        this.tip({
          text: ["请输入文件名称"],
        });
        return;
      }
      this.$list.search({ name });
    });
    this.form.reset.onClick(() => {
      this.$list.reset();
    });
    this.okBtn = this.$dialog.okBtn;
    this.cancelBtn = this.$dialog.cancelBtn;
    this.$list.onStateChange((nextState) => {
      this.state.list = nextState;
      this.emit(Events.StateChange, { ...this.state });
    });
  }

  show() {
    this.$dialog.show();
  }
  hide() {
    this.$dialog.hide();
  }
  refresh() {
    this.$list.refresh();
  }
  input(name: string) {
    this.form.input.setValue(name);
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
