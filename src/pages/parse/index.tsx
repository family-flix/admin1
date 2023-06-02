/**
 * @file 视频文件名解析页面
 */
import { For, Show, createSignal } from "solid-js";

import { ParsedVideoInfo, VideoKeys, VIDEO_ALL_KEYS, VIDEO_KEY_NAME_MAP } from "@/utils";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ButtonCore } from "@/domains/ui/button";
import { InputCore } from "@/domains/ui/input";
import { ViewComponent } from "@/types";
import { RequestCore } from "@/domains/client";
import { parse_video_file_name } from "@/services";
import { Input } from "@/components/ui/input";

export const VideoParsingPage: ViewComponent = (props) => {
  const { app, view } = props;

  const request = new RequestCore(parse_video_file_name, {
    onLoading(loading) {
      btn.setLoading(loading);
    },
  });
  const input = new InputCore({
    placeholder: "请输入要解析的文件名",
  });
  const btn = new ButtonCore({
    onClick() {
      if (!input.value) {
        app.tip({ text: ["请输入要解析的文件名"] });
        return;
      }
      request.run({
        name: input.value,
        keys: VIDEO_ALL_KEYS,
      });
    },
  });
  request.onSuccess((data) => {
    console.log("request success", data);
    setInfo(data);
  });
  request.onTip((msg) => {
    app.tip(msg);
  });
  view.onShow(() => {
    console.log("parse show");
  });
  view.onHide(() => {
    console.log("parse hide");
  });

  const [info, setInfo] = createSignal<ParsedVideoInfo | null>(null);

  const keys = () => {
    if (info() === null) {
      return [];
    }
    const keys = Object.keys(info()) as VideoKeys[];
    return keys;
  };

  return (
    <div>
      <h1 class="text-2xl">文件名解析</h1>
      <div class="mt-8">
        <div class="grid grid-cols-12 gap-4">
          <div class="col-span-10">
            <Input store={input} />
          </div>
          <div class="grid col-span-2">
            <Button store={btn} class="btn btn--primary btn--block">
              解析
            </Button>
          </div>
        </div>
        <Show when={!!info()}>
          <div class="mt-4">
            <For each={keys()}>
              {(k) => {
                const v = () => info()[k];
                return (
                  <div class="flex align-middle">
                    <div class="align-left min-w-[114px]">{VIDEO_KEY_NAME_MAP[k]}</div>
                    <span>：</span>
                    <div class="align-left w-full break-all whitespace-pre-wrap">{v()}</div>
                  </div>
                );
              }}
            </For>
          </div>
        </Show>
      </div>
    </div>
  );
};
