/**
 * @file 电视剧详情
 */
import { For, Show, createSignal, onMount } from "solid-js";
import { ArrowLeft } from "lucide-solid";

import {
  fetch_tv_profile,
  TVProfile,
  refresh_tv_profile,
  fetch_episodes_of_season,
  deleteSeason,
  EpisodeItemInSeason,
  delete_season,
  SeasonInTVProfile,
  parse_video_file_name,
  upload_subtitle_for_episode,
} from "@/services";
import { Button, ContextMenu, ScrollView, Skeleton, Dialog, LazyImage, ListView, Input } from "@/components/ui";
import { TMDBSearcherDialog, TMDBSearcherDialogCore } from "@/components/TMDBSearcher";
import { MenuItemCore, ContextMenuCore, ScrollViewCore, DialogCore, ButtonCore, InputCore } from "@/domains/ui";
import { RequestCore } from "@/domains/request";
import { SelectionCore } from "@/domains/cur";
import { ListCore } from "@/domains/list";
import { createJob, appendAction, rootView, mediaPlayingPage, homeLayout } from "@/store";
import { ViewComponent } from "@/types";
import { cn } from "@/utils";

export const TVProfilePage: ViewComponent = (props) => {
  const { app, view } = props;

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
          tv_id: view.query.id,
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
      const id = view.query.id as string;
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
      refreshProfileRequest.run({ tv_id: view.query.id });
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
        tv_id: view.query.id,
        id: view.query.season_id,
      });
      app.back();
      // homeLayout.showPrevView({ destroy: true });
    },
    onFailed(error) {
      app.tip({
        text: ["删除失败", error.message],
      });
    },
  });
  const uploadRequest = new RequestCore(upload_subtitle_for_episode, {
    onLoading(loading) {
      subtitleUploadDialog.okBtn.setLoading(loading);
    },
    onSuccess() {
      app.tip({
        text: ["字幕上传成功"],
      });
      subtitleUploadDialog.hide();
    },
    onFailed(error) {
      app.tip({
        text: ["字幕上传失败", error.message],
      });
    },
  });
  const filenameParseRequest = new RequestCore(parse_video_file_name);
  const subtitleValues = new SelectionCore<{
    episode_text: string;
    season_text: string;
    drive_id: string;
    lang: string;
    file: File;
  }>();
  const subtitleUploadDialog = new DialogCore({
    title: "上传字幕",
    onOk() {
      if (!subtitleValues.value) {
        app.tip({
          text: ["请先上传字幕文件"],
        });
        return;
      }
      const { drive_id, lang, episode_text, season_text, file } = subtitleValues.value;
      uploadRequest.run({
        tv_id: view.query.id,
        season_text,
        episode_text,
        drive_id,
        lang,
        file,
      });
    },
  });
  const subtitleUploadBtn = new ButtonCore({
    onClick() {
      subtitleUploadDialog.show();
    },
  });
  const subtitleUploadInput = new InputCore({
    defaultValue: [],
    type: "file",
    async onChange(v) {
      const file = v[0];
      if (!file) {
        return;
      }
      if (curEpisodeList.response.dataSource.length === 0) {
        app.tip({
          text: ["请等待详情加载成功"],
        });
        return;
      }
      const { name } = file;
      const r = await filenameParseRequest.run({ name, keys: ["season", "episode", "subtitle_lang"] });
      if (r.error) {
        app.tip({
          text: ["文件名解析失败"],
        });
        return;
      }
      const { subtitle_lang, episode: episode_text, season: season_text } = r.data;
      if (!subtitle_lang) {
        app.tip({
          text: ["文件名中没有解析出字幕语言"],
        });
        return;
      }
      const matched_episode = curEpisodeList.response.dataSource.find((episode) => {
        console.log("[]", episode, episode_text);
        const a = episode.episode_number.match(/[0-9]{1,}/);
        const b = episode_text.match(/[0-9]{1,}/);
        if (!a || !b) {
          return false;
        }
        if (parseInt(a[0]) === parseInt(b[0])) {
          return true;
        }
        return episode.episode_number === episode_text;
      });
      if (!matched_episode) {
        app.tip({
          text: ["文件名中没有解析出集数"],
        });
        return;
      }
      // @todo 还需要判断季是否匹配
      const { sources } = matched_episode;
      if (sources.length === 0) {
        app.tip({
          text: ["没有可播放源"],
        });
        return;
      }
      const reference_id = sources[0].drive.id;
      // 使用 every 方法遍历数组，检查每个元素的 drive.id 是否和参考 id 相同
      const all_ids_equal = sources.every((source) => source.drive.id === reference_id);
      if (!all_ids_equal) {
        app.tip({
          text: ["视频源在多个云盘内，请手动选择上传至哪个云盘"],
        });
        return;
      }
      subtitleValues.select({
        episode_text: matched_episode.episode_number,
        season_text,
        drive_id: reference_id,
        file,
        lang: subtitle_lang,
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
  const [parsedSubtitle, setParsedSubtitle] = createSignal(subtitleValues.value);
  const [curSeason, setCurSeason] = createSignal(curSeasonSelector.value);

  subtitleValues.onStateChange((nextState) => {
    setParsedSubtitle(nextState);
  });
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
    const { id } = view.query;
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
              // homeLayout.showPrevView({ destroy: true });
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
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div class="relative z-3 mt-4">
                <div class="flex items-center space-x-4 whitespace-nowrap">
                  <Button store={btn1}>修改详情</Button>
                  <Button store={refreshProfileBtn}>刷新详情</Button>
                  <Button store={tvDeleteBtn}>删除季</Button>
                  <Button store={subtitleUploadBtn}>上传字幕</Button>
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
                                        mediaPlayingPage.query = {
                                          id: file_id,
                                        };
                                        app.showView(mediaPlayingPage);
                                        // rootView.layerSubView(mediaPlayingPage);
                                        // router.push(`/play/${file_id}`);
                                      }}
                                    >
                                      [{drive.name}]{parent_paths}/{file_name}
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
      <Dialog store={subtitleUploadDialog}>
        <Input store={subtitleUploadInput} />
        <div class="mt-4 space-y-2">
          {/* <div class="flex items-center">
            <div class="w-6">名称</div>
            <div>{parsedSubtitle()?.episode_text}</div>
          </div> */}
          <div class="flex items-center">
            <div class="w-12">季</div>
            <div>{parsedSubtitle()?.season_text}</div>
          </div>
          <div class="flex items-center">
            <div class="w-12">集</div>
            <div>{parsedSubtitle()?.episode_text}</div>
          </div>
          <div class="flex items-center">
            <div class="w-12">语言</div>
            <div>{parsedSubtitle()?.lang}</div>
          </div>
        </div>
      </Dialog>
      <ContextMenu store={seasonContextMenu} />
    </>
  );
};
