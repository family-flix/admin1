/**
 * @file TMDB 搜索器
 */
import { For, JSX, createSignal } from "solid-js";

import { LazyImage } from "@/components/ui/image";
import * as Form from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { TMDBSearcherCore } from "@/domains/tmdb";
import { ScrollView } from "@/components/ui/scroll-view";
import { ScrollViewCore } from "@/domains/ui/scroll-view";
import { cn } from "@/utils";

export const TMDBSearcher = (props: { store: TMDBSearcherCore } & JSX.HTMLAttributes<HTMLElement>) => {
  const { store } = props;
  // const [values, set_values] = useState({
  //   name: default_keyword,
  //   language: "zh-CN",
  // });
  const scrollView = new ScrollViewCore({
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
            <Input class="col-span-10" store={store.input} />
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
      <div class="relative">
        <ScrollView store={scrollView} class="relative overflow-y-auto h-[480px] p-2 space-y-4">
          <For each={dataSource()}>
            {(tv) => {
              const { name, overview, poster_path, first_air_date } = tv;
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
                    <div class="break-all whitespace-pre-wrap truncate line-clamp-4">{overview}</div>
                    <div>{first_air_date}</div>
                  </div>
                </div>
              );
            }}
          </For>
        </ScrollView>
      </div>
    </div>
  );
};
