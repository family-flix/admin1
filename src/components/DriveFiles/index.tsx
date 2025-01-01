/**
 * @file 云盘文件列表
 */
import { createSignal, For, JSX, Show } from "solid-js";
import { ChevronRight, Loader } from "lucide-solid";

import { Button, ListView, ScrollView, Skeleton } from "@/components/ui";
import { List } from "@/components/List";
import { DriveFilesCore } from "@/biz/drive";
import { BizError } from "@/domains/error";
import { FileType } from "@/constants/index";

export function DriveFiles(props: { store: DriveFilesCore } & { empty?: JSX.Element }) {
  const { store, empty } = props;

  const [folderColumns, setFolderColumns] = createSignal(store.folderColumns);
  const [hasError, setHasError] = createSignal<BizError | null>(null);
  const [filesState, setFilesState] = createSignal(store.state);

  store.onFolderColumnChange((nextColumns) => {
//     console.log("[COMPONENT]onFolderColumnChange", nextColumns);
    setFolderColumns(nextColumns);
  });
  store.onError((e) => {
    setHasError(e);
  });
  store.onStateChange((v) => {
    setFilesState(v);
  });

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
    <div class=" overflow-x-auto w-[520px] h-[320px]">
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
            <Show
              when={!hasError()}
              fallback={
                <div>
                  <div class="text-center">发生了错误</div>
                </div>
              }
            >
              {empty}
            </Show>
          }
        >
          <div class="flex-1 flex space-x-2 max-w-full max-h-full overflow-x-auto bg-white">
            <For each={folderColumns()}>
              {(column, columnIndex) => {
                return (
                  <ScrollView
                    store={column.view}
                    class="flex-shrink-0 px-2 pt-2 pb-12 border-r-2 overflow-x-hidden w-[240px] h-[320px] overflow-y-auto"
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
                                    store.select(folder, [columnIndex(), index]);
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
  );
}
