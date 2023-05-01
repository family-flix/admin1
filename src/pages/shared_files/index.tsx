/**
 * @file 分享文件转存
 */

import FolderCard from "@/components/FolderCard";
import FolderMenu from "@/components/FolderMenu";
import ScrollView from "@/components/ScrollView";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { NavigatorCore } from "@/domains/navigator";
import { For, Show, createSignal } from "solid-js";
import { ViewCore } from "@/domains/router";
import { SharedResource } from "@/domains/shared_resource";
import { Input } from "@/components/ui/input";
import { Application } from "@/domains/app";
import { MoreHorizontal } from "lucide-solid";
import { Popover } from "@/components/ui/popover";
import { PopoverCore } from "@/domains/ui/popover";

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
  const popover = new PopoverCore();
  const sharedResource = new SharedResource();
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

  const url = () => state().url;
  const paths = () => state().paths;
  const files = () => state().files;

  const sharedFileActions = [
    {
      label: "查找同名文件夹并建立关联",
      async on_click() {
        // sharedResource.bindFolderInDrive()
      },
    },
    {
      label: "同名影视剧检查",
      on_click() {
        // check_has_same_name_tv({
        //   file_name: name,
        // });
      },
    },
    {
      label: "转存到默认网盘",
      on_click() {
        // patch_added_files({
        //   url,
        //   file_id: cur_folder_ref.current.file_id,
        //   file_name: name,
        // });
      },
    },
    {
      label: "转存到",
      // children: drives_response.dataSource.map((drive) => {
      //   const { name } = drive;
      //   return {
      //     label: name,
      //     async on_click() {
      //       const r = await save_shared_files({
      //         url,
      //         file_id,
      //         file_name,
      //         drive_id: drive.id,
      //       });
      //     },
      //   };
      // }),
    },
  ];

  return (
    <>
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
      <div>
        <Popover store={popover} content={<div>Hello</div>}>
          <MoreHorizontal />
        </Popover>
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
      <div>
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
                  <div>
                    <FolderCard
                      type={type}
                      name={name}
                      // onContextMenu={() => {
                      //   cur_folder_ref.current = file;
                      // }}
                    />
                  </div>
                </div>
              );
            }}
          </For>
        </div>
      </div>
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
    </>
  );
};
