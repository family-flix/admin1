/**
 * @file 云盘卡片
 */
import { For, Show, createSignal } from "solid-js";
import { MoreHorizontal, Loader, Apple, ArrowBigDown, RefreshCcw, Edit3, Download } from "lucide-solid";

import { Application } from "@/domains/app";
import { Drive } from "@/domains/drive";
import { ProgressCore } from "@/domains/ui/progress";
import { DialogCore } from "@/domains/ui/dialog";
import { DropdownMenuCore } from "@/domains/ui/dropdown-menu";
import { MenuItemCore } from "@/domains/ui/menu/item";
import { LazyImage } from "@/components/LazyImage";
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

  const foldersModal = new DialogCore();
  const createFolderModal = new DialogCore();
  const refreshTokenModal = new DialogCore();
  const dropdown = new DropdownMenuCore({
    items: [
      new MenuItemCore({
        label: "签到",
        icon: <Apple class="mr-2 w-4 h-4" />,
        onClick() {
          drive.checkIn();
          dropdown.hide();
        },
      }),
      new MenuItemCore({
        label: "导出",
        icon: <Download class="mr-2 w-4 h-4" />,
        onClick() {
          drive.export();
        },
      }),
      new MenuItemCore({
        label: "刷新",
        icon: <RefreshCcw class="mr-2 w-4 h-4" />,
        onClick() {
          drive.refresh();
        },
      }),
      new MenuItemCore({
        label: "修改 refresh_token",
        icon: <Edit3 class="mr-2 w-4 h-4" />,
        onClick() {
          dropdown.hide();
        },
      }),
    ],
  });
  const progress = new ProgressCore({ value: drive.state.used_percent });
  const input1 = new InputCore();
  const input2 = new InputCore();
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
  const button3 = new ButtonCore({
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
  foldersModal.onOk(() => {
    drive.setRootFolder();
    foldersModal.hide();
  });
  foldersModal.onCancel(() => {
    foldersModal.hide();
  });
  createFolderModal.onOk(async () => {
    const r = await drive.addFolder();
    if (r.error) {
      return;
    }
    createFolderModal.hide();
  });
  createFolderModal.onCancel(() => {
    createFolderModal.hide();
  });
  refreshTokenModal.onOk(() => {
    drive.submitRefreshToken();
  });
  input1.onChange((v) => {
    drive.inputNewFolderName(v);
  });
  input2.onChange((v) => {
    drive.setRefreshToken(v);
  });
  drive.onStateChange((nextState) => {
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
  const loading = () => state().loading;

  // const drive_ref = useRef(new Drive({ id }));

  return (
    <div class="relative p-4 bg-white rounded-xl">
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
              <div class="flex items-center space-x-2">
                <Progress class="" store={progress} />
                {used_size()}/{total_size()}
              </div>
              <div class="flex items-center mt-4 space-x-2">
                <Button variant="subtle" size="sm" store={analysisBtn}>
                  <Show when={loading()}>
                    <Loader class="w-4 h-4 animate-spin" />
                  </Show>
                  索引
                </Button>
                <Button variant="subtle" size="sm" store={checkInBtn}>
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
                <Button store={button3}>添加文件夹</Button>
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
          <Input store={input1} />
        </div>
      </Dialog>
      <Dialog title="修改 refresh_token" store={refreshTokenModal}>
        <Input store={input2} />
      </Dialog>
    </div>
  );
};
