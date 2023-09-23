/**
 * @file 电视剧列表
 */
import { createSignal, For, Show } from "solid-js";
import { Search, SlidersHorizontal, Trash } from "lucide-solid";

import { deleteTV, fetchInvalidTVList, InvalidTVItem } from "@/services";
import {
  Skeleton,
  ScrollView,
  Input,
  Button,
  LazyImage,
  PurePopover,
  BackToTop,
  CheckboxGroup,
  ListView,
} from "@/components/ui";
import { ScrollViewCore, PopoverCore, InputCore, ButtonCore, ButtonInListCore, CheckboxGroupCore } from "@/domains/ui";
import { ListCore } from "@/domains/list";
import { RequestCore } from "@/domains/request";
import { RefCore } from "@/domains/cur";
import { DriveCore } from "@/domains/drive";
import { createJob, driveList, consumeAction, pendingActions, homeTVProfilePage, seasonArchivePage } from "@/store";
import { Result, ViewComponent } from "@/types";
import { MediaSourceOptions, TVGenresOptions } from "@/constants";
import { cn } from "@/utils";

export const InvalidTVManagePage: ViewComponent = (props) => {
  const { app, view } = props;

  const tvList = new ListCore(new RequestCore(fetchInvalidTVList), {
    onLoadingChange(loading) {
      searchBtn.setLoading(loading);
      resetBtn.setLoading(loading);
    },
  });
  const tvDeletingRequest = new RequestCore(deleteTV, {
    onLoading(loading) {
      tvDeletingBtn.setLoading(loading);
    },
    onSuccess() {
      app.tip({
        text: ["删除成功"],
      });
      const tv = tvRef.value;
      if (!tv) {
        return;
      }
      tvList.deleteItem((item) => {
        if (item.id === tv.id) {
          return true;
        }
        return false;
      });
    },
    onFailed(error) {
      app.tip({
        text: ["删除失败", error.message],
      });
    },
  });
  const tvRef = new RefCore<InvalidTVItem>();
  const driveCheckboxGroup = new CheckboxGroupCore({
    options: driveList.response.dataSource.map((d) => {
      const { name, id } = d;
      return {
        value: id,
        label: name,
      };
    }),
    onChange(options) {
      setHasSearch(!!options.length);
      tvList.search({
        drive_ids: options.join("|"),
      });
    },
  });
  const driveRef = new RefCore<DriveCore>({
    onChange(v) {
      setCurDrive(v);
    },
  });
  const tipPopover = new PopoverCore({
    align: "end",
  });
  const nameSearchInput = new InputCore({
    defaultValue: "",
    placeholder: "请输入名称搜索",
    onEnter() {
      searchBtn.click();
    },
  });
  const searchBtn = new ButtonCore({
    onClick() {
      tvList.search({ name: nameSearchInput.value });
    },
  });
  const resetBtn = new ButtonCore({
    onClick() {
      tvList.reset();
      nameSearchInput.clear();
    },
  });
  const tvDeletingBtn = new ButtonInListCore<InvalidTVItem>({
    async onClick(record) {
      tvRef.select(record);
      tvDeletingRequest.run({ id: record.id });
    },
  });
  const scrollView = new ScrollViewCore({
    pullToRefresh: false,
    onReachBottom() {
      tvList.loadMore();
    },
    onScroll() {
      tipPopover.hide();
    },
  });

  const [seasonListState, setSeasonListState] = createSignal(tvList.response);
  const [tips, setTips] = createSignal<string[]>([]);
  const [driveListState, setDriveListState] = createSignal(driveList.response);
  const [curDrive, setCurDrive] = createSignal(driveRef.value);
  const [hasSearch, setHasSearch] = createSignal(false);

  driveList.onStateChange((nextState) => {
    const driveCheckBoxGroupOptions = nextState.dataSource.map((d) => {
      const { name, id } = d;
      return {
        value: id,
        label: name,
      };
    });
    driveCheckboxGroup.setOptions(driveCheckBoxGroupOptions);
    setDriveListState(nextState);
  });
  tvList.onStateChange((nextState) => {
    setSeasonListState(nextState);
  });
  view.onShow(() => {
    const { deleteTV } = pendingActions;
    if (!deleteTV) {
      return;
    }
    consumeAction("deleteTV");
    tvList.deleteItem((season) => {
      if (season.id === deleteTV.id) {
        return true;
      }
      return false;
    });
  });
  tvList.init();
  driveList.initAny();

  return (
    <>
      <ScrollView class="h-screen p-8" store={scrollView}>
        <div class="relative">
          <div class="flex items-center space-x-4">
            <h1 class="text-2xl">电视剧列表({seasonListState().total})</h1>
          </div>
          <div class="mt-8">
            <div class="flex items-center space-x-2">
              <Button class="" store={resetBtn}>
                重置
              </Button>
              <PurePopover
                align="center"
                class="w-96"
                content={
                  <div class="h-[320px] py-4 pb-8 px-2 overflow-y-auto">
                    <div class="mt-4">
                      <div>云盘</div>
                      <CheckboxGroup store={driveCheckboxGroup} />
                    </div>
                  </div>
                }
              >
                <div class="relative p-2 cursor-pointer">
                  <SlidersHorizontal class={cn("w-5 h-5")} />
                  <Show when={hasSearch()}>
                    <div class="absolute top-[2px] right-[2px] w-2 h-2 rounded-full bg-red-500"></div>
                  </Show>
                </div>
              </PurePopover>
            </div>
            <div class="flex items-center space-x-2 mt-4">
              <Input class="" store={nameSearchInput} />
              <Button class="" icon={<Search class="w-4 h-4" />} store={searchBtn}>
                搜索
              </Button>
            </div>
            <div class="mt-4">
              <ListView
                store={tvList}
                skeleton={
                  <div>
                    <div class="rounded-md border border-slate-300 bg-white shadow-sm">
                      <div class="flex">
                        <div class="overflow-hidden mr-2 rounded-sm">
                          <Skeleton class="w-[180px] h-[272px]" />
                        </div>
                        <div class="flex-1 p-4">
                          <Skeleton class="h-[36px] w-[180px]"></Skeleton>
                          <div class="mt-2 space-y-1">
                            <Skeleton class="h-[24px] w-[120px]"></Skeleton>
                            <Skeleton class="h-[24px] w-[240px]"></Skeleton>
                          </div>
                          <div class="flex items-center space-x-4 mt-2">
                            <Skeleton class="w-10 h-6"></Skeleton>
                            <Skeleton class="w-10 h-6"></Skeleton>
                            <Skeleton class="w-10 h-6"></Skeleton>
                          </div>
                          <div class="flex space-x-2 mt-6">
                            <Skeleton class="w-24 h-8"></Skeleton>
                            <Skeleton class="w-24 h-8"></Skeleton>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                }
              >
                <div class="space-y-4">
                  <For each={seasonListState().dataSource}>
                    {(tv) => {
                      const { id, name, overview, poster_path, episodes } = tv;
                      return (
                        <div class="rounded-md border border-slate-300 bg-white shadow-sm">
                          <div class="flex">
                            <div class="overflow-hidden mr-2 rounded-sm">
                              <LazyImage class="w-[180px] h-[272px]" src={poster_path} alt={name} />
                            </div>
                            <div class="flex-1 w-0 p-4">
                              <div class="flex items-center">
                                <h2 class="text-2xl text-slate-800">{name}</h2>
                              </div>
                              <div class="mt-2 overflow-hidden text-ellipsis">
                                <p class="text-slate-700 break-all whitespace-pre-wrap truncate line-clamp-3">
                                  {overview}
                                </p>
                              </div>
                              <div class="mt-4 grid gap-2 grid-cols-6">
                                <For each={episodes}>
                                  {(episode) => {
                                    const { name, episode_text, sources } = episode;
                                    return (
                                      <div class="p-2 text-slate-500">
                                        <div>{episode_text}</div>
                                        <div>
                                          <For each={sources}>
                                            {(source) => {
                                              const { file_name, parent_paths } = source;
                                              return (
                                                <div>
                                                  <div>
                                                    {parent_paths}/{file_name}
                                                  </div>
                                                </div>
                                              );
                                            }}
                                          </For>
                                        </div>
                                      </div>
                                    );
                                  }}
                                </For>
                              </div>
                              <div class="space-x-2 mt-4 p-1 overflow-hidden whitespace-nowrap">
                                <Button
                                  store={tvDeletingBtn.bind(tv)}
                                  variant="subtle"
                                  icon={<Trash class="w-4 h-4" />}
                                >
                                  删除
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    }}
                  </For>
                </div>
              </ListView>
            </div>
          </div>
        </div>
      </ScrollView>
      <BackToTop store={scrollView} />
    </>
  );
};
