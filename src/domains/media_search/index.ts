/**
 * @file 搜索本地数据库已归档的影视剧详情
 */
import { fetchMediaProfileList, MediaProfileItem } from "@/services/media_profile";
import { BaseDomain, Handler } from "@/domains/base";
import { ButtonCore, InputCore } from "@/domains/ui";
import { ListCore } from "@/domains/list";
import { Response } from "@/domains/list/typing";
import { FormCore } from "@/domains/ui/form";
import { RequestCore } from "@/domains/request";
import { MediaTypes } from "@/constants";

enum Events {
  Select,
  UnSelect,
  StateChange,
}
type TheTypesOfEvents = {
  [Events.Select]: MediaProfileItem;
  [Events.UnSelect]: null;
  [Events.StateChange]: MediaSearchState;
};
interface MediaSearchState {
  response: Response<MediaProfileItem>;
  cur: MediaProfileItem | null;
}
type MediaSearchProps = {
  type?: MediaTypes;
  onSelect?: (value: MediaProfileItem | null) => void;
};

export class MediaSearchCore extends BaseDomain<TheTypesOfEvents> {
  $list = new ListCore(new RequestCore(fetchMediaProfileList));
  form: FormCore<{}>;
  input: InputCore<string>;
  searchBtn: ButtonCore;
  resetBtn: ButtonCore;

  type?: MediaTypes;
  cur: null | MediaProfileItem = null;

  get state(): MediaSearchState {
    return {
      cur: this.cur,
      response: this.$list.response,
    };
  }

  constructor(options: Partial<{ _name: string } & MediaSearchProps> = {}) {
    super(options);

    const { type, onSelect } = options;
    if (type) {
      this.type = type;
      this.$list.setParams({ type });
    }
    this.form = new FormCore<{}>();
    this.searchBtn = new ButtonCore({
      onClick: () => {
        if (!this.input.value) {
          this.tip({ text: ["请输入查询关键字"] });
          return;
        }
        this.$list.search({ keyword: this.input.value });
      },
    });
    this.resetBtn = new ButtonCore({
      onClick: () => {
        this.input.clear();
        this.$list.clear();
      },
    });
    this.input = new InputCore({
      defaultValue: "",
      placeholder: type === MediaTypes.Movie ? "请输入电影名称" : "请输入电视剧名称",
      onEnter: () => {
        this.searchBtn.click();
      },
    });
    this.$list.onStateChange((nextState) => {
      // console.log("----1", this.$list.response.dataSource);
      this.emit(Events.StateChange, { ...this.state });
    });
    this.$list.onLoadingChange((loading) => {
      this.searchBtn.setLoading(loading);
    });
    if (onSelect) {
      this.onSelect((v) => {
        onSelect(v);
      });
      this.onUnSelect(() => {
        onSelect(null);
      });
    }
  }

  search(body: Parameters<typeof this.$list.search>[0]) {
    this.$list.search(body);
  }

  toggle(v: MediaProfileItem) {
    if (this.cur === v) {
      this.cur = null;
      this.emit(Events.UnSelect, null);
      this.emit(Events.StateChange, { ...this.state });
      return;
    }
    this.cur = v;
    this.emit(Events.Select, v);
    this.emit(Events.StateChange, { ...this.state });
  }

  onSelect(handler: Handler<TheTypesOfEvents[Events.Select]>) {
    this.on(Events.Select, handler);
  }
  onUnSelect(handler: Handler<TheTypesOfEvents[Events.UnSelect]>) {
    this.on(Events.UnSelect, handler);
  }
  onStateChange(handler: Handler<TheTypesOfEvents[Events.StateChange]>) {
    this.on(Events.StateChange, handler);
  }
}
