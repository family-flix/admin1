/**
 * @file 分享文件转存
 */
import { For, createSignal, onCleanup, onMount } from "solid-js";

import { NavigatorCore } from "@/domains/navigator";
import { ViewCore } from "@/domains/router";
import { SharedResourceCore } from "@/domains/shared_resource";
import { Application } from "@/domains/app";
import { ContextMenuCore } from "@/domains/ui/context-menu";
import { TabsCore } from "@/domains/ui/tabs";
import { MenuItemCore } from "@/domains/ui/menu/item";
import { MenuCore } from "@/domains/ui/menu";
import { DialogCore } from "@/domains/ui/dialog";
import { TVProfileCore } from "@/domains/tv/profile";
import { Input } from "@/components/ui/input";
import { FolderCard } from "@/components/FolderCard";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/SingleModal";
import { ContextMenu } from "@/components/ui/context-menu";
import { TVCard } from "@/components/TVCard";
import * as Tabs from "@/components/ui/tabs";
import { cn } from "@/utils";
import { InputCore } from "@/domains/ui/input";

export const SharedFilesTransferPage = (props: {
  app: Application;
  router: NavigatorCore;
  view: ViewCore;
}) => {
  const { app, router, view } = props;
  const [state, setState] = createSignal({
    url: "",
    paths: [],
    files: [],
  });
  const tabs = new TabsCore();
  const modal1 = new DialogCore();
  const tvProfile = new TVProfileCore();
  const sharedResource = new SharedResourceCore();
  const driveSubMenu = new MenuCore({
    name: "drives-menu",
    side: "right",
    align: "start",
  });
  const contextMenu = new ContextMenuCore({
    name: "shared_resource",
    items: [
      new MenuItemCore({
        label: "查找同名文件夹并建立关联",
        onClick() {
          sharedResource.bindSelectedFolderInDrive();
        },
      }),
      new MenuItemCore({
        label: "同名影视剧检查",
        onClick() {
          sharedResource.findTheTVHasSameNameWithSelectedFolder();
        },
      }),
      new MenuItemCore({
        label: "转存到默认网盘",
        onClick() {
          sharedResource.transferSelectedFolderToDrive(app.drives[0]);
        },
      }),
      new MenuItemCore({
        label: "转存到",
        menu: driveSubMenu,
      }),
    ],
  });
  const input1 = new InputCore({
    placeholder: "请输入分享链接",
  });
  app.onDrivesChange((nextDrives) => {
    driveSubMenu.setItems(
      nextDrives.map((drive) => {
        const { name } = drive;
        return new MenuItemCore({
          label: name,
          async onClick() {
            sharedResource.transferSelectedFolderToDrive(drive);
            contextMenu.hide();
          },
        });
      })
    );
  });
  sharedResource.onShowTVProfile((profile) => {
    tvProfile.set(profile);
    modal1.show();
  });
  sharedResource.onTip((msg) => {
    app.tip(msg);
  });
  sharedResource.onSuccess((values) => {
    const { url, files, paths } = values;
    setState({
      url,
      files,
      paths,
    });
  });
  input1.onChange((v) => {
    sharedResource.input(v);
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
          // app.tip({ text: ["hello"] });
          // contextMenu.show({ x: 120, y: 120 });
        }}
      >
        转存文件
      </h2>
      <div class="grid grid-cols-12 gap-4">
        <div class="col-span-10">
          <Input class="" store={input1} />
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
      <ContextMenu store={contextMenu}>
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
                  onContextMenu={() => {
                    sharedResource.selectFolder(file);
                  }}
                >
                  <FolderCard type={type} name={name} />
                </div>
              );
            }}
          </For>
        </div>
      </ContextMenu>
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
      <Modal title="同名影视剧" store={modal1} footer={null}>
        <TVCard store={tvProfile} />
      </Modal>
      {/* <Modal
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
