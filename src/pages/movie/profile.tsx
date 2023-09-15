/**
 * @file 电影详情
 */
import { For, Show, createSignal, onMount } from "solid-js";
import { ArrowLeft, Play, Trash } from "lucide-solid";

import {
  MovieProfile,
  deleteSourceFile,
  delete_movie,
  fetch_movie_profile,
  parse_video_file_name,
  update_movie_profile,
  upload_subtitle_for_movie,
} from "@/services";
import { Button, Dialog, Skeleton, LazyImage, ScrollView, Input } from "@/components/ui";
import { TMDBSearcherDialog, TMDBSearcherDialogCore } from "@/components/TMDBSearcher";
import { DialogCore, ButtonCore, ScrollViewCore, InputCore } from "@/domains/ui";
import { RequestCore } from "@/domains/request";
import { ViewComponent } from "@/types";
import { appendAction, mediaPlayingPage } from "@/store";
import { RefCore } from "@/domains/cur";

export const MovieProfilePage: ViewComponent = (props) => {
  const { app, view } = props;

  const profileRequest = new RequestCore(fetch_movie_profile, {
    onFailed(error) {
      app.tip({ text: ["获取电视剧详情失败", error.message] });
    },
    onSuccess(v) {
      setProfile(v);
    },
  });
  const updateProfileRequest = new RequestCore(update_movie_profile, {
    onLoading(loading) {
      movieRefreshDialog.okBtn.setLoading(loading);
    },
    onFailed(error) {
      app.tip({ text: ["更新详情失败", error.message] });
    },
    onSuccess(v) {
      app.tip({ text: ["更新详情成功"] });
      movieRefreshDialog.hide();
      profileRequest.reload();
    },
  });
  const filenameParseRequest = new RequestCore(parse_video_file_name, {
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
  const sourceDeleteRequest = new RequestCore(deleteSourceFile, {
    onLoading(loading) {
      fileDeletingConfirmDialog.okBtn.setLoading(loading);
    },
    onSuccess() {
      const the_source = sourceRef.value;
      if (!the_source) {
        app.tip({
          text: ["删除成功，请刷新页面"],
        });
        return;
      }
      // curEpisodeList.modifyResponse((response) => {
      //   return {
      //     ...response,
      //     dataSource: response.dataSource.map((episode) => {
      //       if (episode.id !== the_episode.id) {
      //         return episode;
      //       }
      //       return {
      //         ...episode,
      //         sources: episode.sources.filter((source) => {
      //           if (source.id !== the_source.id) {
      //             return true;
      //           }
      //           return false;
      //         }),
      //       };
      //     }),
      //   };
      // });
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
  const subtitleRef = new RefCore<{ drive_id: string; lang: string; file: File }>();
  const sourceRef = new RefCore<{ file_id: string }>();
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
  const movieDeletingBtn = new ButtonCore({
    onClick() {
      movieDeletingConfirmDialog.show();
    },
  });

  const movieDeletingConfirmDialog = new DialogCore({
    title: "删除电影",
    onOk() {
      deleteMovieRequest.run({
        movie_id: view.query.id,
      });
    },
  });
  const deleteMovieRequest = new RequestCore(delete_movie, {
    onLoading(loading) {
      movieDeletingConfirmDialog.okBtn.setLoading(loading);
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
      movieDeletingConfirmDialog.hide();
      appendAction("deleteMovie", {
        movie_id: view.query.id,
      });
      app.back();
      // homeLayout.showPrevView({ destroy: true });
    },
  });
  const fileDeletingConfirmDialog = new DialogCore({
    title: "删除视频源",
    onOk() {
      const theSource = sourceRef.value;
      if (!theSource) {
        app.tip({
          text: ["请先选择要删除的源"],
        });
        return;
      }
      sourceDeleteRequest.run({
        id: theSource.file_id,
      });
    },
  });
  const movieRefreshDialog = new TMDBSearcherDialogCore({
    type: "movie",
    onOk(searched_movie) {
      const id = view.query.id as string;
      if (!id) {
        app.tip({ text: ["更新详情失败", "缺少电影 id"] });
        return;
      }
      updateProfileRequest.run(
        { movie_id: id },
        {
          ...searched_movie,
          id: view.query.id,
          tmdb_id: searched_movie.id,
        }
      );
    },
  });
  const movieRefreshDialogShowBtn = new ButtonCore({
    onClick() {
      if (profileRequest.response) {
        movieRefreshDialog.input(profileRequest.response.name);
      }
      movieRefreshDialog.show();
    },
  });
  const scrollView = new ScrollViewCore();

  const [profile, setProfile] = createSignal<MovieProfile | null>(null);

  onMount(() => {
    const { id } = view.query;
    profileRequest.run({ movie_id: id });
  });

  return (
    <>
      <ScrollView store={scrollView} class="h-screen py-4 px-8">
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
                        <div class="mt-4 space-x-2">
                          <a href={`https://www.themoviedb.org/movie/${profile()?.tmdb_id}`}>TMDB</a>
                        </div>
                        <div class="mt-4 space-x-2">{profile()?.source_size_text}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div class="relative z-3 mt-4">
                <div class="flex items-center space-x-4">
                  <Button store={movieRefreshDialogShowBtn}>修改详情</Button>
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
                                  sourceRef.select(source);
                                  fileDeletingConfirmDialog.show();
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
      <TMDBSearcherDialog store={movieRefreshDialog} />
      <Dialog store={movieDeletingConfirmDialog}>
        <div>
          <div>确认删除吗？</div>
          <div>该操作不删除视频文件</div>
          <div>请仅在需要重新索引关联的文件时进行删除操作</div>
        </div>
      </Dialog>
      <Dialog store={subtitleUploadDialog}>
        <Input store={subtitleUploadInput} />
      </Dialog>
      <Dialog store={fileDeletingConfirmDialog}>
        <div>该操作仅删除解析结果</div>
        <div>不影响云盘内文件</div>
      </Dialog>
    </>
  );
};
