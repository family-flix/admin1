/**
 * @file 云盘卡片
 */
import { For, Show, createSignal } from "solid-js";
import { MoreHorizontal, Loader } from "lucide-solid";

import { Application } from "@/domains/app";
import { Drive } from "@/domains/drive";
import { ProgressCore } from "@/domains/ui/progress";
import { DialogCore } from "@/domains/ui/dialog";
import { PopoverCore } from "@/domains/ui/popover";
import { ContextMenuCore } from "@/domains/ui/context-menu";
import { DropdownMenuCore } from "@/domains/ui/dropdown-menu";
import { LazyImage } from "@/components/LazyImage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import FolderMenu from "@/components/FolderMenu";
import { Progress } from "@/components/ui/progress";
import { Popover } from "@/components/ui/popover";
import Modal from "@/components/SingleModal";
import { DropdownMenu } from "@/components/ui/dropdown-menu";
import { MenuCore } from "@/domains/ui/menu";

const DriveCard = (props: { app: Application; core: Drive }) => {
  const { app, core: drive } = props;
  const [state, setState] = createSignal(drive.state);
  const [values, setValues] = createSignal(drive.values);
  const [folderColumns, setFolderColumns] = createSignal(drive.folderColumns);
  const foldersModal = new DialogCore();
  const createFolderModal = new DialogCore();
  const refreshTokenModal = new DialogCore();
  const popover = new PopoverCore();
  const dropdown = new DropdownMenuCore();
  const subMenu = new MenuCore({
    side: "right",
    align: "start",
  });
  dropdown.menu.onEnterItem((item) => {
    console.log("[]onEnterItem", item);
    subMenu.show();
  });

  const contextMenu = new ContextMenuCore([
    {
      label: "详情",
      on_click: () => {
        // router.push(`/admin/drive/${id}`);
      },
    },
    {
      label: "导出",
      on_click() {
        drive.export();
      },
    },
    {
      label: "刷新",
      on_click() {
        drive.refresh();
      },
    },
    {
      label: "修改 refresh_token",
      on_click() {
        // drive.update_refresh_token(),
      },
    },
    {
      label: "查看重复影片",
      on_click() {
        // router.push(`/admin/drive/duplicate/${id}`);
      },
    },
  ]);
  const progress = new ProgressCore({ value: drive.state.used_percent });
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
    app.tip({ text: texts });
  });
  // const { avatar, user_name, used_size, total_size, used_percent } = state();
  const initialized = () => state().initialized;
  const avatar = () => state().avatar;
  const user_name = () => state().user_name;
  const used_size = () => state().used_size;
  const total_size = () => state().total_size;
  const used_percent = () => state().used_percent;
  const loading = () => state().loading;

  // const drive_ref = useRef(new Drive({ id }));

  return (
    <div class="relative p-4 bg-white rounded-xl">
      <div
        onContextMenu={(event) => {
          const { x, y } = event;
          contextMenu.show({ x, y });
        }}
      >
        <div class="">
          <div class="absolute top-2 right-2">
            <DropdownMenu store={dropdown}>
              <div class="p-4 cursor-pointer">
                <MoreHorizontal class="w-6 h-6 text-gray-600" />
              </div>
            </DropdownMenu>
          </div>
          <div class="flex">
            <LazyImage
              className="overflow-hidden w-16 h-16 mr-4 rounded"
              src={avatar()}
              alt={user_name()}
            />
            <div>
              <div class="text-xl">{user_name()}</div>
              <div class="flex items-center space-x-2">
                <Progress className="" store={progress} />
                {used_size()}/{total_size()}
              </div>
              <div class="flex items-center mt-4 space-x-2">
                <Show
                  when={initialized()}
                  fallback={
                    <Button
                      variant="subtle"
                      size="sm"
                      onClick={async () => {
                        foldersModal.show();
                        drive.fetch({ file_id: "root", name: "文件" });
                      }}
                    >
                      索引
                    </Button>
                  }
                >
                  <Button
                    variant="subtle"
                    size="sm"
                    onClick={async (event) => {
                      event.stopPropagation();
                      drive.startScrape();
                    }}
                  >
                    <Show when={loading()}>
                      <Loader class="w-4 h-4 animate-spin" />
                    </Show>
                    刮削
                  </Button>
                </Show>
                <Button
                  variant="subtle"
                  size="sm"
                  onClick={async (event) => {
                    drive.refresh();
                    // app.tip({
                    //   text: [Math.random().toString()],
                    // });
                  }}
                >
                  刷新
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Modal title={user_name()} core={foldersModal}>
        <div class="text-center">请先选择一个文件夹作为索引根目录</div>
        <Show
          when={folderColumns().length > 0}
          fallback={
            <div class="position">
              <div class="flex items-center justify-center">
                <Button
                  onClick={() => {
                    createFolderModal.show();
                  }}
                >
                  添加文件夹
                </Button>
              </div>
            </div>
          }
        >
          <div class="flex space-x-2">
            <For each={folderColumns()}>
              {(column) => {
                return (
                  <Show
                    when={column.length > 0}
                    fallback={<div>该文件夹没有文件</div>}
                  >
                    <div class="px-2 border-r-2">
                      <For each={column}>
                        {(folder) => {
                          const { file_id, name } = folder;
                          return (
                            <div>
                              <div
                                class="p-2 cursor-pointer hover:bg-slate-300"
                                classList={{
                                  "bg-slate-200":
                                    file_id === values().root_folder_id,
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
      </Modal>
      <Modal title="添加文件夹" core={createFolderModal}>
        <div>
          <Input
            onChange={(event: Event & { target: HTMLInputElement }) => {
              drive.inputNewFolderName(event.target.value);
            }}
          />
        </div>
      </Modal>
      <Modal title="修改 refresh_token" core={refreshTokenModal}>
        <Input
          onChange={(event: Event & { target: HTMLInputElement }) => {
            drive.setRefreshToken(event.target.value);
          }}
        />
      </Modal>
    </div>
  );
};

export default DriveCard;
