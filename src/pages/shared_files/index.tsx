/**
 * @file 分享文件转存
 */
import { For, Show, createSignal } from "solid-js";
import { ChevronRight } from "lucide-solid";

import { NavigatorCore } from "@/domains/navigator";
import { ViewCore } from "@/domains/router";
import { SharedResource } from "@/domains/shared_resource";
import { Application } from "@/domains/app";
import { PopoverCore } from "@/domains/ui/popover";
import { Input } from "@/components/ui/input";
import FolderCard from "@/components/FolderCard";
import { Button } from "@/components/ui/button";
import * as ContextMenu from "@/components/ui/context-menu";
import * as Tabs from "@/components/ui/tabs";
import { ContextMenuCore } from "@/domains/ui/context-menu";
import { TabsCore } from "@/domains/ui/tabs";

export const SharedFilesTransferPage = (props: {
  app: Application;
  router: NavigatorCore;
  view: ViewCore;
}) => {
  const { app, view } = props;
  const [state, setState] = createSignal({
    url: "",
    paths: [],
    files: [],
  });
  const [drives, setDrives] = createSignal(app.drives);
  // const { toast } = useToast();
  app.onDrivesChange((nextDrives) => {
    setDrives(nextDrives);
  });
  const popover = new PopoverCore();
  const tabs = new TabsCore();
  const sharedResource = new SharedResource();
  const contextMenu = new ContextMenuCore({
    menus: [
      {
        label: "查找同名文件夹并建立关联",
        onClick() {
          // sharedResource.bindFolderInDrive()
        },
      },
      {
        label: "同名影视剧检查",
        onClick() {
          // check_has_same_name_tv({
          //   file_name: name,
          // });
        },
      },
      {
        label: "转存到默认网盘",
        onClick() {
          // patch_added_files({
          //   url,
          //   file_id: cur_folder_ref.current.file_id,
          //   file_name: name,
          // });
        },
      },
      // {
      //   label: "转存到",
      // },
    ],
  });
  sharedResource.onTip((msg) => {
    app.tip({
      text: [msg],
    });
  });
  sharedResource.onSuccess((values) => {
    const { url, files, paths } = values;
    setState({
      url,
      files,
      paths,
    });
  });

  app.fetchDrives();

  const url = () => state().url;
  const paths = () => state().paths;
  const files = () => state().files;

  return (
    <div>
      <h2 class="my-2 text-2xl">转存文件</h2>
      <div class="grid grid-cols-12 gap-4">
        <div class="col-span-10">
          <Input
            className=""
            placeholder="请输入分享链接"
            value={url()}
            onChange={(event: Event & { target: HTMLInputElement }) => {
              sharedResource.input(event.target.value);
            }}
          />
        </div>
        <div class="grid col-span-2">
          <Button
            size="default"
            variant="default"
            onClick={() => {
              sharedResource.fetch();
            }}
          >
            获取
          </Button>
        </div>
      </div>
      <div class="flex items-center">
        <For each={paths()}>
          {(path, index) => {
            const { file_id, name } = path;
            return (
              <div class="flex items-center">
                <div
                  class="cursor-pointer hover:text-blue-500"
                  onClick={() => {
                    sharedResource.fetch({ file_id, name });
                  }}
                >
                  {name}
                </div>
                {index() === paths().length - 1 ? null : (
                  <div class="mx-2 text-gray-300">/</div>
                )}
              </div>
            );
          }}
        </For>
      </div>
      <Tabs.Root store={tabs} class="TabsRoot">
        <Tabs.List class="TabsList">
          <Tabs.Trigger class="TabsTrigger" value="01">
            测试01
          </Tabs.Trigger>
          <Tabs.Trigger class="TabsTrigger" value="02">
            测试02
          </Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content class="TabsContent" value="01">
          <div>测试01 - content</div>
        </Tabs.Content>
        <Tabs.Content class="TabsContent" value="02">
          <div>测试02 - content</div>
        </Tabs.Content>
      </Tabs.Root>
      <ContextMenu.Root store={contextMenu}>
        <ContextMenu.Trigger>
          <div class="grid grid-cols-6 gap-2">
            <For each={files()}>
              {(file) => {
                const { name, type } = file;
                return (
                  <div
                    class="w-[152px] p-4 rounded cursor-pointer hover:bg-gray-300 dark:hover:bg-gray-700"
                    onClick={() => {
                      sharedResource.fetch(file);
                    }}
                  >
                    <FolderCard type={type} name={name} />
                  </div>
                );
              }}
            </For>
          </div>
        </ContextMenu.Trigger>
        <ContextMenu.Portal>
          <ContextMenu.Content class="DropdownMenuContent">
            <ContextMenu.Item class="DropdownMenuItem">
              New Private Window <div class="RightSlot">⇧+⌘+N</div>
            </ContextMenu.Item>
            <ContextMenu.Sub>
              <ContextMenu.SubTrigger class="DropdownMenuSubTrigger">
                More Tools
                <div class="RightSlot">
                  <ChevronRight width={15} height={15} />
                </div>
              </ContextMenu.SubTrigger>
              <ContextMenu.Portal>
                <ContextMenu.SubContent class="DropdownMenuSubContent">
                  <ContextMenu.Item class="DropdownMenuItem">
                    Save Page As… <div class="RightSlot">⌘+S</div>
                  </ContextMenu.Item>
                  <ContextMenu.Item class="DropdownMenuItem">
                    Create Shortcut…
                  </ContextMenu.Item>
                  <ContextMenu.Item class="DropdownMenuItem">
                    Name Window…
                  </ContextMenu.Item>
                  <ContextMenu.Separator class="DropdownMenu.Separator" />
                  <ContextMenu.Item class="DropdownMenuItem">
                    Developer Tools
                  </ContextMenu.Item>
                </ContextMenu.SubContent>
              </ContextMenu.Portal>
            </ContextMenu.Sub>
            <ContextMenu.Separator class="DropdownMenuSeparator" />
            <ContextMenu.Label class="DropdownMenuLabel">
              People
            </ContextMenu.Label>
          </ContextMenu.Content>
        </ContextMenu.Portal>
      </ContextMenu.Root>
      <div></div>

      {/* <Modal
          title="同名影视剧"
          visible={visible}
          footer={null}
          onCancel={async () => {
            set_visible(false);
            return Result.Ok(null);
          }}
        >
          {(() => {
            if (same_name_tv_ref.current === null) {
              return null;
            }
            const {
              id,
              name,
              original_name,
              overview,
              poster_path,
              first_air_date,
            } = same_name_tv_ref.current;
            return (
              <div
                class="flex"
                onClick={() => {
                  router.push(`/play/${id}`);
                }}
              >
                <LazyImage
                  class="w-[180px] mr-4 object-fit"
                  src={poster_path}
                  alt={name || original_name}
                />
                <div class="flex-1">
                  <div class="text-2xl">{name || original_name}</div>
                  <div class="mt-4">{overview}</div>
                  <div class="mt-4">{first_air_date}</div>
                </div>
              </div>
            );
          })()}
        </Modal>
        <Modal
          title="文件夹"
          visible={drive_folder_visible}
          footer={null}
          onCancel={async () => {
            console.log("1 set_drive_folder_visible false");
            set_drive_folder_visible(false);
            return Result.Ok(null);
          }}
        >
          <Tabs
            defaultValue={
              drives_response.dataSource.length
                ? drives_response.dataSource[0]?.user_name
                : undefined
            }
          >
            <TabsList>
              {drives_response.dataSource.map((drive) => {
                const { id, user_name } = drive;
                return (
                  <TabsTrigger key={id} value={user_name}>
                    {user_name}
                  </TabsTrigger>
                );
              })}
            </TabsList>
            {drives_response.dataSource.map((drive) => {
              const { id, user_name } = drive;
              return (
                <TabsContent
                  class="p-4 min-h-[536px]"
                  key={id}
                  value={user_name}
                >
                  <DriveFolders
                    key={id}
                    class="grid-cols-3"
                    options={[
                      {
                        label: "选择",
                        async on_click(value) {
                          if (!value) {
                            return;
                          }
                          if (cur_folder_ref.current === null) {
                            return;
                          }
                          const shared_folder = cur_folder_ref.current;
                          const folder = value as FolderItem;
                          const r =
                            await build_link_between_shared_files_with_folder({
                              url,
                              file_id: shared_folder.file_id,
                              file_name: shared_folder.name,
                              target_file_id: folder.file_id,
                            });
                          if (r.error) {
                            toast({
                              title: "ERROR",
                              description: r.error.message,
                            });
                            return;
                          }
                          toast({
                            title: "成功",
                            description: "建立关联成功",
                          });
                        },
                      },
                    ]}
                    id={id}
                    size={6}
                  />
                </TabsContent>
              );
            })}
          </Tabs>
        </Modal> */}
    </div>
  );
};
