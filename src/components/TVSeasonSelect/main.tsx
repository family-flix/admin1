import { Handler } from "mitt";
import { For, createSignal } from "solid-js";

import { ButtonCore, ButtonInListCore, DialogCore, DialogProps, InputCore } from "@/domains/ui";
import { Button, Dialog, Input, LazyImage, ListView, Skeleton, Textarea } from "@/components/ui";
import { ListCore } from "@/domains/list";
import { RequestCore } from "@/domains/request";
import { TVSeasonItem, fetch_season_list } from "@/services";
import { RefCore } from "@/domains/cur";
import { BaseDomain } from "@/domains/base";

enum Events {
  StateChange,
  ResponseChange,
  Change,
  Select,
  Clear,
}
type TheTypesOfEvents = {
  //   [Events.Change]: TVSeasonItem;
  [Events.Select]: TVSeasonItem;
  [Events.Clear]: void;
};
type TVSeasonSelectProps = {
  onSelect?: (v: TVSeasonItem) => void;
} & DialogProps;

export class TVSeasonSelectCore extends BaseDomain<TheTypesOfEvents> {
  curSeason = new RefCore<TVSeasonItem>();
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
  list = new ListCore(new RequestCore(fetch_season_list), {
    onLoadingChange: (loading) => {
      this.searchBtn.setLoading(loading);
    },
  });
  response = this.list.response;
  value = this.curSeason.value;

  constructor(props: Partial<{ _name: string }> & TVSeasonSelectProps) {
    super(props);

    const { onSelect, onOk, onCancel } = props;
    this.dialog = new DialogCore({
      title: "选择电视剧",
      onOk,
      onCancel,
    });
    this.okBtn = this.dialog.okBtn;
    this.cancelBtn = this.dialog.cancelBtn;

    this.list.onStateChange((nextState) => {
      this.response = nextState;
    });
    this.curSeason.onStateChange((nextState) => {
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
    this.curSeason.clear();
  }
  select(season: TVSeasonItem) {
    //     console.log("[COMPONENT]TVSeasonSelect - select", season);
    this.curSeason.select(season);
    this.emit(Events.Select, season);
  }

  onResponseChange(handler: Parameters<typeof this.list.onStateChange>[0]) {
    return this.list.onStateChange(handler);
  }
  onCurSeasonChange(handler: Parameters<typeof this.curSeason.onStateChange>[0]) {
    return this.curSeason.onStateChange(handler);
  }
  onSelect(handler: Handler<TheTypesOfEvents[Events.Select]>) {
    return this.on(Events.Select, handler);
  }
  onClear(handler: Handler<TheTypesOfEvents[Events.Clear]>) {
    return this.on(Events.Clear, handler);
  }
}

export const TVSeasonSelect = (props: { store: TVSeasonSelectCore }) => {
  const { store } = props;

  const [tvListResponse, setTVListResponse] = createSignal(store.response);
  const [curSeason, setCurSeason] = createSignal(store.value);

  store.onResponseChange((nextState) => {
    setTVListResponse(nextState);
  });
  store.onCurSeasonChange((nextState) => {
    //     console.log("[COMPONENT]TVSeasonSelect - store.onCurSeasonChange", nextState);
    setCurSeason(nextState);
  });

  return (
    <div>
      <div class="flex items-center space-x-2 mt-4">
        <Input store={store.nameInput} />
        <Button store={store.searchBtn} variant="subtle">
          搜索
        </Button>
      </div>
      <div class="mt-2">
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
            <For each={tvListResponse().dataSource}>
              {(season) => {
                const { id, tv_id, name, overview, poster_path, season_text } = season;
                // homeTVProfilePage.query = {
                //   id: season.tv_id,
                //   season_id: season.id,
                // };
                // const url = homeTVProfilePage.buildUrl();
                return (
                  <div
                    classList={{
                      "rounded-md border bg-white shadow-sm": true,
                      "border-green-500": curSeason()?.id === id,
                      "border-slate-300 ": curSeason()?.id !== id,
                    }}
                    onClick={() => {
                      //       console.log("[COMPONENT]TVSeasonSelect - onClick", season);
                      store.select(season);
                    }}
                  >
                    <div class="flex">
                      <div class="overflow-hidden mr-2 rounded-sm">
                        <LazyImage class="w-[120px] h-[180px]" src={poster_path} alt={name} />
                      </div>
                      <div class="flex-1 w-0 p-4">
                        <div class="flex items-center">
                          <h2 class="text-2xl text-slate-800">{name}</h2>
                          <p class="ml-4 text-slate-500">{season_text}</p>
                        </div>
                        <div class="mt-2 overflow-hidden text-ellipsis">
                          <p class="text-slate-700 break-all whitespace-pre-wrap truncate line-clamp-3">{overview}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }}
            </For>
          </div>
        </ListView>
      </div>
    </div>
  );
};
