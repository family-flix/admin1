import { For, Show, createSignal } from "solid-js";

import { ViewComponent } from "@/store/types";
import { Button, Input } from "@/components/ui";
import { ListCore } from "@/domains/list/index";
import { RequestCore } from "@/domains/request/index";
import { ButtonCore, ButtonInListCore, InputCore } from "@/domains/ui";

import { MTeamMediaItem, downloadMTeamMedia, searchTorrentInMTeam, searchTorrentInMTeamProcess } from "./services";

export const MTeamPage: ViewComponent = (props) => {
  const { app, client } = props;

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
  const $list = new ListCore(
    new RequestCore(searchTorrentInMTeam, {
      process: searchTorrentInMTeamProcess,
      client,
    })
  );
  const $download = new RequestCore(downloadMTeamMedia, {
    client,
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
