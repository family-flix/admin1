/**
 * @file 电影选择
 */
import { For, createSignal } from "solid-js";
import { Calendar } from "lucide-solid";

import { MovieItem, fetchMovieList } from "@/services";
import { BaseDomain, Handler } from "@/domains/base";
import { Button, Input, LazyImage, ListView, ScrollView, Skeleton } from "@/components/ui";
import { ButtonCore, DialogCore, DialogProps, ImageInListCore, InputCore, ScrollViewCore } from "@/domains/ui";
import { RefCore } from "@/domains/cur";
import { ListCore } from "@/domains/list";
import { RequestCore } from "@/domains/request";
import { fetchMovieMediaList } from "@/services/media";

enum Events {
  StateChange,
  ResponseChange,
  Change,
  Select,
  Clear,
}
type TheTypesOfEvents = {
  //   [Events.Change]: TVSeasonItem;
  [Events.Select]: MovieItem;
  [Events.Clear]: void;
};
type MovieSelectProps = {
  onSelect?: (v: MovieItem) => void;
} & DialogProps;

export class MovieSelectCore extends BaseDomain<TheTypesOfEvents> {
  curMovie = new RefCore<MovieItem>();
  /** 名称搜索输入框 */
  nameInput = new InputCore({
    defaultValue: "",
    placeholder: "请输入名称搜索",
    onEnter: () => {
      this.searchBtn.click();
    },
  });
  /** 搜索按钮 */
  searchBtn = new ButtonCore({
    onClick: () => {
      this.list.search({ name: this.nameInput.value });
    },
  });
  dialog: DialogCore;
  /** 弹窗确定按钮 */
  okBtn: ButtonCore;
  /** 弹窗取消按钮 */
  cancelBtn: ButtonCore;
  /** 季列表 */
  list = new ListCore(new RequestCore(fetchMovieMediaList), {
    onLoadingChange: (loading) => {
      this.searchBtn.setLoading(loading);
    },
  });
  response = this.list.response;
  value = this.curMovie.value;

  constructor(props: Partial<{ _name: string }> & MovieSelectProps) {
    super(props);

    const { onSelect, onOk, onCancel } = props;
    this.dialog = new DialogCore({
      title: "选择电影",
      onOk,
      onCancel,
    });
    this.okBtn = this.dialog.okBtn;
    this.cancelBtn = this.dialog.cancelBtn;

    this.list.onStateChange((nextState) => {
      this.response = nextState;
    });
    this.curMovie.onStateChange((nextState) => {
      this.value = nextState;
      if (nextState === null) {
        this.emit(Events.Clear);
      }
    });
    if (onSelect) {
      this.onSelect(onSelect);
    }
  }

  show() {
    this.dialog.show();
  }
  hide() {
    this.dialog.hide();
  }
  clear() {
    this.curMovie.clear();
  }
  select(season: MovieItem) {
    //     console.log("[COMPONENT]TVSeasonSelect - select", season);
    this.curMovie.select(season);
    this.emit(Events.Select, season);
  }

  onResponseChange(handler: Parameters<typeof this.list.onStateChange>[0]) {
    return this.list.onStateChange(handler);
  }
  onCurSeasonChange(handler: Parameters<typeof this.curMovie.onStateChange>[0]) {
    return this.curMovie.onStateChange(handler);
  }
  onSelect(handler: Handler<TheTypesOfEvents[Events.Select]>) {
    return this.on(Events.Select, handler);
  }
  onClear(handler: Handler<TheTypesOfEvents[Events.Clear]>) {
    return this.on(Events.Clear, handler);
  }
}

export const MovieSelect = (props: { store: MovieSelectCore }) => {
  const { store } = props;

  const poster = new ImageInListCore({});
  const scrollView = new ScrollViewCore({
    onReachBottom() {
      store.list.loadMore();
    },
  });

  const [movieListState, setMovieListState] = createSignal(store.response);
  const [curMovie, setCurMovie] = createSignal(store.value);

  store.onResponseChange((nextState) => {
    setMovieListState(nextState);
  });
  store.onCurSeasonChange((nextState) => {
    //     console.log("[COMPONENT]TVSeasonSelect - store.onCurSeasonChange", nextState);
    setCurMovie(nextState);
  });

  store.list.init();

  return (
    <div>
      <div class="flex items-center space-x-2 mt-4">
        <Input store={store.nameInput} />
        <Button store={store.searchBtn} variant="subtle">
          搜索
        </Button>
      </div>
      <ScrollView class="mt-2 h-[480px] overflow-y-auto" store={scrollView}>
        <ListView
          store={store.list}
          skeleton={
            <div>
              <div class="rounded-md border border-slate-300 bg-white shadow-sm">
                <div class="flex">
                  <div class="overflow-hidden mr-2 rounded-sm">
                    <Skeleton class="w-[120px] h-[180px]" />
                  </div>
                  <div class="flex-1 p-4">
                    <Skeleton class="h-[36px] w-[180px]"></Skeleton>
                    <div class="mt-2 space-y-1">
                      <Skeleton class="h-[24px] w-[120px]"></Skeleton>
                      <Skeleton class="h-[24px] w-[240px]"></Skeleton>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          }
        >
          <div class="space-y-4">
            <For each={movieListState().dataSource}>
              {(season) => {
                const { id, name, overview, poster_path, air_date } = season;
                return (
                  <div
                    classList={{
                      "rounded-md border bg-white shadow-sm": true,
                      "border-green-500": curMovie()?.id === id,
                      "border-slate-300 ": curMovie()?.id !== id,
                    }}
                    onClick={() => {
                      store.select(season);
                    }}
                  >
                    <div class="flex">
                      <div class="overflow-hidden mr-2 rounded-sm">
                        <LazyImage class="w-[120px] h-[180px]" store={poster.bind(poster_path)} alt={name} />
                      </div>
                      <div class="flex-1 w-0 p-4">
                        <div class="flex items-center">
                          <h2 class="text-2xl text-slate-800">{name}</h2>
                        </div>
                        <div class="mt-2 overflow-hidden text-ellipsis">
                          <p class="text-slate-700 break-all whitespace-pre-wrap truncate line-clamp-3">{overview}</p>
                        </div>
                        <div class="flex items-center space-x-4 mt-2 break-keep overflow-hidden">
                          <div class="flex items-center space-x-1 px-2 border border-slate-600 rounded-xl text-slate-600">
                            <Calendar class="w-4 h-4 text-slate-800" />
                            <div class="break-keep whitespace-nowrap">{air_date}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }}
            </For>
          </div>
        </ListView>
      </ScrollView>
    </div>
  );
};
