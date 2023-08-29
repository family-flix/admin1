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
import { InputCore, ButtonCore, DropdownMenuCore, DialogCore, ProgressCore, MenuItemCore } from "@/domains/ui";
import { Application } from "@/domains/app";
import { DriveCore } from "@/domains/drive";
import { AliyunDriveFilesCore } from "@/domains/drive/files";
import { FileType } from "@/constants";
import { createJob } from "@/store";

export const DriveCard = (props: {
  app: Application;
  store: DriveCore;
  onClick?: () => void;
  onRefresh?: () => void;
}) => {
  const { app, store: drive, onClick, onRefresh } = props;

  const driveFileManage = new AliyunDriveFilesCore({ id: drive.id });
  const rootFolderConfirmDialog = new DialogCore({
    async onOk() {
      if (driveFileManage.selectedFolder === null) {
        app.tip({ text: ["请先选择文件夹"] });
        return;
      }
      rootFolderConfirmDialog.okBtn.setLoading(true);
      const r = await drive.setRootFolder(driveFileManage.selectedFolder.file_id);
      rootFolderConfirmDialog.okBtn.setLoading(false);
      driveFileManage.clear();
      if (r.error) {
        app.tip({ text: ["设置索引目录失败", r.error.message] });
        return;
      }
      app.tip({ text: ["设置索引目录成功"] });
      rootFolderConfirmDialog.hide();
      foldersModal.hide();
    },
  });
  const foldersModal = new DialogCore({
    title: "设置索引根目录",
    async onOk() {
      if (driveFileManage.selectedFolder === null) {
        app.tip({ text: ["请先选择文件夹"] });
        return;
      }
      rootFolderConfirmDialog.show();
    },
    onUnmounted() {
      drive.clearFolderColumns();
    },
  });
  const createFolderModal = new DialogCore({
    title: "新增索引目录",
    async onOk() {
      createFolderModal.okBtn.setLoading(true);
      const r = await drive.addFolder();
      createFolderModal.okBtn.setLoading(false);
      if (r.error) {
        app.tip({ text: ["新增文件夹失败", r.error.message] });
        return;
      }
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
      await drive.receiveRewards();
      receiveRewardsItem.enable();
      dropdown.hide();
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
      const r = await drive.startScrape({
        quickly: true,
      });
      if (r.error) {
        return;
      }
      createJob({
        job_id: r.data,
        onFinish() {
          drive.finishAnalysis();
        },
      });
    },
  });
  const matchMediaItem = new MenuItemCore({
    label: "匹配解析结果",
    icon: <FolderSearch class="mr-2 w-4 h-4" />,
    async onClick() {
      matchMediaItem.disable();
      const r = await drive.matchMediaFilesProfile();
      matchMediaItem.enable();
      if (r.error) {
        return;
      }
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
      exportItem,
      setRootFolderItem,
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
    onChange(v) {
      drive.setRefreshToken(v);
    },
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
      const r = await drive.startScrape();
      if (r.error) {
        return;
      }
      createJob({
        job_id: r.data,
        onCompleted() {
          drive.finishAnalysis();
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

  const [state, setState] = createSignal(drive.state);
  const [folderColumns, setFolderColumns] = createSignal(driveFileManage.folderColumns);
  const [filesState, setFilesState] = createSignal(driveFileManage.state);

  drive.onStateChange((nextState) => {
    analysisBtn.setLoading(nextState.loading);
    setState(nextState);
  });
  driveFileManage.onFolderColumnChange((nextColumns) => {
    console.log("[COMPONENT]onFolderColumnChange", nextColumns);
    setFolderColumns(nextColumns);
  });
  driveFileManage.onStateChange((nextState) => {
    setFilesState(nextState);
  });
  drive.onTip((texts) => {
    app.tip(texts);
  });
  // const { avatar, user_name, used_size, total_size, used_percent } = state();
  const avatar = () => state().avatar;
  const name = () => state().name;
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
            <LazyImage class="overflow-hidden w-16 h-16 mr-4 rounded" src={avatar()} alt={name()} />
            <div class="flex-1 pr-12">
              <div class="text-xl">{name()}</div>
              <Progress class="mt-2" store={progress} />
              <div class="mt-2">
                {usedSize()}/{totalSize()}
              </div>
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
      <Dialog title={name()} store={foldersModal}>
        <div class="max-w-full overflow-x-auto h-[320px]">
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
                <div class="position">
                  <div class="flex items-center justify-center">
                    <Button store={showAddingFolderDialogBtn}>添加文件夹</Button>
                  </div>
                </div>
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
        <div>
          <Input store={newFolderNameInput} />
        </div>
      </Dialog>
      <Dialog title="修改 refresh_token" store={refreshTokenModal}>
        <Input store={refreshTokenInput} />
      </Dialog>
      {/* <Dialog title="修改备注" store={refreshTokenModal}>
        <Input store={refreshTokenInput} />
      </Dialog> */}
      <Dialog title="删除云盘" store={confirmDeleteDriveDialog}>
        <div>删除后索引到的影视剧也会删除</div>
        <div class="mt-2">确认删除该云盘吗？</div>
      </Dialog>
      <Dialog title="设置索引根目录" store={rootFolderConfirmDialog}>
        确认将 {filesState().curFolder?.name} 作为索引根目录吗？
      </Dialog>
    </div>
  );
};
