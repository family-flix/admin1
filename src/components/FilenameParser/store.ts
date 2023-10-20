import { BaseDomain, Handler } from "@/domains/base";
import { RequestCore } from "@/domains/request";
import { ButtonCore, InputCore } from "@/domains/ui";

import { VideoKeys, parseVideoFilename } from "./services";

export const VIDEO_KEY_NAME_MAP: Record<VideoKeys, string> = {
  name: "中文名称",
  original_name: "译名or外文原名",
  season: "季",
  episode: "集",
  episode_name: "集名称",
  resolution: "分辨率",
  year: "发布年",
  source: "来源",
  encode: "视频编码方式",
  voice_encode: "音频编码方式",
  episode_count: "总集数",
  type: "后缀",
  subtitle_lang: "字幕语言",
};
export const VIDEO_ALL_KEYS = Object.keys(VIDEO_KEY_NAME_MAP) as VideoKeys[];

enum Events {
  StateChange,
}
type TheTypesOfEvents = {
  [Events.StateChange]: FilenameParserState;
};
type FilenameParserState = {
  loading: boolean;
  fields: {
    label: string;
    text: string;
  }[];
};
type FilenameParserProps = {};

export class FilenameParserCore extends BaseDomain<TheTypesOfEvents> {
  input: InputCore<string>;
  btn: ButtonCore;

  loading: FilenameParserState["loading"] = false;
  fields: FilenameParserState["fields"] = [];

  get state(): FilenameParserState {
    return {
      loading: this.loading,
      fields: this.fields,
    };
  }

  constructor(props: FilenameParserProps) {
    super(props);

    const request = new RequestCore(parseVideoFilename, {
      onLoading: (loading) => {
        this.loading = true;
        btn.setLoading(loading);
      },
      onSuccess: (v) => {
        this.fields = Object.keys(v).map((k) => {
          const kk = k as VideoKeys;
          const label = VIDEO_KEY_NAME_MAP[kk];
          const value = v[kk];
          return {
            label,
            text: value,
          };
        });
        this.emit(Events.StateChange, { ...this.state });
      },
    });
    const input = new InputCore({
      defaultValue: "",
      placeholder: "请输入要解析的文件名",
      onEnter() {
        btn.click();
      },
    });
    this.input = input;
    const btn = new ButtonCore({
      onClick: () => {
        if (!input.value) {
          this.tip({ text: ["请输入要解析的文件名"] });
          return;
        }
        request.run({
          name: input.value,
          keys: VIDEO_ALL_KEYS,
        });
      },
    });
    this.btn = btn;
    request.onTip((msg) => {
      this.tip(msg);
    });
  }

  onStateChange(handler: Handler<TheTypesOfEvents[Events.StateChange]>) {
    return this.on(Events.StateChange, handler);
  }
}
