/**
 * @file 电影详情
 */
import { For, Show, createSignal, onMount } from "solid-js";
import { ArrowLeft, Play, Trash } from "lucide-solid";

import {
  MovieProfile,
  fetchMovieMediaProfile,
  deleteMedia,
  refreshMediaProfile,
  setMediaProfile,
} from "@/services/media";
import { deleteParsedMediaSource } from "@/services/parsed_media";
import { upload_subtitle_for_movie } from "@/services";
import { Button, Dialog, Skeleton, LazyImage, ScrollView, Input } from "@/components/ui";
import { TMDBSearcherView } from "@/components/TMDBSearcher";
import { DialogCore, ButtonCore, ScrollViewCore, InputCore, ImageCore } from "@/domains/ui";
import { TMDBSearcherCore } from "@/domains/tmdb";
import { RefCore } from "@/domains/cur";
import { parseVideoFilename } from "@/components/FilenameParser/services";
import { RequestCore } from "@/domains/request";
import { ViewComponent } from "@/store/types";
import { appendAction } from "@/store/actions";
import { createJob } from "@/store/job";
import { MediaTypes } from "@/constants";

export const MovieProfilePage: ViewComponent = (props) => {
  const { app, history, view } = props;

  const profileRequest = new RequestCore(fetchMovieMediaProfile, {
    onFailed(error) {
      app.tip({ text: ["获取电视剧详情失败", error.message] });
    },
    onSuccess(v) {
      poster.setURL(v.poster_path);
      setProfile(v);
    },
  });
  const movieProfileChangeRequest = new RequestCore(setMediaProfile, {
    onLoading(loading) {
      movieProfileChangeDialog.okBtn.setLoading(loading);
    },
    onSuccess() {
      app.tip({ text: ["更改详情成功"] });
      movieProfileChangeDialog.hide();
      profileRequest.reload();
    },
    onFailed(error) {
      app.tip({ text: ["更改详情失败", error.message] });
    },
  });
  const filenameParseRequest = new RequestCore(parseVideoFilename, {
    onLoading(loading) {
      subtitleUploadDialog.okBtn.setLoading(loading);
    },
  });
  const uploadRequest = new RequestCore(upload_subtitle_for_movie, {
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
  const sourceDeletingRequest = new RequestCore(deleteParsedMediaSource, {
    onSuccess() {
      const theSource = sourceRef.value;
      if (!theSource) {
        app.tip({
          text: ["删除成功，请刷新页面"],
        });
        return;
      }
      profileRequest.modifyResponse((response) => {
        return {
          ...response,
          sources: response.sources.filter((source) => {
            return source.id !== theSource.id;
          }),
        };
      });
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
  const movieProfileRefreshRequest = new RequestCore(refreshMediaProfile, {
    onSuccess() {
      profileRefreshBtn.setLoading(false);
      app.tip({ text: ["刷新详情成功"] });
      profileRequest.reload();
    },
    onFailed(error) {
      profileRefreshBtn.setLoading(false);
      app.tip({
        text: ["刷新详情失败", error.message],
      });
    },
  });
  const movieDeletingRequest = new RequestCore(deleteMedia, {
    onLoading(loading) {
      movieDeletingConfirmDialog.okBtn.setLoading(loading);
    },
    onSuccess() {
      app.tip({
        text: ["删除成功"],
      });
      movieDeletingConfirmDialog.hide();
      appendAction("deleteMovie", {
        movie_id: view.query.id,
      });
      history.back();
    },
    onFailed(error) {
      app.tip({
        text: ["删除失败", error.message],
      });
    },
  });
  const subtitleRef = new RefCore<{ drive_id: string; lang: string; file: File }>();
  const sourceRef = new RefCore<{ id: string; file_id: string }>();
  const subtitleUploadInput = new InputCore({
    defaultValue: [],
    placeholder: "上传字幕文件",
    type: "file",
    async onChange(v) {
      const file = v[0];
      if (!file) {
        return;
      }
      if (!profileRequest.response) {
        app.tip({
          text: ["请等待详情加载完成"],
        });
        return;
      }
      if (profileRequest.response.sources.length === 0) {
        app.tip({
          text: ["必须包含至少一个视频源"],
        });
        return;
      }
      const { name } = file;
      const r = await filenameParseRequest.run({ name, keys: ["subtitle_lang"] });
      if (r.error) {
        app.tip({
          text: ["文件名解析失败"],
        });
        return;
      }
      const { subtitle_lang } = r.data;
      if (!subtitle_lang) {
        app.tip({
          text: ["文件名中没有解析出字幕语言"],
        });
        return;
      }
      const sources = profileRequest.response.sources;
      const reference_id = sources[0].drive.id;
      // 使用 every 方法遍历数组，检查每个元素的 drive.id 是否和参考 id 相同
      const all_ids_equal = sources.every((source) => source.drive.id === reference_id);
      if (!all_ids_equal) {
        app.tip({
          text: ["视频源在多个云盘内，请手动选择上传至哪个云盘"],
        });
        return;
      }
      subtitleRef.select({
        drive_id: reference_id,
        file,
        lang: subtitle_lang,
      });
    },
  });
  const poster = new ImageCore({});
  const subtitleUploadBtn = new ButtonCore({
    onClick() {
      subtitleUploadDialog.show();
    },
  });
  const subtitleUploadDialog = new DialogCore({
    title: "上传字幕",
    onOk() {
      if (!subtitleRef.value) {
        app.tip({
          text: ["请先上传字幕文件"],
        });
        return;
      }
      const { drive_id, lang, file } = subtitleRef.value;
      uploadRequest.run({
        movie_id: view.query.id,
        drive_id,
        lang,
        file,
      });
    },
  });
  const profileRefreshBtn = new ButtonCore({
    onClick() {
      app.tip({
        text: ["开始刷新"],
      });
      profileRefreshBtn.setLoading(true);
      movieProfileRefreshRequest.run({ media_id: view.query.id });
    },
  });
  const movieDeletingBtn = new ButtonCore({
    onClick() {
      movieDeletingConfirmDialog.show();
    },
  });
  const movieDeletingConfirmDialog = new DialogCore({
    title: "删除电影",
    onOk() {
      movieDeletingRequest.run({
        media_id: view.query.id,
      });
    },
  });
  const searcher = new TMDBSearcherCore({
    type: MediaTypes.Movie,
  });
  const movieProfileChangeDialog = new DialogCore({
    onOk() {
      const id = view.query.id as string;
      if (!id) {
        app.tip({ text: ["更新详情失败", "缺少电影 id"] });
        return;
      }
      const media = searcher.cur;
      if (!media) {
        app.tip({ text: ["请选择详情"] });
        return;
      }
      movieProfileChangeRequest.run({
        media_id: id,
        media_profile: {
          id: String(media.id),
          type: media.type,
          name: media.name,
        },
      });
    },
  });
  const movieProfileChangeBtn = new ButtonCore({
    onClick() {
      if (profileRequest.response) {
        searcher.$input.setValue(profileRequest.response.name);
      }
      movieProfileChangeDialog.show();
    },
  });
  const scrollView = new ScrollViewCore();

  const [profile, setProfile] = createSignal<MovieProfile | null>(null);

  onMount(() => {
    profileRequest.run({ movie_id: view.query.id });
  });

  return (
    <>
      <ScrollView store={scrollView} class="h-screen py-4 px-8">
        <div class="py-2">
          <div
            class="mb-2 cursor-pointer"
            onClick={() => {
              history.back();
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
                        class="overflow-hidden w-[240px] h-[360px] rounded-lg mr-4 object-cover"
                        store={poster}
                        // src={profile()?.poster_path ?? undefined}
                      />
                      <div class="flex-1 mt-4">
                        <h2 class="text-5xl">{profile()?.name}</h2>
                        <div class="mt-6 text-2xl">剧情简介</div>
                        <div class="mt-2">{profile()?.overview}</div>
                        {/* <div class="mt-4 space-x-2">
                          <a href={`https://www.themoviedb.org/movie/${profile()?.tmdb_id}`}>TMDB</a>
                        </div> */}
                        {/* <div class="mt-4 space-x-2">{profile()?.source_size_text}</div> */}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div class="relative z-3 mt-4">
                <div class="flex items-center space-x-4">
                  <Button store={movieProfileChangeBtn}>关联详情</Button>
                  <Button store={profileRefreshBtn}>刷新详情</Button>
                  <Button store={movieDeletingBtn} variant="subtle">
                    删除
                  </Button>
                  <Button store={subtitleUploadBtn} variant="subtle">
                    上传字幕
                  </Button>
                </div>
                <div class="mt-8 text-2xl">可播放源</div>
                <div class="mt-4 space-y-2">
                  <For each={profile()?.sources}>
                    {(source) => {
                      const { id, file_id, file_name, parent_paths, drive } = source;
                      return (
                        <div class="">
                          <div class="flex items-center space-x-4 text-slate-500">
                            <span class="break-all" title={`[${drive.name}]${parent_paths}/${file_name}`}>
                              [{drive.name}]{parent_paths}/{file_name}
                            </span>
                            <div class="flex items-center space-x-2">
                              <div
                                class="p-1 cursor-pointer"
                                title="播放"
                                onClick={() => {
                                  history.push("root.preview", { id });
                                  // mediaPlayingPage.query = {
                                  //   id,
                                  // };
                                  // app.showView(mediaPlayingPage);
                                }}
                              >
                                <Play class="w-4 h-4" />
                              </div>
                              <div
                                class="p-1 cursor-pointer"
                                title="删除源"
                                onClick={() => {
                                  sourceRef.select(source);
                                  sourceDeletingRequest.run({
                                    parsed_media_source_id: id,
                                  });
                                }}
                              >
                                <Trash class="w-4 h-4" />
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    }}
                  </For>
                </div>
              </div>
            </div>
          </Show>
        </div>
      </ScrollView>
      <Dialog store={movieProfileChangeDialog}>
        <div class="w-[520px]">
          <TMDBSearcherView store={searcher} />
        </div>
      </Dialog>
      <Dialog store={movieDeletingConfirmDialog}>
        <div class="w-[520px]">
          <div>确认删除吗？</div>
          <div>该操作不删除视频文件</div>
          <div>请仅在需要重新索引关联的文件时进行删除操作</div>
        </div>
      </Dialog>
      <Dialog store={subtitleUploadDialog}>
        <div class="w-[520px]">
          <Input store={subtitleUploadInput} />
        </div>
      </Dialog>
    </>
  );
};
