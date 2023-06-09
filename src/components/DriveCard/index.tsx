/**
 * @file 云盘卡片
 */
import { For, Show, createSignal } from "solid-js";
import { MoreHorizontal, Loader, Apple, ArrowBigDown, RefreshCcw, Edit3, Download, Coffee, Trash } from "lucide-solid";

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

export const DriveCard = (props: { app: Application; store: Drive }) => {
  const { app, store: drive } = props;

  const [state, setState] = createSignal(drive.state);
  const [values, setValues] = createSignal(drive.values);
  const [folderColumns, setFolderColumns] = createSignal(drive.folderColumns);

  const foldersModal = new DialogCore({
    onOk() {
      drive.setRootFolder();
      foldersModal.hide();
    },
  });
  const createFolderModal = new DialogCore({
    async onOk() {
      const r = await drive.addFolder();
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
  const dropdown = new DropdownMenuCore({
    items: [
      checkInItem,
      new MenuItemCore({
        label: "导出",
        icon: <Download class="mr-2 w-4 h-4" />,
        async onClick() {
          await drive.export();
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
  const checkInBtn = new ButtonCore({
    async onClick() {
      checkInBtn.setLoading(true);
      await drive.refresh();
      checkInBtn.setLoading(false);
    },
  });

  drive.onStateChange((nextState) => {
    analysisBtn.setLoading(nextState.loading);
    setState(nextState);
  });
  drive.onValuesChange((nextValues) => {
    setValues(nextValues);
  });
  drive.onFolderColumnChange((nextFolderColumns) => {
    console.log("[COMPONENT]onFolderColumnChange", nextFolderColumns);
    setFolderColumns(nextFolderColumns);
  });
  drive.onTip((texts) => {
    app.tip(texts);
  });
  // const { avatar, user_name, used_size, total_size, used_percent } = state();
  const avatar = () => state().avatar;
  const name = () => state().name;
  const used_size = () => state().used_size;
  const total_size = () => state().total_size;
  const used_percent = () => state().used_percent;

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
            <div>
              <div class="text-xl">{name()}</div>
              <Progress class="mt-2" store={progress} />
              <div class="mt-2">
                {used_size()}/{total_size()}
              </div>
              <div class="flex items-center mt-4 space-x-2">
                <Button store={analysisBtn} variant="subtle" icon={<Coffee class="w-4 h-4" />}>
                  索引
                </Button>
                <Button variant="subtle" store={checkInBtn}>
                  刷新
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Dialog title={name()} store={foldersModal}>
        <div class="text-center">请先选择一个文件夹作为索引根目录</div>
        <Show
          when={folderColumns().length > 0}
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
              {(column) => {
                return (
                  <Show when={column.length > 0} fallback={<div>该文件夹没有文件</div>}>
                    <div class="px-2 border-r-2">
                      <For each={column}>
                        {(folder) => {
                          const { file_id, name } = folder;
                          return (
                            <div>
                              <div
                                class="p-2 cursor-pointer hover:bg-slate-300"
                                classList={{
                                  "bg-slate-200": file_id === values().root_folder_id,
                                }}
                                onClick={() => {
                                  drive.inputRootFolder(folder);
                                  drive.fetch(folder);
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
