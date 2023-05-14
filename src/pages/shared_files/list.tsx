/**
 * @file 查询过的分享文件列表
 */
import { For, createSignal } from "solid-js";

import { ListCore } from "@/domains/list";
import { FetchParams } from "@/domains/list/typing";
import { NavigatorCore } from "@/domains/navigator";
import { request } from "@/utils/request";
import { relative_time_from_now } from "@/utils";
import { JSONObject, ListResponse, RequestedResource } from "@/types";

async function fetch_shared_files_histories(body: FetchParams) {
  const r = await request.get<
    ListResponse<{
      id: string;
      url: string;
      title: string;
      created: string;
    }>
  >("/api/shared_files/list", body as unknown as JSONObject);
  if (r.error) {
    return r;
  }
  return {
    ...r.data,
    list: r.data.list.map((f) => {
      const { created, ...rest } = f;
      return {
        ...rest,
        created: relative_time_from_now(created),
      };
    }),
  };
}
type SharedFileHistory = RequestedResource<
  typeof fetch_shared_files_histories
>["list"][0];

export const SharedFilesHistoryPage = (props: { router: NavigatorCore }) => {
  const { router } = props;
  const [response, setResponse] = createSignal(
    ListCore.defaultResponse<SharedFileHistory>()
  );
  const helper = new ListCore<SharedFileHistory>(fetch_shared_files_histories);
  helper.onStateChange((nextState) => {
    setResponse(nextState);
  });
  helper.init();

  const dataSource = () => response().dataSource;

  return (
    <>
      <div class="mx-auto w-[960px] py-8">
        <view>
          <div class="space-y-4">
            <For each={dataSource()}>
              {(sharedFile) => {
                const { id, url, title, created } = sharedFile;
                return (
                  <div
                    class="p-4"
                    onClick={() => {
                      router.push(`/admin/shared_files?url=${url}`);
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
      </div>
    </>
  );
};
