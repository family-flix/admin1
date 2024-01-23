import { TheMediaInTMDB, searchMediaInTMDB } from "@/services/media_profile";
import { BaseDomain, Handler } from "@/domains/base";
import { ButtonCore, InputCore } from "@/domains/ui";
import { ListCore } from "@/domains/list";
import { Response } from "@/domains/list/typing";
import { FormCore } from "@/domains/ui/form";
import { RequestCore } from "@/domains/request";
import { MediaTypes } from "@/constants";

enum Events {
  Select,
  StateChange,
}
type TheTypesOfEvents = {
  [Events.Select]: TheMediaInTMDB;
  [Events.StateChange]: TMDBSearcherState;
};
interface TMDBSearcherState {
  response: Response<TheMediaInTMDB>;
  cur: TheMediaInTMDB | null;
  curEpisode: { id: string | number } | null;
}
type TMDBSearcherProps = {
  type?: MediaTypes;
  episode?: boolean;
};

export class TMDBSearcherCore extends BaseDomain<TheTypesOfEvents> {
  type?: MediaTypes;

  $list = new ListCore(new RequestCore(searchMediaInTMDB));
  $form: FormCore<{}>;
  $input: InputCore<string>;
  searchBtn: ButtonCore;
  resetBtn: ButtonCore;

  cur: null | TheMediaInTMDB = null;
  curEpisode: null | { id: string | number } = null;
  needEpisode = false;
  get state(): TMDBSearcherState {
    return {
      response: this.$list.response,
      cur: this.cur,
      curEpisode: this.curEpisode,
    };
  }

  constructor(options: Partial<{ _name: string } & TMDBSearcherProps> = {}) {
    super(options);

    const { type, episode = false } = options;
    // console.log("[DOMAIN]TMDB - constructor ", this.list.response);
    if (type) {
      this.type = type;
    }
    this.needEpisode = episode;
    this.$list.setParams({ type: type || MediaTypes.Season });
    this.$form = new FormCore<{}>();

    this.searchBtn = new ButtonCore({
      onClick: () => {
        if (!this.$input.value) {
          this.tip({ text: ["请输入查询关键字"] });
          return;
        }
        this.$list.search({ keyword: this.$input.value });
      },
    });
    this.resetBtn = new ButtonCore({
      onClick: () => {
        this.$input.clear();
        this.$list.clear();
      },
    });
    this.$input = new InputCore({
      defaultValue: "",
      placeholder: type === MediaTypes.Movie ? "请输入电影名称" : "请输入电视剧名称",
      onEnter: () => {
        this.searchBtn.click();
      },
    });
    this.$list.onStateChange((nextState) => {
      this.emit(Events.StateChange, { ...this.state });
    });
    this.$list.onLoadingChange((loading) => {
      this.searchBtn.setLoading(loading);
    });
  }

  search(body: Parameters<typeof this.$list.search>[0]) {
    this.$list.search(body);
  }
  select(v: TheMediaInTMDB) {
    this.cur = v;
    this.emit(Events.StateChange, { ...this.state });
  }
  selectEpisode(v: { id: string | number }) {
    this.curEpisode = v;
    this.emit(Events.StateChange, { ...this.state });
  }
  unSelect() {
    this.cur = null;
    this.emit(Events.StateChange, { ...this.state });
  }
  toggle(v: TheMediaInTMDB) {
    if (this.cur === v) {
      this.cur = null;
      this.emit(Events.StateChange, { ...this.state });
      return;
    }
    this.cur = v;
    this.emit(Events.StateChange, { ...this.state });
  }

  onStateChange(handler: Handler<TheTypesOfEvents[Events.StateChange]>) {
    this.on(Events.StateChange, handler);
  }
}
