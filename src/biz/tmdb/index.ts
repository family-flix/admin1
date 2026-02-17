/**
 * @file TMDB 搜索
 */
import { ViewComponentProps } from "@/store/types";
import { TheMediaInTMDB, searchMediaInTMDB, searchJavbus } from "@/biz/services/media_profile";
import { UnknownSeasonMediaItem } from "@/biz/services/parsed_media";
import { MediaSearchCore } from "@/biz/media_search";
import { prepareEpisodeList, prepareSeasonList } from "@/biz/services/media_profile";
import { base, BaseDomain, Handler } from "@/domains/base";
import { ButtonCore, ImageInListCore, InputCore, PresenceCore, ScrollViewCore, SelectCore } from "@/domains/ui/index";
import { ListCore } from "@/domains/list/index";
import { Response } from "@/domains/list/typing";
import { FormCore } from "@/domains/ui/form";
import { FormFieldCore } from "@/domains/ui/form/field";
import { ListContainerCore } from "@/domains/ui/form/list";
import { DatePickerCore } from "@/domains/ui/date-picker";
import { RequestCore, TheResponseOfFetchFunction } from "@/domains/request/index";
import { ImageUploadCore } from "@/domains/ui/form/image-upload";
import { TabHeaderCore } from "@/domains/ui/tab-header";
import { MediaTypes } from "@/constants/index";
import { sleep } from "@/utils/index";

interface TMDBSearcherState {
  response: Response<TheMediaInTMDB>;
  cur: TheMediaInTMDB | null;
  curEpisode: { id: string | number } | null;
}
type TMDBSearcherProps = {
  /**
   * 查询影视剧类型 如果不传就会出现 电视剧/电影 tab 可以切换
   * 如果传了 就没有 tab 并且仅搜索传入的 type 类型
   */
  type?: MediaTypes;
  /** 是否支持选择剧集 点击了季之后会出现剧集列表可以选择 */
  episode?: boolean;
  /** 是否支持自定义详情 出现 自定义 tab */
  custom?: boolean;
};

export function TMDBSearcherCore(props: TMDBSearcherProps = {}) {
  const { type, episode = false, custom = false } = props;

  let _type: MediaTypes;

  let _cur: null | TheMediaInTMDB = null;
  let _cur_episode: null | { id: string | number } = null;
  let _need_episode = episode;
  let _episodes: TheResponseOfFetchFunction<typeof prepareEpisodeList>["list"][number][] = [];

  // console.log("[DOMAIN]TMDB - constructor ", this.list.response);
  if (type) {
    _type = type;
  }

  function select(v: TheMediaInTMDB) {
    _cur = v;
    bus.emit(Events.StateChange, { ..._state });
  }
  function unSelect() {
    _cur = null;
    bus.emit(Events.StateChange, { ..._state });
  }

  // this.needEpisode = episode;
  const $list = new ListCore(new RequestCore(searchMediaInTMDB));
  const $list_av = new ListCore(new RequestCore(searchJavbus));
  const tab = new TabHeaderCore({
    key: "id",
    options: [
      {
        id: "season",
        text: "电视剧",
      },
      {
        id: "movie",
        text: "电影",
      },
      {
        id: "av",
        text: "AV",
      },
      {
        id: "custom",
        text: "自定义",
        hidden: !custom,
      },
    ],
    async onChange(value) {
      if (value.id === "custom") {
        searchPanel.hide();
        await sleep(200);
        $custom.show();
        return;
      }
      _curTab = value.id;
      // const map: Record<string, MediaTypes> = {
      //   season: MediaTypes.Season,
      //   movie: MediaTypes.Movie,
      //   av: MediaTypes.AV,
      // };
      // const keyword = $input.value;
      // if (keyword) {
      //   if (value.id === "av") {
      //     $list_av.search({ keyword });
      //     return;
      //   }
      //   $list.search({
      //     type: map[value.id],
      //   });
      // }
    },
    onMounted() {
      console.log("[BIZ]tmdb/index - tab mounted", _type);
      if (_type) {
        if (_type === MediaTypes.Movie) {
          tab.selectById("movie");
        }
        if (_type === MediaTypes.Season) {
          tab.selectById("season");
        }
        if (_type === MediaTypes.AV) {
          tab.selectById("av");
        }
        return;
      }
      tab.selectById("season");
    },
  });
  const searchPanel = new PresenceCore({
    visible: true,
  });
  const seasonPanel = new PresenceCore();
  const episodePanel = new PresenceCore();
  // const episodePanel = new PresenceCore();
  const mediaSearch = new MediaSearchCore({
    type: MediaTypes.Season,
    async onSelect(value) {
      if (_need_episode) {
        if (!value) {
          return;
        }
        select(value);
        const r = await new RequestCore(prepareEpisodeList).run({
          media_id: value.id,
        });
        if (r.error) {
          bus.tip({
            text: ["获取剧集失败", r.error.message],
          });
          return;
        }
        seasonPanel.hide();
        episodePanel.show();
        _episodes = r.data.list;
        bus.emit(Events.EpisodesChange, [..._episodes]);
        return;
      }
      if (value) {
        select(value);
        return;
      }
      unSelect();
    },
  });
  const poster = new ImageInListCore({});
  const scrollView = new ScrollViewCore({
    // onScroll(pos) {
    //   console.log('scroll', pos);
    // },
    async onReachBottom() {
      await $list.loadMore();
      scrollView.finishLoadingMore();
    },
  });
  const $custom = new PresenceCore();
  const searchBtn = new ButtonCore({
    onClick: () => {
      const keyword = $input.value;
      if (!keyword) {
        bus.tip({ text: ["请输入查询关键字"] });
        return;
      }
      // const value = tab.state;
      const curTab = tab.state.curId;
      const map: Record<string, MediaTypes> = {
        season: MediaTypes.Season,
        movie: MediaTypes.Movie,
        av: MediaTypes.AV,
      };
      const type = curTab ? map[curTab] : null;
      if (!type) {
        bus.tip({ text: ["不匹配的tab"] });
        return;
      }
      if (curTab === "av") {
        $list_av.search({ keyword });
        return;
      }
      $list.search({
        type: type,
      });
    },
  });
  const resetBtn = new ButtonCore({
    onClick: () => {
      $input.clear();
      $list.clear();
    },
  });
  const $input = new InputCore({
    defaultValue: "",
    placeholder: type === MediaTypes.Movie ? "请输入电影名称" : "请输入电视剧名称",
    onEnter: () => {
      searchBtn.click();
    },
  });
  const $values = FormCore({
    fields: {
      type: new FormFieldCore({
        label: "类型",
        name: "type",
        tip: "有多集需要选择 电视剧 选项",
        input: new SelectCore({
          defaultValue: type || MediaTypes.Season,
          options: [
            {
              label: "电影",
              value: MediaTypes.Movie,
            },
            {
              label: "电视剧",
              value: MediaTypes.Season,
            },
            {
              label: "AV",
              value: MediaTypes.AV,
            },
          ],
        }),
      }),
      cover: new FormFieldCore({
        label: "封面",
        name: "cover",
        input: ImageUploadCore({ tip: "拖动图片到此处" }),
      }),
      name: new FormFieldCore({
        label: "标题",
        name: "name",
        input: new InputCore({
          defaultValue: "",
        }),
      }),
      air_date: new FormFieldCore({
        label: "发布时间",
        name: "air_date",
        input: DatePickerCore({
          today: new Date(),
        }),
      }),
      overview: new FormFieldCore({
        label: "描述",
        name: "overview",
        input: new InputCore({
          defaultValue: "",
        }),
      }),
      order: new FormFieldCore({
        label: "序号",
        name: "order",
        input: new InputCore({
          defaultValue: 1,
        }),
      }),
      episodes: new FormFieldCore({
        label: "剧集",
        name: "episodes",
        input: ListContainerCore({
          defaultValue: [
            {
              name: "第一集",
              overview: "",
            },
          ],
          factory: () =>
            FormCore({
              fields: {
                name: new FormFieldCore({
                  label: "名称",
                  name: "name",
                  input: new InputCore({ defaultValue: "" }),
                }),
                overview: new FormFieldCore({
                  label: "简介",
                  name: "overview",
                  input: new InputCore({ defaultValue: "" }),
                }),
              },
            }),
        }),
      }),
    },
  });

  // function updateCustomValues(values: any) {
  //   _values = values;
  // }

  $list.setParams({ type: type || MediaTypes.Season });
  $list.onStateChange((v) => {
    bus.emit(Events.StateChange, { ..._state });
  });
  $list_av.onStateChange((v) => {
    // console.log("[]TMDBSearchCore - $list_av.onStateChange", v.dataSource);
    $list.modifyResponse(() => {
      return $list_av.response;
    });
    bus.emit(Events.StateChange, { ..._state });
  });
  $list.onLoadingChange((loading) => {
    searchBtn.setLoading(loading);
  });
  $list_av.onStateChange((v) => {
    bus.emit(Events.StateChange, { ..._state });
  });
  $list_av.onLoadingChange((loading) => {
    searchBtn.setLoading(loading);
  });
  // $values.onChange((v) => {
  //   // console.log("[COMPONENT]TMDBSearcher - values onChange", v);
  //   updateCustomValues(v);
  // });
  $values.fields.type.$input.onChange((v) => {
    if (v === MediaTypes.Movie) {
      $values.fields.episodes.hide();
    }
    if (v === MediaTypes.Season) {
      $values.fields.episodes.show();
    }
    if (v === MediaTypes.AV) {
      $values.fields.episodes.hide();
    }
  });

  let _curTab = "season";
  const _state = {
    get response() {
      // if (_curTab === "av") {
      //   return $list_av.response;
      // }
      return $list.response;
    },
    get cur() {
      return _cur;
    },
    get curEpisode() {
      return _cur_episode;
    },
  };

  enum Events {
    Select,
    EpisodesChange,
    StateChange,
  }
  type TheTypesOfEvents = {
    [Events.Select]: TheMediaInTMDB;
    [Events.EpisodesChange]: TheResponseOfFetchFunction<typeof prepareEpisodeList>["list"][number][];
    [Events.StateChange]: typeof _state;
  };
  const bus = base<TheTypesOfEvents>();

  return {
    ui: {
      $input,
      $list,
      $list_av,
      $values,
      searchBtn,
      resetBtn,
      mediaSearch,
      $custom,
      searchPanel,
      seasonPanel,
      episodePanel,
      tab,
      poster,
      scrollView,
    },
    state: _state,
    get values() {
      return $values.value;
    },
    get episodes() {
      return _episodes;
    },
    $list,
    $input,
    get type() {
      return _type;
    },
    get needEpisode() {
      return _need_episode;
    },
    get cur() {
      return _cur;
    },
    get curEpisode() {
      return _cur_episode;
    },
    setValues(values: UnknownSeasonMediaItem) {
      const { name, sources, season_text, source_count } = values;
      $values.fields.name.setValue(name);
      $values.fields.type.setValue(MediaTypes.Season);
      $values.fields.episodes.$input.setValue(
        [...new Array(source_count)].map((_, i) => {
          return {
            name: `第 ${i + 1} 集`,
            overview: "",
          };
        }),
      );
    },
    search(body: Parameters<typeof $list.search>[0]) {
      $list.search(body);
    },
    select,
    selectEpisode(v: { id: string | number }) {
      _cur_episode = v;
      bus.emit(Events.StateChange, { ..._state });
    },
    unSelect,
    toggle(v: TheMediaInTMDB) {
      if (_cur === v) {
        _cur = null;
        bus.emit(Events.StateChange, { ..._state });
        return;
      }
      _cur = v;
      bus.emit(Events.StateChange, { ..._state });
    },
    tip: bus.tip,
    onTip: bus.onTip,
    onEpisodesChange(handler: Handler<TheTypesOfEvents[Events.EpisodesChange]>) {
      return bus.on(Events.EpisodesChange, handler);
    },
    onStateChange(handler: Handler<TheTypesOfEvents[Events.StateChange]>) {
      return bus.on(Events.StateChange, handler);
    },
  };
}

export type TMDBSearcherCore = ReturnType<typeof TMDBSearcherCore>;
