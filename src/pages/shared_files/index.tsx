/**
 * @file 分享文件转存
 */
import { For, JSX, Show, createSignal, onMount } from "solid-js";
import { Check, ChevronDown, ChevronRight, ChevronUp } from "lucide-solid";

import { NavigatorCore } from "@/domains/navigator";
import { ViewCore } from "@/domains/router";
import { SharedResource } from "@/domains/shared_resource";
import { Application } from "@/domains/app";
import { Input } from "@/components/ui/input";
import FolderCard from "@/components/FolderCard";
import { Button } from "@/components/ui/button";
import { ContextMenu } from "@/components/ui/context-menu";
import * as Tabs from "@/components/ui/tabs";
import * as Select from "@/components/ui/select";
import { ContextMenuCore } from "@/domains/ui/context-menu";
import { TabsCore } from "@/domains/ui/tabs";
import { cn } from "@/utils";
import { SelectCore } from "@/domains/ui/select";
import { MenuItemCore } from "@/domains/ui/menu/item";
import { MenuCore } from "@/domains/ui/menu";

// const SelectItem = (props: {
//   value?: string;
//   class?: string;
//   children: JSX.Element;
// }) => {
//   return (
//     <Select.Item class={cn("SelectItem", props.class)} value={props.value}>
//       <Select.ItemText>{props.children}</Select.ItemText>
//       <Select.ItemIndicator class="SelectItemIndicator">
//         <Check />
//       </Select.ItemIndicator>
//     </Select.Item>
//   );
// };

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

  const tabs = new TabsCore();
  const select = new SelectCore();
  // select.onChange((v) => {
  //   console.log("select onchange", v);
  // });
  const sharedResource = new SharedResource();
  const driveSubMenu = new MenuCore({
    name: "drives-menu",
    side: "right",
    align: "start",
    items: app.drives.map((drive) => {
      const { name } = drive;
      return new MenuItemCore({
        label: name,
        onClick() {
          console.log("click drive", name);
        },
      });
    }),
  });
  const item = new MenuItemCore({
    label: "转存到",
    menu: driveSubMenu,
  });
  const contextMenu = new ContextMenuCore({
    name: "shared_resource",
    items: [
      new MenuItemCore({
        label: "查找同名文件夹并建立关联",
        onClick() {
          // sharedResource.bindFolderInDrive()
        },
      }),
      new MenuItemCore({
        label: "同名影视剧检查",
        onClick() {
          // check_has_same_name_tv({
          //   file_name: name,
          // });
        },
      }),
      new MenuItemCore({
        label: "转存到默认网盘",
        onClick() {
          // patch_added_files({
          //   url,
          //   file_id: cur_folder_ref.current.file_id,
          //   file_name: name,
          // });
        },
      }),
      item,
    ],
  });
  app.onDrivesChange((nextDrives) => {
    setDrives(nextDrives);
    driveSubMenu.setItems(
      nextDrives.map((drive) => {
        const { name } = drive;
        return new MenuItemCore({
          label: name,
          onClick() {
            console.log("click drive", name);
          },
        });
      })
    );
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
  onMount(() => {
    app.fetchDrives();
  });

  const url = () => state().url;
  const paths = () => state().paths;
  const files = () => state().files;

  return (
    <div>
      <h2
        class="my-2 text-2xl"
        onClick={() => {
          contextMenu.show({ x: 120, y: 120 });
        }}
      >
        转存文件
      </h2>
      <div class="grid grid-cols-12 gap-4">
        <div class="col-span-10">
          <Input
            class=""
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
      {/* <Tabs.Root store={tabs} class="TabsRoot">
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
      </Tabs.Root> */}
      <ContextMenu store={contextMenu}>
        <button>Hello</button>
      </ContextMenu>
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
