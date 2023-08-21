import { Handler } from "mitt";

import { BaseDomain } from "@/domains/base";
import { ButtonCore, InputCore } from "@/domains/ui";
import { ListCore } from "@/domains/list";
import { Response } from "@/domains/list/typing";
import { FormCore } from "@/domains/ui/form";
import { RequestCore } from "@/domains/client";

import { TheTVInTMDB, search_media_in_tmdb } from "./services";

enum Events {
  Select,
  StateChange,
}
type TheTypesOfEvents = {
  [Events.Select]: TheTVInTMDB;
  [Events.StateChange]: TMDBSearcherState;
};
interface TMDBSearcherState {
  response: Response<TheTVInTMDB>;
  cur: TheTVInTMDB | null;
}
type TMDBSearcherProps = {
  type?: "tv" | "movie";
};

export class TMDBSearcherCore extends BaseDomain<TheTypesOfEvents> {
  list = new ListCore(new RequestCore(search_media_in_tmdb));
  form: FormCore<{}>;
  input: InputCore;
  searchBtn: ButtonCore;
  resetBtn: ButtonCore;

  type?: string;
  state: TMDBSearcherState;

  constructor(options: Partial<{ _name: string } & TMDBSearcherProps> = {}) {
    super(options);

    const { type } = options;
    // console.log("[DOMAIN]TMDB - constructor ", this.list.response);
    if (type) {
      this.type = type;
      this.list.setParams({ type });
    }
    this.state = {
      cur: null,
      response: this.list.response,
    };
    this.form = new FormCore<{}>();

    this.searchBtn = new ButtonCore({
      onClick: () => {
        if (!this.input.value) {
          this.tip({ text: ["请输入查询关键字"] });
          return;
        }
        this.list.search({ keyword: this.input.value });
      },
    });
    this.resetBtn = new ButtonCore({
      onClick: () => {
        this.input.clear();
        this.list.clear();
      },
    });
    this.input = new InputCore({
      placeholder: type === "movie" ? "请输入电影名称" : "请输入电视剧名称",
      onEnter: () => {
        this.searchBtn.click();
      },
    });
    this.list.onStateChange((nextState) => {
      this.state.response = nextState;
      this.emit(Events.StateChange, { ...this.state });
    });
    this.list.onLoadingChange((loading) => {
      this.searchBtn.setLoading(loading);
    });
  }

  toggle(v: TheTVInTMDB) {
    if (this.state.cur === v) {
      this.state.cur = null;
      this.emit(Events.StateChange, { ...this.state });
      return;
    }
    this.state.cur = v;
    this.emit(Events.StateChange, { ...this.state });
  }

  onStateChange(handler: Handler<TheTypesOfEvents[Events.StateChange]>) {
    this.on(Events.StateChange, handler);
  }
}
