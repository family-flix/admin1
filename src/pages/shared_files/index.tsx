/**
 * @file 分享文件转存
 */
import { For, Show, createSignal, onMount } from "solid-js";
import { ChevronRight, Folder, FolderInput, MoreHorizontal, Search } from "lucide-solid";

import { driveList } from "@/store/drives";
import { ViewComponent } from "@/types";
import { SharedResourceCore } from "@/domains/shared_resource";
import { MenuItemCore } from "@/domains/ui/menu/item";
import { MenuCore } from "@/domains/ui/menu";
import { Input } from "@/components/ui/input";
import { FolderCard } from "@/components/FolderCard";
import { Button } from "@/components/ui/button";
import { InputCore } from "@/domains/ui/input";
import { ButtonCore } from "@/domains/ui/button";
import { DropdownMenuCore } from "@/domains/ui/dropdown-menu";
import { DropdownMenu } from "@/components/ui/dropdown-menu";
import { createJob } from "@/store";

export const SharedFilesTransferPage: ViewComponent = (props) => {
  const { app, router, view } = props;

  // const modal1 = new DialogCore();
  // const tvProfile = new TVProfileCore();
  const sharedResource = new SharedResourceCore();
  const driveSubMenu = new MenuCore({
    _name: "menus-of-drives",
    side: "right",
    align: "start",
  });
  const dropdownMenu = new DropdownMenuCore({
    _name: "shared-resource-dropdown",
    items: [
      // new MenuItemCore({
      //   label: "查找同名文件夹并建立关联",
      //   onClick() {
      //     sharedResource.bindSelectedFolderInDrive();
      //   },
      // }),
      // new MenuItemCore({
      //   label: "检查同名文件夹",
      //   icon: <Search class="w-4 h-4" />,
      //   onClick() {
      //     // sharedResource.findTheTVHasSameNameWithSelectedFolder();
      //   },
      // }),
      // new MenuItemCore({
      //   label: "转存到默认云盘",
      //   onClick() {
      //     sharedResource.transferSelectedFolderToDrive(app.drives[0]);
      //   },
      // }),
      new MenuItemCore({
        _name: "transfer_to",
        label: "转存到",
        icon: <FolderInput class="w-4 h-4" />,
        menu: driveSubMenu,
      }),
    ],
  });
  const input1 = new InputCore({
    placeholder: "请输入分享链接",
    onChange(v) {
      sharedResource.input(v);
    },
  });
  const input2 = new InputCore({
    placeholder: "请输入提取码",
    onChange(v) {
      sharedResource.inputCode(v);
    },
  });
  const btn = new ButtonCore({
    async onClick() {
      btn.setLoading(true);
      await sharedResource.fetch();
      btn.setLoading(false);
    },
  });
  driveList.onStateChange((nextResponse) => {
    driveSubMenu.setItems(
      nextResponse.dataSource.map((drive) => {
        const { name } = drive;
        const item = new MenuItemCore({
          label: name,
          async onClick() {
            item.disable();
            const r = await sharedResource.transferSelectedFolderToDrive(drive);
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
            dropdownMenu.hide();
          },
        });
        return item;
      })
    );
  });
  // sharedResource.onShowTVProfile((profile) => {
  //   tvProfile.set(profile);
  //   modal1.show();
  // });
  sharedResource.onTip((msg) => {
    app.tip(msg);
  });
  sharedResource.onStateChange((values) => {
    const { url, files, paths } = values;
    setState({
      url,
      files,
      paths,
    });
  });
  driveList.init();
  // view.onHidden(() => {
  //   console.log("shared files hide");
  // });

  const [state, setState] = createSignal(sharedResource.state);

  // const url = () => state().url;
  const paths = () => state().paths;
  const files = () => state().files;

  return (
    <div class="p-4">
      <h1 class="text-2xl">转存资源</h1>
      <div class="mt-4 p-4 bg-white rounded-sm shadow-sm">
        <div class="flex items-center space-x-2">
          <Input store={input1} />
          <Input store={input2} />
          <Button size="default" variant="default" store={btn}>
            获取
          </Button>
        </div>
        <div class="mt-8">
          <Show when={paths().length}>
            <div class="flex items-center space-x-2">
              <Folder class="w-4 h-4" />
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
                        <div class="mx-1">
                          <ChevronRight class="w-4 h-4" />
                        </div>
                      )}
                    </div>
                  );
                }}
              </For>
            </div>
          </Show>
        </div>
        <div class="mt-2 grid grid-cols-3 gap-2 lg:grid-cols-4 xl:grid-cols-6">
          <For each={files()}>
            {(file) => {
              const { name, type } = file;
              return (
                <div class="relative">
                  <div
                    class="w-full p-4 rounded cursor-pointer hover:bg-gray-300 dark:hover:bg-gray-500"
                    onClick={() => {
                      sharedResource.fetch(file);
                    }}
                  >
                    <FolderCard type={type} name={name} />
                  </div>
                  <div
                    class="absolute right-0 top-0 p-2 cursor-pointer"
                    onClick={(event) => {
                      const { pageX, pageY } = event;
                      sharedResource.selectFolder(file);
                      dropdownMenu.toggle({ x: pageX, y: pageY });
                    }}
                  >
                    <MoreHorizontal class="w-6 h-6 text-gray-600" />
                  </div>
                </div>
              );
            }}
          </For>
        </div>
      </div>
      <DropdownMenu store={dropdownMenu}></DropdownMenu>
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
