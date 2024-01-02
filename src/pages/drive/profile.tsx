/**
 * @file 云盘详情页面
 */
import { For, Show, createSignal, onMount } from "solid-js";
import { ArrowLeft, ChevronRight, FolderInput, Trash } from "lucide-solid";

import { renameFilesInDrive, fetchDriveFiles } from "@/services/drive";
import { Dialog, DropdownMenu, Input, ScrollView, Skeleton, ListView, Button } from "@/components/ui";
import { List } from "@/components/List";
import { DriveFileCard } from "@/components/DriveFileCard";
import {
  DialogCore,
  DropdownMenuCore,
  ButtonCore,
  InputCore,
  MenuItemCore,
  ScrollViewCore,
  MenuCore,
} from "@/domains/ui";
import {
  DriveCore,
  AliyunDriveFilesCore,
  DriveItem,
  AliyunDriveFile,
  transferFileToAnotherDrive,
  transferFileToResourceDrive,
} from "@/domains/drive";
import { RefCore } from "@/domains/cur";
import { RequestCore } from "@/domains/request";
import { ViewComponent } from "@/types";
import { FileType, MediaTypes } from "@/constants";
import { createJob, driveList } from "@/store";
import { buildRegexp } from "@/utils";
import { EpisodeSelect, EpisodeSelectCore } from "@/components/EpisodeSelect";
import { setFileEpisodeProfile, setFileMovieProfile } from "@/services";
import { TMDBSearcherDialog, TMDBSearcherDialogCore } from "@/components/TMDBSearcher";

export const DriveProfilePage: ViewComponent = (props) => {
  const { app, view } = props;

  const filesRenameRequest = new RequestCore(renameFilesInDrive, {
    onSuccess(r) {
      createJob({
        job_id: r.job_id,
        onFinish() {
          app.tip({
            text: ["修改成功"],
          });
          childNamesModifyDialog.okBtn.setLoading(false);
          childNamesModifyDialog.hide();
        },
      });
    },
    onFailed(error) {
      childNamesModifyDialog.okBtn.setLoading(false);
      app.tip({
        text: ["修改失败", error.message],
      });
    },
  });
  const filesRequest = new RequestCore(fetchDriveFiles);
  const toAnotherDriveRequest = new RequestCore(transferFileToAnotherDrive, {
    onSuccess(v) {
      createJob({
        job_id: v.job_id,
        onFinish() {
          app.tip({
            text: ["完成归档"],
          });
        },
      });
    },
    onFailed(error) {
      app.tip({
        text: ["归档失败", error.message],
      });
    },
  });
  const toResourceDriveRequest = new RequestCore(transferFileToResourceDrive, {
    onSuccess(v) {
      createJob({
        job_id: v.job_id,
        onFinish() {
          app.tip({
            text: ["完成归档"],
          });
        },
      });
    },
    onFailed(error) {
      app.tip({
        text: ["归档失败", error.message],
      });
    },
  });
  const episodeProfileSetRequest = new RequestCore(setFileEpisodeProfile, {
    onSuccess(v) {
      createJob({
        job_id: v.job_id,
        onFinish() {
          episodeSelect.dialog.okBtn.setLoading(false);
          episodeSelect.dialog.hide();
          curFile.clear();
          app.tip({
            text: ["完成设置"],
          });
        },
      });
    },
    onFailed(error) {
      episodeSelect.dialog.okBtn.setLoading(false);
      app.tip({
        text: ["设置失败", error.message],
      });
    },
  });
  const movieProfileSetRequest = new RequestCore(setFileMovieProfile, {
    onSuccess(v) {
      createJob({
        job_id: v.job_id,
        onFinish() {
          movieSelect.dialog.okBtn.setLoading(false);
          movieSelect.dialog.hide();
          curFile.clear();
          app.tip({
            text: ["完成设置"],
          });
        },
      });
    },
    onFailed(error) {
      movieSelect.dialog.okBtn.setLoading(false);
      app.tip({
        text: ["设置失败", error.message],
      });
    },
  });
  // const fileProfileRequest = new RequestCore(fetchFileProfile);
  const driveFileManage = new AliyunDriveFilesCore({
    id: view.query.id,
    onError(err) {
      app.tip({
        text: [err.message],
      });
    },
  });
  const drive = new DriveCore({ ...(view.query as unknown as DriveItem) });
  drive.list.pageSize = 50;
  // const input = new InputCore({
  //   defaultValue: "",
  // });
  const curFileWithPosition = new RefCore<[AliyunDriveFile, [number, number]]>();
  const curFile = new RefCore<AliyunDriveFile>();
  const filesRef = new RefCore<{ name: string }[]>();
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
  const fileProfileDialog = new DialogCore({
    title: "文件详情",
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
        onSuccess(opt) {
          app.tip({
            text: ["删除成功"],
          });
          opt.deleteFile();
          folderDeletingConfirmDialog.hide();
          curFileWithPosition.clear();
        },
        onFailed(error) {
          app.tip({
            text: ["删除文件失败", error.message],
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
            text: ["重命名成功，请重新索引该文件"],
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
      const r = await drive.analysisSpecialFolders({
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
          app.tip({
            text: ["索引完成"],
          });
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
  const childNamesModifyInput1 = new InputCore({
    defaultValue: "",
  });
  const childNamesModifyInput2 = new InputCore({
    defaultValue: "",
  });
  const childNameModifyPreviewBtn = new ButtonCore({
    async onClick() {
      if (!childNamesModifyInput1.value) {
        app.tip({
          text: ["请输入正则"],
        });
        return;
      }
      const regexp_res = buildRegexp(childNamesModifyInput1.value);
      if (regexp_res.error) {
        app.tip({
          text: ["不符合正则格式", regexp_res.error.message],
        });
        return;
      }
      if (!childNamesModifyInput2.value) {
        app.tip({
          text: ["请输入替换后的正则"],
        });
        return;
      }
      const regexp = regexp_res.data;
      const group1 = filesRef.value || [];
      setFileNameModifyState({
        group1,
        group2: group1.map((file) => {
          return {
            name: file.name.replace(regexp, childNamesModifyInput2.value),
          };
        }),
      });
    },
  });
  const childNamesModifyDialog = new DialogCore({
    onOk() {
      const regexp = childNamesModifyInput1.value;
      if (!regexp) {
        app.tip({
          text: ["请输入正则"],
        });
        return;
      }
      const replace = childNamesModifyInput2.value;
      if (!replace) {
        app.tip({
          text: ["请输入替换后的正则"],
        });
        return;
      }
      if (!curFileWithPosition.value) {
        app.tip({
          text: ["请选择文件"],
        });
        return;
      }
      const [file] = curFileWithPosition.value;
      childNamesModifyDialog.okBtn.setLoading(true);
      filesRenameRequest.run({
        drive_id: view.query.id,
        file_id: file.file_id,
        regexp,
        replace,
      });
      app.tip({
        text: ["开始修改"],
      });
    },
  });
  const episodeSelect = new EpisodeSelectCore({
    onOk() {
      const tv = episodeSelect.curTV.value;
      const season = episodeSelect.curSeason.value;
      const episode = episodeSelect.curEpisode.value;
      if (!tv || !season || !episode) {
        app.tip({
          text: ["请选择剧集"],
        });
        return;
      }
      if (!curFile.value) {
        app.tip({
          text: ["请先选择要设置的文件"],
        });
        return;
      }
      const file = curFile.value;
      app.tip({
        text: ["开始设置"],
      });
      episodeSelect.dialog.okBtn.setLoading(true);
      episodeProfileSetRequest.run({
        file_id: file.file_id,
        unique_id: tv.id,
        season_number: season.season_number,
        episode_number: episode.episode_number,
      });
    },
  });
  const movieSelect = new TMDBSearcherDialogCore({
    type: MediaTypes.Movie,
    onOk(movieProfile) {
      if (!curFile.value) {
        app.tip({
          text: ["请先选择要设置的文件"],
        });
        return;
      }
      const file = curFile.value;
      app.tip({
        text: ["开始设置"],
      });
      movieSelect.dialog.okBtn.setLoading(true);
      movieProfileSetRequest.run({
        file_id: file.file_id,
        unique_id: movieProfile.id,
      });
    },
  });
  const childNamesModifyItem = new MenuItemCore({
    label: "修改子文件名称",
    async onClick() {
      if (!driveFileManage.virtualSelectedFolder) {
        app.tip({
          text: ["请先选择要修改的文件"],
        });
        return;
      }
      const [file] = driveFileManage.virtualSelectedFolder;
      curFileWithPosition.select(driveFileManage.virtualSelectedFolder);
      childNamesModifyDialog.setTitle(`修改 '${file.name}' 子文件名称`);
      childNamesModifyDialog.show();
      fileMenu.hide();
      const r = await filesRequest.run({
        file_id: file.file_id,
        drive_id: view.query.id,
        next_marker: "",
        page: 1,
        pageSize: 20,
      });
      if (r.error) {
        app.tip({
          text: ["获取子文件失败", r.error.message],
        });
        return;
      }
      const { list } = r.data;
      filesRef.select(list);
      setFileNameModifyState({
        group1: list.map((file) => {
          return {
            name: file.name,
          };
        }),
        group2: [],
      });
    },
  });
  const folderDeletingBtn = new ButtonCore({
    onClick() {
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
  const folderDeletingItem = new MenuItemCore({
    label: "删除",
    async onClick() {
      if (!driveFileManage.virtualSelectedFolder) {
        app.tip({
          text: ["请先选择要删除的文件"],
        });
        return;
      }
      // const [file] = driveFileManage.virtualSelectedFolder;
      curFileWithPosition.select(driveFileManage.virtualSelectedFolder);
      folderDeletingConfirmDialog.setTitle(`删除文件`);
      folderDeletingConfirmDialog.show();
      fileMenu.hide();
    },
  });
  const toResourceDriveItem = new MenuItemCore({
    label: "归档到资源盘",
    async onClick() {
      if (!driveFileManage.virtualSelectedFolder) {
        app.tip({
          text: ["请先选择要归档的文件"],
        });
        return;
      }
      const [file] = driveFileManage.virtualSelectedFolder;
      app.tip({
        text: ["开始归档"],
      });
      toResourceDriveRequest.run({
        drive_id: view.query.id,
        file_id: file.file_id,
      });
      fileMenu.hide();
    },
  });
  const setEpisodeProfileItem = new MenuItemCore({
    label: "设置剧集信息",
    async onClick() {
      if (!driveFileManage.virtualSelectedFolder) {
        app.tip({
          text: ["请先选择要设置的文件"],
        });
        return;
      }
      const [file] = driveFileManage.virtualSelectedFolder;
      curFile.select(file);
      episodeSelect.show();
      fileMenu.hide();
    },
  });
  const setMovieProfileItem = new MenuItemCore({
    label: "设置电影信息",
    async onClick() {
      if (!driveFileManage.virtualSelectedFolder) {
        app.tip({
          text: ["请先选择要设置的文件"],
        });
        return;
      }
      const [file] = driveFileManage.virtualSelectedFolder;
      curFile.select(file);
      movieSelect.show();
      fileMenu.hide();
    },
  });
  const driveSubMenu = new MenuCore({
    _name: "menus-of-drives",
    side: "right",
    align: "start",
  });
  const fileMenu = new DropdownMenuCore({
    side: "right",
    align: "start",
    items: [
      profileItem,
      analysisItem,
      nameModifyItem,
      childNamesModifyItem,
      new MenuItemCore({
        _name: "transfer_to",
        label: "移动到",
        icon: <FolderInput class="w-4 h-4" />,
        menu: driveSubMenu,
      }),
      toResourceDriveItem,
      setEpisodeProfileItem,
      setMovieProfileItem,
      folderDeletingItem,
    ],
    onHidden() {
      driveFileManage.clearVirtualSelected();
    },
  });

  const [state, setState] = createSignal(drive.state);
  const [paths, setPaths] = createSignal(driveFileManage.paths);
  const [columns, setColumns] = createSignal(driveFileManage.folderColumns);
  const [fileNameModifyState, setFileNameModifyState] = createSignal<{
    group1: { name: string }[];
    group2: { name: string }[];
  }>({
    group1: [],
    group2: [],
  });
  const [selectedFile, setSelectedFile] = createSignal(curFile.value);

  curFile.onStateChange((v) => {
    setSelectedFile(v);
  });
  drive.onStateChange((nextState) => {
    setState(nextState);
  });
  driveList.onStateChange((nextResponse) => {
    driveSubMenu.setItems(
      nextResponse.dataSource.map((drive) => {
        const { name } = drive;
        const item = new MenuItemCore({
          label: name,
          async onClick() {
            item.disable();
            const f = driveFileManage.virtualSelectedFolder;
            if (!f) {
              app.tip({
                text: ["请选择文件"],
              });
              return;
            }
            app.tip({
              text: ["开始归档"],
            });
            const [file] = f;
            const r = await toAnotherDriveRequest.run({
              file_id: file.file_id,
              drive_id: view.query.id,
              target_drive_id: drive.id,
            });
            if (r.data) {
              createJob({
                job_id: r.data.job_id,
                onFinish() {
                  app.tip({
                    text: ["转存完成"],
                  });
                },
              });
            }
            item.enable();
            fileMenu.hide();
          },
        });
        return item;
      })
    );
  });
  driveFileManage.onFolderColumnChange((nextColumns) => {
    setColumns(nextColumns);
  });
  driveFileManage.onPathsChange((nextPaths) => {
    setPaths(nextPaths);
  });

  onMount(() => {
    app.setTitle(view.query.name);
    driveFileManage.appendColumn({ file_id: "root", name: "文件" });
    // drive.refresh();
    driveList.initAny();
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
                                    curFileWithPosition.select([folder, [columnIndex(), fileIndex]]);
                                    fileProfileDialog.show();
                                    return;
                                  }
                                  driveFileManage.select(folder, [columnIndex(), fileIndex]);
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
      <DropdownMenu store={fileMenu}></DropdownMenu>
      <Dialog store={folderDeletingConfirmDialog}>
        <div class="w-[520px]">
          <p>该操作将删除云盘文件</p>
          <p>该文件对应影视剧将无法观看，请谨慎操作</p>
        </div>
      </Dialog>
      <Dialog store={nameModifyDialog}>
        <div class="w-[520px]">
          <Input store={nameModifyInput} />
          <div class="mt-2">该操作会删除该文件夹解析出的电视剧、电影，请谨慎操作。</div>
        </div>
      </Dialog>
      <Dialog store={childNamesModifyDialog}>
        <div class="w-[520px]">
          <div class="space-y-1">
            <Input store={childNamesModifyInput1} />
            <div class="flex items-center space-x-2">
              <Input store={childNamesModifyInput2} />
              <Button store={childNameModifyPreviewBtn}>测试</Button>
            </div>
          </div>
          <div class="mt-4 grid grid-cols-2 gap-2">
            <div class="h-[360px] overflow-y-auto">
              <For each={fileNameModifyState().group1}>
                {(file) => {
                  return (
                    <div class="p-2">
                      <div>{file.name}</div>
                    </div>
                  );
                }}
              </For>
            </div>
            <div class="h-[360px] overflow-y-auto">
              <For each={fileNameModifyState().group2}>
                {(file) => {
                  return (
                    <div class="p-2">
                      <div>{file.name}</div>
                    </div>
                  );
                }}
              </For>
            </div>
          </div>
        </div>
      </Dialog>
      <Dialog store={fileProfileDialog}>
        <div class="w-[520px]">
          <DriveFileCard
            store={curFile}
            drive={drive}
            footer={
              <div class="mt-4 flex items-center space-x-2">
                <Button store={folderDeletingBtn} variant="subtle" icon={<Trash class="w-4 h-4" />}>
                  删除
                </Button>
                {/* <Button store={setProfileBtn} variant="subtle" icon={<Binary class="w-4 h-4" />}>
                  关联电视剧
                </Button> */}
                {/* <Button store={deletingBtn} variant="subtle" icon={<Play class="w-4 h-4" />}>
                  播放
                </Button> */}
              </div>
            }
          />
        </div>
      </Dialog>
      <Dialog store={episodeSelect.dialog}>
        <div class="w-[520px]">
          <div class="p-2">{selectedFile()?.name}</div>
          <EpisodeSelect store={episodeSelect} />
        </div>
      </Dialog>
      <TMDBSearcherDialog store={movieSelect} />
    </>
  );
};
