/**
 * @file 云盘详情页面
 */
import { For, Show, createSignal, onMount } from "solid-js";
import { ArrowLeft, ChevronRight } from "lucide-solid";

import { Dialog, DropdownMenu, Input, ScrollView, Skeleton, ListView } from "@/components/ui";
import { List } from "@/components/List";
import { DriveFileCard } from "@/components/DriveFileCard";
import { DialogCore, DropdownMenuCore, ButtonCore, InputCore, MenuItemCore, ScrollViewCore } from "@/domains/ui";
import { DriveCore, AliyunDriveFilesCore, DriveItem, AliyunDriveFile } from "@/domains/drive";
import { RefCore } from "@/domains/cur";
import { ViewComponent } from "@/types";
import { FileType } from "@/constants";
import { createJob } from "@/store";
import { RequestCore } from "@/domains/request";
import { sync_folder } from "@/services";

export const DriveProfilePage: ViewComponent = (props) => {
  const { app, view } = props;

  const syncFolderRequest = new RequestCore(sync_folder, {
    // onLoading(loading) {
    //   folderSyncItem.disable();
    // },
  });
  const driveFileManage = new AliyunDriveFilesCore({
    id: view.query.id,
  });
  const drive = new DriveCore({ ...(view.query as unknown as DriveItem) });
  drive.list.pageSize = 50;
  // const input = new InputCore({
  //   defaultValue: "",
  // });
  const curFileWithPosition = new RefCore<[AliyunDriveFile, [number, number]]>();
  const curFile = new RefCore<AliyunDriveFile>();
  // const btn = new ButtonCore({
  //   onClick() {
  //     if (!input.value) {
  //       app.tip({
  //         text: ["请输入要查询的文件名"],
  //       });
  //       return;
  //     }
  //   },
  // });
  const scrollView = new ScrollViewCore();
  const formatBtn = new ButtonCore({
    onClick() {
      formatDialog.show();
    },
  });
  const formatDialog = new DialogCore();
  const fileProfileDialog = new DialogCore({
    footer: false,
  });
  const folderDeletingConfirmDialog = new DialogCore({
    async onOk() {
      if (!curFileWithPosition.value) {
        app.tip({
          text: ["请先选择要删除的文件"],
        });
        return;
      }
      const [file, position] = curFileWithPosition.value;
      driveFileManage.deleteFile({
        file,
        position,
        onLoading(loading) {
          folderDeletingConfirmDialog.okBtn.setLoading(loading);
        },
        onFailed(error) {
          app.tip({
            text: ["删除文件失败", error.message],
          });
        },
        onSuccess(opt) {
          app.tip({
            text: ["删除成功"],
          });
          opt.deleteFile();
          folderDeletingConfirmDialog.hide();
          curFileWithPosition.clear();
          if (!opt.job_id) {
            return;
          }
          createJob({
            job_id: opt.job_id,
          });
        },
      });
    },
  });
  const nameModifyInput = new InputCore({
    defaultValue: "",
    onEnter() {
      nameModifyDialog.okBtn.click();
    },
  });
  const nameModifyDialog = new DialogCore({
    title: "修改名称",
    onOk() {
      if (!curFileWithPosition.value) {
        app.tip({
          text: ["请先选择要修改的文件"],
        });
        return;
      }
      const [file, position] = curFileWithPosition.value;
      if (file.name === nameModifyInput.value) {
        app.tip({
          text: ["名称没有变化"],
        });
        return;
      }
      driveFileManage.rename({
        file: {
          file_id: file.file_id,
          name: nameModifyInput.value,
        },
        position,
        onLoading(loading) {
          nameModifyDialog.okBtn.setLoading(loading);
        },
        onFailed(error) {
          app.tip({
            text: ["重命名失败", error.message],
          });
        },
        onSuccess() {
          app.tip({
            text: ["重命名成功"],
          });
          nameModifyDialog.hide();
          nameModifyInput.clear();
          curFileWithPosition.clear();
        },
      });
    },
  });
  const profileItem = new MenuItemCore({
    label: "详情",
    onClick() {
      if (!driveFileManage.virtualSelectedFolder) {
        app.tip({
          text: ["请先选择文件"],
        });
        return;
      }
      const [file] = driveFileManage.virtualSelectedFolder;
      curFile.select(file);
      fileMenu.hide();
      fileProfileDialog.setTitle(file.name);
      fileProfileDialog.show();
    },
  });
  const analysisItem = new MenuItemCore({
    label: "索引",
    async onClick() {
      if (!driveFileManage.virtualSelectedFolder) {
        app.tip({
          text: ["请先选择要索引的文件"],
        });
        return;
      }
      const [file] = driveFileManage.virtualSelectedFolder;
      analysisItem.disable();
      const r = await drive.startAnalysis({
        target_folders: [file],
      });
      driveFileManage.clearVirtualSelected();
      app.tip({
        text: ["开始索引"],
      });
      analysisItem.enable();
      if (r.error) {
        app.tip({
          text: ["索引失败", r.error.message],
        });
        return;
      }
      fileMenu.hide();
      createJob({
        job_id: r.data.job_id,
        onFinish() {
          drive.finishAnalysis();
        },
      });
    },
  });
  const nameModifyItem = new MenuItemCore({
    label: "修改名称",
    async onClick() {
      if (!driveFileManage.virtualSelectedFolder) {
        app.tip({
          text: ["请先选择要修改的文件"],
        });
        return;
      }
      const [file] = driveFileManage.virtualSelectedFolder;
      curFileWithPosition.select(driveFileManage.virtualSelectedFolder);
      nameModifyDialog.setTitle(`修改 '${file.name}' 名称`);
      nameModifyInput.setValue(file.name);
      nameModifyDialog.show();
      fileMenu.hide();
    },
  });

  const folderDeletingItem = new MenuItemCore({
    label: "删除",
    async onClick() {
      if (!driveFileManage.virtualSelectedFolder) {
        app.tip({
          text: ["请先选择要删除的文件"],
        });
        return;
      }
      const [file] = driveFileManage.virtualSelectedFolder;
      curFileWithPosition.select(driveFileManage.virtualSelectedFolder);
      folderDeletingConfirmDialog.setTitle(`删除文件`);
      folderDeletingConfirmDialog.show();
      fileMenu.hide();
    },
  });
  const linkSharedFileItem = new MenuItemCore({
    label: "关联分享资源",
  });
  const folderSyncItem = new MenuItemCore({
    label: "同步资源",
    async onClick() {
      if (!driveFileManage.virtualSelectedFolder) {
        app.tip({
          text: ["请选择要同步的文件夹"],
        });
        return;
      }
      const [file] = driveFileManage.virtualSelectedFolder;
      if (file.type === FileType.File) {
        app.tip({
          text: ["请选择文件夹进行同步"],
        });
        return;
      }
      folderSyncItem.disable();
      const r = await syncFolderRequest.run({
        file_id: file.file_id,
        drive_id: view.query.id,
      });
      folderSyncItem.enable();
      if (r.error) {
        app.tip({
          text: ["同步失败", r.error.message],
        });
        return;
      }
      fileMenu.hide();
      app.tip({
        text: ["开始同步"],
      });
      createJob({
        job_id: r.data.job_id,
      });
    },
  });
  const fileMenu = new DropdownMenuCore({
    side: "right",
    align: "start",
    items: [
      profileItem,
      analysisItem,
      nameModifyItem,
      new MenuItemCore({
        label: "播放",
        onClick() {
          if (!driveFileManage.virtualSelectedFolder) {
            app.tip({
              text: ["请选择要播放的文件"],
            });
            return;
          }
          const [file] = driveFileManage.virtualSelectedFolder;
          console.log(file);
          // if (file.type === FolderType)
          // router.push(`/play/${file.file_id}`);
        },
      }),
      folderSyncItem,
      folderDeletingItem,
    ],
    onHidden() {
      driveFileManage.clearVirtualSelected();
    },
  });

  const [state, setState] = createSignal(drive.state);
  const [paths, setPaths] = createSignal(driveFileManage.paths);
  const [columns, setColumns] = createSignal(driveFileManage.folderColumns);

  drive.onStateChange((nextState) => {
    // console.log("[PAGE]drive/profile - drive.onStateChange", nextState);
    setState(nextState);
  });
  // driveFileManage.onSelectFolder((_, position) => {});
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
          <div class="flex items-center space-x-4">
            <div
              class="cursor-pointer"
              onClick={() => {
                app.back();
                // homeLayout.showPrevView({ destroy: true });
              }}
            >
              <ArrowLeft class="w-6 h-6" />
            </div>
            <div class="text-2xl">{state().name}</div>
          </div>
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
            {(column, columnIndex) => {
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
                        renderItem={(folder, fileIndex) => {
                          // @ts-ignore
                          const { name, type, selected, hover } = folder;
                          return (
                            <div
                              onContextMenu={(event) => {
                                event.preventDefault();
                                const { x, y } = event;
                                driveFileManage.virtualSelect(folder, [columnIndex(), fileIndex]);
                                fileMenu.toggle({
                                  x,
                                  y,
                                });
                              }}
                            >
                              <div
                                class="flex items-center justify-between p-2 cursor-pointer rounded-sm hover:bg-slate-300"
                                classList={{
                                  "bg-slate-200": selected,
                                  "outline outline-2 outline-slate-800": hover,
                                }}
                                onClick={() => {
                                  if (folder.type === FileType.File) {
                                    curFile.select(folder);
                                    fileProfileDialog.setTitle(folder.name);
                                    fileProfileDialog.show();
                                    return;
                                  }
                                  driveFileManage.select(folder, [columnIndex(), fileIndex]);
                                  // curFileWithPosition.select([folder, [columnIndex(), fileIndex]]);
                                }}
                              >
                                <div class="flex-1 overflow-hidden whitespace-nowrap text-ellipsis" title={name}>
                                  {name}
                                </div>
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
      <Dialog store={folderDeletingConfirmDialog}>
        <div>
          <p>该操作将删除云盘文件</p>
          <p>该文件对应影视剧将无法观看，请谨慎操作</p>
        </div>
      </Dialog>
      <Dialog store={nameModifyDialog}>
        <Input store={nameModifyInput} />
      </Dialog>
      <Dialog store={fileProfileDialog}>
        <DriveFileCard store={curFile} />
      </Dialog>
    </>
  );
};
