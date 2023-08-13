/**
 * @file 电视剧详情
 */
import { For, Show, createSignal, onMount } from "solid-js";

import { ViewComponent } from "@/types";
import { TMDBSearcherDialog } from "@/components/TMDBSearcher/dialog";
import {
  fetch_tv_profile,
  TVProfile,
  refresh_tv_profile,
  fetch_episodes_of_season,
  deleteSeason,
  EpisodeItemInSeason,
  delete_season,
  SeasonInTVProfile,
} from "@/services";
import { createJob, appendAction } from "@/store";
import { cn } from "@/utils";
import { Button, ContextMenu, ScrollView, Skeleton, Dialog, LazyImage } from "@/components/ui";
import { ListView } from "@/components/ListView";
import { TMDBSearcherDialogCore } from "@/components/TMDBSearcher/store";
import { MenuItemCore, ContextMenuCore, ScrollViewCore, DialogCore, ButtonCore } from "@/domains/ui";
import { RequestCore } from "@/domains/client";
import { SelectionCore } from "@/domains/cur";
import { ListCore } from "@/domains/list";

export const TVProfilePage: ViewComponent = (props) => {
  const { app, view, router } = props;

  const profileRequest = new RequestCore(fetch_tv_profile, {
    onFailed(error) {
      app.tip({ text: ["获取电视剧详情失败", error.message] });
    },
    onSuccess(v) {
      setProfile(v);
      if (v.seasons.length === 0) {
        return;
      }
      curEpisodeList.setDataSource(v.curSeasonEpisodes);
      curSeasonSelector.select(v.curSeason);
      curEpisodeList.modifySearch((search) => {
        return {
          ...search,
          tv_id: view.params.id,
          season_id: view.query.season_id || v.seasons[0].id,
        };
      });
    },
  });
  const curSeasonSelector = new SelectionCore<SeasonInTVProfile>();
  const curEpisodeList = new ListCore(new RequestCore(fetch_episodes_of_season));

  const curFile = new SelectionCore<EpisodeItemInSeason["sources"][number]>();
  // const curParsedTV = new SelectionCore<TVProfile["parsed_tvs"][number]>();
  const updateTVProfileRequest = new RequestCore(refresh_tv_profile, {
    onLoading(loading) {
      tmdbSearchDialog.okBtn.setLoading(loading);
    },
    onFailed(error) {
      app.tip({ text: ["更新详情失败", error.message] });
    },
    onSuccess(v) {
      app.tip({ text: ["开始更新详情"] });
      createJob({
        job_id: v.job_id,
        onFinish() {
          profileRequest.reload();
        },
      });
      tmdbSearchDialog.hide();
    },
  });
  const tmdbSearchDialog = new TMDBSearcherDialogCore({
    onOk(searched_tv) {
      const id = view.params.id as string;
      if (!id) {
        app.tip({ text: ["更新详情失败", "缺少电视剧 id"] });
        return;
      }
      updateTVProfileRequest.run({
        tv_id: id,
        tmdb_id: searched_tv.id,
      });
    },
  });
  const btn1 = new ButtonCore({
    onClick() {
      if (profileRequest.response) {
        tmdbSearchDialog.input(profileRequest.response.name);
      }
      tmdbSearchDialog.show();
    },
  });
  const refreshProfileRequest = new RequestCore(refresh_tv_profile, {
    // onLoading(loading) {
    //   refreshProfileBtn.setLoading(loading);
    // },
    onSuccess(resp) {
      app.tip({
        text: ["开始刷新"],
      });
      refreshProfileBtn.setLoading(true);
      createJob({
        job_id: resp.job_id,
        onFinish() {
          refreshProfileBtn.setLoading(false);
          profileRequest.reload();
        },
        onTip(msg) {
          app.tip(msg);
        },
      });
    },
    onFailed(error) {
      refreshProfileBtn.setLoading(false);
      app.tip({
        text: ["刷新失败", error.message],
      });
    },
  });
  const refreshProfileBtn = new ButtonCore({
    onClick() {
      refreshProfileBtn.setLoading(true);
      refreshProfileRequest.run({ tv_id: view.params.id });
    },
  });
  const seasonDeleteRequest = new RequestCore(delete_season, {
    onLoading(loading) {
      tvDeleteConfirmDialog.okBtn.setLoading(loading);
    },
    onSuccess() {
      app.tip({
        text: ["删除成功"],
      });
      tvDeleteConfirmDialog.hide();
      appendAction("deleteTV", {
        tv_id: view.params.id,
        id: view.query.season_id,
      });
      router.back();
    },
    onFailed(error) {
      app.tip({
        text: ["删除失败", error.message],
      });
    },
  });
  const tvDeleteBtn = new ButtonCore({
    onClick() {
      tvDeleteConfirmDialog.show();
    },
  });
  const tvDeleteConfirmDialog = new DialogCore({
    title: "删除季",
    onOk() {
      if (!view.query.season_id) {
        app.tip({
          text: ["缺少季 id"],
        });
        return;
      }
      seasonDeleteRequest.run({ season_id: view.query.season_id });
    },
  });
  const selectedSeason = new SelectionCore<{ id: string; name: string }>();
  const deleteSeasonRequest = new RequestCore(deleteSeason, {
    onLoading(loading) {
      seasonDeletingConfirmDialog.okBtn.setLoading(loading);
    },
    onFailed(error) {
      app.tip({
        text: ["删除失败", error.message],
      });
    },
    onSuccess() {
      seasonDeletingConfirmDialog.hide();
      profileRequest.reload();
      app.tip({
        text: ["删除成功"],
      });
    },
  });
  const seasonDeletingConfirmDialog = new DialogCore({
    title: "删除季",
    onOk() {
      if (!selectedSeason.value) {
        app.tip({
          text: ["请先选择要删除的季"],
        });
        return;
      }
      deleteSeasonRequest.run({
        season_id: selectedSeason.value.id,
      });
    },
  });
  const deleteSeasonMenuItem = new MenuItemCore({
    label: "删除",
    async onClick() {
      seasonDeletingConfirmDialog.show();
      seasonContextMenu.hide();
    },
  });
  const seasonContextMenu = new ContextMenuCore({
    items: [deleteSeasonMenuItem],
  });
  const scrollView = new ScrollViewCore({
    onReachBottom() {
      curEpisodeList.loadMore();
    },
  });

  const [profile, setProfile] = createSignal<TVProfile | null>(null);
  const [curEpisodeResponse, setCurEpisodeResponse] = createSignal(curEpisodeList.response);
  const [curSeason, setCurSeason] = createSignal(curSeasonSelector.value);

  curSeasonSelector.onStateChange((nextState) => {
    setCurSeason(nextState);
  });
  curEpisodeList.onStateChange((nextResponse) => {
    setCurEpisodeResponse(nextResponse);
  });
  curEpisodeList.onComplete(() => {
    curSeasonSelector.select({ id: curEpisodeList.params.season_id as string, name: curSeason()?.name ?? "" });
  });

  onMount(() => {
    const { id } = view.params;
    const season_id = view.query.season_id;
    profileRequest.run({ tv_id: id, season_id });
  });

  return (
    <>
      <ScrollView class="h-screen p-8" store={scrollView}>
        <div class="">
          <Show
            when={!!profile()}
            fallback={
              <div class="relative">
                <div class="">
                  <div>
                    <div class="relative z-3">
                      <div class="flex">
                        <Skeleton class="w-[240px] h-[360px] rounded-lg mr-4 object-cover" />
                        <div class="flex-1 mt-4">
                          <Skeleton class="w-full h-[48px]"></Skeleton>
                          <Skeleton class="mt-6 w-12 h-[36px]"></Skeleton>
                          <div class="mt-2 space-y-1">
                            <Skeleton class="w-12 h-[18px]"></Skeleton>
                            <Skeleton class="w-full h-[18px]"></Skeleton>
                            <Skeleton class="w-32 h-[18px]"></Skeleton>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            }
          >
            <div class="relative">
              <div class="">
                <div>
                  <div class="relative z-3">
                    <div class="flex">
                      <LazyImage
                        class="overflow-hidden w-[240px] rounded-lg mr-4 object-cover"
                        src={profile()?.poster_path ?? undefined}
                      />
                      <div class="flex-1 mt-4">
                        <h2 class="text-5xl">{profile()?.name}</h2>
                        <div class="mt-6 text-2xl">剧情简介</div>
                        <div class="mt-2">{profile()?.overview}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div class="relative z-3 mt-4">
                <div class="space-x-4 whitespace-nowrap">
                  <Button store={btn1}>搜索 TMDB</Button>
                  <a href={`https://www.themoviedb.org/tv/${profile()?.tmdb_id}`}>前往 TMDB 页面</a>
                  <Button store={refreshProfileBtn}>刷新详情</Button>
                  <Button store={tvDeleteBtn}>删除季</Button>
                </div>
                <div class="mt-4 flex w-full pb-4 overflow-x-auto space-x-4">
                  <For each={profile()?.seasons}>
                    {(season) => {
                      const { id, name } = season;
                      return (
                        <div
                          class={cn("cursor-pointer hover:underline", curSeason()?.id === id ? "underline" : "")}
                          onContextMenu={(event) => {
                            event.preventDefault();
                            const { x, y } = event;
                            selectedSeason.select(season);
                            seasonContextMenu.show({
                              x,
                              y,
                            });
                          }}
                          onClick={() => {
                            curEpisodeList.search({
                              season_id: id,
                            });
                          }}
                        >
                          <div class="text-xl whitespace-nowrap">{name}</div>
                        </div>
                      );
                    }}
                  </For>
                </div>
                <ListView
                  store={curEpisodeList}
                  class="space-y-4"
                  // skeleton={
                  //   <div class="space-y-4">
                  //     <div>
                  //       <Skeleton class="w-full h-[28px]" />
                  //       <div class="pl-4 space-y-1">
                  //         <Skeleton class="w-full h-[24px]" />
                  //         <Skeleton class="w-18 h-[24px]" />
                  //       </div>
                  //     </div>
                  //     <div>
                  //       <Skeleton class="w-32 h-[28px]" />
                  //       <div class="pl-4 space-y-1">
                  //         <Skeleton class="w-24 h-[24px]" />
                  //         <Skeleton class="w-full h-[24px]" />
                  //       </div>
                  //     </div>
                  //   </div>
                  // }
                >
                  <For each={curEpisodeResponse().dataSource}>
                    {(episode) => {
                      const { id, name, episode_number, runtime, sources } = episode;
                      return (
                        <div>
                          <div class="text-lg">
                            {episode_number}、{name}
                            <Show when={runtime}>
                              <span class="text-gray-500 text-sm">({runtime}min)</span>
                            </Show>
                          </div>
                          <div class="pl-4 space-y-1">
                            <For each={sources}>
                              {(source) => {
                                const { file_id, file_name, parent_paths, drive } = source;
                                return (
                                  <div>
                                    <span
                                      class="text-slate-500 break-all"
                                      title={`[${drive.name}]${parent_paths}/${file_name}`}
                                      onClick={() => {
                                        router.push(`/play/${file_id}`);
                                      }}
                                    >
                                      {parent_paths}/{file_name}
                                    </span>
                                  </div>
                                );
                              }}
                            </For>
                          </div>
                        </div>
                      );
                    }}
                  </For>
                </ListView>
              </div>
            </div>
            {/* <div class="mt-8 text-xl">关联解析结果列表</div>
            <div class="mt-4 space-y-1">
              <Show when={!!profile()}>
                <For each={profile()?.parsed_tvs}>
                  {(parsed_tv) => {
                    const { file_name, name, original_name, correct_name } = parsed_tv;
                    return (
                      <div class="flex items-center space-x-2 text-slate-800">
                        <div>{name || original_name}</div>
                        <div class="flex items-center space-x-1">
                          <Element store={updateParsedTVBtn.bind(parsed_tv)}>
                            <Edit3 class="w-4 h-4 cursor-pointer" />
                          </Element>
                          <Element store={deleteParsedTVBtn.bind(parsed_tv)}>
                            <Trash class="w-4 h-4 cursor-pointer" />
                          </Element>
                        </div>
                      </div>
                    );
                  }}
                </For>
              </Show>
            </div> */}
            {/* <div class="mt-8 text-xl">文件列表</div>
            <div class="mt-4 space-y-1">
              <For each={sourceResponse().dataSource}>
                {(source) => {
                  const { file_name, drive, parent_paths } = source;
                  return (
                    <div class="flex items-center space-x-2 text-slate-800">
                      <div>
                        <span class="text-slate-800 mr-2">{drive.name}</span>
                        <span>
                          {parent_paths}/{file_name}
                        </span>
                      </div>
                      <div class="flex items-center space-x-1">
                        <Element store={updateBtn.bind(source)}>
                          <Edit3 class="w-4 h-4 cursor-pointer" />
                        </Element>
                        <Element store={deleteBtn.bind(source)}>
                          <Trash class="w-4 h-4 cursor-pointer" />
                        </Element>
                      </div>
                    </div>
                  );
                }}
              </For>
            </div>
            <Show when={!sourceResponse().noMore}>
              <div
                class="py-2 text-center cursor-pointer"
                onClick={() => {
                  sourceList.loadMore();
                }}
              >
                更多
              </div>
            </Show> */}
          </Show>
        </div>
      </ScrollView>
      <TMDBSearcherDialog store={tmdbSearchDialog} />
      <Dialog store={tvDeleteConfirmDialog}>
        <div class="">
          <div>确认删除「{curSeason()?.name}」吗？</div>
          <div>仅删除本地索引记录</div>
          <div>删除云盘文件请到云盘详情页操作</div>
        </div>
      </Dialog>
      <Dialog store={seasonDeletingConfirmDialog}>
        <div class="space-y-1">
          <div>确认删除「{curSeason()?.name}」吗？</div>
          <div>同时还会删除关联的剧集</div>
          <div>请仅在需要重新索引关联的文件时进行删除操作</div>
        </div>
      </Dialog>
      <ContextMenu store={seasonContextMenu} />
    </>
  );
};
