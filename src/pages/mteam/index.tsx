import { client2 } from "@/store/request";
import { ViewComponent } from "@/store/types";
import { Button, Input } from "@/components/ui";
import { ListCoreV2 } from "@/domains/list/v2";
import { FetchParams } from "@/domains/list/typing";
import { RequestCoreV2 } from "@/domains/request_v2";
import { request } from "@/domains/request_v2/utils";
import { ButtonCore, ButtonInListCore, InputCore } from "@/domains/ui";
import { For, Show, createSignal } from "solid-js";
import { ListResponse } from "@/types";
import { MTeamMediaItem, downloadMTeamMedia, search_media_in_mteam, search_media_in_mteam_process } from "./services";

export const MTeamPage: ViewComponent = (props) => {
  const { app } = props;

  const $input = new InputCore({
    defaultValue: "",
  });
  const $search = new ButtonCore({
    onClick() {
      const keyword = $input.value;
      if (!keyword) {
        app.tip({
          text: ["请输入查询关键字"],
        });
        return;
      }
      $list.search({
        keyword,
      });
    },
  });
  const $reset = new ButtonCore({
    onClick() {
      $list.reset();
    },
  });
  const $list = new ListCoreV2(
    new RequestCoreV2({
      fetch: search_media_in_mteam,
      process: search_media_in_mteam_process,
      client: client2,
    })
  );
  const $download = new RequestCoreV2({
    fetch: downloadMTeamMedia,
    client: client2,
  });
  const $downloadBtn = new ButtonInListCore<MTeamMediaItem>({
    onClick(record) {
      $download.run({ id: record.id });
    },
  });

  const [response, setResponse] = createSignal($list.response);

  $list.onStateChange((v) => {
    setResponse(v);
  });

  return (
    <div class="w-[1280px] mx-auto pt-8">
      <div class="text-3xl">MTeam PT站</div>
      <div class="flex items-center mt-4 space-x-4">
        <Input store={$input} />
        <div class="flex items-center space-x-1">
          <Button store={$search}>搜索</Button>
          <Button store={$reset}>重置</Button>
        </div>
      </div>
      <div class="space-y-4">
        <For each={response().dataSource}>
          {(item) => {
            const { id, title, text, processing } = item;
            return (
              <div class="p-2">
                <div class="text-xl">{title}</div>
                <div>{text}</div>
                <div>{processing}</div>
                <Show when={processing === 1}>
                  <div>已下载</div>
                </Show>
                <Button store={$downloadBtn.bind(item)}>下载</Button>
              </div>
            );
          }}
        </For>
      </div>
    </div>
  );
};
