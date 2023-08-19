/**
 * @file 查询过的分享文件列表
 */
import { For, createSignal } from "solid-js";

import { ScrollView } from "@/components/ui";
import { ScrollViewCore } from "@/domains/ui";
import { RequestCore } from "@/domains/client";
import { ListCore } from "@/domains/list";
import { FetchParams } from "@/domains/list/typing";
import { request } from "@/utils/request";
import { relative_time_from_now } from "@/utils";
import { JSONObject, ListResponse, RequestedResource, Result, ViewComponent } from "@/types";

async function fetch_shared_files_histories(body: FetchParams) {
  const r = await request.get<
    ListResponse<{
      id: string;
      url: string;
      title: string;
      created: string;
    }>
  >("/api/shared_file/list", body as unknown as JSONObject);
  if (r.error) {
    return Result.Err(r.error);
  }
  return Result.Ok({
    ...r.data,
    list: r.data.list.map((f) => {
      const { created, ...rest } = f;
      return {
        ...rest,
        created: relative_time_from_now(created),
      };
    }),
  });
}
type SharedFileHistory = RequestedResource<typeof fetch_shared_files_histories>["list"][0];

export const SharedFilesHistoryPage: ViewComponent = (props) => {
  const list = new ListCore(new RequestCore(fetch_shared_files_histories));
  const scrollView = new ScrollViewCore({
    onReachBottom() {
      list.loadMore();
    },
  });

  const [response, setResponse] = createSignal(ListCore.defaultResponse<SharedFileHistory>());

  list.onStateChange((nextState) => {
    setResponse(nextState);
  });
  list.init();

  const dataSource = () => response().dataSource;

  return (
    <>
      <ScrollView class="py-8" store={scrollView}>
        <view>
          <div class="space-y-4">
            <For each={dataSource()}>
              {(sharedFile) => {
                const { id, url, title, created } = sharedFile;
                return (
                  <div
                    class="p-4"
                    onClick={() => {
                      // router.push(`/admin/shared_files?url=${url}`);
                    }}
                  >
                    <p>{title}</p>
                    <div>{url}</div>
                    <div>{created}</div>
                  </div>
                );
              }}
            </For>
          </div>
        </view>
      </ScrollView>
    </>
  );
};
