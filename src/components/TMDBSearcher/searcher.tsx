/**
 * @file TMDB 搜索器
 */
import { For, JSX, createSignal } from "solid-js";
import { Search } from "lucide-solid";

import { Button, Input, LazyImage, Label, ListView, ScrollView } from "@/components/ui";
import * as Form from "@/components/ui/form";
import { TMDBSearcherCore } from "@/domains/tmdb";
import { ScrollViewCore } from "@/domains/ui/scroll-view";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
import { cn } from "@/utils";

export const TMDBSearcher = (props: { store: TMDBSearcherCore } & JSX.HTMLAttributes<HTMLElement>) => {
  const { store } = props;
  // const [values, set_values] = useState({
  //   name: default_keyword,
  //   language: "zh-CN",
  // });
  const scrollView = new ScrollViewCore({
    // onScroll(pos) {
    //   console.log('scroll', pos);
    // },
    onReachBottom() {
      store.list.loadMore();
    },
  });
  const [state, setState] = createSignal(store.state);
  store.onStateChange((nextState) => {
    setState(nextState);
  });

  const dataSource = () => state().response.dataSource;
  const cur = () => state().cur;

  return (
    <div>
      <div class="grid gap-4 py-4">
        <Form.Root store={store.form}>
          <div class="grid grid-cols-12 items-center gap-4">
            <Label class="col-span-2 text-right">名称</Label>
            <div class="col-span-10">
              <Input store={store.input} />
            </div>
          </div>
        </Form.Root>
        {/* <div class="grid grid-cols-12 items-center gap-4">
          <Label class="col-span-2 text-right">语言</Label>
          <Select>
            <SelectTrigger className="col-span-4">
              <SelectValue placeholder="选择语言" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="light">中文</SelectItem>
              <SelectItem value="dark">English</SelectItem>
            </SelectContent>
          </Select>
          <Label class="col-span-1 text-right">类型</Label>
          <Select>
            <SelectTrigger className="col-span-5">
              <SelectValue placeholder="选择搜索类型" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="light">电影</SelectItem>
              <SelectItem value="dark">电视剧</SelectItem>
            </SelectContent>
          </Select>
        </div> */}
        <div class="grid grid-cols-12">
          <div class="col-span-2" />
          <div class="space-x-2 col-span-10">
            <Button class="" store={store.searchBtn}>
              搜索
            </Button>
            <Button class="" variant="subtle" store={store.resetBtn}>
              重置
            </Button>
          </div>
        </div>
      </div>
      <ListView
        store={store.list}
        skeleton={
          <div class="relative h-[240px] p-2 space-y-4">
            <div class="absolute inset-0 flex items-center justify-center">
              <div class="flex flex-col items-center justify-center text-slate-500">
                <Search class="w-24 h-24" />
                <div class="text-xl">搜索 TMDB 数据库</div>
              </div>
            </div>
            {/* <div class={cn("flex py-2 bg-white")}>
              <Skeleton class="w-[120px] h-[240px] rounded-sm mr-4" />
              <div class="flex-1 overflow-hidden text-ellipsis">
                <Skeleton class="h-[48px] w-full text-2xl" />
                <div class="mt-2 space-y-1">
                  <Skeleton class="w-24 h-[24px]" />
                  <Skeleton class="w-full h-[24px]" />
                  <Skeleton class="w-48 h-[24px]" />
                  <Skeleton class="w-12 h-[24px]" />
                </div>
                <Skeleton class="w-24 h-[18px] mt-2" />
              </div>
            </div> */}
          </div>
        }
      >
        <div class="relative">
          <ScrollView store={scrollView} class="relative max-h-[360px] overflow-y-auto p-2 space-y-4">
            <For each={dataSource()}>
              {(tv) => {
                const { name, original_name, overview, poster_path, first_air_date } = tv;
                return (
                  <div
                    class={cn("flex py-2", tv.id === cur()?.id ? "bg-slate-300" : "bg-white")}
                    onClick={() => {
                      store.toggle(tv);
                    }}
                  >
                    <LazyImage class="w-[120px] rounded-sm object-fit mr-4" src={poster_path} alt={name} />
                    <div class="flex-1 overflow-hidden text-ellipsis">
                      <div class="text-2xl">{name}</div>
                      <div class="text-slate-500">{original_name}</div>
                      <div class="break-all whitespace-pre-wrap truncate line-clamp-4">{overview}</div>
                      <div>{first_air_date}</div>
                    </div>
                  </div>
                );
              }}
            </For>
          </ScrollView>
        </div>
      </ListView>
    </div>
  );
};
