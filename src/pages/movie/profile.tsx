/**
 * @file 电影详情
 */
import { For, Show, createSignal, onMount } from "solid-js";

import { MovieProfile, delete_movie, fetch_movie_profile, update_movie_profile } from "@/services";
import { Button, Dialog, Skeleton, LazyImage, ScrollView } from "@/components/ui";
import { TMDBSearcherDialog } from "@/components/TMDBSearcher/dialog";
import { TMDBSearcherDialogCore } from "@/components/TMDBSearcher/store";
import { DialogCore, ButtonCore, ScrollViewCore } from "@/domains/ui";
import { RequestCore } from "@/domains/client";
import { ViewComponent } from "@/types";
import { appendAction, homeLayout } from "@/store";
import { ArrowLeft } from "lucide-solid";

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
  const movieDeletingBtn = new ButtonCore({
    onClick() {
      movieDeletingConfirmDialog.show();
    },
  });
  const movieDeletingConfirmDialog = new DialogCore({
    title: "删除电影",
    onOk() {
      deleteMovieRequest.run({
        movie_id: view.params.id,
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
        movie_id: view.params.id,
      });
      homeLayout.showPrevView({ destroy: true });
    },
  });
  const movieRefreshDialog = new TMDBSearcherDialogCore({
    type: "2",
    onOk(searched_movie) {
      const id = view.params.id as string;
      if (!id) {
        app.tip({ text: ["更新详情失败", "缺少电视剧 id"] });
        return;
      }
      updateProfileRequest.run(
        { movie_id: id },
        {
          ...searched_movie,
          id: view.params.id,
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

  view.onShow(() => {
    const { id } = view.params;
    profileRequest.run({ movie_id: id });
  });
  onMount(() => {
    const { id } = view.params;
    profileRequest.run({ movie_id: id });
  });

  return (
    <>
      <ScrollView store={scrollView} class="h-screen py-4 px-8">
        <div class="py-2">
          <div
            class="mb-2 cursor-pointer"
            onClick={() => {
              homeLayout.showPrevView({ destroy: true });
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
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div class="relative z-3 mt-4">
                <div class="flex items-center space-x-4">
                  <Button store={movieRefreshDialogShowBtn}>搜索 TMDB</Button>
                  <a href={`https://www.themoviedb.org/movie/${profile()?.tmdb_id}`}>前往 TMDB 页面</a>
                  <Button store={movieDeletingBtn}>删除</Button>
                </div>
                <div class="mt-8 text-2xl">可播放源</div>
                <div class="mt-4 space-y-2">
                  <For each={profile()?.sources}>
                    {(source) => {
                      const { file_name, parent_paths } = source;
                      return (
                        <div class="">
                          <div class="">
                            <div class="">
                              {parent_paths}/{file_name}
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
    </>
  );
};
