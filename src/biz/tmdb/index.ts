import { TheMediaInTMDB, searchMediaInTMDB } from "@/biz/services/media_profile";
import { base, BaseDomain, Handler } from "@/domains/base";
import { ButtonCore, InputCore, SelectCore } from "@/domains/ui/index";
import { ListCore } from "@/domains/list/index";
import { Response } from "@/domains/list/typing";
import { FormCore } from "@/domains/ui/form";
import { FormFieldCore } from "@/domains/ui/form/field";
import { ListContainerCore } from "@/domains/ui/form/list";
import { DatePickerCore } from "@/domains/ui/date-picker";
import { RequestCore } from "@/domains/request/index";
import { MediaTypes } from "@/constants/index";
import { ImageUploadCore } from "@/domains/ui/form/image-upload";
import { ViewComponentProps } from "@/store/types";

interface TMDBSearcherState {
  response: Response<TheMediaInTMDB>;
  cur: TheMediaInTMDB | null;
  curEpisode: { id: string | number } | null;
}
type TMDBSearcherProps = {
  type?: MediaTypes;
  episode?: boolean;
};

export function TMDBSearcherCore(props: TMDBSearcherProps) {
  const { type, episode = false } = props;

  let _type: MediaTypes;

  let _cur: null | TheMediaInTMDB = null;
  let _cur_episode: null | { id: string | number } = null;
  let _need_episode = episode;
  let _values: Record<string, any> = {};

  // console.log("[DOMAIN]TMDB - constructor ", this.list.response);
  if (type) {
    _type = type;
  }
  // this.needEpisode = episode;
  const $list = new ListCore(new RequestCore(searchMediaInTMDB));

  const searchBtn = new ButtonCore({
    onClick: () => {
      if (!$input.value) {
        bus.tip({ text: ["请输入查询关键字"] });
        return;
      }
      $list.search({ keyword: $input.value });
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
          defaultValue: MediaTypes.Movie,
          options: [
            {
              label: "电影",
              value: MediaTypes.Movie,
            },
            {
              label: "电视剧",
              value: MediaTypes.Season,
            },
          ],
        }),
      }),
      cover: new FormFieldCore({
        label: "封面",
        name: "cover",
        input: ImageUploadCore({ tip: "拖动图片到此处" }),
      }),
      title: new FormFieldCore({
        label: "标题",
        name: "title",
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
      num: new FormFieldCore({
        label: "序号",
        name: "num",
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

  function updateCustomValues(values: any) {
    _values = values;
  }

  $list.setParams({ type: type || MediaTypes.Season });
  $list.onStateChange((v) => {
    bus.emit(Events.StateChange, { ..._state });
  });
  $list.onLoadingChange((loading) => {
    searchBtn.setLoading(loading);
  });
  $values.onChange((v) => {
    // console.log("[COMPONENT]TMDBSearcher - values onChange", v);
    updateCustomValues(v);
  });

  const _state = {
    get response() {
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
    StateChange,
  }
  type TheTypesOfEvents = {
    [Events.Select]: TheMediaInTMDB;
    [Events.StateChange]: typeof _state;
  };
  const bus = base<TheTypesOfEvents>();

  return {
    ui: {
      $input,
      $list,
      $values,
      searchBtn,
      resetBtn,
    },
    state: _state,
    $list,
    $input,
    get type() {
      return _type;
    },
    get needEpisode() {
      return _need_episode;
    },
    search(body: Parameters<typeof $list.search>[0]) {
      $list.search(body);
    },
    select(v: TheMediaInTMDB) {
      _cur = v;
      bus.emit(Events.StateChange, { ..._state });
    },
    selectEpisode(v: { id: string | number }) {
      _cur_episode = v;
      bus.emit(Events.StateChange, { ..._state });
    },
    unSelect() {
      _cur = null;
      bus.emit(Events.StateChange, { ..._state });
    },
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
    onStateChange(handler: Handler<TheTypesOfEvents[Events.StateChange]>) {
      bus.on(Events.StateChange, handler);
    },
  };
}

export type TMDBSearcherCore = ReturnType<typeof TMDBSearcherCore>;
