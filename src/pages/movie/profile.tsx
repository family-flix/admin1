/**
 * @file 电影详情
 */
import { For, Show, createSignal, onMount } from "solid-js";

import { RequestedResource, ViewComponent } from "@/types";
import { request } from "@/utils/request";
import { Button } from "@/components/ui/button";
import { LazyImage } from "@/components/ui/image";
import { TMDBSearcherDialog } from "@/components/TMDBSearcher/dialog";
import { bind_profile_for_unknown_movie, update_movie_profile } from "@/services";
import { TMDBSearcherDialogCore } from "@/components/TMDBSearcher/store";
import { RequestCore } from "@/domains/client";
import { ButtonCore } from "@/domains/ui/button";
import { ScrollViewCore } from "@/domains/ui/scroll-view";
import { ScrollView } from "@/components/ui/scroll-view";

async function fetch_movie_profile(body: { movie_id: string }) {
  const { movie_id } = body;
  const r = await request.get<{
    id: string;
    name: string;
    overview: string;
    poster_path: null;
    backdrop_path: null;
    original_language: string;
    air_date: string;
    tmdb_id: number;
    sources: {
      file_id: string;
      parent_paths: string;
      file_name: string;
    }[];
  }>(`/api/admin/movie/${movie_id}`);
  return r;
}
type MovieProfile = RequestedResource<typeof fetch_movie_profile>;

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
      dialog.okBtn.setLoading(loading);
    },
    onFailed(error) {
      app.tip({ text: ["更新详情失败", error.message] });
    },
    onSuccess(v) {
      app.tip({ text: ["更新详情成功"] });
      dialog.hide();
      profileRequest.reload();
    },
  });
  const dialog = new TMDBSearcherDialogCore({
    type: "2",
    onOk(searched_tv) {
      const id = view.params.id as string;
      if (!id) {
        app.tip({ text: ["更新详情失败", "缺少电视剧 id"] });
        return;
      }
      updateProfileRequest.run(
        { movie_id: id },
        {
          ...searched_tv,
          id: view.params.id,
          tmdb_id: searched_tv.id,
        }
      );
    },
  });
  const btn1 = new ButtonCore({
    onClick() {
      if (profileRequest.response) {
        dialog.input(profileRequest.response.name);
      }
      dialog.show();
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
      <ScrollView store={scrollView} class="h-screen p-8">
        <div class="">
          <Show when={!!profile()}>
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
                  <Button store={btn1}>搜索 TMDB</Button>
                  <a href={`https://www.themoviedb.org/movie/${profile()?.tmdb_id}`}>前往 TMDB 页面</a>
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
      <TMDBSearcherDialog store={dialog} />
    </>
  );
};
