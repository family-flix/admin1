/**
 * @file 提供 加载中、没有数据、加载更多等内容的组件
 */
import { Show, createSignal } from "solid-js";
import { JSX } from "solid-js/jsx-runtime";
import { AlertCircle, ArrowDown, Bird, Loader } from "lucide-solid";

import { ListCore } from "@/domains/list";

export function ListView(
  props: { store: ListCore<any, any>; skeleton?: JSX.Element } & JSX.HTMLAttributes<HTMLDivElement>
) {
  const { store, skeleton } = props;
  const [response, setResponse] = createSignal(store.response);

  store.onStateChange((nextState) => {
    console.log("[COMPONENT]ListView - store.onStateChange", nextState.empty);
    setResponse(nextState);
  });

  return (
    <div class="relative">
      <Show
        when={!response().error}
        fallback={
          <div class="w-full h-[480px] center flex items-center justify-center">
            <div class="flex flex-col items-center justify-center text-slate-500">
              <AlertCircle class="w-24 h-24" />
              <div class="mt-4 flex items-center space-x-2">
                <div class="text-xl">{response().error?.message}</div>
              </div>
            </div>
          </div>
        }
      >
        <Show when={response().empty}>
          <div class="w-full h-[480px] center flex items-center justify-center">
            <div class="flex flex-col items-center justify-center text-slate-500">
              <Bird class="w-24 h-24" />
              <div class="mt-4 flex items-center space-x-2">
                <Show when={response().loading}>
                  <Loader class="w-6 h-6 animate-spin" />
                </Show>
                <div class="text-xl">{response().loading ? "加载中" : "列表为空"}</div>
              </div>
            </div>
          </div>
        </Show>
        <Show when={response().initial && skeleton}>{skeleton}</Show>
        {props.children}
        <Show when={!response().noMore && !response().initial}>
          <div class="mt-4 flex justify-center py-4 text-slate-500">
            <div
              class="mt-4 flex items-center space-x-2 cursor-pointer"
              onClick={() => {
                store.loadMore();
              }}
            >
              <Show when={response().loading} fallback={<ArrowDown class="w-6 h-6" />}>
                <Loader class="w-6 h-6 animate-spin" />
              </Show>
              <div class="text-center">{response().loading ? "加载中" : "加载更多"}</div>
            </div>
          </div>
        </Show>
      </Show>
      {/* <Show when={response().loading}>
        <div class="z-10 absolute inset-0 flex items-center justify-center opacity-80 bg-white"></div>
        <div class="z-20 absolute inset-0 flex items-center justify-center">
          <div class="flex flex-col items-center justify-center text-slate-500">
            <Loader class="w-6 h-6 animate-spin" />
            <div class="mt-4 text-xl">加载中</div>
          </div>
        </div>
      </Show> */}
    </div>
  );
}
