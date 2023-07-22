/**
 * @file 云盘详情页面
 */
import { For, Show, createSignal, onMount } from "solid-js";

import { Dialog, DropdownMenu, ScrollView, Skeleton } from "@/components/ui";
import { DriveCore } from "@/domains/drive";
import { AliyunDriveFile } from "@/domains/drive/types";
import { DriveItem } from "@/domains/drive/services";
import { DialogCore, DropdownMenuCore, ButtonCore, InputCore } from "@/domains/ui";
import { MenuItemCore } from "@/domains/ui/menu/item";
import { ScrollViewCore } from "@/domains/ui/scroll-view";
import { createJob } from "@/store";
import { ViewComponent } from "@/types";
import { SelectionCore } from "@/domains/cur";
import { FileType } from "@/constants";
import { AliyunDriveFilesCore } from "@/domains/drive/files";
import { ListView } from "@/components/ListView";
import { List } from "@/components/List";
import { ArrowRight, ChevronRight } from "lucide-solid";

export const DriveProfilePage: ViewComponent = (props) => {
  const { app, view } = props;

  const driveFileManage = new AliyunDriveFilesCore({
    id: view.params.id,
  });
  const drive = new DriveCore({ ...(view.query as unknown as DriveItem), id: view.params.id });
  drive.list.pageSize = 50;
  const input = new InputCore({});
  const selectedFolder = new SelectionCore<AliyunDriveFile>();
  const btn = new ButtonCore({
    onClick() {
      if (!input.value) {
        app.tip({
          text: ["请输入要查询的文件名"],
        });
        return;
      }
    },
  });
  const scrollView = new ScrollViewCore();
  const formatBtn = new ButtonCore({
    onClick() {
      formatDialog.show();
    },
  });
  const formatDialog = new DialogCore();
  const fileMenu = new DropdownMenuCore({
    side: "right",
    align: "start",
    items: [
      new MenuItemCore({
        label: "索引",
        async onClick() {
          // console.log(selectedFolder.value);
          // fileMenu.hide();
          // if (!drive.state.initialized) {
          //   app.tip({
          //     text: ["还未设置索引根目录"],
          //   });
          //   return;
          // }
          if (!selectedFolder.value) {
            app.tip({
              text: ["请先选择要索引的文件夹"],
            });
            return;
          }
          const r = await drive.startScrape({
            target_folders: [selectedFolder.value],
          });
          if (r.error) {
            app.tip({
              text: ["索引失败", r.error.message],
            });
            return;
          }
          fileMenu.hide();
          createJob({
            job_id: r.data,
            onFinish() {
              drive.finishAnalysis();
            },
          });
        },
      }),
      new MenuItemCore({
        label: "删除",
      }),
    ],
  });

  const [state, setState] = createSignal(drive.state);
  const [paths, setPaths] = createSignal(driveFileManage.paths);
  const [columns, setColumns] = createSignal(driveFileManage.folderColumns);

  drive.onStateChange((nextState) => {
    console.log("[PAGE]drive/profile - drive.onStateChange", nextState);
    setState(nextState);
  });
  driveFileManage.onFolderColumnChange((nextColumns) => {
    setColumns(nextColumns);
  });
  driveFileManage.onPathsChange((nextPaths) => {
    setPaths(nextPaths);
  });

  onMount(() => {
    driveFileManage.appendColumn({ file_id: "root", name: "文件" });
    drive.refresh();
  });

  return (
    <>
      <ScrollView store={scrollView} class="flex flex-col w-full h-screen">
        <div class="h-[80px] box-content p-4 border-b-2">
          {/* <div class="py-2">
          <Button store={formatBtn}>格式化云盘</Button>
        </div> */}
          <div class="text-2xl">{state().name}</div>
          <div class="flex mt-2 space-x-2 text-slate-800">
            <For each={paths()}>
              {(path, i) => {
                const { name } = path;
                return (
                  <>
                    <div class="flex items-center">
                      <div class="">{name}</div>
                    </div>
                    <Show when={i() !== paths().length - 1}>
                      <span class="text-slate-300">/</span>
                    </Show>
                  </>
                );
              }}
            </For>
          </div>
        </div>
        <div class="flex-1 flex space-x-2 max-w-full max-h-full overflow-x-auto bg-white">
          <For each={columns()}>
            {(column, x) => {
              return (
                <ScrollView
                  store={column.view}
                  class="flex-shrink-0 px-2 pt-2 pb-12 border-r-2 overflow-x-hidden w-[240px] max-h-full overflow-y-auto"
                >
                  <ListView
                    store={column.list}
                    skeleton={
                      <div>
                        <div class="space-y-2">
                          <Skeleton class="w-12 h-[24px]" />
                          <Skeleton class="w-full h-[24px]" />
                          <Skeleton class="w-4 h-[24px]" />
                        </div>
                      </div>
                    }
                  >
                    <div>
                      <List
                        store={column.list}
                        renderItem={(folder, index) => {
                          const { file_id, name, type } = folder;
                          return (
                            <div
                              onContextMenu={(event) => {
                                event.preventDefault();
                                const { x, y } = event;
                                if (type === FileType.Folder) {
                                  selectedFolder.select(folder);
                                }
                                fileMenu.toggle({
                                  x,
                                  y,
                                });
                              }}
                            >
                              <div
                                class="flex items-center justify-between p-2 cursor-pointer rounded-sm hover:bg-slate-300"
                                classList={
                                  {
                                    // "bg-slate-200": selected,
                                  }
                                }
                                onClick={() => {
                                  driveFileManage.select(folder, [x(), index]);
                                }}
                              >
                                <div class="flex-1 overflow-hidden whitespace-nowrap text-ellipsis">{name}</div>
                                <Show when={type === FileType.Folder}>
                                  <ChevronRight class="ml-2 w-4 h-4" />
                                </Show>
                              </div>
                            </div>
                          );
                        }}
                      />
                    </div>
                  </ListView>
                </ScrollView>
              );
            }}
          </For>
          <div class="flex-shrink-0 px-2 pb-12 border-r-2 overflow-x-hidden min-w-[240px] max-h-full overflow-y-auto"></div>
        </div>
      </ScrollView>
      <Dialog store={formatDialog}>
        <div>
          <p>该操作将删除云盘所有文件</p>
          <p>已索引到的影视剧将无法观看，请谨慎操作</p>
        </div>
      </Dialog>
      <DropdownMenu store={fileMenu}></DropdownMenu>
    </>
  );
};