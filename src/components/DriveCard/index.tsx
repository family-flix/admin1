/**
 * @file 云盘卡片
 */
import { For, Show, createSignal } from "solid-js";
import {
  MoreHorizontal,
  Edit3,
  Download,
  Trash,
  Gift,
  FolderSearch,
  RefreshCw,
  Stamp,
  ChevronRight,
  Loader,
  Puzzle,
  Eye,
  Pen,
} from "lucide-solid";

import {
  Button,
  Input,
  Dialog,
  ScrollView,
  Progress,
  ListView,
  LazyImage,
  Skeleton,
  DropdownMenu,
} from "@/components/ui";
import { List } from "@/components/List";
import {
  InputCore,
  ButtonCore,
  DropdownMenuCore,
  DialogCore,
  ProgressCore,
  MenuItemCore,
  ImageCore,
} from "@/domains/ui";
import { RequestCore } from "@/domains/request";
import { Application } from "@/domains/app";
import { DriveCore, addDrive, updateAliyunDrive } from "@/domains/drive";
import { AliyunDriveFilesCore } from "@/domains/drive/files";
import { BizError } from "@/domains/error";
import { DriveTypes, FileType } from "@/constants";
import { createJob } from "@/store/job";

export const DriveCard = (props: {
  app: Application;
  store: DriveCore;
  onClick?: () => void;
  onRefresh?: () => void;
}) => {
  const { app, store: drive, onClick, onRefresh } = props;

  const createResourceDriveRequest = new RequestCore(addDrive, {
    onSuccess() {
      app.tip({
        text: ["资源盘创建成功"],
      });
      if (onRefresh) {
        onRefresh();
      }
    },
    onFailed(error) {
      app.tip({
        text: ["资源盘创建失败", error.message],
      });
    },
  });
  const toggleDriveVisibleRequest = new RequestCore(updateAliyunDrive, {
    onSuccess() {
      app.tip({
        text: ["操作成功"],
      });
      if (onRefresh) {
        onRefresh();
      }
    },
    onFailed(error) {
      app.tip({
        text: ["操作失败", error.message],
      });
    },
  });
  const remarkUpdateRequest = new RequestCore(updateAliyunDrive, {
    onLoading(loading) {
      remarkUpdateDialog.okBtn.setLoading(loading);
    },
    onSuccess() {
      app.tip({
        text: ["编辑成功"],
      });
      remarkUpdateDialog.hide();
      if (onRefresh) {
        onRefresh();
      }
    },
    onFailed(error) {
      app.tip({
        text: ["编辑失败", error.message],
      });
    },
  });
  const driveFileManage = new AliyunDriveFilesCore({ id: drive.id });
  const foldersModal = new DialogCore({
    title: "设置索引根目录",
    async onOk() {
      if (driveFileManage.selectedFolder === null) {
        app.tip({ text: ["请先选择文件夹"] });
        return;
      }
      foldersModal.okBtn.setLoading(true);
      const r = await drive.setRootFolder(driveFileManage.selectedFolder);
      foldersModal.okBtn.setLoading(false);
      driveFileManage.clear();
      if (r.error) {
        app.tip({ text: ["设置索引目录失败", r.error.message] });
        return;
      }
      app.tip({ text: ["设置索引目录成功"] });
      foldersModal.hide();
    },
    onUnmounted() {
      drive.clearFolderColumns();
    },
  });
  const remarkUpdateDialog = new DialogCore({
    title: "编辑备注",
    onOk() {
      if (!remarkInput.value) {
        app.tip({
          text: [remarkInput.placeholder],
        });
        return;
      }
      remarkUpdateRequest.run(drive.id, {
        remark: remarkInput.value,
      });
    },
  });
  const createFolderModal = new DialogCore({
    title: "新增索引目录",
    async onOk() {
      createFolderModal.okBtn.setLoading(true);
      const r = await drive.addFolder();
      if (r.error) {
        createFolderModal.okBtn.setLoading(false);
        app.tip({ text: ["新增文件夹失败", r.error.message] });
        return;
      }
      const r2 = await drive.setRootFolder(r.data);
      createFolderModal.okBtn.setLoading(false);
      if (r2.error) {
        app.tip({ text: ["设置索引目录失败", r2.error.message] });
        return;
      }
      app.tip({ text: ["设置索引目录成功"] });
      createFolderModal.hide();
    },
  });
  const confirmDeleteDriveDialog = new DialogCore({
    async onOk() {
      confirmDeleteDriveDialog.okBtn.setLoading(true);
      await drive.delete();
      confirmDeleteDriveDialog.okBtn.setLoading(false);
      confirmDeleteDriveDialog.hide();
      if (onRefresh) {
        onRefresh();
      }
    },
  });
  const refreshTokenModal = new DialogCore({
    title: "修改 refresh token",
    async onOk() {
      refreshTokenModal.okBtn.setLoading(true);
      const r = await drive.submitRefreshToken();
      refreshTokenModal.okBtn.setLoading(false);
      if (!r.error) {
        refreshTokenModal.hide();
      }
    },
  });
  const checkInItem = new MenuItemCore({
    label: "签到",
    icon: <Stamp class="mr-2 w-4 h-4" />,
    async onClick() {
      // this.disable(<Loader class="w-4 h-4" />);
      checkInItem.disable();
      await drive.checkIn();
      checkInItem.enable();
      dropdown.hide();
    },
  });
  const receiveRewardsItem = new MenuItemCore({
    label: "领取所有签到奖品",
    icon: <Gift class="mr-2 w-4 h-4" />,
    async onClick() {
      receiveRewardsItem.disable();
      const r = await drive.receiveRewards();
      receiveRewardsItem.enable();
      if (r.error) {
        app.tip({
          text: ["领取失败"],
        });
        return;
      }
      dropdown.hide();
      app.tip({
        text: ["开始领取"],
      });
      createJob({
        job_id: r.data.job_id,
        onFinish() {
          app.tip({
            text: ["领取完成"],
          });
          refreshBtn.click();
        },
      });
    },
  });
  const exportItem = new MenuItemCore({
    label: "导出云盘信息",
    icon: <Download class="mr-2 w-4 h-4" />,
    async onClick() {
      exportItem.disable();
      const r = await drive.export();
      exportItem.enable();
      if (r.error) {
        return;
      }
      app.copy(JSON.stringify(r.data));
      app.tip({ text: ["云盘信息已复制到剪贴板"] });
      dropdown.hide();
    },
  });
  const setRootFolderItem = new MenuItemCore({
    label: "设置索引根目录",
    icon: <Edit3 class="mr-2 w-4 h-4" />,
    onClick() {
      dropdown.hide();
      foldersModal.show();
      driveFileManage.appendColumn({ file_id: "root", name: "文件" });
    },
  });
  const analysisQuicklyItem = new MenuItemCore({
    label: "仅索引新增",
    icon: <FolderSearch class="mr-2 w-4 h-4" />,
    async onClick() {
      dropdown.hide();
      const r = await drive.startAnalysis({
        quickly: true,
      });
      if (r.error) {
        return;
      }
      createJob({
        job_id: r.data.job_id,
        onFinish() {
          drive.finishAnalysis();
          analysisBtn.setLoading(false);
        },
      });
    },
  });
  const matchMediaItem = new MenuItemCore({
    label: "匹配解析结果",
    icon: <FolderSearch class="mr-2 w-4 h-4" />,
    async onClick() {
      dropdown.hide();
      const r = await drive.matchMediaFilesProfile();
      if (r.error) {
        return;
      }
      createJob({
        job_id: r.data.job_id,
        onFinish() {
          drive.finishMediaMatch();
        },
      });
    },
  });
  const createResourceDrive = new MenuItemCore({
    label: "初始化资源盘",
    icon: <Puzzle class="mr-2 w-4 h-4" />,
    onClick() {
      createResourceDriveRequest.run({
        type: DriveTypes.AliyunResourceDrive,
        payload: JSON.stringify({
          drive_id: drive.id,
        }),
      });
      dropdown.hide();
    },
  });
  const dropdown = new DropdownMenuCore({
    items: [
      new MenuItemCore({
        label: "详情",
        icon: <Puzzle class="mr-2 w-4 h-4" />,
        onClick: () => {
          if (onClick) {
            onClick();
          }
          dropdown.hide();
        },
      }),
      checkInItem,
      receiveRewardsItem,
      analysisQuicklyItem,
      matchMediaItem,
      createResourceDrive,
      exportItem,
      setRootFolderItem,
      new MenuItemCore({
        label: "创建索引根目录",
        icon: <Edit3 class="mr-2 w-4 h-4" />,
        onClick() {
          dropdown.hide();
          createFolderModal.show();
        },
      }),
      new MenuItemCore({
        label: "编辑备注",
        icon: <Pen class="mr-2 w-4 h-4" />,
        onClick() {
          dropdown.hide();
          remarkUpdateDialog.show();
        },
      }),
      new MenuItemCore({
        label: "隐藏",
        icon: <Eye class="mr-2 w-4 h-4" />,
        onClick() {
          toggleDriveVisibleRequest.run(drive.id, { hidden: 1 });
        },
      }),
      new MenuItemCore({
        label: "设置 refresh_token",
        icon: <Edit3 class="mr-2 w-4 h-4" />,
        onClick() {
          refreshTokenModal.show();
          dropdown.hide();
        },
      }),
      new MenuItemCore({
        label: "删除",
        icon: <Trash class="mr-2 w-4 h-4" />,
        async onClick() {
          confirmDeleteDriveDialog.setTitle(`删除云盘 ${drive.name}`);
          confirmDeleteDriveDialog.show();
          dropdown.hide();
        },
      }),
    ],
  });
  const progress = new ProgressCore({ value: drive.state.used_percent });
  const newFolderNameInput = new InputCore({
    defaultValue: "",
    onChange(v) {
      drive.inputNewFolderName(v);
    },
  });
  const refreshTokenInput = new InputCore({
    defaultValue: "",
    placeholder: "请输入refresh_token",
    onChange(v) {
      drive.setRefreshToken(v);
    },
  });
  const remarkInput = new InputCore({
    defaultValue: "",
    placeholder: "请输入备注",
  });
  const analysisBtn = new ButtonCore({
    async onClick() {
      if (!drive.state.initialized) {
        foldersModal.show();
        driveFileManage.appendColumn({
          file_id: "root",
          name: "文件",
        });
        return;
      }
      const r = await drive.startAnalysis();
      if (r.error) {
        return;
      }
      createJob({
        job_id: r.data.job_id,
        onFinish() {
          drive.finishAnalysis();
          analysisBtn.setLoading(false);
        },
      });
    },
  });
  const showAddingFolderDialogBtn = new ButtonCore({
    onClick() {
      createFolderModal.show();
    },
  });
  const refreshBtn = new ButtonCore({
    async onClick() {
      refreshBtn.setLoading(true);
      await drive.refresh();
      progress.update(drive.state.used_percent);
      refreshBtn.setLoading(false);
    },
  });
  const avatarImage = new ImageCore({ src: drive.state.avatar });

  const [state, setState] = createSignal(drive.state);
  const [folderColumns, setFolderColumns] = createSignal(driveFileManage.folderColumns);
  const [hasError, setHasError] = createSignal<BizError | null>(null);
  const [filesState, setFilesState] = createSignal(driveFileManage.state);

  drive.onStateChange((nextState) => {
    analysisBtn.setLoading(nextState.loading);
    avatarImage.setURL(nextState.avatar);
    setState(nextState);
  });
  driveFileManage.onFolderColumnChange((nextColumns) => {
    console.log("[COMPONENT]onFolderColumnChange", nextColumns);
    setFolderColumns(nextColumns);
  });
  driveFileManage.onError((e) => {
    setHasError(e);
  });
  driveFileManage.onStateChange((nextState) => {
    setFilesState(nextState);
  });
  drive.onTip((texts) => {
    app.tip(texts);
  });
  // const { avatar, user_name, used_size, total_size, used_percent } = state();
  const usedSize = () => state().used_size;
  const totalSize = () => state().total_size;
  const hasFolders = () => {
    const first = folderColumns()[0];
    if (!first) {
      return false;
    }
    if (first.list.response.dataSource.length === 0) {
      return false;
    }
    return true;
  };

  return (
    <div class="relative p-4 bg-white rounded-xl border border-1">
      <div>
        <div class="">
          <div class="absolute top-2 right-2">
            <DropdownMenu store={dropdown}>
              <div class="p-2 cursor-pointer">
                <MoreHorizontal class="w-6 h-6 text-gray-600" />
              </div>
            </DropdownMenu>
          </div>
          <div class="flex">
            <div class="mr-4 ">
              <LazyImage class="overflow-hidden w-16 h-16 rounded" store={avatarImage} alt={state().name} />
            </div>
            <div class="flex-1 w-0 pr-12">
              <div class="text-xl truncate">{state().name}</div>
              <div class="text-sm text-slate-500">{state().drive_id}</div>
              <Progress class="mt-2" store={progress} />
              <div class="mt-2">
                {state().used_size}/{state().total_size}
              </div>
              <Show when={state().vip}>
                <div class="mt-4 space-y-2">
                  <For each={state().vip}>
                    {(vip) => {
                      return (
                        <div class="flex text-sm text-slate-800">
                          <div>{vip.name}</div>
                          <div class="ml-2">{vip.expired_at_text}</div>
                        </div>
                      );
                    }}
                  </For>
                </div>
              </Show>
              <div class="flex items-center mt-4 space-x-2">
                <Button store={analysisBtn} variant="subtle" icon={<FolderSearch class="w-4 h-4" />}>
                  索引
                </Button>
                <Button variant="subtle" store={refreshBtn} icon={<RefreshCw class="w-4 h-4" />}>
                  刷新
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Dialog title={state().name} store={foldersModal}>
        <div class="w-[520px] overflow-x-auto h-[320px]">
          <Show
            when={filesState().initialized}
            fallback={
              <div class="position h-full">
                <div class="flex items-center justify-center space-x-2 text-slate-800">
                  <Loader class="w-6 h-6 animate-spin" />
                  <div>加载中</div>
                </div>
              </div>
            }
          >
            <Show
              when={hasFolders()}
              fallback={
                <Show
                  when={!hasError()}
                  fallback={
                    <div>
                      <div class="text-center">发生了错误</div>
                    </div>
                  }
                >
                  <div class="position">
                    <div class="flex items-center justify-center">
                      <Button store={showAddingFolderDialogBtn}>添加文件夹</Button>
                    </div>
                  </div>
                </Show>
              }
            >
              <div class="flex-1 flex space-x-2 max-w-full max-h-full overflow-x-auto bg-white">
                <For each={folderColumns()}>
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
                              renderItem={(folder, index) => {
                                // @ts-ignore
                                const { file_id, name, type, selected } = folder;
                                return (
                                  <div>
                                    <div
                                      class="flex items-center justify-between p-2 cursor-pointer rounded-sm hover:bg-slate-300"
                                      classList={{
                                        "bg-slate-200": selected,
                                      }}
                                      onClick={() => {
                                        driveFileManage.select(folder, [columnIndex(), index]);
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
            </Show>
          </Show>
        </div>
      </Dialog>
      <Dialog title="添加文件夹" store={createFolderModal}>
        <div class="w-[520px]">
          <Input store={newFolderNameInput} />
        </div>
      </Dialog>
      <Dialog title="修改 refresh_token" store={refreshTokenModal}>
        <div class="w-[520px]">
          <Input store={refreshTokenInput} />
        </div>
      </Dialog>
      <Dialog title="修改备注" store={remarkUpdateDialog}>
        <div class="w-[520px]">
          <Input store={remarkInput} />
        </div>
      </Dialog>
      <Dialog title="删除云盘" store={confirmDeleteDriveDialog}>
        <div class="w-[520px]">
          <div>删除后索引到的影视剧也会删除</div>
          <div class="mt-2">确认删除该云盘吗？</div>
        </div>
      </Dialog>
    </div>
  );
};
