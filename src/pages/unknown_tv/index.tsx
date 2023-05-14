/**
 * @file 无法被刮削的电视剧列表
 */
import { createSignal, For } from "solid-js";

import { TMDBSearcherDialog } from "@/components/TMDBSearcher/dialog";
import {
  bind_searched_tv_for_tv,
  fetch_unknown_tv_list,
  UnknownTVItem,
} from "@/services";
import { scrape_tv } from "@/domains/tv/services";
import { TMDBSearcherDialogCore } from "@/components/TMDBSearcher/store";
import { ContextMenuCore } from "@/domains/ui/context-menu";
import { MenuItemCore } from "@/domains/ui/menu/item";
import { ContextMenu } from "@/components/ui/context-menu";
import { FolderCard } from "@/components/FolderCard";
import { RequestCore } from "@/domains/client";
import { CurCore } from "@/domains/cur";
import { ListCore } from "@/domains/list";
import { ViewComponent } from "@/types";

export const UnknownTVManagePage: ViewComponent = (props) => {
  const { app, router } = props;

  const cur = new CurCore<UnknownTVItem>();
  const unknownTVList = new ListCore<UnknownTVItem>(fetch_unknown_tv_list);
  const dialog = new TMDBSearcherDialogCore({
    onOk(searched_tv) {
      if (cur.isEmpty()) {
        app.tip({ text: ["请先选择文件夹"] });
        return;
      }
      const { id } = cur.consume();
      bindSearchedTVForTV.run(id, searched_tv);
    },
  });
  const bindSearchedTVForTV = new RequestCore(bind_searched_tv_for_tv, {
    onFailed(error) {
      app.tip({ text: ["修改失败", error.message] });
    },
    onSuccess() {
      app.tip({ text: ["修改成功"] });
      dialog.hide();
      unknownTVList.refresh();
    },
  });
  const contextMenu = new ContextMenuCore({
    items: [
      new MenuItemCore({
        label: "重新索引",
        onClick() {
          // if (cur_ref.current === null) {
          //   return;
          // }
          // const r = await scrape_tv({ id });
          // if (r.error) {
          //   toast({
          //     title: "ERROR",
          //     description: r.error.message,
          //   });
          //   return;
          // }
          // helper.refresh();
          // toast({
          //   title: "Success",
          //   description: "索引成功",
          // });
        },
      }),
      new MenuItemCore({
        label: "手动索引",
        onClick() {
          dialog.show();
          contextMenu.hide();
        },
      }),
      new MenuItemCore({
        label: "修改名称",
      }),
    ],
  });

  const [response, setResponse] = createSignal(unknownTVList.response);

  unknownTVList.onStateChange((nextState) => {
    setResponse(nextState);
  });

  unknownTVList.init();

  const dataSource = () => response().dataSource;

  return (
    <>
      <div class="min-h-screen">
        <div class="">
          <h2 class="h2">未识别的影视剧</h2>
          <div>
            <div class="grid grid-cols-6 gap-2">
              <ContextMenu store={contextMenu}>
                <For each={dataSource()}>
                  {(file) => {
                    const { id, name } = file;
                    return (
                      <div
                        class="w-[152px] p-4 rounded cursor-pointer hover:bg-gray-300 dark:hover:bg-gray-600"
                        onClick={async () => {
                          router.push(`/admin/unknown_tv/${id}`);
                        }}
                        onContextMenu={(event: MouseEvent) => {
                          // event.stopPropagation();
                          event.preventDefault();
                          // const { pageX, pageY } = event;
                          cur.save(file);
                        }}
                      >
                        <FolderCard type="folder" name={name} />
                      </div>
                    );
                  }}
                </For>
              </ContextMenu>
            </div>
          </div>
        </div>
        <TMDBSearcherDialog store={dialog} />
      </div>
    </>
  );
};
