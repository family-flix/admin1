/**
 * @file 电视剧详情
 */
import { For, Show, createSignal, onMount } from "solid-js";
import { ArrowLeft, Play, Trash } from "lucide-solid";

import { SeasonMediaProfile, fetchSeasonMediaProfile, setMediaProfile } from "@/services/media";
import {
  fetchEpisodesOfSeason,
  EpisodeItemInSeason,
  deleteSeason,
  SeasonInTVProfile,
  deleteSourceFile,
  refreshSeasonProfile,
} from "@/services";
import { Button, ContextMenu, ScrollView, Skeleton, Dialog, LazyImage, ListView, Input } from "@/components/ui";
import { TMDBSearcherDialog, TMDBSearcherView } from "@/components/TMDBSearcher";
import { MenuItemCore, ContextMenuCore, ScrollViewCore, DialogCore, ButtonCore, InputCore } from "@/domains/ui";
import { RequestCore } from "@/domains/request";
import { RefCore } from "@/domains/cur";
import { ListCore } from "@/domains/list";
import { createJob, appendAction, mediaPlayingPage, homeTVProfilePage } from "@/store";
import { ViewComponent } from "@/types";
import { bytes_to_size, cn } from "@/utils";
import { TMDBSearcherCore } from "@/domains/tmdb";

export const SeasonProfilePage: ViewComponent = (props) => {
  const { app, view } = props;

  const profileRequest = new RequestCore(fetchSeasonMediaProfile, {
    onSuccess(v) {
      setProfile(v);
    },
    onFailed(error) {
      app.tip({ text: ["获取电视剧详情失败", error.message] });
    },
  });
  const sourceDeletingRequest = new RequestCore(deleteSourceFile, {
    onLoading(loading) {
      fileDeletingConfirmDialog.okBtn.setLoading(loading);
    },
    onSuccess() {
      const theEpisode = episodeRef.value;
      const theSource = fileRef.value;
      if (!theEpisode || !theSource) {
        app.tip({
          text: ["删除成功，请刷新页面"],
        });
        return;
      }
      curEpisodeList.modifyResponse((response) => {
        return {
          ...response,
          dataSource: response.dataSource.map((episode) => {
            if (episode.id !== theEpisode.id) {
              return episode;
            }
            return {
              ...episode,
              sources: episode.sources.filter((source) => {
                if (source.id !== theSource.id) {
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
  // const profileManualUpdateRequest = new RequestCore(updateSeasonProfileManually, {
  //   onLoading(loading) {
  //     profileManualUpdateDialog.okBtn.setLoading(loading);
  //   },
  //   onSuccess() {
  //     app.tip({
  //       text: ["更新成功"],
  //     });
  //     profileManualUpdateDialog.hide();
  //     profileRequest.reload();
  //   },
  //   onFailed(error) {
  //     app.tip({
  //       text: ["更新失败", error.message],
  //     });
  //   },
  // });
  const curEpisodeList = new ListCore(new RequestCore(fetchEpisodesOfSeason), {
    search: {
      tv_id: view.query.id,
      season_id: view.query.season_id,
    },
  });
  const seasonDeletingRequest = new RequestCore(deleteSeason, {
    onLoading(loading) {
      seasonDeletingConfirmDialog.okBtn.setLoading(loading);
    },
    onFailed(error) {
      app.tip({
        text: ["删除失败", error.message],
      });
    },
    onSuccess() {
      app.tip({
        text: ["删除成功"],
      });
      appendAction("deleteTV", {
        tv_id: view.query.id,
        id: view.query.season_id,
      });
      seasonDeletingConfirmDialog.hide();
      app.back();
    },
  });
  const seasonProfileChangeRequest = new RequestCore(setMediaProfile, {
    onLoading(loading) {
      dialog.okBtn.setLoading(loading);
    },
    onSuccess() {
      app.tip({ text: ["更新详情成功"] });
      profileRequest.reload();
    },
  });
  const seasonProfileRefreshRequest = new RequestCore(refreshSeasonProfile, {
    onSuccess(r) {
      createJob({
        job_id: r.job_id,
        onFinish() {
          app.tip({ text: ["刷新详情成功"] });
          profileRequest.reload();
          profileRefreshBtn.setLoading(false);
        },
      });
    },
    onFailed(error) {
      app.tip({
        text: ["刷新详情失败", error.message],
      });
      profileRefreshBtn.setLoading(false);
    },
  });
  const tmpSeasonRef = new RefCore<SeasonInTVProfile>();
  const seasonRef = new RefCore<SeasonInTVProfile>();
  const episodeRef = new RefCore<EpisodeItemInSeason>();
  const fileRef = new RefCore<EpisodeItemInSeason["sources"][number]>();
  // const curParsedTV = new SelectionCore<TVProfile["parsed_tvs"][number]>();
  const searcher = new TMDBSearcherCore();
  const dialog = new DialogCore({
    onOk() {
      const id = view.query.id as string;
      if (!id) {
        app.tip({ text: ["更新详情失败", "缺少电视剧 id"] });
        return;
      }
      const media = searcher.cur;
      if (!media) {
        app.tip({ text: ["请先选择详情"] });
        return;
      }
      dialog.okBtn.setLoading(true);
      seasonProfileChangeRequest.run({
        media_id: id,
        media_profile: {
          id: String(media.id),
          type: media.type,
          name: media.name,
        },
      });
    },
  });
  const profileChangeBtn = new ButtonCore({
    onClick() {
      if (profileRequest.response) {
        searcher.$input.setValue(profileRequest.response.name);
      }
      dialog.show();
    },
  });
  const profileRefreshBtn = new ButtonCore({
    onClick() {
      app.tip({
        text: ["开始刷新"],
      });
      profileRefreshBtn.setLoading(true);
      seasonProfileRefreshRequest.run({ season_id: view.query.season_id });
    },
  });
  const seasonDeletingBtn = new ButtonCore({
    onClick() {
      // if (profileRequest.response) {
      //   seasonRef.select(profileRequest.response.curSeason);
      // }
      // seasonDeletingConfirmDialog.show();
    },
  });
  const seasonDeletingConfirmDialog = new DialogCore({
    title: "删除季",
    onOk() {
      if (!seasonRef.value) {
        app.tip({
          text: ["请先选择要删除的季"],
        });
        return;
      }
      seasonDeletingRequest.run({
        season_id: seasonRef.value.id,
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
      const theSource = fileRef.value;
      if (!theSource) {
        app.tip({
          text: ["请先选择要删除的源"],
        });
        return;
      }
      sourceDeletingRequest.run({
        id: theSource.id,
      });
    },
  });
  const seasonContextMenu = new ContextMenuCore({
    items: [deleteSeasonMenuItem],
  });
  // const profileTitleInput = new InputCore({
  //   defaultValue: "",
  //   placeholder: "请输入电视剧标题",
  // });
  // const profileEpisodeCountInput = new InputCore({
  //   defaultValue: "",
  //   placeholder: "请输入季剧集总数",
  // });
  // const profileUpdateBtn = new ButtonCore({
  //   onClick() {
  //     profileManualUpdateDialog.show();
  //   },
  // });
  // const profileManualUpdateDialog = new DialogCore({
  //   title: "手动修改详情",
  //   onOk() {
  //     const title = profileTitleInput.value;
  //     const episodeCount = profileEpisodeCountInput.value;
  //     if (!title && !episodeCount) {
  //       app.tip({
  //         text: ["请至少输入一个变更项"],
  //       });
  //       return;
  //     }
  //     profileManualUpdateRequest.run({
  //       season_id: view.query.season_id,
  //       title,
  //       episode_count: episodeCount ? Number(episodeCount) : undefined,
  //     });
  //   },
  // });
  const scrollView = new ScrollViewCore({
    onReachBottom() {
      curEpisodeList.loadMore();
    },
  });

  const [profile, setProfile] = createSignal<SeasonMediaProfile | null>(null);
  const [curEpisodeResponse, setCurEpisodeResponse] = createSignal(curEpisodeList.response);
  const [curSeason, setCurSeason] = createSignal(seasonRef.value);
  const [sizeCount, setSizeCount] = createSignal<string | null>(null);

  seasonRef.onStateChange((nextState) => {
    setCurSeason(nextState);
  });
  // curEpisodeList.onStateChange((nextResponse) => {
  //   const sourceSizeCount = nextResponse.dataSource.reduce((count, cur) => {
  //     const curCount = cur.sources.reduce((total, cur) => {
  //       return total + cur.size;
  //     }, 0);
  //     return count + curCount;
  //   }, 0);
  //   setSizeCount(bytes_to_size(sourceSizeCount));
  //   setCurEpisodeResponse(nextResponse);
  // });
  // curEpisodeList.onComplete(() => {
  //   seasonRef.select({
  //     id: curEpisodeList.params.season_id as string,
  //     name: tmpSeasonRef.value?.name ?? "",
  //     season_text: tmpSeasonRef.value?.season_text ?? "",
  //   });
  // });

  onMount(() => {
    profileRequest.run({ season_id: view.query.id });
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
                        {/* <div class="mt-4">
                          <a href={`https://www.themoviedb.org/tv/${profile()?.tmdb_id}`}>TMDB</a>
                        </div> */}
                        <div>{sizeCount()}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div class="relative z-3 mt-4">
                <div class="flex items-center space-x-4 whitespace-nowrap">
                  {/* <Button store={profileUpdateBtn}>修改详情</Button> */}
                  <Button store={profileChangeBtn}>变更详情</Button>
                  <Button store={profileRefreshBtn}>刷新详情</Button>
                  <Button store={seasonDeletingBtn}>删除季</Button>
                </div>
                <div class="space-y-4 mt-8">
                  <For each={profile()?.episodes}>
                    {(episode) => {
                      const { id, name, episode_number, runtime, sources } = episode;
                      return (
                        <div title={id}>
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
                                          // episodeRef.select(episode);
                                          fileRef.select(source);
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
                </div>
                <div class="mt-4 flex w-full pb-4 overflow-x-auto space-x-4">
                  <For each={profile()?.series}>
                    {(season) => {
                      const { id, name, poster_path, air_date } = season;
                      const url = homeTVProfilePage.buildUrlWithPrefix({
                        id,
                      });
                      return (
                        <div>
                          <a href={url} target="_blank">
                            <div>
                              <LazyImage class="w-[120px]" src={poster_path} />
                            </div>
                          </a>
                          <div class="text-xl whitespace-nowrap">{name}</div>
                          <div class="">{air_date}</div>
                        </div>
                      );
                    }}
                  </For>
                </div>
              </div>
            </div>
          </Show>
        </div>
        <div class="h-[120px]"></div>
      </ScrollView>
      <Dialog title="设置电视详情" store={dialog}>
        <div class="w-[520px]">
          <TMDBSearcherView store={searcher} />
        </div>
      </Dialog>
      {/* <Dialog store={profileManualUpdateDialog}>
        <div class="w-[520px]">
          <div class="space-y-4">
            <div class="space-y-1">
              <div>标题</div>
              <Input store={profileTitleInput} />
            </div>
            <div class="space-y-1">
              <div>集数</div>
              <Input store={profileEpisodeCountInput} />
            </div>
          </div>
        </div>
      </Dialog> */}
      <Dialog store={seasonDeletingConfirmDialog}>
        <div class="w-[520px]">
          <div class="text-lg">确认删除「{curSeason()?.name}」吗？</div>
          <div class="mt-4 text-slate-800">
            <div>该仅删除本地索引记录，不影响实际文件</div>
            <div>如需删除云盘文件请到云盘详情页操作</div>
          </div>
        </div>
      </Dialog>
      <Dialog store={fileDeletingConfirmDialog}>
        <div class="w-[520px]">
          <div>该操作仅删除解析结果</div>
          <div>不影响云盘内文件</div>
        </div>
      </Dialog>
      <ContextMenu store={seasonContextMenu} />
    </>
  );
};
