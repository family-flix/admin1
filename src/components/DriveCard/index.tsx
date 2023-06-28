/**
 * @file 云盘卡片
 */
import { For, Show, createSignal } from "solid-js";
import {
  MoreHorizontal,
  Apple,
  Edit3,
  Download,
  Coffee,
  Trash,
  Gift,
  FolderSearch,
  RefreshCcw,
  RefreshCw,
} from "lucide-solid";

import { Application } from "@/domains/app";
import { Drive } from "@/domains/drive";
import { ProgressCore } from "@/domains/ui/progress";
import { DialogCore } from "@/domains/ui/dialog";
import { DropdownMenuCore } from "@/domains/ui/dropdown-menu";
import { MenuItemCore } from "@/domains/ui/menu/item";
import { LazyImage } from "@/components/ui/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Dialog } from "@/components/ui/dialog";
import { DropdownMenu } from "@/components/ui/dropdown-menu";
import { InputCore } from "@/domains/ui/input";
import { ButtonCore } from "@/domains/ui/button";
import { SelectionCore } from "@/domains/cur";

export const DriveCard = (props: { app: Application; store: Drive }) => {
  const { app, store: drive } = props;

  const [state, setState] = createSignal(drive.state);
  const [folderColumns, setFolderColumns] = createSignal(drive.folderColumns);
  const folderSelect = new SelectionCore<{ file_id: string; name: string }>({
    onChange(v) {
      setSelectedFolder(v);
    },
  });
  const [selectedFolder, setSelectedFolder] = createSignal(folderSelect.value);

  const foldersModal = new DialogCore({
    title: "设置索引根目录",
    async onOk() {
      if (folderSelect.value === null) {
        app.tip({ text: ["请先选择文件夹"] });
        return;
      }
      foldersModal.okBtn.setLoading(true);
      const r = await drive.setRootFolder(folderSelect.value.file_id);
      foldersModal.okBtn.setLoading(false);
      folderSelect.clear();
      if (r.error) {
        app.tip({ text: ["设置索引目录失败", r.error.message] });
        return;
      }
      app.tip({ text: ["设置索引目录成功"] });
      foldersModal.hide();
    },
    onUnmounted() {
      folderSelect.clear();
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
      app.refreshDrives();
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
    icon: <Apple class="mr-2 w-4 h-4" />,
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
    label: "导出",
    icon: <Download class="mr-2 w-4 h-4" />,
    async onClick() {
      exportItem.disable();
      const r = await drive.export();
      exportItem.enable();
      if (r.error) {
        return;
      }
      app.copy(JSON.stringify(r.data));
      app.tip({ text: ["网盘信息已复制到剪贴板"] });
      dropdown.hide();
    },
  });
  const setRootFolderItem = new MenuItemCore({
    label: "设置索引根目录",
    icon: <Edit3 class="mr-2 w-4 h-4" />,
    onClick() {
      dropdown.hide();
      foldersModal.show();
      drive.fetch({ file_id: "root", name: "文件" });
    },
  });
  const analysisQuicklyItem = new MenuItemCore({
    label: "仅索引新增",
    icon: <Coffee class="mr-2 w-4 h-4" />,
    async onClick() {
      dropdown.hide();
      await drive.startScrape(true);
    },
  });
  const dropdown = new DropdownMenuCore({
    items: [
      checkInItem,
      receiveRewardsItem,
      analysisQuicklyItem,
      exportItem,
      setRootFolderItem,
      new MenuItemCore({
        label: "删除",
        icon: <Trash class="mr-2 w-4 h-4" />,
        async onClick() {
          confirmDeleteDriveDialog.setTitle(`删除云盘 ${drive.name}`);
          confirmDeleteDriveDialog.show();
          dropdown.hide();
        },
      }),
      new MenuItemCore({
        label: "修改 refresh_token",
        icon: <Edit3 class="mr-2 w-4 h-4" />,
        onClick() {
          refreshTokenModal.show();
          dropdown.hide();
        },
      }),
    ],
  });
  const progress = new ProgressCore({ value: drive.state.used_percent });
  const newFolderNameInput = new InputCore({
    onChange(v) {
      drive.inputNewFolderName(v);
    },
  });
  const refreshTokenInput = new InputCore({
    onChange(v) {
      drive.setRefreshToken(v);
    },
  });
  const analysisBtn = new ButtonCore({
    onClick() {
      if (!drive.state.initialized) {
        foldersModal.show();
        drive.fetch({ file_id: "root", name: "文件" });
        return;
      }
      drive.startScrape();
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

  drive.onStateChange((nextState) => {
    analysisBtn.setLoading(nextState.loading);
    setState(nextState);
  });
  drive.onFolderColumnChange((nextFolderColumns) => {
    console.log("[COMPONENT]onFolderColumnChange", nextFolderColumns);
    setFolderColumns([...nextFolderColumns]);
  });
  drive.onTip((texts) => {
    app.tip(texts);
  });
  // const { avatar, user_name, used_size, total_size, used_percent } = state();
  const avatar = () => state().avatar;
  const name = () => state().name;
  const used_size = () => state().used_size;
  const total_size = () => state().total_size;

  // const drive_ref = useRef(new Drive({ id }));

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
                {used_size()}/{total_size()}
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
        <Show when={selectedFolder()} fallback={<div class="text-center">请选择一个文件夹作为索引根目录</div>}>
          <div>当前选择了 {selectedFolder()?.name}</div>
        </Show>
        <Show
          when={folderColumns().length > 1}
          fallback={
            <div class="position">
              <div class="flex items-center justify-center">
                <Button store={showAddingFolderDialogBtn}>添加文件夹</Button>
              </div>
            </div>
          }
        >
          <div class="flex space-x-2">
            <For each={folderColumns()}>
              {(column, x) => {
                return (
                  <Show when={column.length > 0} fallback={<div class="mt-2 text-slate-500">该文件夹没有文件</div>}>
                    <div class="px-2 border-r-2 overflow-y-auto max-h-[360px]">
                      <For each={column}>
                        {(folder, y) => {
                          const { file_id, name, selected } = folder;
                          return (
                            <div>
                              <div
                                class="p-2 cursor-pointer rounded-sm hover:bg-slate-300"
                                classList={{
                                  "bg-slate-200": selected,
                                }}
                                onClick={() => {
                                  folderSelect.select(folder);
                                  // drive.select(folder, [x(), y()]);
                                  drive.fetch(folder, x());
                                }}
                              >
                                {name}
                              </div>
                            </div>
                          );
                        }}
                      </For>
                    </div>
                  </Show>
                );
              }}
            </For>
          </div>
        </Show>
      </Dialog>
      <Dialog title="添加文件夹" store={createFolderModal}>
        <div>
          <Input store={newFolderNameInput} />
        </div>
      </Dialog>
      <Dialog title="修改 refresh_token" store={refreshTokenModal}>
        <Input store={refreshTokenInput} />
      </Dialog>
      <Dialog title="删除云盘" store={confirmDeleteDriveDialog}>
        <div>删除云盘后可能导致电视剧无法观看等问题</div>
        <div class="mt-2">确认删除该云盘吗？</div>
      </Dialog>
    </div>
  );
};
