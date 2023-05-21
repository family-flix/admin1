/**
 * @file 电视剧列表
 */
import { createSignal, For } from "solid-js";

import { bind_searched_tv_for_tv, fetch_tv_list, TVItem } from "@/services";
import { hidden_tv } from "@/domains/tv/services";
import { ListCore } from "@/domains/list";
import { InputCore } from "@/domains/ui/input";
import { ButtonCore } from "@/domains/ui/button";
import { ContextMenuCore } from "@/domains/ui/context-menu";
import { MenuItemCore } from "@/domains/ui/menu/item";
import { ContextMenu } from "@/components/ui/context-menu";
import { RequestCore } from "@/domains/client";
import { CurCore } from "@/domains/cur";
import { LazyImage } from "@/components/LazyImage";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { TMDBSearcherDialog } from "@/components/TMDBSearcher/dialog";
import { TMDBSearcherDialogCore } from "@/components/TMDBSearcher/store";
import { ViewComponent } from "@/types";

export const TVManagePage: ViewComponent = (props) => {
  const { app, router } = props;

  const list = new ListCore<TVItem>(fetch_tv_list);
  const cur = new CurCore<TVItem>();
  const bindSearchedTVForTV = new RequestCore(bind_searched_tv_for_tv, {
    onSuccess() {
      app.tip({ text: ["修改成功"] });
      dialog.hide();
      list.refresh();
    },
    onFailed(error) {
      app.tip({
        text: ["修改失败", error.message],
      });
    },
  });
  const hiddenTV = new RequestCore(hidden_tv, {
    onSuccess() {
      list.refresh();
    },
    onFailed(error) {
      app.tip({ text: ["隐藏失败", error.message] });
    },
  });
  const dialog = new TMDBSearcherDialogCore({
    onOk(searchedTV) {
      if (bindSearchedTVForTV.args === null) {
        app.tip({ text: ["请先选择文件夹"] });
        dialog.hide();
        return;
      }
      bindSearchedTVForTV.run(cur.consume().id, searchedTV);
    },
  });
  const contextMenu = new ContextMenuCore({
    items: [
      new MenuItemCore({
        label: "修改",
        onClick() {
          dialog.show();
        },
      }),
      new MenuItemCore({
        label: "隐藏",
        onClick() {
          hiddenTV.run({ id: cur.consume().id });
        },
      }),
    ],
  });
  const input1 = new InputCore({ placeholder: "请输入名称搜索" });
  const button1 = new ButtonCore({
    onClick() {
      if (!input1.value) {
        return;
      }
      list.search({ name: input1.value });
    },
  });
  const button2 = new ButtonCore({
    onClick() {
      list.reset();
      input1.empty();
    },
  });

  const [state, setState] = createSignal(list.response);

  list.onStateChange((nextState) => {
    setState(nextState);
  });
  list.init();

  const response = () => state().dataSource;

  return (
    <>
      <div class="min-h-screen">
        <div class="">
          <div class="">
            <div class="flex space-x-2">
              <Input store={input1} />
              <Button class="w-[80px]" store={button1}>
                搜索
              </Button>
              <Button class="w-[80px]" store={button2}>
                重置
              </Button>
            </div>
          </div>
          <div>
            <ContextMenu store={contextMenu}>
              <div class="space-y-4">
                <For each={response()}>
                  {(tv) => {
                    const {
                      id,
                      name,
                      original_name,
                      overview,
                      poster_path,
                      first_air_date,
                    } = tv;
                    return (
                      <div
                        class="card cursor-pointer"
                        onClick={() => {
                          router.push(`/admin/tv/${id}`);
                        }}
                        onContextMenu={(event: MouseEvent) => {
                          const { pageX, pageY } = event;
                          cur.save(tv);
                        }}
                      >
                        <div class="flex">
                          <LazyImage
                            class="mr-4 w-[120px] object-fit"
                            src={poster_path}
                            alt={name}
                          />
                          <div class="flex-1">
                            <h2 class="text-2xl">{name}</h2>
                            <div class="mt-2">
                              <p class="">{overview}</p>
                              <p class="">{first_air_date}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  }}
                </For>
              </div>
            </ContextMenu>
          </div>
        </div>
        <TMDBSearcherDialog store={dialog} />
      </div>
    </>
  );
};
