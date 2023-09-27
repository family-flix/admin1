/**
 * @file 电视剧详情
 */
import { For, Show, createSignal, onMount } from "solid-js";
import { ArrowLeft, Play, Trash } from "lucide-solid";

import {
  fetchTVProfile,
  TVProfile,
  fetchEpisodesOfSeason,
  EpisodeItemInSeason,
  deleteSeason,
  SeasonInTVProfile,
  deleteSourceFile,
  updateSeasonProfileManually,
} from "@/services";
import { Button, ContextMenu, ScrollView, Skeleton, Dialog, LazyImage, ListView, Input } from "@/components/ui";
import { TMDBSearcherDialog, TMDBSearcherDialogCore } from "@/components/TMDBSearcher";
import {
  MenuItemCore,
  ContextMenuCore,
  ScrollViewCore,
  DialogCore,
  ButtonCore,
  InputCore,
  SelectCore,
} from "@/domains/ui";
import { RequestCore } from "@/domains/request";
import { RefCore } from "@/domains/cur";
import { ListCore } from "@/domains/list";
import { mediaPlayingPage } from "@/store";
import { ViewComponent } from "@/types";
import { bytes_to_size, cn } from "@/utils";

export const TVProfilePage: ViewComponent = (props) => {
  const { app, view } = props;

  const profileRequest = new RequestCore(fetchTVProfile, {
    onFailed(error) {
      app.tip({ text: ["获取电视剧详情失败", error.message] });
    },
    onSuccess(v) {
      setProfile(v);
      if (v.seasons.length === 0) {
        return;
      }
      curSeasonStore.select(v.curSeason);
      curEpisodeList.modifyResponse((response) => {
        return {
          ...response,
          dataSource: v.curSeasonEpisodes,
          initial: false,
          noMore: false,
          search: {
            ...response.search,
            season_id: response.search.season_id || v.seasons[0].id,
          },
        };
      });
    },
  });
  const sourceDeleteRequest = new RequestCore(deleteSourceFile, {
    onLoading(loading) {
      fileDeletingConfirmDialog.okBtn.setLoading(loading);
    },
    onSuccess() {
      const the_episode = curEpisode.value;
      const the_source = curFile.value;
      if (!the_episode || !the_source) {
        app.tip({
          text: ["删除成功，请刷新页面"],
        });
        return;
      }
      curEpisodeList.modifyResponse((response) => {
        return {
          ...response,
          dataSource: response.dataSource.map((episode) => {
            if (episode.id !== the_episode.id) {
              return episode;
            }
            return {
              ...episode,
              sources: episode.sources.filter((source) => {
                if (source.id !== the_source.id) {
                  return true;
                }
                return false;
              }),
            };
          }),
        };
      });
      fileDeletingConfirmDialog.hide();
      app.tip({
        text: ["删除成功"],
      });
    },
    onFailed(error) {
      app.tip({
        text: ["删除视频源失败", error.message],
      });
    },
  });
  const profileUpdateRequest = new RequestCore(updateSeasonProfileManually, {
    onLoading(loading) {
      profileUpdateDialog.okBtn.setLoading(loading);
    },
    onSuccess() {
      app.tip({
        text: ["更新成功"],
      });
      profileUpdateDialog.hide();
      profileRequest.reload();
    },
    onFailed(error) {
      app.tip({
        text: ["更新失败", error.message],
      });
    },
  });
  const curEpisodeList = new ListCore(new RequestCore(fetchEpisodesOfSeason), {
    search: {
      tv_id: view.query.id,
      season_id: view.query.season_id,
    },
  });
  const tmpSeasonStore = new RefCore<SeasonInTVProfile>();
  const curSeasonStore = new RefCore<SeasonInTVProfile>();
  const curEpisode = new RefCore<EpisodeItemInSeason>();
  const curFile = new RefCore<EpisodeItemInSeason["sources"][number]>();
  // const curParsedTV = new SelectionCore<TVProfile["parsed_tvs"][number]>();
  const selectedSeason = new RefCore<{ id: string; name: string }>();
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
  const fileDeletingConfirmDialog = new DialogCore({
    title: "删除视频源",
    onOk() {
      const theSource = curFile.value;
      if (!theSource) {
        app.tip({
          text: ["请先选择要删除的源"],
        });
        return;
      }
      sourceDeleteRequest.run({
        id: theSource.id,
      });
    },
  });
  const seasonContextMenu = new ContextMenuCore({
    items: [deleteSeasonMenuItem],
  });
  const profileTitleInput = new InputCore({
    defaultValue: "",
    placeholder: "请输入电视剧标题",
  });
  const profileEpisodeCountInput = new InputCore({
    defaultValue: "",
    placeholder: "请输入季剧集总数",
  });
  const profileUpdateBtn = new ButtonCore({
    onClick() {
      profileUpdateDialog.show();
    },
  });
  const profileUpdateDialog = new DialogCore({
    title: "手动修改详情",
    onOk() {
      const title = profileTitleInput.value;
      const episodeCount = profileEpisodeCountInput.value;
      if (!title && !episodeCount) {
        app.tip({
          text: ["请至少输入一个变更项"],
        });
        return;
      }
      profileUpdateRequest.run({
        season_id: view.query.season_id,
        title,
        episode_count: episodeCount ? Number(episodeCount) : undefined,
      });
    },
  });
  const scrollView = new ScrollViewCore({
    onReachBottom() {
      curEpisodeList.loadMore();
    },
  });

  const [profile, setProfile] = createSignal<TVProfile | null>(null);
  const [curEpisodeResponse, setCurEpisodeResponse] = createSignal(curEpisodeList.response);
  const [curSeason, setCurSeason] = createSignal(curSeasonStore.value);
  const [sizeCount, setSizeCount] = createSignal<string | null>(null);

  curSeasonStore.onStateChange((nextState) => {
    setCurSeason(nextState);
  });
  curEpisodeList.onStateChange((nextResponse) => {
    const sourceSizeCount = nextResponse.dataSource.reduce((count, cur) => {
      const curCount = cur.sources.reduce((total, cur) => {
        return total + cur.size;
      }, 0);
      return count + curCount;
    }, 0);
    setSizeCount(bytes_to_size(sourceSizeCount));
    setCurEpisodeResponse(nextResponse);
  });
  curEpisodeList.onComplete(() => {
    curSeasonStore.select({
      id: curEpisodeList.params.season_id as string,
      name: tmpSeasonStore.value?.name ?? "",
      season_text: tmpSeasonStore.value?.season_text ?? "",
    });
  });

  onMount(() => {
    const { id } = view.query;
    console.log("[PAGE]tv/profile - onMount", id);
    const season_id = view.query.season_id;
    profileRequest.run({ tv_id: id, season_id });
  });

  return (
    <>
      <ScrollView class="h-screen py-4 px-8" store={scrollView}>
        <div class="py-2">
          <div
            class="mb-2 cursor-pointer"
            onClick={() => {
              app.back();
            }}
          >
            <ArrowLeft class="w-6 h-6" />
          </div>
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
                        <div class="mt-4">
                          <a href={`https://www.themoviedb.org/tv/${profile()?.tmdb_id}`}>TMDB</a>
                        </div>
                        <div>{sizeCount()}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div class="relative z-3 mt-4">
                <div class="mt-4 flex w-full pb-4 overflow-x-auto space-x-4">
                  <For each={profile()?.seasons}>
                    {(season) => {
                      const { id, name } = season;
                      return (
                        <div class={cn("cursor-pointer hover:underline", curSeason()?.id === id ? "underline" : "")}>
                          <div class="text-xl whitespace-nowrap">{name}</div>
                        </div>
                      );
                    }}
                  </For>
                </div>
                <ListView store={curEpisodeList} class="space-y-4">
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
                                const { id, file_name, parent_paths, drive } = source;
                                return (
                                  <div class="flex items-center space-x-4 text-slate-500">
                                    <span class="break-all" title={`[${drive.name}]${parent_paths}/${file_name}`}>
                                      [{drive.name}]{parent_paths}/{file_name}
                                    </span>
                                    <div class="flex items-center space-x-2">
                                      <div
                                        class="p-1 cursor-pointer"
                                        title="播放"
                                        onClick={() => {
                                          mediaPlayingPage.query = {
                                            id,
                                          };
                                          app.showView(mediaPlayingPage);
                                        }}
                                      >
                                        <Play class="w-4 h-4" />
                                      </div>
                                      <div
                                        class="p-1 cursor-pointer"
                                        title="删除源"
                                        onClick={() => {
                                          curEpisode.select(episode);
                                          curFile.select(source);
                                          fileDeletingConfirmDialog.show();
                                        }}
                                      >
                                        <Trash class="w-4 h-4" />
                                      </div>
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
                </ListView>
              </div>
            </div>
          </Show>
        </div>
      </ScrollView>
    </>
  );
};
