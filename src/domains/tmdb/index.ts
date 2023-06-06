import { Handler } from "mitt";

import { BaseDomain } from "@/domains/base";
import { ListCore } from "@/domains/list";
import { Response } from "@/domains/list/typing";
import { FormCore } from "@/domains/ui/form";
import { InputCore } from "@/domains/ui/input";
import { ButtonCore } from "@/domains/ui/button";

import { TheTVInTMDB, search_tv_in_tmdb } from "./services";
import { RequestCore } from "../client";

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
type TMDBSearcherProps = {};

export class TMDBSearcherCore extends BaseDomain<TheTypesOfEvents> {
  list = new ListCore(new RequestCore(search_tv_in_tmdb));
  form: FormCore<{}>;
  input: InputCore;
  searchBtn: ButtonCore;
  resetBtn: ButtonCore;

  state: TMDBSearcherState = {
    cur: null,
    response: this.list.response,
  };

  constructor(options: Partial<{ name: string } & TMDBSearcherProps> = {}) {
    super(options);

    this.form = new FormCore<{}>();
    this.input = new InputCore({
      placeholder: "请输入电视剧名称",
    });
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
