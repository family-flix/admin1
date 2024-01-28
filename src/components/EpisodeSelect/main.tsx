/**
 * @file 剧集选择
 */
import { For, createSignal } from "solid-js";
import { Calendar } from "lucide-solid";

import { BaseDomain, Handler } from "@/domains/base";
import {
  ButtonCore,
  DialogCore,
  DialogProps,
  ImageInListCore,
  InputCore,
  PresenceCore,
  ScrollViewCore,
} from "@/domains/ui";
import { RefCore } from "@/domains/cur";
import { ListCore } from "@/domains/list";
import { RequestCore } from "@/domains/request";
import { Button, Input, LazyImage, ListView, ScrollView, Skeleton } from "@/components/ui";
import { Presence } from "@/components/ui/presence";
import {
  TheSeasonProfileInTMDB,
  TheTVProfileInTMDB,
  TheTVInTMDB,
  fetchSeasonProfileInTMDB,
  fetchTVProfileInTMDB,
  searchMediaInTMDB,
} from "@/domains/tmdb/services";
import { Response } from "@/domains/list/typing";

enum Events {
  StateChange,
  ResponseChange,
  Change,
  SelectTV,
  TVProfileLoaded,
  SelectSeason,
  SeasonProfileLoaded,
  SelectEpisode,
  Clear,
}
type TheTypesOfEvents = {
  [Events.SelectTV]: TheTVInTMDB;
  [Events.TVProfileLoaded]: TheTVProfileInTMDB;
  [Events.SelectSeason]: TheTVProfileInTMDB["seasons"][number];
  [Events.SeasonProfileLoaded]: TheSeasonProfileInTMDB;
  [Events.SelectEpisode]: TheSeasonProfileInTMDB["episodes"][number];
  [Events.Clear]: void;
  [Events.StateChange]: EpisodeSelectState;
};
type EpisodeSelectProps = {
  onSelect?: (episode: TheSeasonProfileInTMDB["episodes"][number]) => void;
} & DialogProps;
type EpisodeSelectState = {
  tvList: Response<TheTVInTMDB>;
  tvProfile: null | TheTVProfileInTMDB;
  seasonProfile: null | TheSeasonProfileInTMDB;
};

export class EpisodeSelectCore extends BaseDomain<TheTypesOfEvents> {
  curTV = new RefCore<TheTVInTMDB>();
  curSeason = new RefCore<TheTVProfileInTMDB["seasons"][number]>();
  curEpisode = new RefCore<TheSeasonProfileInTMDB["episodes"][number]>();
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
      this.list.search({ keyword: this.nameInput.value });
    },
  });
  dialog: DialogCore;
  /** 弹窗确定按钮 */
  okBtn: ButtonCore;
  /** 弹窗取消按钮 */
  cancelBtn: ButtonCore;
  tvPanel = new PresenceCore({
    open: true,
  });
  seasonPanel = new PresenceCore();
  episodePanel = new PresenceCore();
  /** 季列表 */
  list = new ListCore(new RequestCore(searchMediaInTMDB), {
    onLoadingChange: (loading) => {
      this.searchBtn.setLoading(loading);
    },
  });
  tvProfileRequest = new RequestCore(fetchTVProfileInTMDB, {
    onSuccess: (v) => {
      this.tvProfile = v;
      this.emit(Events.TVProfileLoaded, v);
      // this.emit(Events.StateChange, { ...this.state });
    },
  });
  seasonProfileRequest = new RequestCore(fetchSeasonProfileInTMDB, {
    onSuccess: (v) => {
      this.seasonProfile = v;
      this.emit(Events.SeasonProfileLoaded, v);
      // this.emit(Events.StateChange, { ...this.state });
    },
  });
  tvListResponse = this.list.response;
  tvProfile: null | TheTVProfileInTMDB = null;
  seasonProfile: null | TheSeasonProfileInTMDB = null;

  get state(): EpisodeSelectState {
    return {
      tvList: this.tvListResponse,
      tvProfile: null,
      seasonProfile: null,
    };
  }

  constructor(props: Partial<{ _name: string }> & EpisodeSelectProps) {
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
      this.tvListResponse = nextState;
      this.emit(Events.StateChange, { ...this.state });
    });
    // this.curTV.onStateChange((nextState) => {
    //   this.value = nextState;
    //   if (nextState === null) {
    //     this.emit(Events.Clear);
    //   }
    // });
    if (onSelect) {
      this.onSelectEpisode(onSelect);
    }
  }

  show() {
    this.dialog.show();
  }
  hide() {
    this.dialog.hide();
  }
  clear() {
    this.curTV.clear();
  }
  async selectTV(tv: TheTVInTMDB) {
    this.curTV.select(tv);
    this.emit(Events.SelectTV, tv);
    await this.tvProfileRequest.run({
      unique_id: String(tv.id),
    });
    this.tvPanel.hide();
    this.seasonPanel.show();
  }
  async selectSeason(season: TheTVProfileInTMDB["seasons"][number]) {
    if (!this.curTV.value) {
      return;
    }
    this.curSeason.select(season);
    this.emit(Events.SelectSeason, season);
    await this.seasonProfileRequest.run({
      unique_id: String(this.curTV.value.id),
      season_number: season.season_number,
    });
    this.seasonPanel.hide();
    this.episodePanel.show();
  }
  selectEpisode(episode: TheSeasonProfileInTMDB["episodes"][number]) {
    this.curEpisode.select(episode);
    this.emit(Events.SelectEpisode, episode);
  }

  onResponseChange(handler: Parameters<typeof this.list.onStateChange>[0]) {
    return this.list.onStateChange(handler);
  }
  onCurSeasonChange(handler: Parameters<typeof this.curTV.onStateChange>[0]) {
    return this.curTV.onStateChange(handler);
  }
  onSelectTV(handler: Handler<TheTypesOfEvents[Events.SelectTV]>) {
    return this.on(Events.SelectTV, handler);
  }
  onTVProfileLoaded(handler: Handler<TheTypesOfEvents[Events.TVProfileLoaded]>) {
    return this.on(Events.TVProfileLoaded, handler);
  }
  onSelectSeason(handler: Handler<TheTypesOfEvents[Events.SelectSeason]>) {
    return this.on(Events.SelectSeason, handler);
  }
  onSeasonProfileLoaded(handler: Handler<TheTypesOfEvents[Events.SeasonProfileLoaded]>) {
    return this.on(Events.SeasonProfileLoaded, handler);
  }
  onSelectEpisode(handler: Handler<TheTypesOfEvents[Events.SelectEpisode]>) {
    return this.on(Events.SelectEpisode, handler);
  }
  onClear(handler: Handler<TheTypesOfEvents[Events.Clear]>) {
    return this.on(Events.Clear, handler);
  }
  onStateChange(handler: Handler<TheTypesOfEvents[Events.StateChange]>) {
    return this.on(Events.StateChange, handler);
  }
}

export const EpisodeSelect = (props: { store: EpisodeSelectCore }) => {
  const { store } = props;

  const seriesPoster = new ImageInListCore({});
  const seasonPoster = new ImageInListCore({});

  const [tvListResponse, setTVListResponse] = createSignal(store.tvListResponse);
  const [tvProfileResponse, setTVProfile] = createSignal(store.tvProfile);
  const [seasonProfileResponse, setSeasonProfile] = createSignal(store.seasonProfile);
  const [curEpisode, setCurEpisode] = createSignal(store.curEpisode.value);

  const scrollView = new ScrollViewCore({
    onReachBottom() {
      store.list.loadMore();
    },
  });
  store.onStateChange((nextState) => {
    const { tvList } = nextState;
    setTVListResponse(tvList);
  });
  store.onTVProfileLoaded((v) => {
    setTVProfile(v);
  });
  store.onSeasonProfileLoaded((v) => {
    setSeasonProfile(v);
  });
  store.curEpisode.onStateChange((v) => {
    setCurEpisode(v);
  });
  // store.onCurSeasonChange((nextState) => {
  //   setCurSeason(nextState);
  // });

  return (
    <div>
      <Presence
        classList={{
          "min-h-[520px] opacity-100": true,
          "animate-in slide-in-from-right": true,
          "data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right": true,
        }}
        store={store.tvPanel}
      >
        <div class="flex items-center space-x-2 mt-4">
          <Input store={store.nameInput} />
          <Button store={store.searchBtn} variant="subtle">
            搜索
          </Button>
        </div>
        <ScrollView class="mt-2 h-[480px] overflow-y-auto" store={scrollView}>
          <ListView store={store.list}>
            <div class="space-y-4">
              <For each={tvListResponse().dataSource}>
                {(tv) => {
                  const { id, name, overview, air_date: first_air_date, poster_path } = tv;
                  return (
                    <div
                      classList={{
                        "rounded-md border bg-white shadow-sm": true,
                      }}
                      onClick={() => {
                        store.selectTV(tv);
                      }}
                    >
                      <div class="flex">
                        <div class="overflow-hidden mr-2 rounded-sm">
                          <LazyImage class="w-[120px] h-[180px]" store={seriesPoster.bind(poster_path)} alt={name} />
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
                              <div class="break-keep whitespace-nowrap">{first_air_date}</div>
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
      </Presence>
      <Presence
        classList={{
          "opacity-100": true,
          "animate-in slide-in-from-right": true,
          "data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right": true,
        }}
        store={store.seasonPanel}
      >
        <div class="space-y-4 h-[520px] overflow-y-auto">
          <For each={tvProfileResponse()?.seasons}>
            {(season) => {
              const { id, name, overview, season_number, air_date, poster_path } = season;
              return (
                <div
                  classList={{
                    "rounded-md border bg-white shadow-sm": true,
                  }}
                  onClick={() => {
                    store.selectSeason(season);
                  }}
                >
                  <div class="flex">
                    <div class="overflow-hidden mr-2 rounded-sm">
                      <LazyImage class="w-[60px]" store={seasonPoster.bind(poster_path)} alt={name} />
                    </div>
                    <div class="flex-1 w-0 p-2">
                      <div class="flex items-center">
                        <h2 class="text text-slate-800">{name}</h2>
                      </div>
                      <div class="overflow-hidden text-ellipsis">
                        <p class="text-slate-700 text-sm break-all whitespace-pre-wrap truncate line-clamp-3">
                          {overview}
                        </p>
                      </div>
                      <div class="flex items-center space-x-4 mt-2 break-keep overflow-hidden">
                        <div class="text-sm text-slate-500 break-keep whitespace-nowrap">{air_date}</div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            }}
          </For>
        </div>
      </Presence>
      <Presence
        classList={{
          "opacity-100": true,
          "animate-in slide-in-from-right": true,
          "data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right": true,
        }}
        store={store.episodePanel}
      >
        <div class="space-y-4 h-[520px] overflow-y-auto">
          <For each={seasonProfileResponse()?.episodes}>
            {(episode) => {
              const { id, name, overview, season_number, episode_number, air_date } = episode;
              return (
                <div
                  classList={{
                    "rounded-md border bg-white shadow-sm": true,
                    "border-green-500": curEpisode()?.id === id,
                    "border-slate-300 ": curEpisode()?.id !== id,
                  }}
                  onClick={() => {
                    store.selectEpisode(episode);
                  }}
                >
                  <div class="flex">
                    <div class="flex-1 w-0 p-2">
                      <div class="flex items-center">
                        <h2 class="text text-slate-800">{name}</h2>
                      </div>
                      <div class="flex items-center overflow-hidden text-ellipsis">
                        <span>{season_number}</span>
                        <span>/</span>
                        <span>{episode_number}</span>
                      </div>
                      <div class="flex items-center space-x-4 mt-2 break-keep overflow-hidden">
                        <div class="text-sm text-slate-500 break-keep whitespace-nowrap">{air_date}</div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            }}
          </For>
        </div>
      </Presence>
    </div>
  );
};
